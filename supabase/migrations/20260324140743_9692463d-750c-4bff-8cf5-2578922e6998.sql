
-- Junction table for many-to-many listing <-> category
CREATE TABLE public.listing_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  UNIQUE (listing_id, category_id)
);

ALTER TABLE public.listing_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Listing categories are viewable by everyone"
  ON public.listing_categories FOR SELECT TO public
  USING (true);

CREATE POLICY "Admins can manage listing categories"
  ON public.listing_categories FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Migrate existing category_id data into junction table
INSERT INTO public.listing_categories (listing_id, category_id)
SELECT id, category_id FROM public.listings WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING;
