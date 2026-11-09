-- ==========================================================================
-- Happy Minds — Phase 7: the two QR pages
-- Run once in the Supabase SQL Editor (safe to run again).
--
-- 1. School progress page (progress.html?k=...): one secret link per school
--    for its Principal / Chairman / Correspondent. No login. Facts per class.
-- 2. School portfolio page (portfolio.html?k=...): one link per school,
--    printed as a QR in that school's books. Public. Totals, chapters
--    covered, and only the stories staff ticked "Show in portfolio"
--    (first name + initial, no photos). No star-performer names.
--
-- Both pages read through one function each, which returns only what the
-- page shows. The tables themselves stay closed to visitors. Admin can turn
-- each link off or replace it with a new one (old QR codes stop working).
-- ==========================================================================

-- --------------------------------------------------------------------------
-- Links on each school
-- --------------------------------------------------------------------------
alter table public.schools add column if not exists portfolio_token text unique default encode(extensions.gen_random_bytes(18), 'hex');
update public.schools set portfolio_token = encode(extensions.gen_random_bytes(18), 'hex') where portfolio_token is null;
alter table public.schools alter column portfolio_token set not null;
alter table public.schools add column if not exists progress_on boolean not null default true;
alter table public.schools add column if not exists portfolio_on boolean not null default true;

-- Staff can still read a school's name, code and package, but not its secret
-- links: only an admin gets those, through school_links() below.
-- NOTE: phase1-schools-sections.sql grants full read access again, so if it
-- is ever re-run, run this file again afterwards.
revoke select on public.schools from anon, authenticated;
grant select (id, code, name, package, created_at) on public.schools to authenticated;

create or replace function public.school_links(p_school uuid)
returns json language plpgsql stable security definer set search_path = '' as $$
declare s public.schools;
begin
    if private.my_role() is distinct from 'admin' then
        raise exception 'Only an admin can see the QR links';
    end if;
    select * into s from public.schools where id = p_school;
    if not found then raise exception 'No such school'; end if;
    return json_build_object('progress_token', s.progress_token, 'progress_on', s.progress_on,
                             'portfolio_token', s.portfolio_token, 'portfolio_on', s.portfolio_on);
end
$$;

-- p_kind 'progress' or 'portfolio'; p_action 'on', 'off' or 'new' (a new
-- secret link: the old QR code stops working).
create or replace function public.change_school_link(p_school uuid, p_kind text, p_action text)
returns json language plpgsql security definer set search_path = '' as $$
begin
    if private.my_role() is distinct from 'admin' then
        raise exception 'Only an admin can change the QR links';
    end if;
    if p_kind not in ('progress', 'portfolio') or p_action not in ('on', 'off', 'new') then
        raise exception 'Unknown link change';
    end if;
    if p_kind = 'progress' then
        update public.schools set
            progress_on = case p_action when 'on' then true when 'off' then false else progress_on end,
            progress_token = case when p_action = 'new' then encode(extensions.gen_random_bytes(18), 'hex') else progress_token end
        where id = p_school;
    else
        update public.schools set
            portfolio_on = case p_action when 'on' then true when 'off' then false else portfolio_on end,
            portfolio_token = case when p_action = 'new' then encode(extensions.gen_random_bytes(18), 'hex') else portfolio_token end
        where id = p_school;
    end if;
    return public.school_links(p_school);
end
$$;

-- --------------------------------------------------------------------------
-- "Show in portfolio" on stories
-- --------------------------------------------------------------------------
alter table public.story_submissions add column if not exists showcase boolean not null default false;
alter table public.story_submissions add column if not exists showcase_by uuid references public.profiles (id) on delete set null;
alter table public.story_submissions add column if not exists showcase_at timestamptz;

