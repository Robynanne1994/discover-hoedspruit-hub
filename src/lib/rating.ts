// Bayesian weighted rating used for the "Highest Rated" sort only.
// A listing with a single 5 star review should not outrank a listing with
// 4.8 stars from 700 reviews, so each listing's rating is pulled towards the
// category mean until it has enough reviews to be trusted on its own.
//
// The score is internal to sorting — cards keep showing the real
// google_rating and google_reviews_count.

export const RATING_CONFIDENCE = 20; // m: reviews needed before a rating is trusted
export const RATING_FALLBACK_MEAN = 4.4; // C fallback

export function bayesianRating(rating: number, count: number, mean: number) {
  const m = RATING_CONFIDENCE;
  return (count / (count + m)) * rating + (m / (count + m)) * mean;
}
