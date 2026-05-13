# Redesign the Welcome / log-in landing screen

Take the Upwork-style layout from your reference and rebuild the Welcome screen with Hello Hoedspruit branding. No stock image — your logo on the brand green background instead. Add a role toggle so users pick **I'm a user** or **I'm a business** before continuing, and wire each choice to the correct signup/sign-in destination.

## What the new screen looks like

```text
┌────────────────────────────────┐
│                                │
│         (brand green)          │
│                                │
│        [ HH logo, large ]      │
│                                │
│                                │
│   Your local guide to          │   ← headline (bold, left-aligned)
│   Hoedspruit                   │
│                                │
│   ┌──────────────────────────┐ │
│   │ ●I'm a user │ I'm a biz  │ │   ← pill toggle (one selected)
│   └──────────────────────────┘ │
│                                │
│   ┌──────────────────────────┐ │
│   │      Create account       │ │   ← brand-brown filled CTA
│   └──────────────────────────┘ │
│                                │
│     Already have an account?   │
│     Log in                     │   ← underlined link
└────────────────────────────────┘
```

Brand application:
- Background: `#5C6446` (current welcome green) — no photo
- Logo: existing `hh-logo.png`, centered upper third
- Headline: white, Helvetica Neue, uppercase, ~28px
- Pill toggle: white pill on translucent dark; selected segment gets ivory `#f5f0e8` background + dark text, unselected stays transparent with white text
- Primary CTA: brand brown `#715a3d`, white text, 16px radius
- Footer: white "Already have an account?" + underlined "Log in"

## Routing logic (all stages wired)

State on the welcome screen: `role: "user" | "business"` (default `user`).

| Action | role = user | role = business |
|---|---|---|
| Tap **Create account** | go to in-page `signup` form (existing email + first name + username + password flow) | navigate to `/business/sign-up` |
| Tap **Log in** | go to in-page `signin` form | navigate to `/business/sign-in` |

Signup/signin sub-screens stay as they are today (back arrow returns to welcome). After successful user signup/signin, AuthGate already drops them on `/`. Business routes already handle their own redirect to `/business/dashboard`.

## Files touched

- `src/pages/Welcome.tsx` — rewrite the `mode === "welcome"` block: remove the current two stacked buttons, add the role pill toggle, single Create-account CTA, and Log-in link. Add `useNavigate` and branch on `role` for both CTA and Log-in.
- No changes to `App.tsx`, `useAuth`, or business pages — they already exist and handle their flows.

## Out of scope

- No new database fields (role choice is just a routing hint, not stored).
- No change to the signup form fields themselves.
- No change to business signup/signin pages.

Confirm and I'll implement.