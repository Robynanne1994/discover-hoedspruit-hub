# Specials & Deals CSV — spec + skill-creator prompt

Two parts:

1. **Part A** — the real import/export contract, read off
   `src/pages/admin/AdminSpecialsImport.tsx`, `src/lib/special*.ts` and the
   `specials` migrations. This is the source of truth.
2. **Part B** — a ready-to-paste prompt for creating a custom Claude skill that
   keeps a specials master sheet and edits it on request.

---

## Part A — the CSV contract

### Where it lives

Admin → Specials → **Import/Export Specials** (`/admin/specials/import`).
Three buttons: *Download Specials* (full export), *Download Template* (headers +
one example row), and the upload dropzone.

The import runs in the browser under Robyn's admin login and writes straight to
Supabase. Nothing outside the app can import for her — a skill produces the CSV,
she uploads it.

### The 32 columns, in this exact order

```
title, badge_override, deal_type, day_of_week,
discount_type, discount_value, freebie_text, redemption_note, business_name, business_id, description,
valid_from, valid_until,
price, price_label, original_price,
booking_required, booking_link, booking_link_label, promo_code,
contact_phone, contact_whatsapp, contact_email,
additional_phones, additional_whatsapps,
terms, tag, sub_tag_1, sub_tag_2,
is_active, is_featured
```

Export writes them in that order; the parser maps by header name (lowercased,
spaces and quotes stripped), so order is forgiving on import but must never be
relied on. Keep the export order.

### Five rules that will bite

1. **The import is a full sync, not an append.** Rows are matched on `title`,
   case-insensitively. Any special in the database whose title is *not* in the
   uploaded CSV is **deleted**. Always start from a fresh *Download Specials*
   export and edit that — never upload a partial file.
2. **A blank cell wipes the value.** Every column is written on every import, so
   an empty cell sets that field to null. Same reason: edit the export.
3. **`-` means empty here.** The parser converts a lone `-` to `""`. This is the
   opposite of the events master, where `-` is a required placeholder. Never put
   dashes in the specials sheet.
4. **Image columns are not in the CSV at all.** `image_url`,
   `detail_image_url`, `homepage_image_url` and `saved_image_url` are managed in
   the admin editor only and are deliberately excluded from both export and
   import, so an import can never clear them.
5. **Two enum columns are enforced by the database.** A bad `deal_type` or
   `discount_type` makes the whole row fail with a Postgres error on that row
   number; the rest of the file still imports.

### Column by column

