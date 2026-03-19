-- Create a public storage bucket for category images
INSERT INTO storage.buckets (id, name, public) VALUES ('category-images', 'category-images', true);

-- Allow anyone to read category images
CREATE POLICY "Category images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'category-images');

-- Allow admins to upload category images
CREATE POLICY "Admins can upload category images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'category-images' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to update category images
CREATE POLICY "Admins can update category images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'category-images' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete category images
CREATE POLICY "Admins can delete category images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'category-images' AND public.has_role(auth.uid(), 'admin'));