alter table public.restaurant_users
    add column if not exists auth_user_id uuid references auth.users(id) on delete cascade;

create unique index if not exists restaurant_users_auth_user_id_key
    on public.restaurant_users (auth_user_id)
    where auth_user_id is not null;

update public.restaurant_users as restaurant_user
set auth_user_id = auth_user.id
from auth.users as auth_user
where restaurant_user.auth_user_id is null
  and lower(restaurant_user.email) = lower(auth_user.email);
