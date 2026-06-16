-- Allow viewing another user's saved items (favourites) on their public profile.
-- The favourites table RLS only permits a user to read their own rows, so the
-- saved tabs on someone else's profile came back empty even though the SAVED
-- count (served by the SECURITY DEFINER get_user_saved_count) showed a number.
-- This SECURITY DEFINER function mirrors that approach and returns the saved
-- item references for any user, optionally filtered by item_type.
create or replace function public.get_user_favourites(_user_id uuid, _item_type text default null)
returns table (item_id uuid, item_type text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select item_id, item_type, created_at
  from public.favourites
  where user_id = _user_id
    and (_item_type is null or item_type = _item_type)
  order by created_at desc;
$$;

grant execute on function public.get_user_favourites(uuid, text) to anon, authenticated;
