// Happy Minds — accounts
// Creates sign-in accounts from the portal. Making a login needs the
// service key, which lives only here; the portal never sees it.
//
// Every request is sent with the signed-in user's Supabase session.
//
//   action "create_staff"   (admin)
//       JSON: { action, username, name, role, phone?, email? }
//       role: teacher | trainer | coordinator | management
//       → 200 { username, password }
//
//   action "create_family"  (admin, coordinator)
//       JSON: { action, sectionId }
//       Gives every student in the class who has no login yet a student
//       login and a parent login.
//       → 200 { created: [{ studentId, name, student: {username, password}, parent: {username, password} | undefined }],
//               existing: [{ studentId, name, studentUsername, parentUsername }],
//               failed: [{ studentId, name }] }
//       A password is null for a login that already existed.
//
//   action "reset_family"   (admin, coordinator)
//       JSON: { action, sectionId, studentIds?, who? }
//       New passwords for the class's existing logins (or only the listed
//       students). who: "both" (default) | "student" | "parent".
//       → 200 { reset: [{ studentId, name, student?: {username, password|null}, parent?: {…} }],
//               failed: [{ studentId, name }] }
//       A password is null for a login that was left unchanged.
//
//   action "remove_family"  (admin)
//       JSON: { action, sectionId }
//       Deletes every student and parent login of the class. The students
//       stay in the class with all their work; new logins can be made again.
//       → 200 { removed: number }
//
// Passwords are shown once, in the reply, and stored only as a hash.
// Usernames sign in as <username>@happyminds.local; no email is sent.
//
// Errors: { error: code } with not_signed_in 401, not_allowed 403,
// bad_request 400, username_taken 409, too_many 413, not_configured 500.

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

const EMAIL_DOMAIN = 'happyminds.local';
const STAFF_ROLES_ADMIN_CREATES = ['teacher', 'trainer', 'coordinator', 'management'];
const FAMILY_MANAGERS = ['admin', 'coordinator'];
const MAX_STUDENTS_PER_REQUEST = 80;
const FAMILY_REMOVERS = ['admin'];
const STAFF_AVATAR = 'assets/teacher_avatar.png';

// Easy to read out to a child or parent: "river-mango-4827".
const PASSWORD_WORDS = ['apple', 'tiger', 'river', 'sunny', 'cloud', 'mango', 'rocket', 'garden', 'pencil', 'forest',
    'dragon', 'castle', 'bridge', 'meadow', 'planet', 'lemon', 'violet', 'eagle', 'island', 'candle', 'maple', 'ocean'];

