-- ==========================================================================
-- Happy Minds — database schema
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run: every statement replaces or skips what already exists.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- Tables
-- --------------------------------------------------------------------------

-- Class roster. Students and parents link to a row here.
create table if not exists public.students (
    id     text primary key,
    name   text not null,
    grade  text not null default '',
    avatar text not null default ''
);

-- One row per sign-in account (Supabase Auth user). Role decides what the
-- account can see; students and parents carry the student they belong to.
create table if not exists public.profiles (
    id         uuid primary key references auth.users (id) on delete cascade,
    username   text not null unique,
    role       text not null check (role in ('teacher', 'trainer', 'admin', 'student', 'parent')),
    name       text not null,
    avatar     text not null default '',
    student_id text references public.students (id),
    constraint profiles_student_link check ((role in ('student', 'parent')) = (student_id is not null))
);

-- Everything the portal saves, one JSON document per record. student_id is
-- '' for class-wide and staff documents, and the student's id for
-- student-owned documents.
create table if not exists public.app_documents (
    doc        text not null,
    student_id text not null default '',
    data       jsonb not null,
    updated_at timestamptz not null default now(),
    updated_by uuid,
    primary key (doc, student_id),
    constraint app_documents_known_doc check (doc in (
        'classProgress', 'lumoraWall',                                      -- class
        'timeTracking', 'prepStatus', 'reflections', 'observations',       -- staff
        'studentPortal', 'chapter1Practice'                                 -- student
    )),
    constraint app_documents_student_link check (
        (doc in ('studentPortal', 'chapter1Practice')) = (student_id <> '')
    )
);

-- --------------------------------------------------------------------------
-- Helper functions (private schema: not reachable through the Data API)
-- --------------------------------------------------------------------------
create schema if not exists private;

create or replace function private.my_role()
returns text language sql stable security definer set search_path = '' as $$
    select role from public.profiles where id = auth.uid()
$$;

create or replace function private.my_student_id()
returns text language sql stable security definer set search_path = '' as $$
    select student_id from public.profiles where id = auth.uid()
$$;

create or replace function private.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
    select coalesce(private.my_role() in ('teacher', 'trainer', 'admin'), false)
$$;

-- class   = readable by every signed-in account, written by staff
-- staff   = teacher / trainer / admin only
-- student = the student themselves, their parent, and staff
create or replace function private.doc_scope(doc text)
returns text language sql immutable set search_path = '' as $$
    select case
        when doc in ('classProgress', 'lumoraWall') then 'class'
        when doc in ('studentPortal', 'chapter1Practice') then 'student'
        else 'staff'
    end
$$;

create or replace function private.can_read_document(doc text, student_id text)
returns boolean language sql stable security definer set search_path = '' as $$
    select case private.doc_scope(doc)
        when 'class' then private.my_role() is not null
        when 'staff' then private.is_staff()
        else private.is_staff() or student_id = private.my_student_id()
    end
$$;

-- Only students write their own student documents; staff write the rest.
create or replace function private.can_write_document(doc text, student_id text)
returns boolean language sql stable security definer set search_path = '' as $$
    select case private.doc_scope(doc)
        when 'student' then private.my_role() = 'student' and student_id = private.my_student_id()
        else private.is_staff()
    end
$$;

create or replace function private.touch_document()
returns trigger language plpgsql set search_path = '' as $$
begin
    new.updated_at := now();
    new.updated_by := auth.uid();
    return new;
end
$$;

drop trigger if exists app_documents_touch on public.app_documents;
create trigger app_documents_touch
    before insert or update on public.app_documents
    for each row execute function private.touch_document();

-- --------------------------------------------------------------------------
-- Row Level Security
-- --------------------------------------------------------------------------
alter table public.students      enable row level security;
alter table public.profiles      enable row level security;
alter table public.app_documents enable row level security;

drop policy if exists "Staff see the roster, students and parents see their own child" on public.students;
create policy "Staff see the roster, students and parents see their own child"
    on public.students for select to authenticated
    using ((select private.is_staff()) or id = (select private.my_student_id()));

drop policy if exists "Everyone sees their own profile, staff see all" on public.profiles;
create policy "Everyone sees their own profile, staff see all"
    on public.profiles for select to authenticated
    using (id = (select auth.uid()) or (select private.is_staff()));

drop policy if exists "Read documents allowed for this role" on public.app_documents;
create policy "Read documents allowed for this role"
    on public.app_documents for select to authenticated
    using (private.can_read_document(doc, student_id));

drop policy if exists "Create documents allowed for this role" on public.app_documents;
create policy "Create documents allowed for this role"
    on public.app_documents for insert to authenticated
    with check (private.can_write_document(doc, student_id));

drop policy if exists "Update documents allowed for this role" on public.app_documents;
create policy "Update documents allowed for this role"
    on public.app_documents for update to authenticated
    using (private.can_write_document(doc, student_id))
    with check (private.can_write_document(doc, student_id));

-- --------------------------------------------------------------------------
-- Admin password reset. Accounts have no real email, so a forgotten password
-- is reset by an admin from the portal. Signs the person out everywhere else
-- so the old password stops working on devices already signed in.
-- --------------------------------------------------------------------------
create or replace function public.admin_reset_password(target_username text, new_password text)
returns void language plpgsql security definer set search_path = '' as $$
declare
    v_uid uuid;
begin
    if private.my_role() is distinct from 'admin' then
        raise exception 'Only an admin can reset passwords.' using errcode = '42501';
    end if;
    if length(coalesce(new_password, '')) < 8 then
        raise exception 'The new password must be at least 8 characters.' using errcode = '22023';
    end if;

    select id into v_uid from public.profiles where username = target_username;
    if v_uid is null then
        raise exception 'No account with that username.' using errcode = 'P0002';
    end if;

    update auth.users
        set encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
            updated_at = now()
        where id = v_uid;

    -- An admin resetting their own password stays signed in here.
    if v_uid is distinct from auth.uid() then
        delete from auth.refresh_tokens where user_id = v_uid::text;
        delete from auth.sessions where user_id = v_uid;
    end if;
end
$$;

revoke all on function public.admin_reset_password(text, text) from public, anon;
grant execute on function public.admin_reset_password(text, text) to authenticated;

-- --------------------------------------------------------------------------
-- Data API access. New tables are not exposed automatically in this project,
-- so grant exactly what the portal needs. Signed-out visitors get nothing.
-- --------------------------------------------------------------------------
revoke all on public.students, public.profiles, public.app_documents from anon, authenticated;
grant select on public.students, public.profiles to authenticated;
grant select, insert, update on public.app_documents to authenticated;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;
