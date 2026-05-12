
## What's off vs the rest of the site

Sibling pages (Help Centre, FAQs, About, Terms, Feedback, Settings) all follow the same recipe:

```text
- 32px top, 44x44 cream back button (BackArrowIcon component)
- Hero: 12px UPPERCASE eyebrow @ 2.4px tracking
        72px italic Playfair lowercase title with trailing "."
        15px subline @ 0.9 opacity, max-width ~300
- List cards: cream 20-24px radius, 4-22px padding
        rows = title (16px Helvetica) + italic Playfair desc (13.5px) + ↗ circle
        NO icons inside list rows
- Rust feature card at the foot with blobs + cream CTA
- BottomNav, paddingBottom 140
```

Privacy & Security currently breaks the recipe in 8 places. The fix is alignment, not a redesign — the page stays informative, just speaks the same visual language as its neighbours.

## Edits to `src/pages/PrivacySecurity.tsx`

1. **Back button** — swap the inline lucide `ArrowLeft` button for the shared `BackArrowIcon` component used by Help Centre / Feedback, so the icon weight and circle press state match.

2. **Hero eyebrow** — change `"Privacy & Security"` (mixed case) to `"YOUR DATA"` in uppercase 2.4px tracking, matching the "WE'RE HERE TO HELP" / "BEHIND THE APP" / "STUCK? START HERE" pattern. Keep the title `your data.`.

3. **Featured shield card** (the soft-cream Shield + "your privacy matters" block) — this prominent intro panel doesn't appear on any sibling page and clashes with the calm editorial tone. Replace it with a single italic Playfair lede paragraph in cream, the same pattern About uses for its founder story:

   ```text
   We only collect what we need to make Hello Hoedspruit useful, safe and easy to use.
   We do not sell your personal data. You stay in control of your account, saved
   places and communication preferences.
   ```

4. **"What We Collect" list** — remove the lucide icons from each row. Sibling list cards (FAQs, Terms, Help Centre rows) are title + italic Playfair description + `↗` circle only. Keep the same content, just drop the leading icon column so the rhythm matches.

5. **Bullet rows ("How We Use Information" + "Security")** — keep the rust dot bullets, they already match the Bridge footnote dot. Just standardise spacing and ensure `letterSpacing` is the `"2.4px"` string used elsewhere (currently a number in places).

6. **"Your Choices & Controls" links** — fix two stale routes:
   - `Update Profile Information` → `/account-settings/info` (currently `/account/info`, which does not exist)
   - `Control Location Access` and `Request Account Deletion` → `/account-settings` (currently `/account/settings`)
   - `Manage Notification Preferences` → `/my-notifications` (we just retired `/notifications`)

7. **Bottom links card** — add an `<Eyebrow>READ MORE</Eyebrow>` above it so it matches the labelling rhythm of every other section on the page. Keep the three rows as-is (Privacy Policy, Terms, Contact us About Privacy → mailto).

8. **Add a rust feature CTA at the foot** (matching Help Centre / FAQs / About):

   ```text
   QUESTIONS ABOUT YOUR DATA
   we're an open book.
   If anything's unclear, drop us a line and we'll explain. We read every message.
   [ Email Us ]   → mailto:admin@hellohoedspruit.co
   ```
   This replaces the abrupt ending and gives the page the same warm sign-off the sibling pages share.

9. **Page chrome** — add `<BottomNav />` and bump `paddingBottom` from 120 to 140 to match the rest of the site's vertical rhythm.

## What stays exactly as-is

- All the actual privacy/security content (what we collect, how we use it, security, third parties, community content, children's privacy)
- The olive background, cream cards, Playfair italic headings
- The rust dot bullet system and the italic `Bridge` connector paragraphs
- The mailto behaviour we just added on "Contact us About Privacy"

## Out of scope

No copy rewrites, no new sections, no animation. Purely bringing the visual language in line with Help Centre, FAQs, About, Terms and Feedback so the page feels like part of the same family.
