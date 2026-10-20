-- Keep design-photo storage policies aligned with the bucket used by the app.
-- The access-control migration accidentally checked `design-images`, while the
-- bucket and client code both use `design-photos`.
drop policy if exists "approved users can read designs" on public.designs;
drop policy if exists "approved users can write designs" on public.designs;
drop policy if exists "approved users can read karigars" on public.karigars;
drop policy if exists "approved users can write karigars" on public.karigars;
drop policy if exists "approved users can read lots" on public.lots;
drop policy if exists "approved users can write lots" on public.lots;

create policy "approved users can read designs"
  on public.designs for select to authenticated
  using (public.current_user_is_approved());

create policy "approved users can write designs"
  on public.designs for all to authenticated
  using (public.current_user_is_approved())
  with check (public.current_user_is_approved());

create policy "approved users can read karigars"
  on public.karigars for select to authenticated
  using (public.current_user_is_approved());

create policy "approved users can write karigars"
  on public.karigars for all to authenticated
  using (public.current_user_is_approved())
  with check (public.current_user_is_approved());

create policy "approved users can read lots"
  on public.lots for select to authenticated
  using (public.current_user_is_approved());

create policy "approved users can write lots"
  on public.lots for all to authenticated
  using (public.current_user_is_approved())
  with check (public.current_user_is_approved());

drop policy if exists "approved users can read design photos" on storage.objects;
drop policy if exists "approved users can upload design photos" on storage.objects;
drop policy if exists "approved users can update design photos" on storage.objects;
drop policy if exists "approved users can delete design photos" on storage.objects;

create policy "approved users can read design photos"
  on storage.objects for select to authenticated
  using (bucket_id = 'design-photos' and public.current_user_is_approved());

create policy "approved users can upload design photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'design-photos' and public.current_user_is_approved());

create policy "approved users can update design photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'design-photos' and public.current_user_is_approved())
  with check (bucket_id = 'design-photos' and public.current_user_is_approved());

create policy "approved users can delete design photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'design-photos' and public.current_user_is_approved());
