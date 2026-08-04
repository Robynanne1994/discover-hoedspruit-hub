# Redesign Log In and Create Account screens

Restyle the two auth screens in `src/pages/Welcome.tsx` to match the attached designs. Presentation only — no changes to auth logic, validation, username checks, OAuth calls or error handling.

## Shared changes (both screens)

- Keep the circular white back button, the "YOUR LOWVELD LOCAL" eyebrow and the large heading.
- Headings become Title Case: "Welcome Back" and "Create Account".
- Add a one-line subtitle in quiet grey under the heading:
  - Log In: "Sign in to pick up your saved places and follows."
  - Create Account: "Four details and the town is yours."
- Group all form fields inside a single white rounded card (16px radius, hairline border, soft shadow), with cream-filled inputs inside it rather than white-on-cream.
- Field labels become small uppercase tracked labels ("EMAIL", "PASSWORD", "FULL NAME", "USERNAME", "LOCAL OR VISITOR").
- Primary button stays the brown pill, sits below the card with clear spacing.
- "OR" divider unchanged in structure; Google and Apple buttons become solid white pills with hairline border (instead of transparent).
- Footer link line: "New here? Create an account" on Log In, "Already have an account? Log in" on Create Account.

## Log In screen

- Email and Password inside the white card.
- Below them, in the same card: a brown pill toggle switch (replacing the square checkbox) labelled "Keep me signed in", with "Forgot password?" in brown on the right.
- Primary button label "Log In".

## Create Account screen

- Card order: Full Name, Username (with `@` prefix and hint "Letters, numbers, dots and underscores."), Local Or Visitor, Email, Password (hint "At least 8 characters, with a number and a symbol.").
- Replace the residency dropdown with two side-by-side pills: "Local" (selected = brown fill, white text) and "Visitor" (unselected = white with hairline border). Same two values as the existing dropdown options.
- Below the primary button, small legal line: "By creating an account you agree to our Terms and Privacy Policy." with both linking to the existing policy routes.

## Technical notes

- All work confined to `src/pages/Welcome.tsx`; existing state (`residency`, `keepSignedIn`, `usernameStatus`, error blocks) is reused as-is, only the markup and inline styles change.
- Colours from the project tokens: canvas #E6E0CC, card #FFFFFF, inset field fill cream, primary #423324, tan links #715A3D, muted #6B6A5E, ink #1A1A1A.
- Error banners keep their current styling and position within the card.
