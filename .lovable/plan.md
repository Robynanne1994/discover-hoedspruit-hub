## What's causing the flashing/tweaking

When `backdrop-filter: blur(...)` sits over content that changes (scrolling lists, fading images, route transitions), the browser must re-sample and re-blur every pixel underneath on every frame. That cost compounds and produces the shimmer/wobble you're seeing as you interact.

The biggest offender is the persistent **BottomNav** (`src/components/BottomNav.tsx`), which is on every screen and applies a heavy `blur(28px) saturate(180%)` to the whole bar **plus** a second `blur(12px)` to the active pill **plus** a `transition: flex 200ms` that animates `flex-grow` — that animation forces a layout reflow on every frame, while the parent blur re-samples on every one of those frames. Result: the whole nav (and content behind it) appears to "tweak" whenever you tap a tab or scroll.

Secondary blur layers also contribute on specific screens: `CategoryPage` sticky filter bar (`blur(10px)`), and small `blur(2px)` overlays in `AccountInfo`, `NotificationsDropdown`, `GlobalMenu`, plus `bg-background/80 backdrop-blur` on `WeatherSection`.

## Fix

### 1. BottomNav — remove blur, use solid surface (matches the saved design rule of a 74px #48484a bar)
- Replace the translucent dark background + `backdropFilter: blur(28px) saturate(180%)` with a solid `#48484a` background (no `backdrop-filter`, no `WebkitBackdropFilter`).
- Drop the active-pill `backdropFilter: blur(12px)` entirely; keep the white pill background and shadow.
- Remove `flex` from the `transition` shorthand so the active pill no longer animates `flex-grow` (which is what causes the per-frame reflow). Keep `background` and `padding` transitions for a clean tap feedback, or use a fixed pill width so layout doesn't shift at all.

### 2. CategoryPage sticky filter bar
- In `src/pages/CategoryPage.tsx` (line ~188), drop `backdropFilter: "blur(10px)"` and use a solid `hsl(var(--background))` background instead. The bar is sticky over scrolling content, which is the classic worst case for backdrop-blur.

### 3. WeatherSection card
- In `src/components/WeatherSection.tsx` (line ~96), replace `bg-background/80 backdrop-blur` with a solid `bg-card` (or `bg-background`). It sits over a gradient that re-renders frequently with weather updates.

### 4. Lightweight overlay blurs (low priority but worth removing for consistency)
- `src/components/NotificationsDropdown.tsx`, `src/components/GlobalMenu.tsx`, `src/pages/AccountInfo.tsx`: replace `backdropFilter: "blur(2px)"` on the dimming overlay with a slightly more opaque solid color (e.g. `rgba(0,0,0,0.35)`). The blur adds no visual value at 2px and still triggers per-frame re-sampling.

### 5. Leave alone
- `FavouriteButton`, `ShareButton` small icon chips with `backdrop-blur-sm` — they sit on static image cards and are tiny, so the cost is negligible.
- shadcn `transition-all` utility classes — these only animate properties on hover/focus of small elements and aren't the source of the global "tweaking".

## Files to edit

- `src/components/BottomNav.tsx` — remove both `backdropFilter` calls, switch background to solid `#48484a`, remove `flex` from the pill transition.
- `src/pages/CategoryPage.tsx` — remove `backdropFilter: "blur(10px)"` from the sticky bar.
- `src/components/WeatherSection.tsx` — swap the translucent + blur background for a solid surface.
- `src/components/NotificationsDropdown.tsx`, `src/components/GlobalMenu.tsx`, `src/pages/AccountInfo.tsx` — remove the `blur(2px)` from the dim overlay.

## Out of scope

No business logic, data fetching, routing, or layout changes. Visual changes are limited to swapping translucent-blur surfaces for solid ones and removing one layout-animating transition, so behaviour stays identical apart from the wobble going away.
