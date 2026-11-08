-- ==========================================================================
-- Happy Minds — Phase 1: schools and sections
-- Run AFTER schema.sql, in Dashboard → SQL Editor. Safe to re-run.
--
-- Until now the portal behaved as one class in one school. This adds:
--   schools      — each school, its code and package (Standard / Premium / Advance)
--   sections     — Std 4–8 sections (4A, 4B…), each with its class teacher and trainer
--   students.section_id — the section each student belongs to
--   section_documents   — class progress and the Lumora Wall, one per section
--   time_logs    — class, prep and scan time per person, section, chapter and day
--   prep_status  — Teacher Prep readiness per person and chapter
-- and two new staff roles: coordinator and management.
--
-- Who sees what (Row Level Security below):
--   admin, coordinator, management — every school and section
--   teacher, trainer               — only the sections they are assigned to
--   student, parent                — their own child, and that child's section
-- Only admin and coordinator change schools, sections and student lists.
--
-- It only adds: the old class-wide records in app_documents stay as they are,
-- so the portal keeps working while the new version is built.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- Roles and staff contact details
-- --------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
    check (role in ('teacher', 'trainer', 'admin', 'coordinator', 'management', 'student', 'parent'));
alter table public.profiles add column if not exists phone text not null default '';
alter table public.profiles add column if not exists contact_email text not null default '';

create or replace function private.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
    select coalesce(private.my_role() in ('teacher', 'trainer', 'admin', 'coordinator', 'management'), false)
$$;

-- Sees every school and section.
create or replace function private.is_oversight()
returns boolean language sql stable security definer set search_path = '' as $$
    select coalesce(private.my_role() in ('admin', 'coordinator', 'management'), false)
$$;

-- Adds and edits schools, sections and student lists.
create or replace function private.can_manage()
returns boolean language sql stable security definer set search_path = '' as $$
    select coalesce(private.my_role() in ('admin', 'coordinator'), false)
$$;

-- --------------------------------------------------------------------------
-- Schools and sections
-- --------------------------------------------------------------------------
create table if not exists public.schools (
    id             uuid primary key default gen_random_uuid(),
    code           text not null unique check (code ~ '^[A-Z0-9-]{2,20}$'),
    name           text not null check (char_length(name) between 2 and 120),
    package        text not null default 'premium' check (package in ('standard', 'premium', 'advance')),
    -- Secret link for the school-management class-progress QR (built later).
    progress_token text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
    created_at     timestamptz not null default now()
);

create table if not exists public.sections (
    id              uuid primary key default gen_random_uuid(),
    school_id       uuid not null references public.schools (id) on delete cascade,
    grade           smallint not null check (grade between 4 and 8),
    letter          text not null check (letter ~ '^[A-Z]{1,3}$'),
    teacher_id      uuid references public.profiles (id) on delete set null,
    trainer_id      uuid references public.profiles (id) on delete set null,
    -- Secret link for the section's portfolio QR (built later).
    portfolio_token text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
    created_at      timestamptz not null default now(),
    unique (school_id, grade, letter)
);
create index if not exists sections_by_teacher on public.sections (teacher_id);
create index if not exists sections_by_trainer on public.sections (trainer_id);

-- A section's teacher must be a teacher account, its trainer a trainer account.
create or replace function private.check_section_staff()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
    if new.teacher_id is not null
       and (select role from public.profiles where id = new.teacher_id) is distinct from 'teacher' then
        raise exception 'The class teacher must be a teacher account.' using errcode = '23514';
    end if;
    if new.trainer_id is not null
       and (select role from public.profiles where id = new.trainer_id) is distinct from 'trainer' then
        raise exception 'The trainer must be a trainer account.' using errcode = '23514';
    end if;
    return new;
end
$$;

drop trigger if exists sections_check_staff on public.sections;
create trigger sections_check_staff
    before insert or update of teacher_id, trainer_id on public.sections
    for each row execute function private.check_section_staff();

