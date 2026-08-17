-- Surface-specific pictures: the homepage row and the round search thumbnail.
--
-- Every other surface already had its own column, so a picture cropped for the
-- detail hero could be replaced with one cropped for the saved card without
-- either screen borrowing the other's crop. Two surfaces were still sharing:
--
--   * the homepage rows paint listings into a SQUARE tile, but listings only had
--     the 4:3 cover to give them, so `object-fit: cover` shaved a third off
--     every one of them;
--   * search results paint a 42px circle for all four content types, which
--     throws away the corners of any crop made for a rectangle.
--
-- Both are nullable and every read falls back to the existing image, so rows
-- that never get one behave exactly as they do today.

ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS homepage_image_url text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS search_image_url text;

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS search_image_url text;
ALTER TABLE public.specials ADD COLUMN IF NOT EXISTS search_image_url text;
ALTER TABLE public.bush_telegraph_resources ADD COLUMN IF NOT EXISTS search_image_url text;
