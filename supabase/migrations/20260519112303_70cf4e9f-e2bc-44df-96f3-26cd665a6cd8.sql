UPDATE public.listings SET show_attributes = true WHERE show_attributes = false;
ALTER TABLE public.listings ALTER COLUMN show_attributes SET DEFAULT true;