#!/usr/bin/env node
// One-time move from Vercel + Supabase to Cloudflare Workers + D1.
//
//   node scripts/move-from-vercel.mjs
//
// 1. Pulls the production env vars of the Vercel project `demo` to a temp file.
// 2. Exports every table from Supabase (REST, service role, read-only) into
//    data-export/import.sql, converted to the D1 conventions in lib/db/index.ts.
// 3. Copies the secrets the Worker needs into Cloudflare (`wrangler secret bulk`).
// 4. Deletes the temp env file.
//
// It never writes to Supabase. Run it yourself: it handles credentials, and
// data-export/ holds customer data (gitignored). Afterwards, import with
//   npx wrangler d1 execute vekst-demo --remote --file data-export/import.sql

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const SCOPE = "xander-dijkstras-projects";
const ENV_FILE = join(tmpdir(), `vekst-demo-env-${Date.now()}.env`);

// Insert order respects foreign keys.
const TABLES = [
  "companies",
  "email_threads",
  "outreach_emails",
  "outreach_suppressions",
  "generated_sites",
  "deals",
  "flows",
  "flow_runs",
  "flow_enrollments",
  "settings",
  "scrape_runs",
  "audit_log",
];
const ORDER_KEY = { companies: "org_nr", settings: "key", outreach_suppressions: "email", generated_sites: "org_nr" };
const BOOLEAN = {
  companies: ["vat_registered", "bankrupt", "under_dissolution", "forced_dissolution"],
  flows: ["enabled"],
  generated_sites: ["niche_overridden"],
};
const JSON_COLS = {
  companies: ["score_breakdown", "raw_data"],
  audit_log: ["metadata"],
  settings: ["value"],
  outreach_emails: ["references_chain", "attachments"],
  generated_sites: ["content_json"],
};
// Secrets the Worker reads (everything else in the Vercel env is Supabase/Vercel/Postmark-only).
const SECRETS = [
  "RESEND_API_KEY",
  "RESEND_WEBHOOK_SECRET",
  "UNSUBSCRIBE_SECRET",
  "CRON_SECRET",
  "ANTHROPIC_API_KEY",
  "ONE1881_API_KEY",
  "FREEPIK_API_KEY",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
];

const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { cwd: ROOT, stdio: ["pipe", "pipe", "inherit"], shell: process.platform === "win32", ...opts });

function parseEnv(text) {
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[m[1]] = v.replace(/\\n/g, "\n");
  }
  return env;
}

/** Column names per table, read from the D1 schema so the export can't drift from it. */
function schemaColumns() {
  const sql = readFileSync(join(ROOT, "migrations", "0001_init.sql"), "utf8");
  const cols = {};
  for (const m of sql.matchAll(/create table (\w+) \(([\s\S]*?)\n\);/g)) {
    cols[m[1]] = [...m[2].matchAll(/^\s{2}([a-z_]+) (text|integer)/gm)].map((c) => c[1]);
  }
  return cols;
}

function literal(table, column, value) {
  if (value === null || value === undefined) return "null";
  if ((JSON_COLS[table] ?? []).includes(column)) return quote(JSON.stringify(value));
  if ((BOOLEAN[table] ?? []).includes(column)) return value ? "1" : "0";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "object") return quote(JSON.stringify(value));
  // timestamptz → ISO UTC with ms (same format the app writes); plain dates stay as-is.
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return quote(d.toISOString());
  }
  return quote(String(value));
}

const quote = (s) => `'${s.replace(/'/g, "''")}'`;

async function fetchAll(url, key, table) {
  const rows = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    // Stable order is required: unordered pages overlap and silently skip rows.
    const res = await fetch(`${url}/rest/v1/${table}?select=*&order=${ORDER_KEY[table] ?? "id"}.asc`, {
      headers: { apikey: key, authorization: `Bearer ${key}`, range: `${from}-${from + page - 1}`, "range-unit": "items" },
    });
    if (res.status === 404) {
      console.warn(`  ${table}: not in Supabase, skipped`);
      return rows;
    }
    if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < page) return rows;
  }
}

async function main() {
  console.log("1/4 Pulling Vercel production env (temp file)…");
  run("npx", ["vercel", "link", "--yes", "--project", "demo", "--scope", SCOPE], { stdio: "ignore" });
  run("npx", ["vercel", "env", "pull", ENV_FILE, "--environment=production", "--yes", "--scope", SCOPE], { stdio: "ignore" });
  // .env.migrate (optional, gitignored) fills in values Vercel won't hand out (sensitive vars).
  const extra = existsSync(join(ROOT, ".env.migrate")) ? parseEnv(readFileSync(join(ROOT, ".env.migrate"), "utf8")) : {};
  const pulled = parseEnv(readFileSync(ENV_FILE, "utf8"));
  const env = { ...pulled, ...Object.fromEntries(Object.entries(extra).filter(([, v]) => v)) };

  try {
    const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase URL / service role key not in the Vercel env (sensitive vars can't be pulled). Add them to .env.migrate and re-run.");
    console.log(`2/4 Exporting Supabase (${new URL(url).hostname.split(".")[0]})…`);

    const columns = schemaColumns();
    const out = ["PRAGMA defer_foreign_keys = on;"];
    const counts = {};
    for (const table of TABLES) {
      const rows = await fetchAll(url, key, table);
      counts[table] = rows.length;
      const keyOf = (r) => r[ORDER_KEY[table] ?? "id"];
      if (new Set(rows.map(keyOf)).size !== rows.length) throw new Error(`${table}: duplicate keys in export, aborting`);
      const allowed = columns[table];
      const dropped = new Set();
      for (const row of rows) {
        const cols = Object.keys(row).filter((c) => (allowed.includes(c) ? true : (dropped.add(c), false)));
        out.push(
          `insert or replace into ${table} (${cols.join(", ")}) values (${cols.map((c) => literal(table, c, row[c])).join(", ")});`
        );
      }
      console.log(`  ${table}: ${rows.length} rows${dropped.size ? ` (columns not in D1, dropped: ${[...dropped].join(", ")})` : ""}`);
    }
    mkdirSync(join(ROOT, "data-export"), { recursive: true });
    writeFileSync(join(ROOT, "data-export", "import.sql"), out.join("\n") + "\n");
    writeFileSync(join(ROOT, "data-export", "counts.json"), JSON.stringify(counts, null, 2) + "\n");

    console.log("3/4 Copying secrets to the Worker…");
    const secrets = {};
    const missing = [];
    for (const name of SECRETS) {
      if (env[name]) secrets[name] = env[name];
      else missing.push(name);
    }
    if (!secrets.CRON_SECRET) {
      secrets.CRON_SECRET = randomBytes(32).toString("hex");
      missing.splice(missing.indexOf("CRON_SECRET"), 1);
      console.log("  CRON_SECRET: not in Vercel, generated a new one");
    }
    run("npx", ["wrangler", "secret", "bulk"], { input: JSON.stringify(secrets), stdio: ["pipe", "ignore", "inherit"] });
    console.log(`  set: ${Object.keys(secrets).join(", ")}`);
    if (missing.length) console.log(`  NOT set (empty or sensitive in Vercel — set with \`npx wrangler secret put <NAME>\` if used): ${missing.join(", ")}`);
  } finally {
    rmSync(ENV_FILE, { force: true });
    console.log("4/4 Temp env file deleted.");
  }
  console.log("\nDone. Data is in data-export/import.sql (gitignored). Tell Claude it finished.");
}

main().catch((err) => {
  rmSync(ENV_FILE, { force: true });
  console.error("\nFailed:", err.message);
  process.exit(1);
});
