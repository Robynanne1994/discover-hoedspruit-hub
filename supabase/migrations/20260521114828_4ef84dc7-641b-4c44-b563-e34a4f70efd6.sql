ALTER TABLE public.bush_telegraph_resources
  ADD COLUMN IF NOT EXISTS since_year integer,
  ADD COLUMN IF NOT EXISTS admins jsonb NOT NULL DEFAULT '[]'::jsonb;