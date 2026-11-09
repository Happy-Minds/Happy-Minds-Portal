-- ==========================================================================
-- Happy Minds — package history
-- Run once in the Supabase SQL Editor (safe to run again).
--
-- A school's package decides who takes each session (Standard: the class
-- teacher both; Premium: trainer Session 1, teacher Session 2; Advance: our
-- trainer both). When the package changes, it applies from that day on:
-- sessions before it keep the package they had. This table remembers each
-- change; a trigger fills it whenever schools.package changes, so the
-- portal only ever updates schools.package as before.
-- ==========================================================================

create table if not exists public.school_package_history (
    id         uuid primary key default gen_random_uuid(),
    school_id  uuid not null references public.schools (id) on delete cascade,
    package    text not null check (package in ('standard', 'premium', 'advance')),
    from_date  date not null,
    changed_by uuid references public.profiles (id) on delete set null,
    changed_at timestamptz not null default now()
);
create index if not exists school_package_history_by_school on public.school_package_history (school_id, from_date);

-- Every existing school starts with its current package "since always".
insert into public.school_package_history (school_id, package, from_date)
select s.id, s.package, date '2000-01-01'
from public.schools s
where not exists (select 1 from public.school_package_history h where h.school_id = s.id);

create or replace function private.record_package_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare today date := (now() at time zone 'Asia/Kolkata')::date;
begin
    if tg_op = 'INSERT' then
        insert into public.school_package_history (school_id, package, from_date, changed_by)
        values (new.id, new.package, date '2000-01-01', auth.uid());
    elsif new.package is distinct from old.package then
        -- Changed twice on the same day: the last choice counts for that day.
        delete from public.school_package_history where school_id = new.id and from_date = today;
        insert into public.school_package_history (school_id, package, from_date, changed_by)
        values (new.id, new.package, today, auth.uid());
    end if;
    return new;
end
$$;

drop trigger if exists schools_package_history on public.schools;
create trigger schools_package_history
    after insert or update of package on public.schools
    for each row execute function private.record_package_change();

alter table public.school_package_history enable row level security;

-- Readable by anyone who can see the school; written only by the trigger.
drop policy if exists "See your schools' package history" on public.school_package_history;
create policy "See your schools' package history"
    on public.school_package_history for select to authenticated
    using (
        (select private.is_oversight())
        or exists (select 1 from public.sections s where s.school_id = school_package_history.school_id and private.can_see_section(s.id))
    );

revoke all on public.school_package_history from anon, authenticated;
grant select on public.school_package_history to authenticated;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;
