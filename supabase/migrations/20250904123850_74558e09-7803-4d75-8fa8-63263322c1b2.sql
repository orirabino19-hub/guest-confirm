-- Create a least-privilege RPC to fetch only a guest's display name for RSVP flows
-- This prevents exposing phone/email while keeping current admin features unaffected.

create or replace function public.get_guest_name_by_phone(_event_id uuid, _phone text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  -- Normalize both stored and input phone numbers to digits-only for matching
  select g.full_name into v_name
  from public.guests g
  where g.event_id = _event_id
    and regexp_replace(coalesce(g.phone,''), '\\D', '', 'g') = regexp_replace(coalesce(_phone,''), '\\D', '', 'g')
  limit 1;

  return v_name; -- may be null if not found
end;
$$;

-- Tighten privileges: only allow explicit roles to execute
revoke all on function public.get_guest_name_by_phone(uuid, text) from public;
grant execute on function public.get_guest_name_by_phone(uuid, text) to anon, authenticated;
