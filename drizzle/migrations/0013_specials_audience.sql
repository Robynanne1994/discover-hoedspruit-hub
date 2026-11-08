ALTER TABLE public.specials ADD COLUMN IF NOT EXISTS whos_it_for text[];
COMMENT ON COLUMN public.specials.whos_it_for IS 'Optional audiences for the individual special Details card.';