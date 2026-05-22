## Cleanup audit

Below is everything that appears unreachable or unused in the current codebase. Nothing has been deleted yet — this is the proposed cleanup list. Items are grouped by confidence.

### 1. Definitely unused — safe to delete

**Home components (orphaned, no imports anywhere):**
- `src/components/home/CategoryPills.tsx`
- `src/components/home/DoSection.tsx`
- `src/components/home/EatSection.tsx`
- `src/components/home/ShopSection.tsx`
- `src/components/home/StaySection.tsx`
- `src/components/home/SpecialsSection.tsx`
- `src/components/home/FeaturedCarousel.tsx`
- `src/components/home/HomeGetListed.tsx`
- `src/components/home/HomeHero.tsx`
- `src/components/home/HomeQuickPills.tsx`
- `src/components/home/HomeSectionHeader.tsx` (only `HomeSectionHead` is used)
- `src/components/home/SectionHeader.tsx` (Search & BushTelegraph define their own local `SectionHeader`)
- `src/components/home/VenueCard.tsx`
- `src/components/home/WhatsOnToday.tsx`
- `src/components/home/HomeListingCarousel.tsx` (only imported by the dead Eat/Do/Shop/StaySection files above)

**Pages whose route exists but nothing links to them:**
- `src/pages/VisitedPlaces.tsx` — route `/visited` registered, but zero links anywhere in the app (BottomNav, MyAccount, MyProfile etc. do not reference it).
- `src/pages/EventsCalendar.tsx` — route `/events/calendar` registered, zero references anywhere.
- `src/pages/AccountSettings.tsx` — imported in `App.tsx` but the `/account-settings` route is a `<Navigate to="/my-account" />` redirect, so the component is never rendered.

If you delete these, also remove the matching `import` lines and `<Route>` entries in `src/App.tsx`.

### 2. Reachable only through `Navbar`, which itself looks orphaned

`src/components/Navbar.tsx` is only imported by these four pages: `Auth.tsx`, `Directories.tsx`, `EventsCalendar.tsx`, `RestaurantQuiz.tsx`. It is NOT part of the global layout (the app uses `BottomNav` + per-page headers).

Inside `Navbar` the only internal links are `/directories`, `/quiz`, `/my-account`, `/auth`, `/my-notifications`. Searching the rest of the codebase:
- `/directories` — only linked from `Navbar` itself.
- `/quiz` — only linked from `Navbar` itself.

So `Directories` and `RestaurantQuiz` are effectively only reachable from a navbar that only shows up on their own pages. Worth confirming with you whether these features are still meant to exist:
- `src/pages/Directories.tsx`
- `src/pages/RestaurantQuiz.tsx` (+ `src/components/quiz/RestaurantQuiz.tsx`)
- `src/components/Navbar.tsx` (can be deleted if both above go)

### 3. Things to double-check before deleting

These exist and are linked, but you may have intentionally hidden them:
- `/contact` → `ContactUs.tsx` — linked only from inside `HelpCentre`.
- `/help-centre` → `HelpCentre.tsx` — linked from `GlobalMenu` and `MyAccount`.
- `/feedback` → `Feedback.tsx` — linked only from `MyAccount`.
- `/faqs` → `FAQs.tsx` — linked only from `HelpCentre`.
- `/terms`, `/terms-of-use`, `/privacy-policy`, `/cookie-policy`, `/content-guidelines` — all reachable via `TermsPolicies`. Keep if you want legal pages live.
- `/account-settings/info` → `AccountInfo.tsx` — linked from `MyAccount`, keep.
- `/notification-preferences` → `Notifications.tsx` — linked from `MyAccount`/notifications, keep.

### 4. Suggested next step

Tell me which of the groups above to remove and I'll do it in one pass (delete files, prune `src/App.tsx` imports/routes, and remove the related menu entries). My recommendation:
- Delete everything in group 1 outright.
- Decide on group 2 (Directories / Restaurant Quiz / Navbar) — if you don't use them, delete all three plus `Navbar.tsx`.
- Leave group 3 as-is unless you specifically want to retire a page.
