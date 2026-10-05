-- Design photos live in private object storage; designs.photo_url stores the object path.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'design-photos',
  'design-photos',
  false,
  5242880,
  array['image/webp', 'image/png', 'image/svg+xml']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/webp', 'image/png', 'image/svg+xml']::text[];

create policy "authenticated users can read design photos"
  on storage.objects for select to authenticated
  using (bucket_id = 'design-photos');

create policy "authenticated users can upload design photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'design-photos');

create policy "authenticated users can update design photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'design-photos')
  with check (bucket_id = 'design-photos');

create policy "authenticated users can delete design photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'design-photos');
