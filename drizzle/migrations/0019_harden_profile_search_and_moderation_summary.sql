CREATE OR REPLACE FUNCTION public.search_public_profiles(_term text, _limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, display_name text, avatar_url text, location text, username text, activity_private boolean, is_private boolean)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT p.id, p.display_name, p.avatar_url, p.location, p.username, p.activity_private, p.is_private
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND COALESCE(p.moderation_status,'active') <> 'banned'
    AND NOT EXISTS (SELECT 1 FROM public.user_blocks ub
      WHERE (ub.blocker_id = auth.uid() AND ub.blocked_id = p.id)
         OR (ub.blocker_id = p.id AND ub.blocked_id = auth.uid()))
    AND (_term IS NULL OR _term = ''
      OR p.display_name ILIKE '%' || _term || '%'
      OR p.username ILIKE '%' || _term || '%')
  ORDER BY p.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(_limit, 50), 1), 50);
$function$;
REVOKE EXECUTE ON FUNCTION public.search_public_profiles(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_public_profiles(text, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_user_moderation_summary(_user_id uuid)
 RETURNS TABLE(total_reports integer, pending_reports integer, recent_upheld integer, moderation_status text, suspended_until timestamp with time zone, last_action text, last_action_at timestamp with time zone)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin only' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY SELECT
    (SELECT count(*)::int FROM public.user_reports WHERE reported_user_id = _user_id),
    (SELECT count(*)::int FROM public.user_reports WHERE reported_user_id = _user_id AND status = 'pending'),
    (SELECT count(*)::int FROM public.user_reports
       WHERE reported_user_id = _user_id
         AND action_taken IN ('warned','suspended','banned','content_removed')
         AND created_at > now() - interval '30 days'),
    (SELECT p.moderation_status FROM public.profiles p WHERE p.id = _user_id),
    (SELECT p.suspended_until FROM public.profiles p WHERE p.id = _user_id),
    (SELECT m.action FROM public.moderation_actions m WHERE m.target_user_id = _user_id ORDER BY m.created_at DESC LIMIT 1),
    (SELECT m.created_at FROM public.moderation_actions m WHERE m.target_user_id = _user_id ORDER BY m.created_at DESC LIMIT 1);
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.get_user_moderation_summary(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_moderation_summary(uuid) TO authenticated;