"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, Loader2, Play, Save, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OutreachCampaignConfig } from "@/lib/outreach/campaign";

import {
  previewCandidateCount,
  runCampaignNow,
  saveCampaignConfig,
} from "./_actions";

interface Props {
  initial: OutreachCampaignConfig;
}

const PLACEHOLDERS = [
  "{{company_name}}",
  "{{contact_name}}",
  "{{contact_first_name}}",
  "{{kommune}}",
  "{{region}}",
  "{{org_nr}}",
  "{{site_url}}",
];

/**
 * Cheap deliverability lints. None of these are deal-breakers, they're
 * just signals that get flagged by Bayesian spam filters. We surface
 * them inline so the operator can tweak before sending.
 */
function lintSubject(value: string): string[] {
  const w: string[] = [];
  // Mobile mail apps truncate around 40-50 chars; >78 starts to get spam-scored.
  if (value.length > 50) {
    w.push(`${value.length} characters — gets truncated on mobile around 50`);
  }
  if (value.length > 78) {
    w.push("Very long subjects get spam-scored — aim for under 60");
  }
  if (/[!?]{2,}/.test(value) || /\?{2,}/.test(value)) {
    w.push("Repeated punctuation (??!!) reads as spammy");
  }
  // Words rendered ALL CAPS (excluding placeholders + acronyms ≤ 3 chars).
  const stripped = value.replace(/\{\{[^}]+\}\}/g, "");
  const upperWords = stripped
    .split(/\s+/)
    .filter((w) => w.length >= 4 && w === w.toUpperCase() && /[A-ZÆØÅ]/.test(w));
  if (upperWords.length > 0) {
    w.push(`ALL-CAPS word: "${upperWords[0]}" — looks shouty`);
  }
  return w;
}

function lintBody(value: string): string[] {
  const w: string[] = [];
  // Count http(s) links in the operator-written body. The auto-appended
  // unsubscribe URL doesn't count — it's added at send time.
  const links = value.match(/https?:\/\/\S+/g) ?? [];
  if (links.length > 2) {
    w.push(`${links.length} links — 1-2 max for cold outreach`);
  }
  // Sentence-case the {{company_name}} placeholder if the operator
  // typed it all caps in their template (rare but possible).
  if (/\b(GUARANTEE|FREE!|CLICK HERE|ACT NOW|LIMITED TIME)\b/i.test(value)) {
    w.push("Trigger phrase detected (FREE / GUARANTEE / CLICK HERE)");
  }
  if (value.length < 80) {
    w.push("Very short body — recipients may flag as suspicious");
  }
  if (value.length > 1500) {
    w.push("Long body — cold outreach above 1500 chars rarely converts");
  }
  return w;
}

