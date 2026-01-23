-- Create a storage bucket for invoices (Idempotent)
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', true)
on conflict (id) do nothing;

-- Set up security policy to allow public read access
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'invoices' );

-- Set up security policy to allow authenticated users (Admin) to upload
drop policy if exists "Authenticated Insert" on storage.objects;
create policy "Authenticated Insert"
  on storage.objects for insert
  with check ( bucket_id = 'invoices' );
