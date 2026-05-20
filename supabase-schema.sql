-- Run this in Supabase SQL Editor once.
-- The backend uses the service role key, so RLS is intentionally disabled.

create table if not exists public.nham_docs (
  collection text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.nham_items (
  collection text not null,
  id bigint not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

alter table public.nham_docs disable row level security;
alter table public.nham_items disable row level security;

insert into storage.buckets (id, name, public, file_size_limit)
values ('uploads', 'uploads', true, 10485760)
on conflict (id) do update
set public = true,
    file_size_limit = 10485760;