| # | Column | Format / allowed values | Notes |
|---|---|---|---|
| 1 | `title` | free text, unique | The match key. Blank → row skipped with an error. Renaming a title creates a new special and deletes the old one. |
| 2 | `badge_override` | free text, e.g. `50% OFF` | The card pill. Leave blank to auto-generate — see "Badge" below. |
| 3 | `deal_type` | `weekly` \| `date_range` \| `monthly` \| `ongoing` \| blank | DB CHECK constraint. |
| 4 | `day_of_week` | pipe list of day names: `Wednesday\|Thursday` | Also accepts `,` `;` `/`, short forms and plurals (`Weds`, `Thurs`, `SAT`). Unrecognised words are silently dropped. Stored as an array, re-exported in Monday-first order. Empty → null. |
| 5 | `discount_type` | `percent_off` \| `amount_off` \| `fixed_price` \| `buy_x_get_y` \| `freebie` \| blank | DB CHECK constraint. |
| 6 | `discount_value` | bare number: `50`, `75.5` | No `%`, no `R`. Only used by `percent_off` and `amount_off`; ignored for the other three types. |
| 7 | `freebie_text` | free text, e.g. `Free bottle of wine` | Where a `freebie` deal is described. Shows in the value bar when there's no price. |
| 8 | `redemption_note` | short text, e.g. `Book direct` | How to claim it. |
| 9 | `business_name` | free text | Displayed name. Defaults to `""` if blank. |
| 10 | `business_id` | listing UUID or blank | Links the special to a listing. Never invent one — blank is safe. |
| 11 | `description` | free text, markdown supported | |
| 12 | `valid_from` | `YYYY-MM-DD` | |
| 13 | `valid_until` | `YYYY-MM-DD` | Drives everything time-related: "Ending Soon" (7 days or fewer), the countdown label, and the public list filter — a special with `valid_until` in the past disappears from the app. Blank = ongoing, no expiry. |
| 14 | `price` | text with currency: `R450pp` | Free text, not numeric. A trailing `.00` is stripped on both import and export. |
| 15 | `price_label` | short text, e.g. `per person` | Sits under the price. |
| 16 | `original_price` | text: `R900pp` | Must be numerically higher than `price` for the `Save R450` accent to appear. |
| 17 | `booking_required` | `true` / `1` = true, everything else false | |
| 18 | `booking_link` | URL | |
| 19 | `booking_link_label` | e.g. `Book on Quicket` | |
| 20 | `promo_code` | e.g. `WINTER2026` | |
| 21 | `contact_phone` | spaced human format: `079 660 2475` | |
| 22 | `contact_whatsapp` | `27796602475` | No plus, no spaces, country code, leading zero dropped. Only mobile numbers (`06`, `07`, `081`–`084`) can take WhatsApp. |
| 23 | `contact_email` | | |
| 24 | `additional_phones` | pipe list | Stored as an array. |
| 25 | `additional_whatsapps` | pipe list | Stored as an array. |
| 26 | `terms` | pipe list: `T&Cs apply\|Sit down only` | Stored newline-joined, re-exported pipe-joined. One term per segment. |
| 27 | `tag` | exact string from the approved list | Main category. Drives the category pills on the Specials page **and** the per-category notification toggles — matched exactly, so a typo creates a category of one and silently breaks people's notification filters. |
| 28 | `sub_tag_1` | free text, reuse existing | Secondary filter. |
| 29 | `sub_tag_2` | free text, reuse existing | |
| 30 | `is_active` | `false` / `0` = false, **anything else including blank = true** | Note the asymmetry: blank means active. |
| 31 | `is_featured` | `true` / `1` = true, everything else false | |

Three legacy columns — `title_override`, `card_footer_text`, `savings` — are no
longer in the template but are still honoured if a header for them is present.
Don't add them to new files. `additional_emails` exists on the table but has
never been in the CSV.

### Badge and value bar — how the columns combine

The card pill picks the first of these that has a value:
`badge_override` → `{day} Special` (from `day_of_week`) → `{n}% Off` /
`Save R{n}` (from `discount_type` + `discount_value`) → `Special Offer` (for
`freebie` / `buy_x_get_y`) → `Winter Special` / `{Month} Special` (derived from
the date range) → `Special`.

The value bar takes `price` (with `original_price` and `price_label`) if there
is one; otherwise the structured discount; otherwise `freebie_text`. Whichever
of the two speaks the money, the badge steps back to its next candidate, so the
same claim never prints twice on one card.

Practical upshot: **leave `badge_override` blank** unless the generated badge is
wrong. Fill the structured fields and let the app phrase it.

### Quoting

Standard CSV: a value containing a comma, a quote or a newline is wrapped in
double quotes with `""` escaping. The parser handles multi-line quoted fields
and strips a leading BOM.

---

## Part B — the prompt to paste

