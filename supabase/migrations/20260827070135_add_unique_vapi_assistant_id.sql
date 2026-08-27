create unique index if not exists restaurant_settings_vapi_assistant_id_key
    on public.restaurant_settings (vapi_assistant_id)
    where vapi_assistant_id is not null;
