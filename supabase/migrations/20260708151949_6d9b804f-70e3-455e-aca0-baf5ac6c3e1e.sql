
CREATE TABLE public.listing_category_order (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  position integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, listing_id)
);

CREATE INDEX idx_lco_category_position ON public.listing_category_order(category_id, position);

GRANT SELECT ON public.listing_category_order TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_category_order TO authenticated;
GRANT ALL ON public.listing_category_order TO service_role;

ALTER TABLE public.listing_category_order ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read listing order"
  ON public.listing_category_order FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert listing order"
  ON public.listing_category_order FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update listing order"
  ON public.listing_category_order FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete listing order"
  ON public.listing_category_order FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_lco_updated_at
  BEFORE UPDATE ON public.listing_category_order
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
