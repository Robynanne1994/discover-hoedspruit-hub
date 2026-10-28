# Project Architecture Rules

- Keep accommodation CSV value normalisation in a dedicated library module so imports, exports, and tests share one source of truth.
- Keep specials category collection, matching and per-special counting in the shared specialTags library so pills and drawer filters use identical rules.
- Use the shared InstagramIcon for every Instagram symbol so its camera outline stays consistent while inheriting the placement's brand colour.
- Keep restaurant meal choices and option exclusions in restaurantOptions so the editor, CSV references and filters agree.
- Keep event category collection, matching and per-event counting in eventTags so all three tags use consistent filter rules.
- Keep events list heading grouping and section order in eventGroups so the page, its tests and any future view share one rule.
- Keep event duration bucketing and booking-required judgement, plus their per-option counts, in eventDuration so filter pills and the filtered list agree; an event with no booking link is booking not required.

- Resolve specials social links through specialSocialLink so only labelled web destinations are displayed.
- Keep specials list visibility and upcoming classification in specialVisibility using Johannesburg calendar dates so filters and counts agree.- Keep event host name matching and photo/link fallback in eventHosts so the event page and tests share one rule.
- Keep detail-page tab bars on flex:1 nowrap labels inside an overflow-x auto nav so they always fill the row and only slide sideways when they cannot fit; never cap the spread at a fixed tab count.
- Keep specials booking and discount-type matching and counts in specialFilters so the drawer counts and displayed results use identical rules.
