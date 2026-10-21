/* ==========================================================================
   Happy Minds Application Engine (app.js)
   Reads all chapter content from CHAPTERS (chapters-data.js) and all
   integration addresses from HappyMindsConfig (config.js). This file is the
   ONE template that renders whichever chapter number is active — there are
   no per-chapter copies of any view.
   ========================================================================== */

// ================= Saved document names (must come before appState) =================
// Each name is one document in Supabase (HMCloud, cloud.js).
// Every one of these used to be declared right next to its own load/save
// functions, further down the file — which looked tidy but was a real bug:
// appState's own initializer below calls loadTimeTracking(), loadPrepStatus()
// etc. immediately, before execution has reached those later const lines, so
// each load function's first access to its *_STORAGE_KEY constant threw
// "Cannot access '...' before initialization" (the const temporal dead
// zone) — silently caught by that function's own try/catch, which was only
// ever meant to catch "localStorage is disabled," not this. Net effect:
// every persisted store below silently reset to {} / [] on every page
// load, and nothing written in a previous session ever came back. Moving
// every key constant up here, before appState exists, fixes all of them at
// once.
const TIME_TRACKING_STORAGE_KEY = 'timeTracking';
const PREP_STATUS_STORAGE_KEY = 'prepStatus';
const REFLECTION_STORAGE_KEY = 'reflections';
const OBSERVE_STORAGE_KEY = 'observations';
const LUMORA_WALL_STORAGE_KEY = 'lumoraWall';
// Class progress: which chapters are complete + which stages are done per
// chapter. Also read by the student portal (student-portal.js), so students
// see the same chapter their class is on.
const CLASS_PROGRESS_STORAGE_KEY = 'classProgress';

// Global Application State
const appState = {
    currentView: 'home',
    // Set by enterApp() once a login (config.js ACCOUNTS entry) succeeds.
    currentUser: null,
    currentChapterId: 1,
    // Real class progress, saved on every change. A new class starts with
    // nothing done: chapter 1 unlocked, every stage not started.
    completedChapters: loadClassProgress().completedChapters,
    chapterProgress: loadClassProgress().chapterProgress,
    practiceActivities: [],
    practiceStepIndex: 0,
    builderAssembled: [],
    hintIndex: 0,
    scanTargetStudentId: null,
    scanTargetChapterId: 1,
    // Time-on-page tracking, shown live via the stage-timer-badge in each
    // stage's stepper bar. Lets a teacher check real usage against the
    // ~45-minute class slots. Inspect the full log anytime with getTimeReport().
    timeTracking: loadTimeTracking(),
    // Teacher Prep readiness: first-opened timestamp + "I'm ready" taps per chapter.
    prepStatus: loadPrepStatus(),
    // Chapter Reflection drafts/submissions, keyed by chapter id.
    reflections: loadReflections(),
    // Trainer observation submissions (one array entry per observation).
    observations: loadObservations(),
    // Lumora Wall words, keyed by chapter id — built in Explore, reused as a
    // word bank in Create. Each word is {text, studentId|null} — studentId is
    // optional (teacher can tag who said it during class) and is what makes
    // the parent/trainer "words they contributed" report real instead of a
    // class-wide list with no owner.
    lumoraWall: loadLumoraWall()
};

function getCurrentChapter() {
    return getChapterById(appState.currentChapterId);
}

// "Today" as YYYY-MM-DD in the viewer's own local calendar day — plain
// toISOString().slice(0,10) reports the UTC date instead, which silently
// disagrees with local midnight whenever the browser's timezone isn't UTC
// (it can be a day off in either direction). Used anywhere a date is logged
// or compared by calendar day: Fix It time log, student activity streak.
function localDateString(date) {
    const d = date || new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function loadClassProgress() {
    const saved = HMCloud.get(CLASS_PROGRESS_STORAGE_KEY);
    if (saved) return { completedChapters: saved.completedChapters || [], chapterProgress: saved.chapterProgress || {} };
    return { completedChapters: [], chapterProgress: {} };
}

function saveClassProgress() {
    HMCloud.save(CLASS_PROGRESS_STORAGE_KEY, {
        completedChapters: appState.completedChapters,
        chapterProgress: appState.chapterProgress
    });
}

// appState is built before anyone signs in, so it starts empty; once the
// signed-in account's documents arrive from Supabase, load them all in.
function reloadSavedState() {
    const progress = loadClassProgress();
    appState.completedChapters = progress.completedChapters;
    appState.chapterProgress = progress.chapterProgress;
    appState.timeTracking = loadTimeTracking();
    appState.prepStatus = loadPrepStatus();
    appState.reflections = loadReflections();
    appState.observations = loadObservations();
    appState.lumoraWall = loadLumoraWall();
}

function getProgress(chapterId) {
    if (!appState.chapterProgress[chapterId]) {
        appState.chapterProgress[chapterId] = { explore: false, practice: false, create: false, perform: false };
    }
    return appState.chapterProgress[chapterId];
}

function markStageDone(chapterId, stage) {
    getProgress(chapterId)[stage] = true;
    saveClassProgress();
}

function markChapterComplete(chapterId) {
    if (!appState.completedChapters.includes(chapterId)) {
        appState.completedChapters.push(chapterId);
        saveClassProgress();
    }
}

function isChapterUnlocked(id) {
    if (id === 1) return true;
    return appState.completedChapters.includes(id - 1) || appState.completedChapters.includes(id);
}

// ================= Silent Time-on-Page Tracking =================
// No timer is ever shown to the student or teacher — this only answers,
// later, "did this class actually take about 40 minutes?" (TIME_TRACKING_STORAGE_KEY is declared up top, next to appState.)
let activeTimerKey = null;
let activeTimerStartedAt = null;

function loadTimeTracking() {
    return HMCloud.get(TIME_TRACKING_STORAGE_KEY) || {};
}

function saveTimeTracking() {
    HMCloud.save(TIME_TRACKING_STORAGE_KEY, appState.timeTracking);
}

function startTimer(chapterId, stage) {
    stopTimer();
    pausedTimerKey = null;
    activeTimerKey = { chapterId, stage };
    activeTimerStartedAt = Date.now();
    lastActivityAt = Date.now();
    updateStageTimerDisplay();
}

// Leaving the page for good (another page, sign out, closing the tab).
function endTimer() {
    stopTimer();
    pausedTimerKey = null;
}

// ---- Only count time the teacher is really there ----
// The clock pauses while the tab is hidden (screen locked, another app or
// tab) and after a stretch with no taps, typing or scrolling, so a page left
// open does not add hours. A playing video or read-aloud counts as activity.
// Lesson stages allow a longer quiet stretch than prep or scanning, because
// a class can work silently (drawing, writing) while the teacher watches.
const TIMER_IDLE_LIMIT_MS = { prep: 5 * 60 * 1000, scan: 5 * 60 * 1000 };
const TIMER_IDLE_LIMIT_LESSON_MS = 20 * 60 * 1000;
// Prep and scanning are hands-on: once idle, only the first minute after the
// last tap is counted. A quiet lesson may still be running, so it keeps its time.
const TIMER_IDLE_GRACE_MS = 60 * 1000;
let pausedTimerKey = null;
let lastActivityAt = Date.now();

function pauseTimer(endAt) {
    if (!activeTimerKey) return;
    const key = activeTimerKey;
    stopTimer(endAt);
    pausedTimerKey = key;
    updateStageTimerDisplay();
}

function resumeTimer() {
    if (!pausedTimerKey || document.visibilityState !== 'visible') return;
    const { chapterId, stage } = pausedTimerKey;
    startTimer(chapterId, stage);
}

function lessonMediaPlaying() {
    if (ytPlayer && typeof ytPlayer.getPlayerState === 'function' && ytPlayer.getPlayerState() === 1) return true;
    const video = document.getElementById('chapterVideo');
    if (video && !video.paused && !video.ended) return true;
    return !!(window.speechSynthesis && window.speechSynthesis.speaking);
}

function checkTimerIdle() {
    if (!activeTimerKey) return;
    if (lessonMediaPlaying()) { lastActivityAt = Date.now(); return; }
    const handsOn = activeTimerKey.stage in TIMER_IDLE_LIMIT_MS;
    const limit = handsOn ? TIMER_IDLE_LIMIT_MS[activeTimerKey.stage] : TIMER_IDLE_LIMIT_LESSON_MS;
    if (Date.now() - lastActivityAt > limit) pauseTimer(handsOn ? lastActivityAt + TIMER_IDLE_GRACE_MS : undefined);
}

['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(type => {
    window.addEventListener(type, () => {
        lastActivityAt = Date.now();
        if (pausedTimerKey) resumeTimer();
    }, { passive: true, capture: true });
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        pauseTimer();
    } else {
        lastActivityAt = Date.now();
        resumeTimer();
    }
});
window.addEventListener('pagehide', endTimer);
setInterval(checkTimerIdle, 15000);

// endAt: when the time stopped counting (default now; earlier for idle).
function stopTimer(endAt = Date.now()) {
    if (!activeTimerKey || !activeTimerStartedAt) return;
    const seconds = Math.max(0, (Math.min(endAt, Date.now()) - activeTimerStartedAt) / 1000);
    const { chapterId, stage } = activeTimerKey;
    if (!appState.timeTracking[chapterId]) appState.timeTracking[chapterId] = {};
    appState.timeTracking[chapterId][stage] = (appState.timeTracking[chapterId][stage] || 0) + seconds;
    saveTimeTracking();
    activeTimerKey = null;
    activeTimerStartedAt = null;
}

// getTimeReport() or getTimeReport(7) — a fuller minutes-per-chapter
// breakdown than the live per-page badge, handy from the console.
function getTimeReport(chapterId) {
    const data = chapterId ? { [chapterId]: appState.timeTracking[chapterId] } : appState.timeTracking;
    const minutes = {};
    Object.entries(data).forEach(([cId, stages]) => {
        minutes[cId] = {};
        Object.entries(stages || {}).forEach(([stage, seconds]) => {
            minutes[cId][stage] = Math.round((seconds / 60) * 10) / 10;
        });
    });
    return minutes;
}

// Teacher-visible live readout, e.g. "4:07", on whichever stage page is open.
function updateStageTimerDisplay() {
    const badges = document.querySelectorAll('.stage-timer-value');
    if (!badges.length) return;

    let seconds = 0;
    const key = activeTimerKey || pausedTimerKey;
    if (key) {
        const { chapterId, stage } = key;
        seconds = (appState.timeTracking[chapterId] && appState.timeTracking[chapterId][stage]) || 0;
        if (activeTimerKey && activeTimerStartedAt) seconds += (Date.now() - activeTimerStartedAt) / 1000;
    }

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const text = `${mins}:${String(secs).padStart(2, '0')}`;
    badges.forEach(el => {
        el.textContent = text;
        el.closest('.stage-timer-badge')?.classList.toggle('paused', !!pausedTimerKey && !activeTimerKey);
    });
}

setInterval(updateStageTimerDisplay, 1000);
window.addEventListener('beforeunload', endTimer);

// ================= Navigation & View Routing =================
function closeAllModals() {
    document.querySelectorAll('.modal-backdrop.active-modal').forEach(m => m.classList.remove('active-modal'));
}

function navigateTo(viewId) {
    appState.currentView = viewId;
    closeAllModals();
    endTimer();

    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active-view'));
    const targetView = document.getElementById(`${viewId}-view`);
    if (targetView) targetView.classList.add('active-view');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-view') === viewId);
    });

    if (viewId === 'home') renderHomeHeroStats();
    if (viewId !== 'explore-stage') {
        stopStorybookNarration();
        pauseChapterVideo();
        if (drawTimerRunning) { pauseDrawTimer(); renderDrawTimer(); }
    }
    renderNotificationCenter();
    updateScriptFab(viewId);

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Brief: the Chapter Reflection "stays on the teacher's home screen until
// submitted". Rather than a banner that overwhelms the home page, pending
// reflections (and any future alert type) live in the header's notification
// dropdown, with the badge count reflecting real pending state — not the
// hardcoded "2" this used to show.
function renderNotificationCenter() {
    const list = document.getElementById('notificationDropdownList');
    const badge = document.getElementById('notificationBadge');
    if (!list || !badge) return;

    if (appState.currentUser && REFLECTION_REVIEWER_ROLES.includes(appState.currentUser.role)) {
        renderReviewerNotifications(list, badge);
        return;
    }

    const pending = appState.completedChapters.filter(id => isReflectionPending(id));

    badge.textContent = pending.length;
    badge.style.display = pending.length ? 'flex' : 'none';

    if (!pending.length) {
        list.innerHTML = `<div class="notification-dropdown-empty">You're all caught up — no pending reflections.</div>`;
        return;
    }

    list.innerHTML = pending.map(id => {
        const chapter = getChapterById(id);
        return `
            <div class="reflection-reminder-card">
                <i class="fa-solid fa-clipboard-question"></i>
                <div class="reflection-reminder-text">
                    <strong>Reflection pending: ${chapter.title}</strong>
                    <span>Chapter ${String(id).padStart(2, '0')} isn't complete until this is submitted.</span>
                </div>
                <button class="btn-primary-glowing compact" onclick="closeNotificationMenu(); appState.currentChapterId=${id}; openChapterReflection();">
                    Complete It <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>`;
    }).join('');
}

function openChapterDetail(chapterId) {
    if (!isChapterUnlocked(chapterId)) {
        showNotification('Complete the previous chapter to unlock this one!');
        return;
    }
    appState.currentChapterId = chapterId;
    renderChapterHub();
    navigateTo('chapter-detail');

    if (!isPlannerComplete(chapterId, 'class1')) {
        openPlannerModal(chapterId, 'class1');
    }
}

function startChapterStage(stageName) {
    const chapter = getCurrentChapter();

    // Class 2 (Create + Perform) only opens once the Class 1 planner is fully
    // ticked off — either done by the teacher or auto-tracked by the app.
    if ((stageName === 'create' || stageName === 'perform') && !isPlannerComplete(chapter.id, 'class1')) {
        showNotification('Complete the Class 1 planner before moving on to Create & Perform.');
        openPlannerModal(chapter.id, 'class1', stageName);
        return;
    }

    document.querySelectorAll('.chapter-back-label').forEach(el => {
        el.textContent = `Chapter ${String(chapter.id).padStart(2, '0')}`;
    });

    if (stageName === 'explore') {
        renderExploreStage(chapter);
        navigateTo('explore-stage');
        startTimer(chapter.id, 'explore');
    } else if (stageName === 'practice') {
        renderPracticeStage(chapter);
        navigateTo('practice-stage');
        startTimer(chapter.id, 'practice');
    } else if (stageName === 'create') {
        renderCreateStage(chapter);
        navigateTo('create-stage');
        startTimer(chapter.id, 'create');
        if (!isPlannerComplete(chapter.id, 'class2')) {
            openPlannerModal(chapter.id, 'class2');
        }
    } else if (stageName === 'perform') {
        renderPerformStage(chapter);
        navigateTo('perform-stage');
        startTimer(chapter.id, 'perform');
    }

    // Each stage view has its own copy of the stepper bar, so scope the
    // active-pill lookup to the view that's actually visible right now.
    const activeView = document.querySelector('.view-section.active-view');
    activeView.querySelectorAll('.step-pill').forEach(pill => pill.classList.remove('active'));
    const activePill = activeView.querySelector(`.step-pill[data-stage="${stageName}"]`);
    if (activePill) activePill.classList.add('active');
}

// ================= Login / Logout (Supabase Auth, via cloud.js) =================
// The login button doubles as the progress indicator while a session is
// being checked or a sign-in is in flight.
function setLoginBusy(busy, label) {
    const button = document.querySelector('#loginForm button[type="submit"]');
    button.disabled = busy;
    button.innerHTML = busy
        ? `<i class="fa-solid fa-circle-notch fa-spin"></i> ${label}`
        : '<i class="fa-solid fa-right-to-bracket"></i> Log In';
}

async function checkExistingSession() {
    setLoginBusy(true, 'Checking your session…');
    const account = await HMCloud.restoreSession();
    setLoginBusy(false);
    if (account) {
        enterApp(account);
        return;
    }
    document.getElementById('login-view').style.display = 'flex';
    document.getElementById('app').classList.add('app-hidden');
}

async function attemptLogin(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    errorEl.textContent = '';
    setLoginBusy(true, 'Signing in…');
    try {
        const account = await HMCloud.signIn(username, password);
        enterApp(account);
    } catch (err) {
        errorEl.textContent = err.message;
    } finally {
        setLoginBusy(false);
    }
}

function enterApp(account) {
    // Students have their own standalone portal; Supabase keeps the session
    // for this whole site, so no second sign-in is needed there.
    if (account.role === 'student') {
        window.location.replace('student-portal.html');
        return;
    }

    appState.currentUser = account;
    reloadSavedState();
    renderChaptersRoadmap();
    renderChapterHub();
    ensureRemoteChannel();

    document.getElementById('login-view').style.display = 'none';
    document.getElementById('app').classList.remove('app-hidden');

    document.getElementById('headerUserAvatar').src = account.avatar;
    document.getElementById('headerUserName').textContent = `Hi, ${account.name}!`;
    const roleLabels = { admin: 'Admin', trainer: 'Trainer', teacher: 'Teacher', student: 'Student', parent: 'Parent' };
    document.getElementById('headerUserRole').textContent = roleLabels[account.role] || 'Teacher';

    // Any nav item tagged data-role="X" only shows for that role. A few
    // elements (like the Fix It Zone hub banner) need to show for several
    // roles at once — those use data-roles="a,b" (plural) instead.
    document.querySelectorAll('[data-role]').forEach(el => {
        el.style.display = el.dataset.role === account.role ? '' : 'none';
    });
    document.querySelectorAll('[data-roles]').forEach(el => {
        el.style.display = el.dataset.roles.split(',').includes(account.role) ? '' : 'none';
    });

    if (account.role === 'admin') renderAdminDashboard();
    renderNotificationCenter();

    if (account.role === 'parent') {
        renderParentDashboard(account);
        navigateTo('parent-dashboard');
    } else {
        navigateTo('home');
    }
}

function toggleUserMenu() {
    document.getElementById('userMenuDropdown').classList.toggle('open');
}

function toggleNotificationMenu(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('notificationDropdown');
    // Phones show the panel full-width under the bell (see styles.css).
    const bell = event && event.currentTarget;
    if (bell) dropdown.style.setProperty('--notification-top', `${Math.round(bell.getBoundingClientRect().bottom + 8)}px`);
    dropdown.classList.toggle('open');
}

function closeNotificationMenu() {
    document.getElementById('notificationDropdown').classList.remove('open');
}

async function handleLogout(event) {
    event.stopPropagation();
    // Record time on the open stage before the session (and save access) ends.
    endTimer();
    await stopProjectorForSignOut();
    closeRemoteChannel();
    updateScriptFab('login');
    await HMCloud.signOut();
    appState.currentUser = null;
    reloadSavedState();
    document.getElementById('userMenuDropdown').classList.remove('open');
    document.getElementById('loginForm').reset();
    document.getElementById('app').classList.add('app-hidden');
    document.getElementById('login-view').style.display = 'flex';
}

const ADMIN_ROLE_LABELS = { admin: 'Admin', trainer: 'Trainer', teacher: 'Teacher', student: 'Student', parent: 'Parent' };
const ADMIN_STAFF_ROLES = ['teacher', 'trainer', 'admin'];

function renderAdminDashboard() {
    document.getElementById('adminChapterCount').textContent = CHAPTERS.length;
    // Staff only (teacher/trainer/admin) — students and parents have their
    // own accounts now too, and counting everyone here under "Teacher &
    // Admin Accounts" would be a wrong number next to a stale label.
    const staffAccounts = HappyMindsConfig.ACCOUNTS.filter(a => ADMIN_STAFF_ROLES.includes(a.role));
    document.getElementById('adminAccountCount').textContent = staffAccounts.length;
    document.getElementById('adminFamilyAccountCount').textContent =
        HappyMindsConfig.ACCOUNTS.filter(a => a.role === 'student' || a.role === 'parent').length;
    document.getElementById('adminFullContentCount').textContent =
        CHAPTERS.filter(ch => ch.storybook && ch.fixItZone).length;

    document.getElementById('adminChapterList').innerHTML = CHAPTERS.map(ch => `
        <div class="admin-list-row" style="cursor:pointer;" onclick="openChapterDetail(${ch.id})">
            <span class="admin-list-num">${String(ch.id).padStart(2, '0')}</span>
            <span class="admin-list-title">${ch.title}</span>
            <span class="admin-list-tag ${ch.storybook && ch.fixItZone ? 'full' : 'partial'}">${ch.storybook && ch.fixItZone ? 'Full content' : 'Skeleton only'}</span>
            <i class="fa-solid fa-chevron-right"></i>
        </div>`).join('');

    document.getElementById('adminAccountList').innerHTML = staffAccounts.map(acc => `
        <div class="admin-list-row">
            <img src="${acc.avatar}" alt="" class="admin-list-avatar">
            <span class="admin-list-title">${acc.name} <span class="admin-list-username">@${acc.username}</span></span>
            <span class="admin-list-tag role-${acc.role}">${ADMIN_ROLE_LABELS[acc.role]}</span>
        </div>`).join('');

    renderAdminTrainerCard();
    document.getElementById('adminPasswordSearch').value = '';
    renderAdminPasswordList('');
}

// ================= ADMIN: Reset a Password =================
// Every account (staff, students, parents), filtered by the search box.
// The reset itself runs in the database (admin_reset_password), which
// re-checks that the signed-in account really is an admin.
const ADMIN_ROLE_ORDER = ['teacher', 'trainer', 'admin', 'student', 'parent'];
let resetPasswordUsername = null;

function renderAdminPasswordList(query) {
    const q = (query || '').trim().toLowerCase();
    const accounts = HappyMindsConfig.ACCOUNTS
        .filter(a => !q || a.name.toLowerCase().includes(q) || a.username.toLowerCase().includes(q))
        .sort((a, b) => ADMIN_ROLE_ORDER.indexOf(a.role) - ADMIN_ROLE_ORDER.indexOf(b.role) || a.name.localeCompare(b.name));

    const list = document.getElementById('adminPasswordList');
    if (!accounts.length) {
        list.innerHTML = `<p class="prep-readiness-explain">No account matches "${escapeReportText(query)}".</p>`;
        return;
    }
    list.innerHTML = accounts.map(acc => `
        <div class="admin-list-row">
            <img src="${escapeReportText(acc.avatar)}" alt="" class="admin-list-avatar">
            <span class="admin-list-title">${escapeReportText(acc.name)} <span class="admin-list-username">@${escapeReportText(acc.username)}</span></span>
            <span class="admin-list-tag role-${acc.role}">${ADMIN_ROLE_LABELS[acc.role]}</span>
            <button type="button" class="btn-glass compact" data-username="${escapeReportText(acc.username)}" onclick="openResetPasswordModal(this.dataset.username)">Reset password</button>
        </div>`).join('');
}

function openResetPasswordModal(username) {
    const account = HappyMindsConfig.ACCOUNTS.find(a => a.username === username);
    if (!account) return;
    resetPasswordUsername = username;
    document.getElementById('resetPasswordFor').textContent = `${account.name} (@${account.username})`;
    document.getElementById('resetPasswordForm').reset();
    document.getElementById('resetPasswordForm').hidden = false;
    document.getElementById('resetPasswordDone').hidden = true;
    document.getElementById('resetPasswordError').textContent = '';
    document.getElementById('resetPasswordModal').classList.add('active-modal');
    document.getElementById('resetPasswordInput').focus();
}

function closeResetPasswordModal() {
    resetPasswordUsername = null;
    document.getElementById('resetPasswordModal').classList.remove('active-modal');
    // Don't leave a new password sitting in the page.
    document.getElementById('resetPasswordDoneValue').textContent = '';
}

// Two simple words and four digits, e.g. "sunny-river-4827": easy to read
// out to a child or parent, and far from the demo-style passwords.
const PASSWORD_WORDS = ['apple', 'tiger', 'river', 'sunny', 'cloud', 'mango', 'rocket', 'garden', 'pencil', 'forest',
    'dragon', 'castle', 'bridge', 'meadow', 'planet', 'lemon', 'violet', 'eagle', 'island', 'candle', 'maple', 'ocean'];

function suggestPassword() {
    const random = new Uint32Array(3);
    crypto.getRandomValues(random);
    const word = i => PASSWORD_WORDS[random[i] % PASSWORD_WORDS.length];
    const digits = String(random[2] % 10000).padStart(4, '0');
    const input = document.getElementById('resetPasswordInput');
    input.value = `${word(0)}-${word(1)}-${digits}`;
    input.focus();
    document.getElementById('resetPasswordError').textContent = '';
}

async function submitPasswordReset(event) {
    event.preventDefault();
    const input = document.getElementById('resetPasswordInput');
    const errorEl = document.getElementById('resetPasswordError');
    const submit = document.getElementById('resetPasswordSubmit');
    const password = input.value.trim();

    if (password.length < 8) {
        errorEl.textContent = 'The new password must be at least 8 characters.';
        input.focus();
        return;
    }

    errorEl.textContent = '';
    submit.disabled = true;
    submit.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving…';
    try {
        await HMCloud.resetPassword(resetPasswordUsername, password);
        const account = HappyMindsConfig.ACCOUNTS.find(a => a.username === resetPasswordUsername);
        document.getElementById('resetPasswordDoneName').textContent = account ? account.name : resetPasswordUsername;
        document.getElementById('resetPasswordDoneValue').textContent = password;
        document.getElementById('resetPasswordForm').hidden = true;
        document.getElementById('resetPasswordDone').hidden = false;
    } catch (err) {
        errorEl.textContent = err.message;
    } finally {
        submit.disabled = false;
        submit.textContent = 'Set New Password';
    }
}

