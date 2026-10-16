import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import type { Database } from "./types";

/**
 * Data layer on Cloudflare D1 (SQLite).
 *
 * Keeps the small query-builder API the app was written against when it ran
 * on Supabase (from/select/eq/insert/upsert/…), typed against `Database`, so
 * callers read the same as before but every call becomes plain SQL on D1.
 *
 * Supported: select (with count / head), insert, upsert (onConflict,
 * ignoreDuplicates, count), update, delete, eq, neq, gt, gte, lt, lte, in,
 * is(null), not(col, "is", null), like, ilike, `or` of eq / is.null /
 * not.is.null terms, order, limit, range, single, maybeSingle. Anything else
 * is a programming error and throws.
 *
 * Results follow the PostgREST contract: `{ data, error, count }`, never a
 * thrown database error. SQLite errors map to the Postgres codes the app
 * already checks (23505 unique, 23503 foreign key, …).
 *
 * Storage conventions: booleans are 0/1, JSON columns are JSON text,
 * timestamps are ISO-8601 UTC strings (`…Z`), dates are `YYYY-MM-DD`. ISO
 * strings compare correctly as text, so range filters work unchanged.
 */

type D1Result<T> = { results: T[]; meta?: { changes?: number } };
type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<D1Result<T>>;
  run(): Promise<D1Result<unknown>>;
};
export type D1 = {
  prepare(query: string): D1Statement;
  batch<T>(statements: D1Statement[]): Promise<D1Result<T>[]>;
};

type Tables = Database["public"]["Tables"];
export type TableName = keyof Tables;
type RowOf<K extends TableName> = Tables[K]["Row"];
type InsertOf<K extends TableName> = Tables[K]["Insert"];
type UpdateOf<K extends TableName> = Tables[K]["Update"];

export function d1(): D1 {
  const env = getCloudflareContext().env as unknown as { DB?: D1 };
  if (!env.DB) throw new Error("D1 binding DB is missing (wrangler.jsonc d1_databases).");
  return env.DB;
}

/** Columns stored as 0/1 in SQLite, converted back to booleans on read. */
const BOOLEAN_COLUMNS: Partial<Record<TableName, string[]>> = {
  companies: ["vat_registered", "bankrupt", "under_dissolution", "forced_dissolution"],
  flows: ["enabled"],
  generated_sites: ["niche_overridden"],
};

/** Columns stored as JSON text, parsed on read. Every value is JSON-encoded on write, strings included. */
const JSON_COLUMNS: Partial<Record<TableName, string[]>> = {
  companies: ["score_breakdown", "raw_data"],
  audit_log: ["metadata"],
  settings: ["value"],
  outreach_emails: ["references_chain", "attachments"],
  generated_sites: ["content_json"],
};

/** Primary keys that are not `id`, the default conflict target of an upsert (as PostgREST did). */
const PRIMARY_KEYS: Partial<Record<TableName, string>> = {
  companies: "org_nr",
  settings: "key",
  outreach_suppressions: "email",
  generated_sites: "org_nr",
};

export type DbError = { code: string; message: string };
export type DbResult<T> =
  | { data: T; error: null; count: number | null }
  | { data: null; error: DbError; count: null };

const IDENTIFIER = /^[a-z_][a-z0-9_]*$/;

function identifier(name: string): string {
  const trimmed = name.trim();
  if (!IDENTIFIER.test(trimmed)) throw new Error(`Invalid column or table name: ${name}`);
  return trimmed;
}

function columnList(columns: string): string {
  if (columns.trim() === "*") return "*";
  return columns.split(",").map(identifier).join(", ");
}

export function dbError(cause: unknown): DbError {
  const message = cause instanceof Error ? cause.message : String(cause);
  if (/UNIQUE constraint failed/i.test(message)) return { code: "23505", message };
  if (/FOREIGN KEY constraint failed/i.test(message)) return { code: "23503", message };
  if (/no such column|has no column named/i.test(message)) return { code: "42703", message };
  if (/no such table/i.test(message)) return { code: "42P01", message };
  if (/CHECK constraint failed/i.test(message)) return { code: "23514", message };
  return { code: "D1_ERROR", message };
}

