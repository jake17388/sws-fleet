begin;

create table public.inspection_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  description text not null default '',
  vehicle_types text[] not null default '{}',
  vehicle_ids uuid[] not null default '{}',
  cadence_days integer check (cadence_days is null or cadence_days > 0),
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardinality(vehicle_types) > 0 or cardinality(vehicle_ids) > 0)
);

create table public.inspection_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.inspection_templates(id) on delete cascade,
  label text not null check (length(trim(label)) > 0),
  response_type text not null check (response_type in ('pass_fail', 'pass_fail_na', 'text', 'number', 'meter', 'photo')),
  required boolean not null default true,
  instructions text not null default '',
  position integer not null check (position >= 0),
  unique (template_id, position)
);

create table public.inspections (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.inspection_templates(id) on delete restrict,
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  inspector_id uuid not null references auth.users(id) on delete restrict default auth.uid(),
  status text not null default 'Draft' check (status in ('Draft', 'Passed', 'Failed', 'Submitted')),
  notes text not null default '',
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'Draft' and submitted_at is null) or (status <> 'Draft' and submitted_at is not null))
);

create table public.inspection_responses (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  template_item_id uuid not null references public.inspection_template_items(id) on delete restrict,
  value_text text,
  value_number numeric,
  notes text not null default '',
  photo_paths text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (inspection_id, template_item_id),
  check (not (value_text is not null and value_number is not null))
);

create table public.inspection_issues (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  inspection_item_id uuid not null references public.inspection_template_items(id) on delete restrict,
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  status text not null default 'Open' check (status in ('Open', 'Resolved')),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (inspection_id, inspection_item_id)
);

create index inspection_templates_active_idx on public.inspection_templates(archived_at) where archived_at is null;
create index inspection_template_items_template_idx on public.inspection_template_items(template_id, position);
create index inspections_vehicle_submitted_idx on public.inspections(vehicle_id, submitted_at desc);
create index inspections_template_vehicle_idx on public.inspections(template_id, vehicle_id);
create index inspections_status_idx on public.inspections(status);
create index inspection_responses_inspection_idx on public.inspection_responses(inspection_id);
create index inspection_issues_vehicle_status_idx on public.inspection_issues(vehicle_id, status);

create function public.touch_inspection_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger inspection_templates_touch before update on public.inspection_templates for each row execute function public.touch_inspection_updated_at();
create trigger inspections_touch before update on public.inspections for each row execute function public.touch_inspection_updated_at();
create trigger inspection_responses_touch before update on public.inspection_responses for each row execute function public.touch_inspection_updated_at();
create trigger inspection_issues_touch before update on public.inspection_issues for each row execute function public.touch_inspection_updated_at();

alter table public.inspection_templates enable row level security;
alter table public.inspection_template_items enable row level security;
alter table public.inspections enable row level security;
alter table public.inspection_responses enable row level security;
alter table public.inspection_issues enable row level security;
grant select, insert, update, delete on public.inspection_templates, public.inspection_template_items to authenticated;
grant select, insert, update on public.inspections, public.inspection_responses, public.inspection_issues to authenticated;

