
ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS long_description text,
  ADD COLUMN IF NOT EXISTS gallery_images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS opening_hours jsonb DEFAULT '{}';

-- Create storage bucket for listing gallery images
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to listing images
CREATE POLICY "Listing images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'listing-images');

-- Allow admins to upload listing images
CREATE POLICY "Admins can upload listing images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listing-images' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete listing images
CREATE POLICY "Admins can delete listing images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'listing-images' AND public.has_role(auth.uid(), 'admin'));
