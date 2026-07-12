Plan: Restyle the SpecialCard footer on `/specials` to match the uploaded screenshot.

Scope
- File: `src/pages/Specials.tsx`
- Component: `SpecialCard` footer only (the bottom row with clock icon, validity text, and price/savings pill).

Changes
1. Split validity text into two lines:
   - Add a helper (or extend `formatValidTill`) that returns a `{ primary, secondary }` object.
   - `Ongoing` → primary "Ongoing", secondary "No expiry".
   - `Valid until <date>` → primary "Valid until", secondary "<date>".
   - `Valid for <date>` → primary "Valid for", secondary "<date>".
   - Top line is rendered slightly darker/bolder; bottom line is smaller and muted.
2. Icon treatment:
   - Wrap the `Clock` icon in a light cream circular background so it sits beside both text lines.
   - Size the icon to fit the two-line height (e.g. 16–18px inside a 32–36px circle).
3. Add a vertical divider:
   - 1px line between the validity block and the price pill, using the existing divider colour (`COLOR.divider` / `#EAE4D5`).
4. Restyle the price/savings pill:
   - Background: olive green (e.g. `#6B7C5C`).
   - Text: white, bold, uppercase, small tracking.
   - Height/padding sized to match the two-line validity block height.
5. Keep existing fonts (Helvetica Neue), card background, and corner radii; only the footer row changes.

No other pages or components are affected. A typecheck will be run after the edit.