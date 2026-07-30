-- Follow notifications: one card per relationship, and blocking wipes the pair.
--
-- Two things made the notifications screen look broken:
--
--   1. Every follow event inserted a brand new row, so following → unfollowing →
--      following again (or following → block → unblock → following again) left
--      a stack of identical "X started following you" cards sitting next to
--      "X accepted your follow request". Instagram, Facebook and the rest keep
--      ONE card per person per relationship and move it back to the top when
--      something new happens.
--
--   2. Blocking someone tore down the follows rows but left every notification
--      about them in place — on both sides. The blocked person kept the
--      blocker's name and avatar in their notifications, and tapping it went
--      looking for their profile. That is a safety problem, not just clutter.
--
-- What this migration establishes, matching how the big platforms behave:
--
--   * business_notifications.actor_id — who a person-to-person notification is
--     *about*. Everything below keys off it (dedupe, block purges, hiding).
--   * Follow notifications are replaced, not stacked: a new event in the same
--     relationship removes the previous card and posts a fresh one at the top.
--     Re-following within an hour does not fire another push.
--   * Blocking deletes every notification between the two people, in both
--     directions, and tears down the follows rows in the database rather than
--     relying on the client to do it.
--   * While a block is in place no new notification about either person can be
--     created, in either direction.
--   * Unblocking restores nothing. The history stays gone, exactly like
--     Instagram — an unblock is not an undo.
--   * A withdrawn follow request removes the card instead of leaving a
--     "their request was withdrawn" tombstone (nobody else announces those).
--   * Last line of defence: someone who has been blocked can no longer resolve
--     the blocker's profile at all. get_public_profiles / search return nothing
--     for them, so any notification that somehow survives shows no name, no
--     avatar, and its profile screen is the same "account unavailable" page a
--     deleted account gets. It never says who blocked whom.

-- ---------------------------------------------------------------------------
-- 1. Who is this notification about?
-- ---------------------------------------------------------------------------
ALTER TABLE public.business_notifications
  ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.business_notifications.actor_id IS
  'The other person a social notification is about. NULL for content/admin notifications. Deleting that account removes the notification, so a deleted user leaves nothing behind.';

CREATE INDEX IF NOT EXISTS idx_business_notifications_actor
  ON public.business_notifications(user_id, actor_id)
  WHERE actor_id IS NOT NULL;

-- Backfill: the follows row tells us who each existing card is about.
UPDATE public.business_notifications n
   SET actor_id = f.follower_id
  FROM public.follows f
 WHERE n.actor_id IS NULL
   AND n.ref_table = 'follows'
   AND n.ref_id = f.id
   AND n.kind IN ('follow_request', 'follow_request_accepted', 'new_follower');

-- 'follow_accepted' is the mirror image: the card is about the person who
-- accepted, i.e. the account that was followed.
UPDATE public.business_notifications n
   SET actor_id = f.following_id
  FROM public.follows f
 WHERE n.actor_id IS NULL
   AND n.ref_table = 'follows'
   AND n.ref_id = f.id
   AND n.kind = 'follow_accepted';

-- Resolved cards whose follows row is already gone still carry the person in
-- their link. Only for accounts that still exist — a card pointing at a deleted
-- account keeps actor_id NULL and is treated as being about nobody.
UPDATE public.business_notifications n
   SET actor_id = substring(n.link from '^/profile/([0-9a-fA-F-]{36})$')::uuid
 WHERE n.actor_id IS NULL
   AND n.link ~ '^/profile/[0-9a-fA-F-]{36}$'
   AND EXISTS (
     SELECT 1 FROM auth.users u
      WHERE u.id = substring(n.link from '^/profile/([0-9a-fA-F-]{36})$')::uuid
   );

-- ---------------------------------------------------------------------------
-- 2. Shared helpers
-- ---------------------------------------------------------------------------

-- Is there a block between these two, in either direction?
CREATE OR REPLACE FUNCTION public.users_are_blocked(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
     WHERE (blocker_id = _a AND blocked_id = _b)
        OR (blocker_id = _b AND blocked_id = _a)
  );
$$;

REVOKE ALL ON FUNCTION public.users_are_blocked(uuid, uuid) FROM PUBLIC;

