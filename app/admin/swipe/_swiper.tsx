"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import {
  ArrowUp,
  ArrowUpRight,
  Building2,
  Check,
  ExternalLink,
  Globe,
  Handshake,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Smartphone,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { ScoreBadge } from "@/components/admin/score-badge";
import { Button } from "@/components/ui/button";
import { SCORE_LABELS_NB } from "@/lib/scoring";
import type { Company, ScoringWeights } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

import {
  swipeQualify,
  swipeReject,
  swipeReview,
  swipeToCrm,
} from "./_actions";

interface Props {
  leads: Company[];
}

type Action = "reject" | "review" | "qualify" | "crm";

const ACTION_DIRECTION: Record<Action, "left" | "right" | "up" | "down"> = {
  reject: "left",
  review: "up",
  qualify: "right",
  crm: "down",
};

function formatDate(value: string | null): string {
  if (!value) return "–";
  try {
    return format(new Date(value), "d. MMM yyyy", { locale: nb });
  } catch {
    return value;
  }
}

export function Swiper({ leads }: Props) {
  const [index, setIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const [exiting, setExiting] = useState<Action | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = leads[index] ?? null;
  const total = leads.length;
  const remaining = Math.max(0, total - index);

  const handleAction = useCallback(
    (action: Action) => {
      if (pending || !current) return;

      setExiting(action);
      const orgNr = current.org_nr;

      startTransition(async () => {
        const fn =
          action === "reject"
            ? swipeReject
            : action === "review"
              ? swipeReview
              : action === "qualify"
                ? swipeQualify
                : swipeToCrm;

        const result = await fn(orgNr);
        if (!result.ok) {
          toast.error(result.error);
          setExiting(null);
          return;
        }

        const msg =
          action === "reject"
            ? "Rejected"
            : action === "review"
              ? "Marked as reviewed"
              : action === "qualify"
                ? "Qualified"
                : "Sent to CRM";
        toast.success(msg, { duration: 1200 });

        // Wait for the exit animation, then advance.
        advanceTimer.current = setTimeout(() => {
          setIndex((i) => i + 1);
          setExiting(null);
        }, 220);
      });
    },
    [current, pending]
  );

  useEffect(() => {
    if (!current) return;
    function onKey(e: KeyboardEvent) {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleAction("reject");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleAction("qualify");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        handleAction("review");
      } else if (e.key === "ArrowDown" || e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleAction("crm");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, handleAction]);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  if (total === 0) {
    return <EmptyQueue />;
  }

  if (!current) {
    return <DoneState total={total} />;
  }

  const direction = exiting ? ACTION_DIRECTION[exiting] : null;
  const exitTransform: Record<
    "left" | "right" | "up" | "down",
    string
  > = {
    left: "translate-x-[-120%] rotate-[-8deg]",
    right: "translate-x-[120%] rotate-[8deg]",
    up: "translate-y-[-120%]",
    down: "translate-y-[120%]",
  };

  return (
    <div className="flex h-full flex-col">
      {/* Progress strip */}
      <div className="mb-4 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="tabular-nums">
            <span className="font-semibold text-foreground">{index + 1}</span>{" "}
            / {total}
          </span>
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${((index + 1) / total) * 100}%` }}
            />
          </div>
          <span>{remaining} left</span>
        </div>
        <div className="hidden gap-3 text-muted-foreground sm:flex">
          <KeyHint label="Reject" hint="←" />
          <KeyHint label="Skip" hint="↑" />
          <KeyHint label="CRM" hint="C / ↓" />
          <KeyHint label="Keep" hint="→" />
        </div>
      </div>

      {/* Card */}
      <div className="relative flex-1 min-h-0">
        <article
          key={current.org_nr}
          className={cn(
            "absolute inset-0 mx-auto flex max-w-2xl flex-col overflow-y-auto rounded-2xl border bg-card shadow-lg transition-all duration-200 ease-out",
            direction && `${exitTransform[direction]} opacity-0`,
            !direction && "animate-in fade-in zoom-in-95"
          )}
        >
          {/* Top header: score + org meta */}
          <header className="flex flex-wrap items-start justify-between gap-3 border-b bg-muted/30 px-6 py-5">
            <div className="flex items-center gap-3">
              <ScoreBadge score={current.score} className="h-10 min-w-14 text-base" />
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Score
                </div>
                <div className="text-sm text-muted-foreground">
                  of {current.score >= 70 ? "high" : current.score >= 40 ? "moderate" : "low"} quality
                </div>
              </div>
            </div>
            <Link
              href={`/admin/leads/${current.org_nr}` as never}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              Full detail
              <ExternalLink className="h-3 w-3" />
            </Link>
          </header>

          {/* Body */}
          <div className="flex-1 space-y-6 px-6 py-6">
            <section>
              <h2 className="text-2xl font-semibold tracking-tight leading-tight">
                {current.name}
              </h2>
              {current.contact_name ? (
                <div className="mt-1 flex items-center gap-1.5 text-sm text-foreground/80">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{current.contact_name}</span>
                </div>
              ) : null}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span className="font-mono">{current.org_nr}</span>
                {current.org_form ? (
                  <>
                    <span aria-hidden>·</span>
                    <span>{current.org_form}</span>
                  </>
                ) : null}
                {current.kommune ? (
                  <>
                    <span aria-hidden>·</span>
                    <span>{current.kommune}</span>
                  </>
                ) : null}
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <FactRow
                icon={Building2}
                label="Industry"
                value={
                  <>
                    {current.nace_code ? (
                      <span className="font-mono text-xs text-muted-foreground mr-1.5">
                        {current.nace_code}
                      </span>
                    ) : null}
                    {current.nace_description ?? "–"}
                  </>
                }
              />
              <FactRow
                icon={Building2}
                label="Registered"
                value={formatDate(current.registered_at)}
              />
            </section>

            <section className="grid gap-2.5">
              <ContactLine
                icon={Phone}
                label="Phone"
                value={current.phone}
                href={current.phone ? `tel:${current.phone}` : undefined}
              />
              <ContactLine
                icon={Smartphone}
                label="Mobile"
                value={current.mobile}
                href={current.mobile ? `tel:${current.mobile}` : undefined}
              />
              <ContactLine
                icon={Mail}
                label="Email"
                value={current.email}
                href={current.email ? `mailto:${current.email}` : undefined}
              />
              <ContactLine
                icon={Globe}
                label="Nettside"
                value={current.website}
                href={
                  current.website
                    ? current.website.startsWith("http")
                      ? current.website
                      : `https://${current.website}`
                    : undefined
                }
              />
            </section>

            <section>
              <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Score breakdown
              </div>
              <ul className="space-y-1 text-sm">
                {(Object.keys(SCORE_LABELS_NB) as Array<keyof ScoringWeights>).map(
                  (key) => {
                    const points = current.score_breakdown?.[key];
                    const earned = typeof points === "number" && points > 0;
                    return (
                      <li
                        key={key}
                        className="flex items-center justify-between gap-3 py-0.5"
                      >
                        <span
                          className={
                            earned
                              ? "text-foreground"
                              : "text-muted-foreground/60"
                          }
                        >
                          {SCORE_LABELS_NB[key]}
                        </span>
                        <span
                          className={cn(
                            "tabular-nums",
                            earned
                              ? "font-medium text-primary"
                              : "text-muted-foreground/40"
                          )}
                        >
                          {earned ? `+${points}` : "0"}
                        </span>
                      </li>
                    );
                  }
                )}
              </ul>
            </section>
          </div>
        </article>
      </div>

      {/* Action bar */}
      <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
        <ActionButton
          label="Reject"
          icon={X}
          tone="destructive"
          hint="←"
          disabled={pending}
          onClick={() => handleAction("reject")}
        />
        <ActionButton
          label="Skip"
          icon={ArrowUp}
          tone="ghost"
          hint="↑"
          disabled={pending}
          onClick={() => handleAction("review")}
        />
        <ActionButton
          label="Send to CRM"
          icon={Handshake}
          tone="secondary"
          hint="C"
          disabled={pending}
          onClick={() => handleAction("crm")}
        />
        <ActionButton
          label="Keep"
          icon={Check}
          tone="primary"
          hint="→"
          disabled={pending}
          onClick={() => handleAction("qualify")}
          loading={pending}
        />
      </div>
    </div>
  );
}

function ActionButton({
  label,
  icon: Icon,
  hint,
  tone,
  onClick,
  disabled,
  loading,
}: {
  label: string;
  icon: typeof X;
  hint: string;
  tone: "destructive" | "primary" | "secondary" | "ghost";
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={
        tone === "destructive"
          ? "destructive"
          : tone === "primary"
            ? "default"
            : tone === "secondary"
              ? "secondary"
              : "outline"
      }
      size="lg"
      disabled={disabled}
      onClick={onClick}
      className="flex h-14 flex-col items-center justify-center gap-0.5 text-xs sm:text-sm"
    >
      {loading ? <Loader2 className="animate-spin" /> : <Icon />}
      <span className="flex items-center gap-1.5 font-medium">
        {label}
        <kbd className="hidden rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] font-mono text-foreground/70 sm:inline">
          {hint}
        </kbd>
      </span>
    </Button>
  );
}

function FactRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="text-sm truncate">{value}</div>
      </div>
    </div>
  );
}

