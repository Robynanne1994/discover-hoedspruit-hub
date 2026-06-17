
-- 1. Extend user_reports
ALTER TABLE public.user_reports
  ADD COLUMN IF NOT EXISTS severity text,
  ADD COLUMN IF NOT EXISTS action_taken text NOT NULL DEFAULT 'none';

-- 2. Extend profiles with moderation flags
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS suspended_until timestamptz,
  ADD COLUMN IF NOT EXISTS moderation_reason text;

-- 3. Audit log
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL,
  actor_admin_id uuid,
  action text NOT NULL, -- warn|suspend|unsuspend|ban|unban|note|content_removed|dismissed
  reason text,
  duration_days integer,
  related_report_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS moderation_actions_target_idx
  ON public.moderation_actions(target_user_id, created_at DESC);

GRANT SELECT, INSERT ON public.moderation_actions TO authenticated;
GRANT ALL ON public.moderation_actions TO service_role;

ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view moderation actions" ON public.moderation_actions;
CREATE POLICY "Admins view moderation actions" ON public.moderation_actions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins insert moderation actions" ON public.moderation_actions;
CREATE POLICY "Admins insert moderation actions" ON public.moderation_actions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Apply a moderation action (security definer)
CREATE OR REPLACE FUNCTION public.apply_moderation_action(
  _report_id uuid,
  _action text,              -- warn | suspend | ban | content_removed | dismissed | unsuspend | unban
  _severity text DEFAULT NULL,
  _duration_days integer DEFAULT NULL,
  _admin_note text DEFAULT NULL,
  _notify_reporter_message text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report public.user_reports%ROWTYPE;
  v_target uuid;
  v_status text := 'active';
  v_until timestamptz := NULL;
  v_report_status text;
  v_action_taken text := 'none';
  v_title text;
  v_body text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  IF _report_id IS NOT NULL THEN
    SELECT * INTO v_report FROM public.user_reports WHERE id = _report_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Report not found'; END IF;
    v_target := v_report.reported_user_id;
  END IF;

  -- Decide profile changes + report status + notification
  IF _action = 'warn' THEN
    v_status := 'warned';
    v_action_taken := 'warned';
    v_report_status := 'reviewed';
    v_title := 'Account warning';
    v_body  := COALESCE(_admin_note, 'A report about your account was upheld. Please review our community guidelines.');
  ELSIF _action = 'suspend' THEN
    v_status := 'suspended';
    v_until := now() + (COALESCE(_duration_days, 7) || ' days')::interval;
    v_action_taken := 'suspended';
    v_report_status := 'reviewed';
    v_title := 'Account suspended';
    v_body  := COALESCE(_admin_note, 'Your account has been suspended until ' || to_char(v_until, 'DD Mon YYYY') || '.');
  ELSIF _action = 'ban' THEN
    v_status := 'banned';
    v_action_taken := 'banned';
    v_report_status := 'reviewed';
    v_title := 'Account banned';
    v_body  := COALESCE(_admin_note, 'Your account has been banned for violating our community guidelines.');
  ELSIF _action = 'content_removed' THEN
    v_action_taken := 'content_removed';
    v_report_status := 'reviewed';
    v_title := 'Content removed';
    v_body  := COALESCE(_admin_note, 'Some of your content was removed for violating our community guidelines.');
  ELSIF _action = 'dismissed' THEN
    v_action_taken := 'none';
    v_report_status := 'dismissed';
  ELSIF _action = 'unsuspend' OR _action = 'unban' THEN
    v_status := 'active';
    v_until := NULL;
    v_title := 'Account restored';
    v_body  := 'Your account has been restored. Welcome back.';
  ELSE
    RAISE EXCEPTION 'Unknown action: %', _action;
  END IF;

  -- Profile update (only when an action targets a user)
  IF v_target IS NOT NULL AND _action IN ('warn','suspend','ban','unsuspend','unban') THEN
    UPDATE public.profiles
       SET moderation_status = v_status,
           suspended_until   = v_until,
           moderation_reason = CASE WHEN _action IN ('unsuspend','unban') THEN NULL ELSE COALESCE(_admin_note, moderation_reason) END
     WHERE id = v_target;
  END IF;

  -- Report update
  IF _report_id IS NOT NULL THEN
    UPDATE public.user_reports
       SET status        = v_report_status,
           is_read       = true,
           severity      = COALESCE(_severity, severity),
           action_taken  = v_action_taken,
           admin_note    = COALESCE(_admin_note, admin_note),
           resolved_at   = now()
     WHERE id = _report_id;
  END IF;

  -- Audit log
  INSERT INTO public.moderation_actions
    (target_user_id, actor_admin_id, action, reason, duration_days, related_report_id)
  VALUES
    (v_target, auth.uid(), _action, _admin_note, _duration_days, _report_id);

  -- Notify the target user
  IF v_target IS NOT NULL AND _action <> 'dismissed' THEN
    INSERT INTO public.business_notifications
      (user_id, kind, status, title, body, link, ref_table, ref_id)
    VALUES
      (v_target, 'moderation', 'unread', v_title, v_body, '/account-settings', 'user_reports', _report_id);
  END IF;

  -- Notify the reporter
  IF v_report.reporter_user_id IS NOT NULL AND _notify_reporter_message IS NOT NULL THEN
    INSERT INTO public.business_notifications
      (user_id, kind, status, title, body, link, ref_table, ref_id)
    VALUES
      (v_report.reporter_user_id,
       'report_update',
       'unread',
       CASE WHEN _action = 'dismissed' THEN 'Thanks for your report' ELSE 'We acted on your report' END,
       _notify_reporter_message,
       '/account-settings/reported',
       'user_reports',
       _report_id);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_moderation_action(uuid, text, text, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_moderation_action(uuid, text, text, integer, text, text) TO authenticated;

-- 5. Summary for an admin viewing a user
CREATE OR REPLACE FUNCTION public.get_user_moderation_summary(_user_id uuid)
RETURNS TABLE(
  total_reports integer,
  pending_reports integer,
  recent_upheld integer,
  moderation_status text,
  suspended_until timestamptz,
  last_action text,
  last_action_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*)::int FROM public.user_reports WHERE reported_user_id = _user_id),
    (SELECT count(*)::int FROM public.user_reports WHERE reported_user_id = _user_id AND status = 'pending'),
    (SELECT count(*)::int FROM public.user_reports
       WHERE reported_user_id = _user_id
         AND action_taken IN ('warned','suspended','banned','content_removed')
         AND created_at > now() - interval '30 days'),
    (SELECT moderation_status FROM public.profiles WHERE id = _user_id),
    (SELECT suspended_until FROM public.profiles WHERE id = _user_id),
    (SELECT action FROM public.moderation_actions WHERE target_user_id = _user_id ORDER BY created_at DESC LIMIT 1),
    (SELECT created_at FROM public.moderation_actions WHERE target_user_id = _user_id ORDER BY created_at DESC LIMIT 1);
$$;

REVOKE ALL ON FUNCTION public.get_user_moderation_summary(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_moderation_summary(uuid) TO authenticated;

-- 6. Expired suspension cleanup
CREATE OR REPLACE FUNCTION public.clear_expired_suspensions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n integer;
BEGIN
  UPDATE public.profiles
     SET moderation_status = 'active',
         suspended_until = NULL,
         moderation_reason = NULL
   WHERE moderation_status = 'suspended'
     AND suspended_until IS NOT NULL
     AND suspended_until <= now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.clear_expired_suspensions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_expired_suspensions() TO authenticated;
