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

/**
 * Horizontal page inset for a section eyebrow and the card it labels.
 *
 * Both need the same value or the label floats off the card's edge — which is
 * what happened on FAQs, Notifications and Contact Us, where a 24px label sat
 * above a 20px card.
 */
export const SECTION_INSET = 24;

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

  /**
   * The small caps label that sits *above* a card and names the group below
   * it — "ACCOUNT", "PERSONAL DETAILS", "POLICIES & AGREEMENTS".
   *
   * Eleven screens each hand-wrote this in Nohemi 15 and drifted: three
   * weights (700/550/400), three trackings, three gaps and two left insets,
   * with three pages whose label didn't line up with the card beneath it.
   * 15px caps in the heading face read as a second page title, so this lands
   * at 13/550 — still recognisably Nohemi, no longer competing with the
   * PageHeader. Pair it with SECTION_INSET so the label and card share an edge.
   *
   * Distinct from `eyebrow` below, which labels content *inside* a card.
   */
  sectionEyebrow: {
    fontFamily: NOHEMI,
    fontSize: 13,
    fontWeight: 550,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: INK,
    marginBottom: 10,
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
