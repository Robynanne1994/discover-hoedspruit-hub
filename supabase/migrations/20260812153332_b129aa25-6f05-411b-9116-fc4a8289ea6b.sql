CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_first text := NULLIF(trim(NEW.raw_user_meta_data->>'first_name'), '');
  v_surname text := NULLIF(trim(NEW.raw_user_meta_data->>'surname'), '');
  v_display text := NULLIF(trim(NEW.raw_user_meta_data->>'display_name'), '');
BEGIN
  -- Only materialise a public profile for confirmed accounts. Abandoned
  -- signups (never confirmed) must not show up anywhere in the app.
  IF NEW.email_confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, first_name, surname, display_name, email)
  VALUES (
    NEW.id, v_first, v_surname,
    COALESCE(v_display, NULLIF(trim(concat_ws(' ', v_first, v_surname)), ''), split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  PERFORM public.apply_signup_metadata(NEW.id, NEW.raw_user_meta_data);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_profile_from_auth_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_first text := NULLIF(trim(NEW.raw_user_meta_data->>'first_name'), '');
  v_surname text := NULLIF(trim(NEW.raw_user_meta_data->>'surname'), '');
  v_display text := NULLIF(trim(NEW.raw_user_meta_data->>'display_name'), '');
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  END IF;

  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.profiles (id, first_name, surname, display_name, email)
    VALUES (
      NEW.id, v_first, v_surname,
      COALESCE(v_display, NULLIF(trim(concat_ws(' ', v_first, v_surname)), ''), split_part(NEW.email, '@', 1)),
      NEW.email
    )
    ON CONFLICT (id) DO NOTHING;

    PERFORM public.apply_signup_metadata(NEW.id, NEW.raw_user_meta_data);
  END IF;

  RETURN NEW;
END;
$function$;