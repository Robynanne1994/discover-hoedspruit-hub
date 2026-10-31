ALTER TABLE public.specials ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
UPDATE public.specials SET tags = ARRAY(SELECT btrim(t) FROM unnest(ARRAY[tag, sub_tag_1, sub_tag_2]) t WHERE t IS NOT NULL AND btrim(t) <> '');
COMMENT ON COLUMN public.specials.sub_tag_1 IS 'DEPRECATED: replaced by tags';
COMMENT ON COLUMN public.specials.sub_tag_2 IS 'DEPRECATED: replaced by tags';