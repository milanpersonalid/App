-- Rename the temporary Dal stage back to the product name Dull.
alter table public.lots drop constraint if exists lots_current_stage_check;

update public.lots
set current_stage = 'Dull'
where current_stage = 'Dal';

alter table public.lots add constraint lots_current_stage_check
  check (current_stage in ('Wax', 'Casting', 'Buff', 'Zabora', 'Dull', 'Chhol', 'Plating', 'Ready Stock'));
