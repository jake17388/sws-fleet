begin;
alter table public.vehicles add column if not exists photo_url text;
commit;
