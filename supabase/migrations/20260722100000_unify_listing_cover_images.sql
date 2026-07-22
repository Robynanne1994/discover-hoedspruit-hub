-- One cover image across listing cards, the detail page and saved cards.
-- Copies the detail cover into the card and saved-card slots; the admin
-- editor now writes the same image to all three columns on save.
UPDATE public.listings
SET image_url = detail_image_url,
    saved_image_url = detail_image_url
WHERE detail_image_url IS NOT NULL
  AND (image_url IS DISTINCT FROM detail_image_url
    OR saved_image_url IS DISTINCT FROM detail_image_url);
