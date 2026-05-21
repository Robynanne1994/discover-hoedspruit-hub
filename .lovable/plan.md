## Goal

Support three event shapes cleanly:

1. **Single-day** — one date, one time. (Already works.)
2. **Continuous multi-day** — e.g. festival 5–8 Dec running through. (Already works via `start_date`/`end_date`.)
3. **Multi-performance** *(new)* — same event, several separate dates/times (e.g. a musical on Fri 5 · Sat 6 · Fri 12, each at 19:30). One card, one detail page, but distinct performance dates.

Plus: **recurring events** (farmers market) should always surface as a single card showing the *next* occurrence and roll forward automatically once that date passes.

---

## Data model

Add one new column to `events`:

- `performances` — `jsonb` array of `{ date: "YYYY-MM-DD", time: "HH:mm", end_time?: "HH:mm" }` objects. Nullable. When present (length ≥ 1), the event is treated as multi-performance and `start_date` / `end_date` / `start_time` are ignored for display logic (we'll auto-derive them from the array on save so existing calendar/sort code keeps working).

Recurrence keeps using the existing `recurrence` text field (e.g. `weekly`, `monthly`, `first-saturday-monthly`). We'll formalise a small set of supported values rather than free text — see Technical section.

No breaking changes: existing events with empty `performances` behave exactly as today.

---

## Admin (Event editor)

New section "Event type" with three radio choices:
- Single date / continuous range *(current behaviour, default)*
- **Multi-performance (same event, separate dates)** → reveals a dynamic list: each row = date picker + start time + optional end time, with add/remove buttons.
- **Recurring** → reveals a recurrence rule selector (Daily, Weekly on [weekday], Monthly on [nth weekday], Monthly on [day number]) + a start date and optional end date.

When "Multi-performance" is saved, we auto-populate `start_date` = earliest performance date and `end_date` = latest, so calendar views and queries still work without changes.

---

## Frontend display

### Events list card (`Events.tsx` upcoming list + homepage "All Upcoming Events")

- **Multi-performance**: show the **next upcoming performance** as the card's date/time. Append a subtle "+N more dates" hint on the date line when there are future performances after the next one. The card stays visible until the *last* performance date passes.
- **Recurring**: compute and show the **next occurrence** date/time from the recurrence rule. After that date passes, the card auto-advances to the following occurrence. No "+N more" hint.
- **Single / continuous**: unchanged.

### Featured carousel, calendar, filters
- Calendar view: multi-performance events appear on each of their performance dates (not on the in-between days). Recurring events appear on each computed occurrence within the visible month.
- Date-filter ("events on X day"): matches if X is one of the performances / a computed recurrence occurrence / within a continuous range.

### Event detail page (`EventDetail.tsx`)

- **Multi-performance**: replace the single date row with a **"Performances"** block — a stacked list, one row per date with weekday, date, time (and end time if set). The next upcoming performance is highlighted (e.g. left border in primary brown, or a small "NEXT" tag) and past performances are dimmed. "Add to calendar" offers each upcoming performance.
- **Recurring**: date row reads e.g. "Every first Saturday · Next: Sat 6 Dec · 08:00" with a small "Recurring" tag. Add-to-calendar uses the next occurrence.
- **Single / continuous**: unchanged.
- "Event has passed" grey state triggers only when *all* performances / the final occurrence are in the past.

---

## Technical details

**Migration**
```sql
ALTER TABLE public.events
  ADD COLUMN performances jsonb;
-- shape: [{ "date": "2025-12-05", "time": "19:30", "end_time": "21:30" }, ...]
```

**Helpers** (new `src/lib/eventSchedule.ts`):
- `getEventOccurrences(event, { from, to }): Array<{ date: Date; startTime?: string; endTime?: string }>` — unifies all three types into a sortable list of concrete occurrences inside a window.
- `getNextOccurrence(event, now): Occurrence | null`
- `isEventPast(event, now): boolean`
- `expandRecurrence(rule, startDate, endDate, window)` — supports `daily`, `weekly:<weekday>`, `monthly-nth:<n>:<weekday>`, `monthly-day:<n>`. Unknown / legacy free-text recurrence falls back to treating the event as single/continuous (no expansion), so nothing breaks.

**Refactor points**
- `Events.tsx` `eventDateLine` and the upcoming/past/filter logic switch to `getNextOccurrence` / `isEventPast`.
- `EventCard` accepts an optional `nextOccurrence` + `moreCount` so the card stays purely presentational.
- `EventDetail.tsx` swaps the date row for a `<Performances />` sub-component when `performances?.length`, and uses `getNextOccurrence` to drive the past-state + add-to-calendar.
- `EventsCalendar` switches to `getEventOccurrences` per visible month.
- Admin `EventEditDialog`: new "Event type" toggle, dynamic performances editor, recurrence rule builder; on save it computes `start_date`/`end_date` from `performances` so legacy code paths stay consistent.

**Bulk CSV import**: add an optional `performances` column accepting `2025-12-05 19:30; 2025-12-06 19:30; 2025-12-12 19:30` (semicolon-separated) and parse into the JSON shape. Documented in the CSV template.

---

## Out of scope
- Per-performance ticket links (each performance shares the event's booking link). Can be added later if needed.
- Generating separate notification reminders per performance — first pass uses the next occurrence only.