-- Post the one card that represents this relationship right now.
--
-- `_family` is every kind that describes the same relationship in the same
-- direction, so posting "started following you" clears out the older "wants to
-- follow you" / "you accepted" / duplicate follower cards for that person
-- first. The result is a single card, freshly dated, at the top of the list.
CREATE OR REPLACE FUNCTION public.replace_social_notification(
  _user_id   uuid,
  _actor_id  uuid,
  _family    text[],
  _kind      text,
  _status    text,
  _title     text,
  _body      text,
  _link      text,
  _ref_table text,
  _ref_id    uuid,
  _push      boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_previous timestamptz;
  v_push boolean := COALESCE(_push, true);
BEGIN
  IF _user_id IS NULL OR _actor_id IS NULL OR _user_id = _actor_id THEN
    RETURN;
  END IF;

  -- Nothing passes between blocked people, in either direction.
  IF public.users_are_blocked(_user_id, _actor_id) THEN
    RETURN;
  END IF;

  -- Follow / unfollow / re-follow in quick succession must not turn into a
  -- string of phone pushes. The card still updates; only the push is dropped.
  SELECT max(created_at) INTO v_previous
    FROM public.business_notifications
   WHERE user_id = _user_id AND actor_id = _actor_id AND kind = _kind;

  IF v_previous IS NOT NULL AND v_previous > now() - interval '1 hour' THEN
    v_push := false;
  END IF;

  DELETE FROM public.business_notifications
   WHERE user_id = _user_id
     AND actor_id = _actor_id
     AND kind = ANY(_family);

  INSERT INTO public.business_notifications
    (user_id, actor_id, kind, status, title, body, link, ref_table, ref_id, is_read, push)
  VALUES
    (_user_id, _actor_id, _kind, _status, _title, _body, _link, _ref_table, _ref_id,
     _status = 'read', v_push);
END;
$$;

REVOKE ALL ON FUNCTION public.replace_social_notification(
  uuid, uuid, text[], text, text, text, text, text, text, uuid, boolean) FROM PUBLIC;

-- The two relationship directions. Cards within a family replace one another;
-- cards across families coexist (they are genuinely different events).
--   inbound  — what this person did about following me
--   outbound — what this person did about my request to follow them
CREATE OR REPLACE FUNCTION public.inbound_follow_kinds()
RETURNS text[] LANGUAGE sql IMMUTABLE
AS $$ SELECT ARRAY[
  'follow_request',
  'follow_request_accepted',
  'follow_request_declined',
  'follow_request_withdrawn',
  'new_follower'
] $$;

CREATE OR REPLACE FUNCTION public.outbound_follow_kinds()
RETURNS text[] LANGUAGE sql IMMUTABLE
AS $$ SELECT ARRAY['follow_accepted'] $$;

-- ---------------------------------------------------------------------------
-- 3. Follow request received
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_follow_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_allowed boolean;
BEGIN
  IF NEW.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT (COALESCE(push_enabled, true) AND COALESCE(community_follow_requests, true))
    INTO v_allowed
    FROM public.notification_preferences
   WHERE user_id = NEW.following_id;
  -- No preferences row yet => fall back to the column defaults (enabled).
  IF NOT FOUND THEN
    v_allowed := true;
  END IF;

  IF v_allowed THEN
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
      true);
  END IF;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. New follower (public accounts)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_allowed boolean;
BEGIN
  IF NEW.status <> 'accepted' THEN
    RETURN NEW;
  END IF;

  SELECT (COALESCE(push_enabled, true) AND COALESCE(community_followers, true))
    INTO v_allowed
    FROM public.notification_preferences
   WHERE user_id = NEW.following_id;
  IF NOT FOUND THEN
    v_allowed := true;
  END IF;

  IF v_allowed THEN
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
      true);
  END IF;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. Follow request resolved (accepted / declined / withdrawn)
-- ---------------------------------------------------------------------------
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
      true);

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

-- ---------------------------------------------------------------------------
-- 6. Blocking wipes the pair — both directions, in the database
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purge_relationship_on_block()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- A block ends the follow in both directions. This lived in the client
  -- before, which meant any other path into user_blocks (admin tooling, a
  -- second device, a failed round trip) left the follow standing.
  DELETE FROM public.follows
   WHERE (follower_id = NEW.blocker_id AND following_id = NEW.blocked_id)
      OR (follower_id = NEW.blocked_id AND following_id = NEW.blocker_id);

  -- Then every notification the two of them have about each other, both ways.
  -- The link check catches legacy rows written before actor_id existed.
  DELETE FROM public.business_notifications
   WHERE (user_id = NEW.blocker_id
          AND (actor_id = NEW.blocked_id OR link = '/profile/' || NEW.blocked_id::text))
      OR (user_id = NEW.blocked_id
          AND (actor_id = NEW.blocker_id OR link = '/profile/' || NEW.blocker_id::text));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_blocks_purge_relationship ON public.user_blocks;
CREATE TRIGGER user_blocks_purge_relationship
  AFTER INSERT ON public.user_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.purge_relationship_on_block();

-- Deliberately no matching trigger on DELETE: unblocking restores nothing.
-- The follows are gone, the notifications are gone, and the two of them simply
-- become visible to each other again.

