-- ============================================================
-- signups  [Phase 1: journal footer "Grey Skies Looks — coming soon"]
--   Email addresses left by journal readers. The count decides whether
--   Looks gets built. Run once in the Supabase SQL Editor.
--
--   Same shape as reports: anyone can insert, nobody can read through
--   the API. Read it in the Supabase console (or with service_role).
-- ============================================================

create table public.signups (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  created_at timestamptz not null default now(),
  constraint signups_email_format check (
    char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  )
);

-- One row per address, case-insensitive. A repeat signup fails with
-- 23505, which the app treats as success.
create unique index signups_email_key on public.signups (lower(email));

alter table public.signups enable row level security;

grant insert on public.signups to anon, authenticated;

create policy "signups: anyone can sign up"
  on public.signups for insert
  to anon, authenticated
  with check (true);

-- No select / update / delete policies on purpose.
