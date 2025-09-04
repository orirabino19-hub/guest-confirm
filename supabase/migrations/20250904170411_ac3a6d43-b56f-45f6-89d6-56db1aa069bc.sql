-- Create a public storage bucket for invitations and allow anonymous access (temporary until auth is added)
insert into storage.buckets (id, name, public)
values ('invitations', 'invitations', true)
on conflict (id) do nothing;

-- Allow public read access to invitation files
create policy "Public can read invitations"
on storage.objects
for select
to public
using (bucket_id = 'invitations');

-- Allow anonymous users to upload invitation files
create policy "Anon can upload invitations"
on storage.objects
for insert
to anon
with check (bucket_id = 'invitations');

-- Allow anonymous users to update existing invitation files (for upserts)
create policy "Anon can update invitations"
on storage.objects
for update
to anon
using (bucket_id = 'invitations');

-- Allow anonymous users to delete invitation files (used by admin UI)
create policy "Anon can delete invitations"
on storage.objects
for delete
to anon
using (bucket_id = 'invitations');