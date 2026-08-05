-- Let an event host link to a business that is already on the app.
--
-- A host card could only ever carry hosted_by_link, an outbound URL that opens
-- in a new tab. Most hosts are businesses with a listing of their own, so the
-- only way to point at them was to paste the public app URL by hand — which
-- leaves the app instead of navigating inside it.
--
-- hosted_by_listing_id is the alternative: pick the listing and the host card
-- routes straight to it. The two are mutually exclusive per host — the editor
-- writes one or the other, and the link column is cleared when a listing is
-- chosen (and vice versa).

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS hosted_by_listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hosted_by_listing_id_2 uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hosted_by_listing_id_3 uuid REFERENCES public.listings(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.events.hosted_by_listing_id IS
  'Listing the first host card links to. Alternative to hosted_by_link; when set the card routes to /listing/<id> instead of an outbound URL.';
COMMENT ON COLUMN public.events.hosted_by_listing_id_2 IS
  'Listing the second host card links to. Alternative to hosted_by_link_2.';
COMMENT ON COLUMN public.events.hosted_by_listing_id_3 IS
  'Listing the third host card links to. Alternative to hosted_by_link_3.';
