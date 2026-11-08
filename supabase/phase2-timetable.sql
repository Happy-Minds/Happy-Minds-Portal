-- ==========================================================================
-- Happy Minds — Phase 2: timetable and substitutes
-- Run AFTER phase1-schools-sections.sql, in Dashboard → SQL Editor.
-- Safe to re-run.
--
--   section_slots  — each class's fixed weekly slots from the school
--                    timetable: Session 1 (trainer's visit) and Session 2
--                    (class teacher's period). Entered once per year.
--   substitutions  — a substitute trainer for one visit (a school, a date
--                    and the regular trainer), with who assigned it and when.
--
-- Admin, coordinator and management plan these (private.can_plan).
-- Everyone who can see a class sees its slots. A substitute can see the
-- classes of the visits they cover (from the day before until 30 days
-- ahead) so they appear in their "My week".
--
-- It only adds. Sunrise Model School gets the programme's sample timetable.
-- ==========================================================================

create or replace function private.can_plan()
returns boolean language sql stable security definer set search_path = '' as $$
    select coalesce(private.my_role() in ('admin', 'coordinator', 'management'), false)
$$;

-- --------------------------------------------------------------------------
-- Weekly slots. weekday: 1 = Monday … 6 = Saturday.
-- --------------------------------------------------------------------------
create table if not exists public.section_slots (
    section_id uuid not null references public.sections (id) on delete cascade,
    session    smallint not null check (session in (1, 2)),
    weekday    smallint not null check (weekday between 1 and 6),
    starts_at  time not null,
    ends_at    time not null,
    updated_at timestamptz not null default now(),
    updated_by uuid default auth.uid(),
    primary key (section_id, session),
    constraint section_slots_order check (ends_at > starts_at)
);

-- --------------------------------------------------------------------------
-- Substitutes: one per school, date and regular trainer.
-- --------------------------------------------------------------------------
create table if not exists public.substitutions (
    id            uuid primary key default gen_random_uuid(),
    school_id     uuid not null references public.schools (id) on delete cascade,
    visit_date    date not null,
    trainer_id    uuid not null references public.profiles (id) on delete cascade,
    substitute_id uuid not null references public.profiles (id) on delete cascade,
    note          text not null default '' check (char_length(note) <= 300),
    assigned_by   uuid default auth.uid() references public.profiles (id) on delete set null,
    assigned_at   timestamptz not null default now(),
    unique (school_id, visit_date, trainer_id),
    constraint substitutions_different check (substitute_id <> trainer_id)
);
create index if not exists substitutions_by_substitute on public.substitutions (substitute_id, visit_date);

-- Both people must be trainer accounts.
create or replace function private.check_substitution()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
    if (select role from public.profiles where id = new.trainer_id) is distinct from 'trainer'
       or (select role from public.profiles where id = new.substitute_id) is distinct from 'trainer' then
        raise exception 'Both the regular trainer and the substitute must be trainer accounts.' using errcode = '23514';
    end if;
    new.assigned_by := (select auth.uid());
    new.assigned_at := now();
    return new;
end
$$;

drop trigger if exists substitutions_check on public.substitutions;
create trigger substitutions_check
    before insert or update on public.substitutions
    for each row execute function private.check_substitution();

-- A substitute sees the classes of the visits they cover, from the day
-- before until 30 days ahead.
create or replace function private.covers_section(sid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
    select exists (
        select 1
        from public.substitutions su
        join public.sections s on s.school_id = su.school_id and s.trainer_id = su.trainer_id
        where s.id = sid
          and su.substitute_id = (select auth.uid())
          and su.visit_date between ((now() at time zone 'Asia/Kolkata')::date - 1)
                                and ((now() at time zone 'Asia/Kolkata')::date + 30)
    )
$$;

create or replace function private.can_see_section(sid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
    select private.is_oversight() or private.can_teach_section(sid) or private.covers_section(sid)
$$;

-- --------------------------------------------------------------------------
-- Row Level Security
-- --------------------------------------------------------------------------
alter table public.section_slots enable row level security;
alter table public.substitutions enable row level security;

drop policy if exists "See your classes' timetable" on public.section_slots;
create policy "See your classes' timetable"
    on public.section_slots for select to authenticated
    using (private.can_see_section(section_id));

drop policy if exists "Planners set the timetable" on public.section_slots;
create policy "Planners set the timetable"
    on public.section_slots for all to authenticated
    using ((select private.can_plan())) with check ((select private.can_plan()));

drop policy if exists "See substitutions you plan, cover or are covered for" on public.substitutions;
create policy "See substitutions you plan, cover or are covered for"
    on public.substitutions for select to authenticated
    using (
        (select private.is_oversight())
        or trainer_id = (select auth.uid())
        or substitute_id = (select auth.uid())
    );

drop policy if exists "Planners assign substitutes" on public.substitutions;
create policy "Planners assign substitutes"
    on public.substitutions for all to authenticated
    using ((select private.can_plan())) with check ((select private.can_plan()));

-- Schools: also the schools a substitute is covering a visit at.
drop policy if exists "Staff see their schools" on public.schools;
create policy "Staff see their schools"
    on public.schools for select to authenticated
    using (
        (select private.is_oversight())
        or exists (select 1 from public.sections s where s.school_id = schools.id and private.can_see_section(s.id))
    );

revoke all on public.section_slots, public.substitutions from anon, authenticated;
grant select, insert, update, delete on public.section_slots, public.substitutions to authenticated;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

-- --------------------------------------------------------------------------
-- Sample timetable for Sunrise Model School (from the programme's sample
-- setup): trainer visit on Wednesday, class teachers' periods Thu–Sat.
-- --------------------------------------------------------------------------
insert into public.section_slots (section_id, session, weekday, starts_at, ends_at)
select s.id, t.session, t.weekday, t.starts_at::time, t.ends_at::time
from public.sections s
join public.schools sc on sc.id = s.school_id and sc.code = 'HM-001'
join (values
    (4, 'A', 1, 3, '10:00', '10:40'), (4, 'A', 2, 5, '11:00', '11:40'),
    (4, 'B', 1, 3, '10:40', '11:20'), (4, 'B', 2, 5, '11:40', '12:20'),
    (5, 'A', 1, 3, '11:30', '12:10'), (5, 'A', 2, 4, '14:00', '14:40'),
    (5, 'B', 1, 3, '12:10', '12:50'), (5, 'B', 2, 4, '14:40', '15:20'),
    (6, 'A', 1, 3, '13:30', '14:10'), (6, 'A', 2, 5, '13:30', '14:10'),
    (7, 'A', 1, 3, '14:10', '14:50'), (7, 'A', 2, 6, '10:00', '10:40'),
    (8, 'A', 1, 3, '14:50', '15:30'), (8, 'A', 2, 6, '10:40', '11:20')
) as t (grade, letter, session, weekday, starts_at, ends_at)
  on t.grade = s.grade and t.letter = s.letter
on conflict (section_id, session) do nothing;
