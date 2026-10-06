-- ==========================================================================
-- IFE Impact Dashboard — accounts + privacy schema
--
-- Run this in the Supabase SQL editor (or `supabase db push`) to create the
-- tables that back the "Accounts + privacy/visibility" feature. The static
-- site only needs `profiles` (roles / student links) and `privacy_settings`
-- (who may view each student's data). Everything else (skill scores, peer
-- feedback, self-reflections) currently ships with the site's static bundle.
--
-- IMPORTANT (data privacy): because the sensitive JSON is bundled into the
-- static build, the visibility rules implemented in src/lib/privacy.js are UI
-- enforcement only. For real data privacy, the student records must move into
-- Postgres and be served over authenticated queries behind the policies below.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- profiles — one row per auth user, holding role + student link
-- --------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null unique,
  role       text not null default 'student'
             check (role in ('student', 'teacher', 'admin')),
  student_id text, -- links to the program roster id (e.g. 's001')
  created_at timestamptz not null default now()
);

-- Auto-create a profile whenever a new auth user signs up.
create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, lower(new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_profile();

-- --------------------------------------------------------------------------
-- privacy_settings — a student's visibility preference (one row per student)
-- --------------------------------------------------------------------------
create table if not exists public.privacy_settings (
  student_id     text primary key,
  visibility     text not null default 'everyone'
                 check (visibility in ('everyone', 'teachers', 'specific', 'just_me')),
  allowed_emails text[] not null default '{}',
  updated_at     timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- Row Level Security
-- --------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.privacy_settings enable row level security;

-- profiles: a user can read their own profile; teachers/admins can read all.
create policy "read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "staff read all profiles"
  on public.profiles for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('teacher', 'admin')
  ));

-- profiles: a user updates only their own row.
create policy "update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- profiles: staff (teachers/admins) may update roles + student links (the
-- /admin "Accounts" tab — granting 'teacher'/'admin' is how access is given).
create policy "staff update all profiles"
  on public.profiles for update
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('teacher', 'admin')
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('teacher', 'admin')
  ));

-- privacy_settings: everyone may read the settings (the site's visibility
-- logic reads them to decide what to render). Writes are only allowed by the
-- student the row belongs to, or by staff.
create policy "read privacy settings"
  on public.privacy_settings for select
  using (true);

create policy "insert own privacy setting"
  on public.privacy_settings for insert
  with check (
    student_id = any (
      select p.student_id from public.profiles p
      where p.id = auth.uid()
    ) or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('teacher', 'admin')
    )
  );

create policy "update own privacy setting"
  on public.privacy_settings for update
  using (
    student_id = any (
      select p.student_id from public.profiles p
      where p.id = auth.uid()
    ) or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('teacher', 'admin')
    )
  )
  with check (
    student_id = any (
      select p.student_id from public.profiles p
      where p.id = auth.uid()
    ) or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('teacher', 'admin')
    )
  );

-- --------------------------------------------------------------------------
-- Admin content store — editable copy of { story, teams, students, … } per
-- program ("<programId>:<field>") plus a "registry" row listing the programs.
-- The static app renders the bundled JSON with these overlaid (see
-- src/lib/content.js), so everyone can read; only staff can write.
-- --------------------------------------------------------------------------
create table if not exists public.site_content (
  key        text primary key, -- e.g. 'ife-summer-2026:story' or 'registry'
  payload    jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

create policy "read site content"
  on public.site_content for select
  using (true);

create policy "staff write site content"
  on public.site_content for insert
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('teacher', 'admin')
  ));

create policy "staff update site content"
  on public.site_content for update
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('teacher', 'admin')
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('teacher', 'admin')
  ));

-- --------------------------------------------------------------------------
-- Seeding staff accounts
--
-- Teacher/admin accounts are NOT self-service (see src/pages/AuthPage.jsx —
-- signup only offers the "student" role when Supabase is configured). Create
-- them from the dashboard UI or with a one-off script, e.g. via the service
-- role key:
--
--   await supabase.auth.admin.createUser({ email, password, email_confirm: true })
--   await supabase.from('profiles').update({ role: 'teacher' })
--            .eq('id', userId)
--
-- To link an existing student to their profile (so "Your dashboard" works
-- and they can edit their own privacy), run:
--
--   update public.profiles
--   set student_id = 's001'
--   where email = 'adam@school.edu';
-- --------------------------------------------------------------------------