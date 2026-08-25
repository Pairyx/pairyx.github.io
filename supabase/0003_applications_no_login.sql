-- Pairyx — /apply, no login (for now)
--
-- 0002 tied every application to a signed-in Supabase user. The login step
-- is being pulled from the page for now, so this drops that requirement:
-- user_id becomes optional, and the anon key (what the static page actually
-- uses) is granted insert. Still no anon read policy — submissions can only
-- be written, not listed back, by the public key.
--
-- The old authenticated policies are left in place rather than dropped, so
-- re-enabling login later does not need another migration.

alter table public.applications
  alter column user_id drop not null;

grant insert on public.applications to anon;

drop policy if exists applications_anon_insert on public.applications;
create policy applications_anon_insert on public.applications
  for insert to anon
  with check (user_id is null);

do $$
begin
  raise notice 'applications now accepts anonymous inserts (user_id optional).';
end $$;
