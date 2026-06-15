
DROP POLICY IF EXISTS "Business owners can upload listing images" ON storage.objects;
DROP POLICY IF EXISTS "Business owners can update listing images" ON storage.objects;

CREATE POLICY "Business owners can upload images for their listings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listing-images'
  AND public.has_role(auth.uid(), 'business_owner'::public.app_role)
  AND EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.business_owner_id = auth.uid()
      AND (storage.foldername(name))[1] = l.id::text
  )
);

CREATE POLICY "Business owners can update images for their listings"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'listing-images'
  AND public.has_role(auth.uid(), 'business_owner'::public.app_role)
  AND EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.business_owner_id = auth.uid()
      AND (storage.foldername(name))[1] = l.id::text
  )
)
WITH CHECK (
  bucket_id = 'listing-images'
  AND public.has_role(auth.uid(), 'business_owner'::public.app_role)
  AND EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.business_owner_id = auth.uid()
      AND (storage.foldername(name))[1] = l.id::text
  )
);
