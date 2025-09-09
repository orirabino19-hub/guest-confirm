-- Create a table to persist global languages used by LanguageSystemManager
create table if not exists public.system_languages (
  code text primary key,
  name text not null,
  native_name text not null,
  flag text,
  rtl boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS with permissive public access (app currently runs without auth)
alter table public.system_languages enable row level security;

-- Policies
create policy if not exists "Public can read system languages"
  on public.system_languages for select
  using (true);

create policy if not exists "Public can insert system languages"
  on public.system_languages for insert
  with check (true);

create policy if not exists "Public can update system languages"
  on public.system_languages for update
  using (true)
  with check (true);

create policy if not exists "Public can delete system languages"
  on public.system_languages for delete
  using (true);

-- Keep updated_at fresh
create or replace trigger update_system_languages_updated_at
before update on public.system_languages
for each row
execute function public.update_updated_at_column();

-- Seed base languages so UI always has minimum set
insert into public.system_languages (code, name, native_name, flag, rtl)
values 
  ('he','Hebrew','עברית','🇮🇱', true),
  ('en','English','English','🇺🇸', false)
on conflict (code) do nothing;