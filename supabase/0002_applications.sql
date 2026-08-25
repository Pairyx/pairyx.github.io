-- Pairyx — client applications
--
-- Backs the /apply page on pairyx.co. One row per submitted intake form.
--
-- Why a separate table from the conversational-flow tables in 0001: this is a
-- plain form, not a transcript. Answers arrive in one shot, so there are no
-- turns and no per-slot confidence to track. Keeping it separate means the
-- form can ship and evolve without touching the interview schema.

create table if not exists public.applications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  intake_role   text not null check (intake_role in ('brand', 'creator')),
  email         text not null,
  answers       jsonb not null default '{}'::jsonb,
  emailed       boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists applications_user_idx    on public.applications (user_id);
create index if not exists applications_created_idx on public.applications (created_at desc);

alter table public.applications enable row level security;

grant usage on schema public to authenticated;
grant select, insert on public.applications to authenticated;

-- A signed-in client may submit their own application and read back only their
-- own. There is no update or delete policy: a submission is a record of what
-- they told us, not a document they keep editing.
drop policy if exists applications_own_insert on public.applications;
create policy applications_own_insert on public.applications
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists applications_own_read on public.applications;
create policy applications_own_read on public.applications
  for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

-- Sanity check.
do $$
begin
  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'applications' and c.relrowsecurity
  ) then
    raise exception 'applications table missing or RLS not enabled';
  end if;
  raise notice 'applications table ready, RLS enabled.';
end $$;
