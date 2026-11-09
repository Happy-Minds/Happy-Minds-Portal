-- ==========================================================================
-- Happy Minds — Phase 5: monthly observations are private to management
-- Run AFTER phase3-visit-day.sql, in Dashboard → SQL Editor. Safe to re-run.
--
-- Classroom observations are done by the HappyMinds management team, and
-- only admin and management may read or write them. Until now every staff
-- account could read the observations record. Everything else is unchanged.
-- ==========================================================================

create or replace function private.can_read_document(doc text, student_id text)
returns boolean language sql stable security definer set search_path = '' as $$
    select case
        when doc = 'observations' then coalesce(private.my_role() in ('admin', 'management'), false)
        else case private.doc_scope(doc)
            when 'class' then private.my_role() is not null
            when 'staff' then private.is_staff()
            else private.can_see_student(student_id) or student_id = private.my_student_id()
        end
    end
$$;

create or replace function private.can_write_document(doc text, student_id text)
returns boolean language sql stable security definer set search_path = '' as $$
    select case
        when doc = 'observations' then coalesce(private.my_role() in ('admin', 'management'), false)
        else case private.doc_scope(doc)
            when 'student' then private.my_role() = 'student' and student_id = private.my_student_id()
            else private.is_staff()
        end
    end
$$;
