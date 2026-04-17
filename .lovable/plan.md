
The user wants the 3 secondary buttons (Share, Save, Visited) to all fit on one row at 390px viewport width, while staying aligned with the 2 primary buttons below (Call Now, Directions).

## Current constraints

At 390px viewport with 20px padding each side = **350px usable width**.

Current secondary button spec:
- padding: 12px 24px (48px horizontal padding total)
- font-size: 15px, weight 500
- gap between buttons: 12px
- icon + label layout

With `flex: 1`, each button gets `(350 - 24) / 3 = ~108px`. The text "Visited" + icon + 48px padding = ~115px minimum, so labels get cramped/truncated.

## What needs to change per button

To fit cleanly on one row at 390px while still feeling balanced and aligned with the 2 primary buttons below:

| Property | Current | Proposed |
|---|---|---|
| Horizontal padding | 24px | **12px** (keeps 48px height via vertical padding) |
| Gap between buttons | 12px | **8px** |
| Font size | 15px | **13px** |
| Icon size | 16-18px | **14px** |
| Icon ↔ label gap | 8px | **6px** |
| Height | 48px | **48px** (unchanged — keeps alignment with primary buttons) |
| Border radius | 24px | **24px** (unchanged — pill shape preserved) |
| Border | 1.5px solid rgba(18,18,20,0.15) | unchanged |
| Font weight | 500 | unchanged |

Result: each button ~111px wide, label "Visited" fits comfortably, row total = 333px + 16px gaps = 349px ✓ fits in 350px.

## Alignment with primary buttons

The two primary buttons below (Call Now, Directions) stay at:
- height 48px, gap 12px between them, flex:1 each

To keep visual alignment:
- Secondary row total width = primary row total width (both span full 350px) ✓
- Secondary row uses 8px gap, primary row keeps 12px gap — this is fine because the **outer edges align**, which is what the eye reads.

Alternative if you want gap consistency: keep 12px gap on secondary too — math still works (333 + 24 = 357, slightly tight, would need font-size 12px or padding 10px).

## Recommendation

Go with the table above — 13px font, 12px horizontal padding, 8px gap. Cleanest fit, labels stay legible, and the 48px height + outer alignment keeps it visually tied to the primary row below.

## Files to change

- `src/pages/ListingDetail.tsx` — update the 3 secondary button styles + the row's gap value.

