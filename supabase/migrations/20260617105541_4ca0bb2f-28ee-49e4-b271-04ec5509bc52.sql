DROP VIEW IF EXISTS public.profiles_public;

DROP POLICY IF EXISTS "Users can remove their own followers" ON public.follows;
CREATE POLICY "Users can remove their own followers" ON public.follows
  FOR DELETE TO authenticated
  USING (auth.uid() = following_id);