Paste this into Claude (it'll pick up `skill-creator`) to build the skill.

````text
I want a custom Claude skill that owns my Hello Hoedspruit SPECIALS MASTER
sheet, the same way my hello-hoedspruit-events skill owns the events master.
Build it with skill-creator, matching that skill's structure and tone.

Name it hello-hoedspruit-specials.

TRIGGERING
Fire aggressively whenever I mention specials, a special, deals, a deal, the
specials master, the specials sheet, the specials CSV, adding or updating a
special, discounts, happy hour, a weekly deal, or drop a screenshot of a deal
poster or a business's promo into the SPECIAL DETAILS folder. Also on phrases
like "add this to the specials sheet", "new deal for the app", "here's a
special", "the lodge is doing 20% off in June", "put this on specials",
"update the specials master", "is that deal still running", or when I paste
deal copy, a business's promo post, or just a business name and an offer and
expect a row built from it. Don't fire for business listings (that's the
listings skill), for events (that's the events skill), or for Instagram design.

FILE LAYOUT
Hello Hoedspruit/SPECIALS MASTER/
├── MASTERSHEET/       <- exactly one CSV. The live sheet.
└── SPECIAL DETAILS/   <- screenshots and source material

Same handling as the events skill: pull the CSV in through the device bridge,
edit it in your workspace, commit it back to the same path. If MASTERSHEET
ever holds more than one file, stop and ask which is live. Never delete
anything from SPECIAL DETAILS — that's mine to tidy.

THE CSV CONTRACT — build references/columns.md from this, exactly
32 columns, in this order, never reordered, renamed, added to or dropped:

title, badge_override, deal_type, day_of_week, discount_type, discount_value,
freebie_text, redemption_note, business_name, business_id, description,
valid_from, valid_until, price, price_label, original_price, booking_required,
booking_link, booking_link_label, promo_code, contact_phone, contact_whatsapp,
contact_email, additional_phones, additional_whatsapps, terms, tag, sub_tag_1,
sub_tag_2, is_active, is_featured

The five rules that must be stated loudly at the top of the skill, because
getting them wrong destroys live app data:

1. The import is a FULL SYNC. Rows match on title, case-insensitively, and any
   special in the app whose title is not in the uploaded file is DELETED. The
   sheet must always be the complete set. Never hand me a partial file.
2. A blank cell WIPES that field. Every column is written on every import.
3. A lone "-" is read as empty. This is the opposite of the events sheet.
   Never write dashes into this sheet — leave the cell truly blank.
4. There are NO image columns. image_url, detail_image_url,
   homepage_image_url and saved_image_url are deliberately excluded from the
   CSV and managed in the admin editor. Never add them.
5. Renaming a title is a delete-and-recreate, not an edit. Flag it to me
   before doing it.

Per-column rules for references/columns.md:

- title — the match key, must be unique, never blank.
- badge_override — the card pill. LEAVE BLANK by default: the app generates
  the badge from day_of_week, discount_type/discount_value and the date range,
  and it de-duplicates against the value bar so nothing prints twice. Only
  fill it when the generated badge would be wrong or when the business has
  specific wording ("Buy 2 Get 1 Free").
- deal_type — exactly one of: weekly, date_range, monthly, ongoing, or blank.
  Anything else is rejected by a database constraint and the row fails.
- day_of_week — pipe-separated full day names, e.g. Wednesday|Thursday.
  Blank for anything that isn't weekly.
- discount_type — exactly one of: percent_off, amount_off, fixed_price,
  buy_x_get_y, freebie, or blank. Database constraint, same as above.
- discount_value — a bare number, no % and no R. Only meaningful for
  percent_off and amount_off; leave blank for the other three.
- freebie_text — where a freebie is described in words.
- redemption_note — how to claim it, short: "Book direct", "Show this screen".
- business_name — the display name.
- business_id — a listing UUID or blank. NEVER invent one.
- description — 2-3 short paragraphs in my voice, warm and plain, no
  marketing fluff, no "nestled in the heart of", no exclamation marks.
- valid_from / valid_until — strictly YYYY-MM-DD. valid_until drives
  "Ending Soon" (7 days or fewer), the countdown, and whether the special
  shows in the app at all — a past date hides it. Blank valid_until = ongoing.
- price — text with currency, R450pp style, no space after the R, comma for
  thousands. price_label is the qualifier ("per person"). original_price must
  be numerically higher than price for the "Save R450" accent to appear.
- booking_required — "true" or "false" only.
- contact_phone — spaced: 079 660 2475. contact_whatsapp — 27796602475, no
  plus, no spaces, leading zero dropped. Derive WhatsApp from a mobile number
  when it isn't given (06, 07, 081-084 only — never a landline, 086 or 087).
  Same rule for additional_phones / additional_whatsapps.
- Pipe-separated columns, no spaces around the pipe: day_of_week,
  additional_phones, additional_whatsapps, terms. One term per pipe segment.
- tag — the main category, an exact string. It drives the category pills AND
  the per-category push notification filters, matched exactly, so a typo makes
  a category of one and quietly breaks people's notifications. Reuse the same
  eleven-tag list as the events skill.
- sub_tag_1 / sub_tag_2 — reuse what's already in the sheet before inventing
  anything; check the events skill's sub-tag list too, they share a namespace.
- is_active — note the asymmetry: only "false" or "0" makes it inactive,
  blank means ACTIVE. Write "true"/"false" explicitly, never leave it blank.
- is_featured — "true"/"false", and never change it on an existing row
  without asking me.

HOUSE STYLE (same as the events skill, keep them consistent)
- Times inside sentences: 5:30PM. Uppercase, no space before AM/PM.
- Numbers: digits. "3 course menu", "2 for 1", "12 people".
- Description paragraphs separated by newline, two spaces, newline.

THE WORKFLOW
1. Read the whole sheet first — spot duplicates, match my tone, reuse tags.
2. Gather the deal from the screenshots or whatever I pasted.
   SPECIAL DETAILS is a working pile, not a queue: assume anything in it may
   already be done. For each file, find the matching row and compare — no row
   means build it, a row with less information means update those fields, a
   row that already says the same thing means move on quietly. Report the
   already-covered ones as a count only, never as a list.
3. Fill gaps by searching for the business — real contacts, booking link,
   website. Anything you can't verify stays blank. A blank cell is honest; a
   wrong phone number sends my users to a stranger.
4. Build the row against references/columns.md.
5. Check for a duplicate before writing. Match on title and business, allowing
   for wording differences. Update in place rather than adding a second row.
   Keep existing values where the new information is blank or weaker.
6. Write it back and report: what changed, what's blank and why, what needs me.

WHAT I ALSO WANT IT TO DO — the maintenance pass
Specials expire in a way events don't, so on every run, and on request when I
say "check the specials" or "tidy the specials sheet":
- List anything with valid_until in the past, or within 7 days, so I can chase
  the business for a renewal.
- Flag rows that are self-contradictory: deal_type weekly with no day_of_week;
  percent_off or amount_off with no discount_value; freebie with no
  freebie_text; original_price lower than or equal to price; badge_override
  that just repeats what the value bar already says.
- Flag any tag outside the approved list, and any near-duplicate sub-tag.
- Never auto-delete an expired row. Tell me, and set is_active to false only
  if I say so.

SCRIPTS
Give it scripts/hh_specials.py, mirroring hh_events.py: a `summary` command
for a fast overview of the sheet, an `upsert` that writes a row with the
formatting rules applied (WhatsApp derivation, pipe joining, date
normalisation), and a `check` that runs the whole maintenance pass above and
prints the problems. Round-trip the file byte-faithfully everywhere it isn't
deliberately changing something.

HOW IT GETS INTO THE APP
The skill can't import for me — the importer runs in my browser under my admin
login at /admin/specials/import. So the last line of every report should tell
me the file is ready to upload there, and remind me to start from a fresh
"Download Specials" export if I've edited anything in the admin UI since the
sheet was last pulled.
````

---

### If you actually meant events

The `hello-hoedspruit-events` skill already keeps the events master sheet — same
folder pattern, same house style, 47 columns. The prompt above is for the
**specials/deals** sheet, which is a separate table with a separate importer.
