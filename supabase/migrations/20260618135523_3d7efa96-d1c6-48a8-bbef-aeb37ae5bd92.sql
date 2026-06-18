
DROP POLICY IF EXISTS "Listings are viewable by everyone" ON public.listings;
CREATE POLICY "Listings are viewable by authenticated users"
  ON public.listings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
CREATE POLICY "Events are viewable by authenticated users"
  ON public.events FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Active specials are viewable by everyone" ON public.specials;
CREATE POLICY "Active specials are viewable by authenticated users"
  ON public.specials FOR SELECT TO authenticated USING (is_active = true);

REVOKE SELECT ON public.listings FROM anon;
REVOKE SELECT ON public.events FROM anon;
REVOKE SELECT ON public.specials FROM anon;
