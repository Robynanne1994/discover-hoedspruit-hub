CREATE OR REPLACE FUNCTION public.sync_title_override()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.title_override := NEW.title;
  RETURN NEW;
END $$;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['listings','events','specials','bush_telegraph_resources'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS sync_title_override ON public.%I', t);
    EXECUTE format('CREATE TRIGGER sync_title_override BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.sync_title_override()', t);
  END LOOP;
END $$;