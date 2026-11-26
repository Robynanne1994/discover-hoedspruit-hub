ALTER TABLE public.specials ADD COLUMN IF NOT EXISTS special_link text;
ALTER TABLE public.specials ADD COLUMN IF NOT EXISTS special_link_label text;
ALTER TABLE public.specials ADD COLUMN IF NOT EXISTS is_done boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.special_done_inactive()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.is_done THEN
    NEW.is_active := false;
    NEW.auto_activate_on_image := false;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS zz_special_done_inactive ON public.specials;
CREATE TRIGGER zz_special_done_inactive BEFORE INSERT OR UPDATE ON public.specials
FOR EACH ROW EXECUTE FUNCTION public.special_done_inactive();