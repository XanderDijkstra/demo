#!/usr/bin/env python3
"""
One-off translation of the Framer-exported Hagenouw Greenwork
landscaper template from Dutch (+ some English bits the export left
in) to Norwegian.

Strings are matched verbatim against what's in the bundled .js files —
that means unicode characters in the source are kept as their actual
\\xEB / \\u201C escape sequences. Replacements are written as raw
UTF-8 for any Norwegian char (æ, ø, å) since the V8 parser is happy
with either form.

Re-running is safe: a string already translated won't match the Dutch
key.
"""

import glob
import os
import sys

# Old → new mappings. Keep keys verbatim from the source.
TRANSLATIONS = {
    # ── Hero ───────────────────────────────────────────────────────────
    "Jouw Droomtuin, Zonder Zorgen Gerealiseerd":
        "Din Drømmehage, Realisert Uten Bekymringer",
    "Vakmanschap in elke meter -":
        "Håndverk i hver meter -",
    "Wij transformeren jouw buitenruimte met strak straatwerk, groen gazon en hoogwaardige renovaties. Kwaliteit waar je jarenlang van geniet.":
        "Vi forvandler uterommet ditt med stilren brostein, frodig plen og førsteklasses anlegg. Kvalitet du gleder deg over i mange år.",
    "Bel Mij": "Ring meg",
    "Stuur me op Whatsapp": "Send WhatsApp",
    # Form labels / placeholders
    "Naam": "Navn",
    "Email": "E-post",
    "Volledige Naam": "Fullt navn",
    "Telefoon": "Telefon",
    "Adres": "Adresse",
    "Straat & Postcode": "Gate og postnr.",
    "Bericht": "Melding",
    "Beschrijf je project": "Beskriv prosjektet ditt",
    "Verstuur": "Send",
    "Bedankt!": "Takk!",
    "Iets ging mis": "Noe gikk galt",

    # ── About ──────────────────────────────────────────────────────────
    "Passie voor een ": "Lidenskap for et ",
    "Natuurlijk Straalt": "Naturlig Glød",
    "Bij Hagenouw Greenwork draait alles om vakmanschap. Wij cre\\xEBren en onderhouden tuinen die niet alleen mooi zijn, maar waar je echt tot rust komt. Met 10+ jaar ervaring zorgen we voor een resultaat dat staat.":
        "Hos oss handler alt om håndverk. Vi skaper og vedlikeholder hager som ikke bare er vakre, men hvor du virkelig finner ro. Med 10+ års erfaring leverer vi resultater som varer.",
    "Quality You Can Trust": "Kvalitet du kan stole på",
    "Reliable service clear communication consistent results.":
        "Pålitelig service, tydelig kommunikasjon og konsekvente resultater.",

    # ── Service ────────────────────────────────────────────────────────
    "Diensten ": "Tjenester ",
    "Shrub Trimming": "Beskjæring",
    "With our full-service care you can keep garden lush lively and exquisitely arranged.":
        "Med vår fullservice-omsorg holder du hagen frodig, levende og elegant arrangert.",

    # ── Stats ──────────────────────────────────────────────────────────
    "Beoordeeld met een 10/10 op Werkspot":
        "Vurdert med 10/10 av kundene våre",
    "Onze klanten vertrouwen op ons voor tuinonderhoud en aanleg met passie en oog voor detail. Van periodiek onderhoud tot volledige transformaties.":
        "Kundene våre stoler på oss for hagestell og anlegg med lidenskap og sans for detaljer. Fra jevnt vedlikehold til komplette forvandlinger.",
    " Klanten": " Kunder",
    "Lawns Maintained": "Plener vedlikeholdt",

    # ── WhyChoose ──────────────────────────────────────────────────────
    "Relax and enjoy a greener, more beautiful garden\\u2014expertly crafted to match your vision.":
        "Slapp av og nyt en grønnere, vakrere hage – skapt av eksperter etter din visjon.",
    "Trained Gardeners": "Erfarne gartnere",

    # ── Outdoor ────────────────────────────────────────────────────────
    "Free garden inspection consultation": "Gratis hagebefaring",
    "Wij gebruiken duurzame materialen en vakkundige technieken om een tuin te cre\\xEBren die leeft. Uw visie, ons vakmanschap.m uses sustainable methods quality tools and plant-friendly techniques to create vibrant lawns. ":
        "Vi bruker bærekraftige materialer og solide teknikker for å skape en hage som lever. Din visjon, vårt håndverk. ",

    # ── HowItWork ──────────────────────────────────────────────────────
    "Receive a Quote": "Få et tilbud",
    "We provide a detailed estimate based on our inspection findings.":
        "Vi gir et detaljert estimat basert på funnene fra befaringen.",

    # ── Review ─────────────────────────────────────────────────────────
    "Commercial Property Manager": "Eiendomsforvalter",
    "\\u201CAbsolutely outstanding service My lawn has never looked this green and healthy. The team was professional on time and paid attention to every detail. My garden is now a vibrant colourful my garden paradise.\\u201D":
        "\\u201CHelt fantastisk tjeneste. Plenen min har aldri sett så grønn og frisk ut. Teamet var profesjonelt, presist og hadde øye for hver minste detalj. Hagen min er nå et levende, fargerikt paradis.\\u201D",

    # ── Gallery ────────────────────────────────────────────────────────
    "Onze ": "Våre ",
    "Projecten": "Prosjekter",
    "Onze Blog": "Bloggen vår",

    # ── FAQ ────────────────────────────────────────────────────────────
    "Heb je een vraag over onze werkwijze of diensten? Hier vind je de antwoorden op de meest gestelde vragen.":
        "Har du spørsmål om hvordan vi jobber eller om tjenestene våre? Her finner du svar på de vanligste spørsmålene.",
    "How often should I schedule lawn maintenance?":
        "Hvor ofte bør jeg ha plenvedlikehold?",
    "It depends on your lawn type and needs but generally weekly or bi-weekly maintenance keeps your outdoor space healthy looking its best.":
        "Det avhenger av plentype og behov, men ukentlig eller annenhver-uke-vedlikehold holder uterommet friskt og pent.",
    "Transformeer Je Tuin Vandaag": "Forvandle hagen din i dag",
    "Vragen": "Spørsmål",
    "Breng je tuin tot leven met vakkundig onderhoud en strakke aanleg. Ons team staat klaar om elk project, groot of klein, met zorg op te pakken.":
        "Bring hagen til live med fagkyndig vedlikehold og stilrent anlegg. Teamet vårt tar seg av hvert prosjekt, stort eller lite, med omhu.",

    # Misc / cross-cutting
    "Transform Your Outdoors with Expert Advice":
        "Forvandle uterommet med ekspertråd",
    "Dec 1, 2025": "1. des. 2025",
}


def main(target_dir: str) -> int:
    files = sorted(glob.glob(os.path.join(target_dir, "*.js")))
    if not files:
        print(f"No .js files in {target_dir}", file=sys.stderr)
        return 1

    total_replacements = 0
    for path in files:
        with open(path, "r", encoding="utf-8") as h:
            content = h.read()
        original = content
        for old, new in TRANSLATIONS.items():
            if old in content:
                count = content.count(old)
                content = content.replace(old, new)
                total_replacements += count
        if content != original:
            with open(path, "w", encoding="utf-8") as h:
                h.write(content)
            print(f"Updated {os.path.basename(path)}")
    print(f"\nTotal replacements: {total_replacements}")
    return 0


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "."
    sys.exit(main(target))
