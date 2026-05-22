/**
 * Proposal PDF renderer (react-pdf).
 *
 * Faithful port of the Python ReportLab reference to @react-pdf/renderer.
 * Pure functional component tree — feed a ProposalData object, get a PDF.
 *
 * Brand custom drawing implemented in SVG:
 *   - X logo: two diagonal <Line>s with rounded caps
 *   - Radial glow: SVG <radialGradient> with power-curve stops
 *   - Star: 10-point polygon path
 *
 * Custom fonts (Manrope, 5 weights) registered from /public/fonts at module
 * load time. On Vercel server runtime, react-pdf reads them via the local
 * filesystem.
 */

import path from "node:path";
import {
  Document,
  Font,
  Page,
  Path,
  Rect,
  Svg,
  Defs,
  RadialGradient,
  Stop,
  Line,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";

import type { Deliverable, ProposalData } from "./types";

// ─── FONTS ──────────────────────────────────────────────────────────────────

const FONT_DIR = path.join(process.cwd(), "public", "fonts");

Font.register({
  family: "Manrope",
  fonts: [
    { src: path.join(FONT_DIR, "Manrope-Regular.ttf"), fontWeight: 400 },
    { src: path.join(FONT_DIR, "Manrope-Medium.ttf"), fontWeight: 500 },
    { src: path.join(FONT_DIR, "Manrope-SemiBold.ttf"), fontWeight: 600 },
    { src: path.join(FONT_DIR, "Manrope-Bold.ttf"), fontWeight: 700 },
    { src: path.join(FONT_DIR, "Manrope-ExtraBold.ttf"), fontWeight: 800 },
  ],
});

// ─── BRAND TOKENS ───────────────────────────────────────────────────────────

const C = {
  darkBg: "#0a0807",
  darkCard: "#161311",
  orange: "#f58327",
  orangeDk: "#d96d18",
  offWhite: "#f8f8f5",
  white: "#ffffff",
  midGray: "#8a8580",
  lightGray: "#c9c4be",
  border: "#2a2522",
  borderLt: "#3a3530",
};

// ─── STYLES ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Page chrome
  page: {
    fontFamily: "Manrope",
    backgroundColor: C.darkBg,
    color: C.offWhite,
    padding: 0,
  },
  pageIner: {
    paddingTop: 76,
    paddingBottom: 60,
    paddingHorizontal: 56,
    flexGrow: 1,
  },
  pageCover: {
    paddingTop: 84,
    paddingBottom: 44,
    paddingHorizontal: 56,
    flexGrow: 1,
  },

  // Eyebrow label
  eyebrow: {
    color: C.orange,
    fontSize: 8.5,
    fontWeight: 700,
    letterSpacing: 1.4,
    marginBottom: 14,
  },

  // Hero (cover)
  hero: {
    color: C.offWhite,
    fontSize: 40,
    fontWeight: 800,
    lineHeight: 1.06,
    letterSpacing: -0.6,
    marginBottom: 18,
  },
  heroAccent: { color: C.orange },

  // Section H1 (inner pages)
  h1: {
    color: C.offWhite,
    fontSize: 24,
    fontWeight: 800,
    lineHeight: 1.18,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  h1Accent: { color: C.orange },

  // Body / sublead
  sublead: {
    color: C.lightGray,
    fontSize: 11.5,
    fontWeight: 500,
    lineHeight: 1.55,
    marginBottom: 22,
    maxWidth: 360,
  },
  intro: {
    color: C.lightGray,
    fontSize: 10.5,
    fontWeight: 500,
    lineHeight: 1.58,
    marginBottom: 18,
    maxWidth: 460,
  },

  // Cover info row labels
  infoLabel: {
    color: C.midGray,
    fontSize: 7.5,
    fontWeight: 700,
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  infoValue: {
    color: C.offWhite,
    fontSize: 10,
    fontWeight: 600,
  },

  // Reviews badge (cover, next to pill)
  reviewsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderColor: C.borderLt,
    borderWidth: 0.6,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  reviewsLabel: {
    color: C.offWhite,
    fontSize: 9.5,
    fontWeight: 600,
  },

  // Pill button (cover CTA + inner CTAs)
  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 28,
  },

  // Deliverables grid — explicit two-row × two-column layout. Using
  // flex:1 on each card with `gap` on the parent rows is more reliable
  // in react-pdf than flexWrap with percent widths (which silently
  // stacks cards vertically in some layouts).
  grid: {
    flexDirection: "column",
    gap: 14,
  },
  gridRow: {
    flexDirection: "row",
    gap: 14,
  },
  deliverableCard: {
    flex: 1,
    borderColor: C.border,
    borderWidth: 0.6,
    borderRadius: 10,
    padding: 16,
  },
  deliverableNum: {
    color: C.orange,
    fontSize: 28,
    fontWeight: 800,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  deliverableTitle: {
    color: C.offWhite,
    fontSize: 11.5,
    fontWeight: 700,
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 4,
  },
  bulletDot: {
    color: C.orange,
    fontSize: 8,
    fontWeight: 700,
    width: 8,
    marginTop: 3,
  },
  bulletText: {
    color: C.lightGray,
    fontSize: 8.5,
    fontWeight: 500,
    lineHeight: 1.45,
    flex: 1,
  },

  // Pricing cards
  priceRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 24,
  },
  priceCard: {
    flex: 1,
    borderRadius: 14,
    padding: 22,
    minHeight: 168,
  },
  priceCardOutline: {
    borderColor: C.border,
    borderWidth: 0.7,
    backgroundColor: "transparent",
  },
  priceCardFilled: {
    backgroundColor: C.orange,
    color: C.darkBg,
  },
  priceLabel: {
    fontSize: 8.5,
    fontWeight: 700,
    letterSpacing: 1.4,
    marginBottom: 14,
  },
  priceAmount: {
    fontSize: 30,
    fontWeight: 800,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  priceSubtitle: {
    fontSize: 9.5,
    fontWeight: 600,
    marginBottom: 14,
  },
  priceDescription: {
    fontSize: 9,
    fontWeight: 500,
    lineHeight: 1.5,
  },

  // Pricing summary table
  summaryTable: {
    borderColor: C.border,
    borderWidth: 0.6,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 11,
    borderBottomColor: C.border,
    borderBottomWidth: 0.6,
  },
  summaryRowLast: {
    borderBottomWidth: 0,
  },
  summaryLabel: {
    color: C.midGray,
    fontSize: 9.5,
    fontWeight: 600,
    letterSpacing: 0.4,
  },
  summaryValue: {
    color: C.offWhite,
    fontSize: 9.5,
    fontWeight: 700,
  },

  // Next-step rows
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 20,
    paddingVertical: 14,
    borderBottomColor: C.border,
    borderBottomWidth: 0.6,
  },
  stepNum: {
    color: C.orange,
    fontSize: 26,
    fontWeight: 800,
    width: 56,
    letterSpacing: -0.5,
  },
  stepBody: {
    flex: 1,
  },
  stepTitle: {
    color: C.offWhite,
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 4,
  },
  stepDesc: {
    color: C.lightGray,
    fontSize: 9.5,
    fontWeight: 500,
    lineHeight: 1.5,
  },

  // CTA box on page 4
  ctaBox: {
    marginTop: 22,
    borderColor: C.borderLt,
    borderWidth: 0.7,
    borderRadius: 14,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: "center",
  },
  ctaHeadline: {
    color: C.offWhite,
    fontSize: 22,
    fontWeight: 800,
    textAlign: "center",
    lineHeight: 1.2,
    marginBottom: 8,
  },
  ctaSub: {
    color: C.lightGray,
    fontSize: 10.5,
    fontWeight: 500,
    textAlign: "center",
    marginBottom: 18,
    maxWidth: 360,
  },
  ctaButtons: {
    flexDirection: "row",
    gap: 12,
  },
});

