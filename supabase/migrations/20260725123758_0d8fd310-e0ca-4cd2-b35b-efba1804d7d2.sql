ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS community_follow_requests boolean NOT NULL DEFAULT true;