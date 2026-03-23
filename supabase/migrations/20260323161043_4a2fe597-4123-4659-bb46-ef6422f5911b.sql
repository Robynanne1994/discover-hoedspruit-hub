
-- Create subcategories table
CREATE TABLE public.subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add subcategory_id to listings
ALTER TABLE public.listings ADD COLUMN subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Subcategories are viewable by everyone"
ON public.subcategories FOR SELECT TO public USING (true);

-- Admin manage
CREATE POLICY "Admins can manage subcategories"
ON public.subcategories FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
