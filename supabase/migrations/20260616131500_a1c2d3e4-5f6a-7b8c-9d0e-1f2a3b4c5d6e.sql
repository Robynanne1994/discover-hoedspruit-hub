-- Store the user's name as separate first_name and surname fields.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS surname text;

-- Best-effort backfill for existing rows: split the current display_name on
-- the first space. Users can correct this from the edit profile screen.
UPDATE public.profiles
SET first_name = NULLIF(split_part(trim(display_name), ' ', 1), '')
WHERE first_name IS NULL AND display_name IS NOT NULL;

UPDATE public.profiles
SET surname = NULLIF(trim(substring(trim(display_name) from '\s(.*)$')), '')
WHERE surname IS NULL AND display_name IS NOT NULL AND position(' ' in trim(display_name)) > 0;

-- Auto-create profile on signup, now storing first_name/surname from the
-- signup metadata and a combined display_name.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first text := NULLIF(trim(NEW.raw_user_meta_data->>'first_name'), '');
  v_surname text := NULLIF(trim(NEW.raw_user_meta_data->>'surname'), '');
  v_display text := NULLIF(trim(NEW.raw_user_meta_data->>'display_name'), '');
BEGIN
  INSERT INTO public.profiles (id, first_name, surname, display_name)
  VALUES (
    NEW.id,
    v_first,
    v_surname,
    COALESCE(
      v_display,
      NULLIF(trim(concat_ws(' ', v_first, v_surname)), ''),
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$;
