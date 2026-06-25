
DROP POLICY IF EXISTS "Published articles are viewable by everyone" ON public.articles;
CREATE POLICY "Published articles are viewable by authenticated users"
  ON public.articles FOR SELECT TO authenticated
  USING (is_published = true);

DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by authenticated users"
  ON public.reviews FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Listing categories are viewable by everyone" ON public.listing_categories;
CREATE POLICY "Listing categories are viewable by authenticated users"
  ON public.listing_categories FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Listing subcategories are viewable by everyone" ON public.listing_subcategories;
CREATE POLICY "Listing subcategories are viewable by authenticated users"
  ON public.listing_subcategories FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Listing sub-subcategories are viewable by everyone" ON public.listing_sub_subcategories;
CREATE POLICY "Listing sub-subcategories are viewable by authenticated users"
  ON public.listing_sub_subcategories FOR SELECT TO authenticated
  USING (true);

REVOKE SELECT ON public.articles FROM anon;
REVOKE SELECT ON public.reviews FROM anon;
REVOKE SELECT ON public.listing_categories FROM anon;
REVOKE SELECT ON public.listing_subcategories FROM anon;
REVOKE SELECT ON public.listing_sub_subcategories FROM anon;
