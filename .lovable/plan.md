## Redesign: My Notifications page

Update `src/pages/MyNotifications.tsx` only. Keep all existing logic (data fetch, realtime, mark-as-read after 1.5s, initial-unread highlighting, navigation links). Only the visual layer changes.

### Colors & type
- Page background: `#E6E0CC` (matches Events / Category pages)
- Card background: `#FFFFFF`, border-radius 16px, no shadow, 1px hairline border `rgba(0,0,0,0.06)`
- Ink `#020202`, muted `#6B6A5E`
- Helvetica Neue weight 400 throughout (per project core rules); titles weight 700
- 20px horizontal page padding, 100px bottom padding

### Top bar
- Background `#E6E0CC`, no bottom border
- Center: title "Notifications" (bold, ~20px) with eyebrow line below showing `{n} UNREAD` in 11px tracked uppercase muted (hidden when 0)
- Left: circular 40px white button containing `BackArrowIcon` → `navigate(-1)`
- Right: circular 40px white button containing a "double-check" mark icon (`CheckCheck` from lucide-react) → marks all unread as read immediately (calls supabase update on currently-unread ids, then `load()`). Tooltip/aria "Mark all as read". Disabled/dim when no unread.
- The existing Settings gear moves out of the top bar (kept accessible via Notification Preferences elsewhere; not shown on this page per the mockup).

### Sections
Replace current "New / Earlier" grouping with date buckets derived from `created_at`:
- **Today** — same calendar day
- **Yesterday** — previous calendar day
- **This Week** — within last 7 days, excluding above
- **Earlier** — everything older
Section header: 15px bold ink, 20px left padding, 18px top / 10px bottom, plain on page bg (no uppercase, matches mockup).

### Notification card
- White rounded card, padding 16px, 12px vertical gap between cards
- Left: 44px rounded-square tinted icon tile
  - Tint by `kind`: deal/special → soft pink `#F8D7DE` with `#C0392B` icon; event → soft grey `#E8E6DF` with ink icon; security/alert → soft green `#D6EBDB` with `#2E7D4F` icon; welcome/profile → soft tan `#E8DCC8` with `#8B6F4B` icon; default → soft grey
  - Use existing `iconFor()` mapping for the glyph
- Middle: title (15px bold ink, 1-line wrap ok), body (13.5px, line-height 1.45, muted-ink `#3A332B`, 2-line clamp), then small uppercase timestamp `2H AGO / 5H AGO / 1D AGO / 3D AGO` in 11px tracked muted
- Right: small unread dot (8px, `#2A2A24`) top-right when card is in the initial-unread set; nothing when read
- Whole card clickable when `n.link` is set

### Timestamp helper
Add a `relativeShort(iso)` formatter: `<60m → "{n}M AGO"`, `<24h → "{n}H AGO"`, `<7d → "{n}D AGO"`, else `"{n}W AGO"` or date.

### Empty state
Keep current empty state copy, restyled on `#E6E0CC` with ink heading and muted body, icon in muted ink.

### Preserved logic
- `useAuth`, supabase fetch + realtime subscription
- `initialUnreadRef` keeps the dot visible for the session
- Auto mark-as-read after 1.5s remains
- Click navigates to `n.link` when present

No other files touched.