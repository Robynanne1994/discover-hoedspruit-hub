
CREATE TABLE public.favourites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('listing', 'event')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id, item_type)
);

ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favourites"
  ON public.favourites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favourites"
  ON public.favourites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favourites"
  ON public.favourites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
