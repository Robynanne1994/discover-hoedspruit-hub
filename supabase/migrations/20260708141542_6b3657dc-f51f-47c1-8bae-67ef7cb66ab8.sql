
-- LISTINGS: allow anon SELECT
DROP POLICY IF EXISTS "Listings are viewable by authenticated users" ON public.listings;
CREATE POLICY "Listings are viewable by everyone"
  ON public.listings FOR SELECT
  TO anon, authenticated
  USING (true);
GRANT SELECT ON public.listings TO anon;

-- EVENTS: allow anon SELECT
DROP POLICY IF EXISTS "Events are viewable by authenticated users" ON public.events;
CREATE POLICY "Events are viewable by everyone"
  ON public.events FOR SELECT
  TO anon, authenticated
  USING (true);
GRANT SELECT ON public.events TO anon;

-- SPECIALS: allow anon SELECT of active
DROP POLICY IF EXISTS "Active specials are viewable by authenticated users" ON public.specials;
CREATE POLICY "Active specials are viewable by everyone"
  ON public.specials FOR SELECT
  TO anon, authenticated
  USING (is_active = true);
GRANT SELECT ON public.specials TO anon;

-- LISTING TAXONOMY JOIN TABLES: allow anon SELECT
DROP POLICY IF EXISTS "Listing categories are viewable by authenticated users" ON public.listing_categories;
CREATE POLICY "Listing categories are viewable by everyone"
  ON public.listing_categories FOR SELECT
  TO anon, authenticated
  USING (true);
GRANT SELECT ON public.listing_categories TO anon;

DROP POLICY IF EXISTS "Listing subcategories are viewable by authenticated users" ON public.listing_subcategories;
CREATE POLICY "Listing subcategories are viewable by everyone"
  ON public.listing_subcategories FOR SELECT
  TO anon, authenticated
  USING (true);
GRANT SELECT ON public.listing_subcategories TO anon;

DROP POLICY IF EXISTS "Listing sub-subcategories are viewable by authenticated users" ON public.listing_sub_subcategories;
CREATE POLICY "Listing sub-subcategories are viewable by everyone"
  ON public.listing_sub_subcategories FOR SELECT
  TO anon, authenticated
  USING (true);
GRANT SELECT ON public.listing_sub_subcategories TO anon;

-- ARTICLES: allow anon SELECT of published
DROP POLICY IF EXISTS "Published articles are viewable by authenticated users" ON public.articles;
CREATE POLICY "Published articles are viewable by everyone"
  ON public.articles FOR SELECT
  TO anon, authenticated
  USING (is_published = true);
GRANT SELECT ON public.articles TO anon;

-- REVIEWS: allow anon SELECT (reviews are public content on listing pages)
DROP POLICY IF EXISTS "Reviews are viewable by authenticated users" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  TO anon, authenticated
  USING (true);
GRANT SELECT ON public.reviews TO anon;
