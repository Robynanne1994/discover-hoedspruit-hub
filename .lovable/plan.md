# Smarter "Top Rated" sort (no UI rating changes)

## Goal

Keep every displayed rating exactly as it is today (Google star + count on cards, real user-review average on the listing detail page). **Only the "Top Rated" sort order changes** so a single 5★ review can't outrank a place with hundreds of strong reviews.

## What changes

- **Sorting only**: the "Top Rated" option in the Category page sort dropdown (`src/pages/CategoryPage.tsx`, line 444) will sort by a fair, sample-size-aware score instead of raw `google_rating`.
- **Nothing visible changes** on cards, listing detail, reviews section, or homepage rails.

## How the score works (Bayesian average)

```text
score = (v / (v + m)) * R + (m / (v + m)) * C
```

- `R` = the listing's average rating
- `v` = number of reviews backing that rating
- `C` = global average rating across all listings (the "prior")
- `m` = smoothing weight — how many reviews a listing needs before its own rating dominates the prior

Effect: listings with very few reviews get pulled toward the global average, so they can't leapfrog well-reviewed places. Once a listing has enough reviews, its real rating takes over.

### Combining Google + internal reviews

Each listing has two rating sources:
- Google: `google_rating` + `google_reviews_count`
- Internal: average + count from the `reviews` table

We combine them into one `(R, v)` pair using a weighted average:
- `v = google_reviews_count + internal_count`
- `R = (google_rating * google_count + internal_avg * internal_count) / v`

Then apply the Bayesian formula above.

### Constants

- `m = 5` (low bar suited to a small-town directory)
- `C = 4.3` (hardcoded, stable global prior — matches typical Google averages locally)

Listings with zero reviews from both sources get score = `C`, so they sit in the middle rather than at the top or bottom.

## Technical details

1. Add a small helper `src/lib/ratingScore.ts` exporting `bayesianScore(listing, internalAvg, internalCount)`.
2. In `CategoryPage.tsx`, fetch per-listing internal review aggregates once (single query: `select listing_id, rating from reviews where listing_id in (...)`), build a map, and use it in the `sortBy === "rating"` branch.
3. No schema changes, no triggers, no migrations. Pure client-side sort tweak.
4. The `ReviewSection` component and all displayed ratings are untouched.

## Out of scope

- Homepage "Top Rated" rails (if any exist) — can be migrated later if you want consistency.
- Showing the Bayesian score anywhere in the UI.
- Storing the score on the listing row.
