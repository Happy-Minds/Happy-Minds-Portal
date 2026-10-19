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

    const docs = new Map();      // "doc|studentId" -> data
    const unsaved = new Set();   // keys changed locally and not yet written
    let saveTimer = null;
    let saving = null;
    let failing = false;
    const statusListeners = [];

    let signedInUserId = null;

    const keyOf = (doc, studentId) => `${doc}|${studentId || ''}`;
    const clone = value => (value == null ? null : JSON.parse(JSON.stringify(value)));

    // Supabase Auth signs in with an email, the portal with a username.
    const emailFor = username => `${username.trim().toLowerCase()}@${HappyMindsConfig.AUTH_EMAIL_DOMAIN}`;

    function toAccount(row) {
        return { username: row.username, role: row.role, name: row.name, avatar: row.avatar, studentId: row.student_id };
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

        // RLS limits each of these to what this account may see: staff get
        // everything, students and parents get their own child only.
        const [profiles, students, documents] = await Promise.all([
            client.from('profiles').select('*').order('username'),
            client.from('students').select('*').order('name'),
            client.from('app_documents').select('doc, student_id, data')
        ]);
        const failed = [profiles, students, documents].find(r => r.error);
        if (failed) throw failed.error;

        HappyMindsConfig.ACCOUNTS.splice(0, Infinity, ...profiles.data.map(toAccount));
        HappyMindsConfig.STUDENTS.splice(0, Infinity, ...students.data);
        docs.clear();
        unsaved.clear();
        documents.data.forEach(row => docs.set(keyOf(row.doc, row.student_id), row.data));

        signedInUserId = userId;
        return toAccount(me);
    }

    async function writeUnsaved() {
        clearTimeout(saveTimer);
        saveTimer = null;
        if (saving) await saving;
        if (!unsaved.size) return;

        const keys = [...unsaved];
        unsaved.clear();
        const rows = keys.map(key => {
            const [doc, studentId] = key.split('|');
            return { doc, student_id: studentId, data: docs.get(key) };
        });

        saving = client.from('app_documents').upsert(rows, { onConflict: 'doc,student_id' });
        const { error } = await saving;
        saving = null;

        if (error) {
            // Keep the changes and try again; anything saved meanwhile rides along.
            keys.forEach(key => unsaved.add(key));
            console.warn('Happy Minds: save failed, retrying', error);
            if (!failing) { failing = true; notify('error'); }
            saveTimer = setTimeout(writeUnsaved, RETRY_DELAY_MS);
            return;
        }
        if (failing) { failing = false; notify('recovered'); }
    }

    function flushOnClose() {
        if (!unsaved.size) return;
        keepaliveFetch = true;
        writeUnsaved().finally(() => { keepaliveFetch = false; });
    }
    window.addEventListener('pagehide', flushOnClose);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flushOnClose();
    });
    window.addEventListener('online', () => { if (unsaved.size) writeUnsaved(); });

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
            unsaved.clear();
            HappyMindsConfig.ACCOUNTS.length = 0;
            HappyMindsConfig.STUDENTS.length = 0;
        },

        // A copy of the saved document, or null if nothing is saved yet.
        get(doc, studentId) {
            return clone(docs.get(keyOf(doc, studentId)));
        },

        // Saves the document. Several quick saves are combined into one write.
        save(doc, data, studentId) {
            const key = keyOf(doc, studentId);
            docs.set(key, clone(data));
            unsaved.add(key);
            if (!saveTimer && !failing) saveTimer = setTimeout(writeUnsaved, SAVE_DELAY_MS);
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
                send(msg) { channel.send({ type: 'broadcast', event: 'msg', payload: msg }); },
                close() { client.removeChannel(channel); }
            };
        },

        // fn('error') when saving starts failing, fn('recovered') once it works again.
        onSaveStatus(fn) {
            statusListeners.push(fn);
        }
    };
})();
