/* ==========================================================================
   Happy Minds — Student Portal Logic (student-portal.js)
   Standalone logic for the gamified Grade 4 learning space.
   Relies on chapters-data.js for source content.
   ========================================================================== */

let currentUser = null;
// Everything here is earned by this student in the portal — nothing is
// pre-filled. Chapter completion is NOT stored per student: chapters are
// taught in class, so it comes from the class progress (getClassProgress).
let spState = freshPortalState();

function freshPortalState() {
    return {
        xp: 0,
        streak: 0,
        lastLogin: null,
        joinedAt: null,
        completedPractice: [],   // practice ids, added when the student finishes the whole set
        startedPractice: [],     // practice ids the student has opened
        completedFixIt: [],      // "<chapterId>-<box>" for each Fix It box the student worked through
        creations: [],
        badges: [],
        history: [],
        avatar: null
    };
}

// The teacher app (app.js) saves class progress as this Supabase document.
const CLASS_PROGRESS_STORAGE_KEY = 'classProgress';
const STAGES = ['explore', 'practice', 'create', 'perform'];

function getClassProgress() {
    const saved = HMCloud.get(CLASS_PROGRESS_STORAGE_KEY);
    if (saved) return { completedChapters: saved.completedChapters || [], chapterProgress: saved.chapterProgress || {} };
    return { completedChapters: [], chapterProgress: {} };
}

// The chapter the class is on now: the first one not yet complete.
function getCurrentClassChapter(cls) {
    return CHAPTERS.find(c => !cls.completedChapters.includes(c.id)) || CHAPTERS[CHAPTERS.length - 1];
}

function getStagesDone(cls, chapterId) {
    const p = cls.chapterProgress[chapterId] || {};
    return STAGES.filter(s => p[s]);
}

// A chapter is open to the student once the class has reached it.
function getUnlockedChapters(cls) {
    const current = getCurrentClassChapter(cls);
    return CHAPTERS.filter(c => cls.completedChapters.includes(c.id) || c.id === current.id);
}

function escapeText(text) {
    const div = document.createElement('div');
    div.textContent = String(text ?? '');
    return div.innerHTML;
}

const BADGE_DEFS = [
    { id: 'first_login', icon: '🌟', name: 'First Step', desc: 'Started your learning journey!' },
    { id: 'chap_1', icon: '🌱', name: 'Sprout', desc: 'Completed Chapter 1' },
    { id: 'streak_3', icon: '🔥', name: 'On Fire', desc: '3 day learning streak' },
    { id: 'prac_5', icon: '🧩', name: 'Puzzle Master', desc: 'Completed 5 practices' },
    { id: 'create_1', icon: '🎨', name: 'Artist', desc: 'Submitted first creation' },
    { id: 'fixit_1', icon: '🛠', name: 'Mechanic', desc: 'Fixed your first mistake' },
    { id: 'chap_6', icon: '⭐', name: 'Rising Star', desc: 'Completed 6 chapters' },
    { id: 'xp_500', icon: '👑', name: 'Scholar', desc: 'Earned 500 XP' }
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    spShowDeepLinkNote();
    checkLogin();
});

HMCloud.onSaveStatus(status => {
    showToast(status === 'error'
        ? "Couldn't save just now. Trying again…"
        : 'All your progress is saved!');
});

// ==========================================================================
// AUTH & STATE
// ==========================================================================
// Students sign in with the same Supabase accounts as the main app, and the
// session is shared across the site — so logging in on index.html lands
// here, and logging out here returns to index.html signed out.
async function enterPortal(account) {
    currentUser = account;
    PracticeStore.bind(account.studentId);
    loadState();
    document.getElementById('sp-login').classList.add('sp-hidden');
    document.getElementById('sp-app').classList.remove('sp-hidden');
    initApp();
    await spStartTimeLimit();
    if (!spTime.up) spOpenDeepLink();
}

// ==========================================================================
// DAILY TIME LIMIT — 1 hour a day, counted by the database
// (supabase/phase6-student-time.sql). Time counts only while this page is
// on screen and the student has touched it in the last 5 minutes; it is
// reported about once a minute. If the limit isn't set up yet, nothing shows.
// ==========================================================================
const SP_IDLE_MS = 5 * 60 * 1000;
const SP_STEP_MS = 5000;
const SP_REPORT_EVERY_S = 60;
const SP_WARNINGS = [
    { at: 600, text: '10 minutes of learning time left today. Finish what you are doing!' },
    { at: 120, text: 'Only 2 minutes left today. Time to wrap up!' }
];
const spTime = { allowed: null, used: 0, pending: 0, lastInput: Date.now(), lastStep: 0, warned: new Set(), up: false, sending: false, timer: null, listening: false };

function spTimeLeft() {
    return spTime.allowed == null ? Infinity : spTime.allowed - spTime.used - spTime.pending;
}

async function spStartTimeLimit() {
    if (!spTime.listening) {
        spTime.listening = true;
        ['pointerdown', 'keydown', 'touchstart', 'wheel', 'mousemove'].forEach(type =>
            document.addEventListener(type, () => { spTime.lastInput = Date.now(); }, { passive: true, capture: true }));
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') spReportTime();
            else spTime.lastInput = Date.now();
        });
    }
    let today;
    try {
        today = await HMCloud.studentTimeTick(0);
    } catch (err) {
        // Offline for now: try again shortly, and don't lock anyone out.
        console.warn('Happy Minds: could not read today\'s time', err);
        setTimeout(() => { if (currentUser && spTime.allowed == null) spStartTimeLimit(); }, 30000);
        return;
    }
    if (!today) return;   // the time limit isn't set up yet
    spApplyTime(today, true);
    clearInterval(spTime.timer);
    spTime.lastStep = Date.now();
    spTime.timer = setInterval(spTimeStep, SP_STEP_MS);
}

function spTimeStep() {
    const now = Date.now();
    const step = Math.min((now - spTime.lastStep) / 1000, (SP_STEP_MS / 1000) * 2);   // a sleeping device doesn't count
    spTime.lastStep = now;
    if (spTime.up) return;
    if (document.visibilityState === 'visible' && now - spTime.lastInput < SP_IDLE_MS) spTime.pending += step;
    spRenderTime();
    if (spTime.pending >= SP_REPORT_EVERY_S || spTimeLeft() <= 0) spReportTime();
}

async function spReportTime() {
    if (spTime.allowed == null || spTime.sending) return;
    const seconds = Math.floor(spTime.pending);
    if (seconds <= 0) return;
    spTime.sending = true;
    spTime.pending -= seconds;
    try {
        const today = await HMCloud.studentTimeTick(seconds);
        if (today) spApplyTime(today);
    } catch (err) {
        spTime.pending += seconds;   // send it with the next report
    } finally {
        spTime.sending = false;
    }
}

function spApplyTime(today, firstRead) {
    spTime.allowed = today.allowed;
    spTime.used = today.used;
    // Warnings already passed when the page opens are shown once, not twice.
    if (firstRead) SP_WARNINGS.forEach(w => { if (spTimeLeft() <= w.at && spTimeLeft() > 0) { spTime.warned.add(w.at); } });
    if (firstRead && spTimeLeft() > 0 && spTimeLeft() <= 600) showToast(`${Math.ceil(spTimeLeft() / 60)} minutes of learning time left today.`);
    if (spTime.up && spTimeLeft() > 0) spHideTimeUp();
    spRenderTime();
}

