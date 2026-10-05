alter table public.lots
  alter column initial_pieces drop not null,
  alter column initial_weight drop not null;

alter table public.lots
  drop constraint if exists lots_initial_pieces_check,
  drop constraint if exists lots_initial_weight_check,
  drop constraint if exists lots_status_check;

alter table public.lots
  add constraint lots_initial_pieces_check
    check (initial_pieces is null or initial_pieces > 0),
  add constraint lots_initial_weight_check
    check (initial_weight is null or initial_weight > 0),
  add constraint lots_status_check
    check (status in (
      'awaiting_wax_receipt',
      'in_progress',
      'arrived_awaiting_entry',
      'stage_complete',
      'ready_stock'
    ));
