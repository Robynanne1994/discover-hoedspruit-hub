CREATE OR REPLACE FUNCTION public.respond_to_follow_request(_request_id uuid, _accept boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r public.follows%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  SELECT * INTO r FROM public.follows WHERE id = _request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  IF r.following_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not allowed';
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

REVOKE ALL ON FUNCTION public.respond_to_follow_request(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.respond_to_follow_request(uuid, boolean) TO authenticated;