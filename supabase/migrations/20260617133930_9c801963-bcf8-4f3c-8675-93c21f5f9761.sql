
-- Auto-expire suspensions whenever an enforcement check runs
CREATE OR REPLACE FUNCTION public.assert_account_active(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_until timestamptz;
BEGIN
  SELECT moderation_status, suspended_until
    INTO v_status, v_until
    FROM public.profiles WHERE id = _user_id;
  IF v_status = 'suspended' AND v_until IS NOT NULL AND v_until <= now() THEN
    UPDATE public.profiles
       SET moderation_status = 'active', suspended_until = NULL, moderation_reason = NULL
     WHERE id = _user_id;
    v_status := 'active';
  END IF;
  IF v_status = 'banned' THEN
    RAISE EXCEPTION 'Your account is banned and cannot perform this action.' USING ERRCODE = '42501';
  END IF;
  IF v_status = 'suspended' THEN
    RAISE EXCEPTION 'Your account is suspended until %.', to_char(v_until, 'DD Mon YYYY') USING ERRCODE = '42501';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.assert_account_active(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assert_account_active(uuid) TO authenticated;

-- Trigger: block writes from moderated users
CREATE OR REPLACE FUNCTION public.enforce_active_account_tg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  PERFORM public.assert_account_active(auth.uid());
  RETURN NEW;
END;
$$;

-- Attach to user-content tables. Wrap each in a DO so missing tables don't fail the migration.
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'reviews','follows','user_reports','feedback','contact_submissions',
    'listing_edits_pending','events_pending','specials_pending','feature_requests','claim_requests'
  ]) LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS enforce_active_account ON public.%I', t);
      EXECUTE format('CREATE TRIGGER enforce_active_account BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.enforce_active_account_tg()', t);
    END IF;
  END LOOP;
END $$;

-- Hide banned profiles from public search & follower lists
CREATE OR REPLACE FUNCTION public.search_public_profiles(_term text, _limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, display_name text, avatar_url text, location text, username text, activity_private boolean, is_private boolean)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT id, display_name, avatar_url, location, username, activity_private, is_private
  FROM public.profiles
  WHERE COALESCE(moderation_status,'active') <> 'banned'
    AND (_term IS NULL OR _term = ''
      OR display_name ILIKE '%' || _term || '%'
      OR username ILIKE '%' || _term || '%')
  ORDER BY created_at DESC
  LIMIT GREATEST(_limit, 1);
$function$;

CREATE OR REPLACE FUNCTION public.get_followers(_user_id uuid)
 RETURNS TABLE(id uuid, display_name text, avatar_url text, location text, username text, activity_private boolean)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT p.id, p.display_name, p.avatar_url, p.location, p.username, p.activity_private
  FROM public.follows f JOIN public.profiles p ON p.id = f.follower_id
  WHERE f.following_id = _user_id AND f.status = 'accepted'
    AND COALESCE(p.moderation_status,'active') <> 'banned'
    AND NOT EXISTS (SELECT 1 FROM public.user_blocks ub
      WHERE (ub.blocker_id = auth.uid() AND ub.blocked_id = p.id)
         OR (ub.blocker_id = p.id AND ub.blocked_id = auth.uid()));
$function$;

CREATE OR REPLACE FUNCTION public.get_following(_user_id uuid)
 RETURNS TABLE(id uuid, display_name text, avatar_url text, location text, username text, activity_private boolean)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT p.id, p.display_name, p.avatar_url, p.location, p.username, p.activity_private
  FROM public.follows f JOIN public.profiles p ON p.id = f.following_id
  WHERE f.follower_id = _user_id AND f.status = 'accepted'
    AND COALESCE(p.moderation_status,'active') <> 'banned'
    AND NOT EXISTS (SELECT 1 FROM public.user_blocks ub
      WHERE (ub.blocker_id = auth.uid() AND ub.blocked_id = p.id)
         OR (ub.blocker_id = p.id AND ub.blocked_id = auth.uid()));
$function$;
