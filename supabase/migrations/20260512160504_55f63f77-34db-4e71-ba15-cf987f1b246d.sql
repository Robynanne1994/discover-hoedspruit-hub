create or replace function public.get_user_saved_count(_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int from public.favourites where user_id = _user_id;
$$;

grant execute on function public.get_user_saved_count(uuid) to anon, authenticated;