type Filter = { sql: string; params: unknown[] };
type Operation = "select" | "insert" | "upsert" | "update" | "delete";
// Rows are plain objects; the typed surface lives on the public methods.
type AnyRow = Record<string, unknown>;

export class Query<K extends TableName, D> implements PromiseLike<DbResult<D>> {
  private operation: Operation = "select";
  private columns = "*";
  private returning: string | null = null;
  private countOnly = false;
  private withCount = false;
  private filters: Filter[] = [];
  private orders: string[] = [];
  private limitCount: number | null = null;
  private offsetCount = 0;
  private mode: "many" | "single" | "maybeSingle" = "many";
  private rows: AnyRow[] = [];
  private values: AnyRow = {};
  private conflict: string;
  private ignoreDuplicates = false;

  constructor(private readonly table: K) {
    identifier(table);
    this.conflict = PRIMARY_KEYS[table] ?? "id";
  }

  private toSql(column: string, value: unknown): unknown {
    if (value === undefined) return null;
    const jsonColumns: string[] = JSON_COLUMNS[this.table] ?? [];
    if (jsonColumns.includes(column)) {
      return value === null ? null : JSON.stringify(value);
    }
    if (typeof value === "boolean") return value ? 1 : 0;
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value) || (value && typeof value === "object")) return JSON.stringify(value);
    return value;
  }

  private fromSql(row: AnyRow): AnyRow {
    const out: AnyRow = { ...row };
    for (const column of BOOLEAN_COLUMNS[this.table] ?? []) {
      if (column in out && out[column] !== null) out[column] = Boolean(out[column]);
    }
    for (const column of JSON_COLUMNS[this.table] ?? []) {
      if (typeof out[column] === "string") {
        try {
          out[column] = JSON.parse(out[column] as string);
        } catch {
          // Leave unparseable text as-is rather than dropping data.
        }
      }
    }
    return out;
  }

  select(columns = "*", options?: { count?: "exact"; head?: boolean }): Query<K, RowOf<K>[]> {
    if (this.operation === "select") {
      this.columns = columnList(columns);
      this.withCount = options?.count === "exact";
      this.countOnly = Boolean(options?.head);
    } else {
      this.returning = columnList(columns);
    }
    return this as unknown as Query<K, RowOf<K>[]>;
  }

  insert(rows: InsertOf<K> | InsertOf<K>[], options?: { count?: "exact" }): Query<K, null> {
    this.operation = "insert";
    this.rows = (Array.isArray(rows) ? rows : [rows]) as AnyRow[];
    this.withCount = options?.count === "exact";
    return this as unknown as Query<K, null>;
  }

  upsert(
    rows: InsertOf<K> | InsertOf<K>[],
    options?: { onConflict?: string; ignoreDuplicates?: boolean; count?: "exact" }
  ): Query<K, null> {
    this.operation = "upsert";
    this.rows = (Array.isArray(rows) ? rows : [rows]) as AnyRow[];
    if (options?.onConflict) this.conflict = options.onConflict;
    this.ignoreDuplicates = Boolean(options?.ignoreDuplicates);
    this.withCount = options?.count === "exact";
    return this as unknown as Query<K, null>;
  }

  update(values: UpdateOf<K>): Query<K, null> {
    this.operation = "update";
    this.values = values as AnyRow;
    return this as unknown as Query<K, null>;
  }

  delete(): Query<K, null> {
    this.operation = "delete";
    return this as unknown as Query<K, null>;
  }

  private compare(column: string, op: string, value: unknown): this {
    const name = identifier(column);
    this.filters.push({ sql: `${name} ${op} ?`, params: [this.toSql(name, value)] });
    return this;
  }

  eq(column: keyof RowOf<K> & string, value: unknown): this {
    if (value === null) return this.is(column, null);
    return this.compare(column, "=", value);
  }

  neq(column: keyof RowOf<K> & string, value: unknown): this {
    if (value === null) return this.not(column, "is", null);
    return this.compare(column, "<>", value);
  }

  gt(column: keyof RowOf<K> & string, value: unknown): this {
    return this.compare(column, ">", value);
  }

  gte(column: keyof RowOf<K> & string, value: unknown): this {
    return this.compare(column, ">=", value);
  }

  lt(column: keyof RowOf<K> & string, value: unknown): this {
    return this.compare(column, "<", value);
  }

  lte(column: keyof RowOf<K> & string, value: unknown): this {
    return this.compare(column, "<=", value);
  }

  /** Bound as one JSON parameter, so long lists don't hit D1's 100-parameter cap. */
  in(column: keyof RowOf<K> & string, values: readonly unknown[]): this {
    const name = identifier(column);
    this.filters.push(
      values.length
        ? { sql: `${name} in (select value from json_each(?))`, params: [JSON.stringify(values)] }
        : { sql: "0", params: [] }
    );
    return this;
  }

  is(column: keyof RowOf<K> & string, value: null): this {
    if (value !== null) throw new Error("is() only supports null");
    this.filters.push({ sql: `${identifier(column)} is null`, params: [] });
    return this;
  }

  not(column: keyof RowOf<K> & string, operator: "is", value: null): this {
    if (operator !== "is" || value !== null) throw new Error("not() only supports (col, 'is', null)");
    this.filters.push({ sql: `${identifier(column)} is not null`, params: [] });
    return this;
  }

  like(column: keyof RowOf<K> & string, pattern: string): this {
    this.filters.push({ sql: `${identifier(column)} like ?`, params: [pattern] });
    return this;
  }

  /** Case-insensitive like. SQLite's lower() only folds ASCII, so æ/ø/å match case-sensitively. */
  ilike(column: keyof RowOf<K> & string, pattern: string): this {
    this.filters.push({ sql: `lower(${identifier(column)}) like lower(?)`, params: [pattern] });
    return this;
  }

  /** Comma-separated `col.eq.value`, `col.is.null` and `col.not.is.null` terms, OR-ed together. */
  or(expression: string): this {
    const terms = expression.split(",").map((term): Filter => {
      const parts = term.trim().split(".");
      const column = identifier(parts[0] ?? "");
      const rest = parts.slice(1).join(".");
      if (rest === "is.null") return { sql: `${column} is null`, params: [] };
      if (rest === "not.is.null") return { sql: `${column} is not null`, params: [] };
      if (parts[1] === "eq") return { sql: `${column} = ?`, params: [parts.slice(2).join(".")] };
      throw new Error(`Unsupported or() term: ${term}`);
    });
    this.filters.push({
      sql: `(${terms.map((t) => t.sql).join(" or ")})`,
      params: terms.flatMap((t) => t.params),
    });
    return this;
  }

  order(column: keyof RowOf<K> & string, options?: { ascending?: boolean; nullsFirst?: boolean }): this {
    const name = identifier(column);
    const dir = options?.ascending === false ? "desc" : "asc";
    // Postgres default: nulls last for asc, nulls first for desc.
    const nullsFirst = options?.nullsFirst ?? dir === "desc";
    this.orders.push(`${name} ${dir} nulls ${nullsFirst ? "first" : "last"}`);
    return this;
  }

  limit(count: number): this {
    this.limitCount = Math.max(0, Math.floor(count));
    return this;
  }

  /** Inclusive row range, like PostgREST. */
  range(from: number, to: number): this {
    this.offsetCount = Math.max(0, Math.floor(from));
    this.limitCount = Math.max(0, Math.floor(to) - this.offsetCount + 1);
    return this;
  }

  single<T = RowOf<K>>(): Query<K, T> {
    this.mode = "single";
    return this as unknown as Query<K, T>;
  }

  maybeSingle<T = RowOf<K>>(): Query<K, T | null> {
    this.mode = "maybeSingle";
    return this as unknown as Query<K, T | null>;
  }

  then<A = DbResult<D>, B = never>(
    onFulfilled?: ((value: DbResult<D>) => A | PromiseLike<A>) | null,
    onRejected?: ((reason: unknown) => B | PromiseLike<B>) | null
  ): PromiseLike<A | B> {
    return this.run().then(onFulfilled, onRejected);
  }

  private where(): Filter {
    if (!this.filters.length) return { sql: "", params: [] };
    return {
      sql: ` where ${this.filters.map((f) => f.sql).join(" and ")}`,
      params: this.filters.flatMap((f) => f.params),
    };
  }

  private async run(): Promise<DbResult<D>> {
    try {
      return this.shape(await this.execute());
    } catch (cause) {
      return { data: null, error: dbError(cause), count: null };
    }
  }

  private shape(result: { rows: AnyRow[]; count: number | null }): DbResult<D> {
    const rows = result.rows.map((row) => this.fromSql(row));
    if (this.mode === "many") {
      const data = this.operation !== "select" && !this.returning ? null : rows;
      return { data: data as D, error: null, count: result.count };
    }
    if (rows.length > 1) {
      return { data: null, error: { code: "PGRST116", message: "More than one row returned." }, count: null };
    }
    if (!rows.length && this.mode === "single") {
      return { data: null, error: { code: "PGRST116", message: "No rows returned." }, count: null };
    }
    return { data: (rows[0] ?? null) as D, error: null, count: result.count };
  }

  private async execute(): Promise<{ rows: AnyRow[]; count: number | null }> {
    const db = d1();
    const where = this.where();
    const returning = this.returning ? ` returning ${this.returning}` : "";

    if (this.operation === "select") {
      let count: number | null = null;
      if (this.withCount) {
        const counted = await db
          .prepare(`select count(*) as count from ${this.table}${where.sql}`)
          .bind(...where.params)
          .first<{ count: number }>();
        count = counted?.count ?? 0;
        if (this.countOnly) return { rows: [], count };
      }
      const order = this.orders.length ? ` order by ${this.orders.join(", ")}` : "";
      const limitValue = this.limitCount ?? (this.mode !== "many" ? 2 : null);
      const limit =
        limitValue !== null
          ? ` limit ${limitValue}${this.offsetCount ? ` offset ${this.offsetCount}` : ""}`
          : this.offsetCount
            ? ` limit -1 offset ${this.offsetCount}`
            : "";
      const { results } = await db
        .prepare(`select ${this.columns} from ${this.table}${where.sql}${order}${limit}`)
        .bind(...where.params)
        .all<AnyRow>();
      return { rows: results ?? [], count };
    }

    if (this.operation === "update") {
      const entries = Object.entries(this.values).filter(([, v]) => v !== undefined);
      if (!entries.length) return { rows: [], count: null };
      const sets = entries.map(([c]) => `${identifier(c)} = ?`).join(", ");
      const { results } = await db
        .prepare(`update ${this.table} set ${sets}${where.sql}${returning}`)
        .bind(...entries.map(([c, v]) => this.toSql(c, v)), ...where.params)
        .all<AnyRow>();
      return { rows: results ?? [], count: null };
    }

    if (this.operation === "delete") {
      const { results } = await db
        .prepare(`delete from ${this.table}${where.sql}${returning}`)
        .bind(...where.params)
        .all<AnyRow>();
      return { rows: results ?? [], count: null };
    }

    // insert / upsert: one statement per row, run as one atomic batch.
    if (!this.rows.length) return { rows: [], count: this.withCount ? 0 : null };
    const conflictColumns = this.conflict.split(",").map(identifier);
    const statements = this.rows.map((row) => {
      const entries = Object.entries(row).filter(([, v]) => v !== undefined);
      const columns = entries.map(([c]) => identifier(c));
      let sql = `insert into ${this.table} (${columns.join(", ")}) values (${columns.map(() => "?").join(", ")})`;
      if (this.operation === "upsert") {
        const updates = columns.filter((c) => !conflictColumns.includes(c));
        sql +=
          this.ignoreDuplicates || !updates.length
            ? ` on conflict (${conflictColumns.join(", ")}) do nothing`
            : ` on conflict (${conflictColumns.join(", ")}) do update set ${updates.map((c) => `${c} = excluded.${c}`).join(", ")}`;
      }
      return db.prepare(`${sql}${returning}`).bind(...entries.map(([c, v]) => this.toSql(c, v)));
    });
    const results = await db.batch<AnyRow>(statements);
    // `changes` counts rows actually written, so ignoreDuplicates skips aren't counted (as Postgres did).
    const count = this.withCount ? results.reduce((n, r) => n + (r.meta?.changes ?? 0), 0) : null;
    return { rows: results.flatMap((r) => r.results ?? []), count };
  }
}

export type Db = { from<K extends TableName>(table: K): Query<K, RowOf<K>[]> };

export function getDb(): Db {
  return { from: (table) => new Query(table) };
}
