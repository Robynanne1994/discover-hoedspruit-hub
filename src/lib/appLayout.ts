/**
 * How wide the app actually paints, and how wide each card in it comes out.
 *
 * Every image slot whose box "follows the viewport" used to hand-type a width
 * worked out on a 390pt phone — `(390 − 40 − 18) / 2 = 166` for a category
 * card, and so on. That number was never what the screen showed: App.tsx wraps
 * every non-admin route in `mx-auto w-full max-w-[480px]`, so the shell stops
 * growing at 480px and a category card is **211px** wide in any browser window
 * wider than that, not 166.
 *
 * The crop guides are scaled by `frame width ÷ box width`, so a box that is
 * 27% too narrow draws the rating chip and the heart 27% too big and 27% too
 * far down the picture. That is exactly the "the guides sit lower than the real
 * card" mismatch: the chrome is a *fixed* pixel size, so the wider the card
 * gets the smaller a share of the picture it covers.
 *
 * Everything viewport-dependent is therefore derived here, from one shell width
 * and one grid description per screen, and the editor previews at a viewport
 * you pick rather than a viewport somebody assumed.
 */

/**
 * The shell's ceiling — `max-w-[480px]` in App.tsx's `ConditionalMain`.
 *
 * Keep the two in step: `appLayout.test.ts` reads App.tsx and fails if the
 * class and this constant drift apart.
 */
export const APP_SHELL_MAX_WIDTH = 480;

/** The width of the app's own column at a given device width. */
export const shellWidth = (viewport: number) => Math.min(viewport, APP_SHELL_MAX_WIDTH);

/**
 * A device the editor can preview at.
 *
 * `safeTop` is the status-bar inset the OS reports to the webview — it is what
 * `--safe-top` resolves to, and the detail hero's floating buttons are pushed
 * down by it. A browser has none, which is why the same hero looks different on
 * a desktop tab and on a notched phone.
 */
export type PreviewViewport = {
  width: number;
  label: string;
  hint: string;
  safeTop: number;
};

export const PREVIEW_VIEWPORTS: PreviewViewport[] = [
  { width: 360, label: "360", hint: "Small Android", safeTop: 24 },
  { width: 390, label: "390", hint: "iPhone 14 / 15", safeTop: 47 },
  { width: 430, label: "430", hint: "iPhone Pro Max", safeTop: 59 },
  { width: 480, label: "480+", hint: "Tablet, desktop — the shell's widest", safeTop: 0 },
];

/**
 * What the editor previews at unless you say otherwise.
 *
 * The shell caps at 480, so this is both the widest a card ever gets and what
 * every browser window past 480px shows — which is where the admin is when the
 * front end is open in the next tab.
 */
export const DEFAULT_PREVIEW_WIDTH = APP_SHELL_MAX_WIDTH;

export const previewViewport = (width: number): PreviewViewport =>
  PREVIEW_VIEWPORTS.find((v) => v.width === width) ??
  PREVIEW_VIEWPORTS[PREVIEW_VIEWPORTS.length - 1];

/** A two-up (or more) card grid: page inset, gutter between cards, columns. */
export type GridLayout = { pageInset: number; gutter: number; columns: number };

/** CategoryPage.tsx — `paddingLeft/Right: 20`, `gap: 18`, `1fr 1fr`. */
export const CATEGORY_CARD_GRID: GridLayout = { pageInset: 20, gutter: 18, columns: 2 };

/** MyProfile / UserSaved / UserProfile — `padding: 20`, `gap: 12`, `1fr 1fr`. */
export const SAVED_CARD_GRID: GridLayout = { pageInset: 20, gutter: 12, columns: 2 };

/** Specials.tsx — `padding: 20`, `gap: 12`, `1fr 1fr`. */
export const SPECIALS_CARD_GRID: GridLayout = { pageInset: 20, gutter: 12, columns: 2 };

/** One card's width in that grid, at a given device width. */
export const gridCardWidth = (grid: GridLayout, viewport: number) =>
  (shellWidth(viewport) - grid.pageInset * 2 - grid.gutter * (grid.columns - 1)) / grid.columns;

/** A full-bleed image — a detail hero — at a given device width. */
export const fullBleedWidth = (viewport: number) => shellWidth(viewport);

/** A page-inset block, e.g. the featured specials card inside its 20px gutters. */
export const insetWidth = (pageInset: number, viewport: number) =>
  shellWidth(viewport) - pageInset * 2;
