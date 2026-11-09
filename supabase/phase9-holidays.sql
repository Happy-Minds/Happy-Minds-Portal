-- ==========================================================================
-- Happy Minds — holidays, sudden closures, cancelled periods, make-ups
-- Run once in the Supabase SQL Editor, after phase8-recognition.sql (safe to
-- run again).
--
--   school_holidays  planned holidays and sudden closures, for one school or
--                    for all schools (school_id null). Coordinator/management
--                    /admin add and confirm them; a trainer or class teacher
--                    at the school can report "School closed" for a day,
--                    which counts at once and waits for confirmation.
--   session_log      new status 'cancelled': the school took our period
--                    (exam, event, assembly…). Not counted against our staff.
--   extra_sessions   one-off make-up sessions for a cancelled period.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- Holidays and closures
-- --------------------------------------------------------------------------
create table if not exists public.school_holidays (
    id           uuid primary key default gen_random_uuid(),
    school_id    uuid references public.schools (id) on delete cascade,   -- null = every school
    start_date   date not null,
    end_date     date not null,
    reason       text not null check (char_length(reason) between 1 and 120),
    kind         text not null default 'holiday' check (kind in ('holiday', 'closure')),
    status       text not null default 'confirmed' check (status in ('confirmed', 'reported')),
    added_by     uuid default auth.uid() references public.profiles (id) on delete set null,
    confirmed_by uuid references public.profiles (id) on delete set null,
    created_at   timestamptz not null default now(),
    constraint school_holidays_order check (end_date >= start_date),
    constraint school_holidays_length check (end_date - start_date <= 120)
);
create index if not exists school_holidays_by_school on public.school_holidays (school_id, start_date);

-- The signed-in trainer or teacher teaches (or covers today) a class at this school.
create or replace function private.works_at_school(school uuid)
returns boolean language sql stable security definer set search_path = '' as $$
    select exists (select 1 from public.sections s where s.school_id = school and private.can_teach_section(s.id))
$$;

alter table public.school_holidays enable row level security;

drop policy if exists "Staff see holidays" on public.school_holidays;
create policy "Staff see holidays"
    on public.school_holidays for select to authenticated
    using (
        school_id is null
        or (select private.is_oversight())
        or exists (select 1 from public.sections s where s.school_id = school_holidays.school_id and private.can_see_section(s.id))
    );

drop policy if exists "Planners manage holidays" on public.school_holidays;
create policy "Planners manage holidays"
    on public.school_holidays for all to authenticated
    using ((select private.can_plan())) with check ((select private.can_plan()));

-- A trainer or class teacher reports a one-day closure at their school, for
-- today or the past week. It counts at once; a planner confirms or removes it.
drop policy if exists "Class staff report a closure" on public.school_holidays;
create policy "Class staff report a closure"
    on public.school_holidays for insert to authenticated
    with check (
        kind = 'closure' and status = 'reported' and school_id is not null
        and start_date = end_date
        and start_date <= (now() at time zone 'Asia/Kolkata')::date
        and start_date >= (now() at time zone 'Asia/Kolkata')::date - 7
        and added_by = (select auth.uid())
        and private.my_role() in ('teacher', 'trainer')
        and private.works_at_school(school_id)
    );

-- …and can take back their own report while it is still unconfirmed.
drop policy if exists "Class staff withdraw their report" on public.school_holidays;
create policy "Class staff withdraw their report"
    on public.school_holidays for delete to authenticated
    using (status = 'reported' and added_by = (select auth.uid()));

revoke all on public.school_holidays from anon, authenticated;
grant select, insert, update, delete on public.school_holidays to authenticated;

-- --------------------------------------------------------------------------
-- "Cancelled by the school" on session records
-- --------------------------------------------------------------------------
alter table public.session_log drop constraint if exists session_log_status_check;
alter table public.session_log add constraint session_log_status_check
    check (status in ('done', 'not_held', 'not_done', 'cancelled'));

-- --------------------------------------------------------------------------
-- One-off make-up sessions
-- --------------------------------------------------------------------------
create table if not exists public.extra_sessions (
    id          uuid primary key default gen_random_uuid(),
    section_id  uuid not null references public.sections (id) on delete cascade,
    session     smallint not null check (session in (1, 2)),
    on_date     date not null,
    starts_at   time not null,
    ends_at     time not null,
    for_date    date,                              -- the cancelled period it makes up
    note        text not null default '' check (char_length(note) <= 200),
    created_by  uuid default auth.uid() references public.profiles (id) on delete set null,
    created_at  timestamptz not null default now(),
    unique (section_id, session, on_date),
    constraint extra_sessions_order check (ends_at > starts_at)
);

alter table public.extra_sessions enable row level security;

drop policy if exists "See your classes' make-up sessions" on public.extra_sessions;
create policy "See your classes' make-up sessions"
    on public.extra_sessions for select to authenticated
    using (private.can_see_section(section_id));

