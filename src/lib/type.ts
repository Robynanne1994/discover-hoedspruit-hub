import type { CSSProperties } from "react";

/**
 * The single source of truth for typography across the app.
 *
 * Before this module existed, 61 separate files each declared their own
 * `const HN = "'Helvetica Neue'…"` and hand-wrote a size, weight and
 * letter-spacing beside it. No individual file was wrong, but 61 independent
 * copies of the same decision drifted apart: five page-title sizes, seven card
 * title sizes, eight greys all doing the job of "secondary text".
 *
 * The app styles almost everything with inline `style` objects rather than
 * Tailwind classes, so these tokens are exported as ready-made CSSProperties
 * that drop straight into that pattern:
 *
 *     <h2 style={type.sectionTitle}>Where to Eat</h2>
 *     <div style={{ ...type.cardTitleM, marginBottom: 4 }}>{title}</div>
 *
 * Only two families ever render — Nohemi (headings) and Helvetica Neue
 * (everything else). Both are self-hosted and declared in src/index.css.
 */

/** Heading face. Weight 550 resolves through Nohemi-VF.woff2. */
export const NOHEMI = "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif";
/** Body face — everything that isn't one of the three Nohemi heading roles. */
export const HN = "'Helvetica Neue', Helvetica, Arial, sans-serif";

/** Headings, card titles, section eyebrows. */
export const INK = "#1A1A1A";
/** Paragraph copy. Slightly warmer than INK so long text sits back a touch. */
export const BODY_INK = "#2b2420";
/**
 * Metadata, field labels, placeholders.
 *
 * Replaces eight near-identical greys. Chosen over the previous majority
 * (#6B6A5E) because that value lands at 4.1:1 on the #E6E0CC page background,
 * under the 4.5:1 AA floor for small text. This clears it at 4.9:1.
 */
export const MUTED = "#5F5E52";

/**
 * Nohemi tracks wide at display size, so every heading tightens by the same
 * relative amount rather than each screen picking its own pixel value.
 */
const HEADING_TRACKING = "-0.02em";

export const type = {
  /** Hero title on detail pages and full-screen headers. */
  pageTitle: {
    fontFamily: NOHEMI,
    fontSize: 28,
    fontWeight: 550,
    lineHeight: 1.1,
    letterSpacing: HEADING_TRACKING,
    color: INK,
  },
  /** Centred title inside PageHeader. Its own role: a nav bar, not a hero. */
  navTitle: {
    fontFamily: NOHEMI,
    fontSize: 20,
    fontWeight: 550,
    lineHeight: 1,
    letterSpacing: HEADING_TRACKING,
    color: INK,
  },
  /** Section headings — home rows, detail-page sections, grouped lists. */
  sectionTitle: {
    fontFamily: NOHEMI,
    fontSize: 24,
    fontWeight: 550,
    lineHeight: 1.15,
    letterSpacing: HEADING_TRACKING,
    color: INK,
  },

  /** Full-width editorial cards, and people's names. */
  cardTitleL: {
    fontFamily: HN,
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.25,
    letterSpacing: "-0.2px",
    color: INK,
  },
  /** The default: standard list rows and grid cards. */
  cardTitleM: {
    fontFamily: HN,
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 1.25,
    letterSpacing: "-0.2px",
    color: INK,
  },
  /** Horizontal carousel tiles roughly 150px wide or narrower. */
  cardTitleS: {
    fontFamily: HN,
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.25,
    letterSpacing: "-0.1px",
    color: INK,
  },

  /** Paragraph copy. */
  body: {
    fontFamily: HN,
    fontSize: 15,
    fontWeight: 400,
    lineHeight: 1.55,
    color: BODY_INK,
  },
  /** Metadata, subtitles, counts, timestamps. */
  meta: {
    fontFamily: HN,
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 1.4,
    color: MUTED,
  },

  /** Section-level uppercase heading, e.g. "GOOD TO KNOW". */
  eyebrow: {
    fontFamily: HN,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: INK,
  },
  /** Field labels and badges, e.g. "PHONE". */
  label: {
    fontFamily: HN,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: MUTED,
  },

  /** Button and CTA text. Sits inside a 48px pill. */
  button: {
    fontFamily: HN,
    fontSize: 15,
    fontWeight: 500,
    letterSpacing: 0,
  },
  /** Filter tab / segmented control, selected. */
  tabActive: {
    fontFamily: HN,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.01em",
  },
  /** Filter tab / segmented control, unselected. */
  tabInactive: {
    fontFamily: HN,
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: "0.01em",
  },
  /** Bottom navigation label. */
  navLabel: {
    fontFamily: HN,
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.01em",
  },
  /**
   * Text inputs. Must stay at 16px or larger — Safari zooms the viewport
   * whenever a focused field is smaller than that.
   */
  input: {
    fontFamily: HN,
    fontSize: 16,
    fontWeight: 400,
    color: INK,
  },
} satisfies Record<string, CSSProperties>;

/** Convenience for the common `active ? bold : regular` tab pattern. */
export const tab = (active: boolean) => (active ? type.tabActive : type.tabInactive);

/* -------------------------------------------------------------------------
   Icon + meta text rows
   -------------------------------------------------------------------------

   Detail pages open with a small lucide icon beside a line of meta text —
   "3.3km from Town", an event's location, the business a special belongs to.

   Centring those two with `alignItems: "center"` lines up their *boxes*, and
   the boxes do not describe what the eye sees. A 14px icon centres inside the
   12px text's line box, which pushes the icon 3.7px below the text baseline —
   enough to read as a mistake at a glance.

   `alignItems: "baseline"` fixes the larger half: an SVG has no baseline of
   its own, so flexbox synthesises one at its bottom edge and sits that edge on
   the text baseline. What remains is the margin lucide leaves between a glyph
   and the edge of its 24-unit viewBox — `baselineNudge` gives that back, so
   the bottom of the icon lands on the bottom of the text exactly. */

/**
 * Translate an icon down by the empty space under its glyph.
 *
 * `ink` is where the drawing bottoms out in viewBox units: 22.875 for lucide's
 * stroked icons (a path that ends at 22, plus half of the 1.75 stroke that
 * straddles it), 21.07 for the filled Star.
 */
const baselineNudge = (size: number, ink: number) =>
  `translateY(${((size * (24 - ink)) / 24).toFixed(2)}px)`;

/** Row holding a small icon and a line of meta text. Spread `type.meta` after. */
export const metaRow: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 6,
};

/** A stroked lucide icon inside a `metaRow`. Pass its rendered px size. */
export const metaIcon = (size = 14): CSSProperties => ({
  flexShrink: 0,
  alignSelf: "baseline",
  transform: baselineNudge(size, 22.875),
});

/** A solid-filled icon (Star) inside a `metaRow` — its glyph stops higher. */
export const metaIconSolid = (size = 14): CSSProperties => ({
  flexShrink: 0,
  alignSelf: "baseline",
  transform: baselineNudge(size, 21.07),
});