function spRenderTime() {
    const left = spTimeLeft();
    const pills = [document.getElementById('spSideTime'), document.getElementById('spTopTime')];
    if (left === Infinity) { pills.forEach(p => { p.hidden = true; }); return; }

    const minutes = Math.max(0, Math.ceil(left / 60));
    pills.forEach(p => {
        p.hidden = false;
        p.querySelector('span').textContent = p.id === 'spTopTime' ? `${minutes} min` : `${minutes} min left today`;
        p.classList.toggle('low', left <= 600);
        p.classList.toggle('very-low', left <= 120);
        p.title = `${minutes} minutes of learning time left today`;
    });

    SP_WARNINGS.forEach(w => {
        if (left <= w.at && left > 0 && !spTime.warned.has(w.at)) {
            spTime.warned.add(w.at);
            showToast(w.text);
        }
    });
    if (left <= 0 && !spTime.up) spShowTimeUp();
}

function spShowTimeUp() {
    spTime.up = true;
    spReportTime();
    closeOpenPractice();
    document.querySelectorAll('.sp-modal-backdrop.open').forEach(m => m.classList.remove('open'));
    document.getElementById('sp-app').inert = true;
    document.getElementById('spTimeUpNote').textContent = '';
    document.getElementById('spTimeUp').hidden = false;
    document.querySelector('#spTimeUp .sp-btn-primary').focus();
}

function spHideTimeUp() {
    spTime.up = false;
    spTime.warned = new Set(SP_WARNINGS.filter(w => spTimeLeft() <= w.at).map(w => w.at));
    document.getElementById('spTimeUp').hidden = true;
    document.getElementById('sp-app').inert = false;
    showToast(`You have ${Math.ceil(spTimeLeft() / 60)} more minutes today. Enjoy!`);
}

async function spCheckTimeAgain() {
    const button = document.getElementById('spTimeUpCheck');
    const note = document.getElementById('spTimeUpNote');
    button.disabled = true;
    note.textContent = 'Checking…';
    try {
        const today = await HMCloud.studentTimeTick(0);
        if (today) spApplyTime(today);
        if (spTime.up) note.textContent = 'No extra time today. If you need more, ask your teacher.';
    } catch (err) {
        note.textContent = "Couldn't check just now. Check your internet and try again.";
    } finally {
        button.disabled = false;
    }
}

// ==========================================================================
// WORKBOOK QR CODES — each chapter's Practice and Create pages in the book
// have a QR code that opens student-portal.html?ch=<n>&go=practice|create.
// The student logs in first (the link waits), then lands on that chapter.
// ==========================================================================
let spDeepLink = (() => {
    const params = new URLSearchParams(window.location.search);
    const ch = parseInt(params.get('ch'), 10);
    const go = params.get('go');
    if (!CHAPTERS.some(c => c.id === ch) || !['practice', 'create'].includes(go)) return null;
    return { ch, go };
})();

function spShowDeepLinkNote() {
    const note = document.getElementById('spLoginDeepLink');
    if (!spDeepLink || !note) return;
    const ch = CHAPTERS.find(c => c.id === spDeepLink.ch);
    note.innerHTML = `<i class="fa-solid fa-qrcode"></i> Log in to open <strong>Chapter ${ch.id}: ${escapeText(ch.title)}</strong> · ${spDeepLink.go === 'practice' ? 'Practice' : 'Create Studio'}`;
    note.hidden = false;
}

function spOpenDeepLink() {
    if (!spDeepLink) return;
    const { ch: id, go } = spDeepLink;
    spDeepLink = null;
    window.history.replaceState(null, '', window.location.pathname);   // a reload goes to Home
    const ch = CHAPTERS.find(c => c.id === id);
    const group = getChapterGroup(ch.id);

    if (!getUnlockedChapters(getClassProgress()).some(c => c.id === id)) {
        document.getElementById('spChapterModalContent').innerHTML = `
            <div class="sp-qr-landing">
                <div class="sp-qr-lock"><i class="fa-solid fa-lock"></i></div>
                <h2>Chapter ${ch.id} isn't open yet</h2>
                <p>Your class hasn't reached <strong>${escapeText(ch.title)}</strong> yet. When your class gets there in school, this QR code will open it.</p>
                <button type="button" class="sp-btn-primary" onclick="closeChapterModal(); spNav('journey')"><i class="fa-solid fa-map-location-dot"></i> See my journey</button>
            </div>`;
        document.getElementById('spChapterModal').classList.add('open');
        return;
    }

    if (go === 'create') {
        spNav('studio');
        const sel = document.getElementById('spStudioChapterSel');
        sel.value = String(id);
        spStudioChapterChanged();
        showToast(`Chapter ${id} Create Studio is ready!`);
        return;
    }

    spNav('practice');
    const games = (ch.practiceList || []).map(p => {
        const ready = practiceReady(p.id);
        return `<button type="button" class="sp-qr-option" ${ready ? `onclick="closeChapterModal(); startPractice('${p.id}')"` : 'disabled'}>
                <i class="fa-solid fa-puzzle-piece"></i>
                <span><strong>${escapeText(p.title)}</strong><small>${ready ? 'Practice games' : 'Coming soon'}</small></span>
            </button>`;
    }).join('') || `<div class="sp-qr-option is-soon"><i class="fa-solid fa-puzzle-piece"></i><span><strong>Practice games</strong><small>Coming soon for this chapter</small></span></div>`;
    const fixIt = ch.fixItZone ? `<button type="button" class="sp-qr-option" onclick="closeChapterModal(); spOpenFixItFor(${id})">
                <i class="fa-solid fa-wrench"></i>
                <span><strong>Fix It Zone</strong><small>Find and fix the mistakes</small></span>
            </button>` : '';
    document.getElementById('spChapterModalContent').innerHTML = `
        <div class="sp-qr-landing">
            <div class="sp-qr-chapter" style="color:${group.deep}">Chapter ${ch.id} · Practice</div>
            <h2>${escapeText(ch.title)}</h2>
            <p>What would you like to do?</p>
            <div class="sp-qr-options">${games}${fixIt}</div>
        </div>`;
    document.getElementById('spChapterModal').classList.add('open');
}

function spOpenFixItFor(chapterId) {
    spNav('fixit');
    const sel = document.getElementById('spFixItChapterSel');
    sel.value = String(chapterId);
    spRenderFixItActivities();
}

function setSpLoginBusy(busy, label) {
    const button = document.querySelector('#spLoginForm button[type="submit"]');
    button.disabled = busy;
    button.innerHTML = busy
        ? `<i class="fa-solid fa-circle-notch fa-spin"></i> ${label}`
        : '<i class="fa-solid fa-star"></i> Let\'s Go! 🚀';
}

async function spAttemptLogin(e) {
    e.preventDefault();
    const user = document.getElementById('spLoginUser').value.trim().toLowerCase();
    const pass = document.getElementById('spLoginPass').value;
    const errorEl = document.getElementById('spLoginError');

    errorEl.textContent = '';
    setSpLoginBusy(true, 'Signing in…');
    try {
        const account = await HMCloud.signIn(user, pass);
        if (account.role !== 'student') {
            // Grown-up accounts belong in the classroom app, which picks up
            // this same session and signs them straight in.
            window.location.replace('index.html');
            return;
        }
        enterPortal(account);
    } catch (err) {
        errorEl.textContent = /incorrect username/i.test(err.message)
            ? 'That name or password doesn\'t match. Ask your teacher for help!'
            : err.message;
    } finally {
        setSpLoginBusy(false);
    }
}

