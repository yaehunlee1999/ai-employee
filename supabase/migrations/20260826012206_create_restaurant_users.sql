create table if not exists public.restaurant_users (
    id uuid primary key default gen_random_uuid(),
    restaurant_id uuid not null references public.restaurants(id) on delete cascade,
    email text not null unique,
    password_hash text not null,
    name text,
    role text default 'owner',
    created_at timestamp without time zone default now(),
    updated_at timestamp without time zone default now()
);

create index if not exists restaurant_users_restaurant_id_idx
    on public.restaurant_users (restaurant_id);

alter table public.restaurant_users enable row level security;

-- No policy is added in this step. Until an authenticated admin API is added,
-- the Supabase Data API cannot read or mutate account rows directly.