async function copyResetPassword() {
    const value = document.getElementById('resetPasswordDoneValue').textContent;
    try {
        await navigator.clipboard.writeText(value);
        showNotification('Password copied.');
    } catch (err) {
        showNotification("Couldn't copy. Select the password and copy it yourself.");
    }
}

// Real trainer activity instead of the old "Trainers — Coming in a later
// phase" placeholder: every trainer/admin account, how many observations
// they've logged, and their most recent visit — built from appState.observations,
// the same data the Observation module itself writes.
function renderAdminTrainerCard() {
    const card = document.getElementById('adminTrainerCard');
    if (!card) return;
    const trainers = HappyMindsConfig.ACCOUNTS.filter(a => a.role === 'trainer');
    if (!trainers.length) {
        card.innerHTML = '<p class="prep-readiness-explain">No trainer accounts yet.</p>';
        return;
    }
    card.innerHTML = trainers.map(t => {
        const visits = appState.observations.filter(o => o.signObserver === t.name);
        const last = visits.slice().sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0];
        return `
            <div class="admin-list-row">
                <img src="${t.avatar}" alt="" class="admin-list-avatar">
                <span class="admin-list-title">${t.name}</span>
                <span class="admin-list-username">${visits.length} observation${visits.length === 1 ? '' : 's'} logged${last ? ` · last visit ${last.chapterTitle} (${new Date(last.submittedAt).toLocaleDateString()})` : ''}</span>
            </div>`;
    }).join('');
}

function showNotification(msg) {
    // A new message replaces the one on screen instead of piling on top of it.
    document.querySelectorAll('.toast-notification').forEach(old => old.remove());
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('leaving'), 2200);
    setTimeout(() => toast.remove(), 2500);
}

// ================= Opening Ritual: signature chime =================
// A small two-note synthesised chime (no audio asset needed) — the
// "signature sound" from the Opening Ritual signature feature, played once
// as each ritual screen appears. Respects prefers-reduced-motion as a proxy
// for "don't play unexpected sound" too.
let ritualAudioCtx = null;
function playRitualChime() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try {
        ritualAudioCtx = ritualAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
        const now = ritualAudioCtx.currentTime;
        [523.25, 783.99].forEach((freq, i) => {
            const osc = ritualAudioCtx.createOscillator();
            const gain = ritualAudioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, now + i * 0.12);
            gain.gain.linearRampToValueAtTime(0.12, now + i * 0.12 + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.6);
            osc.connect(gain).connect(ritualAudioCtx.destination);
            osc.start(now + i * 0.12);
            osc.stop(now + i * 0.12 + 0.6);
        });
    } catch (err) { /* Web Audio unavailable — ritual stays silent, no error shown */ }
}

// ================= VIEW 2: Roadmap (all 24 chapters) =================
function buildRoadmapLayout() {
    // Serpentine 4-row x 6-column layout generated from chapter count, so
    // adding/removing chapters never requires manually repositioning nodes.
    const layout = [];
    const rowTops = [10, 33, 56, 79]; // stays within 6%-83% so labels never clip the map's bottom edge
    CHAPTERS.forEach((chapter, i) => {
        const row = Math.floor(i / 6);
        const col = i % 6;
        const trueCol = row % 2 === 0 ? col : 5 - col;
        // .chapter-node is centred on this point (translateX(-50%) in CSS),
        // so both edge columns need margin for half a label's width.
        const left = 9 + trueCol * 16.4;
        const wave = col % 2 === 0 ? -4 : 4;
        const top = rowTops[row] + wave;
        layout.push({ top, left });
    });
    return layout;
}

// Home hero's "Your Progress" stat was static HTML (always "25%", however
// many chapters were actually completed) — this wires it to the same real
// completedChapters data the roadmap below already uses.
function renderHomeHeroStats() {
    const chaptersEl = document.getElementById('homeStatChapters');
    const pctEl = document.getElementById('homeStatProgressPct');
    const fillEl = document.getElementById('homeStatProgressFill');
    if (!chaptersEl) return;
    chaptersEl.textContent = CHAPTERS.length;
    const pct = Math.round((appState.completedChapters.length / CHAPTERS.length) * 100);
    pctEl.textContent = `${pct}%`;
    fillEl.style.width = `${pct}%`;
}

function renderChaptersRoadmap() {
    const grid = document.getElementById('nodesGrid');
    const layout = buildRoadmapLayout();
    const nextChapterId = CHAPTERS.find(c => !appState.completedChapters.includes(c.id))?.id;

    grid.innerHTML = CHAPTERS.map((chapter, i) => {
        const pos = layout[i];
        const completed = appState.completedChapters.includes(chapter.id);
        const locked = !isChapterUnlocked(chapter.id);
        const isNext = chapter.id === nextChapterId;
        const classes = ['chapter-node'];
        if (completed) classes.push('completed');
        if (locked) classes.push('locked');
        if (isNext) classes.push('active-node');

        const badge = locked
            ? `<i class="fa-solid fa-lock"></i> ${String(chapter.id).padStart(2, '0')}`
            : (completed ? `<i class="fa-solid fa-check"></i>` : String(chapter.id).padStart(2, '0'));

        return `
            <div class="${classes.join(' ')}" style="top:${pos.top}%; left:${pos.left}%;" onclick="openChapterDetail(${chapter.id})">
                <div class="node-badge">${badge}</div>
                <span class="node-title">${chapter.title}</span>
                ${chapter.id === 1 ? '<div class="start-tag">START</div>' : ''}
            </div>`;
    }).join('');

    // Draw a winding line through every node so the path visually matches the layout.
    const svgPoints = layout.map(p => `${p.left * 10},${p.top * 5}`);
    let d = `M ${svgPoints[0]}`;
    for (let i = 1; i < svgPoints.length; i++) d += ` L ${svgPoints[i]}`;
    document.getElementById('roadmapPath').setAttribute('d', d);

    const pct = Math.round((appState.completedChapters.length / CHAPTERS.length) * 100);
    document.getElementById('roadmapProgressText').textContent = `${appState.completedChapters.length}/${CHAPTERS.length} Chapters   ${pct}%`;
    document.getElementById('roadmapProgressFill').style.width = `${pct}%`;
}

// ================= VIEW 3: Chapter Hub =================
function renderChapterHub() {
    const chapter = getCurrentChapter();
    const progress = getProgress(chapter.id);

    document.getElementById('hubChapterTag').textContent = `Chapter ${String(chapter.id).padStart(2, '0')}`;
    document.getElementById('hubTitle').textContent = chapter.title;
    document.getElementById('hubQuote').textContent = `"${chapter.quote}"`;

    ['explore', 'practice', 'create', 'perform'].forEach(stage => {
        const card = document.querySelector(`.stage-card.${stage}-card`);
        card.classList.toggle('stage-done', !!progress[stage]);
    });

    const doneCount = Object.values(progress).filter(Boolean).length;
    const pct = Math.round((doneCount / 4) * 100);
    document.getElementById('chapterHubProgressBar').style.width = `${pct}%`;
    document.getElementById('chapterHubProgressText').textContent = `${pct}%`;

    renderPlannerStatusRow(chapter);
    renderPrepReadiness(chapter.id);
}

// ================= Class Planners (to-do lists gating each class session) =================
// One chapter spans two classroom sessions: Class 1 covers Explore + Practice,
// Class 2 covers Create + Perform. Each planner is a 2-item to-do list — one
// item per stage in that session — describing what the class does. Every
// item ticks itself automatically the moment that stage is actually
// completed in the app; there is nothing for the teacher to tick by hand.
// A planner must show 100% before the next one (or the next chapter) opens.
const PLANNER_TITLES = {
    class1: 'Class 1 Planner · Explore & Practice',
    class2: 'Class 2 Planner · Create & Perform'
};

function getPlannerItems(chapterId, plannerKey) {
    const chapter = getChapterById(chapterId);
    const progress = getProgress(chapterId);
    const custom = chapter.planner && chapter.planner[plannerKey];

    const labels = custom || (plannerKey === 'class1'
        ? [
            `Watch "${chapter.title}" and discuss: ${chapter.thinkTalk[0]}`,
            `Practice the vocabulary and sentence-building activities for "${chapter.title}"`
        ]
        : [
            `Write a story: ${chapter.create.challenge}`,
            'Rewrite the story using the suggestion and get it evaluated'
        ]);

    const doneFlags = plannerKey === 'class1'
        ? [!!progress.explore, !!progress.practice]
        : [!!progress.create, !!progress.perform];

    return labels.map((label, i) => ({ label, done: doneFlags[i] }));
}

function isPlannerComplete(chapterId, plannerKey) {
    return getPlannerItems(chapterId, plannerKey).every(item => item.done);
}

function renderPlannerStatusRow(chapter) {
    const row = document.getElementById('plannerStatusRow');
    if (!row) return;
    row.innerHTML = ['class1', 'class2'].map(key => {
        const items = getPlannerItems(chapter.id, key);
        const doneCount = items.filter(i => i.done).length;
        const complete = doneCount === items.length;
        const label = key === 'class1' ? 'Class 1 Planner' : 'Class 2 Planner';
        return `
            <button class="planner-status-pill ${complete ? 'complete' : ''}" onclick="openPlannerModal(${chapter.id}, '${key}')">
                <i class="fa-solid ${complete ? 'fa-circle-check' : 'fa-clipboard-list'}"></i>
                ${label} <span>${doneCount}/${items.length}</span>
            </button>`;
    }).join('');
}

let plannerCurrentChapterId = null;
let plannerCurrentKey = null;
let plannerPendingStage = null;

function openPlannerModal(chapterId, plannerKey, pendingStage) {
    plannerCurrentChapterId = chapterId;
    plannerCurrentKey = plannerKey;
    plannerPendingStage = pendingStage || null;
    renderPlannerModal();
    document.getElementById('plannerModal').classList.add('active-modal');
}

function closePlannerModal() {
    document.getElementById('plannerModal').classList.remove('active-modal');
    plannerPendingStage = null;
}

function renderPlannerModal() {
    const chapter = getChapterById(plannerCurrentChapterId);
    const items = getPlannerItems(plannerCurrentChapterId, plannerCurrentKey);
    const doneCount = items.filter(i => i.done).length;
    const allDone = doneCount === items.length;

    document.getElementById('plannerEyebrow').textContent = `Chapter ${String(chapter.id).padStart(2, '0')} · ${chapter.title}`;
    document.getElementById('plannerModalTitle').textContent = PLANNER_TITLES[plannerCurrentKey];

    document.getElementById('plannerProgressFill').style.width = `${Math.round((doneCount / items.length) * 100)}%`;
    document.getElementById('plannerProgressText').textContent = `${doneCount} / ${items.length} done`;

    document.getElementById('plannerChecklist').innerHTML = items.map(item => `
        <label class="planner-item ${item.done ? 'done' : ''}">
            <div class="planner-item-main">
                <input type="checkbox" ${item.done ? 'checked' : ''} disabled>
                <span>${item.label}</span>
            </div>
            <span class="planner-auto-tag">${item.done ? 'Done' : 'Auto-tracks'}</span>
        </label>`).join('');

    const continueBtn = document.getElementById('plannerContinueBtn');
    continueBtn.disabled = !allDone;
    continueBtn.innerHTML = allDone
        ? `${plannerPendingStage ? 'Continue' : 'All Done'} <i class="fa-solid fa-arrow-right"></i>`
        : `Waiting on the class <i class="fa-solid fa-lock"></i>`;
}

function continuePlanner() {
    if (!isPlannerComplete(plannerCurrentChapterId, plannerCurrentKey)) return;
    const stage = plannerPendingStage;
    closePlannerModal();
    if (stage) {
        startChapterStage(stage);
    } else {
        showNotification(plannerCurrentKey === 'class1'
            ? 'Class 1 planner complete! Ready for Create & Perform.'
            : 'Class 2 planner complete!');
    }
}

// ================= Projector Remote (Supabase Realtime) =================
// The teacher's phone (or laptop) drives projector.html on the classroom
// screen. Both are signed in as the same teacher, so they find each other
// automatically on that teacher's private Realtime channel (HMCloud.
// openProjectorLink, cloud.js) — no pairing code. Only student-safe state is
// sent (video, storybook pages, one Think & Talk question at a time, the
// draw prompt, wrap-up…) — never the script, sample answers or roving
// prompts, which stay in chapter.prep on the teacher's device.
const PROJECTOR_ROLES = ['teacher', 'trainer', 'admin'];
let remoteChannel = null;
let projectorConnected = false;

async function ensureRemoteChannel() {
    if (remoteChannel || !appState.currentUser || !PROJECTOR_ROLES.includes(appState.currentUser.role)) return;
    remoteChannel = 'opening';
    try {
        remoteChannel = await HMCloud.openProjectorLink({
            role: 'teacher',
            onMessage: msg => {
                // A projector that opens (or reloads) mid-step asks what to show.
                if (msg.type === 'projector-ready') broadcastCurrentState();
                if (msg.type === 'narration-state') onProjectorNarrationState(msg);
            },
            onDevices: roles => {
                const wasConnected = projectorConnected;
                projectorConnected = roles.includes('projector');
                if (projectorConnected !== wasConnected) {
                    // Reading moves to (or back from) the projector: stop
                    // whatever was playing so the voice never comes from here.
                    localNarration.stop();
                    projectorNarrationState = 'idle';
                }
                updateProjectorStatusUI();
                updateNarrationControls();
                if (projectorConnected && !wasConnected) broadcastCurrentState();
            }
        });
    } catch (err) {
        console.warn('Happy Minds: projector link unavailable', err);
        remoteChannel = null;
    }
}

function closeRemoteChannel() {
    if (remoteChannel && remoteChannel !== 'opening') remoteChannel.close();
    remoteChannel = null;
    projectorConnected = false;
    updateProjectorStatusUI();
}

// Every message carries the chapter, so the projector follows whichever
// chapter the teacher's device is on.
function broadcastToProjector(msg) {
    if (!remoteChannel || remoteChannel === 'opening') return;
    remoteChannel.send({ ...msg, chapterId: appState.currentChapterId });
}

// On the classroom laptop: opens the projector screen in its own window
// (drag it onto the projector display). On a phone the projector is already
// running on the laptop, so the button only reports the connection.
function openProjectorView() {
    if (projectorConnected) {
        showNotification('The projector is connected. Your taps on this device control it.');
        return;
    }
    window.open('projector.html', 'happyminds_projector', 'width=1280,height=720');
}

// Account menu: Projector mode when none is connected, Stop projector when one is.
function projectorMenuAction() {
    if (projectorConnected) {
        broadcastToProjector({ type: 'projector-stop', reason: 'teacher' });
        showNotification('Projector stopped.');
    } else {
        openProjectorView();
    }
}

// Before signing out: tell the projector, and wait (briefly) for it to go
// out, so the projector stops and signs out instead of staying connected.
async function stopProjectorForSignOut() {
    if (!projectorConnected || !remoteChannel || remoteChannel === 'opening') return;
    const msg = { type: 'projector-stop', reason: 'signed-out', chapterId: appState.currentChapterId };
    await Promise.race([remoteChannel.send(msg), new Promise(resolve => setTimeout(resolve, 1500))]);
}

function updateProjectorStatusUI() {
    // Remote Mode applies app-wide (Explore, Practice, Create, Perform all
    // read this class), so it's always kept in sync even on views without
    // the status dot itself.
    document.body.classList.toggle('remote-mode', projectorConnected);
    applyRemoteMuteState();
    // One "Open projector view" button per stage (Explore/Practice/Create/
    // Perform) so the teacher can start it from wherever they already are —
    // all four share the .projector-status-dot class and stay in sync together.
    const menuItem = document.getElementById('projectorMenuItem');
    if (menuItem) {
        menuItem.innerHTML = projectorConnected
            ? '<i class="fa-solid fa-power-off"></i> Stop projector'
            : '<i class="fa-solid fa-display"></i> Projector mode';
    }
    document.querySelectorAll('.projector-status-dot').forEach(dot => {
        dot.classList.toggle('connected', projectorConnected);
        dot.title = projectorConnected ? 'Projector connected' : 'Projector not connected';
        dot.querySelector('span').textContent = projectorConnected ? 'Projector connected' : 'Open projector view';
    });
}

// Only the projector's copy of the video should produce sound — the
// teacher's own device stays muted (but still playing) once connected, and
// un-mutes itself if the projector window closes mid-video.
function applyRemoteMuteState() {
    const video = document.getElementById('chapterVideo');
    if (video) video.muted = projectorConnected;
    if (ytPlayer && typeof ytPlayer.mute === 'function') {
        if (projectorConnected) ytPlayer.mute(); else ytPlayer.unMute();
    }
}

// Re-derives "what should the projector be showing right now" from the
// Explore screen's own reveal state, so a projector that connects (or
// reconnects) mid-step catches up instead of sitting on the waiting screen.
function broadcastCurrentExploreState() {
    if (appState.currentView !== 'explore-stage') return;
    const chapter = getCurrentChapter();

    const wrapupSection = document.getElementById('wrapupSection');
    const drawSection = document.getElementById('drawSection');
    const thinkTalkSection = document.getElementById('thinkTalkSection');
    const storybookSection = document.getElementById('storybookSection');
    const videoCard = document.getElementById('videoPlayerCard');

    if (wrapupSection.classList.contains('revealed')) {
        broadcastToProjector({ type: 'wrapup' });
    } else if (drawSection.classList.contains('revealed')) {
        broadcastToProjector({ type: 'draw' });
        if (drawTimerRunning || drawTimerSeconds < DRAW_TIMER_TOTAL) broadcastDrawTimer();
    } else if (thinkTalkSection.classList.contains('revealed')) {
        const highlighted = document.querySelector('.think-card.highlighted');
        broadcastToProjector({ type: 'thinktalk', cardIndex: highlighted ? parseInt(highlighted.dataset.index, 10) : 0 });
    } else if (storybookSection.classList.contains('revealed')) {
        broadcastToProjector({ type: 'storybook', pageIndex: storybookIndex });
    } else if (videoCard.style.display !== 'none') {
        broadcastToProjector(chapter.videoYoutubeId
            ? { type: 'video-load', youtubeId: chapter.videoYoutubeId }
            : { type: 'video-load', src: `${HappyMindsConfig.VIDEO_BASE_URL}/${chapter.video}` });
    } else {
        broadcastToProjector({ type: 'settle' });
    }
}

// Same catch-up idea as broadcastCurrentExploreState(), one per stage —
// dispatches by whichever stage view is currently active.
function broadcastCurrentState() {
    if (appState.currentView === 'explore-stage') broadcastCurrentExploreState();
    else if (appState.currentView === 'practice-stage') broadcastCurrentPracticeState();
    else if (appState.currentView === 'create-stage') broadcastCurrentCreateState();
    else if (appState.currentView === 'perform-stage') broadcastCurrentPerformState();
}

// Chapter 1 runs its own dedicated Noun Detective module instead of this
// generic template (see chapter1-practice.js) — nothing to re-sync here for
// that case. Re-sending the activity's opening state is a deliberate
// simplification: a projector reconnecting mid-activity gets the current
// game back, just not exactly which tiles were already placed.
function broadcastCurrentPracticeState() {
    if (appState.currentChapterId === 1) {
        if (typeof chapter1Practice !== 'undefined') chapter1Practice.broadcastCurrentState();
        return;
    }
    const activity = appState.practiceActivities[appState.practiceStepIndex];
    if (activity) broadcastPracticeActivity(activity);
}

function broadcastCurrentCreateState() {
    const chapter = getCurrentChapter();
    const checkSection = document.getElementById('createCheckSection');
    const writeSection = document.getElementById('createWriteSection');
    const modelSection = document.getElementById('createModelSection');
    const starterSection = document.getElementById('createStarterSection');

    if (checkSection.classList.contains('revealed')) {
        broadcastToProjector({ type: 'create-check' });
    } else if (writeSection.classList.contains('revealed')) {
        broadcastToProjector({ type: 'create-write', wallWords: getLumoraWallWords(chapter.id) });
    } else if (modelSection.classList.contains('revealed')) {
        broadcastToProjector({ type: 'create-model', sentenceIndex: createModelIndex });
    } else if (starterSection.classList.contains('revealed')) {
        broadcastToProjector({ type: 'create-starter' });
    } else {
        broadcastToProjector({ type: 'create-ritual', wallWords: getLumoraWallWords(chapter.id) });
    }
}

function broadcastCurrentPerformState() {
    const closeSection = document.getElementById('performCloseSection');
    const stageSection = document.getElementById('performStageSection');
    const pairSection = document.getElementById('performPairSection');

    if (closeSection.classList.contains('revealed')) {
        broadcastToProjector({ type: 'perform-close' });
    } else if (stageSection.classList.contains('revealed')) {
        broadcastToProjector({ type: 'perform-spotlight', name: null });
    } else if (pairSection.classList.contains('revealed')) {
        broadcastToProjector({ type: 'perform-pair', seconds: pairTimerSeconds, totalSeconds: 240 });
    } else {
        broadcastToProjector({ type: 'perform-frame' });
    }
}

// ================= VIEW 4: Explore (Video & Think/Talk) =================

// YouTube IFrame API state. A chapter with a `videoYoutubeId` plays through a
// real YT.Player (so we can detect "ended" via its state-change event); other
// chapters keep using the plain <video> pointed at VIDEO_BASE_URL.
let ytPlayer = null;
let ytApiReady = false;
let pendingYoutubeId = null;

function onYouTubeIframeAPIReady() {
    ytApiReady = true;
    if (pendingYoutubeId) {
        const id = pendingYoutubeId;
        pendingYoutubeId = null;
        loadYoutubeVideo(id);
    }
}

function loadYoutubeVideo(videoId) {
    if (!ytApiReady) {
        pendingYoutubeId = videoId;
        return;
    }
    if (ytPlayer) {
        // cue, not load: the video waits for Play instead of starting on its own.
        ytPlayer.cueVideoById(videoId);
        applyRemoteMuteState();
        return;
    }
    ytPlayer = new YT.Player('chapterYoutubePlayer', {
        videoId,
        playerVars: { rel: 0 },
        events: {
            onReady: () => applyRemoteMuteState(),
            onStateChange: (event) => {
                if (event.data === YT.PlayerState.ENDED) {
                    onChapterVideoEnded();
                    updateRemoteVideoBtn(false);
                    stopRemoteProgressPoll();
                } else if (event.data === YT.PlayerState.PLAYING) {
                    // YouTube can start a moment after a pause was asked for
                    // (pause is ignored while buffering): keep it stopped and
                    // tell the projector nothing.
                    if (Date.now() - videoPauseRequestedAt < 4000 || appState.currentView !== 'explore-stage') {
                        ytPlayer.pauseVideo();
                        return;
                    }
                    broadcastToProjector({ type: 'video-cmd', action: 'play' });
                    updateRemoteVideoBtn(true);
                    startRemoteProgressPoll();
                } else if (event.data === YT.PlayerState.PAUSED) {
                    broadcastToProjector({ type: 'video-cmd', action: 'pause' });
                    updateRemoteVideoBtn(false);
                    stopRemoteProgressPoll();
                }
            }
        }
    });
}

// ---------- Remote Mode: video transport controls ----------
// The underlying <video>/YT player keeps playing even while visually hidden
// on the teacher's screen (display:none does not pause playback) — these
// functions just drive that same player, the same way the native controls
// always did, so onplay/onpause/ontimeupdate keep firing normally.
let remoteProgressInterval = null;

function remoteVideoToggle() {
    const chapter = getCurrentChapter();
    videoPauseRequestedAt = 0;
    if (chapter.videoYoutubeId && ytPlayer) {
        const state = ytPlayer.getPlayerState();
        if (state === YT.PlayerState.PLAYING) { ytPlayer.pauseVideo(); return; }
        ytPlayer.playVideo();
    } else {
        const video = document.getElementById('chapterVideo');
        if (!video.paused) { video.pause(); return; }
        video.play();
    }
    broadcastToProjector({ type: 'video-cmd', action: 'play', video: chapterVideoSource() });
}

function remoteVideoSeek(deltaSeconds) {
    const chapter = getCurrentChapter();
    if (chapter.videoYoutubeId && ytPlayer) {
        ytPlayer.seekTo(Math.max(0, ytPlayer.getCurrentTime() + deltaSeconds), true);
        updateRemoteVideoProgress();
    } else {
        const video = document.getElementById('chapterVideo');
        video.currentTime = Math.max(0, video.currentTime + deltaSeconds);
    }
    broadcastToProjector({ type: 'video-cmd', action: 'seek', delta: deltaSeconds, video: chapterVideoSource() });
}

function remoteVideoReplay() {
    const chapter = getCurrentChapter();
    videoPauseRequestedAt = 0;
    if (chapter.videoYoutubeId && ytPlayer) {
        ytPlayer.seekTo(0, true);
        ytPlayer.playVideo();
    } else {
        const video = document.getElementById('chapterVideo');
        video.currentTime = 0;
        video.play();
    }
    broadcastToProjector({ type: 'video-cmd', action: 'replay', video: chapterVideoSource() });
}