async function checkLogin() {
    setSpLoginBusy(true, 'Checking…');
    const account = await HMCloud.restoreSession();
    setSpLoginBusy(false);
    if (account && account.role === 'student') enterPortal(account);
}

async function spLogout() {
    await spReportTime();
    clearInterval(spTime.timer);
    currentUser = null;
    await HMCloud.signOut();
    window.location.href = 'index.html';
}

function loadState() {
    const savedState = HMCloud.get('studentPortal', currentUser.studentId);
    if (savedState) {
        spState = { ...freshPortalState(), ...savedState };
    } else {
        // First visit: an empty record, nothing pre-filled
        spState = freshPortalState();
        spState.avatar = currentUser.avatar;
        spState.joinedAt = new Date().toISOString();
        awardBadge('first_login');
        addHistory('Started learning journey!', '🌟');
        saveState();
    }
    // Leaves lastLogin unset on a first visit, so today counts as day 1.
    updateStreak();
    syncClassBadges();
}

// Chapter badges follow the class: earned once the class completes them.
function syncClassBadges() {
    const done = getClassProgress().completedChapters.length;
    if (done >= 1) awardBadge('chap_1');
    if (done >= 6) awardBadge('chap_6');
}

function saveState() {
    HMCloud.save('studentPortal', spState, currentUser.studentId);
    updateGlobalUI();
}

function updateStreak() {
    const today = new Date().toDateString();
    const last = spState.lastLogin ? new Date(spState.lastLogin).toDateString() : null;
    if (last !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (last === yesterday.toDateString()) {
            spState.streak += 1;
        } else {
            spState.streak = 1;
        }
        spState.lastLogin = new Date().toISOString();
        addXP(10, 'Daily Login');
        if (spState.streak === 3) awardBadge('streak_3');
        saveState();
    }
}

function addXP(amount, reason) {
    spState.xp += amount;
    showToast(`+${amount} XP: ${reason}`);
    if (spState.xp >= 500) awardBadge('xp_500');
    saveState();
}

function awardBadge(id) {
    if (!spState.badges.includes(id)) {
        spState.badges.push(id);
        const badge = BADGE_DEFS.find(b => b.id === id);
        showToast(`🏆 Badge Unlocked: ${badge.name}!`);
        addHistory(`Earned badge: ${badge.name}`, '🏆');
        triggerConfetti();
        saveState();
    }
}

function addHistory(text, icon) {
    spState.history.unshift({ text, icon, date: new Date().toISOString() });
    if (spState.history.length > 50) spState.history.pop();
}

// ==========================================================================
// NAVIGATION & UI UPDATES
// ==========================================================================
function spNav(sectionId) {
    document.querySelectorAll('.sp-section').forEach(s => s.classList.remove('active-sp'));
    document.querySelectorAll('.sp-nav-btn').forEach(b => b.classList.remove('active'));

    document.getElementById(`sp-${sectionId}`).classList.add('active-sp');
    const btn = document.querySelector(`.sp-nav-btn[data-section="${sectionId}"]`);
    if (btn) btn.classList.add('active');

    if (window.innerWidth <= 768) {
        document.getElementById('spSidebar').classList.remove('open');
    }

    renderSection(sectionId);
    window.scrollTo(0,0);
}

function toggleSidebar() {
    document.getElementById('spSidebar').classList.toggle('open');
}

// "Class 4A" from the student's own class (Std 4–8 share the portal).
function spClassLabel() {
    const me = HappyMindsConfig.ALL_STUDENTS.find(s => s.id === currentUser.studentId);
    const section = me && HappyMindsConfig.SECTIONS.find(s => s.id === me.section_id);
    return section ? `Class ${section.label}` : 'Happy Minds';
}

function updateGlobalUI() {
    // Sidebar & Topbar
    document.getElementById('spSideName').textContent = currentUser.name;
    document.getElementById('spSideClass').textContent = spClassLabel();
    document.getElementById('spSideXP').textContent = spState.xp;
    document.getElementById('spTopXP').textContent = spState.xp;
    document.getElementById('spSideStreak').textContent = spState.streak;

    document.getElementById('spSideAvatar').src = spState.avatar;
    document.getElementById('spTopAvatar').src = spState.avatar;

    // Fix It nudge: there are boxes waiting in a chapter the class has reached
    document.getElementById('spFixItBadge').style.display = countOpenFixItBoxes() > 0 ? 'flex' : 'none';
}

function countOpenFixItBoxes() {
    return getUnlockedChapters(getClassProgress())
        .filter(c => c.fixItZone)
        .reduce((n, c) => n + Object.keys(c.fixItZone.boxes).filter(box => !spState.completedFixIt.includes(`${c.id}-${box}`)).length, 0);
}

function renderHome() {
    const cls = getClassProgress();
    const doneCount = cls.completedChapters.length;
    const currentChap = getCurrentClassChapter(cls);
    const stagesDone = getStagesDone(cls, currentChap.id);

    document.getElementById('spGreetName').textContent = currentUser.name;
    document.getElementById('spGreetXP').textContent = spState.xp;
    document.getElementById('spGreetStreak').textContent = spState.streak;

    const hour = new Date().getHours();
    document.getElementById('spGreetingTime').textContent = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    document.getElementById('spGreetChapter').textContent = currentChap.id;

    renderRecognitionCard();

    // Quick Stats
    document.getElementById('spQChapComp').textContent = doneCount;
    document.getElementById('spQPractice').textContent = spState.completedPractice.length;
    document.getElementById('spQFixIt').textContent = spState.completedFixIt.length;
    document.getElementById('spQCreate').textContent = spState.creations.length;

    // Overall Progress
    const pct = Math.round((doneCount / CHAPTERS.length) * 100);
    document.getElementById('spOverallPct').textContent = `${pct}%`;
    document.getElementById('spOverallSub').textContent = `${doneCount} of ${CHAPTERS.length} chapters completed with your class`;
    document.getElementById('spOverallFill').style.width = `${pct}%`;

    // Current Chapter Card — stage dots are the class's real stages for this chapter
    document.getElementById('spCCNum').textContent = String(currentChap.id).padStart(2, '0');
    document.getElementById('spCCTitle').textContent = currentChap.title;
    document.getElementById('spCCStages').innerHTML = STAGES.map((stage, i) => {
        const done = stagesDone.includes(stage);
        const label = stage.charAt(0).toUpperCase() + stage.slice(1);
        return `<div class="sp-cc-stage-dot ${done ? 'done' : 'pending'}" title="${label}: ${done ? 'done' : 'not started'}">${done ? '✓' : i + 1}</div>`;
    }).join('');

    // Recent Badges
    const badgeHtml = spState.badges.slice(-3).map(id => {
        const b = BADGE_DEFS.find(x => x.id === id);
        return `<div class="sp-badge-card earned" style="padding:10px; flex:1">
            <div class="sp-badge-icon" style="font-size:24px">${b.icon}</div>
            <div class="sp-badge-name" style="font-size:11px">${b.name}</div>
        </div>`;
    }).join('');
    if (badgeHtml) {
        document.getElementById('spRecentBadges').innerHTML = badgeHtml;
    }

    // Recommendations — only things that exist and aren't done yet
    const recs = [];
    const openPractice = (currentChap.practiceList || []).find(p => practiceReady(p.id) && !spState.completedPractice.includes(p.id));
    if (openPractice) {
        const started = (spState.startedPractice || []).includes(openPractice.id);
        recs.push({ icon: '🎯', type: started ? 'Keep Going' : 'Practice', title: openPractice.title, desc: started ? 'Carry on where you left off' : 'New activities to try', nav: 'practice' });
    }
    const openFixIt = countOpenFixItBoxes();
    if (openFixIt) {
        recs.push({ icon: '🛠', type: 'Fix It Zone', title: `Chapter ${currentChap.id} help boxes`, desc: `${openFixIt} box${openFixIt === 1 ? '' : 'es'} to explore`, nav: 'fixit' });
    }
    const createsLeft = STORY_CHANCES - storyChancesUsed(currentChap.id);
    if (createsLeft > 0) {
        recs.push({ icon: '🎨', type: 'Create Studio', title: currentChap.create?.challenge || `Chapter ${currentChap.id} story`, desc: `${createsLeft} story chance${createsLeft === 1 ? '' : 's'} left`, nav: 'studio' });
    }
    document.getElementById('spRecommendations').innerHTML = recs.length
        ? recs.map(r => `
            <div class="sp-rec-card" onclick="spNav('${r.nav}')">
                <div class="sp-rec-icon">${r.icon}</div>
                <div class="sp-rec-type">${r.type}</div>
                <div class="sp-rec-title">${escapeText(r.title)}</div>
                <div class="sp-rec-desc">${r.desc}</div>
            </div>`).join('')
        : `<div class="sp-empty-state-small"><div class="sp-empty-char">🌟</div><p>You're all caught up for Chapter ${currentChap.id}!</p></div>`;
}

