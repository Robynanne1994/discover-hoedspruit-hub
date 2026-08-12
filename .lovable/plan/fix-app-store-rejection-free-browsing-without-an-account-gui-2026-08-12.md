# Fix App Store rejection: free browsing without an account (Guideline 5.1.1(v))

Apple needs to open the app and use everything that is not account based without ever being asked to register. What I checked in the current code:

- The home route `/` already renders the full homepage for a signed-out visitor (verified in the running app), so guest browsing technically works.
- `/welcome` does have a "Continue as Guest" button, but it sits below "Create an Account" and reads like an opt-out rather than the normal way in.
- Content pages (explore, category, listing, events, specials, local channels, search, FAQs, help, terms) are public routes with no auth redirect.
- `/my-profile` and `/my-account` bounce signed-out users to the guest profile screen rather than to login.
- Account actions (save, been-here, follow, review) call `requireAuth`, which opens a dismissible sign-up sheet.

Since we do not know which screen the reviewer landed on, the plan makes guest access unmistakable and removes every way the app can present a login wall on launch.

## What changes

1. **Launch never shows a login screen.** First launch, cold start and any unknown/expired session land on the homepage in guest mode. Guest mode is set automatically on first run instead of requiring the user to press a button for it.

2. **Welcome becomes an optional screen, not a gate.** It is only reached when the user chooses Log In / Create Account. Add a clear "Skip" / close control at the top that returns to the homepage, so it can never trap a reviewer. Reorder so browsing is the obvious primary path: primary button "Browse the App", secondary "Create an Account", then "Already have an account? Log in".

3. **Sign-up prompts stay soft and dismissable.** Audit every `requireAuth` call so it only fires on genuinely account-based actions: save/favourite, collections, been-here, follow, reviews, notifications, own profile. Reading, searching, filtering, opening details, calling a business, opening WhatsApp, directions and external links never prompt.

4. **Guest-visible tab audit.** Home, Explore, Events, Specials, Local Channels, Search, FAQs, Help Centre, Contact, Terms all fully usable as a guest. The Profile tab shows the existing guest profile screen (invitation to join, not a forced form). Saved/Notifications show a guest empty state with a soft "Create a free account to save things" card.

5. **Copy pass.** Prompt sheet copy makes clear the account is only for saving and social features, e.g. "You can keep browsing without an account. Sign up only if you want to save places and follow people."

6. **Resubmission note.** I will give you wording for App Review Notes telling the reviewer they can tap "Browse the App" on the welcome screen (or that the app opens straight into content) and browse everything without registering.

## Technical notes

- `src/hooks/useGuestAuth.tsx`: set guest mode by default when there is no session and no stored flag, so nothing depends on the user pressing "Continue as Guest".
- `src/pages/Welcome.tsx`: add skip/close to home, reorder the welcome-mode buttons, relabel the guest CTA.
- Verify no route or component redirects a signed-out user to `/welcome` other than explicit user action, password recovery and the deleted-account path in `src/hooks/useAuth.tsx`.
- `src/pages/MyProfile.tsx` / `src/pages/MyAccount.tsx`: keep the existing redirect to `/my-profile-guest`; confirm no flash of the login screen while auth hydrates.
- No database, RLS or auth-provider changes. Account deletion and the login flow itself stay exactly as they are.
- After the changes I will run through the app signed out in a browser to confirm every tab and detail page opens with no prompt.
