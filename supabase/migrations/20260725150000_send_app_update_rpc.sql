-- Broadcast an app update / announcement to every user, entirely in the
-- database (called from the admin screen via supabase.rpc). This replaces the
-- send-app-update edge function so the feature deploys with the migration and
-- needs no separate function deployment.
--
-- Behaviour:
--   * EVERY user gets a business_notifications row (in-app + unread red dot),
--     regardless of preferences.
--   * push is true only when the user's master push toggle AND their
--     "App Updates & News" toggle (hh_app_updates) are on. Users with no
--     notification_preferences row fall back to the column defaults
--     (both true) => pushed.
CREATE OR REPLACE FUNCTION public.send_app_update(
  p_title text,
  p_body text DEFAULT NULL,
  p_link text DEFAULT NULL
)
RETURNS TABLE (broadcast_id uuid, recipient_count integer, pushed_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_broadcast_id uuid;
  v_recipient_count integer := 0;
  v_pushed_count integer := 0;
  v_title text := btrim(p_title);
  v_body text := NULLIF(btrim(COALESCE(p_body, '')), '');
  v_link text := NULLIF(btrim(COALESCE(p_link, '')), '');
BEGIN
  -- Only admins may broadcast.
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can send app updates.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF v_title IS NULL OR v_title = '' THEN
    RAISE EXCEPTION 'A title is required.';
  END IF;

  INSERT INTO public.app_update_broadcasts
    (title, body, link, sent_by, recipient_count, pushed_count)
  VALUES (v_title, v_body, v_link, auth.uid(), 0, 0)
  RETURNING id INTO v_broadcast_id;

  WITH inserted AS (
    INSERT INTO public.business_notifications
      (user_id, kind, status, title, body, link, push, ref_table, ref_id)
    SELECT
      u.id,
      'app_update',
      'unread',
      v_title,
      v_body,
      v_link,
      COALESCE(np.push_enabled, true) AND COALESCE(np.hh_app_updates, true),
      'app_update_broadcasts',
      v_broadcast_id
    FROM auth.users u
    LEFT JOIN public.notification_preferences np ON np.user_id = u.id
    WHERE u.deleted_at IS NULL
    RETURNING push
  )
  SELECT count(*)::int, count(*) FILTER (WHERE push)::int
    INTO v_recipient_count, v_pushed_count
  FROM inserted;

  UPDATE public.app_update_broadcasts
     SET recipient_count = v_recipient_count,
         pushed_count = v_pushed_count
   WHERE id = v_broadcast_id;

  RETURN QUERY SELECT v_broadcast_id, v_recipient_count, v_pushed_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_app_update(text, text, text) TO authenticated;
