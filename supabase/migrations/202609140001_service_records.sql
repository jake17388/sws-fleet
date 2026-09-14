-- Apply after the existing public.vehicles table. Vehicle visibility remains
-- governed by its existing RLS policies; services inherit that visibility.
begin;
create table public.service_records (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  title text not null check (length(trim(title)) > 0),
  due_date date,
  due_meter numeric check (due_meter >= 0),
  meter_unit text not null check (meter_unit in ('mi', 'hr')),
  notes text not null default '',
  provider text not null default '',
  completed_date date,
  completed_meter numeric check (completed_meter >= 0),
  cost numeric(12,2) check (cost >= 0),
  created_at timestamptz not null default now(),
  check (due_date is not null or due_meter is not null),
  check (completed_date is null or (completed_meter is not null and cost is not null))
);
create index service_records_vehicle_id_idx on public.service_records(vehicle_id);
alter table public.service_records enable row level security;
grant select, insert, update on public.service_records to authenticated;
create policy service_read on public.service_records for select to authenticated
  using (exists (select 1 from public.vehicles v where v.id = vehicle_id));
create policy service_create on public.service_records for insert to authenticated
  with check (exists (select 1 from public.vehicles v where v.id = vehicle_id));
create policy service_update on public.service_records for update to authenticated
  using (completed_date is null and exists (select 1 from public.vehicles v where v.id = vehicle_id))
  with check (exists (select 1 from public.vehicles v where v.id = vehicle_id));
commit;
