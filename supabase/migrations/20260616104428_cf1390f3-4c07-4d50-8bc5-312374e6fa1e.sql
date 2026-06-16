DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
CREATE POLICY "Follows are viewable by authenticated users"
  ON public.follows FOR SELECT
  TO authenticated
  USING (true);
REVOKE SELECT ON public.follows FROM anon;