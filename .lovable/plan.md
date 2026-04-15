

## My Hoedspruit Layout Change

### Current layout
- Column 1: 3 cards (flex 5, 4, 3)
- Column 2: 2 cards (flex 3, 5)

### New layout
- **Column 1**: 2 cards — 1 tall card (Saved Listings) + 1 square card (Saved Specials)
- **Column 2**: 3 cards — 3 equal square cards (My Events, Visited Places, Coming Soon)
- The tall card spans the height of exactly 2 square cards + 1 gap (10px)
- All square cards are equal height using `flex: 1`
- The tall card uses `flex: 2` plus accounts for the gap to match

### File change: `src/pages/MyHoedspruit.tsx`

1. Remove `flex` property from card definitions (no longer needed per-card)
2. Reassign columns:
   - `leftCards = [cards[0], cards[2]]` — Saved Listings (tall), Saved Specials (square)
   - `rightCards = [cards[1], cards[3], cards[4]]` — My Events, Visited Places, Coming Soon
3. Render left column: first card gets `flex: 2`, second gets `flex: 1`
4. Render right column: all three cards get `flex: 1`
5. Both columns remain `display: flex, flexDirection: column, gap: 10`

This ensures the tall card in column 1 is exactly the height of 2 square cards stacked, and all 5 cards fill the screen.

