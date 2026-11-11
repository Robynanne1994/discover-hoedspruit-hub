# Project Architecture Rules

<!-- LOVABLE:BEGIN -->
- Use AppliedFilterBar for Events and Specials to keep their applied-chip rows consistent with listing filters.
- Keep specials faceted counts in specialFacets, reusing shared matching helpers and skipping only the section being counted.
- Use listingCardHours for category status matching so filters and card statuses report the same schedule.
<!-- LOVABLE:END -->

- Use listingImage's homepage surface for Explore Quick Filter rows so they reuse the editor's square homepage crop and shared image fallbacks.

- Keep accommodation CSV value normalisation in a dedicated library module so imports, exports, and tests share one source of truth.
- Keep listing details display mode in the backend editor only; it is not a CSV column, so an upload can never overwrite an editor choice.
- Keep specials category collection, matching and per-special counting in the shared specialTags library so pills and drawer filters use identical rules.
- Use the shared InstagramIcon for every Instagram symbol so its outline stays consistent in the placement's brand colour.
- Keep restaurant meal choices and option exclusions in restaurantOptions so the editor, CSV references and filters agree.
- Keep event category collection, matching and per-event counting in eventTags so all three tags use consistent filter rules.
- Keep events list heading grouping in eventGroups; a lone time-frame pill heads the list with its dates from eventTimeFrames, more filters say "Events".
- Keep event duration bucketing and booking-required judgement, plus their per-option counts, in eventDuration so filter pills and the filtered list agree; an event with no booking link is booking not required.
- Keep event price matching and free/paid counts in eventPrice so the drawer counts and filtered results agree; an unpriced event counts only under Any.

- Resolve specials social links through specialSocialLink so only labelled web destinations are displayed.
- Keep specials list visibility and upcoming classification in specialVisibility using Johannesburg calendar dates so filters and counts agree.- Keep event host name matching and photo/link/subtitle fallback in eventHosts so the event page and tests share one rule.
- Keep detail-page tab bars on flex:1 nowrap labels inside an overflow-x auto nav so they always fill the row and only slide sideways when they cannot fit; never cap the spread at a fixed tab count.
- Keep specials booking and discount-type matching and counts in specialFilters so the drawer counts and displayed results use identical rules.
- Keep specials validity states (upcoming, ending soon, ongoing) in specialValue and specialVisibility so the top pill row and the drawer's Validity filter always count the same specials.
- Keep event recurrence matching and start-time buckets and counts in eventRefinements, reusing the schedule parser for legacy patterns.
- Keep event contact CSV parsing, serialisation and labelled frontend pairs in eventContacts; combined cells map to primary/extras storage and actions use the first populated contact.
- Keep the filter-pill toggle rule (clicking an already-lit pill returns its section to the default choice) in filterPill so every pill row and drawer option shares one behaviour.
- Keep the "All" pill's lit state in filterPill's allPillActive so it lights only when nothing is narrowed, never while another filter or a search term is applied.
- Return the filter bar to its start when the last filter comes off, via useFilterBarReset so Events and Specials match.
- Render section-specific Clear controls in RefineSection using active-only onClear callbacks from each page so clearing never resets unrelated sections.
- Keep app store review links in storeReview so the account page's rating prompt and any later entry point share one URL; an unissued link stays null.
- Keep canonical outbound links such as the app download page in appLinks so the share sheet and any later entry point share one URL.
- Render the full-width brown CTA pill through the shared ArrowCta so search's Discover More and the follow lists' Find People and Share Profile stay identical, inside each page's content column.
- Keep the one-day special rule (start and end share a calendar day reads "1 Day Only", not "Last day") in specialValue's countdownLabel.
- Keep specials Special Type option collection, matching and counts in specialKind so the drawer and results agree.
- Render a rich-text line of only links through listingRichText's link-stack; a sentence that merely contains a link stays inline.
- Keep every event host on the event page in one shared card with hairline dividers, never one card per host.
- Keep a slot's subject rulers in its own definition as rulerBandGuides, in the slot's own box px, so crop tool and thumbnail draw the same pair.
- Measure crop guides from layout px (offsetWidth), never getBoundingClientRect, so a dialog's zoom animation cannot leave guides stuck at its scale.
- Keep the featured deal card's deal line in a words-only accent chip with a chevron.
- Keep admin category rows unambiguous: the drag handle moves a category, the listings count opens its listings, the labelled Order button alone reaches the per-category order page.
- Keep listing detail-row label casing in detailLabel's formatDetailLabel: every hyphenated part is capitalised (Mid-Range, Dine-In, Drive-Through), never only the whole label's first letter.
- Keep admin custom rows (custom_title_N plus custom_text_N) collected by listingCustomFields and shown on the About tab under "Good to know", never as Details cards; a listing whose only detail was custom has no Details tab.
- Keep restaurant facility placement and boolean visibility in restaurantDetailFields so Summary, service, family and accessibility cards share testable rules without duplicate fields.
- Keep the "Hoedspruit & Surrounds" area rule and maps-link resolution in locationDirections so the action bar and the Location tab on listings, events and specials all refuse directions for an area that has no address.
- Keep the listing action bar's top-up rule in actionBarFill: a bar left with two tiles takes its next populated contact, email before the listing's social pages, never a link already shown.
- Keep the quick-filter card's line rule in quickCardLines: category names take a second line unless title and location have both already used two, measured from rendered heights.
- Keep the specials default (All) order in specialOrder: unpositioned first (newest), then admin sort_position; featured specials are lifted above it.
- Keep Featured Events carousel order in featuredEventOrder; the list below stays date-ordered.
- Keep the past-events window and default order in eventPastWindow.
- Keep the event weekday tag in eventDayLabel's shortWeekday so listed cards and carousel cards share one bracketed form ("4 Nov (Wed)"); listed cards tag only one-day runs, carousel cards every card.
- Keep carousel poster card date/location rows on one shared style, with no time.
- Keep the events carousel gaps on one shared value.
- Keep the specials page's section headings on the events page's group-heading treatment; neither specials heading carries an icon or a hairline rule, and the featured rail's gap equals the carousels'.
- Keep every specials section heading's bracketed count in dealCountLabel so the featured rail and the list below word the same number alike.
- Keep the featured deal card's photo column in FEATURED_PHOTO_FRACTION, FEATURED_PHOTO_RATIO and the specials slide width (appLayout) so the card and its editor crop box agree.
- Keep pill icons and the filter-count digit on the pillIcon constants; keep the listed event card's three rows on one shared set in Events.tsx (ROW_FONT_SIZE, ROW_LINE_HEIGHT, ROW_GAP, ROW_ICON_SIZE, ROW_GLYPH_SIZE).
- Keep the events filters row's active-filter count and Clear all visibility in eventFilterState.
- Clear address-backed filters in one updateParams call: separate calls each read the address as it stood at press time, so only the last survives.
- Keep search's category matching and title-first ranking in smartSearch so the home search and Explore search agree.
- Keep listing sheet contact cells in listingContactCsv so import and export agree.
- Keep listing sheet opening-hours cells ("Label {json}", extras pipe-separated) in listingHoursCsv so import and export agree.
