/* ==========================================================================
   Happy Minds — the two QR pages that open without a login
   progress.html?k=...   a school's progress, for its management (private link)
   portfolio.html?k=...  a school's portfolio, printed in its books (public)
   Each page reads one database function (supabase/phase7-qr-pages.sql) that
   returns only what the page shows; nothing else is reachable from here.
   ========================================================================== */

const HMPublic = (() => {
    const client = supabase.createClient(HappyMindsConfig.SUPABASE_URL, HappyMindsConfig.SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });

    const esc = text => {
        const div = document.createElement('div');
        div.textContent = String(text ?? '');
        return div.innerHTML;
    };
    const day = iso => new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const daysBetween = (a, b) => Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 86400000);
    const chapter = id => CHAPTERS.find(c => c.id === id);
    const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

    function token() {
        const k = new URLSearchParams(window.location.search).get('k') || '';
        return /^[0-9a-f]{16,64}$/.test(k) ? k : '';
    }

    // { state: 'ok', data } | { state: 'invalid' } | { state: 'error' }
    async function load(fn) {
        const k = token();
        if (!k) return { state: 'invalid' };
        try {
            const { data, error } = await client.rpc(fn, { p_token: k });
            if (error) return { state: error.code === 'PGRST202' ? 'invalid' : 'error' };
            return data ? { state: 'ok', data } : { state: 'invalid' };
        } catch (err) {
            return { state: 'error' };
        }
    }

    function showMessage(root, state, retry) {
        root.innerHTML = state === 'invalid'
            ? `<section class="pp-message">
                   <i class="fa-solid fa-link-slash" aria-hidden="true"></i>
                   <h1>This link isn't active</h1>
                   <p>It may have been replaced with a new one. Please ask Happy Minds or your school for the current QR code.</p>
               </section>`
            : `<section class="pp-message">
                   <i class="fa-solid fa-wifi" aria-hidden="true"></i>
                   <h1>Couldn't load this page</h1>
                   <p>Check your internet connection and try again.</p>
                   <button type="button" class="pp-button" id="ppRetry"><i class="fa-solid fa-rotate"></i> Try again</button>
               </section>`;
        const button = document.getElementById('ppRetry');
        if (button) button.addEventListener('click', retry);
        document.title = state === 'invalid' ? 'Link not active · Happy Minds' : 'Happy Minds';
    }

    function firstOpenChapter(completed) {
        const done = new Set(completed);
        return CHAPTERS.find(c => !done.has(c.id)) || null;
    }

    // ---------------------------------------------------------------------
    // School progress (management)
    // ---------------------------------------------------------------------
    const PACKAGE_TEXT = {
        standard: 'Standard package: the class teacher takes both sessions',
        premium: 'Premium package: our trainer takes Session 1, the class teacher Session 2',
        advance: 'Advance package: our staff take both sessions'
    };

    function progressAlerts(data) {
        const alerts = [];
        const sections = data.sections;
        const leaders = {};
        sections.forEach(s => { leaders[s.grade] = Math.max(leaders[s.grade] || 0, s.completed.length); });
        sections.forEach(s => {
            const label = `${s.grade}${s.letter}`;
            const behind = leaders[s.grade] - s.completed.length;
            if (behind >= 2) alerts.push(`<strong>${label}</strong> is ${behind} chapters behind the other Std ${s.grade} classes.`);
            if (s.last_session && daysBetween(s.last_session, data.today) > 14) alerts.push(`<strong>${label}</strong> has had no session since ${day(s.last_session)}.`);
            if (s.s2_not_done > 0) alerts.push(`<strong>${label}</strong>: ${plural(s.s2_not_done, 'Session 2 was', 'Session 2s were')} marked not done.`);
        });
        return alerts;
    }

    function renderProgress(root, data) {
        const m = data.month;
        const monthName = new Date(`${m.start}T12:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        const alerts = progressAlerts(data);
        const facts = [
            [m.s1_done, 'Session 1 held'],
            [m.s1_not_held, 'Session 1 not held'],
            [m.s2_done, 'Session 2 done'],
            [m.s2_not_done, 'Session 2 not done'],
            [m.cancelled || 0, 'Cancelled by the school'],
            [m.substitutes, 'Substitute visits']
        ];
        const rows = data.sections.map(s => {
            const next = firstOpenChapter(s.completed);
            const pct = Math.round((s.completed.length / CHAPTERS.length) * 100);
            const people = [s.trainer && `Trainer: ${esc(s.trainer)}`, s.teacher && `Class teacher: ${esc(s.teacher)}`].filter(Boolean).join(' · ');
            return `
                <tr>
                    <th scope="row" data-label="Class">
                        <span class="pp-class">${s.grade}${esc(s.letter)}</span>
                        <span class="pp-people">${people || 'No teacher or trainer assigned yet'}</span>
                        ${s.star ? `<span class="pp-star"><i class="fa-solid fa-star" aria-hidden="true"></i> Star of the Month: ${esc(s.star)}</span>` : ''}
                    </th>
                    <td data-label="Now on"><div class="pp-cell">${next ? `<span class="pp-chapter-chip" style="--chip:${getChapterGroup(next.id).deep}">Ch ${next.id}</span> ${esc(next.title)}` : 'All chapters done'}</div></td>
                    <td data-label="Chapters done"><div class="pp-cell">
                        <span class="pp-bar" role="img" aria-label="${s.completed.length} of ${CHAPTERS.length} chapters done"><span style="width:${pct}%"></span></span>
                        <span class="pp-small">${s.completed.length} of ${CHAPTERS.length}</span>
                    </div></td>
                    <td data-label="Session 1"><div class="pp-cell">${s.s1_done} held${s.s1_not_held ? `<span class="pp-warn">${s.s1_not_held} not held</span>` : ''}</div></td>
                    <td data-label="Session 2"><div class="pp-cell">${s.s2_done} done${s.s2_not_done ? `<span class="pp-warn">${s.s2_not_done} not done</span>` : ''}</div></td>
                    <td data-label="Last session"><div class="pp-cell">${s.last_session ? day(s.last_session) : '<span class="pp-muted">Not started</span>'}${s.cancelled ? `<span class="pp-small">${plural(s.cancelled, 'period', 'periods')} cancelled by the school</span>` : ''}</div></td>
                    <td data-label="Home practice"><div class="pp-cell">${s.active_30d} of ${s.students} students<span class="pp-small">${plural(s.fixit_done, 'Fix It activity', 'Fix It activities')} · ${plural(s.stories, 'story', 'stories')}</span></div></td>
                </tr>`;
        }).join('');

        document.title = `${data.school.name} · Happy Minds progress`;
        root.innerHTML = `
            <header class="pp-header">
                <div class="pp-brand"><img src="assets/logo_icon.png" alt=""> Happy Minds · School progress</div>
                <h1>${esc(data.school.name)}</h1>
                <p class="pp-meta">${esc(PACKAGE_TEXT[data.school.package] || '')} · Updated ${day(data.today)}</p>
            </header>

            <section class="pp-section" aria-labelledby="ppMonth">
                <h2 id="ppMonth">${esc(monthName)} so far</h2>
                <dl class="pp-facts">${facts.map(([n, label]) => `<div><dt>${label}</dt><dd>${n}</dd></div>`).join('')}</dl>
            </section>

            <section class="pp-section" aria-labelledby="ppAttention">
                <h2 id="ppAttention">Needs attention</h2>
                ${alerts.length
                    ? `<ul class="pp-alerts">${alerts.map(a => `<li><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><span>${a}</span></li>`).join('')}</ul>`
                    : '<p class="pp-ok"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Nothing needs attention right now.</p>'}
            </section>

            <section class="pp-section" aria-labelledby="ppClasses">
                <h2 id="ppClasses">Classes</h2>
                ${data.sections.length ? `
                <div class="pp-table-wrap">
                    <table class="pp-table">
                        <thead><tr><th scope="col">Class</th><th scope="col">Now on</th><th scope="col">Chapters done</th><th scope="col">Session 1</th><th scope="col">Session 2</th><th scope="col">Last session</th><th scope="col">Home practice <span class="pp-small">(last 30 days)</span></th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>` : '<p class="pp-muted">No classes have been set up for this school yet.</p>'}
            </section>

            <footer class="pp-footer">Facts from the Happy Minds portal, counted since the start of the programme unless marked. This page is for school management; please don't share the link.</footer>`;
    }

    // ---------------------------------------------------------------------
    // School portfolio (public, printed in the book)
    // ---------------------------------------------------------------------
    function renderPortfolio(root, data) {
        const numbers = [
            [data.chapters.length, 'Chapters completed'],
            [data.sessions, 'Lessons taught'],
            [data.stories, 'Stories written'],
            [data.fixit_done, 'Fix It activities'],
            [data.practice_done, 'Practice sets finished'],
            [data.students, 'Students']
        ];
        const chapters = data.chapters.map(chapter).filter(Boolean);

        const stories = data.showcase.map(s => {
            const ch = chapter(s.chapter);
            const long = s.text.length > 420;
            return `
                <article class="pp-story" style="--chip:${getChapterGroup(s.chapter).deep}">
                    <header>
                        <span class="pp-chapter-chip">Ch ${s.chapter}</span>
                        <span class="pp-story-title">${esc(ch ? ch.title : '')}</span>
                    </header>
                    ${long
                        ? `<details><summary><p class="pp-story-text">${esc(s.text.slice(0, 380))}…</p><span class="pp-more">Read the whole story</span></summary><p class="pp-story-text">${esc(s.text)}</p></details>`
                        : `<p class="pp-story-text">${esc(s.text)}</p>`}
                    ${s.praise ? `<p class="pp-praise"><i class="fa-solid fa-star" aria-hidden="true"></i> ${esc(s.praise)}</p>` : ''}
                    <footer>${esc(s.name)} · Std ${esc(s.class)}</footer>
                </article>`;
        }).join('');

        document.title = `${data.school.name} · Happy Minds portfolio`;
        root.innerHTML = `
            <header class="pp-hero">
                <div class="pp-brand"><img src="assets/logo_icon.png" alt=""> Happy Minds · An English Communication Journey</div>
                <h1>${esc(data.school.name)}</h1>
                <p>What our students have read, practised and written this year with Happy Minds.</p>
            </header>

            <section class="pp-section" aria-labelledby="ppNumbers">
                <h2 id="ppNumbers" class="pp-visually-hidden">Our year in numbers</h2>
                <dl class="pp-numbers">${numbers.map(([n, label]) => `<div><dd>${Number(n).toLocaleString('en-IN')}</dd><dt>${label}</dt></div>`).join('')}</dl>
            </section>

            <section class="pp-section" aria-labelledby="ppChapters">
                <h2 id="ppChapters">Chapters completed</h2>
                ${chapters.length
                    ? `<ol class="pp-chapters">${chapters.map(c => `<li style="--chip:${getChapterGroup(c.id).deep}; --chip-soft:${getChapterGroup(c.id).soft}"><span class="pp-chapter-chip">Ch ${c.id}</span> ${esc(c.title)}</li>`).join('')}</ol>`
                    : '<p class="pp-muted">Our classes have just started their journey. Chapters will appear here as they are completed.</p>'}
            </section>

            <section class="pp-section" aria-labelledby="ppStories">
                <h2 id="ppStories">Stories by our students</h2>
                ${stories
                    ? `<div class="pp-stories">${stories}</div>`
                    : '<p class="pp-muted">Our teachers will share some of our students’ stories here soon.</p>'}
            </section>

            <footer class="pp-footer">Stories are shown only when a teacher chooses them, with the student’s first name and initial. Numbers come from the Happy Minds portal. <a href="privacy.html">Privacy</a></footer>`;
    }

    async function start(fn, render) {
        const root = document.getElementById('ppRoot');
        root.setAttribute('aria-busy', 'true');
        const result = await load(fn);
        root.setAttribute('aria-busy', 'false');
        if (result.state === 'ok') render(root, result.data);
        else showMessage(root, result.state, () => { root.innerHTML = document.getElementById('ppSkeleton').innerHTML; start(fn, render); });
    }

    // ---------------------------------------------------------------------
    // Principals' portal (principal.html): one QR code for every school.
    // School code + PIN → a 12-hour session kept on this device; two tabs.
    // ---------------------------------------------------------------------
    const SESSION_KEY = 'hmPrincipal';
    const readSession = () => {
        try {
            const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
            return s && s.token && new Date(s.expires) > new Date() ? s : null;
        } catch (e) { return null; }
    };
    const saveSession = s => { try { s ? localStorage.setItem(SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSION_KEY); } catch (e) { /* this visit only */ } };
    const time = iso => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
    const monthLabel = mk => new Date(`${mk}-15T12:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    let principalTab = 'progress';
    let principalData = null;

    function signInForm(root, message = '') {
        document.title = 'Principals · Happy Minds';
        root.innerHTML = `
            <section class="pr-signin">
                <div class="pp-brand"><img src="assets/logo_icon.png" alt=""> Happy Minds · Principals’ portal</div>
                <h1>Your school’s Happy Minds progress</h1>
                <p class="pp-muted">For the Principal, Chairman and Correspondent. Type your school code and PIN from the Happy Minds slip.</p>
                <form id="prForm" novalidate>
                    <label><span>School code</span><input id="prCode" type="text" autocomplete="username" autocapitalize="characters" spellcheck="false" placeholder="e.g. HM-001" required></label>
                    <label><span>PIN</span><input id="prPin" type="password" inputmode="numeric" autocomplete="current-password" maxlength="6" placeholder="6 digits" required></label>
                    <p class="pr-error" id="prError" role="alert">${esc(message)}</p>
                    <button type="submit" class="pp-button" id="prSubmit"><i class="fa-solid fa-right-to-bracket"></i> Sign in</button>
                </form>
                <p class="pr-help">Don’t have a PIN, or lost it? Ask Happy Minds. <a href="privacy.html">Privacy</a></p>
            </section>`;
        document.getElementById('prForm').addEventListener('submit', e => { e.preventDefault(); signIn(root); });
        document.getElementById('prCode').focus();
    }

    async function signIn(root) {
        const code = document.getElementById('prCode').value.trim().toUpperCase();
        const pin = document.getElementById('prPin').value.trim();
        const error = document.getElementById('prError');
        const button = document.getElementById('prSubmit');
        if (!code) { error.textContent = 'Type your school code, e.g. HM-001.'; document.getElementById('prCode').focus(); return; }
        if (!/^\d{6}$/.test(pin)) { error.textContent = 'The PIN is 6 digits.'; document.getElementById('prPin').focus(); return; }
        button.disabled = true;
        error.textContent = 'Signing in…';
        try {
            const { data, error: err } = await client.rpc('principal_sign_in', { p_code: code, p_pin: pin });
            if (err) throw err;
            if (data.error === 'locked') { error.textContent = `Too many wrong tries. Please try again after ${time(data.until)}.`; return; }
            if (data.error) {
                error.textContent = data.left > 0 && data.left < 5
                    ? `That school code and PIN don’t match. ${plural(data.left, 'try', 'tries')} left before a 15-minute pause.`
                    : 'That school code and PIN don’t match.';
                return;
            }
            saveSession(data);
            principalTab = 'progress';
            await openDashboard(root);
        } catch (err) {
            error.textContent = err && (err.code === 'PGRST202' || err.code === '42883')
                ? 'The principals’ portal isn’t switched on yet. Please contact Happy Minds.'
                : 'Couldn’t sign in. Check your internet connection and try again.';
        } finally {
            if (document.getElementById('prSubmit')) document.getElementById('prSubmit').disabled = false;
        }
    }

    async function signOut(root) {
        const s = readSession();
        saveSession(null);
        principalData = null;
        if (s) client.rpc('principal_sign_out', { p_token: s.token }).then(() => {}, () => {});
        signInForm(root, '');
    }

    async function openDashboard(root) {
        const s = readSession();
        if (!s) return signInForm(root);
        root.innerHTML = document.getElementById('ppSkeleton').innerHTML;
        try {
            const { data, error } = await client.rpc('principal_dashboard', { p_token: s.token });
            if (error) throw error;
            if (!data) { saveSession(null); return signInForm(root, 'Your sign-in has ended. Please sign in again.'); }
            principalData = data;
            renderDashboard(root);
        } catch (err) {
            showMessage(root, 'error', () => openDashboard(root));
        }
    }

    function renderDashboard(root) {
        const data = principalData;
        root.innerHTML = `
            <nav class="pr-bar" aria-label="Principals' portal">
                <div class="pp-brand"><img src="assets/logo_icon.png" alt=""> ${esc(data.progress.school.name)}</div>
                <div class="pr-tabs" role="tablist">
                    <button type="button" role="tab" id="prTabProgress" aria-selected="${principalTab === 'progress'}" class="${principalTab === 'progress' ? 'is-active' : ''}">School progress</button>
                    <button type="button" role="tab" id="prTabPortfolio" aria-selected="${principalTab === 'portfolio'}" class="${principalTab === 'portfolio' ? 'is-active' : ''}">Portfolio &amp; awards</button>
                </div>
                <button type="button" class="pr-signout" id="prSignOut"><i class="fa-solid fa-right-from-bracket"></i> Sign out</button>
            </nav>
            <div id="prPanel" role="tabpanel"></div>`;
        const panel = document.getElementById('prPanel');
        if (principalTab === 'progress') {
            renderProgress(panel, data.progress);
        } else {
            renderPortfolio(panel, data.portfolio);
            const numbers = panel.querySelector('#ppNumbers');
            (numbers ? numbers.closest('section') : panel.querySelector('.pp-hero')).insertAdjacentHTML('afterend', recognitionHtml(data.recognition));
        }
        document.title = `${data.progress.school.name} · Happy Minds`;
        document.getElementById('prTabProgress').addEventListener('click', () => { principalTab = 'progress'; renderDashboard(root); });
        document.getElementById('prTabPortfolio').addEventListener('click', () => { principalTab = 'portfolio'; renderDashboard(root); });
        document.getElementById('prSignOut').addEventListener('click', () => signOut(root));
    }

    // Awards, Class Stars of the Month, and this month's top performers.
    function recognitionHtml(r) {
        if (!r) return '';
        const medal = n => ['🥇', '🥈', '🥉'][n - 1] || '';
        const awards = r.awards.length ? `<div class="pr-awards">${r.awards.map(a => `
            <article class="pr-award">
                <i class="fa-solid fa-award" aria-hidden="true"></i>
                <div>
                    <strong>${esc(a.title)}</strong>
                    <span>${esc(a.name)} · Std ${esc(a.class)}</span>
                    <small>${a.event ? `${esc(a.event)} · ` : ''}${day(a.date)}${a.by ? ` · given by ${esc(a.by)}` : ''}</small>
                    ${a.note ? `<p>${esc(a.note)}</p>` : ''}
                </div>
            </article>`).join('')}</div>`
            : '<p class="pp-muted">No awards yet. Awards our team gives during visits and events appear here.</p>';
        const thisMonth = r.stars.filter(s => s.month === r.month);
        const earlier = r.stars.filter(s => s.month !== r.month);
        const starList = list => `<ul class="pr-stars">${list.map(s => `<li><span class="pr-star-class">Std ${esc(s.class)}</span> <strong>${esc(s.name)}</strong>${s.month !== r.month ? ` <small>${monthLabel(s.month)}</small>` : ''}</li>`).join('')}</ul>`;
        const stars = (thisMonth.length ? starList(thisMonth) : `<p class="pp-muted">No Class Star chosen yet for ${monthLabel(r.month)}.</p>`)
            + (earlier.length ? `<details class="pr-earlier"><summary>Earlier months</summary>${starList(earlier)}</details>` : '');
        const classes = [...new Set(r.top.map(t => t.class))];
        const top = classes.length ? `<div class="pr-top">${classes.map(c => `
            <div class="pr-top-class">
                <h3>Std ${esc(c)}</h3>
                <ol>${r.top.filter(t => t.class === c).map(t => `
                    <li><span aria-hidden="true">${medal(t.rank)}</span> <strong>${esc(t.name)}</strong>
                        <small>${[t.fixit && plural(t.fixit, 'Fix It box', 'Fix It boxes'), t.practice && plural(t.practice, 'practice set', 'practice sets'), t.stories && plural(t.stories, 'story', 'stories'), t.days && `active ${plural(t.days, 'day', 'days')}`].filter(Boolean).join(' · ')}</small></li>`).join('')}</ol>
            </div>`).join('')}</div>`
            : `<p class="pp-muted">No portal work yet in ${monthLabel(r.month)}.</p>`;
        return `
            <section class="pp-section" aria-labelledby="prAwards"><h2 id="prAwards">Awards</h2>${awards}</section>
            <section class="pp-section" aria-labelledby="prStars"><h2 id="prStars">Class Stars of the Month</h2>${stars}</section>
            <section class="pp-section" aria-labelledby="prTop"><h2 id="prTop">Top performers in ${monthLabel(r.month)}</h2>
                <p class="pp-muted pr-top-help">From each student’s own work and participation in the Learning Space this month: Fix It boxes, practice sets, stories and days active.</p>${top}</section>`;
    }

    function principal() {
        const root = document.getElementById('ppRoot');
        root.setAttribute('aria-busy', 'false');
        if (readSession()) openDashboard(root); else signInForm(root);
    }

    return {
        progress: () => start('school_progress', renderProgress),
        portfolio: () => start('school_portfolio', renderPortfolio),
        principal
    };
})();
