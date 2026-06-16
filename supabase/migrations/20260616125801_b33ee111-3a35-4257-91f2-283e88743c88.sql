
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;

DO $$ BEGIN
  CREATE TYPE public.follow_status AS ENUM ('pending','accepted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.follows ADD COLUMN IF NOT EXISTS status public.follow_status NOT NULL DEFAULT 'accepted';
ALTER TABLE public.follows ADD COLUMN IF NOT EXISTS responded_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_follows_status ON public.follows(status);

CREATE OR REPLACE FUNCTION public.set_follow_status_on_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_private boolean;
BEGIN
  IF NEW.follower_id <> auth.uid() THEN
    RAISE EXCEPTION 'Cannot create follow on behalf of another user';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = NEW.follower_id AND blocked_id = NEW.following_id)
       OR (blocker_id = NEW.following_id AND blocked_id = NEW.follower_id)
  ) THEN
    RAISE EXCEPTION 'Cannot follow a blocked user';
  END IF;
  SELECT COALESCE(is_private, false) INTO v_private FROM public.profiles WHERE id = NEW.following_id;
  IF v_private THEN
    NEW.status := 'pending';
  ELSE
    NEW.status := 'accepted';
    NEW.responded_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_follow_status ON public.follows;
CREATE TRIGGER trg_set_follow_status
BEFORE INSERT ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.set_follow_status_on_insert();

DROP POLICY IF EXISTS "Follows are viewable by authenticated users" ON public.follows;
DROP POLICY IF EXISTS "Users can view own follow relationships" ON public.follows;
CREATE POLICY "Users can view own follow relationships"
ON public.follows FOR SELECT TO authenticated
USING (auth.uid() = follower_id OR auth.uid() = following_id);

DROP POLICY IF EXISTS "Target can accept pending follow request" ON public.follows;
CREATE POLICY "Target can accept pending follow request"
ON public.follows FOR UPDATE TO authenticated
USING (auth.uid() = following_id AND status = 'pending')
WITH CHECK (auth.uid() = following_id AND status = 'accepted');

-- RPCs (drop first because return types change)
DROP FUNCTION IF EXISTS public.get_public_profiles(uuid[]);
DROP FUNCTION IF EXISTS public.search_public_profiles(text, integer);
DROP FUNCTION IF EXISTS public.get_follow_counts(uuid);
DROP FUNCTION IF EXISTS public.get_followers(uuid);
DROP FUNCTION IF EXISTS public.get_following(uuid);

CREATE FUNCTION public.get_public_profiles(_ids uuid[])
RETURNS TABLE(id uuid, display_name text, avatar_url text, location text, username text, bio text, activity_private boolean, is_private boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, display_name, avatar_url, location, username, bio, activity_private, is_private
  FROM public.profiles WHERE id = ANY(_ids);
$$;

CREATE FUNCTION public.search_public_profiles(_term text, _limit integer DEFAULT 50)
RETURNS TABLE(id uuid, display_name text, avatar_url text, location text, username text, bio text, activity_private boolean, is_private boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, display_name, avatar_url, location, username, bio, activity_private, is_private
  FROM public.profiles
  WHERE _term IS NULL OR _term = ''
     OR display_name ILIKE '%' || _term || '%'
     OR username ILIKE '%' || _term || '%'
  ORDER BY created_at DESC
  LIMIT GREATEST(_limit, 1);
$$;

CREATE FUNCTION public.get_follow_counts(_user_id uuid)
RETURNS TABLE(followers int, following int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT count(*)::int FROM public.follows WHERE following_id = _user_id AND status = 'accepted'),
    (SELECT count(*)::int FROM public.follows WHERE follower_id = _user_id AND status = 'accepted');
$$;

CREATE FUNCTION public.get_followers(_user_id uuid)
RETURNS TABLE(id uuid, display_name text, avatar_url text, location text, username text, bio text, activity_private boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.display_name, p.avatar_url, p.location, p.username, p.bio, p.activity_private
  FROM public.follows f
  JOIN public.profiles p ON p.id = f.follower_id
  WHERE f.following_id = _user_id AND f.status = 'accepted'
    AND NOT EXISTS (
      SELECT 1 FROM public.user_blocks ub
      WHERE (ub.blocker_id = auth.uid() AND ub.blocked_id = p.id)
         OR (ub.blocker_id = p.id AND ub.blocked_id = auth.uid())
    );
$$;

CREATE FUNCTION public.get_following(_user_id uuid)
RETURNS TABLE(id uuid, display_name text, avatar_url text, location text, username text, bio text, activity_private boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.display_name, p.avatar_url, p.location, p.username, p.bio, p.activity_private
  FROM public.follows f
  JOIN public.profiles p ON p.id = f.following_id
  WHERE f.follower_id = _user_id AND f.status = 'accepted'
    AND NOT EXISTS (
      SELECT 1 FROM public.user_blocks ub
      WHERE (ub.blocker_id = auth.uid() AND ub.blocked_id = p.id)
         OR (ub.blocker_id = p.id AND ub.blocked_id = auth.uid())
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.search_public_profiles(text, integer) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_follow_counts(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_followers(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_following(uuid) TO authenticated;
