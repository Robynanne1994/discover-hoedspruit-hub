CREATE OR REPLACE FUNCTION public.get_user_favourites(_user_id UUID, _item_type TEXT DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    item_id UUID,
    item_type TEXT,
    created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only return data if the target user's activity is not private,
    -- or if the requester is the target user themselves,
    -- or if the requester follows the target user (if you want followers to see it)
    -- For now, we respect activity_private flag in profiles.
    
    RETURN QUERY
    SELECT f.id, f.user_id, f.item_id, f.item_type, f.created_at
    FROM public.favourites f
    JOIN public.profiles p ON p.id = f.user_id
    WHERE f.user_id = _user_id
      AND (
          p.activity_private = false 
          OR auth.uid() = _user_id
      )
      AND (_item_type IS NULL OR f.item_type = _item_type);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_favourites TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_favourites TO service_role;
