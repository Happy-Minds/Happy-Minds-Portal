-- ==========================================================================
-- Happy Minds — Phase 11: the principals' portal and student awards
-- Run once in the Supabase SQL Editor, after phase10-package-history.sql
-- (safe to run again).
--
-- One QR code, printed in every book, opens principal.html. The Principal
-- (or Chairman / Correspondent) types the school code and the school's PIN
-- and sees two tabs: the school's progress, and its portfolio with awards,
-- Class Stars of the Month and top performers.
--
--   * Each school has one 6-digit PIN. Only an admin makes it (it is shown
--     once and stored scrambled); a new PIN signs everyone out.
--   * 5 wrong tries lock that school code for 15 minutes.
--   * A sign-in lasts 12 hours on that device.
--   * student_awards: awards our team gives during visits and events.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- The school PIN (staff can't read these columns: see phase7's column grants)
-- --------------------------------------------------------------------------
alter table public.schools add column if not exists principal_pin text;          -- bcrypt hash
alter table public.schools add column if not exists principal_pin_set_at timestamptz;

create table if not exists private.principal_attempts (
    code         text primary key,
    failures     integer not null default 0,
    locked_until timestamptz
);

create table if not exists private.principal_sessions (
    token      text primary key,
    school_id  uuid not null references public.schools (id) on delete cascade,
    expires_at timestamptz not null,
    created_at timestamptz not null default now()
);
create index if not exists principal_sessions_by_school on private.principal_sessions (school_id);

-- Nobody reads these directly: no policies, so only the functions below
-- (which run as the table owner) can use them.
alter table private.principal_attempts enable row level security;
alter table private.principal_sessions enable row level security;
revoke all on private.principal_attempts, private.principal_sessions from public, anon, authenticated;

-- Admin: a new PIN for a school. Returns the PIN (shown once); signs out
-- everyone who used the old one.
create or replace function public.new_principal_pin(p_school uuid)
returns text language plpgsql volatile security definer set search_path = '' as $$
declare pin text;
begin
    if private.my_role() is distinct from 'admin' then
        raise exception 'Only an admin can make a principal PIN';
    end if;
    if not exists (select 1 from public.schools where id = p_school) then
        raise exception 'No such school';
    end if;
    pin := lpad(((('x' || encode(extensions.gen_random_bytes(3), 'hex'))::bit(24)::int) % 1000000)::text, 6, '0');
    update public.schools
        set principal_pin = extensions.crypt(pin, extensions.gen_salt('bf')), principal_pin_set_at = now()
        where id = p_school;
    delete from private.principal_sessions where school_id = p_school;
    return pin;
end
$$;

-- Admin: when the school's PIN was made (null = no PIN yet).
create or replace function public.principal_pin_set_at(p_school uuid)
returns timestamptz language plpgsql stable security definer set search_path = '' as $$
begin
    if private.my_role() is distinct from 'admin' then
        raise exception 'Only an admin can see this';
    end if;
    return (select principal_pin_set_at from public.schools where id = p_school);
end
$$;

-- --------------------------------------------------------------------------
-- Student awards
-- --------------------------------------------------------------------------
create table if not exists public.student_awards (
    id         uuid primary key default gen_random_uuid(),
    student_id text not null references public.students (id) on delete cascade,
    section_id uuid references public.sections (id) on delete set null,
    title      text not null check (char_length(title) between 2 and 80),
    event      text not null default '' check (char_length(event) <= 80),
    award_date date not null,
    note       text not null default '' check (char_length(note) <= 300),
    given_by   uuid default auth.uid() references public.profiles (id) on delete set null,
    created_at timestamptz not null default now()
);
create index if not exists student_awards_by_section on public.student_awards (section_id, award_date);

alter table public.student_awards enable row level security;

drop policy if exists "See awards" on public.student_awards;
create policy "See awards"
    on public.student_awards for select to authenticated
    using (private.can_see_student(student_id) or student_id = (select private.my_student_id()));

-- Our team (trainers, coordinators, management, admin) gives awards to
-- students they can see.
drop policy if exists "Happy Minds team gives awards" on public.student_awards;
create policy "Happy Minds team gives awards"
    on public.student_awards for insert to authenticated
    with check (
        given_by = (select auth.uid())
        and private.my_role() in ('trainer', 'coordinator', 'management', 'admin')
        and private.can_see_student(student_id)
    );

drop policy if exists "Remove an award" on public.student_awards;
create policy "Remove an award"
    on public.student_awards for delete to authenticated
    using (given_by = (select auth.uid()) or (select private.can_manage()));