create policy inspection_templates_read on public.inspection_templates for select to authenticated using (true);
create policy inspection_templates_manage on public.inspection_templates for all to authenticated using (true) with check (true);
create policy inspection_template_items_read on public.inspection_template_items for select to authenticated using (true);
create policy inspection_template_items_manage on public.inspection_template_items for all to authenticated using (true) with check (true);
create policy inspections_read on public.inspections for select to authenticated using (exists (select 1 from public.vehicles v where v.id = vehicle_id));
create policy inspections_create on public.inspections for insert to authenticated with check (inspector_id = auth.uid() and exists (select 1 from public.vehicles v where v.id = vehicle_id));
create policy inspections_update_draft on public.inspections for update to authenticated using (inspector_id = auth.uid() and status = 'Draft') with check (inspector_id = auth.uid());
create policy inspection_responses_read on public.inspection_responses for select to authenticated using (exists (select 1 from public.inspections i where i.id = inspection_id));
create policy inspection_responses_create on public.inspection_responses for insert to authenticated with check (exists (select 1 from public.inspections i where i.id = inspection_id and i.inspector_id = auth.uid() and i.status = 'Draft'));
create policy inspection_responses_update on public.inspection_responses for update to authenticated using (exists (select 1 from public.inspections i where i.id = inspection_id and i.inspector_id = auth.uid() and i.status = 'Draft'));
create policy inspection_issues_read on public.inspection_issues for select to authenticated using (exists (select 1 from public.vehicles v where v.id = vehicle_id));
create policy inspection_issues_create on public.inspection_issues for insert to authenticated with check (created_by = auth.uid() and exists (select 1 from public.inspections i where i.id = inspection_id and i.vehicle_id = vehicle_id));
create policy inspection_issues_update on public.inspection_issues for update to authenticated using (exists (select 1 from public.vehicles v where v.id = vehicle_id)) with check (exists (select 1 from public.vehicles v where v.id = vehicle_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('inspection-photos', 'inspection-photos', false, 10485760, array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do nothing;
create policy inspection_photo_read on storage.objects for select to authenticated using (bucket_id = 'inspection-photos' and exists (select 1 from public.inspections i where i.id::text = split_part(name, '/', 1)));
create policy inspection_photo_create on storage.objects for insert to authenticated with check (bucket_id = 'inspection-photos' and exists (select 1 from public.inspections i where i.id::text = split_part(name, '/', 1) and i.inspector_id = auth.uid() and i.status = 'Draft'));

with inserted as (
  insert into public.inspection_templates (id, name, description, vehicle_types, cadence_days)
  values ('451bca50-2265-4ea8-94ea-b25418aa25c4', 'SWS Truck Pre-Trip Inspection', 'Daily safety and readiness check for Summit West Signs trucks.', array['Truck'], 1)
  on conflict (id) do nothing returning id
)
insert into public.inspection_template_items (id, template_id, label, response_type, required, instructions, position) values
  ('11111111-1111-4111-8111-111111111101','451bca50-2265-4ea8-94ea-b25418aa25c4','Walkaround damage check','pass_fail_na',true,'Walk around the vehicle and note new damage.',0),
  ('11111111-1111-4111-8111-111111111102','451bca50-2265-4ea8-94ea-b25418aa25c4','Tires, wheels, and lug nuts','pass_fail_na',true,'Check inflation, tread, visible damage, and loose hardware.',1),
  ('11111111-1111-4111-8111-111111111103','451bca50-2265-4ea8-94ea-b25418aa25c4','Headlights, signals, brake and warning lights','pass_fail_na',true,'Confirm all required lamps operate.',2),
  ('11111111-1111-4111-8111-111111111104','451bca50-2265-4ea8-94ea-b25418aa25c4','Service and parking brakes','pass_fail',true,'Confirm firm pedal pressure and parking-brake hold.',3),
  ('11111111-1111-4111-8111-111111111105','451bca50-2265-4ea8-94ea-b25418aa25c4','Leaks and fluid levels','pass_fail_na',true,'Look beneath the truck and check accessible fluid levels.',4),
  ('11111111-1111-4111-8111-111111111106','451bca50-2265-4ea8-94ea-b25418aa25c4','Seat belts, mirrors, horn, and windshield','pass_fail',true,'Confirm cab safety equipment and clear visibility.',5),
  ('11111111-1111-4111-8111-111111111107','451bca50-2265-4ea8-94ea-b25418aa25c4','Boom, crane, outriggers, and controls','pass_fail_na',true,'Inspect only equipment installed on this truck.',6),
  ('11111111-1111-4111-8111-111111111108','451bca50-2265-4ea8-94ea-b25418aa25c4','Load, tools, and sign materials secured','pass_fail',true,'Confirm cargo and exterior compartments are secured.',7),
  ('11111111-1111-4111-8111-111111111109','451bca50-2265-4ea8-94ea-b25418aa25c4','Odometer or hour-meter reading','meter',true,'Enter the current primary vehicle meter.',8),
  ('11111111-1111-4111-8111-111111111110','451bca50-2265-4ea8-94ea-b25418aa25c4','Vehicle condition photo','photo',true,'Take a current exterior photo showing the vehicle condition.',9),
  ('11111111-1111-4111-8111-111111111111','451bca50-2265-4ea8-94ea-b25418aa25c4','Additional observations','text',false,'Record anything the next operator or fleet manager should know.',10)
on conflict (id) do nothing;

commit;
