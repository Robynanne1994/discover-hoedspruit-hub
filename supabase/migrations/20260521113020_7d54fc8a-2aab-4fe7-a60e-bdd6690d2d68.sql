
-- Drop the unused tone column
ALTER TABLE public.bush_telegraph_resources DROP COLUMN IF EXISTS tone;

-- Add new columns to bush_telegraph_resources
ALTER TABLE public.bush_telegraph_resources
  ADD COLUMN IF NOT EXISTS title_override text,
  ADD COLUMN IF NOT EXISTS meta_2 text,
  ADD COLUMN IF NOT EXISTS resource_type text NOT NULL DEFAULT 'link',
  ADD COLUMN IF NOT EXISTS detail_image_url text,
  ADD COLUMN IF NOT EXISTS qr_image_url text,
  ADD COLUMN IF NOT EXISTS admin_name text,
  ADD COLUMN IF NOT EXISTS years_running integer,
  ADD COLUMN IF NOT EXISTS post_frequency text,
  ADD COLUMN IF NOT EXISTS slug text;

-- Slug generator trigger
CREATE OR REPLACE FUNCTION public.generate_local_channel_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  base text;
  candidate text;
  i integer := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base := lower(regexp_replace(regexp_replace(coalesce(NEW.title, ''), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
    IF base = '' THEN
      base := 'channel';
    END IF;
    candidate := base;
    WHILE EXISTS (SELECT 1 FROM public.bush_telegraph_resources WHERE slug = candidate AND id <> NEW.id) LOOP
      i := i + 1;
      candidate := base || '-' || i;
    END LOOP;
    NEW.slug := candidate;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS local_channel_slug_trg ON public.bush_telegraph_resources;
CREATE TRIGGER local_channel_slug_trg
BEFORE INSERT OR UPDATE ON public.bush_telegraph_resources
FOR EACH ROW EXECUTE FUNCTION public.generate_local_channel_slug();

-- Backfill slugs for existing rows
UPDATE public.bush_telegraph_resources SET slug = NULL WHERE slug IS NULL;
UPDATE public.bush_telegraph_resources SET title = title WHERE slug IS NULL;

-- Platforms table
CREATE TABLE IF NOT EXISTS public.local_channel_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.local_channel_platforms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platforms are viewable by everyone" ON public.local_channel_platforms;
CREATE POLICY "Platforms are viewable by everyone"
ON public.local_channel_platforms FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins manage platforms" ON public.local_channel_platforms;
CREATE POLICY "Admins manage platforms"
ON public.local_channel_platforms FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default platforms
INSERT INTO public.local_channel_platforms (name, sort_order) VALUES
  ('Facebook', 0),
  ('WhatsApp', 1),
  ('Instagram', 2),
  ('Websites', 3),
  ('Radio', 4)
ON CONFLICT (name) DO NOTHING;