alter table public.students add column if not exists section_id uuid references public.sections (id) on delete set null;
create index if not exists students_by_section on public.students (section_id);

-- --------------------------------------------------------------------------
-- Access helpers (private schema: not reachable through the Data API)
-- --------------------------------------------------------------------------
-- The signed-in teacher or trainer is assigned to this section.
create or replace function private.can_teach_section(sid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
    select exists (
        select 1 from public.sections s
        where s.id = sid and (s.teacher_id = (select auth.uid()) or s.trainer_id = (select auth.uid()))
    )
$$;

create or replace function private.can_see_section(sid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
    select private.is_oversight() or private.can_teach_section(sid)
$$;

-- The section of the signed-in student, or of a parent's child.
create or replace function private.my_section()
returns uuid language sql stable security definer set search_path = '' as $$
    select section_id from public.students where id = private.my_student_id()
$$;

-- Staff may see a student's records when they can see the student's section.
create or replace function private.can_see_student(sid text)
returns boolean language sql stable security definer set search_path = '' as $$
    select private.is_oversight()
        or exists (select 1 from public.students st where st.id = sid and private.can_teach_section(st.section_id))
$$;

-- Student records in app_documents now follow the student's section too.
create or replace function private.can_read_document(doc text, student_id text)
returns boolean language sql stable security definer set search_path = '' as $$
    select case private.doc_scope(doc)
        when 'class' then private.my_role() is not null
        when 'staff' then private.is_staff()
        else private.can_see_student(student_id) or student_id = private.my_student_id()
    end
$$;

-- --------------------------------------------------------------------------
-- Class records per section: class progress and the Lumora Wall
-- --------------------------------------------------------------------------
create table if not exists public.section_documents (
    doc        text not null check (doc in ('classProgress', 'lumoraWall')),
    section_id uuid not null references public.sections (id) on delete cascade,
    data       jsonb not null,
    updated_at timestamptz not null default now(),
    updated_by uuid,
    primary key (doc, section_id)
);

drop trigger if exists section_documents_touch on public.section_documents;
create trigger section_documents_touch
    before insert or update on public.section_documents
    for each row execute function private.touch_document();

-- --------------------------------------------------------------------------
-- Time: class (explore…perform), prep and scan time per person, section,
-- chapter and day (India time). Prep has no section: a trainer preps a
-- chapter once for all their sections. Written only through log_time(),
-- which adds to the day's total so two devices never overwrite each other.
-- --------------------------------------------------------------------------
create table if not exists public.time_logs (
    user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
    section_id uuid references public.sections (id) on delete cascade,
    chapter_id integer not null check (chapter_id between 1 and 24),
    stage      text not null check (stage in ('explore', 'practice', 'create', 'perform', 'prep', 'scan')),
    day        date not null,
    seconds    integer not null default 0 check (seconds >= 0),
    updated_at timestamptz not null default now()
);
create unique index if not exists time_logs_one_row on public.time_logs
    (user_id, (coalesce(section_id, '00000000-0000-0000-0000-000000000000'::uuid)), chapter_id, stage, day);

create or replace function public.log_time(p_section uuid, p_chapter integer, p_stage text, p_seconds integer)
returns void language plpgsql security invoker set search_path = '' as $$
begin
    if coalesce(p_seconds, 0) <= 0 then return; end if;
    insert into public.time_logs (user_id, section_id, chapter_id, stage, day, seconds)
    values ((select auth.uid()), p_section, p_chapter, p_stage,
            (now() at time zone 'Asia/Kolkata')::date, least(p_seconds, 4 * 3600))
    on conflict (user_id, (coalesce(section_id, '00000000-0000-0000-0000-000000000000'::uuid)), chapter_id, stage, day)
    do update set seconds = public.time_logs.seconds + excluded.seconds, updated_at = now();
end
$$;

-- --------------------------------------------------------------------------
-- Teacher Prep readiness, per person and chapter.
-- --------------------------------------------------------------------------
create table if not exists public.prep_status (
    user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
    chapter_id integer not null check (chapter_id between 1 and 24),
    data       jsonb not null,
    updated_at timestamptz not null default now(),
    primary key (user_id, chapter_id)
);

-- --------------------------------------------------------------------------
-- Stories carry the student's section (set automatically on insert), so
-- class reports and dashboards can filter by section.
-- --------------------------------------------------------------------------
alter table public.story_submissions add column if not exists section_id uuid references public.sections (id) on delete set null;
create index if not exists story_submissions_by_section on public.story_submissions (section_id, chapter_id);

create or replace function private.set_story_section()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
    new.section_id := (select section_id from public.students where id = new.student_id);
    return new;
end
$$;

drop trigger if exists story_submissions_section on public.story_submissions;
create trigger story_submissions_section
    before insert on public.story_submissions
    for each row execute function private.set_story_section();

-- --------------------------------------------------------------------------
-- Row Level Security
-- --------------------------------------------------------------------------
alter table public.schools           enable row level security;
alter table public.sections          enable row level security;
alter table public.section_documents enable row level security;
alter table public.time_logs         enable row level security;
alter table public.prep_status       enable row level security;

-- Schools: oversight sees all; teachers and trainers see the schools they work in.
drop policy if exists "Staff see their schools" on public.schools;
create policy "Staff see their schools"
    on public.schools for select to authenticated
    using (
        (select private.is_oversight())
        or exists (select 1 from public.sections s where s.school_id = schools.id and private.can_teach_section(s.id))
    );

drop policy if exists "Admin and coordinator manage schools" on public.schools;
create policy "Admin and coordinator manage schools"
    on public.schools for all to authenticated
    using ((select private.can_manage())) with check ((select private.can_manage()));

-- Sections: oversight sees all; staff see their own; students and parents see their child's.
drop policy if exists "See your sections" on public.sections;
create policy "See your sections"
    on public.sections for select to authenticated
    using (private.can_see_section(id) or id = (select private.my_section()));

drop policy if exists "Admin and coordinator manage sections" on public.sections;
create policy "Admin and coordinator manage sections"
    on public.sections for all to authenticated
    using ((select private.can_manage())) with check ((select private.can_manage()));

-- Students: replaces the "staff see the whole roster" rule.
drop policy if exists "Staff see the roster, students and parents see their own child" on public.students;
drop policy if exists "Staff see their sections' students, students and parents their own child" on public.students;
create policy "Staff see their sections' students, students and parents their own child"
    on public.students for select to authenticated
    using (private.can_see_student(id) or id = (select private.my_student_id()));

drop policy if exists "Admin and coordinator manage student lists" on public.students;
create policy "Admin and coordinator manage student lists"
    on public.students for all to authenticated
    using ((select private.can_manage())) with check ((select private.can_manage()));

-- Profiles: your own; oversight sees all; staff see staff, and the student and
-- parent accounts of their sections.
drop policy if exists "Everyone sees their own profile, staff see all" on public.profiles;
drop policy if exists "See your profile, staff, and your sections' families" on public.profiles;
create policy "See your profile, staff, and your sections' families"
    on public.profiles for select to authenticated
    using (
        id = (select auth.uid())
        or (select private.is_oversight())
        or ((select private.is_staff()) and (role not in ('student', 'parent') or private.can_see_student(student_id)))
    );

drop policy if exists "Admin and coordinator edit staff details" on public.profiles;
create policy "Admin and coordinator edit staff details"
    on public.profiles for update to authenticated
    using ((select private.can_manage())) with check ((select private.can_manage()));

-- Class records: read by anyone who can see the section (and its students and
-- parents); written by the section's teacher or trainer.
drop policy if exists "Read your section's class records" on public.section_documents;
create policy "Read your section's class records"
    on public.section_documents for select to authenticated
    using (private.can_see_section(section_id) or section_id = (select private.my_section()));

drop policy if exists "Section staff create class records" on public.section_documents;
create policy "Section staff create class records"
    on public.section_documents for insert to authenticated
    with check (private.can_teach_section(section_id));

drop policy if exists "Section staff update class records" on public.section_documents;
create policy "Section staff update class records"
    on public.section_documents for update to authenticated
    using (private.can_teach_section(section_id))
    with check (private.can_teach_section(section_id));

-- Time: your own; oversight all; section staff see each other's class time;
-- a trainer also sees their teachers' prep time (for prep readiness).
drop policy if exists "See your time and your sections' class time" on public.time_logs;
create policy "See your time and your sections' class time"
    on public.time_logs for select to authenticated
    using (
        user_id = (select auth.uid())
        or (select private.is_oversight())
        or (section_id is not null and private.can_see_section(section_id))
        or exists (select 1 from public.sections s where s.trainer_id = (select auth.uid()) and s.teacher_id = time_logs.user_id)
    );

drop policy if exists "Staff log their own time" on public.time_logs;
create policy "Staff log their own time"
    on public.time_logs for insert to authenticated
    with check (
        user_id = (select auth.uid())
        and (select private.my_role()) in ('teacher', 'trainer')
        and (section_id is null or private.can_teach_section(section_id))
    );

drop policy if exists "Staff add to their own time" on public.time_logs;
create policy "Staff add to their own time"
    on public.time_logs for update to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));

