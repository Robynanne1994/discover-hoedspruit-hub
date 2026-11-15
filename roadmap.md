# Roadmap

## Pending
(none)

## Done
- (2026-11-15) Listings editor: the "Detail Page" banner heading is removed, and "Gallery Images"
  now sits about 32px below the image grid above it (was 12px). Verified live in the signed-in
  editor: Detail Page banner count 0, gap above the chip measured 32px; build OK.
- (2026-11-15) Listings editor: "Gallery Images" now heads the gallery with the events editor's
  Host-chip treatment (dark brown #423324 fill, cream bold text, rounded chip) instead of a plain
  label. Verified live in the signed-in editor: listings chip and events "Host 1" chip report
  identical computed styles (background rgb(66,51,36), colour rgb(251,250,249), radius 14px,
  18px/700, padding 4px 12px, no border); build OK.
- (2026-11-12) Specials editor: Redemption Note moved up into the Discount Type row as column 2,
  labels and boxes level; the Percent Off / Amount off value box now sits beside Freebie Text in
  the row below. Verified live in the signed-in editor (both labels 853.2, both boxes 889.3,
  40px tall); build OK.
- Specials editors: Booking Type starts blank instead of "Website Link" when nothing is set (shared editor and add-new form), and the Title box now takes three quarters of its row with a bigger Featured toggle beside it on the same line. Live signed-in checks passed (title 782px of a 1094px dialog, toggle 50x29 same row, booking select blank and still selectable/clearable); build OK.
- Events CSV: single pipe-separated tag column replaces sub_tag_1/sub_tag_2; existing tags combine on export, unlimited tags read back in editor and shared filters. 13 tests and signed-in four-tag import/readback passed; temporary event removed.
- Event editors: host link types are capitalised, Listing / Link is labelled and disabled under No Link, booking fields align, and an unset booking type starts blank. Three tests and live signed-in editor checks passed; build OK.
- Event editor: Start Time and End Time now share column 1 at quarter width, with Performances beside them in column 2; Price and What's Included label-and-box groups are aligned. Live layout assertions and screenshots passed; build OK.
- Universal listings CSV: details_display_mode column removed from downloads, imports and the reference row; the field stays editable in the backend editor. All 694 listings already hold {}, so no data changed; 760 tests passed.
- Accommodation: sleeps_children removed from the editor, the listing page and both CSV sheets; the database column is left untouched. Verified on Ujabule Lodge (adults 8, children 4) reading "Sleeps 8 People" and on its editor showing only the adults field; 748 tests passed.
- Events and Specials: replaced preset pills with Filters, Clear All and same-row removable chips; faceted counts and independent category/validity selections verified with 24 tests and real desktop/phone selection, removal and clearing.
- Specials: optional Who's it For audiences added to both editors, CSV and individual Details card before social link; signed-in save/reopen/export and empty hiding verified, 12 tests passed.
- Event-page editor: added shared gallery uploads with cropping, removal and events storage paths; signed-in upload/save/reopen and removal readback verified. Existing editor mobile overflow is unchanged.
- Backend-only event gallery import: migration applied and import-gallery-images deployed; six regression tests passed, schema and service-only permissions checked, live missing-key rejection checked; original listing SQL wrapper unchanged. Real keyed imports were not run because the read-only tools cannot invoke service-only wrappers.
- Local Channels: searchable Associated Business selector, exact-title CSV column after meta_2 and linked Business card on Details; signed-in selection/save/navigation, export and invalid-match protection verified; 17 tests passed.
- Local Channels: CSV sort_order removed; Order dialog saves drag-and-drop order; featured-first preserved across All, home, search and saved channels; desktop save/readback and phone controls verified.
- (2026-11-06) Specials CSV: New Only, Active and Passed choices before upload; separate downloads and ID matching; no deletion; signed-in cross-scope protections verified and 38 tests passed.
- (2026-11-06) Events CSV: Past, Upcoming and New Only choices before upload; separate scoped downloads; no deletion; cross-scope guards verified signed-in and 27 tests passed.
- (2026-11-04) Events page: Filters button moved inline at the head of the pill row with a
  count badge and Clear all; both clear buttons now write the address once.
- (2026-11-04) Events page: active date pill's brown count badge checked on a phone screen.
- (2026-11-04) Events page: listed event cards' date, time and location rows tightened to a
  5px gap and 12.5px text, all on shared constants; the two carousels were left alone.
- (2026-11-12) Event editor: title is now a single-line box; Tags / Categories rows sit 6px
  apart; a brown "Description" banner heads the write-up (small duplicate label removed);
  Link Type and Listing / Link label-to-box gaps match host Name at 6px. Verified live.
- (2026-11-12) Event editor: Title box takes three quarters of its row with the bigger
  Featured toggle beside it in the last quarter; "Use the title exactly as typed" stays on
  its own row below. Verified live (title 820px of a 1150px dialog, toggle 53x31, same row).
- (2026-11-13) Listing editor: Title box takes three quarters of its row with the bigger
  Featured toggle beside it in the last quarter, matching the events and specials editors.
  Verified live (title 823.5px of a 1152px dialog, toggle 52.8x30.8, same row, toggles on/off).
- (2026-11-15) Event editor: the "Host 1 / Host 2 / Host 3" title chip fill now matches the
  contacts Add button fill (var(--filter-ink), #423324) instead of the lighter tan primary.
  Verified live (host chip rgb(66, 51, 36), Add buttons rgb(66, 51, 36)).
- (2026-11-15) Listing editor: full-width "Description" and "Good to Know" banners added
  above their blocks in the same style as "Custom Detail Rows"; the small duplicate labels
  above those two fields were removed. Verified live (banners rgb(63,63,70) with rgb(24,24,27)
  border, 20px/700, full width, sitting above the write-up box and the good-to-know input).
- (2026-11-15) Listing editor: every remove control is now a bare X in a brown filled circle
  (28px, rounded-full, bg-primary) — extra opening-hours sets, custom detail rows and
  treatment / product-category rows. No "Remove" word or trash icon left in the editor.
  Verified live (hours set X rgb(113,84,61), 28x28, radius 9999px, no text; custom row X
  identical; 10 treatment rows on NatureAllied all show the same control).
