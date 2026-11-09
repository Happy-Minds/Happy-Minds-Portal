-- ==========================================================================
-- Happy Minds — Phase 6: the student portal's daily time limit
-- Run once in the Supabase SQL Editor (safe to run again).
--
-- Each student gets 1 hour a day on the student portal, at any time of day
-- (Indian time decides when a new day starts). The portal reports the time
-- it was open; the database adds it up, so the count is the same on every
-- device. An admin can give one student extra time for one day.
--
-- Students cannot write this table directly: only through
-- student_time_tick(), which never adds more than the time that really
-- passed since the last report (two open tabs don't count double).
-- ==========================================================================

create table if not exists public.student_usage (
    student_id    text not null references public.students(id) on delete cascade,
    day           date not null,
    seconds       integer not null default 0 check (seconds >= 0),
    extra_minutes integer not null default 0 check (extra_minutes between 0 and 240),
    extra_by      uuid references public.profiles(id) on delete set null,
    last_tick     timestamptz,
    updated_at    timestamptz not null default now(),
    primary key (student_id, day)
);

alter table public.student_usage enable row level security;

-- The student sees their own time; staff see the students they can see.
drop policy if exists "See student time" on public.student_usage;
create policy "See student time"
    on public.student_usage for select to authenticated
    using (student_id = (select private.my_student_id()) or private.can_see_student(student_id));

-- No insert/update/delete policies: changes go through the functions below.

-- The daily allowance in seconds: 1 hour plus today's extra time.
create or replace function private.student_allowance(extra integer)
returns integer language sql immutable set search_path = '' as $$
    select 3600 + coalesce(extra, 0) * 60
$$;

-- Called by the student portal about once a minute while it is open and in
-- use (p_seconds = time since the last call), and with 0 on sign-in just to
-- read the count. Returns { used, allowed, day } in seconds.
create or replace function public.student_time_tick(p_seconds integer)
returns json language plpgsql security definer set search_path = '' as $$
declare
    sid   text := private.my_student_id();
    today date := (now() at time zone 'Asia/Kolkata')::date;
    asked integer := least(greatest(coalesce(p_seconds, 0), 0), 90);
    row   public.student_usage;
begin
    if sid is null or private.my_role() is distinct from 'student' then
        raise exception 'Only a student account has a daily time limit';
    end if;

    insert into public.student_usage as u (student_id, day, seconds, last_tick)
    values (sid, today, asked, case when asked > 0 then now() end)
    on conflict (student_id, day) do update set
        seconds = least(u.seconds + case
                when asked = 0 then 0
                when u.last_tick is null then asked
                else least(asked, greatest(0, ceil(extract(epoch from now() - u.last_tick))::integer + 5))
            end, 86400),
        last_tick = case when asked > 0 then now() else u.last_tick end,
        updated_at = now()
    returning * into row;

    return json_build_object('used', row.seconds, 'allowed', private.student_allowance(row.extra_minutes), 'day', row.day);
end
$$;

-- Admin only: set one student's extra time for today (0 removes it).
create or replace function public.grant_extra_time(p_student text, p_minutes integer)
returns json language plpgsql security definer set search_path = '' as $$
declare
    today date := (now() at time zone 'Asia/Kolkata')::date;
    row   public.student_usage;
begin
    if private.my_role() is distinct from 'admin' then
        raise exception 'Only an admin can give extra time';
    end if;
    if p_minutes is null or p_minutes < 0 or p_minutes > 240 then
        raise exception 'Extra time must be between 0 and 240 minutes';
    end if;
    if not exists (select 1 from public.students where id = p_student) then
        raise exception 'No student with that id';
    end if;

    insert into public.student_usage as u (student_id, day, extra_minutes, extra_by)
    values (p_student, today, p_minutes, auth.uid())
    on conflict (student_id, day) do update set
        extra_minutes = p_minutes, extra_by = auth.uid(), updated_at = now()
    returning * into row;

    return json_build_object('used', row.seconds, 'allowed', private.student_allowance(row.extra_minutes), 'day', row.day, 'extra', row.extra_minutes);
end
$$;

revoke all on function public.student_time_tick(integer) from public, anon;
revoke all on function public.grant_extra_time(text, integer) from public, anon;
grant execute on function public.student_time_tick(integer) to authenticated;
grant execute on function public.grant_extra_time(text, integer) to authenticated;
