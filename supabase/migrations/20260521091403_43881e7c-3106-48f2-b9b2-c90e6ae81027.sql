ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS hosted_by_link text,
ADD COLUMN IF NOT EXISTS hosted_by_link_2 text,
ADD COLUMN IF NOT EXISTS hosted_by_link_3 text;