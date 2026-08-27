alter table public.restaurants
    add column if not exists is_demo boolean not null default false;

create index if not exists restaurants_is_demo_idx
    on public.restaurants (is_demo)
    where is_demo = true;
