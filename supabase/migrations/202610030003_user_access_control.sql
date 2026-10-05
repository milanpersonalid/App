-- User approval and role system.
-- Change the bootstrap email here when ownership is intentionally transferred.
create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  role text not null default 'member' check (role in ('admin', 'member')),
  access_status text not null default 'pending' check (access_status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);

alter table public.app_users enable row level security;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_users
    where id = auth.uid() and role = 'admin' and access_status = 'approved'
  );
$$;

create or replace function public.current_user_is_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_users
    where id = auth.uid() and access_status = 'approved'
  );
$$;

revoke all on function public.current_user_is_admin() from public;
revoke all on function public.current_user_is_approved() from public;
grant execute on function public.current_user_is_admin() to authenticated;
grant execute on function public.current_user_is_approved() to authenticated;

create or replace function public.handle_new_app_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_bootstrap_admin boolean := lower(new.email) = 'milanpersonalid@gmail.com';
begin
  insert into public.app_users (id, email, full_name, role, access_status, reviewed_at)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    case when is_bootstrap_admin then 'admin' else 'member' end,
    case when is_bootstrap_admin then 'approved' else 'pending' end,
    case when is_bootstrap_admin then now() else null end
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = case when public.app_users.full_name = '' then excluded.full_name else public.app_users.full_name end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_app_user on auth.users;
create trigger on_auth_user_created_create_app_user
  after insert or update of email, raw_user_meta_data on auth.users
  for each row execute function public.handle_new_app_user();

insert into public.app_users (id, email, full_name, role, access_status, reviewed_at)
select
  id,
  lower(email),
  coalesce(raw_user_meta_data ->> 'name', split_part(email, '@', 1)),
  case when lower(email) = 'milanpersonalid@gmail.com' then 'admin' else 'member' end,
  case when lower(email) = 'milanpersonalid@gmail.com' then 'approved' else 'pending' end,
  case when lower(email) = 'milanpersonalid@gmail.com' then now() else null end
from auth.users
where email is not null
on conflict (id) do update set
  email = excluded.email,
  role = case when excluded.email = 'milanpersonalid@gmail.com' then 'admin' else public.app_users.role end,
  access_status = case when excluded.email = 'milanpersonalid@gmail.com' then 'approved' else public.app_users.access_status end,
  reviewed_at = case when excluded.email = 'milanpersonalid@gmail.com' then now() else public.app_users.reviewed_at end;

drop policy if exists "users can read own access profile" on public.app_users;
drop policy if exists "admins can read all access profiles" on public.app_users;
drop policy if exists "admins can review access profiles" on public.app_users;
create policy "users can read own access profile"
  on public.app_users for select to authenticated using (id = auth.uid());
create policy "admins can read all access profiles"
  on public.app_users for select to authenticated using (public.current_user_is_admin());
create policy "admins can review access profiles"
  on public.app_users for update to authenticated
  using (public.current_user_is_admin()) with check (public.current_user_is_admin());

-- Replace the original broad authenticated-user production policies.
drop policy if exists "authenticated users can read designs" on public.designs;
drop policy if exists "authenticated users can write designs" on public.designs;
drop policy if exists "authenticated users can read karigars" on public.karigars;
drop policy if exists "authenticated users can write karigars" on public.karigars;
drop policy if exists "authenticated users can read lots" on public.lots;
drop policy if exists "authenticated users can write lots" on public.lots;

create policy "approved users can read designs" on public.designs for select to authenticated using (public.current_user_is_approved());
create policy "approved users can write designs" on public.designs for all to authenticated using (public.current_user_is_approved()) with check (public.current_user_is_approved());
create policy "approved users can read karigars" on public.karigars for select to authenticated using (public.current_user_is_approved());
create policy "approved users can write karigars" on public.karigars for all to authenticated using (public.current_user_is_approved()) with check (public.current_user_is_approved());
create policy "approved users can read lots" on public.lots for select to authenticated using (public.current_user_is_approved());
create policy "approved users can write lots" on public.lots for all to authenticated using (public.current_user_is_approved()) with check (public.current_user_is_approved());

-- Protect design photos with the same approved-user rule.
drop policy if exists "authenticated users can read design photos" on storage.objects;
drop policy if exists "authenticated users can upload design photos" on storage.objects;
drop policy if exists "authenticated users can update design photos" on storage.objects;
drop policy if exists "authenticated users can delete design photos" on storage.objects;
create policy "approved users can read design photos" on storage.objects for select to authenticated using (bucket_id = 'design-images' and public.current_user_is_approved());
create policy "approved users can upload design photos" on storage.objects for insert to authenticated with check (bucket_id = 'design-images' and public.current_user_is_approved());
create policy "approved users can update design photos" on storage.objects for update to authenticated using (bucket_id = 'design-images' and public.current_user_is_approved()) with check (bucket_id = 'design-images' and public.current_user_is_approved());
create policy "approved users can delete design photos" on storage.objects for delete to authenticated using (bucket_id = 'design-images' and public.current_user_is_approved());

alter publication supabase_realtime add table public.app_users;