revoke all on public.student_awards from anon, authenticated;
grant select, insert, delete on public.student_awards to authenticated;

-- --------------------------------------------------------------------------
-- What the principal sees (shared with the older link pages)
-- --------------------------------------------------------------------------
create or replace function private.school_progress_json(p_school uuid)
returns json language plpgsql stable security definer set search_path = '' as $$
declare
    s       public.schools;
    today   date := (now() at time zone 'Asia/Kolkata')::date;
    month1  date := date_trunc('month', (now() at time zone 'Asia/Kolkata'))::date;
begin
    select * into s from public.schools where id = p_school;
    if not found then return null; end if;

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

create or replace function private.school_portfolio_json(p_school uuid)
returns json language plpgsql stable security definer set search_path = '' as $$
declare s public.schools;
begin
    select * into s from public.schools where id = p_school;
    if not found then return null; end if;

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

-- The older link pages keep working through the shared functions.
create or replace function public.school_progress(p_token text)
returns json language plpgsql stable security definer set search_path = '' as $$
declare sid uuid;
begin
    if coalesce(p_token, '') = '' then return null; end if;
    select id into sid from public.schools where progress_token = p_token and progress_on;
    return case when sid is null then null else private.school_progress_json(sid) end;
end
$$;

create or replace function public.school_portfolio(p_token text)
returns json language plpgsql stable security definer set search_path = '' as $$
declare sid uuid;
begin
    if coalesce(p_token, '') = '' then return null; end if;
    select id into sid from public.schools where portfolio_token = p_token and portfolio_on;
    return case when sid is null then null else private.school_portfolio_json(sid) end;
end
$$;

-- Awards, Class Stars of the Month and this month's top performers.
create or replace function private.school_recognition_json(p_school uuid)
returns json language plpgsql stable security definer set search_path = '' as $$
declare
    mk text := to_char((now() at time zone 'Asia/Kolkata'), 'YYYY-MM');
begin
    return json_build_object(
        'month', mk,
        'awards', coalesce((
            select json_agg(json_build_object(
                'title', a.title, 'event', a.event, 'date', a.award_date, 'note', a.note,
                'name', st.name, 'class', x.grade::text || x.letter,
                'by', (select p.name from public.profiles p where p.id = a.given_by)
            ) order by a.award_date desc, a.created_at desc)
            from (select a.* from public.student_awards a
                  join public.students st on st.id = a.student_id
                  join public.sections x on x.id = st.section_id
                  where x.school_id = p_school
                  order by a.award_date desc, a.created_at desc limit 300) a
            join public.students st on st.id = a.student_id
            join public.sections x on x.id = st.section_id), '[]'::json),
        -- Every Class Star of the Month chosen so far, newest month first.
        'stars', coalesce((
            select json_agg(json_build_object('month', e.key, 'class', x.grade::text || x.letter, 'name', st.name)
                            order by e.key desc, x.grade, x.letter)
            from public.sections x
            join public.section_documents d on d.doc = 'classProgress' and d.section_id = x.id
            cross join lateral jsonb_each(coalesce(d.data -> 'stars', '{}'::jsonb)) e
            join public.students st on st.id = e.value ->> 'studentId'
            where x.school_id = p_school), '[]'::json),
        -- This month's top 3 per class from their own work: Fix It boxes,
        -- practice sets, stories and days active (as in the portal).
        'top', coalesce((
            with kids as (
                select st.id, st.name, x.id as section_id, x.grade, x.letter
                from public.students st join public.sections x on x.id = st.section_id
                where x.school_id = p_school
            ), hist as (
                select k.id, h.value as e
                from kids k
                join public.app_documents d on d.doc = 'studentPortal' and d.student_id = k.id
                cross join lateral jsonb_array_elements(coalesce(d.data -> 'history', '[]'::jsonb)) h
                where (h.value ->> 'date') ~ '^\d{4}-\d{2}-\d{2}T'
                  and to_char(((h.value ->> 'date')::timestamptz at time zone 'Asia/Kolkata'), 'YYYY-MM') = mk
            ), work as (
                select id,
                       count(*) filter (where e ->> 'icon' = '🛠') as fixit,
                       count(*) filter (where e ->> 'icon' = '🧩') as practice,
                       count(distinct ((e ->> 'date')::timestamptz at time zone 'Asia/Kolkata')::date) as days
                from hist group by id
            ), wrote as (
                select t.student_id as id, count(*) as stories
                from public.story_submissions t join kids k on k.id = t.student_id
                where to_char((t.created_at at time zone 'Asia/Kolkata'), 'YYYY-MM') = mk
                group by t.student_id
            ), scored as (
                select k.*, coalesce(w.fixit, 0) as fixit, coalesce(w.practice, 0) as practice,
                       coalesce(r.stories, 0) as stories, coalesce(w.days, 0) as days,
                       coalesce(w.fixit, 0) * 2 + coalesce(w.practice, 0) * 3 + coalesce(r.stories, 0) * 3 + coalesce(w.days, 0) as score
                from kids k left join work w on w.id = k.id left join wrote r on r.id = k.id
            ), ranked as (
                select *, row_number() over (partition by section_id order by score desc, name) as rn
                from scored where score > 0
            )
            select json_agg(json_build_object('class', grade::text || letter, 'name', name, 'rank', rn,
                                              'fixit', fixit, 'practice', practice, 'stories', stories, 'days', days)
                            order by grade, letter, rn)
            from ranked where rn <= 3), '[]'::json)
    );
