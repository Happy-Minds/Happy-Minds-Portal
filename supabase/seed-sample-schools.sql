-- ==========================================================================
-- Happy Minds — sample schools for development and demos
-- Run AFTER phase1-schools-sections.sql and seed-accounts.sql, in
-- Dashboard → SQL Editor. Safe to re-run.
--
-- Every school, teacher and student name here is made up (dummy data from
-- the programme's sample setup): 10 schools, 70 sections (Std 4–8), about
-- 2,450 students. Sample students have no logins.
--
-- Sunrise Model School (HM-001, Premium) is the main demo school:
--   teacher1 is the class teacher of 4A and 4B, trainer1 trains all its sections,
--   and the class used so far (Arjun, Aanya, Kabir, Meera, its progress,
--   Lumora Wall, stories, class time and prep) moves into Sunrise 4A.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- Schools
-- --------------------------------------------------------------------------
insert into public.schools (code, name, package) values
    ('HM-001', 'Sunrise Model School',              'premium'),
    ('HM-002', 'Green Valley Public School',        'premium'),
    ('HM-003', 'St. Mary''s Matriculation School',  'standard'),
    ('HM-004', 'Lotus International School',        'advance'),
    ('HM-005', 'Bharathi Vidyalaya',                'standard'),
    ('HM-006', 'Riverside Academy',                 'premium'),
    ('HM-007', 'Little Flower Convent School',      'standard'),
    ('HM-008', 'Kalam Memorial School',             'premium'),
    ('HM-009', 'Hilltop Senior Secondary School',   'advance'),
    ('HM-010', 'Vivekananda Vidya Mandir',          'standard')
on conflict (code) do update set name = excluded.name, package = excluded.package;

-- --------------------------------------------------------------------------
-- Sections: 7 per school (70 in all)
-- --------------------------------------------------------------------------
insert into public.sections (school_id, grade, letter)
select sc.id, s.grade, s.letter
from public.schools sc
cross join lateral (values
    -- Sunrise follows the programme's sample timetable; the others vary.
    (case when sc.code = 'HM-001' then 'sunrise' else 'other' end)
) as kind(k)
cross join lateral (
    select * from (values
        ('sunrise', 4, 'A'), ('sunrise', 4, 'B'), ('sunrise', 5, 'A'), ('sunrise', 5, 'B'),
        ('sunrise', 6, 'A'), ('sunrise', 7, 'A'), ('sunrise', 8, 'A'),
        ('other',   4, 'A'), ('other',   4, 'B'), ('other',   5, 'A'), ('other',   6, 'A'),
        ('other',   6, 'B'), ('other',   7, 'A'), ('other',   8, 'A')
    ) as t (k, grade, letter)
    where t.k = kind.k
) as s
where sc.code like 'HM-0%'
on conflict (school_id, grade, letter) do nothing;

-- --------------------------------------------------------------------------
-- Sample students: 33–38 per section, made-up names, no logins.
-- Ids look like "hm-002-5a-07".
-- --------------------------------------------------------------------------
with names as (
    select array[
        'Aadhya','Anika','Diya','Kavya','Meghna','Nila','Priya','Riya','Saanvi','Tara',
        'Ishita','Lakshmi','Nandini','Pooja','Shreya','Yamini','Divya','Harini','Janani','Keerthi',
        'Aarav','Arun','Dev','Ganesh','Hari','Karthik','Mohan','Nikhil','Pranav','Rahul',
        'Rohan','Sanjay','Surya','Varun','Vikram','Yash','Faiz','Mohammed','Joel','Ashwin'
    ] as first,
    array['A','B','C','D','G','J','K','L','M','N','P','R','S','T','V'] as initial
),
target as (
    select se.id as section_id, sc.code, se.grade, se.letter,
           33 + ((hashtext(sc.code || se.grade || se.letter) & 2147483647) % 6) as how_many
    from public.sections se join public.schools sc on sc.id = se.school_id
),
rows as (
    select t.section_id, t.grade,
           lower(t.code) || '-' || t.grade || lower(t.letter) || '-' || lpad(n::text, 2, '0') as id,
           (hashtext(t.code || t.grade || t.letter || n) & 2147483647) as h
    from target t cross join generate_series(1, t.how_many) as n
)
insert into public.students (id, name, grade, avatar, section_id)
select r.id,
       names.first[1 + r.h % 40] || ' ' || names.initial[1 + (r.h / 40) % 15] || '.',
       'Grade ' || r.grade,
       case when (r.h % 40) < 20 then 'assets/girl_aanya.png' else 'assets/boy_arjun.png' end,
       r.section_id
from rows r, names
on conflict (id) do nothing;

-- --------------------------------------------------------------------------
-- Sunrise Model School: staff and the existing class
-- --------------------------------------------------------------------------
do $$
declare
    v_school  uuid := (select id from public.schools where code = 'HM-001');
    v_4a      uuid := (select id from public.sections where school_id = v_school and grade = 4 and letter = 'A');
    v_teacher uuid := (select id from public.profiles where username = 'teacher1');
    v_trainer uuid := (select id from public.profiles where username = 'trainer1');
    v_doc     record;
    v_ch      record;
    v_stage   record;
begin
    -- teacher1 teaches 4A and 4B; trainer1 trains every Sunrise section.
    update public.sections set teacher_id = v_teacher
        where school_id = v_school and grade = 4 and letter in ('A', 'B');
    update public.sections set trainer_id = v_trainer where school_id = v_school;

    -- The class used so far becomes Sunrise 4A.
    update public.students set section_id = v_4a, grade = 'Grade 4'
        where id in ('arjun', 'aanya', 'kabir', 'meera');

    -- Its class progress and Lumora Wall.
    insert into public.section_documents (doc, section_id, data)
    select doc, v_4a, data from public.app_documents
    where doc in ('classProgress', 'lumoraWall') and student_id = ''
    on conflict (doc, section_id) do nothing;

    -- Its stories.
    update public.story_submissions set section_id = v_4a
        where section_id is null and student_id in ('arjun', 'aanya', 'kabir', 'meera');

    -- Class time so far was all teacher1's. It had no dates, so it is filed
    -- on the day it was last saved. Prep has no section.
    if v_teacher is not null and not exists (select 1 from public.time_logs where user_id = v_teacher) then
        for v_doc in select data, updated_at from public.app_documents where doc = 'timeTracking' and student_id = '' loop
            for v_ch in select key, value from jsonb_each(v_doc.data) where key ~ '^[0-9]+$' and key::int between 1 and 24 loop
                for v_stage in select key, value from jsonb_each(v_ch.value)
                        where key in ('explore', 'practice', 'create', 'perform', 'prep', 'scan')
                          and jsonb_typeof(value) = 'number' and (value)::numeric >= 1 loop
                    insert into public.time_logs (user_id, section_id, chapter_id, stage, day, seconds)
                    values (v_teacher, case when v_stage.key = 'prep' then null else v_4a end,
                            v_ch.key::int, v_stage.key, (v_doc.updated_at at time zone 'Asia/Kolkata')::date,
                            round((v_stage.value)::numeric)::int);
                end loop;
            end loop;
        end loop;
    end if;

    -- Teacher Prep readiness so far was teacher1's.
    if v_teacher is not null then
        insert into public.prep_status (user_id, chapter_id, data)
        select v_teacher, key::int, value
        from public.app_documents, jsonb_each(data)
        where doc = 'prepStatus' and student_id = '' and key ~ '^[0-9]+$' and key::int between 1 and 24
        on conflict (user_id, chapter_id) do nothing;
    end if;

    -- Sunrise 4A has 35 students in the sample: the 4 real ones and 31 made-up ones.
    delete from public.students
        where section_id = v_4a and id like 'hm-001-4a-%'
          and id > 'hm-001-4a-31'
          and not exists (select 1 from public.profiles p where p.student_id = students.id);
end
$$;
