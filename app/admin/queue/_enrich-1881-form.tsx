"use client";

import { useState, useTransition } from "react";
import { Loader2, Phone, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { testEnrich1881Lookup, triggerEnrich1881Batch } from "./_actions";

interface TestOutput {
  email: string | null;
  phone: string | null;
  mobile: string | null;
  contactName: string | null;
  topLevelKeys: string[];
  foundIn: string[];
  status: number;
}

export function Enrich1881Form({ configured }: { configured: boolean }) {
  const [pending, startTransition] = useTransition();
  const [testPending, startTestTransition] = useTransition();
  const [days, setDays] = useState("4");
  const [limit, setLimit] = useState("50");
  const [orgnr, setOrgnr] = useState("");
  const [test, setTest] = useState<TestOutput | null>(null);

  function handleBatch(formData: FormData) {
    startTransition(async () => {
      const result = await triggerEnrich1881Batch(formData);
      if (result.ok) {
        toast.success(
          `Skannet ${result.scanned} — e-post ${result.emailsFound}, telefon ${result.phonesFound}, oppdatert ${result.updated} (${result.failed} feilet)`
        );
      } else {
        toast.error(`Berikelse feilet: ${result.error}`);
      }
    });
  }

  function handleTest(formData: FormData) {
    startTestTransition(async () => {
      const result = await testEnrich1881Lookup(formData);
      if (result.ok) {
        setTest({
          email: result.contact.email,
          phone: result.contact.phone,
          mobile: result.contact.mobile,
          contactName: result.contact.contactName,
          topLevelKeys: result.topLevelKeys,
          foundIn: result.foundIn,
          status: result.status,
        });
        toast.success(`Oppslag OK (HTTP ${result.status})`);
      } else {
        setTest(null);
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-5">
      {!configured ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <code className="font-mono">ONE1881_API_KEY</code> er ikke satt. Legg
          inn abonnementsnøkkelen fra api1881.no i Vercel-miljøvariablene, så
          aktiveres oppslag og batch. (Valgfritt:{" "}
          <code className="font-mono">ONE1881_BASE_URL</code>,{" "}
          <code className="font-mono">ONE1881_LOOKUP_PATH</code> med{" "}
          <code className="font-mono">{"{orgnr}"}</code>.)
        </div>
      ) : null}

      {/* Test lookup */}
      <form action={handleTest} className="space-y-2">
        <Label htmlFor="test-orgnr" className="text-xs">
          Test ett oppslag (org.nr)
        </Label>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id="test-orgnr"
            name="orgnr"
            inputMode="numeric"
            placeholder="9 siffer"
            value={orgnr}
            onChange={(e) => setOrgnr(e.target.value.replace(/\D/g, "").slice(0, 9))}
            className="w-40 tabular-nums"
            disabled={testPending || !configured}
          />
          <Button
            type="submit"
            variant="outline"
            disabled={testPending || !configured}
          >
            {testPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Search />
            )}
            Test oppslag
          </Button>
        </div>
      </form>

      {test ? (
        <div className="rounded-md border bg-muted/30 p-3 text-xs space-y-2">
          <div className="grid gap-1.5 sm:grid-cols-2">
            <Field label="E-post" value={test.email} highlight />
            <Field label="Kontaktperson" value={test.contactName} />
            <Field label="Telefon" value={test.phone} />
            <Field label="Mobil" value={test.mobile} />
          </div>
          {test.foundIn.length > 0 ? (
            <div className="text-muted-foreground">
              Mapping: {test.foundIn.join(", ")}
            </div>
          ) : (
            <div className="text-amber-700 dark:text-amber-400">
              Fant ingen kjente felt — topp-nøkler:{" "}
              <span className="font-mono">
                {test.topLevelKeys.join(", ") || "(ingen)"}
              </span>
              . Del responsen så justerer jeg parseren.
            </div>
          )}
        </div>
      ) : null}

      {/* Batch */}
      <form
        action={handleBatch}
        className="flex flex-wrap items-end gap-3 border-t pt-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="enrich-days" className="text-xs">
            Siste dager
          </Label>
          <Input
            id="enrich-days"
            name="days"
            type="number"
            min={1}
            max={30}
            step={1}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="w-24 tabular-nums"
            disabled={pending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="enrich-limit" className="text-xs">
            Maks leads
          </Label>
          <Input
            id="enrich-limit"
            name="limit"
            type="number"
            min={1}
            max={200}
            step={1}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="w-24 tabular-nums"
            disabled={pending}
          />
        </div>
        <Button type="submit" disabled={pending || !configured}>
          {pending ? (
            <>
              <Loader2 className="animate-spin" />
              Beriker…
            </>
          ) : (
            <>
              <Sparkles />
              Berik fra 1881
            </>
          )}
        </Button>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Phone className="h-3 w-3" />
          Treffer leads uten e-post — også de uten nettside
        </span>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | null;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-muted-foreground">{label}:</span>
      {value ? (
        <span
          className={
            highlight
              ? "font-medium text-foreground"
              : "text-foreground/90"
          }
        >
          {value}
        </span>
      ) : (
        <span className="text-muted-foreground/60">–</span>
      )}
    </div>
  );
}