function updateRemoteVideoBtn(isPlaying) {
    const btn = document.getElementById('videoRemotePlayBtn');
    if (!btn) return;
    btn.innerHTML = isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
}

function updateRemoteVideoProgress() {
    const fill = document.getElementById('videoRemoteProgressFill');
    const currentLabel = document.getElementById('videoRemoteTimeCurrent');
    const totalLabel = document.getElementById('videoRemoteTimeTotal');
    if (!fill) return;
    const chapter = getCurrentChapter();
    let current, duration;
    if (chapter.videoYoutubeId && ytPlayer && ytPlayer.getDuration) {
        current = ytPlayer.getCurrentTime();
        duration = ytPlayer.getDuration();
    } else {
        const video = document.getElementById('chapterVideo');
        current = video.currentTime;
        duration = video.duration;
    }
    if (!duration || isNaN(duration)) return;
    fill.style.width = `${Math.min(100, (current / duration) * 100)}%`;
    currentLabel.textContent = formatPairTime(Math.floor(current));
    totalLabel.textContent = formatPairTime(Math.floor(duration));
}

// YouTube's iframe never fires a native 'timeupdate' event, so the progress
// label is polled on an interval only while that player is actually playing.
function startRemoteProgressPoll() {
    stopRemoteProgressPoll();
    remoteProgressInterval = setInterval(updateRemoteVideoProgress, 1000);
}

function stopRemoteProgressPoll() {
    if (remoteProgressInterval) { clearInterval(remoteProgressInterval); remoteProgressInterval = null; }
}

// Lumora Storybook read-along: character -> avatar image + display name
const STORYBOOK_CHARACTERS = {
    aanya: { img: 'assets/girl_aanya.png', name: 'Aanya' },
    flame: { img: 'assets/dragon_buddy.png', name: 'Flame' },
    pip: { img: 'assets/pip_bird.jpg', name: 'Pip' }
};

let storybookPages = [];
let storybookIndex = 0;

function renderExploreStage(chapter) {
    document.getElementById('exploreTitle').textContent = `Explore: ${chapter.title}`;

    const video = document.getElementById('chapterVideo');
    const youtubeContainer = document.getElementById('chapterYoutubePlayer');
    const fallback = document.getElementById('videoFallback');
    const storybookSection = document.getElementById('storybookSection');
    const thinkTalkSection = document.getElementById('thinkTalkSection');
    const drawSection = document.getElementById('drawSection');
    const wrapupSection = document.getElementById('wrapupSection');

    // Step 1 (Settle & Breathe) gates the video — reset to that state first.
    document.getElementById('settleSection').style.display = 'flex';
    document.getElementById('videoPlayerCard').style.display = 'none';
    playRitualChime();
    storybookSection.classList.remove('revealed');
    thinkTalkSection.classList.remove('revealed');
    drawSection.classList.remove('revealed');
    wrapupSection.classList.remove('revealed');
    fallback.classList.remove('shown');

    if (chapter.videoYoutubeId) {
        video.style.display = 'none';
        video.pause();
        youtubeContainer.style.display = 'block';
        loadYoutubeVideo(chapter.videoYoutubeId);
    } else {
        youtubeContainer.style.display = 'none';
        video.style.display = 'block';
        video.pause();
        video.currentTime = 0;
        video.src = `${HappyMindsConfig.VIDEO_BASE_URL}/${chapter.video}`;
        video.load();
    }

    storybookPages = chapter.storybook || [];
    storybookIndex = 0;
    if (storybookPages.length) renderStorybookPage();

    document.getElementById('thinkTalkGrid').innerHTML = chapter.thinkTalk.map((q, i) => `
        <div class="think-card" data-index="${i}" onclick="highlightCard(this)">
            <div class="card-num">${i + 1}</div>
            <p>${q}</p>
        </div>`).join('');

    renderExploreActivity(chapter);
    pauseDrawTimer();
    drawTimerSeconds = DRAW_TIMER_TOTAL;
    renderDrawTimer();
    renderLumoraWall();
    broadcastToProjector({ type: 'settle' });
}

// The Explore activity card (on paper, with a projector timer) shows this
// chapter's own hands-on task and roving prompts from its script.
function renderExploreActivity(chapter) {
    const activity = chapter.prep && chapter.prep.session1Script.find(s => s.step === chapter.prep.activityStep);
    const say = activity && activity.lines.find(l => l.type === 'teacher_says');
    document.getElementById('drawTitle').textContent = activity ? activity.title : 'Class activity';
    document.getElementById('drawInstruction').textContent = say ? `"${say.text}"` : 'Students work on today\'s activity on paper.';

    const prompts = scriptPromptLines(activity);
    document.getElementById('drawRovingCard').hidden = !prompts.length;
    document.getElementById('drawRovingList').innerHTML = prompts
        .map(l => `<li>${l.type === 'support_prompt' ? 'Stuck student? ' : ''}"${escapeReportText(l.text)}"</li>`).join('');
}

// Playing the video (again) brings the projector back to the video screen,
// e.g. the teacher replays it after the class has reached the storybook.
// The projector keeps its place if the same video is already loaded.
// Messages can arrive out of order, so a teacher's play / seek / replay
// carries the video itself: the projector switches to it and acts in one go.
function chapterVideoSource() {
    const chapter = getCurrentChapter();
    return chapter.videoYoutubeId
        ? { youtubeId: chapter.videoYoutubeId }
        : { src: `${HappyMindsConfig.VIDEO_BASE_URL}/${chapter.video}` };
}

function onTeacherVideoPlay() {
    videoPauseRequestedAt = 0;
    broadcastToProjector({ type: 'video-cmd', action: 'play', video: chapterVideoSource() });
    updateRemoteVideoBtn(true);
}

// The chapter video only plays during the video step: moving on to the
// storybook (or leaving the lesson) stops it, so neither this device nor the
// projector carries on playing it in the background.
// When the class moved on (ms). A start within a few seconds of that is
// YouTube's delayed start, not the teacher replaying, so it is undone.
let videoPauseRequestedAt = 0;

function pauseChapterVideo() {
    videoPauseRequestedAt = Date.now();
    const video = document.getElementById('chapterVideo');
    if (video && !video.paused) video.pause();
    // Playing, or still buffering (it would start a moment later).
    if (ytPlayer && typeof ytPlayer.getPlayerState === 'function'
        && [YT.PlayerState.PLAYING, YT.PlayerState.BUFFERING].includes(ytPlayer.getPlayerState())) {
        ytPlayer.pauseVideo();
    }
}

function onChapterVideoEnded() {
    pauseChapterVideo();
    const storybookSection = document.getElementById('storybookSection');
    if (storybookPages.length) {
        storybookSection.classList.add('revealed');
        storybookSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        broadcastToProjector({ type: 'storybook', pageIndex: storybookIndex });
    } else {
        revealThinkTalk();
    }
}

// ================= Storybook read-aloud =================
// The reading itself lives in narration.js (shared with the projector).
// With a projector connected, these buttons make the PROJECTOR read through
// the classroom speakers, and nothing plays on this device; the projector
// reports back whether it is reading, paused or finished. Without a
// projector, this device reads the page itself.
const localNarration = HMNarration.createReader({
    container: () => narrationContainer(),
    onChange: () => updateNarrationControls()
});
let projectorNarrationState = 'idle';

function narrationContainer() {
    return document.getElementById(document.getElementById('storybookCard').classList.contains('illustrated')
        ? 'storybookCaption' : 'storybookPageText');
}

function narrationState() {
    return projectorConnected ? projectorNarrationState : localNarration.state;
}

function renderStorybookCaption(containerEl, text, characterName) {
    containerEl.innerHTML = '';
    if (characterName) {
        const label = document.createElement('span');
        label.className = 'storybook-caption-char';
        label.textContent = characterName;
        containerEl.appendChild(label);
    }
    const p = document.createElement('p');
    p.className = 'storybook-caption-text';
    HMNarration.renderWords(p, text);
    containerEl.appendChild(p);
}

function updateNarrationControls() {
    const play = document.getElementById('storybookPlayBtn');
    const pause = document.getElementById('storybookPauseBtn');
    const stop = document.getElementById('storybookStopBtn');
    if (!play) return;
    const state = narrationState();
    const where = projectorConnected ? ' on the projector' : '';
    const paused = state === 'paused';
    play.hidden = state === 'playing';
    play.innerHTML = paused ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-volume-high"></i>';
    play.title = paused ? `Resume${where}` : `Read this page aloud${where}`;
    play.setAttribute('aria-label', play.title);
    pause.hidden = state !== 'playing';
    pause.title = `Pause${where}`;
    pause.setAttribute('aria-label', pause.title);
    stop.hidden = state === 'idle';
}

// Speaker button: reads from the top; after Pause it resumes.
function storybookNarrationPlay() {
    if (projectorConnected) {
        broadcastToProjector({ type: 'narration', action: 'play', pageIndex: storybookIndex });
        return;
    }
    if (!HMNarration.supported) {
        showNotification('Read-aloud needs a browser with text-to-speech support.');
        return;
    }
    localNarration.play();
}

function storybookNarrationPause() {
    if (projectorConnected) broadcastToProjector({ type: 'narration', action: 'pause' });
    else localNarration.pause();
}

// Stop: ends reading and goes back to the start of the page.
function storybookNarrationStop() {
    if (projectorConnected) broadcastToProjector({ type: 'narration', action: 'stop' });
    else localNarration.stop();
}

function stopStorybookNarration() {
    localNarration.stop();
    if (projectorConnected && projectorNarrationState !== 'idle') broadcastToProjector({ type: 'narration', action: 'stop' });
}

// Messages from the projector about its reading.
function onProjectorNarrationState(msg) {
    projectorNarrationState = msg.state || 'idle';
    updateNarrationControls();
    if (msg.error === 'not-allowed') {
        showNotification('The projector could not play sound. Press "Start projector" on the projector screen, then try again.');
    }
}

function renderStorybookPage() {
    const page = storybookPages[storybookIndex];
    const card = document.getElementById('storybookCard');
    const charFrame = document.getElementById('storybookCharFrame');
    const charImg = document.getElementById('storybookCharImg');

    stopStorybookNarration();

    if (page.character && STORYBOOK_CHARACTERS[page.character]) {
        const char = STORYBOOK_CHARACTERS[page.character];
        charImg.src = char.img;
        charImg.alt = char.name;
        charFrame.classList.remove('empty');
    } else {
        charImg.src = '';
        charImg.alt = '';
        charFrame.classList.add('empty');
    }

    HMNarration.renderWords(document.getElementById('storybookPageText'), page.text);

    card.classList.toggle('illustrated', !!page.image);
    if (page.image) {
        document.getElementById('storybookIllustrationImg').src = page.image;
        const charName = page.character && STORYBOOK_CHARACTERS[page.character] ? STORYBOOK_CHARACTERS[page.character].name : '';
        renderStorybookCaption(document.getElementById('storybookCaption'), page.text, charName);
    }
    updateNarrationControls();

    document.getElementById('storybookPageCounter').textContent = `Page ${storybookIndex + 1} of ${storybookPages.length}`;
    document.getElementById('storybookPrevBtn').disabled = storybookIndex === 0;
    document.getElementById('storybookNextBtn').innerHTML = storybookIndex === storybookPages.length - 1
        ? 'Finish <i class="fa-solid fa-check"></i>'
        : 'Next <i class="fa-solid fa-arrow-right"></i>';

    document.getElementById('storybookDots').innerHTML = storybookPages.map((_, i) =>
        `<span class="storybook-dot ${i === storybookIndex ? 'active' : ''}"></span>`).join('');

    preloadStorybookImages(storybookPages, storybookIndex);
}

// Downloads the next and previous pages' pictures in the background, so on
// slow school Wi-Fi the picture is ready when the teacher taps Next instead
// of the old page's picture staying on screen while the new one loads.
const preloadedStorybookImages = new Map();
function preloadStorybookImages(pages, index) {
    [index + 1, index - 1, index + 2].forEach(i => {
        const src = pages[i] && pages[i].image;
        if (!src || preloadedStorybookImages.has(src)) return;
        const img = new Image();
        img.src = src;
        preloadedStorybookImages.set(src, img);
    });
}

function storybookGo(direction) {
    pauseChapterVideo();
    if (direction === 1 && storybookIndex === storybookPages.length - 1) {
        stopStorybookNarration();
        revealThinkTalk();
        return;
    }
    storybookIndex = Math.max(0, Math.min(storybookPages.length - 1, storybookIndex + direction));
    renderStorybookPage();
    broadcastToProjector({ type: 'storybook', pageIndex: storybookIndex });
}

function revealThinkTalk() {
    pauseChapterVideo();
    const thinkTalkSection = document.getElementById('thinkTalkSection');
    thinkTalkSection.classList.add('revealed');
    thinkTalkSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    broadcastToProjector({ type: 'thinktalk', cardIndex: 0 });
}

function settleFinished() {
    videoPauseRequestedAt = 0;
    document.getElementById('settleSection').style.display = 'none';
    document.getElementById('videoPlayerCard').style.display = 'block';
    const chapter = getCurrentChapter();
    broadcastToProjector(chapter.videoYoutubeId
        ? { type: 'video-load', youtubeId: chapter.videoYoutubeId }
        : { type: 'video-load', src: `${HappyMindsConfig.VIDEO_BASE_URL}/${chapter.video}` });
}

function revealDraw() {
    pauseChapterVideo();
    const drawSection = document.getElementById('drawSection');
    drawSection.classList.add('revealed');
    drawSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    broadcastToProjector({ type: 'draw' });
}

// ---------- Activity timer (7 minutes) ----------
// This device keeps the time and sends the remaining seconds to the
// projector every second (same approach as the Perform pair timer), so
// Pause and Reset take effect on the projector straight away.
const DRAW_TIMER_TOTAL = 420;
let drawTimerSeconds = DRAW_TIMER_TOTAL;
let drawTimerInterval = null;
let drawTimerRunning = false;