-- ---------------------------------------------------------------------------
-- 7. Let the app know what to hide
-- ---------------------------------------------------------------------------
-- RLS on user_blocks only ever exposed the blocks a user created, so every
-- "has this person blocked me?" lookup in the client silently came back empty
-- and nothing was ever hidden on that side. This is the supported way to ask.
CREATE OR REPLACE FUNCTION public.get_block_state()
RETURNS TABLE (i_blocked uuid[], blocked_me uuid[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE((SELECT array_agg(blocked_id) FROM public.user_blocks WHERE blocker_id = auth.uid()), '{}'::uuid[]),
    COALESCE((SELECT array_agg(blocker_id) FROM public.user_blocks WHERE blocked_id = auth.uid()), '{}'::uuid[]);
$$;

REVOKE ALL ON FUNCTION public.get_block_state() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_block_state() TO authenticated;

-- ---------------------------------------------------------------------------
-- 8. Fallback: a blocked person cannot resolve the blocker at all
-- ---------------------------------------------------------------------------
-- Nothing should get them to a card or a screen about the person who blocked
-- them in the first place. If something does, this is what it finds: nothing.
-- No name, no avatar, no username — the same empty answer a deleted account
-- gives, and never a hint that a block is the reason.
--
-- Only that one direction is filtered. People I have blocked still resolve for
-- me, because my own Blocked list and the "you have blocked X" banner have to
-- be able to name them.
CREATE OR REPLACE FUNCTION public.get_public_profiles(_ids uuid[])
RETURNS TABLE(id uuid, display_name text, avatar_url text, location text, username text, activity_private boolean, is_private boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.display_name, p.avatar_url, p.location, p.username, p.activity_private, p.is_private
    FROM public.profiles p
   WHERE p.id = ANY(_ids)
     AND NOT EXISTS (
       SELECT 1 FROM public.user_blocks ub
        WHERE ub.blocker_id = p.id AND ub.blocked_id = auth.uid()
     );
$$;

CREATE OR REPLACE FUNCTION public.search_public_profiles(_term text, _limit integer DEFAULT 50)
RETURNS TABLE(id uuid, display_name text, avatar_url text, location text, username text, activity_private boolean, is_private boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.display_name, p.avatar_url, p.location, p.username, p.activity_private, p.is_private
    FROM public.profiles p
   WHERE COALESCE(p.moderation_status, 'active') <> 'banned'
     AND (_term IS NULL OR _term = ''
       OR p.display_name ILIKE '%' || _term || '%'
       OR p.username ILIKE '%' || _term || '%')
     AND NOT EXISTS (
       SELECT 1 FROM public.user_blocks ub
        WHERE (ub.blocker_id = p.id AND ub.blocked_id = auth.uid())
           OR (ub.blocker_id = auth.uid() AND ub.blocked_id = p.id)
     )
   ORDER BY p.created_at DESC
   LIMIT GREATEST(_limit, 1);
$$;

-- ---------------------------------------------------------------------------
-- 9. Clean up what the old behaviour already left behind
-- ---------------------------------------------------------------------------

-- Notifications between people who are already blocked, both directions.
DELETE FROM public.business_notifications n
 USING public.user_blocks ub
 WHERE (n.user_id = ub.blocker_id
        AND (n.actor_id = ub.blocked_id OR n.link = '/profile/' || ub.blocked_id::text))
    OR (n.user_id = ub.blocked_id
        AND (n.actor_id = ub.blocker_id OR n.link = '/profile/' || ub.blocker_id::text));

-- Withdrawn-request tombstones: nobody needs to be told about a request that
-- was taken back.
DELETE FROM public.business_notifications
 WHERE kind = 'follow_request_withdrawn';

-- Stacked duplicates: keep the newest card per person per direction.
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY user_id, actor_id,
             CASE WHEN kind = ANY(public.outbound_follow_kinds()) THEN 'outbound' ELSE 'inbound' END
           ORDER BY created_at DESC, id DESC
         ) AS rn
    FROM public.business_notifications
   WHERE actor_id IS NOT NULL
     AND (kind = ANY(public.inbound_follow_kinds()) OR kind = ANY(public.outbound_follow_kinds()))
)
DELETE FROM public.business_notifications n
 USING ranked r
 WHERE n.id = r.id AND r.rn > 1;

-- Follows that a block should have torn down but did not.
DELETE FROM public.follows f
 USING public.user_blocks ub
 WHERE (f.follower_id = ub.blocker_id AND f.following_id = ub.blocked_id)
    OR (f.follower_id = ub.blocked_id AND f.following_id = ub.blocker_id);