drop policy if exists "Class staff and planners add make-up sessions" on public.extra_sessions;
create policy "Class staff and planners add make-up sessions"
    on public.extra_sessions for insert to authenticated
    with check (private.can_teach_section(section_id) or (select private.can_plan()));

drop policy if exists "Class staff and planners remove make-up sessions" on public.extra_sessions;
create policy "Class staff and planners remove make-up sessions"
    on public.extra_sessions for delete to authenticated
    using (private.can_teach_section(section_id) or (select private.can_plan()));

revoke all on public.extra_sessions from anon, authenticated;
grant select, insert, delete on public.extra_sessions to authenticated;

-- --------------------------------------------------------------------------
-- School progress page: also count periods the school cancelled
-- --------------------------------------------------------------------------
create or replace function public.school_progress(p_token text)
returns json language plpgsql stable security definer set search_path = '' as $$
declare
    s       public.schools;
    today   date := (now() at time zone 'Asia/Kolkata')::date;
    month1  date := date_trunc('month', (now() at time zone 'Asia/Kolkata'))::date;
begin
    select * into s from public.schools where progress_token = p_token and progress_on;
    if not found or coalesce(p_token, '') = '' then return null; end if;

    return json_build_object(
        'school', json_build_object('name', s.name, 'code', s.code, 'package', s.package),
        'today', today,
        'month', json_build_object(
            'start', month1,
            's1_done', (select count(*) from public.session_log l join public.sections x on x.id = l.section_id
                        where x.school_id = s.id and l.session = 1 and l.status = 'done' and l.held_on >= month1),
            's1_not_held', (select count(*) from public.session_log l join public.sections x on x.id = l.section_id
                        where x.school_id = s.id and l.session = 1 and l.status = 'not_held' and l.held_on >= month1),
            's2_done', (select count(*) from public.session_log l join public.sections x on x.id = l.section_id
                        where x.school_id = s.id and l.session = 2 and l.status = 'done' and l.held_on >= month1),
            's2_not_done', (select count(*) from public.session_log l join public.sections x on x.id = l.section_id
                        where x.school_id = s.id and l.session = 2 and l.status = 'not_done' and l.held_on >= month1),
            'cancelled', (select count(*) from public.session_log l join public.sections x on x.id = l.section_id
                        where x.school_id = s.id and l.status = 'cancelled' and l.held_on >= month1),
            'substitutes', (select count(*) from public.substitutions u where u.school_id = s.id and u.visit_date >= month1 and u.visit_date <= today)
        ),
        'sections', coalesce((
            select json_agg(json_build_object(
                'grade', x.grade,
                'letter', x.letter,
                'teacher', (select p.name from public.profiles p where p.id = x.teacher_id),
                'trainer', (select p.name from public.profiles p where p.id = x.trainer_id),
                'completed', private.completed_chapters(x.id),
                's1_done', (select count(*) from public.session_log l where l.section_id = x.id and l.session = 1 and l.status = 'done'),
                's1_not_held', (select count(*) from public.session_log l where l.section_id = x.id and l.session = 1 and l.status = 'not_held'),
                's2_done', (select count(*) from public.session_log l where l.section_id = x.id and l.session = 2 and l.status = 'done'),
                's2_not_done', (select count(*) from public.session_log l where l.section_id = x.id and l.session = 2 and l.status = 'not_done'),
                'cancelled', (select count(*) from public.session_log l where l.section_id = x.id and l.status = 'cancelled'),
                'last_session', (select max(l.held_on) from public.session_log l where l.section_id = x.id and l.status = 'done'),
                'students', (select count(*) from public.students st where st.section_id = x.id),
                'active_30d', (select count(*) from public.students st join public.app_documents d
                                 on d.doc = 'studentPortal' and d.student_id = st.id
                               where st.section_id = x.id and d.updated_at >= now() - interval '30 days'),
                'fixit_done', (select coalesce(sum(jsonb_array_length(coalesce(d.data -> 'completedFixIt', '[]'::jsonb))), 0)
                               from public.students st join public.app_documents d on d.doc = 'studentPortal' and d.student_id = st.id
                               where st.section_id = x.id),
                'stories', (select count(*) from public.story_submissions t where t.section_id = x.id),
                -- Class Star of the Month, chosen by the class teacher or trainer.
                'star', (select private.public_name(st.name) from public.students st
                         where st.id = (select d.data -> 'stars' -> to_char(today, 'YYYY-MM') ->> 'studentId'
                                        from public.section_documents d
                                        where d.doc = 'classProgress' and d.section_id = x.id))
            ) order by x.grade, x.letter)
            from public.sections x where x.school_id = s.id), '[]'::json)
    );
end
$$;

grant execute on function public.school_progress(text) to anon, authenticated;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;
