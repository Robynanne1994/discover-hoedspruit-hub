// Bayesian-average rating score used for "Top Rated" sorting only.
// Display values (cards, detail pages) are unaffected.

const PRIOR_MEAN = 4.3; // global average prior C
const SMOOTHING = 5;    // m — reviews needed before listing's own avg dominates

export interface RatingInputs {
  googleRating?: number | null;
  googleCount?: number | null;
  internalAvg?: number | null;
  internalCount?: number | null;
}

export function bayesianScore({
  googleRating,
  googleCount,
  internalAvg,
  internalCount,
}: RatingInputs): number {
  const gC = Math.max(0, googleCount ?? 0);
  const iC = Math.max(0, internalCount ?? 0);
  const gR = googleRating ?? 0;
  const iR = internalAvg ?? 0;

  const v = gC + iC;
  if (v === 0) return PRIOR_MEAN;

  const R = (gR * gC + iR * iC) / v;
  return (v / (v + SMOOTHING)) * R + (SMOOTHING / (v + SMOOTHING)) * PRIOR_MEAN;
}
