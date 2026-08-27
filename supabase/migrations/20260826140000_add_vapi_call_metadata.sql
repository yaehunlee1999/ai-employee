alter table public.conversation_logs
    add column if not exists summary text,
    add column if not exists recording_url text,
    add column if not exists duration double precision,
    add column if not exists analysis jsonb;