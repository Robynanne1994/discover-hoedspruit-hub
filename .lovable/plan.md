## Admin Reports Section

Add a new "Reports" area to the admin where you can generate and download CSV reports on-demand. Each report runs against the live database and downloads a `.csv` file you can open in Google Sheets/Numbers/Excel.

### Navigation
- Add a **Reports** item (FileBarChart icon) to the admin sidebar in `src/pages/admin/AdminLayout.tsx`, route `/admin/reports`.
- Register the route in `src/App.tsx`.

### New page: `src/pages/admin/AdminReports.tsx`
A single page listing each report as a card with:
- Title + short description of what it includes
- A live count (e.g. "23 listings affected") fetched on demand
- A **Download CSV** button

Reports included (each as its own card, downloads its own CSV):

1. **Listings — broken / missing images** — rows where `image_url` or `detail_image_url` is null/empty, OR where a HEAD request to the URL fails (non-2xx).
2. **Events — broken / missing images** — same logic against `events.image_url`, `detail_image_url`, `homepage_image_url`.
3. **Specials — broken / missing images** — same logic against `specials.image_url`, `detail_image_url`.
4. **Listings — missing descriptions** — `description` or `long_description` null/empty.
5. **Events — missing descriptions** — `events.description` null/empty (events only have one description field; will flag empty).
6. **Specials — missing descriptions** — `specials.description` null/empty.
7. **Listings — missing opening hours** — `opening_hours` null or `{}` / no days populated.
8. **Listings — missing all contact details** — no `phone`, `whatsapp`, `email`, `website`, `additional_phones`, `additional_whatsapps`, `additional_emails`.
9. **External (not-uploaded) images across listings / events / specials** — any image URL that does NOT start with the Supabase storage host (`<project>.supabase.co/storage/v1/object/public/`). One combined CSV with a `type` column (listing/event/special) + which field is external.

### CSV format
Every CSV includes:
- `id`, `title`, `admin_edit_url` (deep link to the relevant admin edit page), plus the fields specific to that report (e.g. which image URL is broken, which contact fields are missing).

Generated client-side using a small `toCsv()` helper and `Blob` + `URL.createObjectURL` — no edge function needed.

### Broken-image detection
For reports 1–3, the "missing" check is instant (SQL). The "broken" check (URL returns error / 404) is done client-side by issuing parallel `fetch(url, { method: 'HEAD', mode: 'no-cors' })` with a concurrency limit (e.g. 8 at a time) and a 5s timeout. URLs that fail or time out are flagged `broken`. A progress bar shows scan status while running, since this can take a while on hundreds of rows.

### Technical notes
- New file: `src/pages/admin/AdminReports.tsx`
- New helper: `src/lib/reports/csv.ts` (CSV escaping + download trigger)
- New helper: `src/lib/reports/checkImage.ts` (concurrent HEAD checker with timeout)
- No DB migrations — all reports are reads against existing tables.
- Future reports can be added by appending a new card config to the page.

### Out of scope (for now)
- Scheduled / emailed reports
- Saving report history
- Excel `.xlsx` (CSV opens cleanly in Numbers, Sheets, Excel)

Ready to build when you approve.