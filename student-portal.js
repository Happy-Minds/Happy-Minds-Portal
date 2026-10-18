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
        completedPractice: [],   // practice ids, added once every activity in the set is complete
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
function enterPortal(account) {
    currentUser = account;
    loadState();
    document.getElementById('sp-login').classList.add('sp-hidden');
    document.getElementById('sp-app').classList.remove('sp-hidden');
    initApp();
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

function updateGlobalUI() {
    // Sidebar & Topbar
    document.getElementById('spSideName').textContent = currentUser.name;
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
    const openPractice = (currentChap.practiceList || []).find(p => !spState.completedPractice.includes(p.id));
    if (openPractice) {
        const { done, total } = getPracticeProgress(openPractice.id);
        recs.push({ icon: '🎯', type: done ? 'Keep Going' : 'Practice', title: openPractice.title, desc: done ? `${done} of ${total} activities done` : `${total} activities to try`, nav: 'practice' });
    }
    const openFixIt = countOpenFixItBoxes();
    if (openFixIt) {
        recs.push({ icon: '🛠', type: 'Fix It Zone', title: `Chapter ${currentChap.id} help boxes`, desc: `${openFixIt} box${openFixIt === 1 ? '' : 'es'} to explore`, nav: 'fixit' });
    }
    const createsLeft = 2 - spState.creations.filter(c => c.chapterId === currentChap.id).length;
    if (createsLeft > 0) {
        recs.push({ icon: '🎨', type: 'Create Studio', title: currentChap.create?.challenge || `Chapter ${currentChap.id} creation`, desc: `${createsLeft} submission${createsLeft === 1 ? '' : 's'} left`, nav: 'studio' });
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
            const { done, total } = getPracticeProgress(prac.id);
            const isStarted = !isDone && done > 0;
            if (currentPracFilter === 'done' && !isDone) return;
            if (currentPracFilter === 'inprogress' && (isDone || !unlocked.includes(ch.id))) return;

            const scoreText = isDone ? 'Completed' : isStarted ? `${done} of ${total} activities done` : 'Not started';
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
                        <button class="sp-btn-primary compact" onclick="startPractice('${prac.id}')">
                            ${isDone ? 'Play Again' : isStarted ? 'Continue' : 'Start Practice'}
                        </button>
                    </div>
                </div>
            `;
        });
    });

    if (!html) html = `<div class="sp-empty-state"><div class="sp-empty-state-icon">🧩</div><h3>No activities here yet</h3><p>Practice you start or finish will show up in this list.</p></div>`;
    grid.innerHTML = html;
}

// Real per-student progress for a practice set; sets without a game yet report 0/0.
function getPracticeProgress(pracId) {
    if (pracId === 'ch1-practice') return chapter1Practice.getProgress(currentUser.studentId);
    return { done: 0, total: 0 };
}

function startPractice(pracId) {
    if (pracId === 'ch1-practice') {
        const mount = document.getElementById('chapter1PracticeMount');
        if (mount) {
            mount.style.display = 'block';
            chapter1Practice.init(currentUser.studentId);
        }
    } else {
        showToast('This practice is not available yet.');
    }
}

// Called by the Close button and by the practice's own "Return" button.
// The set only counts — and only earns XP — once every activity in it is done.
function closeChapter1Practice() {
    const mount = document.getElementById('chapter1PracticeMount');
    if (mount) mount.style.display = 'none';

    const { done, total } = getPracticeProgress('ch1-practice');
    if (done === total && !spState.completedPractice.includes('ch1-practice')) {
        spState.completedPractice.push('ch1-practice');
        addHistory('Finished every Chapter 1 practice activity', '🧩');
        addXP(20, 'Practice Set Complete');
        if (spState.completedPractice.length === 5) awardBadge('prac_5');
        saveState();
    } else if (done > 0 && done < total) {
        showToast(`${done} of ${total} activities done — finish them all to complete this set!`);
    }
    renderPractice();
}

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

function renderStudio() {
    const sel = document.getElementById('spStudioChapterSel');
    const unlocked = getUnlockedChapters(getClassProgress());
    sel.innerHTML = unlocked.map(c => `<option value="${c.id}">Chapter ${c.id}: ${c.title}</option>`).join('');
    sel.value = String(getCurrentClassChapter(getClassProgress()).id);
    spStudioChapterChanged();
    renderSubmissions();
}

function renderSubmissions() {
    const hist = document.getElementById('spSubmissionHistory');
    if (!spState.creations.length) {
        hist.innerHTML = `<div class="sp-empty-state-small"><div class="sp-empty-char">🎨</div><p>No creations yet. Share your ideas!</p></div>`;
        return;
    }
    hist.innerHTML = spState.creations.slice().reverse().map(c => `
        <div class="sp-submission-card">
            <div class="sp-sub-thumb"><i class="fa-solid fa-image"></i></div>
            <div class="sp-sub-info">
                <div class="sp-sub-title">${escapeText(c.title)}</div>
                <div class="sp-sub-chapter">Chapter ${c.chapterId}</div>
                <div class="sp-sub-date">${new Date(c.date).toLocaleDateString()}</div>
            </div>
            <div class="sp-sub-status pending">Submitted</div>
        </div>
    `).join('');
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
        <h2 style="font-size:24px; font-weight:900; color:#6366F1; margin-bottom:10px;">Chapter ${ch.id}</h2>
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

    const subs = spState.creations.filter(c => c.chapterId === studioCid);
    const count = subs.length;
    document.getElementById('spLimitSub').textContent = `${count} / 2 used`;

    const dots = document.getElementById('spLimitDots');
    dots.innerHTML = `
        <div class="sp-limit-dot ${count > 0 ? 'used' : 'empty'}"></div>
        <div class="sp-limit-dot ${count > 1 ? 'used' : 'empty'}"></div>
    `;

    const form = document.getElementById('spStudioForm');
    if (count >= 2) {
        form.style.opacity = '0.5';
        form.style.pointerEvents = 'none';
        document.getElementById('spSubmitBtn').innerHTML = 'Limit Reached for this Chapter';
    } else {
        form.style.opacity = '1';
        form.style.pointerEvents = 'auto';
        document.getElementById('spSubmitBtn').innerHTML = '<i class="fa-solid fa-rocket"></i> Submit My Creation! 🚀';
    }
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
    document.getElementById('spFileInput').click();
}

function spHandleFile(e) {
    if (e.target.files.length) {
        document.getElementById('spUploadArea').classList.add('has-file');
        document.getElementById('spUploadPreview').style.display = 'block';
        document.getElementById('spUploadPreview').textContent = `Selected: ${e.target.files[0].name}`;
    }
}

function spSubmitCreation() {
    const title = document.getElementById('spSubTitle').value.trim();
    const description = document.getElementById('spSubDesc').value.trim();
    const count = spState.creations.filter(c => c.chapterId === studioCid).length;
    if (count >= 2) return;
    if (!title) { showToast('Please add a title!'); return; }
    
    spState.creations.push({
        chapterId: studioCid,
        title,
        description,
        date: new Date().toISOString()
    });
    
    addHistory(`Submitted creation: ${title}`, '🎨');
    addXP(25, 'Creation Submitted');
    if(spState.creations.length === 1) awardBadge('create_1');
    
    saveState();
    spStudioChapterChanged();
    renderSubmissions();
    document.getElementById('spSubTitle').value = '';
    document.getElementById('spSubDesc').value = '';
    document.getElementById('spUploadArea').classList.remove('has-file');
    document.getElementById('spUploadPreview').style.display = 'none';
    
    showToast('Creation submitted successfully! 🚀');
    triggerConfetti();
}

// ==========================================================================
// UTILS
// ==========================================================================
function showToast(msg) {
    const t = document.getElementById('spToast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

function triggerConfetti() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366F1', '#10B981', '#F59E0B', '#EC4899']
    });
}