function formatTimerSeconds(seconds) {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function broadcastDrawTimer() {
    broadcastToProjector({ type: 'draw-timer', seconds: drawTimerSeconds, totalSeconds: DRAW_TIMER_TOTAL, running: drawTimerRunning });
}

function renderDrawTimer() {
    const display = document.getElementById('drawTimerDisplay');
    const btn = document.getElementById('drawTimerBtn');
    if (!display) return;
    display.textContent = drawTimerSeconds <= 0 ? "Time's up!" : formatTimerSeconds(drawTimerSeconds);
    const started = drawTimerRunning || drawTimerSeconds < DRAW_TIMER_TOTAL;
    if (drawTimerRunning) btn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
    else if (drawTimerSeconds <= 0) btn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Start again';
    else if (started) btn.innerHTML = '<i class="fa-solid fa-play"></i> Resume';
    else btn.innerHTML = '<i class="fa-solid fa-play"></i> Start 7-min timer';
    document.getElementById('drawTimerResetBtn').hidden = !started || drawTimerSeconds <= 0;
}

function pauseDrawTimer() {
    clearInterval(drawTimerInterval);
    drawTimerInterval = null;
    drawTimerRunning = false;
}

function toggleDrawTimer() {
    if (drawTimerRunning) {
        pauseDrawTimer();
    } else {
        if (drawTimerSeconds <= 0) drawTimerSeconds = DRAW_TIMER_TOTAL;
        drawTimerRunning = true;
        drawTimerInterval = setInterval(() => {
            drawTimerSeconds = Math.max(0, drawTimerSeconds - 1);
            if (drawTimerSeconds <= 0) pauseDrawTimer();
            renderDrawTimer();
            broadcastDrawTimer();
        }, 1000);
    }
    renderDrawTimer();
    broadcastDrawTimer();
}

function resetDrawTimer() {
    pauseDrawTimer();
    drawTimerSeconds = DRAW_TIMER_TOTAL;
    renderDrawTimer();
    broadcastDrawTimer();
}

function revealWrapUp() {
    pauseChapterVideo();
    const wrapupSection = document.getElementById('wrapupSection');
    wrapupSection.classList.add('revealed');
    wrapupSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    markStageDone(appState.currentChapterId, 'explore');
    broadcastToProjector({ type: 'wrapup' });
}

function onChapterVideoError() {
    // The real file hasn't been uploaded to VIDEO_BASE_URL yet (Intern D's job).
    // Keep the page testable in the meantime without blocking the flow.
    document.getElementById('chapterVideo').style.display = 'none';
    document.getElementById('videoFallback').classList.add('shown');
}

function simulateVideoWatched() {
    onChapterVideoEnded();
}

function highlightCard(cardEl) {
    pauseChapterVideo();
    document.querySelectorAll('.think-card').forEach(c => c.classList.remove('highlighted'));
    cardEl.classList.add('highlighted');
    broadcastToProjector({ type: 'thinktalk', cardIndex: parseInt(cardEl.dataset.index, 10) });
}

// ================= VIEW 5: Practice (creative activities, not a plain quiz) =================
// Five different mini-games per chapter, sourced from the master list entry
// (vocab / starter / comprehension) plus two shared skill-building word
// banks (nouns, and the Vocabulary Vault word-search list) — no extra
// per-chapter content to author, but a lot more variety than plain MCQ.
const QUIZ_IMAGES = ['assets/floating_castle.png', 'assets/roadmap_bg.png', 'assets/boy_arjun.png', 'assets/girl_aanya.png', 'assets/dragon_buddy.png'];
const WORD_DISTRACTORS = ['Sleep', 'Stop', 'Wait', 'Hide', 'Freeze', 'Ignore', 'Shout', 'Forget'];
const COMPREHENSION_DISTRACTORS = ['Ordinary', 'Boring', 'Dull', 'Confusing', 'Silly', 'Plain', 'Strange', 'Loud'];

// The worksheet's "Vocabulary Vault" word-search list.
const WORD_SEARCH_BANK = ['ANALYZE', 'ASSIST', 'COLLABORATE', 'COLLECT', 'COUNT', 'CULTURE', 'EXAMINE', 'IDENTIFY', 'LABEL', 'LOG', 'MAGNIFY', 'PROCESS', 'STERILIZE', 'STUDY', 'TEST'];

function pickDistractors(pool, exclude, count, seed) {
    const options = pool.filter(w => w.toLowerCase() !== exclude.toLowerCase());
    const picked = [];
    for (let i = 0; i < count; i++) {
        picked.push(options[(seed + i * 3) % options.length]);
    }
    return [...new Set(picked)];
}

function shuffleDeterministic(arr, seed) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = (seed + i * 7) % (i + 1);
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

// A small seeded PRNG (not Math.random) so every chapter's word search and
// noun picks are reproducible instead of reshuffling on every visit.
function seededRandom(seed) {
    let s = (seed % 2147483647 + 2147483647) % 2147483647 || 1;
    return function next() {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

function pickWords(pool, count, seed) {
    const copy = [...pool];
    const picked = [];
    for (let i = 0; i < count && copy.length; i++) {
        const idx = (seed + i * 5) % copy.length;
        picked.push(copy.splice(idx, 1)[0]);
    }
    return picked;
}

function buildWordSearchGrid(words, size, seed) {
    const rand = seededRandom(seed);
    const grid = Array.from({ length: size }, () => Array(size).fill(null));
    const placements = [];
    const dirs = [[0, 1], [1, 0]]; // horizontal (left-to-right) and vertical (top-to-bottom) only

    words.forEach(word => {
        let placed = false;
        for (let attempt = 0; attempt < 250 && !placed; attempt++) {
            const dir = dirs[Math.floor(rand() * dirs.length)];
            const maxR = size - (dir[0] ? word.length : 1);
            const maxC = size - (dir[1] ? word.length : 1);
            if (maxR < 0 || maxC < 0) continue;
            const r0 = Math.floor(rand() * (maxR + 1));
            const c0 = Math.floor(rand() * (maxC + 1));
            const cells = [];
            let ok = true;
            for (let i = 0; i < word.length; i++) {
                const r = r0 + dir[0] * i;
                const c = c0 + dir[1] * i;
                const existing = grid[r][c];
                if (existing && existing !== word[i]) { ok = false; break; }
                cells.push([r, c]);
            }
            if (ok) {
                cells.forEach(([r, c], i) => { grid[r][c] = word[i]; });
                placements.push({ word, cells });
                placed = true;
            }
        }
    });

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (!grid[r][c]) grid[r][c] = letters[Math.floor(rand() * letters.length)];
        }
    }
    return { grid, placements };
}

function buildPracticeActivities(chapter) {
    const seed = chapter.id;
    const image = QUIZ_IMAGES[seed % QUIZ_IMAGES.length];

    const vocabOptions = shuffleDeterministic([
        chapter.vocab.word,
        ...pickDistractors(WORD_DISTRACTORS, chapter.vocab.word, 3, seed + 1)
    ], seed + 1);

    const comprehensionOptions = shuffleDeterministic([
        chapter.comprehension.answer,
        ...pickDistractors(COMPREHENSION_DISTRACTORS, chapter.comprehension.answer, 3, seed)
    ], seed);

    let targetWords = chapter.starter.split(' ');
    let shuffledWords = shuffleDeterministic(targetWords, seed + 3);
    // A shuffle of 2 words or fewer can land back in the original order —
    // reverse it so the activity is never trivially "pre-solved".
    if (shuffledWords.join(' ') === targetWords.join(' ') && targetWords.length > 1) {
        shuffledWords = [...targetWords].reverse();
    }

    const searchWords = pickWords(WORD_SEARCH_BANK, 6, seed + 6);
    const { grid, placements } = buildWordSearchGrid(searchWords, 12, seed + 7);

    const activities = [
        {
            type: 'word-detective',
            icon: 'fa-magnifying-glass',
            title: 'Word Detective',
            clue: chapter.vocab.meaning,
            answer: chapter.vocab.word,
            options: vocabOptions
        }
    ];

    // Sort activity only runs when the chapter's own grammar genuinely
    // splits into two categories (nouns, tenses, etc.) — chapter.practice
    // provides those categories; chapters without one (not every grammar
    // topic is a natural two-bin sort) skip this activity rather than show
    // a wrong or forced one.
    if (chapter.practice && chapter.practice.sortZones) {
        const zones = chapter.practice.sortZones;
        const words = shuffleDeterministic(
            zones.flatMap(zone => zone.words.map(text => ({ text, zone: zone.id }))),
            seed + 2
        );
        activities.push({
            type: 'word-sort',
            icon: 'fa-tags',
            title: chapter.practice.sortTitle || 'Word Sort',
            zones,
            words
        });
    }

    activities.push(
        {
            type: 'sentence-builder',
            icon: 'fa-layer-group',
            title: 'Sentence Builder',
            targetWords,
            shuffledWords
        },
        {
            type: 'word-search',
            icon: 'fa-table-cells',
            title: 'Word Search',
            words: searchWords,
            grid,
            placements
        },
        {
            type: 'quick-check',
            icon: 'fa-circle-question',
            title: 'Quick Check',
            question: chapter.comprehension.question,
            answer: chapter.comprehension.answer,
            options: comprehensionOptions,
            image
        }
    );

    return activities;
}

// Chapter 1 runs its own dedicated "Noun Detective" practice (see
// chapter1-practice.css/.js) instead of the generic 5-activity template —
// this just decides which one is visible. It never rebuilds chapter 1's
// activity state on repeat visits, so a teacher who leaves partway through
// and comes back keeps their progress instead of restarting from screen 1.
function renderPracticeStage(chapter) {
    const isChapter1 = chapter.id === 1;
    document.getElementById('genericPracticeSystem').style.display = isChapter1 ? 'none' : 'block';
    document.getElementById('chapter1PracticeMount').style.display = isChapter1 ? 'block' : 'none';

    if (!isChapter1) {
        appState.practiceActivities = buildPracticeActivities(chapter);
        appState.practiceStepIndex = 0;
        renderPracticeStep();
    }
}

// Bridge called by chapter1-practice.js's goToNextSection() when the
// student finishes all 6 Noun Detective missions and continues onward.
// needsFixItZone is true when the Quick Check step's show-of-hands landed on
// "Few" for any question — the brief's signal to flag this class for Fix It
// Zone follow-up (there's no Fix It Zone module built yet, so for now this
// just surfaces as a teacher-facing notification rather than being silently
// dropped).
function completeChapter1Practice(needsFixItZone) {
    markStageDone(1, 'practice');
    if (needsFixItZone) {
        showNotification('Quick Check: some students found nouns tricky — consider the Fix It Zone for this class.');
    }
    startChapterStage('create');
}

function renderPracticeStep() {
    const activity = appState.practiceActivities[appState.practiceStepIndex];
    const total = appState.practiceActivities.length;
    if (!activity) return;

    document.getElementById('practiceStepIcon').innerHTML = `<i class="fa-solid ${activity.icon}"></i>`;
    document.getElementById('practiceStepTitle').textContent = activity.title;
    document.getElementById('practiceStepCounter').textContent = `Activity ${appState.practiceStepIndex + 1} of ${total}`;

    const dotsContainer = document.getElementById('practiceDotsContainer');
    dotsContainer.innerHTML = '';
    for (let i = 0; i < total; i++) {
        const dot = document.createElement('span');
        dot.className = `dot ${i < appState.practiceStepIndex ? 'done' : ''} ${i === appState.practiceStepIndex ? 'active' : ''}`;
        dotsContainer.appendChild(dot);
    }

    const card = document.getElementById('practiceActivityCard');
    if (activity.type === 'word-detective') {
        renderWordDetectiveCard(card, activity);
    } else if (activity.type === 'word-sort') {
        renderWordSortCard(card, activity);
    } else if (activity.type === 'sentence-builder') {
        renderSentenceBuilderCard(card, activity);
    } else if (activity.type === 'word-search') {
        renderWordSearchCard(card, activity);
    } else {
        renderQuickCheckCard(card, activity);
    }

    broadcastPracticeActivity(activity);
}

// Sends only what the projector needs to re-render the activity's opening
// state — live interactions (a tile placed, a word found) are broadcast
// separately by each activity's own click handler as they happen.
function broadcastPracticeActivity(activity) {
    const payload = {
        type: 'practice-activity',
        activityType: activity.type,
        title: activity.title,
        index: appState.practiceStepIndex,
        total: appState.practiceActivities.length
    };
    if (activity.type === 'word-detective') payload.clue = activity.clue;
    else if (activity.type === 'word-sort') payload.zones = activity.zones.map(z => ({ id: z.id, label: z.label, hint: z.hint }));
    else if (activity.type === 'word-search') { payload.words = activity.words; payload.grid = activity.grid; }
    else if (activity.type === 'quick-check') { payload.question = activity.question; payload.options = activity.options; }
    broadcastToProjector(payload);
}

function practiceFeedbackBannerHtml() {
    return `
        <div class="quiz-feedback-banner" id="practiceFeedbackBanner" style="display:none;">
            <div class="feedback-left">
                <i class="fa-solid fa-circle-check"></i>
                <div>
                    <strong></strong>
                    <span></span>
                </div>
            </div>
            <button class="btn-primary-glowing" id="practiceNextBtn" onclick="nextPracticeStep()">
                Next Activity <i class="fa-solid fa-arrow-right"></i>
            </button>
        </div>`;
}

function showPracticeFeedback(isCorrect, correctMessage, incorrectMessage, nextLabel) {
    const banner = document.getElementById('practiceFeedbackBanner');
    banner.style.display = 'flex';
    banner.className = `quiz-feedback-banner ${isCorrect ? 'green-banner' : 'retry-banner'}`;
    banner.querySelector('strong').textContent = isCorrect ? 'Great work!' : 'Not quite!';
    banner.querySelector('.feedback-left span').textContent = isCorrect ? correctMessage : incorrectMessage;
    banner.querySelector('.feedback-left i').className = `fa-solid ${isCorrect ? 'fa-circle-check' : 'fa-circle-xmark'}`;
    if (nextLabel) {
        document.getElementById('practiceNextBtn').innerHTML = `${nextLabel} <i class="fa-solid fa-arrow-right"></i>`;
    }
}

// --- Activity 1: Word Detective (vocabulary matching) ---
function renderWordDetectiveCard(card, activity) {
    card.innerHTML = `
        <div class="detective-clue">
            <i class="fa-solid fa-magnifying-glass"></i>
            <div>
                <span class="detective-clue-label">The clue:</span>
                <p>"${activity.clue}"</p>
            </div>
        </div>
        <p class="builder-instructions">Which word matches this clue?</p>
        <div class="word-tiles-grid" id="detectiveTiles"></div>
        ${practiceFeedbackBannerHtml()}`;

    const grid = document.getElementById('detectiveTiles');
    activity.options.forEach(word => {
        const btn = document.createElement('button');
        btn.className = 'word-tile';
        btn.textContent = word;
        btn.onclick = () => selectDetectiveWord(btn, word, activity.answer);
        grid.appendChild(btn);
    });
}

function selectDetectiveWord(btn, word, answer) {
    const isCorrect = word === answer;
    document.querySelectorAll('#detectiveTiles .word-tile').forEach(t => {
        t.disabled = true;
        if (t.textContent === answer) t.classList.add('tile-correct');
        else if (t === btn) t.classList.add('tile-wrong');
    });
    showPracticeFeedback(isCorrect, `"${answer}" is right!`, `The correct word was "${answer}".`, 'Next Activity');
    broadcastToProjector({ type: 'practice-result', correct: isCorrect });
}

// --- Activity 2: Word Sort — zones/words come entirely from the chapter's
// own chapter.practice.sortZones, so this renders whatever two categories
// that chapter's grammar actually needs (never hardcoded to nouns). ---
function renderWordSortCard(card, activity) {
    appState.wordSortSelected = null;
    appState.wordSortDone = 0;
    card.innerHTML = `
        <p class="builder-instructions">Click a word, then click the box it belongs in:</p>
        <div class="noun-sort-zones">
            ${activity.zones.map(zone => `
                <button class="noun-zone" data-zone="${zone.id}">
                    <h4>${zone.label}</h4>
                    <span class="noun-zone-hint">${zone.hint}</span>
                    <div class="noun-zone-items" id="zoneItems-${zone.id}"></div>
                </button>`).join('')}
        </div>
        <div class="word-tiles-grid" id="wordSortBank"></div>
        ${practiceFeedbackBannerHtml()}`;

    const bank = document.getElementById('wordSortBank');
    activity.words.forEach(word => {
        const btn = document.createElement('button');
        btn.className = 'word-tile';
        btn.textContent = word.text;
        btn.onclick = () => selectSortTile(btn, word);
        bank.appendChild(btn);
    });

    document.querySelectorAll('.noun-zone').forEach(zone => {
        zone.onclick = () => placeSortTile(zone.dataset.zone, activity);
    });
}

function selectSortTile(btn, word) {
    document.querySelectorAll('#wordSortBank .word-tile').forEach(t => t.classList.remove('tile-selected'));
    btn.classList.add('tile-selected');
    appState.wordSortSelected = { btn, word };
}

function placeSortTile(zoneId, activity) {
    if (!appState.wordSortSelected) return;
    const { btn, word } = appState.wordSortSelected;
    if (word.zone === zoneId) {
        btn.remove();
        const target = document.getElementById(`zoneItems-${zoneId}`);
        const chip = document.createElement('span');
        chip.className = 'noun-zone-chip';
        chip.textContent = word.text;
        target.appendChild(chip);
        appState.wordSortSelected = null;
        appState.wordSortDone++;
        broadcastToProjector({ type: 'practice-sort-placed', zoneId, word: word.text });
        if (appState.wordSortDone === activity.words.length) {
            showPracticeFeedback(true, 'Everything is sorted correctly!', '', 'Next Activity');
            broadcastToProjector({ type: 'practice-result', correct: true });
        }
    } else {
        btn.classList.add('tile-shake');
        setTimeout(() => btn.classList.remove('tile-shake'), 400);
    }
}

// --- Activity 3: Sentence Builder (word-order construction) ---
function renderSentenceBuilderCard(card, activity) {
    appState.builderAssembled = [];
    card.innerHTML = `
        <p class="builder-instructions">Click the words in the right order to build the sentence starter:</p>
        <div class="builder-assembly" id="builderAssembly">
            <span class="builder-placeholder">Your sentence will appear here...</span>
        </div>
        <div class="word-bank" id="builderBank"></div>
        <div class="builder-actions">
            <button class="btn-glass" onclick="resetBuilder()"><i class="fa-solid fa-rotate-left"></i> Reset</button>
        </div>
        ${practiceFeedbackBannerHtml()}`;

    const bank = document.getElementById('builderBank');
    activity.shuffledWords.forEach((word, i) => {
        const btn = document.createElement('button');
        btn.className = 'word-tile';
        btn.textContent = word;
        btn.dataset.index = i;
        btn.onclick = () => pickBuilderWord(btn, word, activity.targetWords);
        bank.appendChild(btn);
    });
}

function renderBuilderAssembly() {
    const assembly = document.getElementById('builderAssembly');
    assembly.innerHTML = appState.builderAssembled.length
        ? appState.builderAssembled.map(w => `<span class="assembled-word">${w}</span>`).join('')
        : '<span class="builder-placeholder">Your sentence will appear here...</span>';
}

function pickBuilderWord(btn, word, targetWords) {
    btn.disabled = true;
    btn.classList.add('tile-used');
    appState.builderAssembled.push(word);
    renderBuilderAssembly();
    broadcastToProjector({ type: 'practice-builder-word', word });

    if (appState.builderAssembled.length === targetWords.length) {
        const isCorrect = appState.builderAssembled.join(' ') === targetWords.join(' ');
        showPracticeFeedback(
            isCorrect,
            'Perfect sentence order!',
            'The word order is a little mixed up — hit Reset and try again.',
            isCorrect ? 'Next Activity' : undefined
        );
        broadcastToProjector({ type: 'practice-result', correct: isCorrect });
        if (!isCorrect) {
            document.getElementById('practiceNextBtn').style.display = 'none';
        }
    }
}

function resetBuilder() {
    appState.builderAssembled = [];
    renderBuilderAssembly();
    document.querySelectorAll('#builderBank .word-tile').forEach(t => {
        t.disabled = false;
        t.classList.remove('tile-used');
    });
    const banner = document.getElementById('practiceFeedbackBanner');
    banner.style.display = 'none';
    document.getElementById('practiceNextBtn').style.display = 'inline-flex';
    broadcastToProjector({ type: 'practice-activity', activityType: 'sentence-builder', title: appState.practiceActivities[appState.practiceStepIndex].title, index: appState.practiceStepIndex, total: appState.practiceActivities.length });
}

// --- Activity 4: Word Search (click the first and last letter of a word) ---
function renderWordSearchCard(card, activity) {
    appState.wordSearchFound = [];
    appState.wordSearchAnchor = null;

    const gridHtml = activity.grid.map((row, r) => row.map((letter, c) =>
        `<button class="ws-cell" data-r="${r}" data-c="${c}" onclick="clickWordSearchCell(${r},${c})">${letter}</button>`
    ).join('')).join('');

    card.innerHTML = `
        <p class="builder-instructions">Click the first letter of a word, then its last letter, to find it:</p>
        <div class="word-search-layout">
            <div class="ws-grid" id="wsGrid" style="grid-template-columns: repeat(${activity.grid.length}, 1fr);">${gridHtml}</div>
            <div class="ws-word-list" id="wsWordList">
                ${activity.words.map(w => `<span class="ws-word" id="ws-word-${w}">${w}</span>`).join('')}
            </div>
        </div>
        ${practiceFeedbackBannerHtml()}`;
}

function clickWordSearchCell(r, c) {
    const btn = document.querySelector(`.ws-cell[data-r="${r}"][data-c="${c}"]`);
    if (!btn || btn.classList.contains('ws-found')) return;
    const activity = appState.practiceActivities[appState.practiceStepIndex];

    if (!appState.wordSearchAnchor) {
        appState.wordSearchAnchor = { r, c };
        btn.classList.add('ws-selecting');
        return;
    }

    const a = appState.wordSearchAnchor;
    const match = activity.placements.find(p => {
        const first = p.cells[0];
        const last = p.cells[p.cells.length - 1];
        const isForward = first[0] === a.r && first[1] === a.c && last[0] === r && last[1] === c;
        const isReverse = last[0] === a.r && last[1] === a.c && first[0] === r && first[1] === c;
        return isForward || isReverse;
    });

    document.querySelectorAll('.ws-selecting').forEach(el => el.classList.remove('ws-selecting'));

    if (match && !appState.wordSearchFound.includes(match.word)) {
        match.cells.forEach(([cr, cc]) => {
            document.querySelector(`.ws-cell[data-r="${cr}"][data-c="${cc}"]`).classList.add('ws-found');
        });
        document.getElementById(`ws-word-${match.word}`).classList.add('ws-word-found');
        appState.wordSearchFound.push(match.word);
        broadcastToProjector({ type: 'practice-word-found', cells: match.cells, word: match.word });

        if (appState.wordSearchFound.length === activity.words.length) {
            showPracticeFeedback(true, 'You found every word!', '', 'Next Activity');
            broadcastToProjector({ type: 'practice-result', correct: true });
        }
    }
    appState.wordSearchAnchor = null;
}

// --- Activity 5: Quick Check (comprehension) ---
function renderQuickCheckCard(card, activity) {
    const letters = ['A', 'B', 'C', 'D'];
    card.innerHTML = `
        <h3 class="question-prompt-title">${activity.question}</h3>
        <div class="quiz-media-wrapper">
            <img src="${activity.image}" alt="Chapter illustration" class="quiz-img-thumbnail">
        </div>
        <div class="options-grid" id="quickCheckOptions"></div>
        ${practiceFeedbackBannerHtml()}`;

    const grid = document.getElementById('quickCheckOptions');
    activity.options.forEach((text, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `<span class="option-letter">${letters[i]}</span><span class="option-text">${text}</span>`;
        btn.onclick = () => selectQuickCheckOption(btn, text, activity.answer);
        grid.appendChild(btn);
    });
}

function selectQuickCheckOption(btn, text, answer) {
    const isCorrect = text === answer;
    document.querySelectorAll('#quickCheckOptions .option-btn').forEach(b => {
        b.disabled = true;
        if (b.querySelector('.option-text').textContent === answer) b.classList.add('correct-preset');
        else if (b === btn) b.classList.add('wrong-preset');
    });
    showPracticeFeedback(isCorrect, "That's right!", `The correct answer is highlighted.`, 'Finish Practice');
    broadcastToProjector({ type: 'practice-result', correct: isCorrect });
}

function nextPracticeStep() {
    appState.practiceStepIndex++;
    if (appState.practiceStepIndex < appState.practiceActivities.length) {
        renderPracticeStep();
    } else {
        markStageDone(appState.currentChapterId, 'practice');
        showNotification('Practice complete! Moving to Create.');
        startChapterStage('create');
    }
}

// ================= VIEW 6: Create (5 steps: Ritual, Starter, Model, Write, Check) =================
let createModelIndex = 0;

function renderCreateStage(chapter) {
    document.getElementById('createTitle').textContent = `Create: ${chapter.title}`;
    document.getElementById('sentenceTargetPill').textContent = `Target: ${chapter.create.target}`;
    playRitualChime();

    // Reset to step 1 — ritual is always-visible, everything after is gated.
    ['createStarterSection', 'createModelSection', 'createWriteSection', 'createCheckSection'].forEach(id => {
        document.getElementById(id).classList.remove('revealed');
    });

    document.getElementById('createStarterText').textContent = `"${chapter.starter}"`;

    createModelIndex = 0;
    renderCreateModelSentence(chapter);

    document.getElementById('createIdeasList').innerHTML = chapter.create.bullets
        .map(b => `<li>${b}</li>`).join('');

    // Roving prompts come from this chapter's own Session 2 (Create) script.
    const createPrompts = chapter.prep
        ? chapter.prep.session2Script.filter(s => s.stage === 'Create').flatMap(scriptPromptLines)
        : [];
    document.getElementById('createRovingPrompts').innerHTML = createPrompts.length
        ? createPrompts.map(l => `<p class="challenge-prompt">${l.type === 'support_prompt' ? 'Stuck writer? ' : ''}"${escapeReportText(l.text)}"</p>`).join('')
        : '<p class="challenge-prompt">Walk around, read over shoulders, and ask each writer one question that helps them add a detail.</p>';

    renderLumoraWall();

    document.getElementById('starterBar').innerHTML = chapter.create.starters.map(s =>
        `<button class="starter-pill" onclick="insertSentenceStarter('${s.replace(/'/g, "\\'")}')">${s}</button>`).join('');

    const targetNum = parseInt(chapter.create.target.match(/\d+/g)?.pop() || '6', 10);
    document.getElementById('sentenceTargetNum').textContent = targetNum;

    const textArea = document.getElementById('storyTextArea');
    textArea.value = '';
    document.getElementById('sentenceCount').textContent = '0';
    renderStoryStudents(chapter);

    document.querySelectorAll('#createCheckSection input[type="checkbox"]').forEach(cb => { cb.checked = false; });

    appState.hintIndex = 0;
    broadcastToProjector({ type: 'create-ritual', wallWords: getLumoraWallWords(chapter.id) });
}

function revealCreateStep(sectionId) {
    const section = document.getElementById(sectionId);
    section.classList.add('revealed');
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const chapter = getCurrentChapter();
    if (sectionId === 'createStarterSection') {
        broadcastToProjector({ type: 'create-starter' });
    } else if (sectionId === 'createModelSection') {
        broadcastToProjector({ type: 'create-model', sentenceIndex: createModelIndex });
    } else if (sectionId === 'createWriteSection') {
        broadcastToProjector({ type: 'create-write', wallWords: getLumoraWallWords(chapter.id) });
    } else if (sectionId === 'createCheckSection') {
        broadcastToProjector({ type: 'create-check' });
    }
}

// Highlights the chapter's noun list inside one model sentence (whole-word,
// case-insensitive) — a lightweight stand-in for the teacher tapping each
// noun by hand as she reads it aloud.
function highlightNouns(sentence, nouns) {
    let html = sentence;
    nouns.forEach(noun => {
        const re = new RegExp(`\\b(${noun})\\b`, 'gi');
        html = html.replace(re, '<strong class="noun-highlight">$1</strong>');
    });
    return html;
}

function renderCreateModelSentence(chapter) {
    // Chapters without a full modelText walkthrough yet fall back to a
    // single-sentence model built from the starter line, rather than
    // crashing the Create stage for every chapter but Chapter 1.
    const sentences = (chapter.create.modelText && chapter.create.modelText.length)
        ? chapter.create.modelText
        : [chapter.starter];
    const nouns = chapter.create.modelNouns || [];

    const textEl = document.getElementById('createModelText');
    textEl.innerHTML = highlightNouns(sentences[createModelIndex], nouns);

    document.getElementById('createModelDots').innerHTML = sentences.map((_, i) =>
        `<span class="storybook-dot ${i === createModelIndex ? 'active' : ''}"></span>`).join('');

    document.getElementById('createModelPrevBtn').disabled = createModelIndex === 0;
    document.getElementById('createModelNextBtn').innerHTML = createModelIndex === sentences.length - 1
        ? 'Continue to Writing <i class="fa-solid fa-arrow-right"></i>'
        : 'Next Sentence <i class="fa-solid fa-arrow-right"></i>';
}

function createModelNext() {
    const chapter = getCurrentChapter();
    const sentenceCount = (chapter.create.modelText && chapter.create.modelText.length) || 1;
    if (createModelIndex === sentenceCount - 1) {
        revealCreateStep('createWriteSection');
        return;
    }
    createModelIndex++;
    renderCreateModelSentence(chapter);
    broadcastToProjector({ type: 'create-model', sentenceIndex: createModelIndex });
}

function createModelPrev() {
    if (createModelIndex === 0) return;
    createModelIndex--;
    renderCreateModelSentence(getCurrentChapter());
    broadcastToProjector({ type: 'create-model', sentenceIndex: createModelIndex });
}

function insertSentenceStarter(starterText) {
    const textArea = document.getElementById('storyTextArea');
    textArea.value = textArea.value.trim() === '' ? `${starterText} ` : `${textArea.value} ${starterText} `;
    textArea.focus();
    analyzeWritingContent();
}

function analyzeWritingContent() {
    const text = document.getElementById('storyTextArea').value.trim();
    const sentences = text ? text.split(/[.!?]+/).filter(s => s.trim().length > 0) : [];
    document.getElementById('sentenceCount').textContent = sentences.length;
    // Feedback on screen always belongs to the text in the box, and an
    // emptied box no longer belongs to the photo that was scanned into it.
    if (!text) storyDeskState.create.photo = null;
    clearStoryFeedback('create');
}

// ================= Student stories: scan → feedback → save =================
// Two "story desks" share this flow: the Create step (in class, for the few
// students the teacher chooses) and the Scan tab (any student, any chapter,
// e.g. a notebook page handed in later). For each story: pick the student,
// scan (or type) it, check the text, Get Feedback, then Save — story, feedback
// and photo go to that student's record (story_submissions), for parent and
// trainer reports. Teacher saves are separate from the 2 chances each
// student has in the student portal.
const STORY_DESKS = {
    create: {
        text: 'storyTextArea', student: 'storyStudentSelect',
        panel: 'aiFeedbackPanel', list: 'aiFeedbackList',
        feedbackBtn: 'storyFeedbackBtn', saveBtn: 'storySaveBtn', saveLabel: 'storySaveLabel',
        chapterId: () => appState.currentChapterId,
        afterSave: chapterId => { analyzeWritingContent(); refreshSavedStories(chapterId); }
    },
    scan: {
        text: 'scanStoryText', student: 'studentSelect',
        panel: 'scanFeedbackPanel', list: 'scanFeedbackList',
        feedbackBtn: 'scanFeedbackBtn', saveBtn: 'scanSaveBtn', saveLabel: 'scanSaveLabel',
        chapterId: () => appState.scanTargetChapterId,
        afterSave: () => onScanStoryInput()
    }
};

// Per desk: feedback for the text in the box, a counter bumped whenever the
// text changes (so a late answer for old text is ignored), and the JPEG of
// the page scanned into the box (null if the story was typed).
const storyDeskState = {
    create: { feedback: null, requestId: 0, photo: null },
    scan: { feedback: null, requestId: 0, photo: null }
};

const deskEl = (desk, part) => document.getElementById(STORY_DESKS[desk][part]);

function storyDeskForTextArea(textAreaId) {
    return Object.keys(STORY_DESKS).find(desk => STORY_DESKS[desk].text === textAreaId) || null;
}

function renderStoryStudents(chapter) {
    const select = document.getElementById('storyStudentSelect');
    select.replaceChildren(new Option('Choose a student…', ''),
        ...HappyMindsConfig.STUDENTS.map(s => new Option(s.name, s.id)));
    storyDeskState.create.photo = null;
    clearStoryFeedback('create');
    refreshSavedStories(chapter.id);
}

// Today's saved stories for this chapter, i.e. this class.
async function refreshSavedStories(chapterId) {
    const list = document.getElementById('storySavedList');
    const reportBtn = document.getElementById('classReportBtn');
    try {
        const today = classDayKey(new Date().toISOString());
        const stories = (await HMCloud.listStories({ chapterId, source: 'teacher' }))
            .filter(s => classDayKey(s.created_at) === today);
        if (chapterId !== appState.currentChapterId) return;
        const names = [...new Set(stories.map(s => s.student_id))].map(studentName);
        list.innerHTML = names.length
            ? names.map(name => `<span class="story-saved-chip"><i class="fa-solid fa-check"></i> ${escapeReportText(name)}</span>`).join('')
            : '<span class="story-saved-empty">No stories saved in this class yet</span>';
        reportBtn.hidden = !stories.length;
    } catch (err) {
        list.innerHTML = '';
        reportBtn.hidden = true;
    }
}

function studentName(studentId) {
    return HappyMindsConfig.STUDENTS.find(s => s.id === studentId)?.name || studentId;
}

// A class is one chapter taught on one day (in the teacher's time zone).
function classDayKey(iso) {
    return new Date(iso).toLocaleDateString('en-CA');
}

function clearStoryFeedback(desk = 'create') {
    const state = storyDeskState[desk];
    state.feedback = null;
    state.requestId++;
    deskEl(desk, 'panel').classList.remove('shown');
    setStoryFeedbackBusy(desk, false);
    updateStorySaveButton(desk);
}

function setStoryFeedbackBusy(desk, busy) {
    const btn = deskEl(desk, 'feedbackBtn');
    btn.disabled = busy;
    btn.innerHTML = busy
        ? '<i class="fa-solid fa-spinner fa-spin"></i> Reading the story…'
        : '<i class="fa-solid fa-comment-dots blue"></i> Get Feedback';
}

function updateStorySaveButton(desk = 'create') {
    const student = HappyMindsConfig.STUDENTS.find(s => s.id === deskEl(desk, 'student').value);
    const btn = deskEl(desk, 'saveBtn');
    btn.hidden = !storyDeskState[desk].feedback;
    btn.disabled = !student;
    deskEl(desk, 'saveLabel').textContent = student ? `Save to ${student.name}` : 'Choose a student to save';
}

function renderStoryFeedback(desk, feedback) {
    const rows = [['What went well', feedback.praise], ['Try this next time', feedback.tip], ['Think about', feedback.question]];
    deskEl(desk, 'list').innerHTML = rows
        .map(([label, text]) => `<dt>${label}</dt><dd>${escapeReportText(text)}</dd>`).join('');
    deskEl(desk, 'panel').classList.add('shown');
}

function storyErrorMessage(err, action) {
    if (err && err.code === 'offline') return "Couldn't reach Happy Minds. Check the internet connection and try again.";
    if (err && err.code === 'busy') return 'The story helper is busy right now. Please try again in a minute.';
    return `Couldn't ${action} right now. Please try again.`;
}

async function requestStoryFeedback(desk = 'create') {
    const text = deskEl(desk, 'text').value.trim();
    if (!text) {
        showNotification("Scan or type the student's story first.");
        return;
    }
    const state = storyDeskState[desk];
    clearStoryFeedback(desk);
    const requestId = state.requestId;
    setStoryFeedbackBusy(desk, true);
    try {
        const feedback = await HMCloud.storyFeedback(getChapterById(STORY_DESKS[desk].chapterId()), text);
        if (requestId !== state.requestId) return;
        state.feedback = feedback;
        renderStoryFeedback(desk, feedback);
        updateStorySaveButton(desk);
    } catch (err) {
        if (requestId === state.requestId) showNotification(storyErrorMessage(err, 'get feedback'));
    } finally {
        if (requestId === state.requestId) setStoryFeedbackBusy(desk, false);
    }
}

async function saveStudentStory(desk = 'create') {
    const state = storyDeskState[desk];
    const select = deskEl(desk, 'student');
    const student = HappyMindsConfig.STUDENTS.find(s => s.id === select.value);
    const textArea = deskEl(desk, 'text');
    const text = textArea.value.trim();
    if (!student || !state.feedback || !text) return;

    const chapterId = STORY_DESKS[desk].chapterId();
    deskEl(desk, 'saveBtn').disabled = true;
    deskEl(desk, 'saveLabel').textContent = 'Saving…';
    try {
        await HMCloud.saveStory(student.id, chapterId, text, state.feedback, state.photo);
        showNotification(`Saved ${student.name}'s story and feedback.`);
        textArea.value = '';
        select.value = '';
        state.photo = null;
        STORY_DESKS[desk].afterSave(chapterId);
    } catch (err) {
        showNotification(storyErrorMessage(err, 'save the story'));
        updateStorySaveButton(desk);
    }
}

function finishCreateStage() {
    markStageDone(appState.currentChapterId, 'create');
    startChapterStage('perform');
}

// ================= Class Story Report (PDF) =================
// One class = one chapter on one day. The report has every story a teacher
// saved in that class: the student, the photo of their page, the story as
// written, and the feedback. It opens as a clean page and the browser's
// print dialog saves it as a PDF (works on phones too). Photos are deleted
// 7 days after a class, so later reports keep the text and say so.
const STORY_PHOTO_KEEP_DAYS = 7;

async function openClassReport(chapterId, dayKey) {
    // Open the tab now, while this is still the teacher's click — browsers
    // block pop-ups opened after waiting for the network.
    const w = window.open('', '_blank');
    if (!w) {
        showNotification('Allow pop-ups for this site to download the class report.');
        return;
    }
    w.document.write('<!DOCTYPE html><html><head><title>Preparing class report…</title></head><body style="font-family:Arial,sans-serif;padding:32px;color:#1F2937;">Preparing the class report…</body></html>');
    w.document.close();

    try {
        const stories = (await HMCloud.listStories({ chapterId, source: 'teacher' }))
            .filter(s => classDayKey(s.created_at) === dayKey)
            .reverse(); // in the order they were scanned
        const photoUrls = await HMCloud.storyPhotoUrls(stories.map(s => s.photo_path).filter(Boolean));
        w.document.open();
        w.document.write(buildClassReportHtml(getChapterById(chapterId), dayKey, stories, photoUrls));
        w.document.close();
        // Wait for the photos (but not forever on slow Wi-Fi) so they're in the PDF.
        const photosLoaded = Promise.all([...w.document.images].map(img => img.complete
            ? null
            : new Promise(resolve => { img.onload = img.onerror = resolve; })));
        await Promise.race([photosLoaded, new Promise(resolve => setTimeout(resolve, 15000))]);
        w.focus();
        w.print();
    } catch (err) {
        console.warn('Class report failed', err);
        w.document.open();
        w.document.write('<!DOCTYPE html><html><head><title>Class report</title></head><body style="font-family:Arial,sans-serif;padding:32px;color:#1F2937;">Couldn\'t load the class report. Check the internet connection, close this tab and try again.</body></html>');
        w.document.close();
    }
}

function buildClassReportHtml(chapter, dayKey, stories, photoUrls) {
    const day = new Date(`${dayKey}T12:00:00`);
    const longDate = day.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const photosGoneAfter = new Date(day.getTime() + STORY_PHOTO_KEEP_DAYS * 24 * 60 * 60 * 1000);
    const photosGone = Date.now() > photosGoneAfter.getTime();
    const teachers = [...new Set(stories.map(s => HappyMindsConfig.ACCOUNTS.find(a => a.id === s.created_by)?.name).filter(Boolean))];
    const chapterLabel = `Chapter ${chapter.id}: ${chapter.title}`;

    const photoHtml = story => {
        const url = story.photo_path && photoUrls[story.photo_path];
        if (url) return `<img src="${escapeReportText(url)}" alt="Photo of ${escapeReportText(studentName(story.student_id))}'s handwritten story">`;
        const why = photosGone
            ? `Photo deleted ${STORY_PHOTO_KEEP_DAYS} days after the class. The story text is kept.`
            : (story.photo_path ? 'Photo could not be loaded.' : 'No photo — this story was typed in.');
        return `<div class="no-photo">${why}</div>`;
    };

    const storyHtml = story => {
        const f = story.feedback || {};
        const time = new Date(story.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        return `
            <section class="story">
                <h2>${escapeReportText(studentName(story.student_id))}<span>${time}</span></h2>
                <div class="story-grid">
                    <div class="photo">${photoHtml(story)}</div>
                    <div>
                        <h3>Story as written</h3>
                        <p class="story-text">${escapeReportText(story.story_text)}</p>
                        <h3>Feedback</h3>
                        <dl>
                            <dt>What went well</dt><dd>${escapeReportText(f.praise)}</dd>
                            <dt>Try this next time</dt><dd>${escapeReportText(f.tip)}</dd>
                            <dt>Think about</dt><dd>${escapeReportText(f.question)}</dd>
                        </dl>
                    </div>
                </div>
            </section>`;
    };

    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
        <title>Class Story Report - Chapter ${chapter.id} - ${dayKey}</title>
        <style>
            @page { size: A4; margin: 14mm; }
            * { box-sizing: border-box; }
            body { font-family: Arial, Helvetica, sans-serif; color: #1F2937; margin: 0 auto; max-width: 820px; padding: 28px; }
            header { border-bottom: 2px solid #0EA5E9; padding-bottom: 12px; margin-bottom: 4px; }
            .brand { font-size: 12px; font-weight: bold; color: #0EA5E9; text-transform: uppercase; letter-spacing: 1px; }
            h1 { font-size: 22px; margin: 4px 0 6px; }
            .meta { font-size: 13px; color: #4B5563; margin: 0; }
            .note { font-size: 11px; color: #6B7280; margin: 6px 0 0; }
            .story { break-inside: avoid; page-break-inside: avoid; border-bottom: 1px solid #E5E7EB; padding: 16px 0; }
            h2 { font-size: 17px; margin: 0 0 10px; display: flex; justify-content: space-between; align-items: baseline; }
            h2 span { font-size: 12px; font-weight: normal; color: #6B7280; }
            .story-grid { display: grid; grid-template-columns: 42% 1fr; gap: 18px; align-items: start; }
            .photo img { width: 100%; max-height: 115mm; object-fit: contain; border: 1px solid #E5E7EB; border-radius: 6px; display: block; }
            .no-photo { border: 1px dashed #CBD5E1; border-radius: 6px; padding: 18px 12px; font-size: 12px; color: #6B7280; text-align: center; }
            h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6B7280; margin: 0 0 4px; }
            h3 + * { margin-top: 0; }
            .story-text { white-space: pre-wrap; font-size: 13px; line-height: 1.55; margin: 0 0 12px; }
            dl { margin: 0; }
            dt { font-size: 12px; font-weight: bold; color: #0369A1; margin-top: 6px; }
            dd { margin: 1px 0 0; font-size: 13px; line-height: 1.5; }
            .empty { padding: 32px 0; color: #6B7280; }
            @media (max-width: 600px) { body { padding: 16px; } .story-grid { grid-template-columns: 1fr; } }
            @media print { body { padding: 0; max-width: none; } }
        </style></head><body>
        <header>
            <div class="brand">Happy Minds · Class Story Report</div>
            <h1>${escapeReportText(chapterLabel)}</h1>
            <p class="meta">${escapeReportText(longDate)}${teachers.length ? ` · ${escapeReportText(teachers.join(', '))}` : ''} · ${stories.length} ${stories.length === 1 ? 'story' : 'stories'}</p>
            <p class="note">Stories appear exactly as the students wrote them. Feedback is written by AI and was read by the teacher in class. Photos are kept for ${STORY_PHOTO_KEEP_DAYS} days.</p>
        </header>
        ${stories.length ? stories.map(storyHtml).join('') : '<p class="empty">No stories were saved in this class.</p>'}
        </body></html>`;
}

// Reports page: every class with saved stories, newest first.
async function renderClassReportsList() {
    const list = document.getElementById('classReportsList');
    list.innerHTML = '<p class="prep-readiness-explain">Loading class stories…</p>';
    let stories;
    try {
        stories = await HMCloud.listStories({ source: 'teacher' });
    } catch (err) {
        list.innerHTML = '<p class="prep-readiness-explain">Couldn\'t load class stories. Check the internet connection and open Reports again.</p>';
        return;
    }
    const classes = new Map();
    stories.forEach(s => {
        const key = `${classDayKey(s.created_at)}|${s.chapter_id}`;
        if (!classes.has(key)) classes.set(key, { dayKey: classDayKey(s.created_at), chapterId: s.chapter_id, count: 0 });
        classes.get(key).count++;
    });
    if (!classes.size) {
        list.innerHTML = '<p class="prep-readiness-explain">No class stories yet. Teachers save them on the Create step with Scan Student\'s Writing.</p>';
        return;
    }
    list.innerHTML = [...classes.values()].map(c => {
        const chapter = getChapterById(c.chapterId);
        const date = new Date(`${c.dayKey}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
        return `
            <div class="admin-list-row">
                <span class="admin-list-num">Ch${String(c.chapterId).padStart(2, '0')}</span>
                <span class="admin-list-title">${escapeReportText(chapter ? chapter.title : '')} <span class="class-report-meta">${date} · ${c.count} ${c.count === 1 ? 'story' : 'stories'}</span></span>
                <button class="btn-glass compact" onclick="openClassReport(${c.chapterId}, '${c.dayKey}')">
                    <i class="fa-solid fa-file-pdf"></i> PDF
                </button>
            </div>`;
    }).join('');
}

// ================= Handwriting Scan (OCR) — shared by Create & Perform =================
// Real camera capture + real file upload, then real text extraction:
// the `stories` Edge Function (Claude Haiku, via HMCloud.readStoryPhoto),
// or Tesseract.js in the browser if that can't be reached. Tesseract is built
// for clean printed text — on real handwriting it doesn't fail quietly, it
// produces confident-looking noise (e.g. ": | ~& a ol | WA) NT SR SE ..."),
// which is worse than no result at all if it gets inserted as if it were
// the student's story. looksLikeGibberish() below is the guard against
// that: a failed read must show as a failure, never as fabricated text.
let ocrScanTargetId = null;
let ocrCameraStream = null;
let ocrCapturedImageSrc = null;
let tesseractLoadPromise = null;

function openOcrScanModal(targetTextareaId) {
    ocrScanTargetId = targetTextareaId;
    resetOcrModalUi();
    document.getElementById('ocrScanModal').classList.add('active-modal');
}

function closeOcrScanModal() {
    stopOcrCameraStream();
    document.getElementById('ocrScanModal').classList.remove('active-modal');
}

function resetOcrModalUi() {
    stopOcrCameraStream();
    ocrCapturedImageSrc = null;

    const area = document.getElementById('ocrScanArea');
    area.style.display = 'flex';
    area.innerHTML = `
        <i class="fa-solid fa-camera camera-large-icon"></i>
        <p>Position the handwritten page in frame</p>
        <span class="ocr-accuracy-note">Clear, well-lit photos work best — always check the result.</span>`;

    document.getElementById('ocrVideo').style.display = 'none';
    document.getElementById('ocrPreviewImg').style.display = 'none';
    document.getElementById('ocrActionsIdle').style.display = 'flex';
    document.getElementById('ocrActionsCamera').style.display = 'none';
    document.getElementById('ocrActionsPreview').style.display = 'none';
}

function stopOcrCameraStream() {
    if (ocrCameraStream) {
        ocrCameraStream.getTracks().forEach(track => track.stop());
        ocrCameraStream = null;
    }
}

// --- Take Photo: a real device camera, not a simulation ---
async function startOcrCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showNotification('This browser has no camera access — use Choose Photo instead.');
        return;
    }
    try {
        ocrCameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    } catch (err) {
        console.warn('Camera access failed or was denied:', err);
        showNotification('Camera unavailable — use Choose Photo instead.');
        return;
    }

    const video = document.getElementById('ocrVideo');
    video.srcObject = ocrCameraStream;
    document.getElementById('ocrScanArea').style.display = 'none';
    video.style.display = 'block';
    document.getElementById('ocrActionsIdle').style.display = 'none';
    document.getElementById('ocrActionsCamera').style.display = 'flex';
}

function stopOcrCamera() {
    stopOcrCameraStream();
    resetOcrModalUi();
}

function captureOcrPhoto() {
    const video = document.getElementById('ocrVideo');
    const canvas = document.getElementById('ocrCanvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    ocrCapturedImageSrc = canvas.toDataURL('image/png');
    stopOcrCameraStream();
    showOcrPreview();
}

// --- Choose Photo: a real file picker, not a placeholder ---
function onOcrFileChosen(event) {
    const file = event.target.files[0];
    event.target.value = ''; // allow choosing the same file again later
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        ocrCapturedImageSrc = reader.result;
        showOcrPreview();
    };
    reader.readAsDataURL(file);
}

function showOcrPreview() {
    document.getElementById('ocrScanArea').style.display = 'none';
    document.getElementById('ocrVideo').style.display = 'none';
    const img = document.getElementById('ocrPreviewImg');
    img.src = ocrCapturedImageSrc;
    img.style.display = 'block';
    document.getElementById('ocrActionsIdle').style.display = 'none';
    document.getElementById('ocrActionsCamera').style.display = 'none';
    document.getElementById('ocrActionsPreview').style.display = 'flex';
}

function retakeOcrPhoto() {
    resetOcrModalUi();
}

// --- Extract Text: real OCR on the captured/chosen image ---
async function extractOcrText() {
    if (!ocrCapturedImageSrc) return;

    document.getElementById('ocrActionsPreview').style.display = 'none';
    const area = document.getElementById('ocrScanArea');
    document.getElementById('ocrPreviewImg').style.display = 'none';
    area.style.display = 'flex';
    area.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin camera-large-icon"></i>
        <p>Reading handwriting...</p>
        <span class="ocr-accuracy-note">This can take a few seconds.</span>`;

    try {
        const photo = await HMCloud.preparePhoto(ocrCapturedImageSrc);
        const text = await requestOcrText(ocrCapturedImageSrc, photo);
        const textarea = document.getElementById(ocrScanTargetId);
        textarea.value = text;
        const desk = storyDeskForTextArea(ocrScanTargetId);
        if (desk) {
            textarea.dispatchEvent(new Event('input'));
            storyDeskState[desk].photo = photo; // saved with the story, for the class report
        }

        closeOcrScanModal();
        showNotification("Text extracted — handwriting recognition isn't perfect, so please check it over.");
    } catch (err) {
        console.warn('OCR could not produce a reliable reading:', err);
        showOcrFailure();
    }
}

function showOcrFailure() {
    const area = document.getElementById('ocrScanArea');
    area.style.display = 'flex';
    area.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation camera-large-icon" style="color:#F87171;"></i>
        <p>Couldn't reliably read this handwriting</p>
        <span class="ocr-accuracy-note">Try a clearer, closer, well-lit photo — or just type the story in directly.</span>`;
    document.getElementById('ocrActionsPreview').style.display = 'none';
    document.getElementById('ocrActionsIdle').style.display = 'flex';
}

async function requestOcrText(imageSrc, photo) {
    try {
        return await HMCloud.readStoryPhoto(photo);
    } catch (err) {
        // The reader looked at the page and found no readable writing: that
        // is the answer — the in-browser reader would only guess.
        if (err.code === 'unreadable') throw err;
        console.warn('Handwriting reader unavailable, falling back to in-browser OCR.', err);
    }

    // In-browser OCR is a real attempt, not a demo — if it can't produce a
    // trustworthy reading, this throws instead of inventing a result.
    return await runTesseractOcr(imageSrc);
}

// Tesseract.js is only fetched the first time a scan actually needs it —
// most sessions may never open this modal, so there is no reason to make
// every page load pay for an OCR engine up front.
function loadTesseract() {
    if (window.Tesseract) return Promise.resolve();
    if (tesseractLoadPromise) return tesseractLoadPromise;
    tesseractLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Could not load the OCR library'));
        document.head.appendChild(script);
    });
    return tesseractLoadPromise;
}

async function runTesseractOcr(imageSrc) {
    await loadTesseract();
    const result = await Tesseract.recognize(imageSrc, 'eng');
    const text = result.data.text.replace(/\s+/g, ' ').trim();
    if (!text || looksLikeGibberish(text)) {
        throw new Error('OCR output failed the plausibility check');
    }
    return text;
}

// Tesseract on real handwriting tends to fail LOUD, not quiet: it outputs
// dense strings of stray punctuation and symbols that are not remotely
// English rather than simply returning nothing. This heuristic catches
// that so the app can say "couldn't read this" instead of inserting noise.
function looksLikeGibberish(text) {
    if (text.length < 3) return true;

    const junkChars = (text.match(/[|~&\\={}§<>[\]^`_]/g) || []).length;
    if (junkChars / text.length > 0.04) return true;

    const letters = (text.match(/[A-Za-z]/g) || []).length;
    if (letters / text.length < 0.6) return true;

    const tokens = text.split(/\s+/).filter(Boolean);
    if (!tokens.length) return true;
    const plausibleWords = tokens.filter(t => /^[A-Za-z][A-Za-z'.,!?-]*$/.test(t)).length;
    return plausibleWords / tokens.length < 0.6;
}

function openRobotHintModal() {
    const hints = getCurrentChapter().create.hints;
    document.getElementById('robotHintText').textContent = hints[appState.hintIndex % hints.length];
    document.getElementById('robotHintModal').classList.add('active-modal');
}

function closeRobotHintModal() {
    document.getElementById('robotHintModal').classList.remove('active-modal');
}

function generateNewHint() {
    appState.hintIndex++;
    const hints = getCurrentChapter().create.hints;
    document.getElementById('robotHintText').textContent = hints[appState.hintIndex % hints.length];
}

// ================= VIEW 7: Perform (4 steps: Feedback Frame, Pair Share, Explorer's Stage, Close) =================
let pairTimerInterval = null;
let pairTimerSeconds = 240; // 4 minutes per partner
let pairTimerRunning = false;
let explorerShareCount = 0;

function renderPerformStage(chapter) {
    document.getElementById('performTitle').textContent = `Perform: ${chapter.title}`;

    const hasWritten = !!getProgress(chapter.id).create;
    document.getElementById('performEmptyState').style.display = hasWritten ? 'none' : 'flex';
    document.getElementById('performStepsLayout').style.display = hasWritten ? 'block' : 'none';
    if (!hasWritten) return;

    ['performPairSection', 'performStageSection', 'performCloseSection'].forEach(id => {
        document.getElementById(id).classList.remove('revealed');
    });

    resetPairTimer();

    explorerShareCount = 0;
    document.getElementById('explorerCount').textContent = '0 explorers have shared';
    document.getElementById('explorerSpotlight').innerHTML = `
        <i class="fa-solid fa-microphone spotlight-icon"></i>
        <p>Ask for a volunteer, then pick their name below.</p>`;
    document.getElementById('explorerVolunteerSelect').innerHTML = HappyMindsConfig.STUDENTS
        .map(s => `<option value="${s.id}">${s.name}</option>`).join('');

    document.getElementById('performReflectionText').value = '';
    broadcastToProjector({ type: 'perform-frame' });
}

function revealPerformStep(sectionId) {
    const section = document.getElementById(sectionId);
    section.classList.add('revealed');
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (sectionId === 'performPairSection') {
        broadcastToProjector({ type: 'perform-pair', seconds: pairTimerSeconds, totalSeconds: 240 });
    } else if (sectionId === 'performStageSection') {
        broadcastToProjector({ type: 'perform-spotlight', name: null });
    } else if (sectionId === 'performCloseSection') {
        broadcastToProjector({ type: 'perform-close' });
    }
}

// ─── Pair Share timer: 4 minutes per partner, teacher starts/switches ───
function formatPairTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function resetPairTimer() {
    clearInterval(pairTimerInterval);
    pairTimerRunning = false;
    pairTimerSeconds = 240;
    document.getElementById('pairTimerDisplay').textContent = formatPairTime(pairTimerSeconds);
    document.getElementById('pairTimerBtn').innerHTML = '<i class="fa-solid fa-play"></i> Start Partner 1';
    broadcastToProjector({ type: 'perform-pair', seconds: pairTimerSeconds, totalSeconds: 240 });
}

function togglePairTimer() {
    const btn = document.getElementById('pairTimerBtn');
    if (pairTimerRunning) {
        clearInterval(pairTimerInterval);
        pairTimerRunning = false;
        btn.innerHTML = '<i class="fa-solid fa-play"></i> Resume';
        return;
    }

    pairTimerRunning = true;
    btn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
    pairTimerInterval = setInterval(() => {
        pairTimerSeconds--;
        document.getElementById('pairTimerDisplay').textContent = formatPairTime(Math.max(0, pairTimerSeconds));
        broadcastToProjector({ type: 'perform-pair', seconds: Math.max(0, pairTimerSeconds), totalSeconds: 240 });
        if (pairTimerSeconds <= 0) {
            clearInterval(pairTimerInterval);
            pairTimerRunning = false;
            showNotification("Time's up for this partner — switch when ready.");
        }
    }, 1000);
}

function switchPairPartner() {
    clearInterval(pairTimerInterval);
    pairTimerRunning = false;
    pairTimerSeconds = 240;
    document.getElementById('pairTimerDisplay').textContent = formatPairTime(pairTimerSeconds);
    document.getElementById('pairTimerBtn').innerHTML = '<i class="fa-solid fa-play"></i> Start Partner 2';
    broadcastToProjector({ type: 'perform-pair', seconds: pairTimerSeconds, totalSeconds: 240 });
}

// ─── Explorer's Stage: teacher-picked volunteers only, never random ───
function spotlightVolunteer() {
    const select = document.getElementById('explorerVolunteerSelect');
    const student = HappyMindsConfig.STUDENTS.find(s => s.id === select.value);
    if (!student) return;

    document.getElementById('explorerSpotlight').innerHTML = `
        <img src="${student.avatar}" alt="${student.name}" class="spotlight-avatar">
        <p class="spotlight-name">🎤 ${student.name}</p>
        <p class="spotlight-applause">👏 👏 👏</p>`;

    explorerShareCount++;
    document.getElementById('explorerCount').textContent =
        `${explorerShareCount} explorer${explorerShareCount === 1 ? '' : 's'} ${explorerShareCount === 1 ? 'has' : 'have'} shared`;

    triggerConfetti();
    markStageDone(appState.currentChapterId, 'perform');
    broadcastToProjector({ type: 'perform-spotlight', name: student.name });
}

// ================= VIEW: Chapter Reflection (teacher, after Session 2) =================
// Shared template — Sections 1-8 and 10-14 are identical for every chapter;
// only Section 9 (common errors) and the grammar-focus text are chapter data
// (chapter.reflection). In the real brief this template lives in an admin
// panel; app.js is the stand-in for that until one exists.
const REFLECTION_TEMPLATE = [
    { id: 1, title: 'Lesson Delivery & Pacing', example: 'Session 1 ran 44 min, Session 2 ran 47 min — Perform overran slightly.', fields: [
        { key: 'session1Minutes', type: 'number_readonly', label: 'Actual time — Session 1 (minutes)' },
        { key: 'session2Minutes', type: 'number_readonly', label: 'Actual time — Session 2 (minutes)' },
        { key: 'longPhase', type: 'text', label: 'Which phase took longer than expected? Why?' },
        { key: 'completedAll', type: 'yesno', label: 'Did you complete all activities in both sessions?' }
    ]},
    { id: 2, title: 'Explore Phase', example: 'Rated 5 — the magic-door hook had the whole class leaning in.', fields: [
        { key: 'hookRating', type: 'rating5', label: "Did the opening hook capture students' imagination?" },
        { key: 'talkParticipation', type: 'percent_band', label: 'How many students participated verbally in Think & Talk?' },
        { key: 'struggleNote', type: 'text', label: 'Did any student struggle to engage? What did you do?' }
    ]},
    { id: 3, title: 'Drawing / Hands-On Activity', example: 'Rated 4 — most students added 6+ details once I modelled one example.', fields: [
        { key: 'drawingEngagement', type: 'rating5', label: 'How engaged were students during the drawing activity?' },
        { key: 'circulated', type: 'yesno', label: 'Did you circulate and crouch next to students while they worked?' }
    ]},
    { id: 4, title: 'Practice Phase — Grammar Spotlight', example: '76-100% — the common vs proper distinction clicked quickly this time.', fields: [
        { key: 'grammarUnderstanding', type: 'percent_band', label: 'Did students understand {grammarFocus} after your explanation?' },
        { key: 'confusingPart', type: 'text', label: 'What part of the rule was most confusing for students?' }
    ]},
    { id: 5, title: 'Practice Phase — Hands-On Practice', example: '51-75% completed it independently; the rest needed one prompt each.', fields: [
        { key: 'practiceCompletion', type: 'percent_band', label: 'What % of students completed the practice activity?' },
        { key: 'helpedStudents', type: 'yesno', label: 'Did you circulate and help students during practice?' }
    ]},
    { id: 6, title: 'Create Phase — Writing', example: '76-100% finished the target sentence count using the starter line.', fields: [
        { key: 'writingCompletion', type: 'percent_band', label: 'What % of students completed the writing task?' },
        { key: 'usedStarter', type: 'yesno', label: 'Did students use the story starter?' }
    ]},
    { id: 7, title: 'Perform Phase — Sharing', example: 'Yes — rated 4 for confidence, two students asked to share twice.', fields: [
        { key: 'allShared', type: 'yesno', label: 'Did every student share with at least one peer?' },
        { key: 'sharingConfidence', type: 'rating5', label: 'How confident were students sharing their work?' }
    ]},
    { id: 8, title: 'Student Understanding & Common Errors', example: 'Rated 4 overall — strong grasp, a few capitalisation slips.', fields: [
        { key: 'overallUnderstanding', type: 'rating5', label: "Overall, how well did students grasp this chapter's focus?" }
    ]},
    { id: 9, title: 'Common Errors Specific to {grammarFocus}', example: 'Mostly the capital-letter slip — flagged for next chapter.', fields: [
        { key: 'errors', type: 'checklist', label: 'Check all that applied in this class' }
    ]},
    { id: 10, title: 'Materials & Preparation', example: 'Yes — printed workbooks the day before, no issues.', fields: [
        { key: 'materialsReady', type: 'yesno', label: 'Did you have all materials ready?' },
        { key: 'materialsNote', type: 'text', label: 'Notes on materials or preparation' }
    ]},
    { id: 11, title: 'Challenges & Difficulties', example: 'Pacing was tight — Think & Talk ran 4 minutes over.', fields: [
        { key: 'challenges', type: 'textarea', label: 'What was challenging this chapter?' }
    ]},
    { id: 12, title: 'Successes & Celebrations', example: 'Two very shy students volunteered for the Explorer’s Stage.', fields: [
        { key: 'successes', type: 'textarea', label: 'What went particularly well?' }
    ]},
    { id: 13, title: 'Action Plan for Next Time', example: 'Model the capital-letter rule with one more example up front.', fields: [
        { key: 'nextChapterNote', type: 'text_readonly', label: 'Next chapter' },
        { key: 'actionPlan', type: 'textarea', label: 'What will you do differently next time?' }
    ]},
    { id: 14, title: 'Overall Rating & Feedback', example: 'Rated 5 — would teach this chapter again as-is.', fields: [
        { key: 'overallRating', type: 'rating5', label: 'Overall rating for this chapter' },
        { key: 'teachAgain', type: 'yesno', label: 'Would you teach this chapter again as-is?' },
        { key: 'comments', type: 'textarea', label: 'Additional comments' }
    ]}
];

function loadReflections() {
    return HMCloud.get(REFLECTION_STORAGE_KEY) || {};
}

function saveReflections() {
    HMCloud.save(REFLECTION_STORAGE_KEY, appState.reflections);
}

function getReflectionDraft(chapterId) {
    if (!appState.reflections[chapterId]) {
        appState.reflections[chapterId] = { submitted: false, answers: {} };
    }
    return appState.reflections[chapterId];
}

function isReflectionPending(chapterId) {
    const chapter = getChapterById(chapterId);
    // Only chapters with real reflection data (currently just chapter 1) can
    // show this reminder — chapters 2-24 don't have reflection content yet.
    if (!chapter || !chapter.reflection) return false;
    return appState.completedChapters.includes(chapterId) && !getReflectionDraft(chapterId).submitted;
}

function openChapterReflection() {
    const chapter = getCurrentChapter();
    if (!chapter.reflection) {
        // No reflection content for this chapter yet — don't block chapter
        // completion on a form that doesn't exist; complete it directly,
        // same as finishChapterPerform() did before Reflection existed.
        showNotification(`The Chapter Reflection for "${chapter.title}" isn't written yet.`);
        markChapterComplete(chapter.id);
        openCelebrationScreen();
        return;
    }
    const draft = getReflectionDraft(chapter.id);
    const nextChapter = getChapterById(chapter.id + 1);

    document.getElementById('reflectionTitle').textContent = `Chapter Reflection: ${chapter.title}`;

    // Pre-filled values the teacher only confirms, per the brief's table.
    const minutes = getTimeReport(chapter.id)[chapter.id] || {};
    const prefills = {
        session1Minutes: Math.round(((minutes.explore || 0) + (minutes.practice || 0)) * 10) / 10,
        session2Minutes: Math.round(((minutes.create || 0) + (minutes.perform || 0)) * 10) / 10,
        nextChapterNote: nextChapter ? `Chapter ${String(nextChapter.id).padStart(2, '0')}: ${nextChapter.title}` : 'This was the final chapter!'
    };

    document.getElementById('reflectionSections').innerHTML = REFLECTION_TEMPLATE.map(section => {
        const title = section.title.replace('{grammarFocus}', chapter.reflection.grammarFocus);
        const fieldsHtml = section.fields.map(field => {
            const label = field.label.replace('{grammarFocus}', chapter.reflection.grammarFocus);
            const value = draft.answers[field.key] !== undefined ? draft.answers[field.key] : prefills[field.key];
            return renderReflectionField(chapter, field, label, value);
        }).join('');

        return `
            <div class="prep-section-card">
                <div class="reflection-section-head">
                    <h3>Section ${section.id}: ${title}</h3>
                    <button class="reflection-example-link" onclick="this.parentElement.nextElementSibling.classList.toggle('shown')">See an example</button>
                </div>
                <p class="reflection-example-text">${section.example}</p>
                ${fieldsHtml}
            </div>`;
    }).join('');

    document.getElementById('reflectionAutosaveNote').textContent =
        draft.submitted ? 'Already submitted for this chapter.' : 'Saves automatically as you go.';

    navigateTo('reflection');
}

function renderReflectionField(chapter, field, label, value) {
    const onChange = `onReflectionFieldChange('${field.key}', this)`;

    if (field.type === 'number_readonly' || field.type === 'text_readonly') {
        return `
            <div class="reflection-field">
                <label>${label} <span class="reflection-prefilled-tag">pre-filled</span></label>
                <p class="reflection-readonly-value">${value != null && value !== '' ? value : '—'}</p>
            </div>`;
    }

    if (field.type === 'rating5') {
        const stars = [1, 2, 3, 4, 5].map(n => `
            <button type="button" class="reflection-star ${value >= n ? 'filled' : ''}" onclick="setReflectionRating('${field.key}', ${n}, this)">★</button>`).join('');
        return `<div class="reflection-field"><label>${label}</label><div class="reflection-stars">${stars}</div></div>`;
    }

    if (field.type === 'percent_band') {
        const bands = ['0-25%', '26-50%', '51-75%', '76-100%'];
        return `
            <div class="reflection-field"><label>${label}</label>
            <div class="reflection-pill-group">${bands.map(b => `
                <button type="button" class="reflection-pill ${value === b ? 'selected' : ''}" onclick="setReflectionPill('${field.key}', '${b}', this)">${b}</button>`).join('')}</div></div>`;
    }

    if (field.type === 'yesno') {
        return `
            <div class="reflection-field"><label>${label}</label>
            <div class="reflection-pill-group">
                <button type="button" class="reflection-pill ${value === 'yes' ? 'selected' : ''}" onclick="setReflectionPill('${field.key}', 'yes', this)">Yes</button>
                <button type="button" class="reflection-pill ${value === 'no' ? 'selected' : ''}" onclick="setReflectionPill('${field.key}', 'no', this)">No</button>
            </div></div>`;
    }

    if (field.type === 'checklist') {
        const items = chapter.reflection.commonErrors;
        const checked = value || [];
        return `
            <div class="reflection-field"><label>${label}</label>
            <div class="checklist-items">${items.map((item, i) => `
                <label class="check-item"><input type="checkbox" ${checked.includes(i) ? 'checked' : ''} onchange="toggleReflectionChecklist('${field.key}', ${i}, this)"> ${item}</label>`).join('')}</div></div>`;
    }

    if (field.type === 'textarea') {
        return `
            <div class="reflection-field"><label>${label}</label>
            <textarea class="reflection-textarea" oninput="${onChange}">${value || ''}</textarea></div>`;
    }

    return `
        <div class="reflection-field"><label>${label}</label>
        <input type="text" class="reflection-text-input" value="${value || ''}" oninput="${onChange}"></div>`;
}

function persistReflectionAnswer(key, value) {
    const draft = getReflectionDraft(getCurrentChapter().id);
    draft.answers[key] = value;
    saveReflections();
}

function onReflectionFieldChange(key, el) {
    persistReflectionAnswer(key, el.value);
}

function setReflectionRating(key, n, el) {
    persistReflectionAnswer(key, n);
    el.closest('.reflection-stars').querySelectorAll('.reflection-star').forEach((star, i) => {
        star.classList.toggle('filled', i < n);
    });
}

function setReflectionPill(key, val, el) {
    persistReflectionAnswer(key, val);
    el.closest('.reflection-pill-group').querySelectorAll('.reflection-pill').forEach(p => p.classList.remove('selected'));
    el.classList.add('selected');
}

function toggleReflectionChecklist(key, index, checkboxEl) {
    const draft = getReflectionDraft(getCurrentChapter().id);
    const current = draft.answers[key] || [];
    draft.answers[key] = checkboxEl.checked ? [...current, index] : current.filter(i => i !== index);
    saveReflections();
}

function submitReflection() {
    const chapter = getCurrentChapter();
    const draft = getReflectionDraft(chapter.id);
    draft.submitted = true;
    draft.submittedAt = new Date().toISOString();
    saveReflections();

    markChapterComplete(chapter.id);
    renderNotificationCenter();
    openCelebrationScreen();
}

// ================= VIEW: Trainer Observation Module =================
const OBSERVE_BEHAVIORS = [
    'Teacher stands and moves around the room',
    'Teacher asks open-ended questions ("What do you see?") instead of giving answers',
    'Teacher listens and repeats student ideas with enthusiasm',
    'Teacher crouches next to students during drawing/writing',
    'Teacher does not lecture for more than 2-3 minutes at a time'
];

const OBSERVE_DIFFERENTIATION = [
    'Teacher helps hesitant students one-on-one',
    'Teacher uses student drawings to scaffold writing',
    'Teacher accepts oral responses from struggling writers',
    'Teacher gives specific praise ("I love how you used purple for the sky")'
];

const OBSERVE_NONNEGOTIABLES = {
    1: [
        'Lesson started with imagination (magic door), not grammar rules.',
        'Students talked freely without raising hands during Explore.',
        'Every student drew something (no blank pages).',
        'The noun explanation was ≤5 minutes and used student examples.'
    ],
    2: [
        'Students wrote at least 2 sentences using the starter.',
        'Every student shared their story with at least one peer.',
        'The teacher gave specific, positive feedback to at least 3 different students.',
        'No student was shamed or corrected harshly for spelling/grammar.'
    ]
};

const OBSERVE_GAPS = [
    { title: 'Talking too much (lecturing)', feedback: "In the Practice phase, try the '30-second rule' — after 30 seconds of talking, ask a question or have students call out examples.", action: 'Give the teacher a sand timer. When it runs out, they stop talking and ask a question.' },
    { title: 'Not circulating', feedback: "During drawing and writing, the teacher's job is to move around like a 'roving coach.' Spend 1-2 minutes per student.", action: 'Practice "roving" with a peer before the next class.' },
    { title: 'Vague feedback', feedback: "Model specific feedback before pair sharing: 'I loved the purple dragon. One cool thing: a river made of honey.'", action: 'Put the feedback frame on the board and practice with a volunteer first.' },
    { title: 'Missing noun connection', feedback: "During Create, remind students: 'Look at your 5 nouns. Use at least 2 in your story.'", action: "Add a checklist to the writing page: 'I used at least 2 nouns from my list.'" },
    { title: 'Pacing issues', feedback: 'Keep a timer visible. If Explore runs over, cut time from drawing, not from sharing — sharing is the celebratory climax.', action: 'Practice the lesson once with a stopwatch beforehand.' }
];

function loadObservations() {
    return HMCloud.get(OBSERVE_STORAGE_KEY) || [];
}

function saveObservations() {
    HMCloud.save(OBSERVE_STORAGE_KEY, appState.observations);
}

let observeDraft = null;

function openObservationPicker() {
    const chapterSelect = document.getElementById('observeChapterSelect');
    const chaptersWithPrep = CHAPTERS.filter(c => c.prep);
    chapterSelect.innerHTML = chaptersWithPrep.map(c => `<option value="${c.id}">Chapter ${String(c.id).padStart(2, '0')} — ${c.title}</option>`).join('');
    renderObserveToday();
    renderObservationHistory();
    navigateTo('observe-picker');
}

// "Before the class" summary — real readiness/prep data for the selected
// chapter, plus the most recent past observation's key area, so the trainer
// walks in already knowing where things stood last time.
function renderObserveToday() {
    const chapterSelect = document.getElementById('observeChapterSelect');
    const card = document.getElementById('observeTodayCard');
    if (!chapterSelect || !chapterSelect.value || !card) return;

    const chapterId = Number(chapterSelect.value);
    const teacher = HappyMindsConfig.ACCOUNTS.find(a => a.role === 'teacher');
    const status = computeReadinessStatus(chapterId);
    const prepMinutes = Math.round(((appState.timeTracking[chapterId] && appState.timeTracking[chapterId].prep) || 0) / 60);
    const labels = { green: 'Ready for class', amber: 'Getting there', red: 'Not opened yet' };
    const lastObs = appState.observations.slice().reverse()[0];

    card.innerHTML = `
        <div class="admin-list-row">
            <img src="${teacher.avatar}" alt="" class="admin-list-avatar">
            <span class="admin-list-title">${teacher.name}</span>
            <span class="readiness-badge readiness-${status}"><span class="readiness-dot"></span> ${labels[status]}</span>
            <span class="admin-list-tag partial">${prepMinutes} min prep logged</span>
        </div>
        ${lastObs
            ? `<p class="prep-readiness-explain" style="margin-top:10px;"><strong>Last visit (${new Date(lastObs.submittedAt).toLocaleDateString()} · ${lastObs.chapterTitle}):</strong> ${lastObs.keyArea || 'no key area recorded'}${lastObs.followUp ? ` — tried: ${lastObs.followUp.tried}` : ' — no 5-minute check-in logged yet'}</p>`
            : `<p class="prep-readiness-explain" style="margin-top:10px;">No previous visits recorded yet.</p>`}`;
}

function renderObservationHistory() {
    const list = document.getElementById('observeHistoryList');
    if (!appState.observations.length) {
        list.innerHTML = '<p class="prep-readiness-explain">No observations submitted yet.</p>';
        return;
    }
    list.innerHTML = appState.observations.slice().reverse().map((obs, i) => `
        <div class="admin-list-row">
            <span class="admin-list-title">${obs.chapterTitle} — Session ${obs.session}</span>
            <span class="admin-list-tag role-teacher">${new Date(obs.submittedAt).toLocaleDateString()}</span>
            <button class="btn-glass compact" title="Print / save as PDF" onclick="printObservationSummary(${i})"><i class="fa-solid fa-file-pdf"></i> PDF</button>
            ${obs.followUp
                ? `<span class="admin-list-tag full">Checked in — tried: ${obs.followUp.tried}</span>`
                : `<button class="btn-glass compact" onclick="openFollowUpModal(${i})"><i class="fa-solid fa-comment-dots"></i> 5-min check-in</button>`}
        </div>`).join('');
}

function openObservationForm() {
    const chapterId = Number(document.getElementById('observeChapterSelect').value);
    const session = Number(document.getElementById('observeSessionSelect').value);
    const chapter = getChapterById(chapterId);

    observeDraft = {
        chapterId, session, chapterTitle: chapter.title,
        protocol: { introduced: false, sat: false, opened: false },
        tally: 0, onTask: 0, bodyLanguage: 0, classSize: HappyMindsConfig.STUDENTS.length,
        partA: {}, partANotes: {}, partB: {}, partD: { note: '' }, partDPlanned: {}, partE: {},
        evidence: {}, nonNeg: {}, coreNotes: ''
    };

    document.getElementById('observeFormTitle').textContent = `Observing: ${chapter.title} — Session ${session}`;

    document.getElementById('observeProtocol').innerHTML = [
        ['introduced', "I introduced myself — here to support and see student engagement"],
        ['sat', 'I sat where I can see the teacher and most students'],
        ['opened', 'I opened this checklist without interrupting the lesson']
    ].map(([key, label]) => `<label class="check-item"><input type="checkbox" onchange="setObserveNested('protocol','${key}',this.checked,null)"> ${label}</label>`).join('');

    const phases = session === 1 ? ['Explore', 'Practice'] : ['Create', 'Perform'];
    document.getElementById('observePartA').innerHTML = phases.map(phase => `
        <div class="reflection-field"><label>${phase}</label>
        <div class="reflection-pill-group">
            ${['Yes', 'Partial', 'No'].map(v => `<button type="button" class="reflection-pill" onclick="setObserveNested('partA','${phase}','${v}',this)">${v}</button>`).join('')}
        </div>
        <textarea class="reflection-textarea" style="margin-top:8px;" placeholder="Notes (optional)" onchange="setObserveNested('partANotes','${phase}',this.value,null)"></textarea>
        </div>`).join('');

    document.getElementById('observePartB').innerHTML = OBSERVE_BEHAVIORS.map((b, i) => `
        <label class="check-item"><input type="checkbox" onchange="setObserveNested('partB', ${i}, this.checked, null)"> ${b}</label>`).join('');

    document.getElementById('observePartE').innerHTML = OBSERVE_DIFFERENTIATION.map((d, i) => `
        <label class="check-item"><input type="checkbox" onchange="setObserveNested('partE', ${i}, this.checked, null)"> ${d}</label>`).join('');

    const minutes = getTimeReport(chapterId)[chapterId] || {};
    const pacingStages = session === 1 ? ['explore', 'practice'] : ['create', 'perform'];
    document.getElementById('observePartD').innerHTML = `
        <div class="observe-pacing-rows">
            ${pacingStages.map(stage => `
            <div class="reflection-field">
                <label style="text-transform:capitalize;">${stage} — planned minutes</label>
                <input type="number" min="0" class="reflection-text-input" style="max-width:120px;" placeholder="e.g. 20"
                       onchange="setObserveNested('partDPlanned','${stage}',this.value,null)">
                <p class="prep-readiness-explain" style="margin-top:6px;">Actual: ${Math.round((minutes[stage] || 0) * 10) / 10} min, logged automatically from the running session</p>
            </div>`).join('')}
        </div>
        <div class="reflection-field"><label>Did the teacher rush or drag any part?</label>
        <input type="text" class="reflection-text-input" id="observePacingNote" onchange="setObserveNested('partD','note',this.value,null)"></div>`;

    const outputLabel = chapter.prep.lessonPlan.studentOutputs[session === 1 ? 'session1' : 'session2'];
    document.getElementById('observeEvidence').innerHTML = `
        <div class="reflection-field"><label>Not a lecture class</label>
        <div class="reflection-pill-group">${['Yes', 'Partly', 'No'].map(v => `<button type="button" class="reflection-pill" onclick="setObserveNested('evidence','notLecture','${v}',this)">${v}</button>`).join('')}</div></div>
        <div class="reflection-field"><label>Explore came before grammar/rules</label>
        <div class="reflection-pill-group">${['Yes', 'No'].map(v => `<button type="button" class="reflection-pill" onclick="setObserveNested('evidence','exploreFirst','${v}',this)">${v}</button>`).join('')}</div></div>
        <div class="reflection-field"><label>Warm, low-pressure room</label>
        <div class="reflection-pill-group">${['Yes', 'No'].map(v => `<button type="button" class="reflection-pill" onclick="setObserveNested('evidence','warmRoom','${v}',this)">${v}</button>`).join('')}</div></div>
        <div class="reflection-field"><label>Session output met: "${outputLabel}"</label>
        <div class="reflection-pill-group">${['All', 'Most', 'Some', 'None'].map(v => `<button type="button" class="reflection-pill" onclick="setObserveNested('evidence','outputCoverage','${v}',this)">${v}</button>`).join('')}</div></div>
        <div class="reflection-field"><label>Examples of student work seen (0-4)</label>
        <input type="number" min="0" max="4" class="reflection-text-input" style="max-width:100px;" onchange="setObserveNested('evidence','examplesSeen',this.value,null)"></div>`;

    document.getElementById('observeNonNegotiables').innerHTML = OBSERVE_NONNEGOTIABLES[session].map((item, i) => `
        <div class="fixit-question-row" data-nn="${i}">
            <p>${item}</p>
            <div class="fixit-yn-buttons">
                <button class="btn-glass compact fixit-yn-btn" data-val="yes" onclick="setNonNegotiable(${i}, 'yes', this)">Yes</button>
                <button class="btn-glass compact fixit-yn-btn" data-val="no" onclick="setNonNegotiable(${i}, 'no', this)">No</button>
            </div>
        </div>`).join('');

    document.getElementById('observeGapsGrid').innerHTML = OBSERVE_GAPS.map((gap, i) => `
        <button type="button" class="observe-gap-card" onclick="applyObserveGap(${i})">${gap.title}</button>`).join('');

    document.getElementById('observeClassSizeChip').textContent = `Class size: ${observeDraft.classSize}`;
    document.getElementById('observeWallChip').textContent = `Lumora Wall words this chapter: ${getLumoraWallWords(chapterId).length}`;
    document.getElementById('observeTallyValue').textContent = '0';
    renderObserveTallyPct();
    renderObserveStars('observeOnTaskStars', 0, 'onTask');
    renderObserveStars('observeBodyStars', 0, 'bodyLanguage');
    document.getElementById('observeDisengagedNote').value = '';
    document.getElementById('observeStrengths').value = '';
    document.getElementById('observeCoreNotes').value = '';
    document.getElementById('observeKeyArea').value = '';
    document.getElementById('observeSuggestion').value = '';
    document.getElementById('observeFollowupTeacher').checked = false;
    document.getElementById('observeFollowupObserver').checked = false;
    document.getElementById('observeSignObserver').value = appState.currentUser.name;
    document.getElementById('observeSignTeacher').value = '';

    navigateTo('observe-form');
}

function setObserveNested(part, key, val, el) {
    observeDraft[part][key] = val;
    if (el) {
        el.closest('.reflection-pill-group').querySelectorAll('.reflection-pill').forEach(p => p.classList.remove('selected'));
        el.classList.add('selected');
    }
}

function setNonNegotiable(i, val, el) {
    observeDraft.nonNeg[i] = val;
    el.closest('.fixit-yn-buttons').querySelectorAll('.fixit-yn-btn').forEach(b => b.classList.remove('selected'));
    el.classList.add('selected');

    // Any "No" is automatically pinned as the priority feedback topic.
    if (val === 'no') {
        const session = observeDraft.session;
        const text = OBSERVE_NONNEGOTIABLES[session][i];
        document.getElementById('observeKeyArea').value = text;
    }
}

function adjustTally(delta) {
    observeDraft.tally = Math.max(0, Math.min(observeDraft.classSize, observeDraft.tally + delta));
    document.getElementById('observeTallyValue').textContent = observeDraft.tally;
    renderObserveTallyPct();
}

function renderObserveTallyPct() {
    const el = document.getElementById('observeTallyPct');
    if (!el) return;
    const pct = observeDraft.classSize ? Math.round((observeDraft.tally / observeDraft.classSize) * 100) : 0;
    el.textContent = `${observeDraft.tally} of ${observeDraft.classSize} students spoke (${pct}%)`;
}

function renderObserveStars(containerId, value, key) {
    const container = document.getElementById(containerId);
    container.innerHTML = [1, 2, 3, 4, 5].map(n => `
        <button type="button" class="reflection-star ${value >= n ? 'filled' : ''}" onclick="setObserveStar('${containerId}','${key}',${n})">★</button>`).join('');
}

function setObserveStar(containerId, key, n) {
    observeDraft[key] = n;
    renderObserveStars(containerId, n, key);
}

function applyObserveGap(i) {
    const gap = OBSERVE_GAPS[i];
    document.getElementById('observeKeyArea').value = gap.title;
    document.getElementById('observeSuggestion').value = gap.feedback;
    document.querySelectorAll('.observe-gap-card').forEach(c => c.classList.remove('selected'));
    document.querySelectorAll('.observe-gap-card')[i].classList.add('selected');
}

// Combines the per-phase notes written in Part A into the Feedback Form's
// "Core model notes" field — matches the paper guide's "Notes from A copied
// into section 2." Editable afterwards, so the trainer can trim or add to it.
function copyCoreModelNotes() {
    const combined = Object.entries(observeDraft.partANotes || {})
        .filter(([, note]) => note)
        .map(([phase, note]) => `${phase}: ${note}`)
        .join('\n');
    document.getElementById('observeCoreNotes').value = combined;
    observeDraft.coreNotes = combined;
}

function submitObservation() {
    observeDraft.disengagedNote = document.getElementById('observeDisengagedNote').value;
    observeDraft.strengths = document.getElementById('observeStrengths').value;
    observeDraft.coreNotes = document.getElementById('observeCoreNotes').value;
    observeDraft.keyArea = document.getElementById('observeKeyArea').value;
    observeDraft.suggestion = document.getElementById('observeSuggestion').value;
    observeDraft.followupTeacher = document.getElementById('observeFollowupTeacher').checked;
    observeDraft.followupObserver = document.getElementById('observeFollowupObserver').checked;
    observeDraft.signObserver = document.getElementById('observeSignObserver').value;
    observeDraft.signTeacher = document.getElementById('observeSignTeacher').value;
    observeDraft.submittedAt = new Date().toISOString();

    appState.observations.push(observeDraft);
    saveObservations();
    openObservationPicker();
    document.getElementById('observeDoneModal').classList.add('active-modal');
}

// ================= Observation follow-up + print =================
// "Five-minute check-in" (Part 4 follow-up in the paper guide): a short,
// separate interaction the trainer does before the teacher's NEXT session,
// re-opened from the observation history rather than kept on the live form.
let followUpObsIndex = null;
let followUpTriedValue = null;

function openFollowUpModal(reversedIndex) {
    followUpObsIndex = appState.observations.length - 1 - reversedIndex;
    followUpTriedValue = null;
    document.getElementById('followUpCheckIn').checked = false;
    document.getElementById('followUpNote').value = '';
    document.querySelectorAll('#followUpTriedPills .reflection-pill').forEach(p => p.classList.remove('selected'));
    document.getElementById('followUpModal').classList.add('active-modal');
}

function closeFollowUpModal() {
    document.getElementById('followUpModal').classList.remove('active-modal');
}

function setFollowUpTried(val, el) {
    followUpTriedValue = val;
    el.closest('.reflection-pill-group').querySelectorAll('.reflection-pill').forEach(p => p.classList.remove('selected'));
    el.classList.add('selected');
}

function saveFollowUp() {
    if (followUpObsIndex === null) return;
    appState.observations[followUpObsIndex].followUp = {
        checkInDone: document.getElementById('followUpCheckIn').checked,
        tried: followUpTriedValue || 'Not recorded',
        note: document.getElementById('followUpNote').value,
        savedAt: new Date().toISOString()
    };
    saveObservations();
    closeFollowUpModal();
    renderObservationHistory();
    renderObserveToday();
    showNotification('Follow-up saved.');
}

// The whole observation form as the trainer filled it in, as a PDF.
function printObservationSummary(reversedIndex) {
    const obs = appState.observations.slice().reverse()[reversedIndex];
    if (!obs) return;
    const e = escapeReportText;
    const answer = v => (v === undefined || v === null || v === '') ? '<span class="na">Not answered</span>' : e(v);
    const yesNo = v => v === true || v === 'yes' ? 'Yes' : v === false || v === 'no' ? 'No' : '<span class="na">Not answered</span>';
    const stars = n => n ? `<span class="reflection-report-stars">${'★'.repeat(n)}<span>${'★'.repeat(5 - n)}</span></span> ${n}/5` : '<span class="na">Not answered</span>';
    const ticks = (items, picked) => `<ul class="ticks">${items.map((t, i) => `<li>${picked && picked[i] ? '✓' : '✗'} ${e(t)}</li>`).join('')}</ul>`;
    const section = (title, rows) => `<section><h2>${title}</h2><dl>${rows.map(([label, html]) => `<dt>${label}</dt><dd>${html}</dd>`).join('')}</dl></section>`;

    const chapter = getChapterById(obs.chapterId);
    const phases = obs.session === 1 ? ['Explore', 'Practice'] : ['Create', 'Perform'];
    const minutes = getTimeReport(obs.chapterId)[obs.chapterId] || {};
    const pct = obs.classSize ? Math.round(((obs.tally || 0) / obs.classSize) * 100) : 0;
    const ev = obs.evidence || {};
    const nonNeg = OBSERVE_NONNEGOTIABLES[obs.session] || [];
    const outputLabel = chapter && chapter.prep ? chapter.prep.lessonPlan.studentOutputs[obs.session === 1 ? 'session1' : 'session2'] : '';

    openPrintPage(`Observation - Chapter ${obs.chapterId} Session ${obs.session} - ${new Date(obs.submittedAt).toISOString().slice(0, 10)}`, `
        <header>
            <div class="brand">Happy Minds · Classroom Observation</div>
            <h1>${e(obs.chapterTitle)} — Session ${obs.session}</h1>
            <p class="meta">Observed by ${e(obs.signObserver || '—')} · ${new Date(obs.submittedAt).toLocaleString()}</p>
        </header>
        ${section('A. Core Model Adherence', phases.map(p => [p, `${answer((obs.partA || {})[p])}${(obs.partANotes || {})[p] ? `<br><span style="font-weight:normal">${e(obs.partANotes[p])}</span>` : ''}`]))}
        ${section('B. Facilitator vs Lecturer', [['Behaviours seen', ticks(OBSERVE_BEHAVIORS, obs.partB)]])}
        ${section('C. Student Engagement', [
            ['Students who spoke', `${obs.tally || 0} of ${obs.classSize} (${pct}%)`],
            ['On-task', stars(obs.onTask)],
            ['Positive body language', stars(obs.bodyLanguage)],
            ['Any disengaged student — what did the teacher do?', answer(obs.disengagedNote)]
        ])}
        ${section('D. Pacing &amp; Time Management', [
            ...(obs.session === 1 ? ['explore', 'practice'] : ['create', 'perform']).map(st => [
                `${st[0].toUpperCase()}${st.slice(1)} — planned vs actual`,
                `${(obs.partDPlanned || {})[st] ? `${e(obs.partDPlanned[st])} min planned` : 'Not planned'} · ${Math.round((minutes[st] || 0) * 10) / 10} min actual`
            ]),
            ['Did the teacher rush or drag any part?', answer((obs.partD || {}).note)]
        ])}
        ${section('E. Differentiation &amp; Support', [['Seen', ticks(OBSERVE_DIFFERENTIATION, obs.partE)]])}
        ${section('Evidence &amp; Expectations', [
            ['Not a lecture class', answer(ev.notLecture)],
            ['Explore came before grammar/rules', answer(ev.exploreFirst)],
            ['Warm, low-pressure room', answer(ev.warmRoom)],
            [`Session output met${outputLabel ? `: "${e(outputLabel)}"` : ''}`, answer(ev.outputCoverage)],
            ['Examples of student work seen (0-4)', answer(ev.examplesSeen)]
        ])}
        ${section('Non-Negotiables', nonNeg.map((item, i) => [e(item), yesNo((obs.nonNeg || {})[i])]))}
        ${section('Feedback', [
            ['Strengths', answer(obs.strengths)],
            ['Core model notes', answer(obs.coreNotes)],
            ['One key area for improvement', answer(obs.keyArea)],
            ['Actionable suggestion', answer(obs.suggestion)],
            ['Teacher will try this in the next session', yesNo(obs.followupTeacher)],
            ['Observer 5-minute check-in before the next class', yesNo(obs.followupObserver)],
            ...(obs.followUp ? [['Check-in', `Done — tried: ${e(obs.followUp.tried)}${obs.followUp.note ? ` — ${e(obs.followUp.note)}` : ''}`]] : [])
        ])}
        <div class="signatures">
            <div><strong>${e(obs.signObserver || '')}&nbsp;</strong>Observer</div>
            <div><strong>${e(obs.signTeacher || '')}&nbsp;</strong>Teacher</div>
        </div>`);
}

function closeObserveDoneModal() {
    document.getElementById('observeDoneModal').classList.remove('active-modal');
}

// ================= Signature Feature: Lumora Wall =================
// v1 is typed input (teacher types what a student says) rather than live
// speech-to-text — voice input needs a real STT provider decision (flagged
// separately), so this ships the fully-working typed version now rather
// than a non-functional voice stub, with Grammar Spotlight sort-mode
// covered by the existing Noun Detective classify/naming screens instead
// of a second competing drag-sort UI.

function loadLumoraWall() {
    return HMCloud.get(LUMORA_WALL_STORAGE_KEY) || {};
}

function saveLumoraWall() {
    HMCloud.save(LUMORA_WALL_STORAGE_KEY, appState.lumoraWall);
}

// Each word is {text, studentId|null}. Defensively upgrades any old plain-
// string entries from before student-tagging existed, so a localStorage
// value saved by an earlier version of this file doesn't crash renderLumoraWall.
function getLumoraWallWords(chapterId) {
    if (!appState.lumoraWall[chapterId]) appState.lumoraWall[chapterId] = [];
    appState.lumoraWall[chapterId] = appState.lumoraWall[chapterId].map(w =>
        typeof w === 'string' ? { text: w, studentId: null } : w);
    return appState.lumoraWall[chapterId];
}

function addLumoraWallWord() {
    const input = document.getElementById('lumoraWallInput');
    const studentSelect = document.getElementById('lumoraWallStudentSelect');
    const word = input.value.trim();
    if (!word) return;
    const studentId = studentSelect && studentSelect.value ? studentSelect.value : null;
    getLumoraWallWords(appState.currentChapterId).push({ text: word, studentId });
    saveLumoraWall();
    input.value = '';
    input.focus();
    renderLumoraWall();
}

function removeLumoraWallWord(index) {
    getLumoraWallWords(appState.currentChapterId).splice(index, 1);
    saveLumoraWall();
    renderLumoraWall();
}

function renderLumoraWall() {
    const words = getLumoraWallWords(appState.currentChapterId);
    const tiles = document.getElementById('lumoraWallTiles');
    if (tiles) {
        tiles.innerHTML = words.length
            ? words.map((w, i) => {
                const student = w.studentId ? HappyMindsConfig.STUDENTS.find(s => s.id === w.studentId) : null;
                return `<span class="lumora-tile">${student ? `<span class="lumora-tile-student">${student.name}:</span> ` : ''}${w.text}<button type="button" onclick="removeLumoraWallWord(${i})" aria-label="Remove">&times;</button></span>`;
            }).join('')
            : '<span class="prep-readiness-explain">No words yet — add one as students call out ideas.</span>';
    }
    const studentSelect = document.getElementById('lumoraWallStudentSelect');
    if (studentSelect && !studentSelect.dataset.populated) {
        studentSelect.innerHTML = '<option value="">Who said it? (optional)</option>' +
            HappyMindsConfig.STUDENTS.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        studentSelect.dataset.populated = 'true';
    }
    const bank = document.getElementById('createWordBank');
    if (bank) {
        bank.innerHTML = words.length
            ? words.map(w => `<span class="prep-material-chip">${w.text}</span>`).join('')
            : '<span class="prep-readiness-explain">No words added yet — build the Lumora Wall during Explore\'s Think &amp; Talk first.</span>';
    }
}

// ================= Signature Feature: Answer Cards (Plan B — manual tally) =================
// Real camera-based card scanning (unique printed pattern per student, read
// from one room photo) is a genuine computer-vision build, flagged earlier
// as needing a research spike before committing to it. The brief's own
// stated Plan B for this exact feature — "if the camera scan fails, show of
// hands with a tap count" — is what ships here: fully real and usable today.
let answerCardsTally = { A: 0, B: 0, C: 0, D: 0 };

function openAnswerCards() {
    document.getElementById('acQuestion').value = '';
    answerCardsTally = { A: 0, B: 0, C: 0, D: 0 };
    renderAnswerCards();
    navigateTo('answercards');
}

function tallyAnswerCard(letter) {
    answerCardsTally[letter]++;
    renderAnswerCards();
}

function untallyAnswerCard(letter, event) {
    event.stopPropagation();
    answerCardsTally[letter] = Math.max(0, answerCardsTally[letter] - 1);
    renderAnswerCards();
}

function resetAnswerCards() {
    answerCardsTally = { A: 0, B: 0, C: 0, D: 0 };
    renderAnswerCards();
}

function renderAnswerCards() {
    const total = Object.values(answerCardsTally).reduce((a, b) => a + b, 0) || 1;
    const colors = { A: '#0EA5E9', B: '#A855F7', C: '#F59E0B', D: '#10B981' };
    document.getElementById('acOptionsRow').innerHTML = ['A', 'B', 'C', 'D'].map(letter => `
        <button type="button" class="ac-option-card" onclick="tallyAnswerCard('${letter}')">
            <span class="ac-option-letter" style="background:${colors[letter]}">${letter}</span>
            <span class="ac-option-count">${answerCardsTally[letter]}</span>
            <span class="ac-bar-track"><span class="ac-bar-fill" style="width:${(answerCardsTally[letter] / total) * 100}%; background:${colors[letter]}"></span></span>
            <span class="ac-option-minus" onclick="untallyAnswerCard('${letter}', event)">&minus;1</span>
        </button>`).join('');
}

// ================= VIEW: Teacher Prep (what the Teacher QR opens) =================
// Readiness tracking persists locally (first-opened timestamp + "I'm ready"
// taps); time spent reuses the existing timeTracking system under a 'prep'
// stage key. There's no trainer dashboard yet to push Red/Amber alerts to,
// so the computed status is shown honestly here and on the chapter hub only.

function loadPrepStatus() {
    return HMCloud.get(PREP_STATUS_STORAGE_KEY) || {};
}

function savePrepStatus() {
    HMCloud.save(PREP_STATUS_STORAGE_KEY, appState.prepStatus);
}

function getPrepStatus(chapterId) {
    if (!appState.prepStatus[chapterId]) {
        appState.prepStatus[chapterId] = { firstOpenedAt: null, readyChecks: { video: false, script: false, materials: false } };
    }
    return appState.prepStatus[chapterId];
}

function openTeacherPrep() {
    const chapter = getCurrentChapter();
    if (!chapter.prep) {
        showNotification(`Teacher Prep for "${chapter.title}" isn't written yet — only Chapters 1-4 have a full session script so far.`);
        return;
    }
    const status = getPrepStatus(chapter.id);
    if (!status.firstOpenedAt) {
        status.firstOpenedAt = new Date().toISOString();
        savePrepStatus();
    }

    document.getElementById('prepTitle').textContent = `Teacher Prep: ${chapter.title}`;
    renderPrepLessonPlan(chapter);
    renderPrepMedia(chapter);
    showPrepSession(1, document.querySelector('.prep-session-tab'));
    renderPrepChecklist();
    renderPrepReadyTaps(chapter.id);
    renderPrepReadiness(chapter.id);

    navigateTo('prep');
    startTimer(chapter.id, 'prep');
}

function renderPrepLessonPlan(chapter) {
    const plan = chapter.prep.lessonPlan;
    document.getElementById('prepObjectives').innerHTML = plan.objectives.map(o => `<li>${o}</li>`).join('');
    document.getElementById('prepOutput1').textContent = plan.studentOutputs.session1;
    document.getElementById('prepOutput2').textContent = plan.studentOutputs.session2;
    document.getElementById('prepMaterials').innerHTML = plan.materials.map(m => `<span class="prep-material-chip">${m}</span>`).join('');
    document.getElementById('prepDifferentiation').innerHTML = plan.differentiation.map(d => `
        <div class="prep-diff-row"><strong>${d.level}:</strong> ${d.action}</div>`).join('');
}

function renderPrepMedia(chapter) {
    const thumb = document.getElementById('prepVideoThumb');
    if (chapter.videoYoutubeId) {
        thumb.src = `https://img.youtube.com/vi/${chapter.videoYoutubeId}/hqdefault.jpg`;
        thumb.style.display = 'block';
    } else {
        thumb.style.display = 'none';
    }
    document.getElementById('prepStorybookCount').textContent = `${(chapter.storybook || []).length} pages`;
}

const PREP_LINE_LABELS = {
    teacher_says: 'Teacher says',
    expected_answers: 'Expected answers',
    stage_direction: 'Stage direction',
    roving_prompt: 'Roving prompt',
    support_prompt: 'Support prompt (Stuck student button)'
};

function renderPrepScriptLine(line) {
    if (line.type === 'teacher_says') {
        return `<p class="prep-line prep-line-says">"${line.text}"</p>`;
    }
    if (line.type === 'expected_answers') {
        return `<div class="prep-line-chips">${line.text.split(' / ').map(a => `<span class="prep-chip">${a}</span>`).join('')}</div>`;
    }
    if (line.type === 'stage_direction') {
        return `<p class="prep-line prep-line-direction"><i class="fa-solid fa-circle-info"></i> ${line.text}</p>`;
    }
    if (line.type === 'roving_prompt') {
        return `<div class="prep-line-card prep-line-roving"><i class="fa-solid fa-person-walking"></i> ${line.text}</div>`;
    }
    if (line.type === 'support_prompt') {
        return `<div class="prep-line-card prep-line-support"><i class="fa-solid fa-life-ring"></i> ${line.text}</div>`;
    }
    return '';
}

// ================= Lesson script panel (during class) =================
// The full script for the chapter, opened over any lesson stage from the
// Script button. Opening it changes nothing else: the video keeps playing
// and the projector keeps showing what it was showing.
const LESSON_VIEWS = ['explore-stage', 'practice-stage', 'create-stage', 'perform-stage'];
const SCRIPT_ROLES = ['teacher', 'trainer', 'admin'];
let scriptPanelPosition = null;

function scriptPromptLines(step) {
    return step ? step.lines.filter(l => l.type === 'roving_prompt' || l.type === 'support_prompt') : [];
}

function updateScriptFab(viewId) {
    const chapter = getCurrentChapter();
    const show = LESSON_VIEWS.includes(viewId)
        && !!appState.currentUser && SCRIPT_ROLES.includes(appState.currentUser.role)
        && !!(chapter && chapter.prep);
    document.getElementById('scriptFab').hidden = !show;
    document.body.classList.toggle('has-script-fab', show);
    if (!show) closeScriptPanel();
}

// Which script step matches what is on the teacher's screen right now.
// Explore and Create follow their on-screen steps; Practice and Perform
// open at their first step.
function currentScriptPosition() {
    const prep = getCurrentChapter().prep;
    const at = (session, stage, offset) => {
        const steps = (session === 1 ? prep.session1Script : prep.session2Script).filter(s => s.stage === stage);
        const step = steps[Math.max(0, Math.min(steps.length - 1, offset))];
        return { session, step: step ? step.step : 1 };
    };
    const revealed = id => document.getElementById(id).classList.contains('revealed');
    const view = appState.currentView;

    if (view === 'explore-stage') {
        const s1 = prep.session1Script;
        const storyStep = (s1.find(s => /storybook/i.test(s.title)) || s1[0]).step;
        const exploreSteps = s1.filter(s => s.stage === 'Explore');
        if (revealed('wrapupSection')) return { session: 1, step: exploreSteps[exploreSteps.length - 1].step };
        if (revealed('drawSection')) return { session: 1, step: prep.activityStep || storyStep + 2 };
        if (revealed('thinkTalkSection')) return { session: 1, step: storyStep + 1 };
        if (revealed('storybookSection')) return { session: 1, step: storyStep };
        if (document.getElementById('videoPlayerCard').style.display !== 'none') {
            return { session: 1, step: (s1.find(s => /video/i.test(s.title)) || s1[0]).step };
        }
        return at(1, 'Explore', 0);
    }
    if (view === 'practice-stage') return at(1, 'Practice', 0);
    if (view === 'create-stage') {
        if (revealed('createCheckSection')) return at(2, 'Create', 4);
        if (revealed('createWriteSection')) return at(2, 'Create', 3);
        if (revealed('createModelSection')) return at(2, 'Create', 2);
        if (revealed('createStarterSection')) return at(2, 'Create', 1);
        return at(2, 'Create', 0);
    }
    if (view === 'perform-stage') {
        if (revealed('performCloseSection')) return at(2, 'Perform', 99);
        if (revealed('performStageSection')) return at(2, 'Perform', 2);
        if (revealed('performPairSection')) return at(2, 'Perform', 1);
        return at(2, 'Perform', 0);
    }
    return { session: 1, step: 1 };
}

function openScriptPanel() {
    scriptPanelPosition = currentScriptPosition();
    document.getElementById('scriptPanel').hidden = false;
    document.getElementById('scriptPanelBackdrop').hidden = false;
    document.getElementById('scriptFab').setAttribute('aria-expanded', 'true');
    renderScriptPanel(scriptPanelPosition.session);
    document.getElementById('scriptPanelClose').focus();
}

function closeScriptPanel() {
    const panel = document.getElementById('scriptPanel');
    if (panel.hidden) return;
    panel.hidden = true;
    document.getElementById('scriptPanelBackdrop').hidden = true;
    const fab = document.getElementById('scriptFab');
    fab.setAttribute('aria-expanded', 'false');
    if (!fab.hidden) fab.focus();
}

function renderScriptPanel(session) {
    const chapter = getCurrentChapter();
    const steps = session === 1 ? chapter.prep.session1Script : chapter.prep.session2Script;
    const currentStep = scriptPanelPosition && scriptPanelPosition.session === session ? scriptPanelPosition.step : null;

    document.getElementById('scriptPanelEyebrow').textContent = `Chapter ${String(chapter.id).padStart(2, '0')} · ${chapter.title}`;
    document.getElementById('scriptPanelTitle').textContent = session === 1 ? 'Session 1 · Explore & Practice' : 'Session 2 · Create & Perform';
    [1, 2].forEach(n => {
        const tab = document.getElementById(`scriptTab${n}`);
        tab.classList.toggle('active', n === session);
        tab.setAttribute('aria-selected', String(n === session));
    });

    const body = document.getElementById('scriptPanelBody');
    body.innerHTML = steps.map(step => `
        <div class="prep-step-card script-step${step.step === currentStep ? ' is-current' : ''}" data-step="${step.step}">
            <div class="prep-step-head">
                <span class="prep-step-num">${step.step}</span>
                <span class="prep-step-stage">${step.stage}</span>
                <h4>${step.title}</h4>
                ${step.step === currentStep ? '<span class="script-here">You are here</span>' : ''}
            </div>
            ${step.lines.map(renderPrepScriptLine).join('')}
        </div>`).join('');

    const current = body.querySelector('.script-step.is-current');
    body.scrollTop = current ? current.offsetTop - body.offsetTop - 8 : 0;
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeScriptPanel();
});

function showPrepSession(sessionNum, btnEl) {
    document.querySelectorAll('.prep-session-tab').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');

    const chapter = getCurrentChapter();
    const steps = sessionNum === 1 ? chapter.prep.session1Script : chapter.prep.session2Script;

    document.getElementById('prepScriptSteps').innerHTML = steps.map(step => `
        <div class="prep-step-card">
            <div class="prep-step-head">
                <span class="prep-step-num">${step.step}</span>
                <span class="prep-step-stage">${step.stage}</span>
                <h4>${step.title}</h4>
            </div>
            ${step.lines.map(renderPrepScriptLine).join('')}
        </div>`).join('');
}

function renderPrepChecklist() {
    const chapter = getCurrentChapter();
    document.getElementById('prepChecklist').innerHTML = chapter.prep.beforeClassChecklist
        .map(item => `<label class="check-item"><input type="checkbox"> ${item}</label>`).join('');
}

function renderPrepReadyTaps(chapterId) {
    const status = getPrepStatus(chapterId);
    document.querySelectorAll('.prep-ready-tap').forEach(btn => {
        const key = btn.dataset.check;
        btn.classList.toggle('checked', !!status.readyChecks[key]);
    });
}

function togglePrepReady(key) {
    const chapter = getCurrentChapter();
    const status = getPrepStatus(chapter.id);
    status.readyChecks[key] = !status.readyChecks[key];
    savePrepStatus();
    renderPrepReadyTaps(chapter.id);
    renderPrepReadiness(chapter.id);
}

// Green: opened in the last 48h, >=10 min spent, all 3 "I'm ready" taps done.
// Amber: opened, but under 10 min or not fully ready. Red: never opened.
function computeReadinessStatus(chapterId) {
    const status = getPrepStatus(chapterId);
    if (!status.firstOpenedAt) return 'red';

    const hoursSinceOpened = (Date.now() - new Date(status.firstOpenedAt).getTime()) / 3600000;
    const minutesSpent = ((appState.timeTracking[chapterId] && appState.timeTracking[chapterId].prep) || 0) / 60;
    const allReady = Object.values(status.readyChecks).every(Boolean);

    if (hoursSinceOpened <= 48 && minutesSpent >= 10 && allReady) return 'green';
    return 'amber';
}

function renderPrepReadiness(chapterId) {
    const level = computeReadinessStatus(chapterId);
    const labels = {
        green: ['Ready for class', 'Prep page opened, 10+ minutes spent, and fully checked off.'],
        amber: ['Getting there', "Opened, but not yet 10 minutes in and/or the ready check isn't complete."],
        red: ['Not opened yet', "This chapter's prep page hasn't been opened before class."]
    };
    const [title, sub] = labels[level];

    const badge = document.getElementById('prepReadinessBadge');
    if (badge) {
        badge.className = `readiness-badge readiness-${level}`;
        badge.innerHTML = `<span class="readiness-dot"></span> ${title}`;
    }
    const explain = document.getElementById('prepReadinessExplain');
    if (explain) explain.textContent = sub;

    const hubDot = document.getElementById('hubReadinessDot');
    if (hubDot) hubDot.className = `readiness-dot readiness-${level}`;
}

// ================= PARENT LOGIN + TRAINER/ADMIN STUDENT REPORTS =================
// One real report, two audiences: a parent sees only their own child
// (account.studentId); a trainer/admin can open the same report for any
// student from the Reports hub. Built only from real records — class
// chapter progress, Lumora Wall words tagged to the student, and the
// student's own Learning Space activity. Empty sections say so honestly
// ("No words tagged yet") rather than showing a fake number.

function renderParentDashboard(account) {
    const container = document.getElementById('parentDashboardContent');
    container.innerHTML = buildStudentReportHtml(account.studentId);
    loadReportStories(container, account.studentId);
}

function openReportsHome() {
    const list = document.getElementById('reportsStudentList');
    list.innerHTML = HappyMindsConfig.STUDENTS.map(s => `
        <div class="admin-list-row" style="cursor:pointer;" onclick="openStudentReport('${s.id}')">
            <img src="${s.avatar}" alt="" class="admin-list-avatar">
            <span class="admin-list-title">${s.name}</span>
            <i class="fa-solid fa-chevron-right"></i>
        </div>`).join('');
    navigateTo('reports-home');
    renderClassReportsList();
}

function openStudentReport(studentId) {
    const container = document.getElementById('teacherReportContent');
    container.innerHTML = buildStudentReportHtml(studentId);
    loadReportStories(container, studentId);
    navigateTo('teacher-report');
}

// Student portal (student-portal.js) saves each child's progress as their
// studentPortal document. Returns null if they haven't opened the portal yet.
function loadStudentPortalState(studentId) {
    return HMCloud.get('studentPortal', studentId);
}

// Portal text (e.g. creation titles) is typed by the student, so escape it
// before it goes into innerHTML.
function escapeReportText(text) {
    const div = document.createElement('div');
    div.textContent = String(text ?? '');
    return div.innerHTML;
}

function buildPortalActivityHtml(student, portal) {
    if (!portal) {
        return `
            <div class="admin-section-card">
                <h3><i class="fa-solid fa-child-reaching"></i> My Learning Space</h3>
                <p class="prep-readiness-explain">${student.name} hasn't opened their Learning Space yet. Progress from Practice, Fix It and Create Studio will show here once they do.</p>
            </div>`;
    }

    const creations = portal.creations || [];
    const history = (portal.history || []).slice(0, 8);
    const formatDate = iso => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    const stats = [
        [portal.xp || 0, 'XP Earned'],
        [portal.streak || 0, 'Day Streak'],
        [(portal.badges || []).length, 'Badges Earned'],
        [(portal.completedPractice || []).length, 'Practice Sets Done'],
        [(portal.completedFixIt || []).length, 'Fix It Activities Done'],
        [creations.length, 'Stories Sent']
    ];

    return `
        <div class="admin-section-card">
            <h3><i class="fa-solid fa-child-reaching"></i> My Learning Space</h3>
            <div class="admin-stats-row">
                ${stats.map(([value, label]) => `
                    <div class="admin-stat-card">
                        <div class="admin-stat-value">${value}</div>
                        <div class="admin-stat-label">${label}</div>
                    </div>`).join('')}
            </div>
        </div>

        <div class="admin-section-card">
            <h3><i class="fa-solid fa-clock-rotate-left"></i> Recent Activity</h3>
            ${history.length
                ? `<div class="admin-chapter-list">${history.map(h => `
                    <div class="admin-list-row"><span class="admin-list-num" aria-hidden="true">${escapeReportText(h.icon)}</span><span class="admin-list-title">${escapeReportText(h.text)}</span><span class="admin-list-username">${formatDate(h.date)}</span></div>`).join('')}</div>`
                : `<p class="prep-readiness-explain">No activity yet.</p>`}
        </div>`;
}

function buildStudentReportHtml(studentId) {
    const student = HappyMindsConfig.STUDENTS.find(s => s.id === studentId);
    if (!student) return '<p>Student not found.</p>';

    // --- Class chapter progress (appState.completedChapters, saved by the teacher app) ---
    const pct = Math.round((appState.completedChapters.length / CHAPTERS.length) * 100);

    // --- Lumora Wall words tagged to this student, across every chapter ---
    const wallEntries = [];
    Object.entries(appState.lumoraWall).forEach(([chapterId, words]) => {
        (words || []).forEach(w => {
            const word = typeof w === 'string' ? { text: w, studentId: null } : w;
            if (word.studentId === studentId) wallEntries.push({ chapterId, text: word.text });
        });
    });

    return `
        <div class="admin-header">
            <h2><img src="${student.avatar}" alt="" style="width:36px;height:36px;border-radius:50%;vertical-align:middle;margin-right:10px;">${student.name}'s Report</h2>
            <p>Built from real activity in class and in ${student.name}'s Learning Space — no section here is a guess.</p>
        </div>

        <div class="admin-stats-row">
            <div class="admin-stat-card">
                <div class="admin-stat-value">${appState.completedChapters.length}/${CHAPTERS.length}</div>
                <div class="admin-stat-label">Class Chapters Complete (${pct}%)</div>
            </div>
            <div class="admin-stat-card">
                <div class="admin-stat-value">${wallEntries.length}</div>
                <div class="admin-stat-label">Lumora Wall Words Contributed</div>
            </div>
        </div>

        <div class="admin-section-card">
            <h3><i class="fa-solid fa-link"></i> Lumora Wall — Words ${student.name} Said in Class</h3>
            ${wallEntries.length
                ? `<div class="admin-chapter-list">${wallEntries.map(e => {
                    const chapter = getChapterById(parseInt(e.chapterId, 10));
                    return `<div class="admin-list-row"><span class="admin-list-num">Ch${String(e.chapterId).padStart(2, '0')}</span><span class="admin-list-title">"${e.text}"</span><span class="admin-list-username">${chapter ? chapter.title : ''}</span></div>`;
                }).join('')}</div>`
                : `<p class="prep-readiness-explain">No words tagged to ${student.name} yet — the teacher tags who said each Lumora Wall word during Explore.</p>`}
        </div>

        <div class="admin-section-card">
            <h3><i class="fa-solid fa-book-open-reader"></i> ${student.name}'s Stories</h3>
            <p class="prep-readiness-explain">Every story ${student.name} wrote, exactly as written, with the kind feedback it received: stories the teacher scanned in class, and stories sent from the Learning Space.</p>
            <div class="report-stories" data-report-stories>
                <p class="prep-readiness-explain">Loading stories…</p>
            </div>
        </div>

        ${buildPortalActivityHtml(student, loadStudentPortalState(studentId))}`;
}

// Fills the report's Stories section. Row Level Security makes sure a parent
// only ever receives their own child's stories; staff can open any student.
async function loadReportStories(container, studentId) {
    const box = container.querySelector('[data-report-stories]');
    if (!box) return;
    const student = HappyMindsConfig.STUDENTS.find(s => s.id === studentId);
    const name = student ? student.name : 'This student';
    let stories;
    try {
        stories = (await HMCloud.listStories()).filter(s => s.student_id === studentId);
    } catch (err) {
        box.innerHTML = `<p class="prep-readiness-explain">Couldn't load the stories. Check the internet connection and open this page again.</p>`;
        return;
    }
    if (!box.isConnected) return; // the report was closed or re-opened meanwhile
    if (!stories.length) {
        box.innerHTML = `<p class="prep-readiness-explain">No stories yet. ${escapeReportText(name)}'s stories will appear here when the teacher scans one in class or ${escapeReportText(name)} sends one from the Learning Space.</p>`;
        return;
    }
    box.innerHTML = stories.map((story, i) => {
        const chapter = getChapterById(story.chapter_id);
        const f = story.feedback || {};
        const date = new Date(story.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
        const source = story.source === 'teacher'
            ? '<span class="report-story-source class"><i class="fa-solid fa-chalkboard-user"></i> Written in class</span>'
            : '<span class="report-story-source portal"><i class="fa-solid fa-house-laptop"></i> Sent from the Learning Space</span>';
        return `
            <details class="report-story"${i === 0 ? ' open' : ''}>
                <summary>
                    <span class="admin-list-num">Ch${String(story.chapter_id).padStart(2, '0')}</span>
                    <span class="report-story-title">${escapeReportText(chapter ? chapter.title : `Chapter ${story.chapter_id}`)}</span>
                    ${source}
                    <span class="report-story-date">${date}</span>
                </summary>
                <div class="report-story-body">
                    <h4>Story, as ${escapeReportText(name)} wrote it</h4>
                    <p class="report-story-text">${escapeReportText(story.story_text)}</p>
                    <h4>Feedback</h4>
                    <dl class="report-story-feedback">
                        <dt>What went well</dt><dd>${escapeReportText(f.praise)}</dd>
                        <dt>Try this next time</dt><dd>${escapeReportText(f.tip)}</dd>
                        <dt>Think about</dt><dd>${escapeReportText(f.question)}</dd>
                    </dl>
                </div>
            </details>`;
    }).join('');
}

// ================= TRAINER/ADMIN: Teacher Usage Report =================
// Real data only: Teacher Prep readiness (prepStatus) and in-class time per
// stage (timeTracking) — both already collected for the one demo teacher
// account. "Per teacher" scales naturally once more teacher accounts exist;
// nothing here is mocked.
function openTeacherReport() {
    document.getElementById('teacherReportContent').innerHTML = buildTeacherReportHtml();
    markReflectionsSeen(submittedReflections());
    renderNotificationCenter();
    navigateTo('teacher-report');
}

function buildTeacherReportHtml() {
    const teacher = HappyMindsConfig.ACCOUNTS.find(a => a.role === 'teacher');
    const chaptersWithPrep = CHAPTERS.filter(c => c.prep);

    const readinessRows = chaptersWithPrep.map(chapter => {
        const status = computeReadinessStatus(chapter.id);
        return `
            <div class="admin-list-row">
                <span class="admin-list-num">Ch${String(chapter.id).padStart(2, '0')}</span>
                <span class="admin-list-title">${chapter.title}</span>
                <span class="readiness-dot readiness-${status}" title="${status}"></span>
                <span class="admin-list-tag ${status === 'green' ? 'full' : 'partial'}">${status.toUpperCase()}</span>
            </div>`;
    }).join('');

    // Class time is the four lesson stages; prep and scanning happen outside
    // the lesson, so they are listed on their own and not added to it.
    const CLASS_STAGES = ['explore', 'practice', 'create', 'perform'];
    const fmtMin = seconds => `${Math.round(seconds / 60)} min`;
    const timeRows = Object.entries(appState.timeTracking).map(([chapterId, stages]) => {
        const chapter = getChapterById(parseInt(chapterId, 10));
        if (!chapter) return '';
        const st = stages || {};
        const classSeconds = CLASS_STAGES.reduce((sum, k) => sum + (st[k] || 0), 0);
        const outside = [['prep', 'Prep'], ['scan', 'Scanning']].filter(([k]) => st[k] >= 30);
        if (classSeconds < 30 && !outside.length) return '';
        const breakdown = CLASS_STAGES.filter(k => st[k] >= 30).map(k => `${k}: ${Math.round(st[k] / 60)}m`).join(' · ');
        return `
            <div class="admin-list-row time-report-row">
                <span class="admin-list-num">Ch${String(chapterId).padStart(2, '0')}</span>
                <span class="admin-list-title">${escapeReportText(chapter.title)}</span>
                <span class="admin-list-username">${breakdown || 'No class time yet'}</span>
                <span class="admin-list-tag full">Class ${fmtMin(classSeconds)}</span>
                ${outside.map(([k, label]) => `<span class="admin-list-tag partial">${label} ${fmtMin(st[k])}</span>`).join('')}
            </div>`;
    }).join('');

    return `
        <div class="admin-header">
            <h2><img src="${teacher.avatar}" alt="" style="width:36px;height:36px;border-radius:50%;vertical-align:middle;margin-right:10px;">${teacher.name} — Portal Usage</h2>
            <p>Prep readiness per chapter, real in-class time logged per stage, and the teacher's chapter reflections.</p>
        </div>

        <div class="admin-section-card">
            <h3><i class="fa-solid fa-clipboard-list"></i> Teacher Prep Readiness</h3>
            ${chaptersWithPrep.length ? `<div class="admin-chapter-list">${readinessRows}</div>` : '<p class="prep-readiness-explain">No chapters with a full Teacher Prep script yet.</p>'}
        </div>

        <div class="admin-section-card">
            <h3><i class="fa-solid fa-stopwatch"></i> Time Logged</h3>
            <p class="prep-readiness-explain" style="margin-bottom:10px;">Class time is Explore, Practice, Create and Perform. Prep and scanning are shown separately. The clock pauses when the screen is off or nobody has touched the portal for a while.</p>
            ${timeRows ? `<div class="admin-chapter-list">${timeRows}</div>` : '<p class="prep-readiness-explain">No time logged yet — time is tracked automatically as the teacher runs each stage.</p>'}
        </div>

        <div class="admin-section-card" id="teacherReflectionsCard">
            <h3><i class="fa-solid fa-clipboard-check"></i> Chapter Reflections</h3>
            ${buildReflectionsReportHtml()}
        </div>`;
}

// ================= TRAINER/ADMIN: Chapter Reflections =================
// The teacher submits a Chapter Reflection after each chapter (saved in the
// staff-only "reflections" document). Trainers and admins read them here, in
// the Teacher Usage report, and get a notice in the bell when a new one
// arrives. Which reflections a trainer has already opened is remembered on
// that trainer's own device.
const REFLECTION_REVIEWER_ROLES = ['trainer', 'admin'];
const REFLECTIONS_SEEN_KEY = 'happyMindsReflectionsSeen';

function submittedReflections() {
    return Object.entries(appState.reflections || {})
        .filter(([, r]) => r && r.submitted)
        .map(([chapterId, r]) => ({ chapterId: parseInt(chapterId, 10), ...r }))
        .filter(r => getChapterById(r.chapterId))
        .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
}

const reflectionSeenKey = r => `${r.chapterId}|${r.submittedAt || ''}`;

function loadSeenReflections() {
    try { return new Set(JSON.parse(localStorage.getItem(REFLECTIONS_SEEN_KEY) || '[]')); } catch (err) { return new Set(); }
}

function markReflectionsSeen(list) {
    const seen = loadSeenReflections();
    list.forEach(r => seen.add(reflectionSeenKey(r)));
    try { localStorage.setItem(REFLECTIONS_SEEN_KEY, JSON.stringify([...seen])); } catch (err) { /* private mode: notices just stay */ }
}

function renderReviewerNotifications(list, badge) {
    const seen = loadSeenReflections();
    const fresh = submittedReflections().filter(r => !seen.has(reflectionSeenKey(r)));
    badge.textContent = fresh.length;
    badge.style.display = fresh.length ? 'flex' : 'none';

    if (!fresh.length) {
        list.innerHTML = `<div class="notification-dropdown-empty">You're all caught up — no new chapter reflections.</div>`;
        return;
    }
    list.innerHTML = fresh.map(r => {
        const chapter = getChapterById(r.chapterId);
        const when = r.submittedAt ? new Date(r.submittedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '';
        return `
            <div class="reflection-reminder-card">
                <i class="fa-solid fa-clipboard-check"></i>
                <div class="reflection-reminder-text">
                    <strong>New reflection: ${escapeReportText(chapter.title)}</strong>
                    <span>Chapter ${String(r.chapterId).padStart(2, '0')}${when ? ` · submitted ${when}` : ''}</span>
                </div>
                <button class="btn-primary-glowing compact" onclick="closeNotificationMenu(); openReflectionInReport(${r.chapterId});">
                    Read It <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>`;
    }).join('');
}

function openReflectionInReport(chapterId) {
    openTeacherReport();
    const item = document.querySelector(`#teacherReportContent .reflection-report[data-chapter="${chapterId}"]`);
    if (item) {
        item.open = true;
        item.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function formatReflectionAnswer(chapter, field, value) {
    if (field.type === 'rating5') {
        const n = Number(value) || 0;
        return n ? `<span class="reflection-report-stars" aria-label="${n} out of 5">${'★'.repeat(n)}<span>${'★'.repeat(5 - n)}</span></span> ${n}/5` : null;
    }
    if (field.type === 'yesno') return value === 'yes' ? 'Yes' : value === 'no' ? 'No' : null;
    if (field.type === 'checklist') {
        const items = (value || []).map(i => chapter.reflection.commonErrors[i]).filter(Boolean);
        return items.length ? `<ul>${items.map(t => `<li>${escapeReportText(t)}</li>`).join('')}</ul>` : 'None checked';
    }
    if (value === undefined || value === null || value === '') return null;
    return escapeReportText(value);
}

// One reflection as sections of { label, html } rows, for the report and the PDF.
function reflectionSections(r) {
    const chapter = getChapterById(r.chapterId);
    const nextChapter = getChapterById(r.chapterId + 1);
    const minutes = getTimeReport(r.chapterId)[r.chapterId] || {};
    const prefills = {
        session1Minutes: Math.round(((minutes.explore || 0) + (minutes.practice || 0)) * 10) / 10,
        session2Minutes: Math.round(((minutes.create || 0) + (minutes.perform || 0)) * 10) / 10,
        nextChapterNote: nextChapter ? `Chapter ${String(nextChapter.id).padStart(2, '0')}: ${nextChapter.title}` : 'This was the final chapter'
    };
    const answers = r.answers || {};
    return REFLECTION_TEMPLATE.map(section => ({
        title: `${section.id}. ${section.title.replace('{grammarFocus}', chapter.reflection.grammarFocus)}`,
        rows: section.fields.map(field => {
            const raw = answers[field.key] !== undefined ? answers[field.key] : prefills[field.key];
            return {
                label: field.label.replace('{grammarFocus}', chapter.reflection.grammarFocus),
                html: formatReflectionAnswer(chapter, field, raw)
            };
        })
    }));
}

const reflectionDate = r => r.submittedAt
    ? new Date(r.submittedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

function buildReflectionsReportHtml() {
    const list = submittedReflections();
    if (!list.length) {
        return '<p class="prep-readiness-explain">No reflections submitted yet. The teacher fills one in after finishing each chapter, and it appears here.</p>';
    }
    return `<div class="report-stories">${list.map((r, i) => {
        const chapter = getChapterById(r.chapterId);
        const rating = Number((r.answers || {}).overallRating) || 0;
        const sections = reflectionSections(r).map(section => `
            <section class="reflection-report-section">
                <h4>${escapeReportText(section.title)}</h4>
                <dl>${section.rows.map(row => `<dt>${escapeReportText(row.label)}</dt><dd${row.html === null ? ' class="empty"' : ''}>${row.html === null ? 'Not answered' : row.html}</dd>`).join('')}</dl>
            </section>`).join('');
        return `
            <details class="report-story reflection-report" data-chapter="${r.chapterId}"${i === 0 ? ' open' : ''}>
                <summary>
                    <span class="admin-list-num">Ch${String(r.chapterId).padStart(2, '0')}</span>
                    <span class="report-story-title">${escapeReportText(chapter.title)}</span>
                    ${rating ? `<span class="report-story-source class">Overall ${rating}/5</span>` : ''}
                    <span class="report-story-date">${reflectionDate(r)}</span>
                </summary>
                <div class="report-story-body">
                    <div class="reflection-report-actions">
                        <button class="btn-glass compact" onclick="printReflection(${r.chapterId})">
                            <i class="fa-solid fa-file-pdf blue"></i> Print / Save as PDF
                        </button>
                    </div>
                    <div class="reflection-report-body">${sections}</div>
                </div>
            </details>`;
    }).join('')}</div>`;
}

function printReflection(chapterId) {
    const r = submittedReflections().find(x => x.chapterId === chapterId);
    if (!r) return;
    const chapter = getChapterById(chapterId);
    const teacher = HappyMindsConfig.ACCOUNTS.find(a => a.role === 'teacher');
    const sections = reflectionSections(r).map(section => `
        <section>
            <h2>${escapeReportText(section.title)}</h2>
            <dl>${section.rows.map(row => `<dt>${escapeReportText(row.label)}</dt><dd>${row.html === null ? '<span class="na">Not answered</span>' : row.html}</dd>`).join('')}</dl>
        </section>`).join('');
    openPrintPage(`Chapter Reflection - Chapter ${chapter.id} - ${chapter.title}`, `
        <header>
            <div class="brand">Happy Minds · Chapter Reflection</div>
            <h1>Chapter ${chapter.id}: ${escapeReportText(chapter.title)}</h1>
            <p class="meta">${teacher ? `${escapeReportText(teacher.name)} · ` : ''}Submitted ${escapeReportText(reflectionDate(r))}</p>
        </header>
        ${sections}`);
}

// ================= Print / save as PDF =================
// Opens a clean copy of a form in a new tab and the browser's print dialog,
// where "Save as PDF" is one of the printers (also on phones). The tab title
// becomes the PDF's file name.
const PRINT_PAGE_STYLES = `
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1F2937; max-width: 760px; margin: 0 auto; padding: 28px; }
    header { border-bottom: 2px solid #0EA5E9; padding-bottom: 10px; margin-bottom: 8px; }
    .brand { font-size: 12px; font-weight: bold; color: #0EA5E9; text-transform: uppercase; letter-spacing: 1px; }
    h1 { font-size: 21px; margin: 4px 0 6px; }
    .meta { font-size: 13px; color: #4B5563; margin: 0; }
    section { break-inside: avoid; page-break-inside: avoid; padding: 10px 0; border-bottom: 1px solid #E5E7EB; }
    h2 { font-size: 14px; margin: 0 0 6px; color: #0369A1; }
    dl { margin: 0; }
    dt { font-size: 12px; color: #6B7280; margin-top: 6px; }
    dd { margin: 1px 0 0; font-size: 13px; font-weight: bold; line-height: 1.5; white-space: pre-wrap; }
    dd ul { white-space: normal; margin: 2px 0; padding-left: 18px; font-weight: normal; }
    dd ul.ticks { list-style: none; padding-left: 0; }
    .na { color: #9CA3AF; font-weight: normal; font-style: italic; }
    .reflection-report-stars { color: #F59E0B; letter-spacing: 1px; }
    .reflection-report-stars span { color: #D1D5DB; }
    .signatures { display: flex; gap: 40px; margin-top: 18px; }
    .signatures div { flex: 1; border-top: 1px solid #9CA3AF; padding-top: 6px; font-size: 12px; color: #4B5563; }
    .signatures strong { display: block; font-size: 14px; color: #1F2937; margin-bottom: 2px; }
    @media print { body { padding: 0; max-width: none; } }
`;

function openPrintPage(title, bodyHtml) {
    const w = window.open('', '_blank');
    if (!w) {
        showNotification('Allow pop-ups for this site to save the PDF.');
        return;
    }
    w.document.write(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${escapeReportText(title)}</title><style>${PRINT_PAGE_STYLES}</style></head>
        <body>${bodyHtml}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
}

// ================= VIEW 9: Scan (standalone teacher tool, from the nav bar) =================
function openScanView() {
    renderScanView();
    navigateTo('scan');
    startTimer(appState.scanTargetChapterId, 'scan');
}

function renderScanView() {
    const studentSelect = document.getElementById('studentSelect');
    const keepStudent = studentSelect.value;
    studentSelect.replaceChildren(new Option('Choose a student…', ''),
        ...HappyMindsConfig.STUDENTS.map(s => new Option(s.name, s.id)));
    studentSelect.value = keepStudent;

    const chapterSelect = document.getElementById('scanChapterSelect');
    chapterSelect.innerHTML = CHAPTERS.map(c => `<option value="${c.id}">Chapter ${String(c.id).padStart(2, '0')} — ${escapeReportText(c.title)}</option>`).join('');
    chapterSelect.value = appState.scanTargetChapterId;
    updateStorySaveButton('scan');
}

function onStudentSelectChange(id) {
    appState.scanTargetStudentId = id;
    updateStorySaveButton('scan');
}

// Feedback is written for the chapter's task, so a new chapter needs new feedback.
function onScanChapterChange(id) {
    appState.scanTargetChapterId = Number(id);
    clearStoryFeedback('scan');
    if (appState.currentView === 'scan') startTimer(appState.scanTargetChapterId, 'scan');
}

function onScanStoryInput() {
    if (!document.getElementById('scanStoryText').value.trim()) storyDeskState.scan.photo = null;
    clearStoryFeedback('scan');
}

// A chapter is marked complete only once its Chapter Reflection is
// submitted — finishing Perform opens the Reflection form rather than
// completing the chapter directly; submitReflection() does that instead.
function finishChapterPerform() {
    const chapter = getCurrentChapter();
    if (!isPlannerComplete(chapter.id, 'class2')) {
        showNotification('Complete the Class 2 planner before finishing the chapter.');
        openPlannerModal(chapter.id, 'class2');
        return;
    }
    openChapterReflection();
}

// ================= Celebration View & Confetti =================
function openCelebrationScreen() {
    const chapter = getCurrentChapter();
    document.getElementById('celebrationTitle').textContent = `Chapter ${String(chapter.id).padStart(2, '0')} Complete!`;
    document.getElementById('celebrationSubtitle').innerHTML = `Amazing! You've finished <strong>${chapter.title}</strong>!`;

    navigateTo('celebration');
    triggerConfetti();

    document.getElementById('chapterHubProgressBar').style.width = '100%';
    document.getElementById('chapterHubProgressText').textContent = '100%';
}

function triggerConfetti() {
    if (typeof confetti === 'function') {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
}

function openNextChapter() {
    const nextId = appState.currentChapterId + 1;
    if (nextId > CHAPTERS.length) {
        showNotification("You've completed all 24 chapters!");
        renderChaptersRoadmap();
        navigateTo('chapters');
        return;
    }
    showNotification(`Chapter ${String(nextId).padStart(2, '0')} Unlocked!`);
    openChapterDetail(nextId);
}

// ================= Init =================
document.addEventListener('DOMContentLoaded', () => {
    renderChaptersRoadmap();
    renderChapterHub();
    analyzeWritingContent();
    checkExistingSession();
});

HMCloud.onSaveStatus(status => {
    showNotification(status === 'error'
        ? "Couldn't save your latest changes. Retrying — keep this page open."
        : 'All changes saved.');
});

// Close the user menu / notification dropdown when clicking anywhere outside them.
document.addEventListener('click', (e) => {
    const pill = document.querySelector('.user-profile-pill');
    if (pill && !pill.contains(e.target)) {
        document.getElementById('userMenuDropdown').classList.remove('open');
    }
    const notifCenter = document.querySelector('.notification-center');
    if (notifCenter && !notifCenter.contains(e.target)) {
        closeNotificationMenu();
    }
});