// ─── HELPERS ────────────────────────────────────────────────────────────────

/**
 * Render text with {{accent}}word{{/accent}} markers replaced by orange spans.
 * Returns an array of <Text> children mixing default + accent styles.
 */
function AccentText({
  children,
  baseStyle,
  accentStyle,
}: {
  children: string;
  baseStyle: Style;
  accentStyle: Style;
}): React.ReactElement {
  const parts: Array<{ text: string; accent: boolean }> = [];
  const regex = /\{\{accent\}\}([\s\S]*?)\{\{\/accent\}\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(children)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: children.slice(lastIndex, match.index), accent: false });
    }
    parts.push({ text: match[1] ?? "", accent: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < children.length) {
    parts.push({ text: children.slice(lastIndex), accent: false });
  }
  return (
    <Text style={baseStyle}>
      {parts.map((p, i) => (
        <Text key={i} style={p.accent ? accentStyle : undefined}>
          {p.text}
        </Text>
      ))}
    </Text>
  );
}

function Pill({
  label,
  variant = "primary",
}: {
  label: string;
  variant?: "primary" | "dark" | "ghost";
}) {
  const bg =
    variant === "primary"
      ? C.orange
      : variant === "dark"
        ? C.darkCard
        : "transparent";
  const fg = variant === "primary" ? C.darkBg : C.offWhite;
  const border = variant === "ghost" ? C.borderLt : "transparent";
  return (
    <View
      style={{
        backgroundColor: bg,
        borderColor: border,
        borderWidth: variant === "ghost" ? 0.7 : 0,
        borderRadius: 22,
        paddingHorizontal: 18,
        paddingVertical: 11,
      }}
    >
      <Text style={{ color: fg, fontSize: 10.5, fontWeight: 700 }}>{label}</Text>
    </View>
  );
}

