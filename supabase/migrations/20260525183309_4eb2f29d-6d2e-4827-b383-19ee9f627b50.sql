
CREATE TABLE public.sub_subcategories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subcategory_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sub_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sub-subcategories are viewable by everyone"
ON public.sub_subcategories FOR SELECT USING (true);

CREATE POLICY "Admins can manage sub-subcategories"
ON public.sub_subcategories FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_sub_subcategories_updated_at
BEFORE UPDATE ON public.sub_subcategories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_sub_subcategories_subcategory_id ON public.sub_subcategories(subcategory_id);

CREATE TABLE public.listing_sub_subcategories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL,
  sub_subcategory_id uuid NOT NULL,
  UNIQUE (listing_id, sub_subcategory_id)
);

ALTER TABLE public.listing_sub_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Listing sub-subcategories are viewable by everyone"
ON public.listing_sub_subcategories FOR SELECT USING (true);

CREATE POLICY "Admins can manage listing sub-subcategories"
ON public.listing_sub_subcategories FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_listing_sub_subcategories_listing_id ON public.listing_sub_subcategories(listing_id);
CREATE INDEX idx_listing_sub_subcategories_sub_subcategory_id ON public.listing_sub_subcategories(sub_subcategory_id);
