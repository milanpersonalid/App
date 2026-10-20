-- Final calibration model: Wax, Casting/Metal, Buff, and Zabora.
-- Preserve legacy values while making the migration safe for both existing and fresh databases.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'designs' and column_name = 'plain_avg_weight_per_piece')
    and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'designs' and column_name = 'buff_avg_weight_per_piece') then
    alter table public.designs rename column plain_avg_weight_per_piece to buff_avg_weight_per_piece;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'designs' and column_name = 'gold_avg_weight_per_piece')
    and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'designs' and column_name = 'zabora_avg_weight_per_piece') then
    alter table public.designs rename column gold_avg_weight_per_piece to zabora_avg_weight_per_piece;
  end if;
end $$;

alter table public.designs add column if not exists buff_avg_weight_per_piece numeric not null default 0;
alter table public.designs add column if not exists zabora_avg_weight_per_piece numeric not null default 0;
alter table public.designs drop column if exists plain_avg_weight_per_piece;
alter table public.designs drop column if exists gold_avg_weight_per_piece;

alter table public.designs
  drop constraint if exists designs_plain_avg_weight_per_piece_check,
  drop constraint if exists designs_gold_avg_weight_per_piece_check,
  drop constraint if exists designs_buff_avg_weight_per_piece_check,
  drop constraint if exists designs_zabora_avg_weight_per_piece_check;

alter table public.designs
  add constraint designs_buff_avg_weight_per_piece_check check (buff_avg_weight_per_piece >= 0),
  add constraint designs_zabora_avg_weight_per_piece_check check (zabora_avg_weight_per_piece >= 0);

-- Existing records may use the temporary UI label/value `Dal`; the product stage is Dull.
alter table public.lots drop constraint if exists lots_current_stage_check;
update public.lots set current_stage = 'Dull' where current_stage = 'Dal';
alter table public.lots add constraint lots_current_stage_check
  check (current_stage in ('Wax', 'Casting', 'Buff', 'Zabora', 'Dull', 'Chhol', 'Plating', 'Ready Stock'));
