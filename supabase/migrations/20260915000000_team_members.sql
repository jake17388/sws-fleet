create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null check (length(trim(full_name)) > 0),
  email text not null,
  role text not null check (role in ('administrator', 'member')),
  status text not null default 'pending' check (status in ('active', 'pending')),
  invited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index team_members_email_unique on public.team_members (lower(email));

alter table public.team_members enable row level security;

create or replace function public.is_team_administrator(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members
    where user_id = check_user_id
      and role = 'administrator'
      and status = 'active'
  );
$$;

revoke all on function public.is_team_administrator(uuid) from public;
grant execute on function public.is_team_administrator(uuid) to authenticated;

create policy "Administrators can read team members"
on public.team_members for select
to authenticated
using (public.is_team_administrator(auth.uid()));

create policy "Administrators can add team members"
on public.team_members for insert
to authenticated
with check (public.is_team_administrator(auth.uid()));

create policy "Administrators can update team members"
on public.team_members for update
to authenticated
using (public.is_team_administrator(auth.uid()))
with check (public.is_team_administrator(auth.uid()));

with existing_users as (
  select
    id,
    email,
    coalesce(raw_user_meta_data ->> 'full_name', split_part(email, '@', 1)) as full_name,
    row_number() over (order by created_at, id) as user_order
  from auth.users
  where email is not null
)
insert into public.team_members (user_id, full_name, email, role, status)
select
  id,
  full_name,
  email,
  case when user_order = 1 then 'administrator' else 'member' end,
  'active'
from existing_users
on conflict (user_id) do nothing;

create or replace function public.activate_invited_team_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.confirmed_at is null and new.confirmed_at is not null then
    update public.team_members
    set status = 'active', updated_at = now()
    where user_id = new.id;
  end if;
  return new;
end;
$$;

create trigger activate_invited_team_member_after_confirmation
after update of confirmed_at on auth.users
for each row execute function public.activate_invited_team_member();
