ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS emergency_24hr boolean,
ADD COLUMN IF NOT EXISTS practitioners text[] DEFAULT '{}'::text[];