end
$$;

-- --------------------------------------------------------------------------
-- Principal sign-in (no account: school code + PIN → a 12-hour session)
-- --------------------------------------------------------------------------
create or replace function public.principal_sign_in(p_code text, p_pin text)
returns json language plpgsql volatile security definer set search_path = '' as $$
declare
    v_code text := upper(btrim(coalesce(p_code, '')));
    tries private.principal_attempts;
    s     public.schools;
    tok   text;
begin
    if v_code = '' or coalesce(p_pin, '') !~ '^\d{6}$' then
        return json_build_object('error', 'wrong');
    end if;
    select * into tries from private.principal_attempts where principal_attempts.code = v_code;
    if found and tries.locked_until > now() then
        return json_build_object('error', 'locked', 'until', tries.locked_until);
    end if;

    select * into s from public.schools
        where upper(schools.code) = v_code and principal_pin is not null
          and principal_pin = extensions.crypt(p_pin, principal_pin);
    if not found then
        insert into private.principal_attempts as a (code, failures) values (v_code, 1)
        on conflict on constraint principal_attempts_pkey do update set
            failures = case when a.locked_until is not null and a.locked_until <= now() then 1 else a.failures + 1 end,
            locked_until = case when (case when a.locked_until is not null and a.locked_until <= now() then 1 else a.failures + 1 end) >= 5
                                then now() + interval '15 minutes' else null end;
        select * into tries from private.principal_attempts where principal_attempts.code = v_code;
        if tries.locked_until > now() then
            update private.principal_attempts set failures = 0 where principal_attempts.code = v_code;
            return json_build_object('error', 'locked', 'until', tries.locked_until);
        end if;
        return json_build_object('error', 'wrong', 'left', 5 - tries.failures);
    end if;

    delete from private.principal_attempts where principal_attempts.code = v_code;
    delete from private.principal_sessions where expires_at < now();
    tok := encode(extensions.gen_random_bytes(24), 'hex');
    insert into private.principal_sessions (token, school_id, expires_at) values (tok, s.id, now() + interval '12 hours');
    return json_build_object('token', tok, 'school', s.name, 'expires', now() + interval '12 hours');
end
$$;

-- Everything the principal's two tabs show, or null when the session ended.
create or replace function public.principal_dashboard(p_token text)
returns json language plpgsql stable security definer set search_path = '' as $$
declare sid uuid;
begin
    select school_id into sid from private.principal_sessions where token = p_token and expires_at > now();
    if sid is null then return null; end if;
    return json_build_object(
        'progress', private.school_progress_json(sid),
        'portfolio', private.school_portfolio_json(sid),
        'recognition', private.school_recognition_json(sid)
    );
end
$$;

create or replace function public.principal_sign_out(p_token text)
returns void language sql volatile security definer set search_path = '' as $$
    delete from private.principal_sessions where token = p_token
$$;

revoke all on function public.new_principal_pin(uuid), public.principal_pin_set_at(uuid),
    public.principal_sign_in(text, text), public.principal_dashboard(text), public.principal_sign_out(text) from public;
grant execute on function public.new_principal_pin(uuid), public.principal_pin_set_at(uuid) to authenticated;
grant execute on function public.principal_sign_in(text, text), public.principal_dashboard(text), public.principal_sign_out(text) to anon, authenticated;
grant execute on function public.school_progress(text), public.school_portfolio(text) to anon, authenticated;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;