// SVG glow: a single radial gradient circle, alpha-stopped on a power curve.
function Glow({
  cx,
  cy,
  r,
  maxAlpha,
}: {
  cx: number;
  cy: number;
  r: number;
  maxAlpha: number;
}) {
  const id = `g${cx}-${cy}-${r}`.replace(/[.\-]/g, "");
  // Approximate the ReportLab power-curve falloff (alpha = max * ((s-i+1)/s)^2.5)
  // with a few stops on a single radial gradient.
  const stops = [
    [0, maxAlpha],
    [0.18, maxAlpha * 0.7],
    [0.38, maxAlpha * 0.42],
    [0.6, maxAlpha * 0.18],
    [0.8, maxAlpha * 0.05],
    [1, 0],
  ] as const;
  return (
    <>
      <Defs>
        <RadialGradient
          id={id}
          cx={String(cx)}
          cy={String(cy)}
          r={String(r)}
          fx={String(cx)}
          fy={String(cy)}
          gradientUnits="userSpaceOnUse"
        >
          {stops.map(([offset, alpha], i) => (
            <Stop
              key={i}
              offset={`${offset * 100}%`}
              stopColor={C.orange}
              stopOpacity={String(alpha)}
            />
          ))}
        </RadialGradient>
      </Defs>
      <Rect
        x={String(cx - r)}
        y={String(cy - r)}
        width={String(r * 2)}
        height={String(r * 2)}
        fill={`url(#${id})`}
      />
    </>
  );
}

// X logo: two diagonals, square caps.
function XLogo({ size = 32 }: { size?: number }) {
  const half = size / 2;
  const sw = size * 0.25;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Line
        x1={String(sw / 2)}
        y1={String(sw / 2)}
        x2={String(size - sw / 2)}
        y2={String(size - sw / 2)}
        stroke={C.orange}
        strokeWidth={String(sw)}
        strokeLinecap="square"
      />
      <Line
        x1={String(sw / 2)}
        y1={String(size - sw / 2)}
        x2={String(size - sw / 2)}
        y2={String(sw / 2)}
        stroke={C.orange}
        strokeWidth={String(sw)}
        strokeLinecap="square"
      />
    </Svg>
  );
}

// 5-point star path used in the reviews badge.
function Star({ size = 9 }: { size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const outer = size / 2;
  const inner = outer * 0.4;
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? outer : inner;
    const x = cx + r * Math.cos(angle);
    const y = cy - r * Math.sin(angle);
    pts.push(`${i === 0 ? "M" : "L"} ${x} ${y}`);
  }
  pts.push("Z");
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Path d={pts.join(" ")} fill={C.orange} />
    </Svg>
  );
}

// Page background — dark fill + corner glows. Different geometry for cover vs inner.
// Wrapped in a `fixed` View so it repeats on every page when content overflows,
// otherwise overflow pages render on white (which destroys the look).
function PageBackground({ variant }: { variant: "cover" | "inner" }) {
  // A4 in PDF points: 595.28 × 841.89
  const W = 595;
  const H = 842;
  return (
    <View
      fixed
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <Rect x="0" y="0" width={W} height={H} fill={C.darkBg} />
        {variant === "cover" ? (
          <>
            {/* Bottom-left big glow, positioned off-page so only the soft edge bleeds in */}
            <Glow cx={W * -0.25} cy={H * 1.2} r={680} maxAlpha={0.55} />
            {/* Right-edge mid glow */}
            <Glow cx={W * 1.15} cy={H * 0.9} r={420} maxAlpha={0.32} />
          </>
        ) : (
          <Glow cx={W * 1.05} cy={H * 0.05} r={300} maxAlpha={0.08} />
        )}
      </Svg>
    </View>
  );
}

