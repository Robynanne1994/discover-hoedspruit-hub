# Roadmap

## Pending
- Event editor: pair quarter-width Start Time and End Time in column 1, with Performances in column 2.
- Event editor: align the Price and What's Included label-and-box groups side by side.

## Done
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
