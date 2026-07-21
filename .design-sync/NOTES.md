# Design-sync notes — discover-hoedspruit-hub (Hello Hoedspruit)

Repo-specific gotchas for future syncs. This repo is a **Lovable-generated Vite + React + shadcn/ui app**, not a published component library, so the sync runs in **synth-entry (package) mode**.

## Install / package manager
- **`bun install` fails**: `bun.lock` pins a private Lovable registry (`europe-west4-npm.pkg.dev/lovable-core-prod/...`) that returns 403 through the agent proxy. Do NOT use bun here.
- **`npm ci` fails**: `package-lock.json` is stale (`Missing: stackback@0.0.2 from lock file`). Use **`npm install`** (reconciles against the public `registry.npmjs.org`, which is in the proxy no-proxy list). The lock changes it makes are not committed as part of the sync.

## Build shape
- No library `dist/` — it's an app. The converter runs **synth-entry mode** (`export * from` every file under `srcDir`).
- `node_modules/vite_react_shadcn_ts` doesn't exist (repo won't self-install), so `package-build` can't find `PKG_DIR`. Fix: **self-referential symlink** `ln -sfn "$(pwd)" node_modules/vite_react_shadcn_ts` (recreate per fresh clone; it's under node_modules so gitignored).
- **Scope = `src/components`** (`cfg.srcDir`) — covers the shadcn `ui/` primitives AND the app's feature components. NOTE: the feature components import Supabase / react-router / react-query, and the Supabase client (`src/integrations/supabase/client.ts`) calls `createClient(import.meta.env.VITE_...)` at module top level — which would throw at IIFE load and kill `window.HelloHoedspruitDS`. That's why the build **mocks the data layer** (see "Feature components" section below): `cfg.tsconfig` aliases the Supabase client + auth hooks to `.design-sync/mocks/`. Without those mocks, narrow the scope back to `src/components/ui` to avoid the poisoning.

## CSS / tokens
- `src/index.css` is **Tailwind source** (`@tailwind`/`@apply`), NOT compiled CSS. Component utility classes (`bg-primary`, etc.) only exist after a Tailwind compile.
- `cfg.buildCmd` compiles it: `npx tailwindcss -i src/index.css -o .design-sync/.cache/compiled.css --content './src/**/*.{ts,tsx}' --minify`. `cfg.cssEntry` points at that compiled file. Regenerate on every sync (buildCmd runs it).
- Tokens are HSL CSS vars in `:root` / `.dark` (light + dark themes). Radius `--radius: 1rem`.

## Fonts
- Self-hosted **Helvetica Neue** family (`public/fonts/*.woff2`, 7 weights) — referenced by `@font-face` in `index.css` with absolute `/fonts/...` URLs.
- Also in `public/fonts`: `HelveticaWorldRegular.woff2`, `PlayfairDisplay-Regular.woff2` (not referenced by index.css @font-face).
- **"Bricolage Grotesque"** is used for `h1/h2` and `--font-heading`. The repo loads it from the Google Fonts CDN (`<link>` in `index.html`) — NOT self-hosted in the repo. For the sync it is self-hosted: the variable woff2 (latin) was fetched from Google Fonts into `.design-sync/fonts/BricolageGrotesque-Variable.woff2` and wired via `cfg.extraFonts` (`.design-sync/fonts.css`), so designs render headings on-brand.

## Component surface
- shadcn `ui/*.tsx` use **named** exports (many sub-components per file: Card/CardHeader/…, DropdownMenu + ~15 parts).
- Custom `ui/`: `PrimaryButton`, `SearchBar`, `BackArrowIcon` — **default** exports.
- `chart.tsx` imports `recharts` and is **unused** in the app.

## Preview authoring learnings (first sync — folded from batch runs)

### Build/override ordering — IMPORTANT
- `preview-rebuild.mjs` (scoped) hard-exits with `[CONFIG_STALE]` when a component's `cfg.overrides` slice differs from the last full `package-build` stamp. **`viewport` IS part of the graded slice (only `cardMode`/`primaryStory` are stripped)** — so whenever you add/change an override's `viewport`, run a full `package-build.mjs` to re-stamp BEFORE any scoped rebuild/capture. On this first sync the overlay/wide overrides were added after the first full build, so all overlay/panel batches had to route scoped rebuilds around it; the final full build re-stamps cleanly.

