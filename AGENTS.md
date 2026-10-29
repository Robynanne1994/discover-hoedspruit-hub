# Project Architecture Rules

- Keep accommodation CSV value normalisation in a dedicated library module so imports, exports, and tests share one source of truth.
- Keep specials category collection, matching and per-special counting in the shared specialTags library so pills and drawer filters use identical rules.
- Use the shared InstagramIcon for every Instagram symbol so its camera outline stays consistent while inheriting the placement's brand colour.
- Keep restaurant meal choices and option exclusions in restaurantOptions so the editor, CSV references and filters agree.
- Keep event category collection, matching and per-event counting in eventTags so all three tags use consistent filter rules.
- Keep events list heading grouping and section order in eventGroups so the page, its tests and any future view share one rule.
- Keep event duration bucketing and booking-required judgement, plus their per-option counts, in eventDuration so filter pills and the filtered list agree; an event with no booking link is booking not required.
- Keep event price matching and free/paid counts in eventPrice so the drawer counts and filtered results agree; an event with no price populated is free.

- Resolve specials social links through specialSocialLink so only labelled web destinations are displayed.
- Keep specials list visibility and upcoming classification in specialVisibility using Johannesburg calendar dates so filters and counts agree.- Keep event host name matching and photo/link/subtitle fallback in eventHosts so the event page and tests share one rule.
- Keep detail-page tab bars on flex:1 nowrap labels inside an overflow-x auto nav so they always fill the row and only slide sideways when they cannot fit; never cap the spread at a fixed tab count.
- Keep specials booking and discount-type matching and counts in specialFilters so the drawer counts and displayed results use identical rules.
- Keep specials validity states (upcoming, ending soon, ongoing) in specialValue and specialVisibility so the top pill row and the drawer's Validity filter always count the same specials.
- Keep event recurrence matching and start-time buckets and counts, plus per-recurrence-option counts, in eventRefinements, reusing the schedule parser for legacy patterns so counts and filtered results agree.
- Keep event contact CSV parsing, serialisation and labelled frontend pairs in eventContacts, translating combined cells to primary/extras storage so existing editors remain compatible and actions use the first populated contact.
- Keep the filter-pill toggle rule (clicking an already-lit pill returns its section to the default choice) in filterPill so every pill row and drawer option shares one behaviour.
- Render section-specific Clear controls in RefineSection using active-only onClear callbacks from each page so clearing never resets unrelated sections.
- Keep app store review links in storeReview so the account page's rating prompt and any later entry point share one URL; a platform whose link is not issued yet stays null rather than pointing at a guess.
- Keep canonical outbound links such as the app download page in appLinks so the share sheet and any later entry point share one URL.
- Render the full-width brown call-to-action pill through the shared ArrowCta component so search's Discover More and the follow lists' Find People and Share Profile stay identical; wrap it in each page's own content column rather than restyling it per page.
- Keep the one-day special rule (a deal whose start and end share a calendar day reads "1 Day Only" rather than "Last day") in specialValue's countdownLabel so every card that counts down uses the same wording.
