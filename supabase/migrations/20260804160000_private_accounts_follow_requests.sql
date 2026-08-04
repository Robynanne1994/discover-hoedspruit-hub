-- Private accounts, end to end.
--
-- The product rule is: an account is public until its owner turns it private.
-- A private account shows everyone its avatar, name and username and nothing
-- else; to see the rest you have to send a follow request and be approved.
--
-- Three things were wrong with how that was actually implemented.
--
--   1. Privacy was only ever enforced in the UI. `UserProfile` hid the saved
--      tabs and stopped linking to the follower lists, but every RPC behind
--      those screens answered anyone who asked. get_user_favourites() only
--      looked at `activity_private` and never at `is_private`, and
--      get_followers() / get_following() / get_follow_counts() had no privacy
--      check at all — so a private account's saved places, its follower list
--      and its counts were readable by any signed-in user, and /profile/<id>/
--      followers rendered them straight onto the screen. Hiding something in
--      the client is not privacy.
--
--   2. Turning a private account back to public stranded every request that
--      was still waiting. The pending rows stayed pending forever: the owner
--      no longer had a Follow Requests entry point (it only appears while the
--      account is private) and the requester was left looking at "Requested"
--      on an account anyone else could follow with one tap. Every platform
--      approves the backlog when you go public; this now does too.
--
--   3. The notification preference toggles suppressed the notification
--      *record*, not just the push. If a private account had "Follower
--      Requests" switched off — or had simply turned push off — an incoming
--      request produced nothing at all: no card, no badge, no trace anywhere
--      except a screen buried three taps deep under Account Privacy. That is
--      the flakiness: requests really did arrive and really were invisible.
--      business_notifications already has a `push` column that decides whether
--      the row becomes a phone push, so the preference belongs there. The card
--      is always written; only the push obeys the toggle.

-- ---------------------------------------------------------------------------
-- 1. One place that answers "may this viewer see what this account does?"
-- ---------------------------------------------------------------------------
-- Yes when it is your own account, when the account is public, or when you are
-- an approved follower. A pending request is not enough, and a signed-out
-- visitor never gets past a private account.
CREATE OR REPLACE FUNCTION public.can_view_profile_activity(_owner uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _owner IS NULL THEN false
    WHEN auth.uid() = _owner THEN true
    WHEN NOT COALESCE((SELECT p.is_private FROM public.profiles p WHERE p.id = _owner), false) THEN true
    WHEN auth.uid() IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.follows f
       WHERE f.follower_id = auth.uid()
         AND f.following_id = _owner
         AND f.status = 'accepted'
    )
  END;
$$;

