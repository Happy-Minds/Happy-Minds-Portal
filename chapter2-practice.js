/* ==========================================================================
   CHAPTER 2 PRACTICE — "PIP'S DAILY FLIGHT" (classroom, teacher-led)
   Grammar: the Simple Present Tense, from the workbook's Grammar Spotlight
   (Chapter 2, "My Journey Begins"):
     • when we use it: things we do every day, habits and routines, and
       what we want or like
     • subject–verb agreement: I / you / we / they + plain verb;
       he / she / it (one person or thing) + -s
     • spelling the -s form: plays · watches · goes · flies
     • using it for our own habits: "I ___ / My friend ___ / We ___"
   Story: Pip dreams of flying to the North Cloud Mountains and practises
   every day. Each mission done lifts Pip one of the book's 5 Steps to
   Success; the Quick Check reaches the mountains.

   One file for both screens: view() draws a mission from `state`. The
   teacher's device (index.html, #chapter2-practice) draws it with
   controls and "Say this" prompts; the projector (projector.html) draws
   the same state without them (renderInto). Every change is sent to the
   projector as { type: 'practice-c2', state }.
   ========================================================================== */
const chapter2Practice = (() => {

    // ─── CONTENT ──────────────────────────────────────────────────────────
    const STEPS = ['Try', 'Try again', 'Try once more', 'Try it again tomorrow', 'Just keep trying'];

    const MISSIONS = [
        { id: 'm1', title: 'Again and Again?', icon: 'fa-rotate', skill: 'When we use the Simple Present' },
        { id: 'm2', title: 'Who Is Doing It?', icon: 'fa-people-group', skill: 'Subject–verb agreement' },
        { id: 'm3', title: 'The -s Machine', icon: 'fa-gears', skill: 'Spelling: -s, -es, -ies' },
        { id: 'm4', title: "Fix Pip's Training Diary", icon: 'fa-book-open', skill: 'Finding and fixing mistakes' },
        { id: 'm5', title: 'Build Your Habit', icon: 'fa-cubes', skill: 'Writing our own habits' },
        { id: 'm6', title: 'Quick Check', icon: 'fa-flag-checkered', skill: 'North Cloud Mountains' }
    ];

    // Mission 1 — the workbook's three uses, as two groups.
    const M1_GROUPS = {
        again: { label: 'Again and again', sub: 'Every day · habits · routines', icon: '🔁' },
        want: { label: 'Wants and likes', sub: 'What we want or like', icon: '💛' }
    };
    const M1_CARDS = [
        { text: 'Pip practises flying every morning.', group: 'again', why: '“Every morning” — Pip does it again and again. It is a habit.' },
        { text: 'I want to fly to the North Cloud Mountains.', group: 'want', why: '“Want” tells us what Pip wishes for.' },
        { text: 'We go to school every day.', group: 'again', why: '“Every day” — it happens again and again.' },
        { text: 'Aanya reads storybooks at night.', group: 'again', why: 'It is her routine: she does it every night.' },
        { text: 'They like mango ice cream.', group: 'want', why: '“Like” tells us what they enjoy.' },
        { text: 'My friend drinks water after lunch.', group: 'again', why: 'A small daily habit.' }
    ];

    // Mission 2 — who takes the plain verb, who takes -s.
    const M2_TEAMS = {
        plain: { label: 'Plain verb', sub: 'I · You · We · They · two or more', icon: '🟦' },
        s: { label: 'Verb + s', sub: 'He · She · It · one person or thing', icon: '🟧' }
    };
    const M2_CARDS = [
        { subject: 'I', team: 'plain', example: 'I play football every Sunday.' },
        { subject: 'She', team: 's', example: 'She reads storybooks at night.' },
        { subject: 'We', team: 'plain', example: 'We want to do well in school.' },
        { subject: 'Pip', team: 's', example: 'Pip flies every morning.' },
        { subject: 'They', team: 'plain', example: 'They practise every day.' },
        { subject: 'My friend', team: 's', example: 'My friend helps me.' },
        { subject: 'Aanya and Flame', team: 'plain', example: 'Aanya and Flame cheer for Pip.', tricky: 'Two people → plain verb.' },
        { subject: 'It', team: 's', example: 'It rains in June.' },
        { subject: 'My parents', team: 'plain', example: 'My parents work hard.', tricky: 'Parents = more than one → plain verb.' },
        { subject: 'You', team: 'plain', example: 'You read every night.' }
    ];

    // Mission 3 — the -s Machine (he / she / it forms).
    const ENDINGS = {
        s: { label: '+ s', hint: 'most verbs', rule: 'Most verbs: just add -s.' },
        es: { label: '+ es', hint: 'ends in s · sh · ch · x · o', rule: 'Verbs ending in s, ss, sh, ch, x or o: add -es.' },
        ies: { label: 'y → ies', hint: 'consonant + y', rule: 'Consonant + y: change y to i and add -es.' }
    };
    const M3_VERBS = [
        { base: 'read', form: 'reads', ending: 's' },
        { base: 'watch', form: 'watches', ending: 'es', note: 'ends in -ch' },
        { base: 'fly', form: 'flies', ending: 'ies', note: 'consonant l + y' },
        { base: 'go', form: 'goes', ending: 'es', note: 'ends in -o' },
        { base: 'play', form: 'plays', ending: 's', note: 'vowel a + y → just add -s', tricky: true },
        { base: 'brush', form: 'brushes', ending: 'es', note: 'ends in -sh' },
        { base: 'try', form: 'tries', ending: 'ies', note: 'consonant r + y' },
        { base: 'fix', form: 'fixes', ending: 'es', note: 'ends in -x' },
        { base: 'study', form: 'studies', ending: 'ies', note: 'consonant d + y' }
    ];

    // Mission 4 — Pip's training diary: one wrong verb in each line.
    const M4_LINES = [
        { words: ['Every', 'morning,', 'Pip', 'fly', 'to', 'the', 'old', 'oak', 'tree.'], wrong: 3, fix: 'flies', why: 'Pip is one bird → fly becomes flies.' },
        { words: ['Aanya', 'help', 'Pip', 'with', 'his', 'wings.'], wrong: 1, fix: 'helps', why: 'Aanya is one person → helps.' },
        { words: ['Flame', 'and', 'Pip', 'practises', 'together.'], wrong: 3, fix: 'practise', why: 'Flame and Pip are two → plain verb: practise.' },
        { words: ['Pip', 'watch', 'the', 'clouds', 'after', 'lunch.'], wrong: 1, fix: 'watches', why: 'Watch ends in -ch → watches.' },
        { words: ['“I', 'wants', 'to', 'reach', 'the', 'North', 'Cloud', 'Mountains!”'], wrong: 1, fix: 'want', why: 'With I we use the plain verb: I want.' },
        { words: ['When', 'Pip', 'falls,', 'he', 'try', 'again.'], wrong: 4, fix: 'tries', why: 'He → -s, and try (consonant + y) becomes tries.' }
    ];

    // Mission 5 — the workbook's three sentences: I… / My friend… / We…
    const M5_FRAMES = [
        { subject: 'I', needs: 'base' },
        { subject: 'My friend', needs: 's' },
        { subject: 'We', needs: 'base' }
    ];
    const M5_HABITS = [
        { base: 'read', s: 'reads', rest: '10 pages', icon: '📖' },
        { base: 'drink', s: 'drinks', rest: 'a glass of water', icon: '💧' },
        { base: 'practise', s: 'practises', rest: '10 sums', icon: '➗' },
        { base: 'help', s: 'helps', rest: 'at home', icon: '🏠' },
        { base: 'play', s: 'plays', rest: 'football', icon: '⚽' },
        { base: 'go', s: 'goes', rest: 'to bed early', icon: '🌙' },
        { base: 'wash', s: 'washes', rest: 'the dishes', icon: '🍽️' },
        { base: 'pack', s: 'packs', rest: 'my bag at night', icon: '🎒' }
    ];
    const M5_TIMES = ['every day', 'every morning', 'after school', 'on Sundays'];

    // Mission 6 — Quick Check (show of hands after the answer).
    const M6_QUESTIONS = [
        { q: 'She ___ storybooks at night.', options: ['read', 'reads'], answer: 1 },
        { q: 'We ___ to do well in school.', options: ['wants', 'want'], answer: 1 },
        { q: 'Pip ___ every morning.', options: ['flys', 'flies'], answer: 1 },
        { q: 'My friend ___ the bus to school.', options: ['catches', 'catch'], answer: 0 },
        { q: 'Which sentence tells us about a habit?', options: ['I drink water every morning.', 'I drank water yesterday.'], answer: 0 }
    ];

    // Teacher-only prompts (never sent to the projector's screen).
    const SAY = {
        intro: 'Remember Pip? He has a big dream: to fly to the North Cloud Mountains. Dreams need practice. Today we help Pip train, and we learn the words we use for things we do every day.',
        m1: 'Read the sentence together. Does it happen again and again, or does it tell us what someone wants or likes? Hands up for each group, then I will tap your choice.',
        m2: 'Here is someone doing something. Do they take the plain verb or the verb with -s? Stand up for -s, sit for plain!',
        m3: 'This is the -s Machine. Look at the end of the verb. Is it plain -s, -es, or does y turn into -ies? Shout your prediction before I press the button!',
        m4: 'Pip wrote his training diary in a hurry. One word in each line is wrong. Who can spot it? Point at it with your finger in the air.',
        m5: 'Now YOU make the sentences from your workbook. Give me a habit, then tell me which form of the verb fits.',
        m6: 'Last climb! Read the question, think, then hold up 1 or 2 fingers for your answer.',
        done: 'Pip made it! What did we learn? Plain verb with I, you, we, they. Verb plus -s with he, she, it. Now open your workbook to the Grammar Spotlight and write your three sentences.'
    };
    const TIPS = {
        m1: 'Struggling: underline the time words (every day, every morning). Advanced: ask them to change one sentence into a want.',
        m2: 'Struggling: “Is it one person or thing (not I or you)? Then add -s.” Advanced: give a subject with “and”.',
        m3: 'Struggling: show the last two letters only. Advanced: ask for another verb with the same ending.',
        m4: 'Struggling: read the line aloud slowly; ask “Is it one or many?”. Advanced: ask them to say why.',
        m5: 'Shy students: let them whisper a habit to you and you say it. Advanced: add a time word of their own.',
        m6: 'If many hands are low on a question, go back to that mission for one more example.'
    };

    // ─── STATE ────────────────────────────────────────────────────────────
    const fresh = () => ({
        screen: 'intro',
        done: [],                                   // mission ids finished
        m1: { i: 0, pick: null, shown: false, right: 0 },
        m2: { i: 0, pick: null, shown: false, right: 0 },
        m3: { i: 0, pick: null, shown: false, right: 0 },
        m4: { i: 0, pick: null, shown: false, misses: 0, right: 0 },
        m5: { frame: 0, habit: null, form: null, time: null, wall: [] },
        m6: { i: 0, pick: null, shown: false, hands: [] }
    });
    let state = fresh();

    // ─── SMALL HELPERS ────────────────────────────────────────────────────
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const missionIndex = id => MISSIONS.findIndex(m => m.id === id);

    // A control: a real button on the teacher's device, a plain tile on the projector.
    function control(mode, label, action, cls = '', extra = '') {
        if (mode === 'projector') return `<div class="c2p-chip ${cls}">${label}</div>`;
        return `<button type="button" class="c2p-chip ${cls}" onclick="chapter2Practice.act(${esc(JSON.stringify(action))})" ${extra}>${label}</button>`;
    }
    const teacherOnly = (mode, html) => (mode === 'projector' ? '' : html);
    const say = (mode, key) => teacherOnly(mode, `
        <aside class="c2p-say"><strong><i class="fa-solid fa-comment-dots"></i> Say this</strong><p>${esc(SAY[key])}</p>
        ${TIPS[key] ? `<p class="c2p-tip"><i class="fa-solid fa-lightbulb"></i> ${esc(TIPS[key])}</p>` : ''}</aside>`);

    // ─── VIEW (shared by both screens) ────────────────────────────────────
    function climb(s) {
        const reached = Math.min(s.done.filter(id => id !== 'm6').length, STEPS.length);
        const summit = s.done.includes('m6');
        return `
            <div class="c2p-climb" aria-label="Pip has climbed ${reached} of ${STEPS.length} steps${summit ? ' and reached the North Cloud Mountains' : ''}">
                ${STEPS.map((step, i) => `
                    <div class="c2p-step ${i < reached ? 'is-done' : ''} ${i === reached && !summit ? 'is-next' : ''}">
                        <span class="c2p-step-dot">${i < reached ? '<i class="fa-solid fa-check"></i>' : i + 1}</span>
                        <span class="c2p-step-label">${step}</span>
                        ${i === reached - 1 && !summit ? '<img class="c2p-pip" src="assets/pip_bird.jpg" alt="Pip">' : ''}
                    </div>`).join('')}
                <div class="c2p-step c2p-summit ${summit ? 'is-done' : ''}">
                    <span class="c2p-step-dot"><i class="fa-solid fa-mountain-sun"></i></span>
                    <span class="c2p-step-label">North Cloud Mountains</span>
                    ${summit ? '<img class="c2p-pip" src="assets/pip_bird.jpg" alt="Pip">' : ''}
                </div>
            </div>`;
    }

    function header(s, mode, m) {
        const n = missionIndex(m.id);
        return `
            <header class="c2p-head">
                <div class="c2p-head-title">
                    <span class="c2p-badge"><i class="fa-solid ${m.icon}"></i> Mission ${n + 1} of ${MISSIONS.length}</span>
                    <h2>${esc(m.title)}</h2>
                    <p class="c2p-skill">${esc(m.skill)}</p>
                </div>
                ${teacherOnly(mode, `<nav class="c2p-missions" aria-label="Missions">${MISSIONS.map((x, i) => `
                    <button type="button" class="${x.id === s.screen ? 'is-current' : ''} ${s.done.includes(x.id) ? 'is-done' : ''}" onclick="chapter2Practice.act({go:'${x.id}'})" title="${esc(x.title)}">${s.done.includes(x.id) ? '<i class="fa-solid fa-check"></i>' : i + 1}</button>`).join('')}</nav>`)}
            </header>
            ${climb(s)}`;
    }

    function result(ok, title, body) {
        return `<div class="c2p-result ${ok ? 'is-right' : 'is-wrong'}" role="status">
            <span class="c2p-result-emoji">${ok ? '🎉' : '🤔'}</span>
            <div><strong>${title}</strong><p>${body}</p></div></div>`;
    }

    function nextRow(mode, label, action) {
        return teacherOnly(mode, `<div class="c2p-next">${control(mode, `${label} <i class="fa-solid fa-arrow-right"></i>`, action, 'is-primary')}</div>`);
    }

    function viewIntro(s, mode) {
        return `
            <section class="c2p-intro">
                <img class="c2p-intro-img" src="assets/StoryBook/chapter2-storybook/page2-pips-dream.jpg" alt="Pip tells Aanya about his dream">
                <div class="c2p-intro-text">
                    <span class="c2p-badge"><i class="fa-solid fa-feather"></i> Chapter 2 · Practice</span>
                    <h2>Pip's Daily Flight</h2>
                    <p>Pip dreams of flying to the <strong>North Cloud Mountains</strong>. To get there, he practises <strong>every day</strong>. Help Pip train, and learn the <strong>Simple Present Tense</strong>: the words we use for things we do again and again.</p>
                    <ul class="c2p-intro-missions">${MISSIONS.map((m, i) => `<li><i class="fa-solid ${m.icon}"></i> ${i + 1}. ${esc(m.title)}</li>`).join('')}</ul>
                    ${teacherOnly(mode, `<div class="c2p-next">${control(mode, 'Start the flight <i class="fa-solid fa-paper-plane"></i>', { go: 'm1' }, 'is-primary is-big')}</div>`)}
                </div>
            </section>
            ${say(mode, 'intro')}`;
    }

    function viewM1(s, mode) {
        const st = s.m1;
        if (st.i >= M1_CARDS.length) return finishCard(mode, 'm1', `${st.right} of ${M1_CARDS.length} right!`, 'We use the Simple Present for things we do <strong>again and again</strong> (every day, habits, routines) and for what we <strong>want or like</strong>.');
        const card = M1_CARDS[st.i];
        return `
            <div class="c2p-rule"><strong>The Simple Present</strong> tells us about <span>1. things we do every day</span> <span>2. our habits and routines</span> <span>3. what we want or like</span></div>
            <div class="c2p-card"><span class="c2p-count">${st.i + 1} / ${M1_CARDS.length}</span><p class="c2p-sentence">${esc(card.text)}</p></div>
            <div class="c2p-choices">${Object.entries(M1_GROUPS).map(([k, g]) =>
                control(mode, `<span class="c2p-choice-icon">${g.icon}</span><span><b>${g.label}</b><small>${g.sub}</small></span>`, { m1: k },
                    `is-choice ${st.shown && card.group === k ? 'is-answer' : ''} ${st.shown && st.pick === k && card.group !== k ? 'is-missed' : ''}`, st.shown ? 'disabled' : '')).join('')}</div>
            ${st.shown ? result(st.pick === card.group, st.pick === card.group ? 'Yes!' : 'Not quite', esc(card.why)) + nextRow(mode, 'Next sentence', { m1next: 1 }) : ''}
            ${say(mode, 'm1')}`;
    }

    function viewM2(s, mode) {
        const st = s.m2;
        if (st.i >= M2_CARDS.length) return finishCard(mode, 'm2', `${st.right} of ${M2_CARDS.length} right!`, '<strong>I, you, we, they</strong> (and two or more) → plain verb. <strong>He, she, it</strong> (one person or thing) → verb + <strong>s</strong>.');
        const card = M2_CARDS[st.i];
        return `
            <div class="c2p-card c2p-subject"><span class="c2p-count">${st.i + 1} / ${M2_CARDS.length}</span><p class="c2p-big">${esc(card.subject)}</p><p class="c2p-hint">… practise every day?  or  … practises every day?</p></div>
            <div class="c2p-choices">${Object.entries(M2_TEAMS).map(([k, t]) =>
                control(mode, `<span class="c2p-choice-icon">${t.icon}</span><span><b>${t.label}</b><small>${t.sub}</small></span>`, { m2: k },
                    `is-choice ${st.shown && card.team === k ? 'is-answer' : ''} ${st.shown && st.pick === k && card.team !== k ? 'is-missed' : ''}`, st.shown ? 'disabled' : '')).join('')}</div>
            ${st.shown ? result(st.pick === card.team, st.pick === card.team ? 'Correct!' : 'Not quite', `<b>${esc(card.example)}</b>${card.tricky ? `<br>${esc(card.tricky)}` : ''}`) + nextRow(mode, 'Next', { m2next: 1 }) : ''}
            ${say(mode, 'm2')}`;
    }

    function viewM3(s, mode) {
        const st = s.m3;
        if (st.i >= M3_VERBS.length) return finishCard(mode, 'm3', `${st.right} of ${M3_VERBS.length} predicted right!`,
            Object.values(ENDINGS).map(e => `<b>${e.label}</b>: ${esc(e.rule)}`).join('<br>'));
        const v = M3_VERBS[st.i];
        const stem = v.ending === 'ies' ? v.base.slice(0, -1) : v.base;
        const add = v.ending === 's' ? 's' : v.ending === 'es' ? 'es' : 'ies';
        return `
            <div class="c2p-machine ${st.shown ? 'is-on' : ''}">
                <span class="c2p-count">${st.i + 1} / ${M3_VERBS.length}</span>
                <div class="c2p-machine-in"><small>He / She / It</small><b>${esc(v.base)}</b></div>
                <div class="c2p-machine-box" aria-hidden="true"><i class="fa-solid fa-gear c2p-gear"></i><i class="fa-solid fa-gear c2p-gear is-small"></i></div>
                <div class="c2p-machine-out">${st.shown ? `<b>${esc(stem)}<em>${add}</em></b><small>${esc(v.note || ENDINGS[v.ending].rule)}</small>` : '<b>?</b><small>What comes out?</small>'}</div>
            </div>
            <div class="c2p-choices is-three">${Object.entries(ENDINGS).map(([k, e]) =>
                control(mode, `<span><b class="c2p-ending">${e.label}</b><small>${e.hint}</small></span>`, { m3: k }, `is-choice is-ending ${st.shown && v.ending === k ? 'is-answer' : ''} ${st.shown && st.pick === k && v.ending !== k ? 'is-missed' : ''}`, st.shown ? 'disabled' : '')).join('')}</div>
            ${st.shown ? result(st.pick === v.ending, st.pick === v.ending ? `Yes! He ${v.form}.` : `It's “${v.form}”`, esc(ENDINGS[v.ending].rule)) + nextRow(mode, 'Next verb', { m3next: 1 }) : ''}
            ${say(mode, 'm3')}`;
    }

    function viewM4(s, mode) {
        const st = s.m4;
        if (st.i >= M4_LINES.length) return finishCard(mode, 'm4', 'Pip’s diary is fixed!', 'Look at <strong>who</strong> is doing the action: one person or thing (not I or you) → add <strong>-s</strong>.');
        const line = M4_LINES[st.i];
        const words = line.words.map((w, wi) => {
            const isWrong = wi === line.wrong;
            if (st.shown && isWrong) return `<span class="c2p-word is-fixed"><s>${esc(w.replace(/[“”]/g, ''))}</s> ${esc(line.fix)}</span>`;
            if (mode === 'projector' || st.shown) return `<span class="c2p-word ${st.pick === wi && !isWrong ? 'is-missed' : ''}">${esc(w)}</span>`;
            return `<button type="button" class="c2p-word ${st.pick === wi ? 'is-missed' : ''}" onclick="chapter2Practice.act({m4:${wi}})">${esc(w)}</button>`;
        }).join(' ');
        return `
            <div class="c2p-diary">
                <img src="assets/StoryBook/chapter2-storybook/page7-pip-practises-flight.jpg" alt="Pip practising his flight">
                <div><span class="c2p-count">Diary line ${st.i + 1} / ${M4_LINES.length}</span><p class="c2p-diary-line">${words}</p>
                <p class="c2p-hint">${st.shown ? '' : 'Which word is wrong? Tap it.'}</p></div>
            </div>
            ${st.shown ? result(true, 'Fixed!', esc(line.why)) + nextRow(mode, 'Next line', { m4next: 1 })
                : st.pick !== null ? result(false, 'Look again', 'That word is fine. Find the action word (the verb) and ask: who is doing it?') : ''}
            ${say(mode, 'm4')}`;
    }

    function viewM5(s, mode) {
        const st = s.m5;
        const wall = st.wall.length ? `<ul class="c2p-wall">${st.wall.map(w => `<li><i class="fa-solid fa-feather"></i> ${esc(w)}</li>`).join('')}</ul>` : '';
        if (st.frame >= M5_FRAMES.length) return finishCard(mode, 'm5', 'Our Habit Wall', `${wall}<p>Now write your own three sentences in the workbook: <b>I…</b> · <b>My friend…</b> · <b>We…</b></p>`);
        const frame = M5_FRAMES[st.frame];
        const habit = st.habit !== null ? M5_HABITS[st.habit] : null;
        const formOk = habit && st.form && (frame.needs === 's' ? st.form === habit.s : st.form === habit.base);
        const sentence = [frame.subject, habit && st.form ? st.form : '___', habit ? habit.rest : '___', st.time || '___'].join(' ') + '.';
        let stepHtml;
        if (!habit) {
            stepHtml = `<p class="c2p-step-q">1. Choose a habit</p><div class="c2p-choices is-grid">${M5_HABITS.map((h, hi) =>
                control(mode, `<span class="c2p-choice-icon">${h.icon}</span><span>${esc(h.base)} ${esc(h.rest)}</span>`, { m5habit: hi }, 'is-choice is-small')).join('')}</div>`;
        } else if (!formOk) {
            stepHtml = `<p class="c2p-step-q">2. Which verb fits “${esc(frame.subject)}”?</p><div class="c2p-choices">${[habit.base, habit.s].map(f =>
                control(mode, `<b>${esc(f)}</b>`, { m5form: f }, `is-choice ${st.form === f ? 'is-missed' : ''}`)).join('')}</div>
                ${st.form ? result(false, 'Not quite', frame.needs === 's' ? `“${esc(frame.subject)}” is one person → add -s.` : `With “${esc(frame.subject)}” we use the plain verb.`) : ''}`;
        } else if (!st.time) {
            stepHtml = `<p class="c2p-step-q">3. When? Add a time word</p><div class="c2p-choices is-grid">${M5_TIMES.map(t => control(mode, esc(t), { m5time: t }, 'is-choice is-small')).join('')}</div>`;
        } else {
            stepHtml = result(true, 'A perfect habit sentence!', `“${esc(sentence)}”`) + nextRow(mode, st.frame < M5_FRAMES.length - 1 ? 'Add to the wall · next sentence' : 'Add to the wall', { m5add: 1 });
        }
        return `
            <div class="c2p-builder">
                <span class="c2p-count">Sentence ${st.frame + 1} / ${M5_FRAMES.length}</span>
                <p class="c2p-built">${esc(sentence)}</p>
                ${stepHtml}
            </div>
            ${wall ? `<h3 class="c2p-wall-title">Our Habit Wall</h3>${wall}` : ''}
            ${say(mode, 'm5')}`;
    }

    function viewM6(s, mode) {
        const st = s.m6;
        if (st.i >= M6_QUESTIONS.length) {
            const few = st.hands.filter(h => h === 'few').length;
            return finishCard(mode, 'm6', 'Quick Check done!', few ? `${few} question${few === 1 ? '' : 's'} had few hands up. Go over the -s rule once more in Session 2.` : 'The class knows the Simple Present!');
        }
        const q = M6_QUESTIONS[st.i];
        return `
            <div class="c2p-card"><span class="c2p-count">Question ${st.i + 1} / ${M6_QUESTIONS.length}</span><p class="c2p-sentence">${esc(q.q)}</p></div>
            <div class="c2p-choices">${q.options.map((o, oi) =>
                control(mode, `<span class="c2p-choice-icon">${oi + 1}</span><span><b>${esc(o)}</b></span>`, { m6: oi },
                    `is-choice ${st.shown && q.answer === oi ? 'is-answer' : ''} ${st.shown && st.pick === oi && q.answer !== oi ? 'is-missed' : ''}`, st.shown ? 'disabled' : '')).join('')}</div>
            ${st.shown ? `${result(st.pick === q.answer, st.pick === q.answer ? 'Correct!' : 'The answer is ' + (q.answer + 1), `<b>${esc(q.q.replace('___', q.options[q.answer]))}</b>`)}
                ${teacherOnly(mode, `<div class="c2p-hands"><span>How many hands were right?</span>${['many', 'some', 'few'].map(h => control(mode, h[0].toUpperCase() + h.slice(1), { m6hands: h }, 'is-small')).join('')}</div>`)}` : ''}
            ${say(mode, 'm6')}`;
    }

    function finishCard(mode, id, title, body) {
        const n = missionIndex(id);
        const next = MISSIONS[n + 1];
        return `
            <div class="c2p-finish">
                <span class="c2p-finish-emoji">${id === 'm6' ? '🏔️' : '🪶'}</span>
                <h3>${esc(title)}</h3>
                <div class="c2p-finish-body">${body}</div>
                ${id !== 'm6' ? `<p class="c2p-finish-step">Pip climbs: <b>${esc(STEPS[Math.min(n, STEPS.length - 1)])}</b></p>` : ''}
            </div>
            ${nextRow(mode, next ? `Mission ${n + 2}: ${next.title}` : 'See Pip reach the mountains', next ? { go: next.id } : { go: 'done' })}
            ${say(mode, id)}`;
    }

    function viewDone(s, mode) {
        return `
            <section class="c2p-done">
                <img src="assets/StoryBook/chapter2-storybook/page8-celebrating-progress.jpg" alt="Pip and his friends celebrate">
                <div>
                    <span class="c2p-badge"><i class="fa-solid fa-mountain-sun"></i> North Cloud Mountains</span>
                    <h2>Pip made it!</h2>
                    <ul class="c2p-rules">
                        <li><b>I · You · We · They</b> → <span>play · read · want</span></li>
                        <li><b>He · She · It · Pip</b> → <span>plays · reads · wants</span></li>
                        <li><b>-es</b> after s, sh, ch, x, o → <span>watches · goes</span></li>
                        <li><b>consonant + y → ies</b> → <span>flies · tries</span></li>
                    </ul>
                    ${s.m5.wall.length ? `<h3 class="c2p-wall-title">Our Habit Wall</h3><ul class="c2p-wall">${s.m5.wall.map(w => `<li><i class="fa-solid fa-feather"></i> ${esc(w)}</li>`).join('')}</ul>` : ''}
                    ${teacherOnly(mode, `<div class="c2p-next">${control(mode, 'Practice again', { restart: 1 })}${control(mode, 'Continue to Create <i class="fa-solid fa-arrow-right"></i>', { finish: 1 }, 'is-primary is-big')}</div>`)}
                </div>
            </section>
            ${say(mode, 'done')}`;
    }

    function view(s, mode) {
        const m = MISSIONS.find(x => x.id === s.screen);
        const body = s.screen === 'intro' ? viewIntro(s, mode)
            : s.screen === 'done' ? `${climb(s)}${viewDone(s, mode)}`
            : header(s, mode, m) + ({ m1: viewM1, m2: viewM2, m3: viewM3, m4: viewM4, m5: viewM5, m6: viewM6 }[s.screen])(s, mode);
        return `<div class="c2p c2p-${mode}">${body}</div>`;
    }

    // ─── TEACHER CONTROLLER ───────────────────────────────────────────────
    const root = () => document.getElementById('chapter2-practice');

    function emit() {
        if (typeof broadcastToProjector === 'function') broadcastToProjector({ type: 'practice-c2', state });
    }

    function render() {
        const el = root();
        if (!el) return;
        el.innerHTML = view(state, 'teacher');
        emit();
    }

    function markDone(id) {
        if (!state.done.includes(id)) state.done.push(id);
    }

    function act(a) {
        if (a.go) {
            state.screen = a.go;
        } else if (a.restart) {
            state = fresh();
        } else if (a.finish) {
            const needsFixIt = state.m6.hands.includes('few');
            if (typeof completeChapter2Practice === 'function') completeChapter2Practice(needsFixIt);
            return;
        } else if ('m1' in a || 'm2' in a || 'm3' in a || 'm6' in a) {
            const key = ['m1', 'm2', 'm3', 'm6'].find(k => k in a);
            const st = state[key];
            if (st.shown) return;
            st.pick = a[key];
            st.shown = true;
            const correct = key === 'm1' ? M1_CARDS[st.i].group === st.pick
                : key === 'm2' ? M2_CARDS[st.i].team === st.pick
                : key === 'm3' ? M3_VERBS[st.i].ending === st.pick
                : M6_QUESTIONS[st.i].answer === st.pick;
            if (correct && key !== 'm6') st.right += 1;
        } else if (a.m1next || a.m2next || a.m3next) {
            const key = a.m1next ? 'm1' : a.m2next ? 'm2' : 'm3';
            const st = state[key];
            st.i += 1; st.pick = null; st.shown = false;
            const total = { m1: M1_CARDS, m2: M2_CARDS, m3: M3_VERBS }[key].length;
            if (st.i >= total) markDone(key);
        } else if ('m4' in a) {
            const st = state.m4;
            if (st.shown) return;
            st.pick = a.m4;
            if (a.m4 === M4_LINES[st.i].wrong) { st.shown = true; st.right += 1; } else { st.misses += 1; }
        } else if (a.m4next) {
            const st = state.m4;
            st.i += 1; st.pick = null; st.shown = false;
            if (st.i >= M4_LINES.length) markDone('m4');
        } else if ('m5habit' in a) {
            Object.assign(state.m5, { habit: a.m5habit, form: null, time: null });
        } else if ('m5form' in a) {
            state.m5.form = a.m5form;
        } else if ('m5time' in a) {
            state.m5.time = a.m5time;
        } else if (a.m5add) {
            const st = state.m5;
            const frame = M5_FRAMES[st.frame];
            const habit = M5_HABITS[st.habit];
            st.wall.push(`${frame.subject} ${st.form} ${habit.rest} ${st.time}.`);
            Object.assign(st, { frame: st.frame + 1, habit: null, form: null, time: null });
            if (st.frame >= M5_FRAMES.length) markDone('m5');
        } else if (a.m6hands) {
            const st = state.m6;
            st.hands[st.i] = a.m6hands;
            st.i += 1; st.pick = null; st.shown = false;
            if (st.i >= M6_QUESTIONS.length) markDone('m6');
        }
        render();
        const el = root();
        if (el && a.go) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }

    return {
        // Teacher's device: draw (first visit) or redraw (keeps progress).
        mount() { render(); },
        act,
        // Projector: draw the teacher's current state, without controls.
        renderInto(el, s) { el.innerHTML = view(s, 'projector'); },
        // A projector that (re)connects mid-practice catches up.
        broadcastCurrentState: emit,
        // For tests and the script: the content.
        content: { MISSIONS, STEPS, M1_CARDS, M2_CARDS, M3_VERBS, M4_LINES, M5_FRAMES, M5_HABITS, M6_QUESTIONS }
    };
})();
