Redesign `src/components/BottomNav.tsx` to match the attached screenshot while keeping existing logic (icon-only when inactive, icon + label when active) and the Helvetica Neue font stack.

## Visual changes

- Bar background: change from dark `#48484a` to cream/ivory `#F5F0E8` (matches screenshot's light pill bar).
- Bar shape: rounded pill, subtle shadow, thin light border. Height ~64–68px to match the screenshot's more compact bar.
- Inactive items:
  - Icon color: dark ink `#1A1A1A` (currently white).
  - Under-icon label: HIDDEN (keep current logic — no text when inactive), even though the screenshot shows labels. Per user: "keep my logic with just icons and then text when active".
  - Stroke width ~1.75, size ~22.
- Active item:
  - Pill background: brand brown `#423324` (screenshot's dark brown pill).
  - Icon color: white, size ~22, stroke ~2.
  - Label: white, Helvetica Neue 13px, weight 600, letter-spacing 0.01em, shown to the right of the icon (current behavior preserved).
  - Pill padding tightened to match screenshot proportions (~0 14px, height ~44px).
- Spacing: even distribution across 5 items; inactive items shrink, active item expands (existing flex logic kept).

## Non-changes

- Keep 5 nav items and their routes.
- Keep active-route detection logic.
- Keep guest vs. signed-in Profile destination.
- Keep font family (Helvetica Neue).
- Do not touch any other file.