function ContactLine({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Phone;
  label: string;
  value: string | null;
  href?: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="w-16 shrink-0 text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {value ? (
        href ? (
          <a
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="min-w-0 flex-1 truncate hover:underline"
          >
            {value}
          </a>
        ) : (
          <span className="min-w-0 flex-1 truncate">{value}</span>
        )
      ) : (
        <span className="text-muted-foreground/60">–</span>
      )}
    </div>
  );
}

function KeyHint({ label, hint }: { label: string; hint: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground/70">
        {hint}
      </kbd>
      {label}
    </span>
  );
}

function EmptyQueue() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="max-w-md space-y-3 rounded-xl border border-dashed bg-card/50 px-8 py-12 text-center">
        <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Check className="h-5 w-5" />
        </div>
        <h3 className="font-medium">No new leads in the queue</h3>
        <p className="text-sm text-muted-foreground">
          All ny-status-leads er gjennomgått. Kjør Brreg-innhenting fra Queue
          for å hente nye.
        </p>
        <Link
          href="/admin/queue"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Gå til Queue →
        </Link>
      </div>
    </div>
  );
}

function DoneState({ total }: { total: number }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="max-w-md space-y-3 rounded-xl border bg-card px-8 py-12 text-center">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <Check className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold">Done — {total} leads triaged</h3>
        <p className="text-sm text-muted-foreground">
          Reload the page to fetch any new leads.
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw />
            Reload
          </Button>
          <Link
            href="/admin/crm"
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            To CRM
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
