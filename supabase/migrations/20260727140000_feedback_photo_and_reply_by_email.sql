-- Feedback UX: optional photo attachment + "reply to me by email" preference.

-- 1) New columns on feedback
ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS reply_by_email boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reply_email text;

-- 2) Make sure users can read back their own feedback (needed for "My Replies").
--    Idempotent: drop first so re-running the migration is safe.
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.feedback;
CREATE POLICY "Users can view their own feedback"
ON public.feedback
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3) Storage bucket for user-uploaded feedback screenshots/photos.
INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback-images', 'feedback-images', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view feedback images (public bucket, referenced by public URL).
DROP POLICY IF EXISTS "Feedback images are publicly viewable" ON storage.objects;
CREATE POLICY "Feedback images are publicly viewable"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'feedback-images');

-- Authenticated users can upload into their own folder (name prefixed with their uid).
DROP POLICY IF EXISTS "Users can upload own feedback image" ON storage.objects;
CREATE POLICY "Users can upload own feedback image"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'feedback-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can replace/remove their own feedback images.
DROP POLICY IF EXISTS "Users can update own feedback image" ON storage.objects;
CREATE POLICY "Users can update own feedback image"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'feedback-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own feedback image" ON storage.objects;
CREATE POLICY "Users can delete own feedback image"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'feedback-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
