alter table public.designs
  alter column sample_weight set default 0,
  alter column sample_piece_count set default 0;

alter table public.designs
  drop constraint if exists designs_sample_weight_check,
  drop constraint if exists designs_sample_piece_count_check;

alter table public.designs
  add constraint designs_sample_weight_check check (sample_weight >= 0),
  add constraint designs_sample_piece_count_check check (sample_piece_count >= 0);
