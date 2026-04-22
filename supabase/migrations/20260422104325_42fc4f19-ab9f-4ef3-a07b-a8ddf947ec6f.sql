-- Add image and tag columns to bush_telegraph_resources
ALTER TABLE public.bush_telegraph_resources
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS tag_1 text,
  ADD COLUMN IF NOT EXISTS tag_2 text;

-- Create public storage bucket for Local Channels images
INSERT INTO storage.buckets (id, name, public)
VALUES ('local-channels-images', 'local-channels-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, admins manage
DO $$ BEGIN
  CREATE POLICY "Local Channels images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'local-channels-images');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can upload Local Channels images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'local-channels-images' AND public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update Local Channels images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'local-channels-images' AND public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete Local Channels images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'local-channels-images' AND public.has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;