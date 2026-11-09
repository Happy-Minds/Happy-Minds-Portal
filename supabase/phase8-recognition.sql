-- ==========================================================================
-- Happy Minds — student recognition on the school progress page
-- Run once in the Supabase SQL Editor, after phase7-qr-pages.sql (safe to
-- run again). Adds each class's Class Star of the Month (first name and
-- initial) to the school-management progress page. The public book
-- portfolio is unchanged: it never shows star names.
-- ==========================================================================

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