REVOKE ALL ON FUNCTION public.can_view_profile_activity(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_view_profile_activity(uuid) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. The reads that were leaking
-- ---------------------------------------------------------------------------

-- Counts come back NULL rather than 0 for a locked profile: 0 is a claim about
-- the account ("nobody follows them"), NULL is the honest "not your business".
CREATE OR REPLACE FUNCTION public.get_follow_counts(_user_id uuid)
RETURNS TABLE(followers int, following int)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE WHEN public.can_view_profile_activity(_user_id)
      THEN (SELECT count(*)::int FROM public.follows
             WHERE following_id = _user_id AND status = 'accepted') END,
    CASE WHEN public.can_view_profile_activity(_user_id)
      THEN (SELECT count(*)::int FROM public.follows
             WHERE follower_id = _user_id AND status = 'accepted') END;
$$;

-- Follower / following lists: nothing at all for a locked profile.
CREATE OR REPLACE FUNCTION public.get_followers(_user_id uuid)
RETURNS TABLE(
  id uuid,
  display_name text,
  avatar_url text,
  location text,
  username text,
  activity_private boolean,
  is_private boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.display_name, p.avatar_url, p.location, p.username,
         p.activity_private, COALESCE(p.is_private, false)
  FROM public.follows f JOIN public.profiles p ON p.id = f.follower_id
  WHERE f.following_id = _user_id AND f.status = 'accepted'
    AND public.can_view_profile_activity(_user_id)
    AND COALESCE(p.moderation_status,'active') <> 'banned'
    AND NOT EXISTS (SELECT 1 FROM public.user_blocks ub
      WHERE (ub.blocker_id = auth.uid() AND ub.blocked_id = p.id)
         OR (ub.blocker_id = p.id AND ub.blocked_id = auth.uid()));
$$;

CREATE OR REPLACE FUNCTION public.get_following(_user_id uuid)
RETURNS TABLE(
  id uuid,
  display_name text,
  avatar_url text,
  location text,
  username text,
  activity_private boolean,
  is_private boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.display_name, p.avatar_url, p.location, p.username,
         p.activity_private, COALESCE(p.is_private, false)
  FROM public.follows f JOIN public.profiles p ON p.id = f.following_id
  WHERE f.follower_id = _user_id AND f.status = 'accepted'
    AND public.can_view_profile_activity(_user_id)
    AND COALESCE(p.moderation_status,'active') <> 'banned'
    AND NOT EXISTS (SELECT 1 FROM public.user_blocks ub
      WHERE (ub.blocker_id = auth.uid() AND ub.blocked_id = p.id)
         OR (ub.blocker_id = p.id AND ub.blocked_id = auth.uid()));
$$;

-- Saved listings / events / specials / resources. `activity_private` is the
-- separate, narrower switch ("hide my saves even from followers"); a private
-- account now also gates the whole lot behind approval.
CREATE OR REPLACE FUNCTION public.get_user_favourites(_user_id uuid, _item_type text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  item_id uuid,
  item_type text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT f.id, f.user_id, f.item_id, f.item_type, f.created_at
  FROM public.favourites f
  JOIN public.profiles p ON p.id = f.user_id
  WHERE f.user_id = _user_id
    AND (_item_type IS NULL OR f.item_type = _item_type)
    AND (
      auth.uid() = _user_id
      OR (COALESCE(p.activity_private, false) = false
          AND public.can_view_profile_activity(_user_id))
    );
$$;

-- ---------------------------------------------------------------------------
-- 3. Going public approves whatever was still waiting
-- ---------------------------------------------------------------------------
-- Requests only exist because the account was private. The moment it isn't,
-- anyone can follow with a single tap, so leaving a queue of people stuck on
-- "Requested" is just a bug with a UI. Each row goes through the normal
-- accept path, which means the existing resolution trigger converts the
-- owner's card and tells each requester they are now following.
CREATE OR REPLACE FUNCTION public.accept_pending_follows_on_public()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(OLD.is_private, false) AND NOT COALESCE(NEW.is_private, false) THEN
    UPDATE public.follows
       SET status = 'accepted', responded_at = now()
     WHERE following_id = NEW.id
       AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_accept_pending_follows_on_public ON public.profiles;
CREATE TRIGGER trg_accept_pending_follows_on_public
AFTER UPDATE OF is_private ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.accept_pending_follows_on_public();

-- The pending queue is read on every load of the Follow Requests screen and
-- for the badge next to it.
CREATE INDEX IF NOT EXISTS idx_follows_pending_target
  ON public.follows(following_id)
  WHERE status = 'pending';

-- ---------------------------------------------------------------------------
-- 4. Preferences silence the push, never the record
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.social_push_allowed(_user_id uuid, _pref text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_master boolean;
  v_pref boolean;
BEGIN
  SELECT COALESCE(push_enabled, true),
         CASE _pref
           WHEN 'community_followers' THEN COALESCE(community_followers, true)
           WHEN 'community_follow_requests' THEN COALESCE(community_follow_requests, true)
           ELSE true
         END
    INTO v_master, v_pref
    FROM public.notification_preferences
   WHERE user_id = _user_id;

  -- No preferences row yet => the column defaults, which are opted in.
  IF NOT FOUND THEN
    RETURN true;
  END IF;

  RETURN v_master AND v_pref;
END;
$$;

REVOKE ALL ON FUNCTION public.social_push_allowed(uuid, text) FROM PUBLIC;

-- A follow request always produces a card. Whether the phone buzzes is the
-- toggle's business.
CREATE OR REPLACE FUNCTION public.notify_follow_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
BEGIN
  IF NEW.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(display_name, username, 'Someone')
    INTO v_name
    FROM public.profiles WHERE id = NEW.follower_id;

  PERFORM public.replace_social_notification(
    NEW.following_id,
    NEW.follower_id,
    public.inbound_follow_kinds(),
    'follow_request',
    'pending',
    COALESCE(v_name, 'Someone') || ' wants to follow you',
    'Tap to review their follow request.',
    '/follow-requests',
    'follows',
    NEW.id,
    public.social_push_allowed(NEW.following_id, 'community_follow_requests'));

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
BEGIN
  IF NEW.status <> 'accepted' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(display_name, username, 'Someone')
    INTO v_name
    FROM public.profiles WHERE id = NEW.follower_id;

  -- Replaces any earlier card about this person following me, so a
  -- follow / unfollow / follow again shows up once, not three times.
  PERFORM public.replace_social_notification(
    NEW.following_id,
    NEW.follower_id,
    public.inbound_follow_kinds(),
    'new_follower',
    'unread',
    COALESCE(v_name, 'Someone') || ' started following you',
    'Tap to view their profile.',
    '/profile/' || NEW.follower_id::text,
    'follows',
    NEW.id,
    public.social_push_allowed(NEW.following_id, 'community_followers'));

  RETURN NEW;
END;
$$;

-- Same rule for the requester's "they accepted you" card: always written,
-- pushed only if they still want follow notifications on their phone.
CREATE OR REPLACE FUNCTION public.cleanup_follow_request_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_follower_name text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'pending' THEN
      IF auth.uid() = OLD.following_id THEN
        -- The recipient declined it. Keep a record of their own decision — it
        -- is the only trace of an action they took.
        SELECT COALESCE(display_name, username, 'Someone')
          INTO v_follower_name
          FROM public.profiles WHERE id = OLD.follower_id;

        PERFORM public.replace_social_notification(
          OLD.following_id,
          OLD.follower_id,
          public.inbound_follow_kinds(),
          'follow_request_declined',
          'read',
          'You declined ' || COALESCE(v_follower_name, 'Someone') || '''s follow request',
          'Their follow request was declined.',
          '/profile/' || OLD.follower_id::text,
          'follows',
          OLD.id,
          false);   -- their own action: never push it back at them
      ELSE
        -- The requester withdrew it before it was answered. The card goes away
        -- completely: leaving a "their request was withdrawn" tombstone tells
        -- the recipient about a private change of mind, which no platform does.
        DELETE FROM public.business_notifications
         WHERE user_id = OLD.following_id
           AND kind = 'follow_request'
           AND (ref_id = OLD.id OR actor_id = OLD.follower_id);
      END IF;
    END IF;
    RETURN OLD;

  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    SELECT COALESCE(display_name, username, 'Someone')
      INTO v_follower_name
      FROM public.profiles WHERE id = NEW.follower_id;

    -- The accepter's own card, converted in place.
    PERFORM public.replace_social_notification(
      NEW.following_id,
      NEW.follower_id,
      public.inbound_follow_kinds(),
      'follow_request_accepted',
      'read',
      'You accepted ' || COALESCE(v_follower_name, 'Someone') || '''s follow request',
      'They are now following you.',
      '/profile/' || NEW.follower_id::text,
      'follows',
      NEW.id,
      false);   -- their own action: never push it back at them

    -- Tell the original requester their request went through.
    SELECT COALESCE(display_name, username, 'Someone')
      INTO v_name
      FROM public.profiles WHERE id = NEW.following_id;

    PERFORM public.replace_social_notification(
      NEW.follower_id,
      NEW.following_id,
      public.outbound_follow_kinds(),
      'follow_accepted',
      'unread',
      COALESCE(v_name, 'Someone') || ' accepted your follow request',
      'You are now following them.',
      '/profile/' || NEW.following_id::text,
      'follows',
      NEW.id,
      public.social_push_allowed(NEW.follower_id, 'community_followers'));

  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status <> 'pending' THEN
    -- Any other resolution of a pending request: keep it as a declined record.
    SELECT COALESCE(display_name, username, 'Someone')
      INTO v_follower_name
      FROM public.profiles WHERE id = NEW.follower_id;

    PERFORM public.replace_social_notification(
      NEW.following_id,
      NEW.follower_id,
      public.inbound_follow_kinds(),
      'follow_request_declined',
      'read',
      'You declined ' || COALESCE(v_follower_name, 'Someone') || '''s follow request',
      'Their follow request was declined.',
      '/profile/' || NEW.follower_id::text,
      'follows',
      NEW.id,
      false);
  END IF;

  RETURN NEW;
END;
$$;
