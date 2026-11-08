/* ==========================================================================
   Happy Minds — Supabase connection (cloud.js)
   Sign-in, the class roster and every saved record live in Supabase, so
   teacher, student and parent devices all see the same data.

   Pages call HMCloud.restoreSession() / signIn() once; that loads the
   signed-in account, the roster (into HappyMindsConfig.ACCOUNTS/STUDENTS)
   and every document this account may read. After that, get() is
   synchronous and save() writes back in the background, so the rest of the
   app reads and writes saved data the same way it always has.
   Which account can read or write which document is enforced by Row Level
   Security in supabase/schema.sql, not here.
   ========================================================================== */

const HMCloud = (() => {
    const SAVE_DELAY_MS = 600;
    const RETRY_DELAY_MS = 5000;

    // Only used for the final save while the page is closing, so the request
    // survives the unload. Off the rest of the time: keepalive bodies are
    // capped at 64 KB.
    let keepaliveFetch = false;

    const client = supabase.createClient(HappyMindsConfig.SUPABASE_URL, HappyMindsConfig.SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, storageKey: 'happyMindsSession' },
        global: { fetch: (url, options) => fetch(url, keepaliveFetch ? { ...options, keepalive: true } : options) }
    });

    // Saved records come in three kinds:
    //   app_documents      "doc|studentId"  — student records (and older class-wide staff records)
    //   section_documents  "doc|sectionId"  — class progress and the Lumora Wall, one per section
    //   prep_status        one row per chapter for the signed-in person (the 'prepStatus' record)
    const SECTION_DOCS = new Set(['classProgress', 'lumoraWall']);
    const PREP_DOC = 'prepStatus';

    const docs = new Map();         // "doc|studentId" -> data
    const sectionDocs = new Map();  // "doc|sectionId" -> data
    const prepByUser = new Map();   // userId -> { chapterId: data }
    let timeRows = [];              // time_logs rows this account may see
    const unsaved = new Set();      // "a|doc|studentId", "s|doc|sectionId" or "p|chapterId"
    const pendingTime = [];         // log_time calls not yet sent
    let saveTimer = null;
    let saving = null;
    let failing = false;
    const statusListeners = [];

    let signedInUserId = null;
    let currentSectionId = null;

    const keyOf = (doc, studentId) => `${doc}|${studentId || ''}`;
    const clone = value => (value == null ? null : JSON.parse(JSON.stringify(value)));

    // PostgREST returns at most 1000 rows per request; a whole programme has
    // a few thousand students, so read in pages.
    const PAGE_SIZE = 1000;
    async function selectAll(table, columns, orderBy) {
        const rows = [];
        for (let from = 0; ; from += PAGE_SIZE) {
            const { data, error } = await client.from(table).select(columns).order(orderBy).range(from, from + PAGE_SIZE - 1);
            if (error) throw error;
            rows.push(...data);
            if (data.length < PAGE_SIZE) return rows;
        }
    }

    // HappyMindsConfig.STUDENTS is the chosen section's class; every visible
    // student stays in ALL_STUDENTS (e.g. for names in reports).
    function applySectionRoster() {
        const roster = HappyMindsConfig.ALL_STUDENTS.filter(s => s.section_id === currentSectionId);
        HappyMindsConfig.STUDENTS.splice(0, Infinity, ...roster);
    }

    const todayInIndia = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    // Sections with their label ("4A") and school, sorted school → grade → letter.
    function setSections(rows) {
        HappyMindsConfig.SECTIONS = rows
            .map(s => ({
                id: s.id, school_id: s.school_id, grade: s.grade, letter: s.letter,
                teacher_id: s.teacher_id, trainer_id: s.trainer_id,
                label: `${s.grade}${s.letter}`,
                school: HappyMindsConfig.SCHOOLS.find(sc => sc.id === s.school_id) || null
            }))
            .sort((a, b) => (a.school?.name || '').localeCompare(b.school?.name || '') || a.grade - b.grade || a.letter.localeCompare(b.letter));
    }

    // A change to schools, classes or student lists that the person can act on.
    function manageError(error) {
        console.warn('Happy Minds: change not saved', error);
        const message = String(error?.message || '');
        let friendly = "Couldn't save the change. Please try again.";
        if (error?.code === '23505') {
            friendly = /schools_code/.test(message) ? 'A school with that code already exists.'
                : /sections_school_id_grade_letter/.test(message) ? 'That class already exists in this school.'
                : 'That already exists.';
        } else if (error?.code === '23514' && /teacher|trainer/i.test(message)) {
            friendly = message;
        } else if (error?.code === '42501' || /row-level security/i.test(message)) {
            friendly = 'Only an admin or coordinator can make this change.';
        } else if (/failed to fetch|network/i.test(message)) {
            friendly = "Couldn't reach Happy Minds. Check the internet connection and try again.";
        }
        return new Error(friendly);
    }

    async function manage(request) {
        const { data, error } = await request;
        if (error) throw manageError(error);
        return data;
    }

    const SECTION_COLUMNS = 'id, school_id, grade, letter, teacher_id, trainer_id';

    // Supabase Auth signs in with an email, the portal with a username.
    const emailFor = username => `${username.trim().toLowerCase()}@${HappyMindsConfig.AUTH_EMAIL_DOMAIN}`;

    function toAccount(row) {
        return { id: row.id, username: row.username, role: row.role, name: row.name, avatar: row.avatar, studentId: row.student_id };
    }

    function notify(status) {
        statusListeners.forEach(fn => { try { fn(status); } catch (err) { console.error(err); } });
    }

    // A failure the person signing in can act on, never a raw API error.
    function friendlyError(err) {
        const message = String((err && err.message) || '');
        if (/invalid login credentials/i.test(message)) return 'Incorrect username or password.';
        if (/failed to fetch|network|load failed/i.test(message)) return "Couldn't reach Happy Minds. Check your internet connection and try again.";
        return 'Something went wrong while signing in. Please try again.';
    }

    async function loadAccountData(userId) {
        const { data: me, error: meError } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
        if (meError) throw meError;
        if (!me) {
            await client.auth.signOut();
            const err = new Error("This account hasn't been set up yet. Ask your Happy Minds admin for help.");
            err.userFacing = true;
            throw err;
        }

        // RLS limits each of these to what this account may see: admin,
        // coordinator and management get every school; teachers and trainers
        // their own sections; students and parents their own child.
        const [profiles, students, documents, schools, sections, classDocs, time, prep] = await Promise.all([
            selectAll('profiles', '*', 'username'),
            selectAll('students', '*', 'name'),
            selectAll('app_documents', 'doc, student_id, data', 'doc'),
            selectAll('schools', 'id, code, name, package', 'name'),
            selectAll('sections', 'id, school_id, grade, letter, teacher_id, trainer_id', 'grade'),
            selectAll('section_documents', 'doc, section_id, data', 'doc'),
            selectAll('time_logs', 'user_id, section_id, chapter_id, stage, day, seconds', 'day'),
            selectAll('prep_status', 'user_id, chapter_id, data', 'chapter_id')
        ]);

        HappyMindsConfig.ACCOUNTS.splice(0, Infinity, ...profiles.map(toAccount));
        HappyMindsConfig.ALL_STUDENTS = students;
        HappyMindsConfig.SCHOOLS = schools;
        setSections(sections);

        docs.clear();
        sectionDocs.clear();
        prepByUser.clear();
        unsaved.clear();
        pendingTime.length = 0;
        documents.forEach(row => docs.set(keyOf(row.doc, row.student_id), row.data));
        classDocs.forEach(row => sectionDocs.set(keyOf(row.doc, row.section_id), row.data));
        prep.forEach(row => {
            if (!prepByUser.has(row.user_id)) prepByUser.set(row.user_id, {});
            prepByUser.get(row.user_id)[row.chapter_id] = row.data;
        });
        timeRows = time;

        signedInUserId = userId;
        // Students and parents always see their own child's section; staff
        // choose one (see HMCloud.setSection).
        const child = me.student_id ? students.find(s => s.id === me.student_id) : null;
        currentSectionId = child ? child.section_id : null;
        applySectionRoster();
        return toAccount(me);
    }

    async function writeUnsaved() {
        clearTimeout(saveTimer);
        saveTimer = null;
        if (saving) await saving;
        if (!unsaved.size && !pendingTime.length) return;

        const keys = [...unsaved];
        unsaved.clear();
        const times = pendingTime.splice(0, Infinity);
        const appRows = [], classRows = [], prepRows = [];
        keys.forEach(key => {
            const [kind, a, b] = key.split('|');
            if (kind === 'a') appRows.push({ doc: a, student_id: b, data: docs.get(keyOf(a, b)) });
            else if (kind === 's') classRows.push({ doc: a, section_id: b, data: sectionDocs.get(keyOf(a, b)) });
            else prepRows.push({ user_id: signedInUserId, chapter_id: Number(a), data: prepByUser.get(signedInUserId)[a] });
        });

        saving = Promise.all([
            appRows.length ? client.from('app_documents').upsert(appRows, { onConflict: 'doc,student_id' }) : { error: null },
            classRows.length ? client.from('section_documents').upsert(classRows, { onConflict: 'doc,section_id' }) : { error: null },
            prepRows.length ? client.from('prep_status').upsert(prepRows, { onConflict: 'user_id,chapter_id' }) : { error: null },
            ...times.map(t => client.rpc('log_time', { p_section: t.sectionId, p_chapter: t.chapterId, p_stage: t.stage, p_seconds: t.seconds }))
        ]);
        const results = await saving;
        saving = null;
        const error = results.map(r => r.error).find(Boolean);

        if (error) {
            // Keep the changes and try again; anything saved meanwhile rides
            // along. Time entries that failed are sent again; the rest are
            // already added on the server.
            keys.forEach(key => unsaved.add(key));
            results.slice(3).forEach((r, i) => { if (r.error) pendingTime.push(times[i]); });
            console.warn('Happy Minds: save failed, retrying', error);
            if (!failing) { failing = true; notify('error'); }
            saveTimer = setTimeout(writeUnsaved, RETRY_DELAY_MS);
            return;
        }
        if (failing) { failing = false; notify('recovered'); }
    }

    const hasUnsaved = () => unsaved.size > 0 || pendingTime.length > 0;
    const scheduleSave = () => { if (!saveTimer && !failing) saveTimer = setTimeout(writeUnsaved, SAVE_DELAY_MS); };

    function flushOnClose() {
        if (!hasUnsaved()) return;
        keepaliveFetch = true;
        writeUnsaved().finally(() => { keepaliveFetch = false; });
    }
    window.addEventListener('pagehide', flushOnClose);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flushOnClose();
    });
    window.addEventListener('online', () => { if (hasUnsaved()) writeUnsaved(); });

    // ---- Student stories --------------------------------------------------
    class StoryError extends Error {
        constructor(code) {
            super(`Story request failed: ${code}`);
            this.code = code;
        }
    }

    // Phone photos are often 4000px+ and several MB. Handwriting reads fine
    // at ~1600px on the long side, and a small JPEG uploads faster on school
    // Wi-Fi and costs less to read.
    const PHOTO_MAX_SIDE = 1568;
    const PHOTO_BUCKET = 'story-photos';

    function shrinkPhoto(imageSrc) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(img.naturalWidth * scale);
                canvas.height = Math.round(img.naturalHeight * scale);
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#fff'; // transparent PNGs would otherwise turn black
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(blob => blob ? resolve(blob) : reject(new StoryError('failed')), 'image/jpeg', 0.85);
            };
            img.onerror = () => reject(new StoryError('unreadable'));
            img.src = imageSrc;
        });
    }

    // What the feedback needs to know about the chapter (from chapters-data.js).
    function storyChapter(chapter) {
        return {
            id: chapter.id,
            title: chapter.title,
            task: chapter.create?.challenge || '',
            target: chapter.create?.target || '',
            grammarFocus: chapter.reflection?.grammarFocus || ''
        };
    }

    async function callStories(body, contentType) {
        const { data } = await client.auth.getSession();
        const headers = { apikey: HappyMindsConfig.SUPABASE_PUBLISHABLE_KEY };
        if (data.session) headers.Authorization = `Bearer ${data.session.access_token}`;
        if (contentType) headers['Content-Type'] = contentType;

        let res;
        try {
            res = await fetch(HappyMindsConfig.STORIES_ENDPOINT, { method: 'POST', headers, body });
        } catch (err) {
            throw new StoryError('offline');
        }
        const result = await res.json().catch(() => ({}));
        if (res.ok) return result;
        console.warn('Happy Minds: stories request failed', res.status, result.error);
        const known = ['unreadable', 'limit_reached', 'busy'];
        throw new StoryError(known.includes(result.error) ? result.error : 'failed');
    }

    return {
        // Signed-in account from an earlier visit, or null.
        async restoreSession() {
            const { data } = await client.auth.getSession();
            if (!data.session) return null;
            try {
                return await loadAccountData(data.session.user.id);
            } catch (err) {
                console.warn('Happy Minds: could not restore session', err);
                return null;
            }
        },

        // Resolves to the account, or throws an Error with a message that is
        // safe to show on the login screen.
        async signIn(username, password) {
            const { data, error } = await client.auth.signInWithPassword({ email: emailFor(username), password });
            if (error) throw new Error(friendlyError(error));
            try {
                return await loadAccountData(data.user.id);
            } catch (err) {
                throw err.userFacing ? err : new Error(friendlyError(err));
            }
        },

        // Writes anything unsaved first, so nothing is lost on logout.
        async signOut() {
            try { await writeUnsaved(); } catch (err) { /* signing out anyway */ }
            await client.removeAllChannels();
            signedInUserId = null;
            await client.auth.signOut();
            docs.clear();
            sectionDocs.clear();
            prepByUser.clear();
            timeRows = [];
            unsaved.clear();
            pendingTime.length = 0;
            currentSectionId = null;
            HappyMindsConfig.ACCOUNTS.length = 0;
            HappyMindsConfig.STUDENTS.length = 0;
            HappyMindsConfig.ALL_STUDENTS = [];
            HappyMindsConfig.SCHOOLS = [];
            HappyMindsConfig.SECTIONS = [];
        },

        // A copy of the saved document, or null if nothing is saved yet.
        // Class progress and the Lumora Wall are the chosen section's; the
        // 'prepStatus' record is the signed-in person's own prep.
        get(doc, studentId) {
            if (SECTION_DOCS.has(doc)) return currentSectionId ? clone(sectionDocs.get(keyOf(doc, currentSectionId))) : null;
            if (doc === PREP_DOC) return clone(prepByUser.get(signedInUserId) || {});
            return clone(docs.get(keyOf(doc, studentId)));
        },

        // Saves the document. Several quick saves are combined into one write.
        save(doc, data, studentId) {
            if (SECTION_DOCS.has(doc)) {
                if (!currentSectionId) return;
                sectionDocs.set(keyOf(doc, currentSectionId), clone(data));
                unsaved.add(`s|${doc}|${currentSectionId}`);
            } else if (doc === PREP_DOC) {
                // Only the chapters that changed are written.
                const before = prepByUser.get(signedInUserId) || {};
                const after = clone(data) || {};
                Object.keys(after).forEach(ch => {
                    if (JSON.stringify(after[ch]) !== JSON.stringify(before[ch])) unsaved.add(`p|${ch}`);
                });
                prepByUser.set(signedInUserId, after);
            } else {
                docs.set(keyOf(doc, studentId), clone(data));
                unsaved.add(`a|${doc}|${studentId || ''}`);
            }
            scheduleSave();
        },

        // ---- Schools and sections --------------------------------------
        // The section the portal is showing (class progress, Lumora Wall and
        // HappyMindsConfig.STUDENTS all follow it).
        getSection() {
            return currentSectionId;
        },

        setSection(sectionId) {
            currentSectionId = HappyMindsConfig.SECTIONS.some(s => s.id === sectionId) ? sectionId : null;
            applySectionRoster();
            return currentSectionId;
        },

        // ---- Managing schools, classes and student lists -------------------
        // Admin and coordinator only (enforced by the database). Each throws
        // an Error whose message is safe to show, and updates
        // HappyMindsConfig.SCHOOLS / SECTIONS / ALL_STUDENTS when it succeeds.
        async createSchool({ name, code, pkg }) {
            const row = await manage(client.from('schools').insert({ name, code, package: pkg }).select('id, code, name, package').single());
            HappyMindsConfig.SCHOOLS.push(row);
            HappyMindsConfig.SCHOOLS.sort((a, b) => a.name.localeCompare(b.name));
            return row;
        },

        async updateSchool(id, fields) {
            const row = await manage(client.from('schools').update(fields).eq('id', id).select('id, code, name, package').single());
            Object.assign(HappyMindsConfig.SCHOOLS.find(s => s.id === id), row);
            return row;
        },

        async createSection(schoolId, grade, letter) {
            const row = await manage(client.from('sections').insert({ school_id: schoolId, grade, letter }).select(SECTION_COLUMNS).single());
            setSections([...HappyMindsConfig.SECTIONS, row]);
            return row;
        },

        // fields: any of teacher_id, trainer_id, letter.
        async updateSection(id, fields) {
            const row = await manage(client.from('sections').update(fields).eq('id', id).select(SECTION_COLUMNS).single());
            setSections(HappyMindsConfig.SECTIONS.map(s => (s.id === id ? row : s)));
            return row;
        },

        async deleteSection(id) {
            await manage(client.from('sections').delete().eq('id', id));
            setSections(HappyMindsConfig.SECTIONS.filter(s => s.id !== id));
            HappyMindsConfig.ALL_STUDENTS.forEach(st => { if (st.section_id === id) st.section_id = null; });
            if (currentSectionId === id) currentSectionId = null;
            applySectionRoster();
        },

        // Adds names to a class. Ids follow the school and class, e.g.
        // "hm-001-4a-36", continuing after the class's highest number.
        async addStudents(sectionId, names) {
            const section = HappyMindsConfig.SECTIONS.find(s => s.id === sectionId);
            const prefix = `${section.school.code.toLowerCase()}-${section.grade}${section.letter.toLowerCase()}-`;
            let next = HappyMindsConfig.ALL_STUDENTS
                .filter(s => s.id.startsWith(prefix))
                .reduce((max, s) => Math.max(max, parseInt(s.id.slice(prefix.length), 10) || 0), 0);
            const rows = names.map((name, i) => ({
                id: prefix + String(next + i + 1).padStart(2, '0'),
                name,
                grade: `Grade ${section.grade}`,
                avatar: i % 2 ? 'assets/boy_arjun.png' : 'assets/girl_aanya.png',
                section_id: sectionId
            }));
            const saved = await manage(client.from('students').insert(rows).select('*'));
            HappyMindsConfig.ALL_STUDENTS.push(...saved);
            HappyMindsConfig.ALL_STUDENTS.sort((a, b) => a.name.localeCompare(b.name));
            applySectionRoster();
            return saved;
        },

        // Moves a student to another class, or out of every class (null).
        // Their stories and progress stay with them.
        async moveStudent(studentId, sectionId) {
            const row = await manage(client.from('students').update({ section_id: sectionId }).eq('id', studentId).select('*').single());
            Object.assign(HappyMindsConfig.ALL_STUDENTS.find(s => s.id === studentId), row);
            applySectionRoster();
            return row;
        },

        // ---- Time ---------------------------------------------------------
        // Adds seconds to today's total for this person (sectionId null for
        // prep). Sent in the background with the other saves.
        logTime(sectionId, chapterId, stage, seconds) {
            const whole = Math.round(seconds);
            if (whole < 1 || !signedInUserId) return;
            const day = todayInIndia();
            const row = timeRows.find(r => r.user_id === signedInUserId && r.section_id === sectionId
                && r.chapter_id === chapterId && r.stage === stage && r.day === day);
            if (row) row.seconds += whole;
            else timeRows.push({ user_id: signedInUserId, section_id: sectionId, chapter_id: chapterId, stage, day, seconds: whole });
            pendingTime.push({ sectionId, chapterId, stage, seconds: whole });
            scheduleSave();
        },

        // { chapterId: { stage: seconds } } for one person in one section,
        // with their prep (which has no section) included.
        // Defaults to the signed-in person and the chosen section.
        timeTotals(userId = signedInUserId, sectionId = currentSectionId) {
            const totals = {};
            timeRows.forEach(r => {
                if (r.user_id !== userId || (r.section_id !== null && r.section_id !== sectionId)) return;
                totals[r.chapter_id] = totals[r.chapter_id] || {};
                totals[r.chapter_id][r.stage] = (totals[r.chapter_id][r.stage] || 0) + r.seconds;
            });
            return totals;
        },

        // Someone's Teacher Prep record, { chapterId: data } (their own, or
        // a teacher's when the signed-in account may see it).
        prepFor(userId) {
            return clone(prepByUser.get(userId) || {});
        },

        // ---- Student stories (the `stories` Edge Function) ----------------
        // Each throws a StoryError whose .code says what went wrong:
        // unreadable, limit_reached, busy, offline, or failed.

        // Photo (data URL) → a small JPEG Blob, the version that is read,
        // and kept for the class report.
        preparePhoto(imageSrc) {
            return shrinkPhoto(imageSrc);
        },

        // Teacher: prepared photo → the story as the student wrote it.
        async readStoryPhoto(photo) {
            const form = new FormData();
            form.append('action', 'read');
            form.append('image', photo, 'story.jpg');
            return (await callStories(form)).text;
        },

        // Teacher: story text → { praise, tip, question }.
        async storyFeedback(chapter, text) {
            const body = JSON.stringify({ action: 'feedback', chapter: storyChapter(chapter), text });
            return (await callStories(body, 'application/json')).feedback;
        },

        // Student: photo → { text, feedback, attemptsUsed }, saved on the
        // server. At most 2 per chapter; an unreadable photo doesn't count.
        async submitStoryPhoto(chapter, imageSrc) {
            const form = new FormData();
            form.append('action', 'submit');
            form.append('chapter', JSON.stringify(storyChapter(chapter)));
            form.append('image', await shrinkPhoto(imageSrc), 'story.jpg');
            return await callStories(form);
        },

        // Teacher: save a story scanned in class to that student's record,
        // with its photo (a prepared JPEG Blob, or null if it was typed).
        // Photos are private to staff and deleted after 7 days.
        async saveStory(studentId, chapterId, text, feedback, photo) {
            const failure = error => {
                console.warn('Happy Minds: could not save story', error);
                return new StoryError(/failed to fetch|network/i.test(error?.message || '') ? 'offline' : 'failed');
            };

            let photoPath = null;
            if (photo) {
                const day = new Date().toISOString().slice(0, 10);
                photoPath = `chapter-${chapterId}/${day}/${crypto.randomUUID()}.jpg`;
                const { error } = await client.storage.from(PHOTO_BUCKET)
                    .upload(photoPath, photo, { contentType: 'image/jpeg' });
                if (error) throw failure(error);
            }

            const { error } = await client.from('story_submissions').insert({
                student_id: studentId, chapter_id: chapterId, source: 'teacher', story_text: text, feedback, photo_path: photoPath
            });
            if (error) {
                if (photoPath) await client.storage.from(PHOTO_BUCKET).remove([photoPath]);
                throw failure(error);
            }
        },

        // Staff: short-lived links to story photos, { path: url }. Paths whose
        // photo is gone are left out.
        async storyPhotoUrls(paths) {
            if (!paths.length) return {};
            const { data, error } = await client.storage.from(PHOTO_BUCKET).createSignedUrls(paths, 60 * 60);
            if (error) {
                console.warn('Happy Minds: could not open story photos', error);
                return {};
            }
            return Object.fromEntries(data.filter(item => item.signedUrl).map(item => [item.path, item.signedUrl]));
        },

        // Stories this account may see (Row Level Security decides), newest
        // first. Filter by { chapterId, source } if given.
        async listStories({ chapterId, source, sectionId } = {}) {
            let query = client.from('story_submissions')
                .select('id, student_id, section_id, chapter_id, source, attempt, story_text, feedback, photo_path, created_by, created_at')
                .order('created_at', { ascending: false });
            if (chapterId) query = query.eq('chapter_id', chapterId);
            if (source) query = query.eq('source', source);
            if (sectionId) query = query.eq('section_id', sectionId);
            const { data, error } = await query;
            if (error) {
                console.warn('Happy Minds: could not load stories', error);
                throw new StoryError('failed');
            }
            return data;
        },

        // Admin only (enforced by the database). Throws an Error whose
        // message is safe to show in the reset dialog.
        async resetPassword(username, newPassword) {
            const { error } = await client.rpc('admin_reset_password', { target_username: username, new_password: newPassword });
            if (!error) return;
            const known = /only an admin|at least 8 characters|no account with that username/i;
            if (known.test(error.message || '')) throw new Error(error.message);
            if (/failed to fetch|network/i.test(error.message || '')) {
                throw new Error("Couldn't reach Happy Minds. Check your internet connection and try again.");
            }
            console.warn('Happy Minds: password reset failed', error);
            throw new Error("Couldn't change the password. Please try again.");
        },

        // Live link between the teacher's devices and the projector screen,
        // on a private Realtime channel only this signed-in teacher can use
        // (see "Projector remote" in supabase/schema.sql). `role` is
        // 'teacher' or 'projector'; every open copy announces itself, so each
        // side can see whether the other is online.
        //   onMessage(msg)      — a message sent from another device
        //   onDevices(roles)    — roles currently connected, e.g. ['teacher', 'projector']
        //   onStatus(status)    — 'connected' | 'reconnecting'
        async openProjectorLink({ role, onMessage, onDevices, onStatus }) {
            const { data } = await client.auth.getSession();
            if (!data.session || !signedInUserId) throw new Error('Sign in first.');
            await client.realtime.setAuth(data.session.access_token);

            const channel = client.channel(`projector:${signedInUserId}`, {
                config: { private: true, broadcast: { self: false }, presence: { key: `${role}-${Math.random().toString(36).slice(2, 10)}` } }
            });
            channel.on('broadcast', { event: 'msg' }, ({ payload }) => onMessage && onMessage(payload || {}));
            channel.on('presence', { event: 'sync' }, () => {
                const roles = Object.values(channel.presenceState()).flat().map(meta => meta.role);
                if (onDevices) onDevices(roles);
            });
            channel.subscribe(async status => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ role });
                    if (onStatus) onStatus('connected');
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                    if (onStatus) onStatus('reconnecting');
                }
            });

            return {
                send(msg) { return channel.send({ type: 'broadcast', event: 'msg', payload: msg }); },
                close() { client.removeChannel(channel); }
            };
        },

        // fn('error') when saving starts failing, fn('recovered') once it works again.
        onSaveStatus(fn) {
            statusListeners.push(fn);
        }
    };
})();
