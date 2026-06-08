## What’s causing the flashing/jumping

It is probably **not just the splash screen** anymore. The splash component is no longer rendered, but it is still imported and the bigger remaining causes are:

1. **Every card heart button runs its own favourite query**
   - On category pages I saw dozens of duplicate `favourites?select=id...` requests after one click/navigation.
   - This makes the page repaint heavily and can look like a flash.

2. **Global title-case components still mutate real DOM text**
   - `TitleCaseH1` and `TitleCaseH2` scan and rewrite headings after route changes.
   - Even without the old MutationObserver, direct DOM text rewrites can still cause visible text “tweaks”.

3. **Global scroll-to-top fires on every route change**
   - This is expected for navigation, but if a click changes query params or redirects, it can feel like a jump.

4. **Large page/layout shifts on initial rendering**
   - Performance profiling shows poor layout shift and a very large logo image resource, so when data/images arrive the layout can move.

## Fix plan

### 1. Remove the splash screen completely
- Remove the unused `LoadingSplash` import from `src/App.tsx`.
- Optionally delete `src/components/LoadingSplash.tsx` if nothing imports it.
- Keep auth routing instant: never show a full-screen loading splash during normal app clicks.

### 2. Stop global title DOM rewriting
- Remove `TitleCaseH1` and `TitleCaseH2` from `src/App.tsx`.
- Stop relying on global DOM mutation for heading text.
- Keep existing CSS text-transform rules and existing `DisplayTitle`/`getDisplayTitle` logic where titles need controlled casing.

### 3. Replace per-card favourite queries with shared cached favourite IDs
- Update `FavouriteButton` to read from the existing shared `['favourites', user.id]` cache instead of querying one row per card.
- Add optimistic updates so heart clicks change instantly without forcing every card to refetch.
- Keep targeted invalidation, but avoid broad invalidation that causes whole sections to repaint.

### 4. Apply the same favourite-query pattern to category/search/special cards
- Category page currently has its own local favourite button with one query per listing.
- Search and Specials also have local favourite logic.
- Convert them to use shared saved IDs / optimistic updates so clicking hearts doesn’t trigger a cascade of network calls.

### 5. Make scroll-to-top less jumpy
- Update `ScrollToTop` so it only scrolls on actual pathname changes, not harmless query/search changes.
- Use `requestAnimationFrame` to avoid fighting route layout during render.

### 6. Verify in preview
- Test homepage, category pages, specials, search, and profile interactions.
- Confirm: no splash screen, no white flash, no heading tweak, no mass duplicate favourite requests after one click.

## Technical notes

Main files to change:
- `src/App.tsx`
- `src/components/FavouriteButton.tsx`
- `src/components/ScrollToTop.tsx`
- `src/pages/CategoryPage.tsx`
- `src/pages/Search.tsx`
- `src/pages/Specials.tsx`

Expected result: clicks should feel stable because the app will stop remounting/loading large chunks of UI and stop re-querying favourite state once per visible card.