"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
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

import { addLeadToCrm } from "./_actions";

/**
 * Manual "+ Add lead" trigger for the CRM. Takes an org.nr (required)
 * and optional contact info. If the company isn't yet in our DB the
 * server action fetches it from Brreg, scores it, and inserts before
 * opening a deal.
 */
export function AddLeadDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [orgNr, setOrgNr] = useState("");
  const [email, setEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const router = useRouter();

  function reset() {
    setOrgNr("");
    setEmail("");
    setContactName("");
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("orgNr", orgNr.replace(/\D/g, ""));
    fd.set("email", email);
    fd.set("contactName", contactName);

    startTransition(async () => {
      const result = await addLeadToCrm(fd);
      if (result.ok) {
        toast.success("Lead lagt til i pipeline");
        reset();
        setOpen(false);
        if (result.orgNr) {
          router.push(`/admin/leads/${result.orgNr}` as never);
        }
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Ny lead
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Legg til lead i pipeline</DialogTitle>
            <DialogDescription>
              Skriv inn org.nr. Hvis bedriften ikke ligger i databasen fra
              før, hentes den fra Brreg automatisk.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="add-orgnr" className="text-xs">
                Org.nr <span className="text-destructive">*</span>
              </Label>
              <Input
                id="add-orgnr"
                inputMode="numeric"
                placeholder="9 siffer"
                value={orgNr}
                onChange={(e) =>
                  setOrgNr(e.target.value.replace(/\D/g, "").slice(0, 9))
                }
                className="tabular-nums"
                disabled={pending}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-email" className="text-xs">
                E-post (valgfritt)
              </Label>
              <Input
                id="add-email"
                type="email"
                placeholder="post@bedriften.no"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={pending}
              />
              <p className="text-[11px] text-muted-foreground">
                Brukes kun hvis Brreg ikke har e-post.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-contact" className="text-xs">
                Kontaktperson (valgfritt)
              </Label>
              <Input
                id="add-contact"
                placeholder="Ola Nordmann"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                disabled={pending}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending || orgNr.length !== 9}>
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Legg til
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
