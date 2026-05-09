## Diagnosis: what's making it messy today

You actually have **two parallel "accounts"** that share login state but feel disconnected:

```
USER side                          BUSINESS side
─────────                          ──────────────
/welcome  → /auth                  /business/start
/my-account                        /business/sign-in / sign-up / claim
/my-profile                        /business/dashboard
/saved, /visited                   /business/listing
/notifications                     /business/specials, /business/events
                                   /business/billing
```

Concrete problems I found in the code:

1. **Two separate sign-in/up flows** (`/auth` for users, `/business/sign-in` + `/business/sign-up` for businesses). Same Supabase user underneath, but the UX implies they're different accounts. Owners don't know which to use, and a normal user who later wants to list a business has to "re-sign-up".
2. **Three entry points to start a business**, none clearly primary: `About → Get Started`, `Advertise → See Plans`, `MyAccount → My Business`. Each goes to a different page (`/business/start`, `/plans` (doesn't exist), `/business/dashboard`).
3. **Start screen forces a binary choice** ("List new" vs "Claim") *before* sign-up. Most owners don't know if they're already on the app, so they pick wrong and bounce.
4. **Dashboard is a wall of cards** — notifications, business card, 3 stat tiles, 3 action rows, recent submissions, billing, sign out — with `H2`s in caps (`WELCOME, HAT & CREEK`) that fight your editorial brand from the consumer side.
5. **No persistent business nav.** Once inside `/business/*`, the user loses the bottom nav and has no top tabs either, so every action requires going back to dashboard.
6. **Subscribe/billing/feature paths are hidden.** `BusinessSubscribe` is only reachable post-signup; existing owners can't easily see plans, upgrade, or feature an item from their dashboard.
7. **State ambiguity is invisible.** "I signed up but didn't claim yet", "claim pending", "claim approved but no subscription", "subscribed but no specials posted" all look similar. No clear next-step nudge.

---

## Proposed model: one account, two modes

Treat every login as a single Hello Hoedspruit account. "Business" is just a **mode** the same account can switch into once they have a business attached.

```
   Hello Hoedspruit account
   ├── Personal (default for everyone)
   │     • Profile, Saved, Visited, Notifications
   └── Business mode (unlocked when a listing is linked or claimed)
         • Dashboard, Listing, Specials, Events, Billing
```

Single sign-in (`/auth`) for both. The "Business" surface only appears for accounts that have either created or claimed a listing.

---

## New IA & flows

### A. Single entry point: "For Businesses"

Replace the 3 scattered CTAs with one prominent surface: **`/for-business`** (rename of `/business/start`, kept as redirect).

That page becomes a single, scrollable pitch:
1. Hero: "Run a business in Hoedspruit?"
2. 3 benefits (visibility, specials, events)
3. **Single primary CTA: "Get Started"** (no choice yet)
4. Plans preview (currently lives in `/advertise`)
5. Footer: "Already have a business account? Sign in."

The current "About → Get Started" and "Advertise → See Plans" both link here.

### B. Unified "Get Started" wizard

After tapping Get Started, run **one progressive flow** instead of forking. This is the biggest UX win.

```
Step 1   Sign in or create account   (skipped if already logged in)
Step 2   "Is your business already on Hello Hoedspruit?"
         → Search field. As they type, live results from /listings.
         → If they pick one  → claim flow (proof + note)
         → If no match       → "Add a new listing" form
Step 3   Pick a plan (or Free/Trial)
Step 4   Done → Business Dashboard
```

This collapses `/business/sign-up`, `/business/sign-in`, `/business/claim`, and `/business/subscribe` into one stepper with a progress indicator. Users never have to guess "claim vs new" upfront — search answers it for them.

### C. Business dashboard, decluttered

Restructure the dashboard around **status → next action → content**:

```
┌─────────────────────────────────────┐
│ Hat & Creek                  [edit] │   ← business card with photo
│ Eatery · Main Road                  │
│ ● Live · Free plan                  │   ← single status pill
├─────────────────────────────────────┤
│ Next step                           │   ← only shown when relevant
│ "Post your first special" [Post]    │
├─────────────────────────────────────┤
│ Specials   Events   Views (30d)    │   ← stats row, smaller
│    3         1        842          │
├─────────────────────────────────────┤
│ Manage                              │
│ → Specials                          │
│ → Events                            │
│ → Listing details                   │
│ → Plan & billing                    │
└─────────────────────────────────────┘
```

Remove: WELCOME caps banner, in-page notifications block (move to a notif bell in header), 3-cell stat grid that repeats "specials" twice (currently `featured` is the same query as `specials`), bottom Billing + Sign Out buttons (move to a profile menu).

### D. Persistent business sub-nav

While inside `/business/*`, replace `BusinessShell` with a layout that keeps **top tabs** visible:

```
[ Dashboard ] [ Specials ] [ Events ] [ Listing ]      ⚙
```

Bottom nav (consumer) stays hidden in business mode to avoid double bars. The gear icon opens billing, notifications, switch-to-personal, sign out.

### E. Mode switcher in `/my-account`

In MyAccount, replace the lone "My Business" row with a richer block:

- If account has a business: show a card "**Business mode** — Hat & Creek" with a switch button → `/business/dashboard`.
- If not: show a quiet "List your business →" link to `/for-business`.

This makes the relationship obvious instead of looking like an unrelated menu item.

### F. Visual & copy alignment

- Apply your editorial system to business pages: ivory cards (`#f5f0e8`), 16px radii, Helvetica Neue 400, italic Playfair for accents — same as the consumer side. Today the dashboard uses caps `H2`s and a different olive (`#555340`) which feels orphaned.
- Status pills standardized to 3 states: **Draft / Pending / Live** (specials, events, claims, listing edits).
- All "BUSINESS HUB" / "WELCOME, X" titles → sentence case "Your business" / "Hat & Creek".

---

## What gets built (in order)

1. **IA + redirects** — single `/for-business` page, redirect old entry points, retire `/plans` link.
2. **Unified Get Started wizard** — one flow combining sign-up + claim/new + plan select.
3. **MyAccount business block** — clear mode switcher.
4. **Dashboard redesign** — status-led layout, fix duplicate "featured" stat, move notifications.
5. **Business sub-nav layout** — `BusinessLayout` with persistent tabs.
6. **Visual polish pass** — apply editorial tokens across all `/business/*` pages.

Steps 1–3 are the highest-leverage and could ship first as a standalone improvement; 4–6 are progressive polish.

---

## Open questions before we build

1. **Plans:** Do paid plans actually exist yet, or is everything currently free? This decides whether step 3 of the wizard is "pick a plan" or just a confirm screen.
2. **Claim verification:** Is a human reviewing every claim, or can we auto-approve when the email/phone matches the listing? Affects how scary the "Pending review" state needs to look.
3. **Multi-listing owners:** Should one account be able to own multiple listings (e.g. a group)? Today `business_owner_id` is one-to-one on `listings`. If yes, the dashboard needs a listing switcher.
4. **Bottom nav in business mode:** Hide it (cleaner) or keep it (easier to jump back to consumer side)? My recommendation is hide + add a "Switch to personal" item in the gear menu.