-- Prep: your own; oversight all; a trainer sees the prep of their sections' teachers.
drop policy if exists "See your prep and your teachers' prep" on public.prep_status;
create policy "See your prep and your teachers' prep"
    on public.prep_status for select to authenticated
    using (
        user_id = (select auth.uid())
        or (select private.is_oversight())
        or exists (select 1 from public.sections s where s.trainer_id = (select auth.uid()) and s.teacher_id = prep_status.user_id)
    );

drop policy if exists "Staff save their own prep" on public.prep_status;
create policy "Staff save their own prep"
    on public.prep_status for insert to authenticated
    with check (user_id = (select auth.uid()) and (select private.my_role()) in ('teacher', 'trainer'));

drop policy if exists "Staff update their own prep" on public.prep_status;
create policy "Staff update their own prep"
    on public.prep_status for update to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));

-- Stories: staff see their sections' stories; students and parents their own.
drop policy if exists "Staff see all stories, students and parents see their own" on public.story_submissions;
drop policy if exists "Staff see their sections' stories, students and parents their own" on public.story_submissions;
create policy "Staff see their sections' stories, students and parents their own"
    on public.story_submissions for select to authenticated
    using (
        (select private.is_oversight())
        or (section_id is not null and private.can_teach_section(section_id))
        or student_id = (select private.my_student_id())
    );

-- A teacher or trainer saves stories only for students in their own sections.
drop policy if exists "Staff save stories they scanned in class" on public.story_submissions;
create policy "Staff save stories they scanned in class"
    on public.story_submissions for insert to authenticated
    with check (
        (select private.is_staff())
        and source = 'teacher'
        and attempt is null
        and created_by = (select auth.uid())
        and private.can_teach_section(section_id)
    );

-- --------------------------------------------------------------------------
-- Data API access
-- --------------------------------------------------------------------------
revoke all on public.schools, public.sections, public.section_documents, public.time_logs, public.prep_status from anon, authenticated;
grant select, insert, update, delete on public.schools, public.sections to authenticated;
grant insert, update, delete on public.students to authenticated;
grant update (name, avatar, phone, contact_email) on public.profiles to authenticated;
grant select, insert, update on public.section_documents, public.prep_status to authenticated;
grant select, insert, update on public.time_logs to authenticated;
grant select on public.sections, public.students to service_role;
-- The accounts Edge Function creates profiles for new logins.
grant select, insert on public.profiles to service_role;

revoke all on function public.log_time(uuid, integer, text, integer) from public, anon;
grant execute on function public.log_time(uuid, integer, text, integer) to authenticated;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;
