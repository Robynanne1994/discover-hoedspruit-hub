## Goal
Update the category listing pages (`/category/:id`) so listings render as a **2-column grid** instead of the current single-column stack, matching the attached screenshot.

## Changes (frontend only)

**File:** `src/pages/CategoryPage.tsx`

1. **Grid layout**
   - Replace the current single-column list with `display: grid; gridTemplateColumns: 1fr 1fr; gap: 12px` inside the same 20px horizontal page padding.

2. **Card format (per screenshot)**
   - Card: white background, 16px radius, subtle border, `overflow: hidden`, flex column.
   - Image: full-width, `aspect-ratio: 1 / 1` (square), sits flush to the top/sides with 8px inner padding wrapper and 12px inner radius — consistent with the Categories/Explore card style already used in the app.
   - Rating pill (top-left of image) and heart save button (top-right of image) preserved but scaled down slightly to suit the smaller card (rating pill ~11px text, heart button ~28px circle).
   - Below image: title (Helvetica Neue 700, 15px, `#1A1A1A`, wraps to 2 lines, no ellipsis truncation of words), subcategory line (10px uppercase eyebrow, `#6B6A5E`, single line with ellipsis), location row with `MapPin` icon (12px, `#6B6A5E`), open/closed status row (small dot + label, existing colors).
   - Consistent internal padding: 12px sides, 10px bottom.

3. **Preserved behaviour**
   - All existing filters, sorting, "Open Now" / "Saved" pills, refine drawer, search, header, empty/error states, skeletons, and data queries stay unchanged.
   - Save/favourite, navigation to detail, and title display helpers (`getDisplayTitle`, `noTitleCaseProps`) unchanged.
   - Loading skeletons updated to render in the same 2-column grid so the placeholder matches the new layout.

## Out of scope
- No backend, data model, or query changes.
- Categories index page (`/categories`) already uses a 2-column grid — no changes there.
- Other list pages (Events, Specials, Search) unchanged.