### Overlay open-state recipes (all verified rendering open)
- Dialog / Sheet: `<X open modal={false}>` (modal=false drops the dark backdrop).
- DropdownMenu: `<DropdownMenu open modal={false}>`.
- Popover / HoverCard / Tooltip: `<X open>` (+ `<TooltipProvider>` for Tooltip); ~90px top padding on the wrapper so upward-anchored content isn't clipped.
- Select: `<Select open defaultValue="…">`.
- Menubar / NavigationMenu: controlled `value="…"` on both the root and the matching item to force one menu open.
- Command: renders INLINE (cmdk) — no open prop; give it a fixed width (~380) + border.
- **AlertDialog**: has NO `modal` prop — its `bg-black/80` overlay always mounts. Lift the content above it: on `AlertDialogContent` set `position:relative; transform:none; left:auto; top:auto; margin:48px auto 0; zIndex:60; backgroundColor:hsl(var(--background))`.
- **ContextMenu**: no `open`/`defaultOpen`; `forceMount` renders it at opacity 0. Open it with a `useEffect` dispatching a synthetic `contextmenu` MouseEvent at the trigger center (React hooks work in previews).
- **Sidebar**: use `<SidebarProvider defaultOpen><Sidebar collapsible="none">` — the default `offcanvas` variant is `md:hidden`/zero-width and screenshots blank.
- **Carousel / ResizablePanelGroup / Drawer**: give the wrapper an explicit height AND width or they collapse to zero. Carousel needs ~64px horizontal padding so the `-left-12/-right-12` arrows sit inside the card. Drawer (vaul) open-transform is a residual risk; fallback is inline `transform:none` on `DrawerContent`.

