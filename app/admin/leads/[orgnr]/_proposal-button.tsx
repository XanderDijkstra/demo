"use client";

import { useState, useTransition } from "react";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  companyName: string;
  defaultContact?: string;
}

const SERVICE_OPTIONS = [
  { value: "website", label: "Nettside" },
  { value: "meta_ads", label: "Meta Ads" },
  { value: "seo", label: "SEO" },
  { value: "google_ads", label: "Google Ads" },
  { value: "reviews", label: "Anmeldelser" },
] as const;

type ServiceValue = (typeof SERVICE_OPTIONS)[number]["value"];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function parseContentDispositionFilename(header: string | null): string | null {
  if (!header) return null;
  // Match either filename="…" or filename*=UTF-8''…
  const quoted = header.match(/filename="([^"]+)"/i);
  if (quoted?.[1]) return decodeURIComponent(quoted[1]);
  const star = header.match(/filename\*=(?:UTF-8'')?([^;]+)/i);
  if (star?.[1]) return decodeURIComponent(star[1].trim());
  return null;
}

export function ProposalButton({ companyName, defaultContact = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  // Form state
  const [serviceType, setServiceType] = useState<ServiceValue>("website");
  const [clientName, setClientName] = useState(companyName);
  const [contact, setContact] = useState(defaultContact);
  const [date, setDate] = useState(todayIso());
  const [monthly, setMonthly] = useState("700");
  const [freeSetup, setFreeSetup] = useState(true);
  const [binding, setBinding] = useState("Ingen");
  const [adBudget, setAdBudget] = useState("");

  const isAdsService = serviceType === "meta_ads" || serviceType === "google_ads";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const body = {
      service_type: serviceType,
      client_name: clientName.trim(),
      client_contact: contact.trim(),
      proposal_date: date,
      monthly_price_nok: Number(monthly) || 0,
      free_setup: freeSetup,
      binding: binding.trim() || "Ingen",
      ad_budget: isAdsService && adBudget.trim() ? adBudget.trim() : undefined,
    };

    startTransition(async () => {
      try {
        const res = await fetch("/api/proposals/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `${res.status}`);
        }
        const blob = await res.blob();
        const filename =
          parseContentDispositionFilename(
            res.headers.get("Content-Disposition")
          ) ?? `FX Media - Tilbud - ${clientName}.pdf`;
        downloadBlob(blob, filename);
        toast.success("Tilbud generert — lasta ned");
        setOpen(false);
      } catch (err) {
        toast.error(
          `Kunne ikke generere: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText />
          Generer tilbud
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Generer tilbud for {companyName}</DialogTitle>
            <DialogDescription>
              Velg tjeneste og pris — leveranser fylles fra mal og kan
              redigeres i en neste runde.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="service" className="text-xs">
                Tjeneste
              </Label>
              <select
                id="service"
                value={serviceType}
                onChange={(e) =>
                  setServiceType(e.target.value as ServiceValue)
                }
                disabled={pending}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                {SERVICE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="client" className="text-xs">
                  Klient
                </Label>
                <Input
                  id="client"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  disabled={pending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact" className="text-xs">
                  Kontaktperson
                </Label>
                <Input
                  id="contact"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Fornavn Etternavn"
                  disabled={pending}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs">
                  Tilbudsdato
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={pending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="monthly" className="text-xs">
                  Månedlig pris (NOK)
                </Label>
                <Input
                  id="monthly"
                  type="number"
                  min={0}
                  step={50}
                  value={monthly}
                  onChange={(e) => setMonthly(e.target.value)}
                  required
                  disabled={pending}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="binding" className="text-xs">
                  Bindingstid
                </Label>
                <Input
                  id="binding"
                  value={binding}
                  onChange={(e) => setBinding(e.target.value)}
                  placeholder="Ingen"
                  disabled={pending}
                />
              </div>
              <label className="flex items-center gap-2 pt-6 text-sm">
                <input
                  type="checkbox"
                  checked={freeSetup}
                  onChange={(e) => setFreeSetup(e.target.checked)}
                  disabled={pending}
                />
                Gratis etablering
              </label>
            </div>

            {isAdsService ? (
              <div className="space-y-1.5">
                <Label htmlFor="adbudget" className="text-xs">
                  Anbefalt annonsebudsjett (valgfritt)
                </Label>
                <Input
                  id="adbudget"
                  value={adBudget}
                  onChange={(e) => setAdBudget(e.target.value)}
                  placeholder="4 000 – 7 500"
                  disabled={pending}
                />
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <FileText />}
              Generer PDF
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
