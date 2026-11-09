-- ==========================================================================
-- Happy Minds — Phase 3: the visit day
-- Run AFTER phase2-timetable.sql, in Dashboard → SQL Editor. Safe to re-run.
--
--   session_log  — each Session 1 / Session 2 of a chapter in a class:
--                  done, not held (with a reason) or not done (with the
--                  next date the class teacher will take it).
--   class_notes  — the trainer's Handbook notes for one class on one day.
--   eod_reports  — the trainer's End-of-Day report: the AI-tidied draft,
--                  the final text they submit, and when.
--
-- Teaching for real: a trainer may now save class work (progress, Lumora
-- Wall, time, stories) in their own classes, and in the classes of a visit
-- they cover as a substitute on that day (India time).
-- It only adds; nothing existing is removed.
-- ==========================================================================

-- A substitute covers this class today.
create or replace function private.covers_section_today(sid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
    select exists (
        select 1
        from public.substitutions su
        join public.sections s on s.school_id = su.school_id and s.trainer_id = su.trainer_id
        where s.id = sid
          and su.substitute_id = (select auth.uid())
          and su.visit_date = (now() at time zone 'Asia/Kolkata')::date
    )
$$;

-- Assigned to the class, or covering it today.
create or replace function private.can_teach_section(sid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
    select exists (
        select 1 from public.sections s
        where s.id = sid and (s.teacher_id = (select auth.uid()) or s.trainer_id = (select auth.uid()))
    ) or private.covers_section_today(sid)
$$;

-- --------------------------------------------------------------------------
-- Session records
-- --------------------------------------------------------------------------
create table if not exists public.session_log (
    id          uuid primary key default gen_random_uuid(),
    section_id  uuid not null references public.sections (id) on delete cascade,
    chapter_id  integer not null check (chapter_id between 1 and 24),
    session     smallint not null check (session in (1, 2)),
    held_on     date not null,
    status      text not null check (status in ('done', 'not_held', 'not_done')),
    reason      text not null default '' check (char_length(reason) <= 300),
    next_date   date,
    recorded_by uuid default auth.uid() references public.profiles (id) on delete set null,
    recorded_at timestamptz not null default now(),
    unique (section_id, chapter_id, session, held_on)
);
create index if not exists session_log_by_section on public.session_log (section_id, chapter_id, session);

-- --------------------------------------------------------------------------
-- Handbook notes: one entry per class, day and person. `fields` holds the
-- Handbook page's sections (lesson, attentiveness, participation, stars,
-- support, remarks) as typed.
-- --------------------------------------------------------------------------
create table if not exists public.class_notes (
    id          uuid primary key default gen_random_uuid(),
    section_id  uuid not null references public.sections (id) on delete cascade,
    user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
    note_date   date not null,
    chapter_id  integer check (chapter_id between 1 and 24),
    session     smallint not null default 1 check (session in (1, 2)),
    fields      jsonb not null default '{}'::jsonb,
    updated_at  timestamptz not null default now(),
    unique (section_id, user_id, note_date, session)
);
create index if not exists class_notes_by_user_day on public.class_notes (user_id, note_date);

-- --------------------------------------------------------------------------
-- End-of-Day reports: one per person and day.
-- --------------------------------------------------------------------------
create table if not exists public.eod_reports (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
    report_date  date not null,
    draft        jsonb,
    final        jsonb,
    submitted_at timestamptz,
    updated_at   timestamptz not null default now(),
    unique (user_id, report_date)
);

-- --------------------------------------------------------------------------
-- Row Level Security
-- --------------------------------------------------------------------------
alter table public.session_log enable row level security;
alter table public.class_notes enable row level security;
alter table public.eod_reports enable row level security;

-- Sessions: seen by anyone who can see the class; recorded by its teacher or
-- trainer (or today's substitute), as themselves.
drop policy if exists "See your classes' sessions" on public.session_log;
create policy "See your classes' sessions"
    on public.session_log for select to authenticated
    using (private.can_see_section(section_id));

drop policy if exists "Class staff record sessions" on public.session_log;
create policy "Class staff record sessions"
    on public.session_log for insert to authenticated
    with check (recorded_by = (select auth.uid()) and private.can_teach_section(section_id));

drop policy if exists "Class staff correct sessions" on public.session_log;
create policy "Class staff correct sessions"
    on public.session_log for update to authenticated
    using (private.can_teach_section(section_id))
    with check (recorded_by = (select auth.uid()) and private.can_teach_section(section_id));

-- Notes: the writer; oversight; and the class's teacher and trainer (the
-- teacher sees what the trainer covered before Session 2).
drop policy if exists "See notes about your classes" on public.class_notes;
create policy "See notes about your classes"
    on public.class_notes for select to authenticated
    using (user_id = (select auth.uid()) or private.can_see_section(section_id));

drop policy if exists "Write your own notes for your classes" on public.class_notes;
create policy "Write your own notes for your classes"
    on public.class_notes for insert to authenticated
    with check (user_id = (select auth.uid()) and private.can_teach_section(section_id));

drop policy if exists "Update your own notes" on public.class_notes;
create policy "Update your own notes"
    on public.class_notes for update to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()) and private.can_teach_section(section_id));

-- Reports: the writer, and admin / coordinator / management.
drop policy if exists "See your reports; oversight sees all" on public.eod_reports;
create policy "See your reports; oversight sees all"
    on public.eod_reports for select to authenticated
    using (user_id = (select auth.uid()) or (select private.is_oversight()));

drop policy if exists "Trainers write their own reports" on public.eod_reports;
create policy "Trainers write their own reports"
    on public.eod_reports for insert to authenticated
    with check (user_id = (select auth.uid()) and (select private.my_role()) in ('trainer', 'teacher'));

drop policy if exists "Trainers update their own reports" on public.eod_reports;
create policy "Trainers update their own reports"
    on public.eod_reports for update to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));

revoke all on public.session_log, public.class_notes, public.eod_reports from anon, authenticated;
grant select, insert, update on public.session_log, public.class_notes, public.eod_reports to authenticated;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;
