alter table public.customers
    add column if not exists restaurant_id uuid
    references public.restaurants(id) on delete cascade;

update public.customers as customer
set restaurant_id = reservation_restaurants.restaurant_id
from (
    select distinct on (customer_id) customer_id, restaurant_id
    from public.reservations
    where customer_id is not null
    order by customer_id, restaurant_id
) as reservation_restaurants
where customer.id = reservation_restaurants.customer_id
  and customer.restaurant_id is null;

alter table public.customers
    alter column restaurant_id set not null;

create index if not exists customers_restaurant_id_idx
    on public.customers (restaurant_id);
