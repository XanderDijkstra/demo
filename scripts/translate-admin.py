#!/usr/bin/env python3
"""
One-off Norwegian → English translation of the admin/dashboard UI.

Walks every .ts/.tsx/.js/.jsx under app/admin, app/api, and
components/admin and substitutes Norwegian user-facing strings.

Keys are matched verbatim. Public-facing lead pages
(components/site/templates/landscaper.tsx, app/p/[orgnr], the Ezra
preview) are intentionally NOT included — those are read by Norwegian
leads, so the content stays Norwegian. Email body defaults in the
send-modal also stay Norwegian for the same reason.

Re-running is safe: an already-translated key won't match.
"""

import os
import sys

TRANSLATIONS = {
    # ── Page titles / Topbar ──────────────────────────────────────────────
    "Innstillinger": "Settings",
    "Utsendelser": "Outreach",
    "Maler": "Templates",
    "Mal-forhåndsvisning": "Template preview",
    "Demoside": "Demo site",
    "Demoer": "Demos",
    "Demosider": "Demo sites",
    "Daglig oversikt over leads fra Brreg": "Daily overview of leads from Brreg",
    "Aktive samtaler — fra første svar til lukket avtale": "Active conversations — from first reply to closed deal",
    "Daglig Brreg-innhenting og kjørehistorikk": "Daily Brreg ingestion and run history",
    "Triagér nye leads — én av gangen, raskt": "Triage new leads — one at a time, fast",
    "Per-bransje design for de auto-genererte demosidene": "Per-niche designs for auto-generated demo sites",
    "Selskaper hentet fra Brreg, sortert etter score": "Companies pulled from Brreg, sorted by score",
    "Scoring-vekter, målnæringer og ekskluderte former": "Scoring weights, target NACE codes, and excluded org forms",

    # ── Sidebar ───────────────────────────────────────────────────────────
    "Kø": "Queue",

    # ── Status badges & deal stages ───────────────────────────────────────
    "Ny svar": "New reply",
    "I dialog": "In conversation",
    "Tilbud sendt": "Proposal sent",
    "Vunnet": "Won",
    "Tapt": "Lost",
    "Aktive": "Active",
    "Aktiv": "Active",
    "Vunnet (30d)": "Won (30d)",
    "Tapt (30d)": "Lost (30d)",
    "Leadet har svart — første kontakt etablert": "Lead has replied — first contact established",
    "Aktiv dialog pågår": "Active conversation in progress",
    "Tilbud levert, venter på respons": "Proposal delivered, awaiting response",
    "Avtale i boks": "Deal closed",
    "Avtalen falt bort": "Deal lost",
    "Hva er grunnen til at avtalen falt? (valgfritt)": "What's the reason the deal was lost? (optional)",

    # ── Lead status ───────────────────────────────────────────────────────
    "Ny": "New",
    "Vurdert": "Reviewed",
    "Kvalifisert": "Qualified",
    "Avvist": "Rejected",
    "Avvis": "Reject",
    "Kvalifiser": "Qualify",
    "Hopp": "Skip",
    "Send til CRM": "Send to CRM",
    "Behold": "Keep",
    "Markert som vurdert": "Marked as reviewed",
    "Sendt til CRM": "Sent to CRM",
    "Markert som besvart": "Marked as replied",
    "Markert som ikke besvart": "Marked as not replied",
    "Marker som besvart": "Mark as replied",
    "Klikk for å fjerne svar-markering": "Click to remove reply marker",
    "Besvart": "Replied",
    "besvart": "replied",
    "avvist": "rejected",
    "klage": "complaint",

    # ── Score & scoring ───────────────────────────────────────────────────
    "Snittscore denne uken": "Average score this week",
    "Score (høyest)": "Score (highest)",
    "Alle scorer": "All scores",
    "Høy kvalitet (≥70)": "High quality (≥70)",
    "Score-bruddrapport": "Score breakdown",
    "av høy kvalitet": "of high quality",
    "av moderat kvalitet": "of moderate quality",
    "av svak kvalitet": "of low quality",
    "Hvordan {score}-poeng-summen er satt sammen": "How the {score}-point total is composed",
    "Har telefon": "Has phone",
    "Selskapsform AS/ASA": "Org form AS/ASA",
    "Målnæring (NACE)": "Target NACE",
    "Håndverker (bygg / anlegg)": "Tradesperson (construction)",
    "Håndverker": "Tradesperson",
    "Har nettside": "Has website",
    "Reell forretningsadresse": "Real business address",
    "Nystiftet (siste 7 dager)": "Newly founded (last 7 days)",
    "Nystiftet": "Newly founded",

    # ── Forms / Inputs ────────────────────────────────────────────────────
    "Navn": "Name",
    "E-post": "Email",
    "Telefon": "Phone",
    "Mobil": "Mobile",
    "Adresse": "Address",
    "Melding": "Message",
    "Forretningsadresse": "Business address",
    "Selskapsform": "Org form",
    "Ansatte": "Employees",
    "Selskap": "Company",
    "Næring": "Industry",
    "Næring og status": "Industry and status",
    "Selskapsnavn eller org.nr": "Company name or org.nr",
    "Fornavn Etternavn": "First Last",
    "Brukes som «Hei {{contact_first_name}}» i e-postmaler.": "Used as \"Hi {{contact_first_name}}\" in email templates.",
    "Brreg har ingen e-post-data — legg til manuelt etter research.": "Brreg has no email data — add manually after research.",
    "Finn e-post fra nettsiden": "Find email from website",
    "Finn e-post": "Find email",
    "Velg én av {count} treff:": "Pick one of {count} matches:",
    "Rediger kontaktperson": "Edit contact person",
    "Rediger e-post": "Edit email",
    "Kontaktperson": "Contact person",

    # ── Toasts / status messages ──────────────────────────────────────────
    "Lagre": "Save",
    "Lagret": "Saved",
    "Lagret {value}": "Saved {value}",
    "Avbryt": "Cancel",
    "Fjern": "Remove",
    "Fjernet": "Removed",
    "Navn lagret": "Name saved",
    "Navn fjernet": "Name removed",
    "E-post oppdatert": "Email updated",
    "E-post fjernet": "Email removed",
    "Fant e-post: {email}": "Found email: {email}",
    "Avsenderadresse lagret": "Sender address saved",
    "Reply-To lagret": "Reply-To saved",
    "Bruk format «Display Name <addr@domene.no>» eller «addr@domene.no»": "Use format \"Display Name <addr@domain.no>\" or \"addr@domain.no\"",
    "Deal opprettet": "Deal created",
    "Deal oppdatert": "Deal updated",
    "Demosiden er publisert": "Demo site published",
    "Demosiden er avpublisert": "Demo site unpublished",
    "Avpublisering feilet": "Unpublish failed",
    "Generering feilet": "Generation failed",
    "Stage-endring feilet": "Stage change failed",
    "Oppdatering feilet": "Update failed",
    "Flyttet til {stage}": "Moved to {stage}",
    "Feilet: {error}": "Failed: {error}",
    "Tilbud generert — lasta ned": "Proposal generated — downloaded",
    "Tilbud generert — last ned": "Proposal generated — download",
    "Sendt": "Sent",
    "Bedankt!": "Thanks!",
    "Iets ging mis": "Something went wrong",

    # ── Suppression list ──────────────────────────────────────────────────
    "Fjern fra suppression list": "Remove from suppression list",
    "Fjernet fra suppression list": "Removed from suppression list",
    "Lagt til på suppression list": "Added to suppression list",

    # ── Errors / validation ───────────────────────────────────────────────
    "Ugyldig org.nr": "Invalid org.nr",
    "Ugyldig navn": "Invalid name",
    "Ugyldig niche": "Invalid niche",
    "Ugyldig stage": "Invalid stage",
    "Ugyldig status": "Invalid status",
    "Ugyldig e-postadresse": "Invalid email address",
    "Ugyldig input": "Invalid input",
    "Emne mangler": "Subject is required",
    "Innhold mangler": "Body is required",
    "Mangler deal-id": "Missing deal id",
    "Mangler email-id": "Missing email id",
    "Mangler innstillinger i databasen": "Missing settings in database",
    "Lead ikke funnet": "Lead not found",
    "Ingen e-postadresse på leadet": "No email address on lead",
    "Legg til e-post først": "Add an email first",
    "Suppressed ({reason}) — kan ikke sende": "Suppressed ({reason}) — cannot send",
    "Adressen er suppressed ({reason}) og kan ikke kontaktes": "Address is suppressed ({reason}) and cannot be contacted",
    "Kunne ikke endre stage": "Could not change stage",
    "Kunne ikke logge utsendelse": "Could not log send",
    "Kunne ikke opprette deal": "Could not create deal",
    "Send feilet": "Send failed",
    "Send feilet: {error}": "Send failed: {error}",
    "Send nå": "Send now",
    "Ingen nettside å skrape — legg til hjemmeside først": "No website to scrape — add a homepage first",
    "Kunne ikke laste {host}: {error}": "Could not load {host}: {error}",
    "Fant ingen e-post på nettsiden": "Found no email on the website",
    "Uventet content-type: {ctype}": "Unexpected content-type: {ctype}",
    "Ingen gyldig nettside": "No valid website",
    "Kvalifisert, men kunne ikke opprette deal (kanskje finnes en aktiv allerede)": "Qualified, but could not create deal (one may already be active)",

    # ── Empty states ──────────────────────────────────────────────────────
    "Ingen leads denne uken": "No leads this week",
    "Ingen leads matcher": "No leads match",
    "Ingen leads enda": "No leads yet",
    "Ingen aktivitet enda": "No activity yet",
    "Ingen utsendelser enda": "No emails sent yet",
    "Ingen utsendelser i perioden": "No emails sent in this period",
    "Ingen e-post sendt enda": "No email sent yet",
    "Ingen kjøringer enda": "No runs yet",
    "Ingen nye leads i køen": "No new leads in the queue",
    "Ingen nye leads": "No new leads",
    "Alle ny-status-leads er gjennomgått. Kjør Brreg-innhenting fra Kø for å hente nye.": "All new-status leads have been triaged. Run Brreg ingestion from Queue to fetch more.",
    "Når leads åpner eller svarer, dukker de opp her.": "When leads open or reply, they show up here.",
    "Send fra en lead-detaljside for å komme i gang.": "Send from a lead detail page to get started.",
    "Send fra en lead-detaljside for å se aktivitet her.": "Send from a lead detail page to see activity here.",
    "Trigger en kjøring fra Kø-siden, eller vent til morgendagens cron.": "Trigger a run from the Queue page, or wait for tomorrow's cron.",
    "Trigger første innhenting fra Kø-siden for å se leads her.": "Trigger the first ingestion from the Queue page to see leads here.",
    "Trigger første innhenting fra Kø-siden, så fylles grafen opp.": "Trigger the first ingestion from the Queue page to populate the chart.",
    "Trykk «Kjør nå» over for å starte den første innhentingen.": "Press \"Run now\" above to start the first ingestion.",
    "Tomt salgsbord": "Empty pipeline",
    "Ingen aktive avtaler enda": "No active deals yet",
    "CRM-kort opprettes automatisk når du markerer en e-post som besvart på lead-detaljsiden.": "CRM cards are created automatically when you mark an email as replied on the lead detail page.",
    "Når en lead svarer, marker e-posten som «Besvart» — så dukker leadet opp her i «Ny svar».": "When a lead replies, mark the email as \"Replied\" — it'll show up here under \"New reply\".",
    "ingen": "none",
    "Slipp her": "Drop here",
    "Tips: dra et kort mellom kolonnene for å flytte det.": "Tip: drag a card between columns to move it.",

    # ── Buttons & actions ────────────────────────────────────────────────
    "Send e-post": "Send email",
    "Generer & publiser": "Generate & publish",
    "Regenerer": "Regenerate",
    "Vis side": "View site",
    "Avpubliser": "Unpublish",
    "Last på nytt": "Reload",
    "Til CRM": "To CRM",
    "Gå til Kø →": "Go to Queue →",
    "Tilbake": "Back",
    "Vis i Brreg": "View in Brreg",
    "Vis JSON": "Show JSON",
    "Kjør nå": "Run now",
    "Kjør innhenting nå": "Run ingestion now",
    "Last ned tilbud (PDF)": "Download proposal (PDF)",
    "Last ned PDF": "Download PDF",
    "Genererer …": "Generating …",
    "Genererer": "Generating",
    "Publiserer …": "Publishing …",
    "Sender …": "Sending …",
    "Lagrer …": "Saving …",
    "Henter …": "Loading …",
    "Markerer …": "Marking …",
    "Flytter …": "Moving …",
    "Bekreft": "Confirm",
    "Slett": "Delete",
    "Lukk": "Close",
    "Rediger": "Edit",
    "Opprett": "Create",
    "Oppdater": "Update",
    "Velg": "Select",
    "Velg niche": "Pick niche",
    "Velg stage": "Pick stage",
    "Velg status": "Pick status",
    "Søk leads": "Search leads",
    "Søk": "Search",
    "Filtre": "Filters",
    "Tøm filtre": "Clear filters",
    "Standard": "Default",
    "Tilbakestill": "Reset",
    "Fordeler": "Benefits",
    "Tjenester": "Services",

    # ── Tabs ──────────────────────────────────────────────────────────────
    "Denne uken": "This week",
    "Alle": "All",
    "Leads denne uken": "Leads this week",
    "Leads totalt": "Leads total",
    "Svarrate": "Reply rate",
    "Åpningsrate": "Open rate",
    "Klikkrate": "Click rate",
    "Leverte": "Delivered",
    "Bounces": "Bounces",
    "Klager": "Complaints",
    "Suppressions": "Suppressions",
    "I kø": "Queued",
    "i kø": "queued",
    "sendt": "sent",
    "levert": "delivered",
    "åpnet": "opened",
    "klikket": "clicked",
    "bounce": "bounce",
    "feilet": "failed",
    "Feilet (ikke sendt)": "Failed (not sent)",
    "Sendt": "Sent",

    # ── Time labels ───────────────────────────────────────────────────────
    "i dag": "today",
    "i går": "yesterday",
    "{n} dager": "{n} days",
    "siste 7 dager": "last 7 days",
    "siste 30 dager": "last 30 days",
    " igjen": " left",
    "minutter": "minutes",
    "minutt": "minute",
    "timer": "hours",
    "time": "hour",
    "sekunder": "seconds",
    "sekund": "second",
    "år": "years",
    "år ": "years ",

    # ── Topbar v1 etc ─────────────────────────────────────────────────────
    "i kø": "in queue",
    "Demoside er publisert": "Demo site published",
    "Eksperiment": "Experiment",
    "Framer-eksperimenter": "Framer experiments",
    "Ezra (anleggsgartner)": "Ezra (landscaper)",
    "Hagenouw Greenwork-design via Framer-eksport · statisk innhold · ikke koblet til lead-data":
        "Hagenouw Greenwork design via Framer export · static content · not wired to lead data",
    "Åpne forhåndsvisning": "Open preview",
    "Se mal": "View template",
    "Slik fungerer maler": "How templates work",
    "Hver bransje har én mal som auto-genererte demosider rendres gjennom. Klikk inn på en mal for å se hvordan den ser ut med eksempel-data.":
        "Each niche has one template that auto-generated demo sites render through. Click into a template to see how it looks with sample data.",
    "Designarbeid skjer i Claude-chatten — del skjermbilder der, så oppdateres koden i":
        "Design work happens in the Claude chat — share screenshots there and the code in",
    "og endringer går live etter neste deploy.":
        "is updated and changes go live after the next deploy.",
    "Eksempelbedrift AS": "Sample Company AS",

    # ── Swipe shortcuts ───────────────────────────────────────────────────
    "Ferdig — {total} leads gjennomgått": "Done — {total} leads triaged",
    "Last siden på nytt for å hente eventuelle nye leads.": "Reload the page to fetch any new leads.",
    "Score-bruddrapport": "Score breakdown",
    "Full detalj": "Full detail",
    "Registrert": "Registered",
    "Registrert {date}": "Registered {date}",
    "stiftet {date}": "founded {date}",
    "Org.nr {orgnr}": "Org.nr {orgnr}",

    # ── Email send modal ──────────────────────────────────────────────────
    "Variabler:": "Variables:",
    "site_url → tom (ingen demoside publisert)": "site_url → empty (no demo site published)",
    "Du har allerede sendt {n} e-post til dette leadet. Forsikre deg om at en oppfølging er ønsket før du sender på nytt.":
        "You've already sent {n} email to this lead. Make sure a follow-up is wanted before sending again.",
    "Du har allerede sendt {n} e-poster til dette leadet. Forsikre deg om at en oppfølging er ønsket før du sender på nytt.":
        "You've already sent {n} emails to this lead. Make sure a follow-up is wanted before sending again.",
    "Fra": "From",
    "Til": "To",
    "ingen": "none",
    "Emne": "Subject",
    "Innhold": "Body",
    "E-post sendt til {to}": "Email sent to {to}",

    # ── Reply / deal ──────────────────────────────────────────────────────
    "Marker som besvart": "Mark as replied",
    "Aktiv deal": "Active deal",
    "Verdi (NOK)": "Value (NOK)",
    "Notater": "Notes",
    "Tapsårsak": "Loss reason",
    "Opprett deal": "Create deal",
    "Det finnes ingen aktiv deal for dette leadet. Marker en e-post som besvart for å opprette én automatisk, eller opprett manuelt.":
        "There's no active deal for this lead. Mark an email as replied to create one automatically, or create one manually.",

    # ── Settings ──────────────────────────────────────────────────────────
    "Avsenderadresse": "Sender address",
    "Reply-To-adresse": "Reply-To address",
    "Claude-modell": "Claude model",
    "Aktiv modell": "Active model",
    "Tokens brukt totalt": "Total tokens used",
    "Inn": "In",
    "Ut": "Out",
    "Genererte sider": "Generated sites",
    "Ingen demosider er publisert enda.": "No demo sites have been published yet.",
    "Adressen vises som «Fra» i e-poster sendt fra dette systemet.": "Shown as \"From\" in emails sent from this system.",
    "Adressen mottakeren svarer til.": "Where the recipient's reply lands.",

    # ── Brreg / queue ─────────────────────────────────────────────────────
    "Dato for innhenting": "Ingestion date",
    "Status": "Status",
    "Hentet": "Fetched",
    "Lagt inn": "Inserted",
    "Hoppet over": "Skipped",
    "Varighet": "Duration",
    "Trigget av": "Triggered by",
    "Startet": "Started",
    "Fullført": "Finished",
    "Feilet": "Failed",
    "I gang": "In progress",
    "ferdig": "done",
    "pågår": "in progress",
    "manuell": "manual",
    "cron": "cron",
    "Henter inn …": "Ingesting …",
    "Henter": "Fetching",
    "kjøringer": "runs",
    "kjøring": "run",
    "leads i kø": "leads in queue",
    "Primær": "Primary",
    "Mal": "Template",
    "Mal valgt": "Template selected",
    "Velg mal": "Pick template",
    "Auto (basert på NACE)": "Auto (based on NACE)",
    "Auto-valgt": "Auto-selected",
    "Operatør-valgt": "Operator-selected",
    "Publisert": "Published",
    "Ikke generert": "Not generated",
    "Ingen demoside publisert enda": "No demo site published yet",
    "Auto-generert landingsside basert på Brreg-info og Claude-skreven kopi. Publiseres på":
        "Auto-generated landing page based on Brreg info and Claude-written copy. Published at",

    # ── CRM card ──────────────────────────────────────────────────────────
    "Åpne lead": "Open lead",
    "Grunn:": "Reason:",
    "Verdi": "Value",

    # ── Lead detail ───────────────────────────────────────────────────────
    "Salgspipeline-status for dette leadet. Vises i CRM-kanban under":
        "Sales pipeline status for this lead. Shown on the CRM kanban under",
    "Deal": "Deal",
    "Konkurs": "Bankrupt",
    "Under avvikling": "Under dissolution",
    "Tvangsavvikling": "Forced dissolution",
    "MVA-registrert": "VAT registered",
    "Ikke MVA-registrert": "Not VAT registered",
    "NACE": "NACE",
    "E-post sendt": "Email sent",
    "{n} utsendelser": "{n} sends",
    "Rådata fra Brreg": "Raw data from Brreg",
    "Full payload fra Enhetsregisteret API": "Full payload from the Enhetsregisteret API",
    "Forhåndsvisning åpnes i ny fane.": "Preview opens in a new tab.",

    # ── Lead filters ──────────────────────────────────────────────────────
    "Søk på navn eller org.nr": "Search by name or org.nr",
    "Bare høy kvalitet (score ≥ 70)": "Only high quality (score ≥ 70)",
    "Sorter etter": "Sort by",
    "Score": "Score",
    "Registreringsdato": "Registration date",
    "Status:": "Status:",
    "Side {page} av {pages}": "Page {page} of {pages}",
    "Prøv å endre filtre eller bytt til «Alle»-fanen.": "Try changing filters or switch to the \"All\" tab.",
    "Navn (A–Å)": "Name (A–Z)",

    # ── Misc small phrases ────────────────────────────────────────────────
    "Telefonen er forretningsnummeret som ble pulsa fra Brreg.": "The phone is the business number pulled from Brreg.",
    "Score-vektingen kan endres i Innstillinger.": "Score weighting can be changed in Settings.",
    "Eksempel:": "Example:",
    "valgfritt": "optional",
    "obligatorisk": "required",
}


