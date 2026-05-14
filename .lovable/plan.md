## My Profile page restructure

Edit `src/pages/MyProfile.tsx` only. Keep the existing olive `PAGE_BG` (`#5C6446`) theme and all existing data queries.

### 1. Top header bar
Replace the current top bar (currently 60px top padding with empty left and a settings button right) with a 3-column grid:

- 60px top padding before any content
- Left column: empty spacer
- Center column: text "Profile" — Helvetica Neue, weight 400, 20px, color CREAM, letter-spacing 0.01em
- Right column: existing circular Settings button (links to `/my-account`), aligned right

### 2. Profile section (matches the attached screenshot)
Keep the existing block as-is:

- Avatar (84px circle) on the left
- Name + small "Edit" pill (links to `/account-settings/info`) inline
- `@username` underneath in muted cream
- Stats row below: Followers · Following · Saved (each linking as it does today)

No styling changes here beyond what's already there.

### 3. Replace lower content with 3 top tabs
Delete the current `finds`, `events`, `deals`, `activity`, and "privacy hint" sections (lines ~512–943) entirely. The activity timeline query and its helpers can be removed too since nothing else uses them.

Add a Search-style top tab bar with three tabs (top-level only — no sub-pills, no search input):

- Tabs: **Listings**, **Deals**, **Events**
- Same visual pattern as `Search.tsx` (lines 100–139): full-width row, 1px bottom divider, active label bold INK with a 2px PRIMARY underline; inactive muted. Adapted to the cream/olive theme (active = CREAM bold + CREAM underline; inactive = CREAM @ 50% opacity).
- State: `const [tab, setTab] = useState<"listings" | "deals" | "events">("listings")`

Below the tab bar, render the matching saved content:

- **Listings** → existing `saved` carousel/grid markup (currently the "finds" section)
- **Deals** → existing `savedSpecials` markup
- **Events** → existing `savedEvents` markup

Reuse the existing card styling and `handleUnsave` logic; just drop them inside the active tab panel instead of three separate stacked sections. Show the existing empty-state copy when a tab has no items.

### Technical notes
- File touched: `src/pages/MyProfile.tsx`
- No backend, route, or data-model changes
- Remove now-unused imports (`MapPin`, `SERIF` constant if no other usage, `activity` query) after the cleanup
- Bottom padding of 100px on the page container stays
