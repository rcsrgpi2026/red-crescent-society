-- TEMPORARY diagnostic — removed by 0022. A minimal table with ONLY a
-- permissive insert-true policy, to isolate why anonymous inserts are
-- rejected on the real tables.

create table public.rls_probe (
  id bigint generated always as identity primary key,
  note text
);

alter table public.rls_probe enable row level security;

create policy "rls_probe_insert_public" on public.rls_probe
  for insert with check (true);

grant insert on public.rls_probe to anon, authenticated;