export function CampaignTab({ initial }: Props) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);
  const [minScore, setMinScore] = useState(String(initial.minScore));
  const [maxPerDay, setMaxPerDay] = useState(String(initial.maxPerDay));
  const [allowedOrgForms, setAllowedOrgForms] = useState(
    initial.allowedOrgForms.join("\n")
  );
  const [excludedNacePrefixes, setExcludedNacePrefixes] = useState(
    initial.excludedNacePrefixes.join("\n")
  );
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const [savePending, startSave] = useTransition();
  const [previewPending, startPreview] = useTransition();
  const [runPending, startRun] = useTransition();

  const subjectWarnings = useMemo(() => lintSubject(subject), [subject]);
  const bodyWarnings = useMemo(() => lintBody(body), [body]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startSave(async () => {
      const result = await saveCampaignConfig(fd);
      if (result.ok) toast.success(result.message ?? "Saved");
      else toast.error(result.error);
    });
  }

  function onPreview() {
    startPreview(async () => {
      const result = await previewCandidateCount();
      if (result.ok) {
        setPreviewCount(result.data?.count ?? 0);
      } else {
        toast.error(result.error);
      }
    });
  }

  function onRunNow() {
    if (!confirm(
      `Send the campaign now to up to ${maxPerDay} matching leads?`
    )) {
      return;
    }
    startRun(async () => {
      const result = await runCampaignNow();
      if (result.ok) {
        toast.success(result.message ?? "Sent");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Daily outreach</CardTitle>
              <CardDescription>
                Runs automatically at 08:00 UTC. Set the filters + email below,
                save, then preview the count before turning it on.
              </CardDescription>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="enabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-input"
              />
              <span className="font-medium">
                {enabled ? "Enabled" : "Disabled"}
              </span>
            </label>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Who gets emailed</CardTitle>
            <CardDescription>
              Filters applied on top of status = &apos;new&apos;. Already-emailed
              leads are skipped automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="min_score" className="text-xs">
                  Min score
                </Label>
                <Input
                  id="min_score"
                  name="min_score"
                  type="number"
                  min={0}
                  max={100}
                  value={minScore}
                  onChange={(e) => setMinScore(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max_per_day" className="text-xs">
                  Max sends / day
                </Label>
                <Input
                  id="max_per_day"
                  name="max_per_day"
                  type="number"
                  min={0}
                  max={1000}
                  value={maxPerDay}
                  onChange={(e) => setMaxPerDay(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="allowed_org_forms" className="text-xs">
                Allowed org forms
              </Label>
              <textarea
                id="allowed_org_forms"
                name="allowed_org_forms"
                rows={3}
                value={allowedOrgForms}
                onChange={(e) => setAllowedOrgForms(e.target.value)}
                placeholder={"AS\nASA\nENK"}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring resize-none font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                One code per line. Leave empty to allow all org forms.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="excluded_nace_prefixes"
                className="text-xs"
              >
                Excluded NACE prefixes
              </Label>
              <textarea
                id="excluded_nace_prefixes"
                name="excluded_nace_prefixes"
                rows={3}
                value={excludedNacePrefixes}
                onChange={(e) => setExcludedNacePrefixes(e.target.value)}
                placeholder={"01.\n02.\n84."}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring resize-none font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Skip any lead whose NACE code starts with these. Useful for
                agriculture (01.), forestry (02.), public admin (84.) etc.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email content</CardTitle>
            <CardDescription>
              Placeholders are replaced per lead at send time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="subject" className="text-xs">
                Subject
              </Label>
              <Input
                id="subject"
                name="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
              <LintList warnings={subjectWarnings} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body" className="text-xs">
                Body
              </Label>
              <textarea
                id="body"
                name="body"
                rows={12}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring resize-y font-mono"
              />
              <div className="flex flex-wrap gap-1.5">
                {PLACEHOLDERS.map((p) => (
                  <code
                    key={p}
                    className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {p}
                  </code>
                ))}
              </div>
              <LintList warnings={bodyWarnings} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="sticky bottom-4 z-10">
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3 text-sm">
              <Button
                type="button"
                variant="outline"
                onClick={onPreview}
                disabled={previewPending}
              >
                {previewPending ? <Loader2 className="animate-spin" /> : <Search />}
                Preview matches
              </Button>
              {previewCount !== null ? (
                <span className="text-muted-foreground">
                  <span className="font-medium tabular-nums text-foreground">
                    {previewCount}
                  </span>{" "}
                  lead{previewCount === 1 ? "" : "s"} match — capped at{" "}
                  <span className="font-medium tabular-nums text-foreground">
                    {maxPerDay}
                  </span>
                  /day
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={onRunNow}
                disabled={runPending}
              >
                {runPending ? <Loader2 className="animate-spin" /> : <Play />}
                Run now
              </Button>
              <Button type="submit" disabled={savePending}>
                {savePending ? <Loader2 className="animate-spin" /> : <Save />}
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

function LintList({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <ul className="space-y-1 pt-1">
      {warnings.map((w, i) => (
        <li
          key={i}
          className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400"
        >
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          <span>{w}</span>
        </li>
      ))}
    </ul>
  );
}
