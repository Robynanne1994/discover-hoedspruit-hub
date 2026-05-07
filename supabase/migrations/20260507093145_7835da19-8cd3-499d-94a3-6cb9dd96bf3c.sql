CREATE POLICY "Business owners can upload listing images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'listing-images' AND has_role(auth.uid(), 'business_owner'::app_role));

CREATE POLICY "Business owners can update listing images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'listing-images' AND has_role(auth.uid(), 'business_owner'::app_role));