-- Create table (idempotent)
create table if not exists public.system_languages (
  code text primary key,
  name text not null,
  native_name text not null,
  flag text,
  rtl boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.system_languages enable row level security;

-- Recreate policies idempotently
drop policy if exists "Public can read system languages" on public.system_languages;
create policy "Public can read system languages"
  on public.system_languages for select
  using (true);

drop policy if exists "Public can insert system languages" on public.system_languages;
create policy "Public can insert system languages"
  on public.system_languages for insert
  with check (true);

drop policy if exists "Public can update system languages" on public.system_languages;
create policy "Public can update system languages"
  on public.system_languages for update
  using (true)
  with check (true);

drop policy if exists "Public can delete system languages" on public.system_languages;
create policy "Public can delete system languages"
  on public.system_languages for delete
  using (true);

-- Trigger for updated_at
drop trigger if exists update_system_languages_updated_at on public.system_languages;
create trigger update_system_languages_updated_at
before update on public.system_languages
for each row
execute function public.update_updated_at_column();

-- Seed base languages
insert into public.system_languages (code, name, native_name, flag, rtl)
values 
  ('he','Hebrew','עברית','🇮🇱', true),
  ('en','English','English','🇺🇸', false)
on conflict (code) do nothing;