// The class's Star of the Month (chosen by the teacher or trainer) and
// this student's Fix It Zone streak.
function renderRecognitionCard() {
    const box = document.getElementById('spRecognition');
    const star = HMRecognition.starOf(HMCloud.get(CLASS_PROGRESS_STORAGE_KEY));
    const streak = HMRecognition.fixItStreak(spState);
    const parts = [];
    if (star) {
        const me = star.studentId === currentUser.studentId;
        parts.push(`
            <div class="sp-rec-star${me ? ' is-me' : ''}">
                <span class="sp-rec-star-icon" aria-hidden="true">🌟</span>
                <div>
                    <div class="sp-rec-label">Class Star of ${HMRecognition.monthName(HMRecognition.monthKey()).split(' ')[0]}</div>
                    <div class="sp-rec-name">${me ? 'That’s you! Well done!' : escapeText(star.name)}</div>
                </div>
            </div>`);
    }
    parts.push(`
        <div class="sp-rec-streak" onclick="spNav('fixit')" role="button" tabindex="0" onkeydown="if (event.key === 'Enter') spNav('fixit')">
            <span class="sp-rec-star-icon" aria-hidden="true">🛠</span>
            <div>
                <div class="sp-rec-label">Fix It streak</div>
                <div class="sp-rec-name">${streak ? `${streak} ${streak === 1 ? 'day' : 'days'} in a row` : 'Do a Fix It box today to start one!'}</div>
            </div>
        </div>`);
    box.innerHTML = parts.join('');
    box.hidden = false;
}

function renderJourney() {
    const cls = getClassProgress();
    const doneCount = cls.completedChapters.length;
    const current = getCurrentClassChapter(cls);
    const pct = Math.round((doneCount / CHAPTERS.length) * 100);
    document.getElementById('spJourneyPct').textContent = `${pct}%`;
    document.getElementById('spJourneySub').textContent = `${doneCount} chapters completed with your class`;
    document.getElementById('spJourneyFill').style.width = `${pct}%`;

    const path = document.getElementById('spJourneyPath');
    let html = '';

    // Render chapters in a winding path, two per row
    for (let i = 0; i < CHAPTERS.length; i += 2) {
        html += `<div class="sp-journey-row">`;
        [i, i + 1].forEach(idx => {
            const ch = CHAPTERS[idx];
            if (!ch) return;
            const isDone = cls.completedChapters.includes(ch.id);
            const isCurrent = !isDone && ch.id === current.id;
            const isLocked = !isDone && !isCurrent;
            const stagePct = isDone ? 100 : isCurrent ? (getStagesDone(cls, ch.id).length / STAGES.length) * 100 : 0;

            const statusClass = isDone ? 'completed' : isCurrent ? 'current' : 'locked';
            const statusText = isDone ? 'Completed' : isCurrent ? 'Current' : 'Locked';
            const icon = isDone ? '⭐' : isCurrent ? '📍' : '🔒';
            const statusColor = isDone ? 'done' : isCurrent ? 'current-s' : 'locked-s';

            html += `
                <div class="sp-chapter-node-wrap">
                    <div class="sp-chapter-node ${statusClass}" onclick="${isLocked ? '' : `openChapterDetail(${ch.id})`}">
                        <div class="sp-node-num">Chapter ${ch.id}</div>
                        <div class="sp-node-icon">${icon}</div>
                        <div class="sp-node-title">${ch.title}</div>
                        <div class="sp-node-progress">
                            <div class="sp-node-pbar">
                                <div class="sp-node-pfill" style="width:${stagePct}%"></div>
                            </div>
                        </div>
                        <div class="sp-node-status ${statusColor}">${statusText}</div>
                    </div>
                </div>
            `;
            if (idx === i && i + 1 < CHAPTERS.length) {
                html += `<div class="sp-journey-connector"><i class="fa-solid fa-arrow-right-long"></i></div>`;
            }
        });
        html += `</div>`;
        if (i + 2 < CHAPTERS.length) {
            html += `<div class="sp-journey-connector" style="transform:rotate(90deg); margin: 10px 0;"><i class="fa-solid fa-arrow-right-long"></i></div>`;
        }
    }
    path.innerHTML = html;
}

function renderPractice() {
    const grid = document.getElementById('spPracticeGrid');
    const unlocked = getUnlockedChapters(getClassProgress()).map(c => c.id);
    let html = '';

    CHAPTERS.forEach(ch => {
        if (!ch.practiceList) return;
        ch.practiceList.forEach(prac => {
            const isDone = spState.completedPractice.includes(prac.id);
            const isStarted = !isDone && (spState.startedPractice || []).includes(prac.id);
            const isOpen = unlocked.includes(ch.id);
            if (currentPracFilter === 'done' && !isDone) return;
            if (currentPracFilter === 'inprogress' && (isDone || !isOpen)) return;

            const scoreText = !isOpen ? `Opens when your class reaches Chapter ${ch.id}` : isDone ? 'Completed' : isStarted ? 'In progress' : 'Not started';
            const scoreClass = isDone ? 'good' : '';

            html += `
                <div class="sp-practice-ch-card">
                    <div class="sp-prac-num">${ch.id}</div>
                    <div class="sp-prac-info">
                        <div class="sp-prac-title">${prac.title}</div>
                        <div class="sp-prac-meta">Chapter ${ch.id}: ${ch.title}</div>
                        <div class="sp-prac-score-row">
                            <span class="sp-prac-score ${scoreClass}">${scoreText}</span>
                        </div>
                    </div>
                    <div class="sp-prac-actions">
                        ${isOpen ? `<button class="sp-btn-primary compact" onclick="startPractice('${prac.id}')">
                            ${isDone ? 'Play Again' : isStarted ? 'Continue' : 'Start Practice'}
                        </button>` : `<button class="sp-btn-primary compact" disabled><i class="fa-solid fa-lock"></i> Locked</button>`}
                    </div>
                </div>
            `;
        });
    });

    if (!html) html = `<div class="sp-empty-state"><div class="sp-empty-state-icon">🧩</div><h3>No activities here yet</h3><p>Practice you start or finish will show up in this list.</p></div>`;
    grid.innerHTML = html;
}