function newPassword() {
    const r = new Uint32Array(3);
    crypto.getRandomValues(r);
    const word = (i: number) => PASSWORD_WORDS[r[i] % PASSWORD_WORDS.length];
    return `${word(0)}-${word(1)}-${String(r[2] % 10000).padStart(4, '0')}`;
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function reply(status: number, body: Record<string, unknown>) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

const fail = (status: number, error: string) => reply(status, { error });

class AccountError extends Error {
    constructor(public status: number, public code: string) {
        super(code);
    }
}

// The service-role client bypasses Row Level Security; it is only used
// after the caller's role has been checked.
function serviceClient() {
    let key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!key) {
        try { key = Object.values(JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}'))[0] as string; } catch { /* below */ }
    }
    if (!key) throw new Error('No service key available to the function');
    return createClient(Deno.env.get('SUPABASE_URL')!, key, { auth: { persistSession: false } });
}

// Creates the auth user and their profile; undoes the user if the profile fails.
async function createAccount(admin: SupabaseClient, account: {
    username: string; password: string; role: string; name: string; avatar: string;
    studentId?: string | null; phone?: string; email?: string;
}) {
    const { data, error } = await admin.auth.admin.createUser({
        email: `${account.username}@${EMAIL_DOMAIN}`,
        password: account.password,
        email_confirm: true,
    });
    if (error || !data.user) {
        if (/already|exists|registered/i.test(error?.message ?? '')) throw new AccountError(409, 'username_taken');
        throw error ?? new Error('createUser returned no user');
    }
    const { error: profileError } = await admin.from('profiles').insert({
        id: data.user.id,
        username: account.username,
        role: account.role,
        name: account.name,
        avatar: account.avatar,
        student_id: account.studentId ?? null,
        phone: account.phone ?? '',
        contact_email: account.email ?? '',
    });
    if (profileError) {
        await admin.auth.admin.deleteUser(data.user.id);
        if (profileError.code === '23505') throw new AccountError(409, 'username_taken');
        throw profileError;
    }
}

// ---- action: create_staff -------------------------------------------------
async function createStaff(admin: SupabaseClient, body: Record<string, unknown>) {
    const username = String(body.username ?? '').trim().toLowerCase();
    const name = String(body.name ?? '').trim().replace(/\s+/g, ' ');
    const role = String(body.role ?? '');
    const phone = String(body.phone ?? '').trim().slice(0, 30);
    const email = String(body.email ?? '').trim().slice(0, 120);
    if (!/^[a-z][a-z0-9._-]{2,31}$/.test(username) || name.length < 2 || name.length > 80
        || !STAFF_ROLES_ADMIN_CREATES.includes(role)) {
        return fail(400, 'bad_request');
    }
    const password = newPassword();
    await createAccount(admin, { username, password, role, name, avatar: STAFF_AVATAR, phone, email });
    return reply(200, { username, password });
}

// ---- action: create_family ------------------------------------------------
// Student usernames are the student's id ("hm-001-4a-07"); the parent's is
// the same with "-p" ("hm-001-4a-07-p").
async function createFamily(admin: SupabaseClient, body: Record<string, unknown>) {
    const sectionId = String(body.sectionId ?? '');
    if (!/^[0-9a-f-]{36}$/i.test(sectionId)) return fail(400, 'bad_request');

    const { data: students, error } = await admin.from('students')
        .select('id, name, avatar').eq('section_id', sectionId).order('name');
    if (error) throw error;
    if (!students.length) return reply(200, { created: [], existing: [] });

    const { data: profiles, error: profilesError } = await admin.from('profiles')
        .select('username, role, student_id').in('student_id', students.map(s => s.id));
    if (profilesError) throw profilesError;

    const created = [];
    const existing = [];
    const todo = [];
    for (const st of students) {
        const own = profiles.filter(p => p.student_id === st.id);
        const studentLogin = own.find(p => p.role === 'student');
        const parentLogin = own.find(p => p.role === 'parent');
        if (studentLogin && parentLogin) {
            existing.push({ studentId: st.id, name: st.name, studentUsername: studentLogin.username, parentUsername: parentLogin.username });
        } else {
            todo.push({ st, studentLogin, parentLogin });
        }
    }
    if (todo.length > MAX_STUDENTS_PER_REQUEST) return fail(413, 'too_many');

    // One child's problem doesn't stop the rest: the passwords already made
    // must reach the reply, or they would be lost.
    const failed = [];
    for (const { st, studentLogin, parentLogin } of todo) {
        const entry: Record<string, unknown> = { studentId: st.id, name: st.name };
        try {
            if (studentLogin) {
                entry.student = { username: studentLogin.username, password: null };
            } else {
                const password = newPassword();
                await createAccount(admin, { username: st.id, password, role: 'student', name: st.name, avatar: st.avatar, studentId: st.id });
                entry.student = { username: st.id, password };
            }
            if (parentLogin) {
                entry.parent = { username: parentLogin.username, password: null };
            } else {
                const password = newPassword();
                await createAccount(admin, { username: `${st.id}-p`, password, role: 'parent', name: `${st.name}'s Parent`, avatar: STAFF_AVATAR, studentId: st.id });
                entry.parent = { username: `${st.id}-p`, password };
            }
            created.push(entry);
        } catch (err) {
            console.error('Could not create logins for', st.id, err);
            // The student login may have been made before the parent's failed.
            if (entry.student) created.push(entry);
            else failed.push({ studentId: st.id, name: st.name });
        }
    }
    return reply(200, { created, existing, failed });
}

// The class's students (optionally only some) and their existing logins.
async function familyOf(admin: SupabaseClient, sectionId: string, studentIds?: unknown) {
    let query = admin.from('students').select('id, name').eq('section_id', sectionId).order('name');
    if (Array.isArray(studentIds)) query = query.in('id', studentIds.map(String).slice(0, MAX_STUDENTS_PER_REQUEST));
    const { data: students, error } = await query;
    if (error) throw error;
    if (!students.length) return { students: [], profiles: [] };
    const { data: profiles, error: profilesError } = await admin.from('profiles')
        .select('id, username, role, student_id').in('student_id', students.map(s => s.id)).in('role', ['student', 'parent']);
    if (profilesError) throw profilesError;
    return { students, profiles };
}

// ---- action: reset_family -------------------------------------------------
async function resetFamily(admin: SupabaseClient, body: Record<string, unknown>) {
    const sectionId = String(body.sectionId ?? '');
    const who = String(body.who ?? 'both');
    if (!/^[0-9a-f-]{36}$/i.test(sectionId) || !['both', 'student', 'parent'].includes(who)) return fail(400, 'bad_request');
    const { students, profiles } = await familyOf(admin, sectionId, body.studentIds);
    if (students.length > MAX_STUDENTS_PER_REQUEST) return fail(413, 'too_many');

    const reset = [];
    const failed = [];
    for (const st of students) {
        const own = profiles.filter(p => p.student_id === st.id);
        if (!own.length) continue;   // no logins yet: "Create logins" makes them
        const entry: Record<string, unknown> = { studentId: st.id, name: st.name };
        try {
            for (const role of ['student', 'parent']) {
                const login = own.find(p => p.role === role);
                if (!login) continue;
                if (who !== 'both' && who !== role) {
                    entry[role] = { username: login.username, password: null };
                    continue;
                }
                const password = newPassword();
                const { error } = await admin.auth.admin.updateUserById(login.id, { password });
                if (error) throw error;
                entry[role] = { username: login.username, password };
            }
            reset.push(entry);
        } catch (err) {
            console.error('Could not reset logins for', st.id, err);
            // A password already changed must still reach the reply.
            if (entry.student || entry.parent) reset.push(entry);
            else failed.push({ studentId: st.id, name: st.name });
        }
    }
    return reply(200, { reset, failed });
}

// ---- action: remove_family ------------------------------------------------
async function removeFamily(admin: SupabaseClient, body: Record<string, unknown>) {
    const sectionId = String(body.sectionId ?? '');
    if (!/^[0-9a-f-]{36}$/i.test(sectionId)) return fail(400, 'bad_request');
    const { profiles } = await familyOf(admin, sectionId);
    let removed = 0;
    for (const login of profiles) {
        // Deleting the sign-in also deletes its profile; the student's work stays.
        const { error } = await admin.auth.admin.deleteUser(login.id);
        if (error) console.error('Could not remove login', login.username, error);
        else removed += 1;
    }
    return reply(200, { removed, failed: profiles.length - removed });
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (req.method !== 'POST') return fail(405, 'bad_request');

    // Who is asking? Read their profile with their own session, so Row
    // Level Security applies exactly as it does in the portal.
    const authorization = req.headers.get('Authorization');
    const projectKey = req.headers.get('apikey') ?? Deno.env.get('SUPABASE_ANON_KEY');
    if (!authorization || !projectKey) return fail(401, 'not_signed_in');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, projectKey, {
        global: { headers: { Authorization: authorization } },
        auth: { persistSession: false },
    });
    const { data: { user } } = await supabase.auth.getUser(authorization.replace(/^Bearer\s+/i, ''));
    if (!user) return fail(401, 'not_signed_in');
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (!profile) return fail(403, 'not_allowed');

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return fail(400, 'bad_request');

    try {
        const admin = serviceClient();
        if (body.action === 'create_staff') {
            return profile.role === 'admin' ? await createStaff(admin, body) : fail(403, 'not_allowed');
        }
        if (body.action === 'create_family') {
            return FAMILY_MANAGERS.includes(profile.role) ? await createFamily(admin, body) : fail(403, 'not_allowed');
        }
        if (body.action === 'reset_family') {
            return FAMILY_MANAGERS.includes(profile.role) ? await resetFamily(admin, body) : fail(403, 'not_allowed');
        }
        if (body.action === 'remove_family') {
            return FAMILY_REMOVERS.includes(profile.role) ? await removeFamily(admin, body) : fail(403, 'not_allowed');
        }
        return fail(400, 'bad_request');
    } catch (err) {
        if (err instanceof AccountError) return fail(err.status, err.code);
        console.error('accounts function error', err);
        return fail(500, 'not_configured');
    }
});