WALK_DIRS = [
    "app/admin",
    "app/api",
    "components/admin",
    "components/ui",
    "lib",
]

EXTS = (".ts", ".tsx", ".js", ".jsx")

# Files explicitly excluded — Norwegian content is intentional here.
EXCLUDE = {
    "components/site/templates/landscaper.tsx",  # public lead-facing page
    "lib/scoring.ts",  # SCORE_LABELS_NB is referenced by name elsewhere
}


def should_skip(path: str) -> bool:
    rel = os.path.relpath(path).replace("\\", "/")
    if rel in EXCLUDE:
        return True
    if "/ezra/" in rel:
        return True  # Ezra Framer export — stays Norwegian
    if "/site/templates/" in rel:
        return True  # public templates stay Norwegian
    if "/p/" in rel and "[orgnr]" in rel:
        return True
    return False


def main(root: str) -> int:
    total = 0
    changed_files = 0
    for base in WALK_DIRS:
        base_dir = os.path.join(root, base)
        if not os.path.isdir(base_dir):
            continue
        for dirpath, _dirnames, filenames in os.walk(base_dir):
            for name in filenames:
                if not name.endswith(EXTS):
                    continue
                path = os.path.join(dirpath, name)
                if should_skip(path):
                    continue
                with open(path, "r", encoding="utf-8") as h:
                    content = h.read()
                original = content
                local = 0
                for old, new in TRANSLATIONS.items():
                    if old in content:
                        c = content.count(old)
                        content = content.replace(old, new)
                        local += c
                if content != original:
                    with open(path, "w", encoding="utf-8") as h:
                        h.write(content)
                    rel = os.path.relpath(path, root)
                    print(f"  {rel}  ({local})")
                    total += local
                    changed_files += 1
    print(f"\n{changed_files} files, {total} replacements")
    return 0


if __name__ == "__main__":
    root = sys.argv[1] if len(sys.argv) > 1 else "."
    sys.exit(main(root))