// ==========================================================================
// PRACTICE — chapters 1–20 (practice-chapters.js). Each chapter's practice
// opens full screen in #chapter<N>PracticeMount; its progress is saved to
// the student's account by PracticeStore. A set counts as finished (and
// earns XP) when the student completes it in the practice itself.
// ==========================================================================
const PRACTICE_MODULES = {
    1: typeof chapter1Practice !== 'undefined' ? chapter1Practice : null,
    2: typeof chapter2Practice !== 'undefined' ? chapter2Practice : null,
    3: typeof chapter3Practice !== 'undefined' ? chapter3Practice : null,
    4: typeof chapter4Practice !== 'undefined' ? chapter4Practice : null,
    5: typeof chapter5Practice !== 'undefined' ? chapter5Practice : null,
    6: typeof chapter6Practice !== 'undefined' ? chapter6Practice : null,
    7: typeof chapter7Practice !== 'undefined' ? chapter7Practice : null,
    8: typeof chapter8Practice !== 'undefined' ? chapter8Practice : null,
    9: typeof chapter9Practice !== 'undefined' ? chapter9Practice : null,
    10: typeof chapter10Practice !== 'undefined' ? chapter10Practice : null,
    11: typeof chapter11Practice !== 'undefined' ? chapter11Practice : null,
    12: typeof chapter12Practice !== 'undefined' ? chapter12Practice : null,
    13: typeof chapter13Practice !== 'undefined' ? chapter13Practice : null,
    14: typeof chapter14Practice !== 'undefined' ? chapter14Practice : null,
    15: typeof chapter15Practice !== 'undefined' ? chapter15Practice : null,
    16: typeof chapter16Practice !== 'undefined' ? chapter16Practice : null,
    17: typeof chapter17Practice !== 'undefined' ? chapter17Practice : null,
    18: typeof chapter18Practice !== 'undefined' ? chapter18Practice : null,
    19: typeof chapter19Practice !== 'undefined' ? chapter19Practice : null,
    20: typeof chapter20Practice !== 'undefined' ? chapter20Practice : null
};
const practiceModule = n => PRACTICE_MODULES[n] || null;
const practiceNumber = pracId => { const m = /^ch(\d+)-practice$/.exec(pracId); return m ? Number(m[1]) : null; };
const practiceReady = pracId => { const n = practiceNumber(pracId); return !!(n && practiceModule(n)); };
const practiceMount = n => document.getElementById(`chapter${n}PracticeMount`);

function chapterOpenToStudent(n) {
    return getUnlockedChapters(getClassProgress()).some(c => c.id === n);
}

function startPractice(pracId) {
    const n = practiceNumber(pracId);
    const mod = n && practiceModule(n);
    if (!mod || !practiceMount(n)) { showToast('This practice is not available yet.'); return; }
    if (!chapterOpenToStudent(n)) { showToast(`Chapter ${n} practice opens when your class reaches it.`); return; }
    closeOpenPractice(true);
    practiceMount(n).style.display = 'block';
    document.body.style.overflow = 'hidden';
    mod.init();
    if (!spState.startedPractice) spState.startedPractice = [];
    if (!spState.startedPractice.includes(pracId)) {
        spState.startedPractice.push(pracId);
        saveState();
    }
}

// Hides whichever practice is open (without counting it as finished).
function closeOpenPractice(quiet) {
    let closed = false;
    for (let n = 1; n <= 20; n++) {
        const mount = practiceMount(n);
        if (mount && mount.style.display === 'block') { mount.style.display = 'none'; closed = true; }
    }
    document.body.style.overflow = '';
    if (closed && !quiet && document.getElementById('sp-practice').classList.contains('active-sp')) renderPractice();
}

// The practice's own "Finish" (all activities done): count it and reward once.
function finishPractice(n) {
    const pracId = `ch${n}-practice`;
    closeOpenPractice(true);
    if (!spState.completedPractice.includes(pracId)) {
        spState.completedPractice.push(pracId);
        addHistory(`Finished every Chapter ${n} practice activity`, '🧩');
        addXP(20, 'Practice Set Complete');
        if (spState.completedPractice.length === 5) awardBadge('prac_5');
        saveState();
    } else {
        showToast(`Chapter ${n} practice done again. Great work!`);
    }
    renderPractice();
    updateGlobalUI();
}

// The hooks the practice modules call: close (✕ / back) and complete.
for (let n = 1; n <= 20; n++) {
    window[`closeChapter${n}Practice`] = () => closeOpenPractice();
    window[`completeChapter${n}Practice`] = () => finishPractice(n);
}

// The modules' own "next / previous chapter" buttons: only chapters the
// class has reached, and through startPractice so it is recorded.
function guardPracticeChapterSwitch() {
    for (let n = 1; n <= 20; n++) {
        const mod = practiceModule(n);
        if (!mod || typeof mod.switchToChapter !== 'function') continue;
        mod.switchToChapter = target => {
            const to = Number(target);
            if (!practiceReady(`ch${to}-practice`)) return;
            if (!chapterOpenToStudent(to)) { showToast(`Chapter ${to} practice opens when your class reaches it.`); return; }
            startPractice(`ch${to}-practice`);
        };
    }
}
guardPracticeChapterSwitch();

function renderFixIt() {
    const sel = document.getElementById('spFixItChapterSel');
    const previous = sel.value;
    sel.innerHTML = '<option value="">-- Choose a chapter --</option>' +
        getUnlockedChapters(getClassProgress()).filter(c => c.fixItZone)
            .map(c => `<option value="${c.id}">Chapter ${c.id}: ${c.title}</option>`).join('');
    if (previous && sel.querySelector(`option[value="${previous}"]`)) sel.value = previous;

    spRenderFixItActivities();
}

const FIXIT_BOX_ICONS = { A: 'fa-lightbulb', B: 'fa-magnifying-glass', C: 'fa-scale-balanced', D: 'fa-pen-nib' };

function spRenderFixItActivities() {
    const cid = parseInt(document.getElementById('spFixItChapterSel').value, 10);
    const content = document.getElementById('spFixItContent');
    const ch = CHAPTERS.find(c => c.id === cid);
    if (!ch || !ch.fixItZone) {
        content.innerHTML = `<div class="sp-empty-state"><div class="sp-empty-state-icon">👆</div><h3>Select a chapter above</h3><p>Each chapter has help boxes for the parts that can feel tricky.</p></div>`;
        return;
    }

    // Real help boxes from the chapter content (chapters-data.js fixItZone)
    content.innerHTML = `
        <h3 class="sp-section-heading">Help Boxes for Chapter ${ch.id}: ${ch.title}</h3>
        <div class="sp-fixit-boxes">
            ${Object.entries(ch.fixItZone.boxes).map(([key, box]) => {
                const done = spState.completedFixIt.includes(`${ch.id}-${key}`);
                const question = ch.fixItZone.questions.find(q => q.box === key);
                return `
                <button type="button" class="sp-fixit-box-card ${done ? 'completed' : ''}" onclick="openFixItBox(${ch.id}, '${key}')">
                    <div class="sp-fixit-box-header">
                        <div class="sp-fixit-box-icon" ${done ? 'style="background:#D1FAE5;color:#059669"' : ''}><i class="fa-solid ${done ? 'fa-check' : (FIXIT_BOX_ICONS[key] || 'fa-wrench')}"></i></div>
                        <div>
                            <div class="sp-fixit-box-title">${box.title}</div>
                            <div class="sp-fixit-box-desc">${question ? escapeText(question.text) : ''}</div>
                        </div>
                    </div>
                    <div class="sp-fixit-box-status">${done ? 'Done ✓' : 'Not started'}</div>
                </button>`;
            }).join('')}
        </div>
    `;
}

