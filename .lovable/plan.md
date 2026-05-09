## Goal
Remove the old `/terms/privacy` page (`PrivacyPolicy.tsx`) and route everything through the newer `/privacy-policy` page (`PrivacyPolicyPage.tsx`).

## Changes

1. **`src/App.tsx`** — Remove the `/terms/privacy` route and the `PrivacyPolicy` import.
2. **`src/pages/PrivacySecurity.tsx`** (line 318) — Update the "Read Full Privacy Policy" link from `/terms/privacy` → `/privacy-policy`.
3. **`src/pages/PrivacyPolicy.tsx`** — Delete the file.

## Notes
- Only one internal link points to `/terms/privacy` (in PrivacySecurity). After redirect, no broken links remain.
- `/privacy-policy` already exists and renders `PrivacyPolicyPage`.
- No external/SEO redirect handling is needed in code (SPA hosting will 404 the old URL → acceptable since it was internal-only).