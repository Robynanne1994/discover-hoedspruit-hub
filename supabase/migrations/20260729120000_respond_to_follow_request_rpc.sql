-- Accepting/declining a follow request used to be a direct client-side write:
--
--   supabase.from('follows').update({ status: 'accepted' }).eq('id', <request>)
--
-- gated only by the "Target can accept pending follow request" RLS UPDATE
-- policy. When that write silently affected zero rows (RLS mismatch, a missing
-- table grant, a stale/duplicate request id, or a double-tap), PostgREST
-- returned no error, so the UI happily flipped the card to "accepted" while the
-- follows row stayed 'pending'. The follower count never moved, the requester's
-- following list never updated, and — because the AFTER UPDATE trigger that
-- notifies the requester never fired — they were never told the request was
-- accepted. The follow simply never took effect.
--
-- Move the state change into an authoritative SECURITY DEFINER RPC, matching
-- every other follow operation (get_follow_counts / get_followers / get_following).
-- It verifies the caller really is the target of a *pending* request, performs
-- the accept (UPDATE -> 'accepted') or decline (DELETE) as the function owner,
-- and RAISEs on anything unexpected so the client sees a real error instead of a
-- silent no-op. The existing AFTER UPDATE/DELETE trigger
-- (cleanup_follow_request_notification) still fires — auth.uid() inside a
-- SECURITY DEFINER function is unchanged, so it correctly converts the target's
-- notification and inserts the "accepted your follow request" notification for
-- the requester.

CREATE OR REPLACE FUNCTION public.respond_to_follow_request(_request_id uuid, _accept boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_following_id uuid;
  v_status public.follow_status;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT following_id, status
    INTO v_following_id, v_status
    FROM public.follows
    WHERE id = _request_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Follow request not found' USING ERRCODE = 'P0002';
  END IF;

  -- Only the account being followed may respond to its own incoming request.
  IF v_following_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to respond to this follow request' USING ERRCODE = '42501';
  END IF;

  -- Already resolved (e.g. a double-tap or a stale card): treat as a harmless
  -- no-op rather than firing the acceptance trigger a second time.
  IF v_status <> 'pending' THEN
    RETURN;
  END IF;

  IF _accept THEN
    UPDATE public.follows
       SET status = 'accepted', responded_at = now()
     WHERE id = _request_id;
  ELSE
    DELETE FROM public.follows WHERE id = _request_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.respond_to_follow_request(uuid, boolean) TO authenticated;