// ---- Create Studio: send a story photo, get it back with kind feedback ----
// The student has 2 chances per chapter. The count lives in Supabase
// (story_submissions) and is enforced by the `stories` Edge Function, so it
// can't be skipped from this page. Stories the teacher scanned in class show
// here too, but don't use the student's chances.
const STORY_CHANCES = 2;
let spStories = null;          // this student's stories, newest first; null until loaded
let spStoriesLoadFailed = false;
let spPhotoSrc = null;         // the chosen photo, as a data URL
let spSending = false;
let spResultChapter = null;    // chapter of the story shown in the result card

function storyChancesUsed(chapterId) {
    if (!spStories) return spState.creations.filter(c => c.chapterId === chapterId).length;
    return spStories.filter(s => s.source === 'student' && s.chapter_id === chapterId).length;
}

async function loadStories() {
    try {
        spStories = await HMCloud.listStories();
        spStoriesLoadFailed = false;
    } catch (err) {
        spStoriesLoadFailed = true;
    }
}

function renderStudio() {
    const sel = document.getElementById('spStudioChapterSel');
    const unlocked = getUnlockedChapters(getClassProgress());
    sel.innerHTML = unlocked.map(c => `<option value="${c.id}">Chapter ${c.id}: ${c.title}</option>`).join('');
    sel.value = String(getCurrentClassChapter(getClassProgress()).id);
    spStudioChapterChanged();
    renderSubmissions();
    loadStories().then(() => {
        spStudioChapterChanged();
        renderSubmissions();
    });
}

function storyFeedbackHtml(feedback) {
    return `
        <dl class="sp-feedback">
            <dt>🌟 What went well</dt><dd>${escapeText(feedback.praise)}</dd>
            <dt>💡 Try this next time</dt><dd>${escapeText(feedback.tip)}</dd>
            <dt>🤔 Think about</dt><dd>${escapeText(feedback.question)}</dd>
        </dl>`;
}

function storyBodyHtml(story) {
    return `
        <h4 class="sp-story-label">Your story</h4>
        <p class="sp-story-text">${escapeText(story.story_text)}</p>
        <h4 class="sp-story-label">Tips from your story helper</h4>
        ${storyFeedbackHtml(story.feedback)}`;
}

function renderSubmissions() {
    const hist = document.getElementById('spSubmissionHistory');
    if (!spStories) {
        hist.innerHTML = spStoriesLoadFailed
            ? `<div class="sp-empty-state-small"><div class="sp-empty-char">📡</div><p>Couldn't load your stories. Check your internet and open this page again.</p></div>`
            : `<div class="sp-empty-state-small"><p>Loading your stories…</p></div>`;
        return;
    }
    if (!spStories.length) {
        hist.innerHTML = `<div class="sp-empty-state-small"><div class="sp-empty-char">🎨</div><p>No stories yet. Send your first one above!</p></div>`;
        return;
    }
    hist.innerHTML = spStories.map(story => {
        const ch = CHAPTERS.find(c => c.id === story.chapter_id);
        const by = story.source === 'teacher' ? 'Scanned by your teacher' : `Chance ${story.attempt} of ${STORY_CHANCES}`;
        return `
            <details class="sp-story-card">
                <summary>
                    <div class="sp-sub-thumb">📖</div>
                    <div class="sp-sub-info">
                        <div class="sp-sub-title">Chapter ${story.chapter_id}${ch ? `: ${escapeText(ch.title)}` : ''}</div>
                        <div class="sp-sub-chapter">${by}</div>
                        <div class="sp-sub-date">${new Date(story.created_at).toLocaleDateString()}</div>
                    </div>
                    <span class="sp-sub-status reviewed">Tips ready</span>
                </summary>
                <div class="sp-story-body">${storyBodyHtml(story)}</div>
            </details>`;
    }).join('');
}

function renderAchievements() {
    document.getElementById('spAchXP').textContent = spState.xp;
    document.getElementById('spAchStreak').textContent = spState.streak;
    document.getElementById('spAchChapters').textContent = getClassProgress().completedChapters.length;
    document.getElementById('spAchActivities').textContent = spState.completedPractice.length + spState.completedFixIt.length;

    const grid = document.getElementById('spBadgeGrid');
    grid.innerHTML = BADGE_DEFS.map(b => {
        const earned = spState.badges.includes(b.id);
        return `
            <div class="sp-badge-card ${earned ? 'earned' : 'locked'}">
                ${earned ? '<div class="sp-badge-earned-tag">Earned!</div>' : ''}
                <div class="sp-badge-icon">${b.icon}</div>
                <div class="sp-badge-name">${b.name}</div>
                <div class="sp-badge-desc">${b.desc}</div>
            </div>
        `;
    }).join('');
}

function renderMyProgress() {
    const cls = getClassProgress();
    const doneCount = cls.completedChapters.length;
    const pct = Math.round((doneCount / CHAPTERS.length) * 100);
    document.getElementById('spDonutPct').textContent = `${pct}%`;
    const offset = 314 - (314 * pct) / 100;
    document.getElementById('spDonutCircle').style.strokeDashoffset = offset;

    document.getElementById('spPSChap').textContent = `${doneCount} / ${CHAPTERS.length}`;
    document.getElementById('spPSPractice').textContent = spState.completedPractice.length;
    document.getElementById('spPSFixIt').textContent = spState.completedFixIt.length;
    document.getElementById('spPSCreate').textContent = spState.creations.length;
    document.getElementById('spPSXP').textContent = spState.xp;

    // Stage counts: Explore/Perform happen in class, Practice/Create are the student's own
    const classStageCount = stage => Object.values(cls.chapterProgress).filter(p => p && p[stage]).length;
    const rows = [
        { name: 'Explore', sub: `${classStageCount('explore')} chapter${classStageCount('explore') === 1 ? '' : 's'} explored in class`, bg: '#DBEAFE', fg: '#3B82F6', icon: 'fa-compass' },
        { name: 'Practice', sub: `${spState.completedPractice.length} practice set${spState.completedPractice.length === 1 ? '' : 's'} finished`, bg: '#FEF3C7', fg: '#F59E0B', icon: 'fa-puzzle-piece' },
        { name: 'Create', sub: `${spState.creations.length} creation${spState.creations.length === 1 ? '' : 's'} submitted`, bg: '#FCE7F3', fg: '#EC4899', icon: 'fa-palette' },
        { name: 'Perform', sub: `${classStageCount('perform')} chapter${classStageCount('perform') === 1 ? '' : 's'} performed in class`, bg: '#EDE9FE', fg: '#8B5CF6', icon: 'fa-masks-theater' }
    ];
    document.getElementById('spStageProgress').innerHTML = rows.map(r => `
        <div class="sp-stage-row"><div class="sp-stage-icon" style="background:${r.bg};color:${r.fg}"><i class="fa-solid ${r.icon}"></i></div><div class="sp-stage-info"><div class="sp-stage-name">${r.name}</div><div class="sp-stage-sub">${r.sub}</div></div></div>
    `).join('');
}