### Custom brand component APIs (NOT standard shadcn — read source)
- **PrimaryButton** (default export, re-exported via extra-exports): polymorphic (`as="a"` needs `href`); props `fullWidth`, `leftIcon`, `rightIcon` (you pass the icon node), native button/anchor attrs. 100% inline-styled pill (`#423324`, radius 9999, height 48, `text-transform: capitalize`). NO `variant`/`size` props.
- **SearchBar** (default export): controlled-only — `value: string` + `onChange: (value:string)=>void` (string, not event). `variant`: `light` (default, white — invisible on cream, put on a contrasting panel) or `cream` (for dark surfaces). Built-in Search icon, pill shape.
- **BackArrowIcon** (default export): pure SVG, props `size` (18), `color` (#2A2A24). Pair with context (chip/header) so it's not a lone glyph.

### Token/contrast quirks (source-faithful, don't "fix")
- `Label` is hard-styled `text-lg font-bold` — only use it on real controls; use plain `<p>/<span>` for section captions in previews.
- `Switch` off-track, `Input`/`Textarea` fields are hard-coded near-white with dark borders (not `--input`/`--background`).
- `bg-border`/`bg-muted` (~`35 15% 88-91%`) are very close to the cream `--background` — components relying on them for visible shape need an off-white wrapper or explicit divider color (affected Separator vertical, InputOTP slots, Calendar chevrons — all cosmetic).
- `Slider` = sage (`bg-secondary`) track + brown (`bg-primary`) range. `Badge` variants map brown/sage/terracotta/outline.
- `ToggleGroup` `defaultValue` must reference a real item value or nothing shows pressed.

### Capture environment
- Remote images (Unsplash etc.) do NOT load in the headless capture env. Preview authors used solid brand-color fallbacks in `AspectRatio` (`<img>` inline `background`) and rely on `AvatarFallback` initials. Those cells are tied to that fallback, not a real photo.

## Known render warns (triaged as legitimate — re-syncs should not treat as new)
- `[FONT_MISSING]` for "Bricolage Grotesque" only fires if `.design-sync/fonts.css` (self-hosted Bricolage) is missing — it's shipped via `cfg.extraFonts`, so this should stay resolved.
- Faint `border-input` on InputOTP slots; light Calendar nav chevrons — cosmetic, DS token characteristic.

## Re-sync risks (what can silently go stale)
- **Override ordering**: adding/editing any `cfg.overrides.*.viewport` requires a full `package-build` re-stamp before scoped `preview-rebuild` (see above).
- **Self-hosted Bricolage Grotesque** (`.design-sync/fonts/BricolageGrotesque-Variable.woff2`) was fetched once from Google Fonts (variable, latin subset). The repo itself loads Bricolage from the Google Fonts CDN (`<link>` in index.html). If the family/weights change upstream, refetch.
- **Compiled CSS + safelist**: `cfg.buildCmd` regenerates `.design-sync/.cache/compiled.css` from `src/index.css` + `.design-sync/safelist.txt` (a durable, committed list of token utilities so the shipped CSS exposes the full color/radius/shadow vocabulary, not just classes used in src). Both are inputs to every build.
- **Self-referential symlink** `node_modules/vite_react_shadcn_ts -> repo root` must be recreated per fresh clone (it's under node_modules, gitignored) before `package-build` can find PKG_DIR.
- **Remote-image preview cells** (AspectRatio/Avatar) depend on the capture env's network fallback behaviour.
- **Full npm install** (not `npm ci`) is required (stale lockfile); recharts must be present (chart.tsx is pruned but the file is bundled).

## Feature components (second pass — the app's real building blocks)

The primitive-only sync looked "off-brand" because the app's identity lives in feature components. This pass widens the build to `src/components/*` and adds them.

### What makes it work (infra — all in `.design-sync/`)
- **`cfg.srcDir = "src/components"`** — widened so feature components are in the bundle. `cfg.tsconfig = ".design-sync/tsconfig.ds.json"` aliases the data layer.
- **Mocks** (`.design-sync/mocks/`): `supabase.ts` (chainable, thenable, resolves empty — stops the client throwing at IIFE load), `useAuth.tsx` (guest passthrough). Wired via tsconfig `paths`.
- **`cfg.provider = {component: "DsPreviewProvider"}`** — defined in `extra-exports.tsx`, wraps every preview in `MemoryRouter > QueryClientProvider > AuthProvider > GuestAuthProvider`. **All four are required**: components use `useLocation`/`Link` (router), `useQuery` (query), `useAuth` (AuthProvider), and `FavouriteButton` needs `GuestAuthProvider` (else "useGuestAuth must be used within GuestAuthProvider" → blank card).
- **Image aliases**: the bundle has no `.jpg` loader, so `@/assets/*.jpg` imports are aliased in `tsconfig.ds.json` to data-URL mock files (`.design-sync/mocks/img-*.ts`) — 3 real card images inlined, the 432KB hero replaced with a light SVG placeholder. `.png`/`.svg`/`.woff2` load natively (dataurl).
- **Feature default exports** (all 15 are `export default`) are named-re-exported in `extra-exports.tsx` so they land on the window global (ESM `export *` drops defaults). Expect a non-fatal `[EXPORT_COLLISION]` warning listing them — it's fine (the main package doesn't actually export those names).
- **Fixed-position components** (BottomNav) need a `transform: translateZ(0)` wrapper in the preview so `position:fixed` anchors to the card, not the page. `cardMode: single` + a viewport override frames the full-screen/tall ones (HeroSection, GlobalMenu, HomeMasthead, PageHeader, HomeCategoryChips).

### Kept feature components (15, grouped by folder)
BottomNav, PageHeader, BackButton, DisplayTitle, FavouriteButton, ShareButton, HeroSection, GlobalMenu (general); HomeMasthead, HomeSectionHead, HomeCategoryChips (home); EventCard (events); UserCard, FollowButton, FollowStats (social).

### Nulled / skipped (won't render meaningfully with empty mock data)
- **ModerationBanner, OfflineScreen** — return `null` unless a suspended-status / offline condition holds (mock has neither). Nulled.
- **admin/** editors, **legal/**, **Refine\*** drawer parts, **Home{Listings,WhatsOn,Specials,LocalChannels}**, **CategoriesSection/EventsSection/WeatherSection/ReviewSection/ListingActions/ProfileForm** — data-fetch containers that render empty with the empty Supabase mock. Nulled for now. **To populate them later**: seed the React Query cache in `DsPreviewProvider`, or make `mocks/supabase.ts` return representative rows per table (currently returns `[]`).

### Re-sync risk
- The mocks return EMPTY data by design. If you want the container sections (home lists) populated, extend `mocks/supabase.ts` with canned rows — but keep it in sync with the real table shapes.
- `tsconfig.ds.json` `extends ../tsconfig.json`; if the repo's tsconfig paths change, re-check the aliases.
