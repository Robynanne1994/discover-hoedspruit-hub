-- Update the function that generates these notifications
CREATE OR REPLACE FUNCTION public.apply_moderation_action(
  _report_id uuid,
  _action text,
  _severity text DEFAULT NULL,
  _duration_days integer DEFAULT NULL,
  _admin_note text DEFAULT NULL,
  _notify_reporter_message text DEFAULT NULL,
  _target_user_id uuid DEFAULT NULL
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
  ELSE
    v_target := _target_user_id;
  END IF;

  IF _action = 'warn' THEN
    v_status := 'warned'; v_action_taken := 'warned'; v_report_status := 'reviewed';
    v_title := 'Account Warning'; -- Capitalized
    v_body  := COALESCE(_admin_note, 'A report about your account was upheld. Please review our community guidelines.');
  ELSIF _action = 'suspend' THEN
    v_status := 'suspended';
    v_until := now() + (COALESCE(_duration_days, 7) || ' days')::interval;
    v_action_taken := 'suspended'; v_report_status := 'reviewed';
    v_title := 'Account suspended';
    v_body  := COALESCE(_admin_note, 'Your account has been suspended until ' || to_char(v_until, 'DD Mon YYYY') || '.');
  ELSIF _action = 'ban' THEN
    v_status := 'banned'; v_action_taken := 'banned'; v_report_status := 'reviewed';
    v_title := 'Account banned';
    v_body  := COALESCE(_admin_note, 'Your account has been banned for violating our community guidelines.');
  ELSIF _action = 'content_removed' THEN
    v_action_taken := 'content_removed'; v_report_status := 'reviewed';
    v_title := 'Content removed';
    v_body  := COALESCE(_admin_note, 'Some of your content was removed for violating our community guidelines.');
  ELSIF _action = 'dismissed' THEN
    v_action_taken := 'none'; v_report_status := 'dismissed';
  ELSIF _action = 'unsuspend' OR _action = 'unban' THEN
    v_status := 'active'; v_until := NULL;
    v_title := 'Account restored';
    v_body  := 'Your account has been restored. Welcome back.';
  ELSE
    RAISE EXCEPTION 'Unknown action: %', _action;
  END IF;

  IF v_target IS NOT NULL AND _action IN ('warn','suspend','ban','unsuspend','unban') THEN
    UPDATE public.profiles
       SET moderation_status = v_status,
           suspended_until   = v_until,
           moderation_reason = CASE WHEN _action IN ('unsuspend','unban') THEN NULL ELSE COALESCE(_admin_note, moderation_reason) END
     WHERE id = v_target;
  END IF;

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

  INSERT INTO public.moderation_actions
    (target_user_id, actor_admin_id, action, reason, duration_days, related_report_id)
  VALUES
    (v_target, auth.uid(), _action, _admin_note, _duration_days, _report_id);

  IF v_target IS NOT NULL AND _action <> 'dismissed' THEN
    INSERT INTO public.business_notifications
      (user_id, kind, status, title, body, link, ref_table, ref_id)
    VALUES
      (v_target, 'moderation', 'unread', v_title, v_body, '/account-settings', 'user_reports', _report_id);
  END IF;

  IF v_report.reporter_user_id IS NOT NULL AND _notify_reporter_message IS NOT NULL THEN
    INSERT INTO public.business_notifications
      (user_id, kind, status, title, body, link, ref_table, ref_id)
    VALUES
      (v_report.reporter_user_id,
       CASE WHEN _action = 'dismissed' THEN 'report_update' ELSE 'report_update' END,
       'unread',
       CASE WHEN _action = 'dismissed' THEN 'Thanks for your report' ELSE 'We acted on your report' END,
       _notify_reporter_message,
       '/account-settings/reported',
       'user_reports',
       _report_id);
  END IF;
END;
$$;

-- Update existing records
UPDATE public.business_notifications 
SET title = 'Account Warning' 
WHERE title = 'Account warning';