function renderProfile() {
    document.getElementById('spProfileName').textContent = currentUser.name;
    document.getElementById('spProfileClass').textContent = `${spClassLabel()} · Happy Minds`;
    document.getElementById('spProfileXP').textContent = spState.xp;
    document.getElementById('spProfileStreak').textContent = spState.streak;
    document.getElementById('spProfileAvatar').src = spState.avatar;

    document.querySelectorAll('.sp-avatar-opt').forEach(opt => {
        if (opt.src.includes(spState.avatar)) opt.classList.add('active');
        else opt.classList.remove('active');
    });

    document.getElementById('spProfileStatList').innerHTML = `
        <div class="sp-profile-stat-row"><span>Class Chapters</span><strong>${getClassProgress().completedChapters.length}</strong></div>
        <div class="sp-profile-stat-row"><span>Practice Sets</span><strong>${spState.completedPractice.length}</strong></div>
        <div class="sp-profile-stat-row"><span>Creations</span><strong>${spState.creations.length}</strong></div>
        <div class="sp-profile-stat-row"><span>Joined</span><strong>${spState.joinedAt ? new Date(spState.joinedAt).toLocaleDateString() : '—'}</strong></div>
    `;

    document.getElementById('spProfileBadges').innerHTML = spState.badges.map(id => {
        const b = BADGE_DEFS.find(x => x.id === id);
        return `<div class="sp-profile-badge-mini" title="${b.name}">${b.icon}</div>`;
    }).join('');
}

function openChapterDetail(id) {
    const ch = CHAPTERS.find(c => c.id === id);
    if (!ch) return;

    const cls = getClassProgress();
    const isDone = cls.completedChapters.includes(id);
    const stagesDone = isDone ? STAGES : getStagesDone(cls, id);
    const pct = Math.round((stagesDone.length / STAGES.length) * 100);

    document.getElementById('spChapterModalContent').innerHTML = `
        <h2 style="font-size:24px; font-weight:900; color:${getChapterGroup(ch.id).deep}; margin-bottom:10px;">Chapter ${ch.id}</h2>
        <h3 style="font-size:18px; font-weight:800; margin-bottom:20px;">${ch.title}</h3>
        <p style="font-size:14px; color:#64748B; font-weight:600; margin-bottom:24px; line-height:1.5;">
            ${ch.quote || 'Ready to learn something new?'}
        </p>

        <div style="background:#F8FAFC; border-radius:16px; padding:20px; margin-bottom:8px;">
            <div style="font-size:12px; font-weight:800; color:#94A3B8; text-transform:uppercase; margin-bottom:12px;">Class Progress</div>
            <div style="display:flex; justify-content:space-between; font-size:14px; font-weight:700; margin-bottom:8px;">
                <span>${isDone ? 'Chapter complete' : `${stagesDone.length} of ${STAGES.length} stages done`}</span> <span>${pct}%</span>
            </div>
            <div style="height:8px; background:#E2E8F0; border-radius:4px; overflow:hidden;">
                <div style="height:100%; width:${pct}%; background:#10B981; border-radius:4px;"></div>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:14px;">
                ${STAGES.map(s => `<span style="font-size:12px; font-weight:700; padding:4px 10px; border-radius:99px; background:${stagesDone.includes(s) ? '#D1FAE5' : '#E2E8F0'}; color:${stagesDone.includes(s) ? '#047857' : '#64748B'};">${stagesDone.includes(s) ? '✓ ' : ''}${s.charAt(0).toUpperCase() + s.slice(1)}</span>`).join('')}
            </div>
        </div>
    `;

    document.getElementById('spChapterModal').classList.add('open');
}

function closeChapterModal() {
    document.getElementById('spChapterModal').classList.remove('open');
}

// Opens one real Fix It help box: the explanation, then practice questions
// with answers the student reveals one at a time. "I've got it" marks the box done.
function openFixItBox(chapterId, boxKey) {
    const ch = CHAPTERS.find(c => c.id === chapterId);
    const box = ch && ch.fixItZone && ch.fixItZone.boxes[boxKey];
    if (!box) return;
    const done = spState.completedFixIt.includes(`${chapterId}-${boxKey}`);

    document.getElementById('spFixItModalContent').innerHTML = `
        <h2 style="font-size:20px; font-weight:900; margin-bottom:12px;">${box.title}</h2>
        <div style="font-size:15px; color:#334155; font-weight:600; margin-bottom:24px; line-height:1.6;">${box.body}</div>

        ${(box.practice || []).length ? `
        <div style="background:#F8FAFC; border-radius:16px; padding:20px; margin-bottom:24px; border:2px solid #E2E8F0;">
            <div style="font-size:14px; font-weight:800; margin-bottom:12px;">Try these — think first, then check!</div>
            ${box.practice.map((p, i) => `
                <div style="padding:12px; border-radius:10px; background:white; margin-bottom:8px; border:2px solid #E2E8F0;">
                    <div style="font-weight:700; margin-bottom:8px;">${p.q}</div>
                    <button type="button" class="sp-btn-glass compact" id="spFixItReveal${i}" onclick="revealFixItAnswer(${i})">Show answer</button>
                    <div id="spFixItAnswer${i}" style="display:none; font-weight:700; color:#047857;">${p.a}</div>
                </div>`).join('')}
        </div>` : ''}

        <button class="sp-btn-primary full" onclick="completeFixIt(${chapterId}, '${boxKey}')">
            ${done ? 'Close' : "I've got it! ✓"}
        </button>
    `;

    document.getElementById('spFixItModal').classList.add('open');
}

function revealFixItAnswer(i) {
    document.getElementById(`spFixItReveal${i}`).style.display = 'none';
    document.getElementById(`spFixItAnswer${i}`).style.display = 'block';
}

function closeFixItModal() {
    document.getElementById('spFixItModal').classList.remove('open');
}

function completeFixIt(chapterId, boxKey) {
    closeFixItModal();
    const id = `${chapterId}-${boxKey}`;
    if (spState.completedFixIt.includes(id)) return;

    spState.completedFixIt.push(id);
    addHistory(`Worked through Fix It box ${boxKey} (Chapter ${chapterId})`, '🛠');
    addXP(15, 'Fix It Box');
    if (spState.completedFixIt.length === 1) awardBadge('fixit_1');
    saveState();
    spRenderFixItActivities();
    showToast('Great job working through that box! ⭐');
    triggerConfetti();
}

function initApp() {
    updateGlobalUI();
    spNav('home');
}

function renderSection(id) {
    switch(id) {
        case 'home': renderHome(); break;
        case 'journey': renderJourney(); break;
        case 'practice': renderPractice(); break;
        case 'fixit': renderFixIt(); break;
        case 'studio': renderStudio(); break;
        case 'achievements': renderAchievements(); break;
        case 'myprogress': renderMyProgress(); break;
        case 'history': renderHistory(); break;
        case 'profile': renderProfile(); break;
    }
}

// ==========================================================================
// SECTION RENDERING
// ==========================================================================

