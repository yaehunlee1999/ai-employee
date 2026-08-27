alter table public.conversation_logs
    add column if not exists vapi_call_id text,
    add column if not exists reservation_id uuid references public.reservations(id) on delete set null,
    add column if not exists transcript text,
    add column if not exists call_ended_reason text;

create unique index if not exists conversation_logs_vapi_call_id_key
    on public.conversation_logs (vapi_call_id)
    where vapi_call_id is not null;

create index if not exists conversation_logs_restaurant_created_at_idx
    on public.conversation_logs (restaurant_id, created_at desc);
