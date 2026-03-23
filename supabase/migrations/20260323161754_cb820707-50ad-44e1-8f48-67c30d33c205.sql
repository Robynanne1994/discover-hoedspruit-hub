
-- Create junction table for many-to-many listing <-> subcategory
CREATE TABLE public.listing_subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  subcategory_id UUID NOT NULL REFERENCES public.subcategories(id) ON DELETE CASCADE,
  UNIQUE(listing_id, subcategory_id)
);

-- Enable RLS
ALTER TABLE public.listing_subcategories ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Listing subcategories are viewable by everyone"
ON public.listing_subcategories FOR SELECT TO public USING (true);

-- Admin manage
CREATE POLICY "Admins can manage listing subcategories"
ON public.listing_subcategories FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Migrate existing subcategory_id data to junction table
INSERT INTO public.listing_subcategories (listing_id, subcategory_id)
SELECT id, subcategory_id FROM public.listings WHERE subcategory_id IS NOT NULL;

-- Drop the old column
ALTER TABLE public.listings DROP COLUMN subcategory_id;
