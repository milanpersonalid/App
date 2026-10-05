create table if not exists public.designs (
  id text primary key,
  name text not null,
  order_ref text not null,
  photo_url text not null,
  target_quantity integer,
  low_stock_threshold integer not null default 500 check (low_stock_threshold > 0),
  barcode text not null unique,
  wax_avg_weight_per_piece numeric not null check (wax_avg_weight_per_piece >= 0),
  metal_avg_weight_per_piece numeric not null check (metal_avg_weight_per_piece >= 0),
  plain_avg_weight_per_piece numeric not null default 0 check (plain_avg_weight_per_piece >= 0),
  gold_avg_weight_per_piece numeric not null default 0 check (gold_avg_weight_per_piece >= 0),
  sample_weight numeric not null default 0 check (sample_weight >= 0),
  sample_piece_count integer not null default 0 check (sample_piece_count >= 0),
  fingerprint jsonb,
  created_at date not null default current_date,
  updated_at date not null default current_date
);

create table if not exists public.karigars (
  id text primary key,
  name text not null,
  phone text not null default '',
  specialty_stages text[] not null default '{}'
);

create table if not exists public.lots (
  id text primary key,
  lot_number text not null unique,
  design_id text not null references public.designs(id) on delete restrict,
  design_name text not null,
  initial_pieces integer not null check (initial_pieces > 0),
  initial_weight numeric not null check (initial_weight > 0),
  current_stage text not null check (current_stage in ('Wax', 'Casting', 'Buff', 'Zabora', 'Dull', 'Chhol', 'Plating', 'Ready Stock')),
  branch text not null default 'none' check (branch in ('none', 'plain', 'gold')),
  current_karigar_id text references public.karigars(id) on delete restrict,
  current_karigar_name text not null,
  status text not null check (status in ('in_progress', 'arrived_awaiting_entry', 'stage_complete', 'ready_stock')),
  current_qr_data text not null,
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  created_at date not null default current_date,
  ready_stock_bucket text check (ready_stock_bucket in ('Plain', 'Gold')),
  final_pieces integer check (final_pieces >= 0),
  final_weight numeric check (final_weight >= 0)
);

create index if not exists lots_design_id_idx on public.lots(design_id);
create index if not exists lots_status_idx on public.lots(status);
create index if not exists lots_current_stage_idx on public.lots(current_stage);
create index if not exists lots_current_karigar_id_idx on public.lots(current_karigar_id);

alter table public.designs enable row level security;
alter table public.karigars enable row level security;
alter table public.lots enable row level security;

-- Temporary authenticated-user policies. Replace these with facility/role-based
-- policies when user profiles and memberships are introduced. Anonymous users
-- intentionally receive no database access.
create policy "authenticated users can read designs"
  on public.designs for select to authenticated using (true);
create policy "authenticated users can write designs"
  on public.designs for all to authenticated using (true) with check (true);

create policy "authenticated users can read karigars"
  on public.karigars for select to authenticated using (true);
create policy "authenticated users can write karigars"
  on public.karigars for all to authenticated using (true) with check (true);

create policy "authenticated users can read lots"
  on public.lots for select to authenticated using (true);
create policy "authenticated users can write lots"
  on public.lots for all to authenticated using (true) with check (true);

alter publication supabase_realtime add table public.designs;
alter publication supabase_realtime add table public.karigars;
alter publication supabase_realtime add table public.lots;