-- Teachers, trainers, coordinators and admins who can see the student.
create or replace function public.set_story_showcase(p_story uuid, p_on boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare sid text;
begin
    select student_id into sid from public.story_submissions where id = p_story;
    if sid is null then raise exception 'No such story'; end if;
    if private.my_role() not in ('teacher', 'trainer', 'coordinator', 'admin') or not private.can_see_student(sid) then
        raise exception 'Only staff who teach this student can choose portfolio stories';
    end if;
    update public.story_submissions
        set showcase = coalesce(p_on, false),
            showcase_by = case when p_on then auth.uid() end,
            showcase_at = case when p_on then now() end
        where id = p_story;
end
$$;

-- --------------------------------------------------------------------------
-- Helpers for the pages
-- --------------------------------------------------------------------------
-- "Aanya Krishnan" -> "Aanya K."; "Aadhya L." stays "Aadhya L."; "Arjun" stays "Arjun".
create or replace function private.public_name(full_name text)
returns text language sql immutable set search_path = '' as $$
    select case
        when split_part(btrim(full_name), ' ', 2) = '' then split_part(btrim(full_name), ' ', 1)
        else split_part(btrim(full_name), ' ', 1) || ' ' || upper(left(split_part(btrim(full_name), ' ', 2), 1)) || '.'
    end
$$;

create or replace function private.completed_chapters(section uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
    select coalesce((select d.data -> 'completedChapters' from public.section_documents d
                     where d.doc = 'classProgress' and d.section_id = section), '[]'::jsonb)
$$;

-- --------------------------------------------------------------------------
-- 1. School progress page (school management, secret link)
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
                'last_session', (select max(l.held_on) from public.session_log l where l.section_id = x.id and l.status = 'done'),
                'students', (select count(*) from public.students st where st.section_id = x.id),
                'active_30d', (select count(*) from public.students st join public.app_documents d
                                 on d.doc = 'studentPortal' and d.student_id = st.id
                               where st.section_id = x.id and d.updated_at >= now() - interval '30 days'),
                'fixit_done', (select coalesce(sum(jsonb_array_length(coalesce(d.data -> 'completedFixIt', '[]'::jsonb))), 0)
                               from public.students st join public.app_documents d on d.doc = 'studentPortal' and d.student_id = st.id
                               where st.section_id = x.id),
                'stories', (select count(*) from public.story_submissions t where t.section_id = x.id)
            ) order by x.grade, x.letter)
            from public.sections x where x.school_id = s.id), '[]'::json)
    );
end
$$;

-- --------------------------------------------------------------------------
-- 2. School portfolio page (printed in the book, public)
-- --------------------------------------------------------------------------
create or replace function public.school_portfolio(p_token text)
returns json language plpgsql stable security definer set search_path = '' as $$
declare s public.schools;
begin
    select * into s from public.schools where portfolio_token = p_token and portfolio_on;
    if not found or coalesce(p_token, '') = '' then return null; end if;

    return json_build_object(
        'school', json_build_object('name', s.name),
        'classes', (select count(*) from public.sections x where x.school_id = s.id),
        'students', (select count(*) from public.students st join public.sections x on x.id = st.section_id where x.school_id = s.id),
        -- Chapters at least one class has finished.
        'chapters', coalesce((select jsonb_agg(distinct c.value::int order by c.value::int)
                              from public.sections x, jsonb_array_elements_text(private.completed_chapters(x.id)) c
                              where x.school_id = s.id), '[]'::jsonb),
        'sessions', (select count(*) from public.session_log l join public.sections x on x.id = l.section_id
                     where x.school_id = s.id and l.status = 'done'),
        'stories', (select count(*) from public.story_submissions t join public.sections x on x.id = t.section_id where x.school_id = s.id),
        'fixit_done', (select coalesce(sum(jsonb_array_length(coalesce(d.data -> 'completedFixIt', '[]'::jsonb))), 0)
                       from public.students st join public.sections x on x.id = st.section_id
                       join public.app_documents d on d.doc = 'studentPortal' and d.student_id = st.id
                       where x.school_id = s.id),
        'practice_done', (select coalesce(sum(jsonb_array_length(coalesce(d.data -> 'completedPractice', '[]'::jsonb))), 0)
                       from public.students st join public.sections x on x.id = st.section_id
                       join public.app_documents d on d.doc = 'studentPortal' and d.student_id = st.id
                       where x.school_id = s.id),
        -- The 60 most recently chosen stories.
        'showcase', coalesce((
            select json_agg(json_build_object(
                'name', w.name, 'class', w.class, 'chapter', w.chapter,
                'text', w.text, 'praise', w.praise, 'date', w.date
            ) order by w.showcase_at desc)
            from (
                select private.public_name(st.name) as name, x.grade::text || x.letter as class,
                       t.chapter_id as chapter, t.story_text as text, t.feedback ->> 'praise' as praise,
                       (t.created_at at time zone 'Asia/Kolkata')::date as date, t.showcase_at
                from public.story_submissions t
                join public.students st on st.id = t.student_id
                join public.sections x on x.id = t.section_id
                where t.showcase and x.school_id = s.id
                order by t.showcase_at desc
                limit 60
            ) w), '[]'::json)
    );
end
$$;

revoke all on function public.school_links(uuid), public.change_school_link(uuid, text, text),
    public.set_story_showcase(uuid, boolean), public.school_progress(text), public.school_portfolio(text) from public;
grant execute on function public.school_links(uuid), public.change_school_link(uuid, text, text),
    public.set_story_showcase(uuid, boolean) to authenticated;
-- The two pages work without a login.
grant execute on function public.school_progress(text), public.school_portfolio(text) to anon, authenticated;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;