let currentPracFilter = 'all';
function spPracticeFilter(filter, btn) {
    document.querySelectorAll('.sp-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentPracFilter = filter;
    renderPractice();
}

let studioCid = 1;
function spStudioChapterChanged() {
    studioCid = parseInt(document.getElementById('spStudioChapterSel').value);
    const ch = CHAPTERS.find(c => c.id === studioCid);
    if(ch) {
        document.getElementById('spStudioMissionTitle').textContent = `Chapter ${ch.id}: ${ch.title}`;
        document.getElementById('spStudioMissionDesc').textContent = ch.create?.challenge || 'Create something amazing!';
    }
    if (spResultChapter !== null && spResultChapter !== studioCid) {
        document.getElementById('spStoryResult').hidden = true;
        spResultChapter = null;
    }

    const known = spStories !== null;
    const used = storyChancesUsed(studioCid);
    const left = Math.max(0, STORY_CHANCES - used);
    document.getElementById('spLimitSub').textContent = known
        ? `${used} / ${STORY_CHANCES} used`
        : (spStoriesLoadFailed ? "Couldn't check your chances" : 'Checking your chances…');
    document.getElementById('spLimitDots').innerHTML = Array.from({ length: STORY_CHANCES }, (_, i) =>
        `<div class="sp-limit-dot ${known && i < used ? 'used' : 'empty'}"></div>`).join('');

    const full = known && left === 0;
    const btn = document.getElementById('spSubmitBtn');
    document.getElementById('spStudioForm').classList.toggle('sp-studio-locked', full);
    document.getElementById('spUploadArea').setAttribute('aria-disabled', String(full || spSending));
    btn.disabled = !known || full || spSending;
    btn.innerHTML = spSending
        ? '<i class="fa-solid fa-spinner fa-spin"></i> Reading your story…'
        : full ? 'Both chances used for this chapter' : '<i class="fa-solid fa-paper-plane"></i> Send My Story';
    document.getElementById('spStudioNote').textContent = full
        ? 'Great work! Your stories and tips are below.'
        : `${left === 1 ? 'This uses your last chance' : `This uses 1 of your ${left} chances`} for this chapter. If the photo can't be read, it won't use a chance.`;
}

function renderHistory() {
    const tl = document.getElementById('spTimeline');
    if (!spState.history.length) {
        tl.innerHTML = `<div class="sp-empty-state"><div class="sp-empty-state-icon">📅</div><h3>No history yet</h3></div>`;
        return;
    }
    
    let html = '';
    let lastDate = '';
    
    spState.history.forEach(h => {
        const d = new Date(h.date).toLocaleDateString();
        if (d !== lastDate) {
            html += `<div class="sp-timeline-date">${d === new Date().toLocaleDateString() ? 'Today' : d}</div>`;
            lastDate = d;
        }
        html += `
            <div class="sp-timeline-item">
                <div class="sp-timeline-item-icon" style="background:#F8FAFC">${h.icon}</div>
                <div class="sp-timeline-item-text">
                    <strong>${h.text}</strong>
                    <span>${new Date(h.date).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                </div>
            </div>
        `;
    });
    tl.innerHTML = html;
}

function spPickAvatar(el, src) {
    document.querySelectorAll('.sp-avatar-opt').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
    spState.avatar = src;
    saveState();
    showToast('Avatar updated!');
    renderProfile();
}

// ==========================================================================
// ACTIONS
// ==========================================================================
function spTriggerUpload() {
    if (spSending || document.getElementById('spStudioForm').classList.contains('sp-studio-locked')) return;
    document.getElementById('spFileInput').click();
}

function spHandleFile(e) {
    const file = e.target.files[0];
    e.target.value = ''; // allow choosing the same photo again
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        spShowStudioError('Please choose a photo (JPG or PNG) of your story.');
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        spPhotoSrc = reader.result;
        spShowStudioError('');
        const img = document.getElementById('spUploadPhoto');
        img.src = spPhotoSrc;
        img.hidden = false;
        document.getElementById('spUploadPrompt').hidden = true;
        const area = document.getElementById('spUploadArea');
        area.classList.add('has-file');
        area.setAttribute('aria-label', 'Change the photo of your story');
    };
    reader.readAsDataURL(file);
}

function spClearPhoto() {
    spPhotoSrc = null;
    const img = document.getElementById('spUploadPhoto');
    img.hidden = true;
    img.removeAttribute('src');
    document.getElementById('spUploadPrompt').hidden = false;
    const area = document.getElementById('spUploadArea');
    area.classList.remove('has-file');
    area.setAttribute('aria-label', 'Take or choose a photo of your story');
}

function spShowStudioError(message) {
    const el = document.getElementById('spStudioError');
    el.textContent = message;
    el.hidden = !message;
}

function spStoryErrorMessage(err) {
    switch (err && err.code) {
        case 'unreadable': return "We couldn't read that photo. Try again in good light, with the whole page showing. Don't worry — this didn't use a chance.";
        case 'limit_reached': return "You've already used both chances for this chapter.";
        case 'busy': return 'Your story helper is busy right now. Please try again in a minute.';
        case 'offline': return 'No internet connection. Please try again when you are online.';
        default: return 'Something went wrong while reading your story. Please try again.';
    }
}

function showStoryResult(story) {
    const box = document.getElementById('spStoryResult');
    box.innerHTML = `
        <div class="sp-story-result-head">
            <div class="sp-story-result-icon">🎉</div>
            <div>
                <h3>Your story is back!</h3>
                <p>Here is what you wrote, and some tips from your story helper.</p>
            </div>
        </div>
        ${storyBodyHtml(story)}`;
    box.hidden = false;
    spResultChapter = story.chapter_id;
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function spSubmitCreation() {
    if (spSending) return;
    const ch = CHAPTERS.find(c => c.id === studioCid);
    if (!ch || storyChancesUsed(studioCid) >= STORY_CHANCES) return;
    if (!spPhotoSrc) {
        spShowStudioError('First, take or choose a photo of your story.');
        return;
    }

    spShowStudioError('');
    spSending = true;
    spStudioChapterChanged();
    try {
        const result = await HMCloud.submitStoryPhoto(ch, spPhotoSrc);
        const story = {
            student_id: currentUser.studentId, chapter_id: ch.id, source: 'student', attempt: result.attemptsUsed,
            story_text: result.text, feedback: result.feedback, created_at: new Date().toISOString()
        };
        spStories = [story, ...(spStories || [])];

        spState.creations.push({ chapterId: ch.id, title: `Chapter ${ch.id} story`, date: story.created_at });
        addHistory(`Sent a story for Chapter ${ch.id}`, '🎨');
        addXP(25, 'Story Sent');
        if (spState.creations.length === 1) awardBadge('create_1');
        saveState();

        spClearPhoto();
        showStoryResult(story);
        triggerConfetti();
    } catch (err) {
        spShowStudioError(spStoryErrorMessage(err));
        if (err && err.code === 'limit_reached') await loadStories();
    } finally {
        spSending = false;
        spStudioChapterChanged();
        renderSubmissions();
    }
}

// ==========================================================================
// UTILS
// ==========================================================================
// One toast box is reused, so a new message restarts the timer; otherwise an
// earlier message's timer would hide the new one before it could be read.
let toastTimer = null;
function showToast(msg) {
    const t = document.getElementById('spToast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), Math.max(3000, msg.length * 60));
}

function triggerConfetti() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366F1', '#10B981', '#F59E0B', '#EC4899']
    });
}
