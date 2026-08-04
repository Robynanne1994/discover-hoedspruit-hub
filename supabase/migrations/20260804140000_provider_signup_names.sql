-- ---------------------------------------------------------------------------
-- A provider signup gets the name the provider gave, or no name at all
-- ---------------------------------------------------------------------------
-- handle_new_user() only ever looked for the keys the signup form writes
-- (first_name / surname / display_name) and, finding none, fell back to the
-- local part of the email address. Google and Apple write neither of those:
-- they write full_name / name, or given_name + family_name. So a Google signup
-- came out of this trigger called "robynmcd16" — which is not a name, and which
-- /complete-profile then offered back as the person's first and last name for
-- them to delete before typing their own.
--
-- Two changes:
--   * read the provider's own keys, and split a full name the same way the
--     signup form's single "first and last name" field is split;
--   * when there is genuinely no name to be had, leave it NULL rather than
--     inventing one from the address. An empty name is the honest answer, and
--     it is also what makes needsProfileSetup() ask for one.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_first text := NULLIF(trim(v_meta->>'first_name'), '');
  v_surname text := NULLIF(trim(v_meta->>'surname'), '');
  v_display text := NULLIF(trim(v_meta->>'display_name'), '');
  -- Whatever Google or Apple told us, in the order they tend to tell it.
  v_provider_name text := COALESCE(
    NULLIF(trim(v_meta->>'full_name'), ''),
    NULLIF(trim(v_meta->>'name'), ''),
    NULLIF(
      trim(concat_ws(
        ' ',
        NULLIF(trim(v_meta->>'given_name'), ''),
        NULLIF(trim(v_meta->>'family_name'), '')
      )),
      ''
    )
  );
  v_space int;
BEGIN
  -- Only ever a fallback: the signup form's own keys win when they are there.
  IF v_first IS NULL AND v_provider_name IS NOT NULL THEN
    v_space := position(' ' in v_provider_name);
    IF v_space > 0 THEN
      v_first := NULLIF(trim(substr(v_provider_name, 1, v_space - 1)), '');
      v_surname := COALESCE(v_surname, NULLIF(trim(substr(v_provider_name, v_space + 1)), ''));
    ELSE
      -- A single word is a first name. Guessing a surname from it would only
      -- put the same word in both boxes.
      v_first := v_provider_name;
    END IF;
  END IF;

  INSERT INTO public.profiles (id, first_name, surname, display_name, email)
  VALUES (
    NEW.id,
    v_first,
    v_surname,
    COALESCE(
      v_display,
      NULLIF(trim(concat_ws(' ', v_first, v_surname)), ''),
      v_provider_name
    ),
    NEW.email
  );

  -- Confirmation off (or an already-confirmed provider signup): nothing to
  -- wait for, so claim the handle straight away.
  IF NEW.email_confirmed_at IS NOT NULL THEN
    PERFORM public.apply_signup_metadata(NEW.id, NEW.raw_user_meta_data);
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