// Header strip on inner pages.
function InerHeader({ clientName }: { clientName: string }) {
  return (
    <View
      style={{
        position: "absolute",
        top: 30,
        left: 56,
        right: 56,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 12,
        borderBottomColor: C.border,
        borderBottomWidth: 0.5,
      }}
      fixed
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
        <XLogo size={20} />
        <Text style={{ color: C.offWhite, fontSize: 9, fontWeight: 700 }}>
          FX MEDIA
        </Text>
      </View>
      <Text
        style={{
          color: C.midGray,
          fontSize: 8,
          fontWeight: 500,
          letterSpacing: 0.6,
        }}
      >
        {clientName.toUpperCase()} · TILBUD
      </Text>
    </View>
  );
}

function PageFooter({ variant }: { variant: "cover" | "inner" }) {
  return (
    <View
      style={{
        position: "absolute",
        bottom: 30,
        left: 56,
        right: 56,
        flexDirection: "row",
        justifyContent: "space-between",
      }}
      fixed
      render={({ pageNumber }) => (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Text
            style={{
              color: variant === "cover" ? C.offWhite : C.midGray,
              fontSize: 7.5,
              fontWeight: 500,
            }}
          >
            FX MEDIA · fx-media.no · info@fx-media.no · +47 401 85 596
          </Text>
          {variant === "inner" ? (
            <Text style={{ color: C.midGray, fontSize: 7.5, fontWeight: 500 }}>
              {pageNumber}
            </Text>
          ) : null}
        </View>
      )}
    />
  );
}

// ─── PAGES ──────────────────────────────────────────────────────────────────

function CoverPage({ data }: { data: ProposalData }) {
  return (
    <Page size="A4" style={styles.page}>
      <PageBackground variant="cover" />

      {/* Cover top: logo top-left, date top-right */}
      <View
        style={{
          position: "absolute",
          top: 36,
          left: 56,
          right: 56,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <XLogo size={32} />
        <Text
          style={{
            color: C.midGray,
            fontSize: 8,
            fontWeight: 500,
            letterSpacing: 1.4,
          }}
        >
          TILBUD · {data.proposal_date.toUpperCase()}
        </Text>
      </View>

      <View style={[styles.pageCover, { marginTop: 90 }]}>
        <Text style={styles.eyebrow}>{data.eyebrow}</Text>
        <AccentText baseStyle={styles.hero} accentStyle={styles.heroAccent}>
          {data.hero}
        </AccentText>
        <Text style={styles.sublead}>{data.sublead}</Text>

        <View style={styles.pillRow}>
          <Pill label="Be om gratis tilbud" variant="primary" />
          <View style={styles.reviewsBadge}>
            <View style={{ flexDirection: "row", gap: 1 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} size={9} />
              ))}
            </View>
            <Text style={styles.reviewsLabel}>5,0 · 35+ kunder</Text>
          </View>
        </View>

        {/* Info row */}
        <View
          style={{
            flexDirection: "row",
            gap: 36,
            marginTop: 14,
            paddingTop: 22,
            borderTopColor: C.border,
            borderTopWidth: 0.5,
          }}
        >
          <View>
            <Text style={styles.infoLabel}>FOR</Text>
            <Text style={styles.infoValue}>{data.client_name}</Text>
          </View>
          <View>
            <Text style={styles.infoLabel}>KONTAKT</Text>
            <Text style={styles.infoValue}>{data.client_contact || "—"}</Text>
          </View>
          <View>
            <Text style={styles.infoLabel}>UTARBEIDET AV</Text>
            <Text style={styles.infoValue}>FX Media</Text>
          </View>
        </View>
      </View>

      <PageFooter variant="cover" />
    </Page>
  );
}

function DeliverableCard({ d }: { d: Deliverable }) {
  return (
    <View style={styles.deliverableCard}>
      <Text style={styles.deliverableNum}>{d.num}</Text>
      <Text style={styles.deliverableTitle}>{d.title}</Text>
      {d.bullets.map((b, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{b}</Text>
        </View>
      ))}
    </View>
  );
}

function DeliverablesPage({ data }: { data: ProposalData }) {
  return (
    <Page size="A4" style={styles.page}>
      <PageBackground variant="inner" />
      <InerHeader clientName={data.client_name} />

      <View style={styles.pageIner}>
        <Text style={styles.eyebrow}>HVA ER INKLUDERT</Text>
        <AccentText baseStyle={styles.h1} accentStyle={styles.h1Accent}>
          {"Det vi {{accent}}leverer{{/accent}}."}
        </AccentText>
        <Text style={styles.intro}>{data.deliverables_intro}</Text>

        <View
          style={{
            borderTopColor: C.border,
            borderTopWidth: 0.5,
            marginBottom: 22,
          }}
        />

        <View style={styles.grid}>
          <View style={styles.gridRow}>
            {data.deliverables.slice(0, 2).map((d, i) => (
              <DeliverableCard key={i} d={d} />
            ))}
          </View>
          <View style={styles.gridRow}>
            {data.deliverables.slice(2, 4).map((d, i) => (
              <DeliverableCard key={i + 2} d={d} />
            ))}
          </View>
        </View>
      </View>

      <PageFooter variant="inner" />
    </Page>
  );
}

