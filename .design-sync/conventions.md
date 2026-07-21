# Hello Hoedspruit design system — build conventions

A warm, editorial component library for the **Hello Hoedspruit** local-town app
(Hoedspruit, Limpopo, South Africa). Built on shadcn/ui primitives + Radix, styled
with Tailwind utility classes driven by HSL CSS-variable design tokens. Warm palette:
earthy browns, sage green, terracotta accent, on a cream background. Light and dark
themes ship.

## Styling idiom: Tailwind utilities bound to semantic tokens

Style with the DS's **semantic Tailwind classes**, never raw hex. Colors resolve from
CSS variables (`hsl(var(--token))`) defined for both themes, so the same class adapts
to light/dark automatically. Core class families:

| Purpose | Classes |
|---|---|
| Surfaces | `bg-background` (page cream), `bg-card`, `bg-popover`, `bg-muted`, `bg-secondary-fill`, `bg-primary-tint`, `bg-accent-tint` |
| Text | `text-foreground`, `text-muted-foreground`, `text-primary`, `text-primary-foreground`, `text-secondary-foreground`, `text-accent-foreground`, `text-card-foreground` |
| Brand fills | `bg-primary` (brown) + `hover:bg-primary-hover`, `bg-secondary` (sage), `bg-accent` (terracotta) + `hover:bg-accent-hover`, `bg-destructive` |
| Status | `bg-success`, `bg-warning`, `bg-info`, `bg-destructive` (+ `text-*-foreground`) |
| Borders / ring | `border-border`, `border-input`, `border-secondary-border`, `ring-ring` |
| Radius | `rounded-lg` (= `--radius`, 1rem), `rounded-md`, `rounded-sm`, `rounded-2xl` (cards), `rounded-full` (buttons, badges, avatars) |
| Shadow | `shadow-card` (soft), `shadow-warm` (warm glow) |
| Sidebar surface | `bg-sidebar`, `text-sidebar-foreground`, `border-sidebar-border` |

Layout helpers that exist in the DS: `section-padding`, `container-wide`, `scrollbar-hide`.
New color/utility names outside this vocabulary won't resolve — compose from the classes above.

## Typography

- **Body / UI text:** Helvetica Neue (self-hosted, weights 200–900). This is the default
  on `<body>` and the `font-body` / `font-sans` utilities.
- **Display headings:** `<h1>` and `<h2>` render in **Bricolage Grotesque** (self-hosted
  variable font) automatically via global CSS — bold, tight tracking, capitalized. `<h3>`–`<h6>`
  use Helvetica Neue. So for a display heading, use a real `<h1>`/`<h2>` (or a component whose
  title is one) rather than a utility class. Global heading rules apply `text-transform: capitalize`;
  opt out with the `home-page` class on an ancestor or `data-no-title-case` on the element.

## Wrapping / setup

Most components are self-contained and need **no provider** — drop them in and they're styled.
Exceptions:
- **Dark mode:** add `class="dark"` to an ancestor (e.g. `<html>`); tokens flip automatically.
- **Tooltip:** wrap in `<TooltipProvider>`.
- **Sidebar:** wrap in `<SidebarProvider>` (it owns the collapsed/expanded state).
- **Form:** compound with `react-hook-form` — spread a `useForm()` object into `<Form>` and use
  `FormField`/`FormItem`/`FormControl`.

All components are exported from `window.HelloHoedspruitDS`. Compound components expose their
parts as separate exports (e.g. `Card` + `CardHeader`/`CardContent`/`CardFooter`/`CardTitle`/`CardDescription`;
`Dialog` + `DialogContent`/`DialogHeader`/…; `Select` + `SelectTrigger`/`SelectContent`/`SelectItem`).
The custom brand components are `PrimaryButton`, `SearchBar`, and `BackArrowIcon`.

## Where the truth lives

- Tokens + global rules: the bound `styles.css` and its `@import` closure (`_ds_bundle.css`, `fonts/fonts.css`).
- Per-component API + usage: each component's `.d.ts` (props) and `.prompt.md`.

## App feature components (the real building blocks)

Beyond the primitives, this library ships the app's actual composed components — prefer these when building Hello Hoedspruit screens:

- **Chrome / navigation:** `BottomNav` (the fixed brown-pill bottom tab bar — Home/Explore/Specials/Events/Profile), `PageHeader` (title + back button + underline), `HomeMasthead` (hH logo + "Hello Hoedspruit" + "YOUR LOWVELD LOCAL" + search), `BackButton`, `GlobalMenu` (slide-out account/help menu).
- **Home sections:** `HomeCategoryChips` (the white rounded category tiles), `HomeSectionHead` (`primary` heading + optional `View all` action).
- **Cards & content:** `EventCard` (`event` prop: title/date/time/location/tag/image_url), `UserCard` (`user` prop), `HeroSection`, `DisplayTitle` (`item` prop; honours `title_override`).
- **Actions:** `FavouriteButton` (`itemId`/`itemType` — heart, absolute-positioned on a card), `ShareButton` (`title`/`url`), `FollowButton` (`targetUserId`), `FollowStats` (`userId`).

These are the components that make a screen look like the app. Compose a home screen as `HomeMasthead` → `HomeCategoryChips` → `HomeSectionHead` + `EventCard`s → `BottomNav`. Data-driven list containers (HomeListings, WhatsOn, etc.) are intentionally not shipped — build lists from `EventCard`/`Card` with your own data.

## One idiomatic snippet

```jsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Badge } from "window.HelloHoedspruitDS";

<Card>                                           {/* rounded-2xl bg-card shadow-card */}
  <CardHeader>
    <div className="flex items-center justify-between gap-2">
      <CardTitle>Blyde River Canyon Lodge</CardTitle>
      <Badge variant="secondary">Featured</Badge> {/* sage */}
    </div>
    <CardDescription>Hoedspruit, Limpopo</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">Riverside suites with sweeping escarpment views.</p>
  </CardContent>
  <CardFooter className="gap-2">
    <Button>Book a stay</Button>                  {/* bg-primary brown, rounded-full */}
    <Button variant="outline">Save</Button>
  </CardFooter>
</Card>
```
