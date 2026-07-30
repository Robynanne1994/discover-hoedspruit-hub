-- Block cooldown: stops block / unblock / block ping-ponging.
--
-- When a user lifts their own block on someone we remember when they did it.
-- For the next public.block_cooldown_days() days that same blocker cannot block
-- that same person again. Enforced with triggers rather than in the client, so
-- the rule holds for any caller hitting the table directly.
--
-- Only self-service unblocks start a cooldown, and only self-service blocks are
-- checked against it: admin tooling and account deletion also delete rows from
-- public.user_blocks, and neither should penalise anyone.

CREATE OR REPLACE FUNCTION public.block_cooldown_days()
  RETURNS integer
  LANGUAGE sql
  IMMUTABLE
AS $$ SELECT 7 $$;

GRANT EXECUTE ON FUNCTION public.block_cooldown_days() TO authenticated, anon;

CREATE TABLE public.user_block_cooldowns (
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unblocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);

GRANT SELECT ON public.user_block_cooldowns TO authenticated;
GRANT ALL ON public.user_block_cooldowns TO service_role;

ALTER TABLE public.user_block_cooldowns ENABLE ROW LEVEL SECURITY;

-- A user can only see the cooldowns that apply to them. Writes happen through
-- the SECURITY DEFINER triggers below, never directly from a client.
CREATE POLICY "Users can view their own block cooldowns"
  ON public.user_block_cooldowns
  FOR SELECT
  TO authenticated
  USING (auth.uid() = blocker_id);

-- Unblocking yourself starts (or restarts) the cooldown for that pair.
CREATE OR REPLACE FUNCTION public.record_block_cooldown()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM OLD.blocker_id THEN
    RETURN OLD;
  END IF;

  INSERT INTO public.user_block_cooldowns (blocker_id, blocked_id, unblocked_at)
  VALUES (OLD.blocker_id, OLD.blocked_id, now())
  ON CONFLICT (blocker_id, blocked_id)
  DO UPDATE SET unblocked_at = now();

  RETURN OLD;
END;
$$;

CREATE TRIGGER user_blocks_record_cooldown
  AFTER DELETE ON public.user_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.record_block_cooldown();

-- Refuse a re-block while the cooldown from the last unblock is still running.
CREATE OR REPLACE FUNCTION public.enforce_block_cooldown()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  _unblocked_at timestamptz;
  _available_at timestamptz;
BEGIN
  IF auth.uid() IS DISTINCT FROM NEW.blocker_id THEN
    RETURN NEW;
  END IF;

  SELECT c.unblocked_at INTO _unblocked_at
  FROM public.user_block_cooldowns c
  WHERE c.blocker_id = NEW.blocker_id
    AND c.blocked_id = NEW.blocked_id;

  IF _unblocked_at IS NULL THEN
    RETURN NEW;
  END IF;

  _available_at := _unblocked_at
    + make_interval(days => public.block_cooldown_days());

  IF _available_at > now() THEN
    -- The client matches on the BLOCK_COOLDOWN_ACTIVE marker to show the
    -- "you can block them again on ..." sheet instead of a generic error.
    RAISE EXCEPTION 'BLOCK_COOLDOWN_ACTIVE: this user was unblocked less than % days ago and can be blocked again from %',
      public.block_cooldown_days(), _available_at;
  END IF;

  -- Cooldown has expired — forget it so the row does not linger.
  DELETE FROM public.user_block_cooldowns c
  WHERE c.blocker_id = NEW.blocker_id
    AND c.blocked_id = NEW.blocked_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER user_blocks_enforce_cooldown
  BEFORE INSERT ON public.user_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_block_cooldown();

-- What the signed-in user needs to know about blocking one specific person
-- again. Returns no rows when there is no cooldown on record for the pair, so
-- the client never has to compute the window itself.
CREATE OR REPLACE FUNCTION public.get_block_cooldown(_blocked_id uuid)
  RETURNS TABLE (
    unblocked_at timestamptz,
    available_at timestamptz,
    is_active boolean
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT
    c.unblocked_at,
    c.unblocked_at + make_interval(days => public.block_cooldown_days()),
    c.unblocked_at + make_interval(days => public.block_cooldown_days()) > now()
  FROM public.user_block_cooldowns c
  WHERE c.blocker_id = auth.uid()
    AND c.blocked_id = _blocked_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_block_cooldown(uuid) TO authenticated;