function PricingPage({ data }: { data: ProposalData }) {
  const last = data.pricing.summary_rows.length - 1;
  return (
    <Page size="A4" style={styles.page}>
      <PageBackground variant="inner" />
      <InerHeader clientName={data.client_name} />

      <View style={styles.pageIner}>
        <Text style={styles.eyebrow}>INVESTERING</Text>
        <AccentText baseStyle={styles.h1} accentStyle={styles.h1Accent}>
          {"Klar pris, {{accent}}none overraskelser{{/accent}}."}
        </AccentText>
        <Text style={styles.intro}>{data.pricing.intro}</Text>

        <View style={styles.priceRow}>
          <View style={[styles.priceCard, styles.priceCardOutline]}>
            <Text style={[styles.priceLabel, { color: C.orange }]}>
              {data.pricing.left_card.label}
            </Text>
            <Text style={[styles.priceAmount, { color: C.offWhite }]}>
              {data.pricing.left_card.amount}
            </Text>
            <Text style={[styles.priceSubtitle, { color: C.lightGray }]}>
              {data.pricing.left_card.subtitle}
            </Text>
            <Text style={[styles.priceDescription, { color: C.lightGray }]}>
              {data.pricing.left_card.description}
            </Text>
          </View>
          <View style={[styles.priceCard, styles.priceCardFilled]}>
            <Text style={[styles.priceLabel, { color: C.darkBg, opacity: 0.7 }]}>
              {data.pricing.right_card.label}
            </Text>
            <Text style={[styles.priceAmount, { color: C.darkBg }]}>
              {data.pricing.right_card.amount}
            </Text>
            <Text style={[styles.priceSubtitle, { color: C.darkBg }]}>
              {data.pricing.right_card.subtitle}
            </Text>
            <Text style={[styles.priceDescription, { color: C.darkBg }]}>
              {data.pricing.right_card.description}
            </Text>
          </View>
        </View>

        <View style={styles.summaryTable}>
          {data.pricing.summary_rows.map((row, i) => (
            <View
              key={i}
              style={[
                styles.summaryRow,
                i === last ? styles.summaryRowLast : {},
              ]}
            >
              <Text style={styles.summaryLabel}>{row.label.toUpperCase()}</Text>
              <Text style={styles.summaryValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <PageFooter variant="inner" />
    </Page>
  );
}

function NextStepsPage({ data }: { data: ProposalData }) {
  return (
    <Page size="A4" style={styles.page}>
      <PageBackground variant="inner" />
      <InerHeader clientName={data.client_name} />

      <View style={styles.pageIner}>
        <Text style={styles.eyebrow}>NESTE STEG</Text>
        <AccentText baseStyle={styles.h1} accentStyle={styles.h1Accent}>
          {"Slik kommer vi {{accent}}i gang{{/accent}}."}
        </AccentText>
        <Text style={styles.intro}>{data.next_steps.intro}</Text>

        <View>
          {data.next_steps.steps.map((s) => (
            <View key={s.num} style={styles.stepRow}>
              <Text style={styles.stepNum}>{s.num}</Text>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA box */}
        <View style={styles.ctaBox}>
          <AccentText
            baseStyle={styles.ctaHeadline}
            accentStyle={styles.h1Accent}
          >
            {data.cta.headline}
          </AccentText>
          <Text style={styles.ctaSub}>{data.cta.subtext}</Text>
          <View style={styles.ctaButtons}>
            <Pill label={data.cta.primary} variant="primary" />
            <Pill label={data.cta.secondary} variant="ghost" />
          </View>
        </View>
      </View>

      <PageFooter variant="inner" />
    </Page>
  );
}

// ─── PUBLIC ENTRY ────────────────────────────────────────────────────────────

export function ProposalDocument({ data }: { data: ProposalData }) {
  return (
    <Document
      title={`FX Media – ${data.proposal_title} – ${data.client_name}`}
      author="FX Media"
    >
      <CoverPage data={data} />
      <DeliverablesPage data={data} />
      <PricingPage data={data} />
      <NextStepsPage data={data} />
    </Document>
  );
}
