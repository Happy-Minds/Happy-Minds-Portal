/* ============================================
   CHAPTER 1 PRACTICE — EXPANDED EXPERIENCE
   Nouns Focus: Common and Proper Nouns
   ============================================ */

const chapter1Practice = (() => {

    // ── STORY DATA ────────────────────────────────────────────────────────────
    const STORY = {
        title: 'The Door That Wasn\'t There',
        characters: {
            aanya: { name: 'Aanya', img: 'assets/girl_aanya.png', emoji: '👧' },
            flame: { name: 'Flame', img: 'assets/dragon_buddy.png', emoji: '🐉' },
            pip:   { name: 'Pip',   img: 'assets/pip_bird.jpg',    emoji: '🐦' }
        }
    };

    // ── ACTIVITY DATA ─────────────────────────────────────────────────────────

    const ACTIVITIES = [
        {
            id: 1, key: 'comprehension', title: 'Story Comprehension', emoji: '📖', color: '#4A6CF7',
            skill: 'Reading & Nouns', description: 'Read the story and find the nouns'
        },
        {
            id: 2, key: 'nouns_sort_interactive', title: 'Common or Proper?', emoji: '🃏', color: '#A855F7',
            skill: 'Noun Classification', description: 'Is it a Common or Proper Noun?'
        },
        {
            id: 3, key: 'nouns_sort', title: 'Noun Sorting Challenge', emoji: '🏷️', color: '#F59E0B',
            skill: 'Grammar — Nouns', description: 'Sort words into the right container'
        },
        {
            id: 4, key: 'find_nouns', title: 'Find the Nouns', emoji: '🔎', color: '#10B981',
            skill: 'Noun Identification', description: 'Select the nouns in each sentence'
        },
        {
            id: 5, key: 'capital_detective', title: 'Capital Letter Detective', emoji: '🕵️', color: '#3B82F6',
            skill: 'Capitalization', description: 'Correct the capitalization mistakes'
        },
        {
            id: 6, key: 'fill_blanks', title: 'Complete the Sentence', emoji: '✏️', color: '#EC4899',
            skill: 'Vocabulary & Nouns', description: 'Choose the correct noun for the blank'
        },
        {
            id: 7, key: 'quick_challenge', title: 'Quick Challenge', emoji: '⚡', color: '#8B5CF6',
            skill: 'Speed Recognition', description: 'Fast! Common or Proper Noun?'
        },
        {
            id: 8, key: 'detective_mission', title: 'Noun Detective Mission', emoji: '🌟', color: '#EF4444',
            skill: 'Comprehensive Nouns', description: 'Find specific nouns in the story'
        }
    ];

    const COMPREHENSION_QS = [
        {
            paragraph: 'One rainy Saturday, Aanya was tidying her room when she noticed something strange: a small wooden door standing against her cupboard.',
            question: 'Which word is the proper noun in this paragraph?',
            options: ['room', 'door', 'Aanya', 'cupboard'],
            answer: 'Aanya',
            explanation: 'Aanya is the name of a specific person, so it is a proper noun.'
        },
        {
            paragraph: 'She opened the door and stepped through. Instead of the back of her cupboard, she walked into a meadow of purple grass.',
            question: 'What is the common noun for the place Aanya walked into?',
            options: ['door', 'meadow', 'grass', 'cupboard'],
            answer: 'meadow',
            explanation: '"meadow" is a common noun naming a general place.'
        },
        {
            paragraph: '"Hello?" she called. A golden-eyed dragon peered from behind a silver tree. "I\'m Flame," it said with a friendly nod. "Welcome to Lumora."',
            question: 'What are the two proper nouns in this paragraph?',
            options: ['dragon and tree', 'Flame and Lumora', 'Hello and Welcome', 'golden-eyed and silver'],
            answer: 'Flame and Lumora',
            explanation: 'Flame is the specific name of the dragon, and Lumora is the specific name of the magical world.'
        },
        {
            paragraph: 'Flame carried Aanya over sparkling rivers and past a castle built entirely of fluffy clouds.',
            question: 'Which of these is a common noun found in the paragraph?',
            options: ['Flame', 'Aanya', 'castle', 'sparkling'],
            answer: 'castle',
            explanation: '"castle" is a common noun because it names a general thing/place.'
        },
        {
            paragraph: 'A tiny blue bird landed on her shoulder. She smiled and whispered, "I think I will name you Pip."',
            question: 'Why is "Pip" capitalized in this paragraph?',
            options: ['It is the first word of the sentence.', 'It is an adjective.', 'It is a common noun.', 'It is a proper noun.'],
            answer: 'It is a proper noun.',
            explanation: '"Pip" is capitalized because it is a proper noun, the specific name of the bird.'
        },
        {
            paragraph: 'In the busy market, Aanya saw chattering fox-like creatures who spoke backward. Merchants were selling glowing bottled starlight.',
            question: 'Which of the following words from the paragraph is NOT a noun?',
            options: ['market', 'creatures', 'selling', 'starlight'],
            answer: 'selling',
            explanation: '"selling" is an action word (verb), not a noun.'
        },
        {
            paragraph: 'As the sky began to dim, Aanya asked, "Will I ever come back?" Flame smiled. "Whenever you open your mind, the door finds you."',
            question: 'Which common noun names the time of day when things get dark?',
            options: ['sky', 'mind', 'door', 'None of the above'],
            answer: 'sky',
            explanation: '"sky" is a common noun.'
        },
        {
            paragraph: 'Aanya stepped back through the door into her own room. In her pocket, she found a single glowing feather.',
            question: 'How many common nouns are in the phrase "a single glowing feather"?',
            options: ['0', '1', '2', '3'],
            answer: '1',
            explanation: 'Only "feather" is a common noun. "single" and "glowing" are adjectives describing the feather.'
        }
    ];

    const INTERACTIVE_CARDS = [
        { word: 'Aanya', answer: 'Proper Noun' },
        { word: 'girl', answer: 'Common Noun' },
        { word: 'Flame', answer: 'Proper Noun' },
        { word: 'dragon', answer: 'Common Noun' },
        { word: 'Lumora', answer: 'Proper Noun' },
        { word: 'meadow', answer: 'Common Noun' },
        { word: 'Pip', answer: 'Proper Noun' },
        { word: 'bird', answer: 'Common Noun' },
        { word: 'Saturday', answer: 'Proper Noun' },
        { word: 'castle', answer: 'Common Noun' },
        { word: 'river', answer: 'Common Noun' },
        { word: 'door', answer: 'Common Noun' },
        { word: 'feather', answer: 'Common Noun' }
    ];

    const NOUNS_DATA = [
        { word: 'Aanya',    type: 'proper',  hint: 'A specific person\'s name' },
        { word: 'Dragon',   type: 'common',  hint: 'A general type of creature' },
        { word: 'Flame',    type: 'proper',  hint: 'The dragon\'s special name' },
        { word: 'Meadow',   type: 'common',  hint: 'A type of grassy area' },
        { word: 'Lumora',   type: 'proper',  hint: 'The name of the magical world' },
        { word: 'Bird',     type: 'common',  hint: 'A general type of animal' },
        { word: 'Pip',      type: 'proper',  hint: 'The blue bird\'s special name' },
        { word: 'Castle',   type: 'common',  hint: 'A type of large building' },
        { word: 'Saturday', type: 'proper',  hint: 'The name of a specific day' },
        { word: 'River',    type: 'common',  hint: 'A body of flowing water' }
    ];

    const FIND_NOUNS_QS = [
        { sentence: 'Aanya opened the door.', words: ['Aanya', 'opened', 'the', 'door'], nouns: ['Aanya', 'door'], proper: ['Aanya'], common: ['door'] },
        { sentence: 'Flame carried Aanya.', words: ['Flame', 'carried', 'Aanya'], nouns: ['Flame', 'Aanya'], proper: ['Flame', 'Aanya'], common: [] },
        { sentence: 'Pip landed on her shoulder.', words: ['Pip', 'landed', 'on', 'her', 'shoulder'], nouns: ['Pip', 'shoulder'], proper: ['Pip'], common: ['shoulder'] },
        { sentence: 'The dragon visited Lumora.', words: ['The', 'dragon', 'visited', 'Lumora'], nouns: ['dragon', 'Lumora'], proper: ['Lumora'], common: ['dragon'] },
        { sentence: 'A girl found a feather.', words: ['A', 'girl', 'found', 'a', 'feather'], nouns: ['girl', 'feather'], proper: [], common: ['girl', 'feather'] }
    ];

    const CAPITAL_QS = [
        { original: 'aanya met flame in lumora.', correct: 'Aanya met Flame in Lumora.' },
        { original: 'one rainy saturday, she found a door.', correct: 'One rainy Saturday, she found a door.' },
        { original: 'pip is a tiny blue bird.', correct: 'Pip is a tiny blue bird.' },
        { original: 'the dragon was named flame.', correct: 'The dragon was named Flame.' }
    ];

    const FILL_BLANKS_QS = [
        { sentence: 'Aanya met a friendly ______ named Flame.', answer: 'dragon', options: ['dragon', 'saturday', 'river', 'cupboard'], explanation: 'Flame is a dragon. "dragon" is a common noun.' },
        { sentence: 'The magical world was called ______.', answer: 'Lumora', options: ['meadow', 'Lumora', 'castle', 'feather'], explanation: 'Lumora is the specific name of the magical world. It is a proper noun.' },
        { sentence: 'A tiny blue ______ landed on her shoulder.', answer: 'bird', options: ['bird', 'Flame', 'Pip', 'Aanya'], explanation: '"bird" is a common noun that fits perfectly.' },
        { sentence: 'The bird\'s name was ______.', answer: 'Pip', options: ['bird', 'feather', 'Pip', 'door'], explanation: '"Pip" is the proper noun representing the bird\'s name.' },
        { sentence: 'She found a magical ______ against her cupboard.', answer: 'door', options: ['door', 'Saturday', 'Aanya', 'Lumora'], explanation: '"door" is a common noun.' }
    ];

    const DETECTIVE_MISSION = {
        paragraph: 'One rainy Saturday, Aanya was tidying her room when she noticed something strange: a small wooden door standing against her cupboard. She opened the door and stepped through. Instead of the back of her cupboard, she walked into a meadow of purple grass. A golden-eyed dragon peered from behind a silver tree. "I\'m Flame," it said.',
        targets: { proper: 3, common: 7 }, // Need to find 2 proper, 2 common.
        allProper: ['Saturday', 'Aanya', 'Flame'],
        allCommon: ['room', 'door', 'cupboard', 'meadow', 'grass', 'dragon', 'tree']
    };


    // ── STATE ─────────────────────────────────────────────────────────────────
    let _state = null;

    function freshState() {
        return {
            screen: 'dashboard',          
            activityId: null,
            scores: {},                   
            // Per-activity runtime state
            comprehension: { qIndex: 0, answers: [], attempts: [] },
            nouns_sort_interactive: { qIndex: 0, answers: [], attempts: [] },
            nouns_sort:    { placed: {}, attempts: {} },
            find_nouns:    { qIndex: 0, selected: [], attempts: [], answered: false },
            capital_detective: { qIndex: 0, typed: '', attempts: [], answered: false },
            fill_blanks:   { qIndex: 0, answers: [], attempts: [] },
            quick_challenge:{ qIndex: 0, score: 0, timeRemaining: 30, isActive: false },
            detective_mission: { selected: [], attempts: 0, completed: false }
        };
    }

    // Saved per student, so each child sees only their own scores.
    let PERSIST_KEY = null;
    const keyFor = studentId => `ch1PracticeState_${studentId}`;

    function saveState() {
        if (!PERSIST_KEY) return;
        try { localStorage.setItem(PERSIST_KEY, JSON.stringify(_state)); } catch {}
    }

    function loadState(key) {
        try {
            const s = JSON.parse(localStorage.getItem(key));
            if (s && s.screen) return s;
        } catch {}
        return null;
    }

    // ── HELPERS ──────────────────────────────────────────────────────────────
    const ROOT = document.getElementById('chapter1-practice');
    const $ = (sel, ctx) => (ctx || ROOT).querySelector(sel);
    const $$ = (sel, ctx) => Array.from((ctx || ROOT).querySelectorAll(sel));

    function shuffleArray(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function isActivityComplete(key) {
        return _state.scores[key] && _state.scores[key].complete;
    }

    function countComplete() {
        return ACTIVITIES.filter(a => isActivityComplete(a.key)).length;
    }

    // ── MAIN RENDER ──────────────────────────────────────────────────────────
    function render() {
        if (!ROOT) return;
        ROOT.innerHTML = '';

        const container = document.createElement('div');
        container.className = 'c1p-layout';
        ROOT.appendChild(container);

        container.innerHTML = `
            <div class="c1p-lesson-panel" id="c1p-lesson-panel">
                ${renderLessonPanel()}
            </div>
            <div class="c1p-main-content" id="c1p-main-content">
            </div>
        `;

        const mainContent = $('#c1p-main-content', container);

        if (_state.screen === 'dashboard') {
            renderDashboard(mainContent);
        } else if (_state.screen && _state.screen.startsWith('activity_')) {
            const key = _state.screen.replace('activity_', '');
            renderActivity(mainContent, key);
        } else if (_state.screen && _state.screen.startsWith('summary_')) {
            const key = _state.screen.replace('summary_', '');
            renderActivitySummary(mainContent, key);
        } else if (_state.screen === 'grand_summary') {
            renderGrandSummary(mainContent);
        }
    }

    function renderLessonPanel() {
        return `
            <div class="c1p-lesson-content">
                <h2 class="c1p-lesson-title">Lesson 1: Nouns</h2>
                
                <div class="c1p-lesson-section">
                    <h3>What is a noun?</h3>
                    <p>A noun is a word that names a person, place, animal, or thing.</p>
                </div>

                <div class="c1p-lesson-section c1p-lesson-common">
                    <h3>What is a common noun?</h3>
                    <p>Common nouns name people, places, animals, or things in general.</p>
                    <div class="c1p-lesson-examples">
                        <strong>COMMON NOUNS:</strong>
                        <div class="c1p-example-chips">
                            <span>girl</span><span>dragon</span><span>meadow</span><span>castle</span><span>bird</span><span>river</span><span>door</span><span>feather</span>
                        </div>
                    </div>
                </div>

                <div class="c1p-lesson-section c1p-lesson-proper">
                    <h3>What is a proper noun?</h3>
                    <p>Proper nouns name specific people, places, animals, or things.</p>
                    <p class="c1p-lesson-rule">Proper nouns usually begin with a capital letter.</p>
                    <div class="c1p-lesson-examples">
                        <strong>PROPER NOUNS:</strong>
                        <div class="c1p-example-chips">
                            <span>Aanya</span><span>Flame</span><span>Lumora</span><span>Pip</span><span>Saturday</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function toggleLessonPanel() {
        const layout = $('.c1p-layout');
        if (layout.classList.contains('lesson-hidden')) {
            layout.classList.remove('lesson-hidden');
            $('#c1p-toggle-btn').innerHTML = '<i class="fa-solid fa-chevron-left"></i> Hide Lesson';
        } else {
            layout.classList.add('lesson-hidden');
            $('#c1p-toggle-btn').innerHTML = '<i class="fa-solid fa-chevron-right"></i> Show Lesson';
        }
    }

    // ── DASHBOARD ────────────────────────────────────────────────────────────
    function renderDashboard(container) {
        const done = countComplete();
        const total = ACTIVITIES.length;
        const pct = Math.round((done / total) * 100);

        container.innerHTML = `
            <div class="c1p-dashboard">
                <button id="c1p-toggle-btn" class="c1p-btn c1p-btn-glass" onclick="chapter1Practice.toggleLessonPanel()"><i class="fa-solid fa-chevron-left"></i> Hide Lesson</button>
                <div class="c1p-dash-hero">
                    <div class="c1p-dash-characters">
                        <img src="assets/girl_aanya.png" alt="Aanya" class="c1p-char c1p-char-aanya">
                        <img src="assets/dragon_buddy.png" alt="Flame" class="c1p-char c1p-char-flame">
                    </div>
                    <div class="c1p-dash-hero-text">
                        <div class="c1p-badge-pill">📖 Chapter 1 · Practice</div>
                        <h1 class="c1p-dash-title">Practice: Nouns</h1>
                        <p class="c1p-dash-sub">Master common and proper nouns with Aanya and Flame!</p>
                        <div class="c1p-progress-wrap">
                            <div class="c1p-progress-bar-bg">
                                <div class="c1p-progress-bar-fill" style="width:${pct}%"></div>
                            </div>
                            <span class="c1p-progress-label">${done} / ${total} activities completed</span>
                        </div>
                    </div>
                </div>

                <div class="c1p-activity-grid" id="c1p-activity-grid">
                    ${ACTIVITIES.map(act => renderActivityCard(act)).join('')}
                </div>

                ${done === total ? `
                <div class="c1p-all-done-banner" id="c1p-all-done-banner">
                    <span class="c1p-all-done-emoji">🏆</span>
                    <div>
                        <strong>All activities complete!</strong>
                        <span>Ready to see your final score?</span>
                    </div>
                    <button class="c1p-btn c1p-btn-primary" onclick="chapter1Practice.showGrandSummary()">
                        See Final Score 🎉
                    </button>
                </div>` : ''}
            </div>
        `;
    }

    function renderActivityCard(act) {
        const complete = isActivityComplete(act.key);
        const score = _state.scores[act.key];
        return `
            <div class="c1p-activity-card ${complete ? 'c1p-card-complete' : ''}" 
                 style="--card-color: ${act.color};"
                 onclick="chapter1Practice.startActivity('${act.key}')">
                <div class="c1p-card-emoji">${act.emoji}</div>
                <div class="c1p-card-body">
                    <div class="c1p-card-title">${act.title}</div>
                    <div class="c1p-card-skill">${act.skill}</div>
                    <div class="c1p-card-desc">${act.description}</div>
                </div>
                ${complete ? `
                <div class="c1p-card-status complete">
                    <i class="fa-solid fa-circle-check"></i>
                    <span>${score.score}/${score.total}</span>
                </div>` : `
                <div class="c1p-card-status start">
                    <button class="c1p-btn c1p-btn-sm" style="background:${act.color}; color:white; border:none;">
                        ${score ? 'Retry →' : 'Start →'}
                    </button>
                </div>`}
            </div>
        `;
    }

    // ── ACTIVITY ROUTER ──────────────────────────────────────────────────────
    function renderActivity(container, key) {
        const act = ACTIVITIES.find(a => a.key === key);
        if (!act) return;

        const backBtn = `<div class="c1p-activity-topbar">
            <button class="c1p-back-btn" onclick="chapter1Practice.goToDashboard()">
                <i class="fa-solid fa-arrow-left"></i> Back to Activities
            </button>
            <button id="c1p-toggle-btn" class="c1p-btn c1p-btn-glass c1p-btn-sm" onclick="chapter1Practice.toggleLessonPanel()">
                ${$('.c1p-layout') && $('.c1p-layout').classList.contains('lesson-hidden') ? '<i class="fa-solid fa-chevron-right"></i> Show Lesson' : '<i class="fa-solid fa-chevron-left"></i> Hide Lesson'}
            </button>
        </div>`;

        container.innerHTML = `
            <div class="c1p-activity-view">
                ${backBtn}
                <div class="c1p-activity-header" style="--card-color: ${act.color};">
                    <span class="c1p-act-emoji">${act.emoji}</span>
                    <div>
                        <h2 class="c1p-act-title">${act.title}</h2>
                        <span class="c1p-act-skill">${act.skill}</span>
                    </div>
                </div>
                <div id="c1p-activity-body"></div>
            </div>
        `;

        const body = $('#c1p-activity-body', container);
        const renderers = {
            comprehension: () => renderComprehension(body),
            nouns_sort_interactive: () => renderNounsSortInteractive(body),
            nouns_sort:    () => renderNounsSort(body),
            find_nouns:    () => renderFindNouns(body),
            capital_detective: () => renderCapitalDetective(body),
            fill_blanks:   () => renderFillBlanks(body),
            quick_challenge:() => renderQuickChallenge(body),
            detective_mission:() => renderDetectiveMission(body)
        };
        if (renderers[key]) renderers[key]();
    }

    // ── ACTIVITY 1: STORY COMPREHENSION ──────────────────────────────────────
    function renderComprehension(body) {
        const s = _state.comprehension;
        const q = COMPREHENSION_QS[s.qIndex];
        const total = COMPREHENSION_QS.length;

        body.innerHTML = `
            <div class="c1p-panel">
                <div class="c1p-question-meta">
                    <span class="c1p-q-counter">Question ${s.qIndex + 1} of ${total}</span>
                    <div class="c1p-q-dots">
                        ${COMPREHENSION_QS.map((_, i) => {
                            const ans = s.answers[i];
                            return `<span class="c1p-dot ${i === s.qIndex ? 'active' : ''} ${ans === true ? 'correct' : ans === false ? 'wrong' : ''}"></span>`;
                        }).join('')}
                    </div>
                </div>

                <div class="c1p-comprehension-layout">
                    <div class="c1p-story-card">
                        <div class="c1p-story-badge">Read the paragraph</div>
                        <p class="c1p-story-paragraph">${q.paragraph}</p>
                    </div>

                    <div class="c1p-question-card">
                        <p class="c1p-question-text">${q.question}</p>
                        <div class="c1p-options-list" id="c1p-options">
                            ${q.options.map((opt, i) => `
                                <button class="c1p-option-btn" id="c1p-opt-${i}"
                                    onclick="chapter1Practice.answerCompMCQ(${i})">
                                    <span class="c1p-opt-letter">${'ABCD'[i]}</span>
                                    <span>${opt}</span>
                                </button>`).join('')}
                        </div>
                        <div class="c1p-feedback-box" id="c1p-comp-feedback" style="display:none;"></div>
                    </div>
                </div>
            </div>
        `;
    }

    function answerCompMCQ(optIdx) {
        const s = _state.comprehension;
        const q = COMPREHENSION_QS[s.qIndex];
        const chosen = q.options[optIdx];
        const correct = chosen === q.answer;

        if (!s.attempts[s.qIndex]) s.attempts[s.qIndex] = 0;
        s.attempts[s.qIndex]++;
        s.answers[s.qIndex] = correct;

        const opts = $$('.c1p-option-btn');
        opts.forEach((btn, i) => {
            btn.disabled = true;
            if (q.options[i] === q.answer) btn.classList.add('correct');
            else if (i === optIdx) btn.classList.add('wrong');
        });

        const fb = $('#c1p-comp-feedback');
        fb.style.display = 'block';
        fb.className = `c1p-feedback-box ${correct ? 'c1p-fb-correct' : 'c1p-fb-wrong'}`;
        
        const isLast = s.qIndex === COMPREHENSION_QS.length - 1;
        fb.innerHTML = `
            <div class="c1p-fb-icon">${correct ? '✅' : '❌'}</div>
            <div class="c1p-fb-text">
                <strong>${correct ? 'Correct!' : 'Not quite!'}</strong>
                <p>${q.explanation}</p>
            </div>
            ${!correct ? `<button class="c1p-btn" style="background:white;color:#DC2626;border:1px solid #DC2626;margin-right:10px;" onclick="chapter1Practice.retryFillQ()">Try Again</button>` : ''}
            <button class="c1p-btn c1p-btn-next" onclick="chapter1Practice.nextFillQ()">
                ${isLast ? '🏆 See Score' : 'Next Sentence →'}
            </button>
        `;
        saveState();
    }

    function retryFillQ() {
        const s = _state.fill_blanks;
        s.answers[s.qIndex] = undefined;
        saveState();
        renderActivity($('.c1p-main-content'), 'fill_blanks');
    }

    function nextFillQ() {
        const s = _state.fill_blanks;
        if (s.qIndex < FILL_BLANKS_QS.length - 1) {
            s.qIndex++;
            renderActivity($('.c1p-main-content'), 'fill_blanks');
        } else {
            const score = s.answers.filter(Boolean).length;
            _state.scores.fill_blanks = { score, total: FILL_BLANKS_QS.length, attempts: 1, complete: true };
            _state.screen = 'summary_fill_blanks';
            saveState();
            render();
        }
    }

    // ── ACTIVITY 2: COMMON OR PROPER? (Interactive Cards) ────────────────────
    function renderNounsSortInteractive(body) {
        const s = _state.nouns_sort_interactive;
        const q = INTERACTIVE_CARDS[s.qIndex];
        const total = INTERACTIVE_CARDS.length;

        if (s.qIndex >= total) {
            const correct = s.answers.filter(Boolean).length;
            _state.scores.nouns_sort_interactive = { score: correct, total, attempts: 1, complete: true };
            _state.screen = 'summary_nouns_sort_interactive';
            saveState();
            render();
            return;
        }

        body.innerHTML = `
            <div class="c1p-panel">
                <div class="c1p-question-meta">
                    <span class="c1p-q-counter">Card ${s.qIndex + 1} of ${total}</span>
                    <div class="c1p-q-dots">
                        ${INTERACTIVE_CARDS.map((_, i) => {
                            const a = s.answers[i];
                            return `<span class="c1p-dot ${i === s.qIndex ? 'active' : ''} ${a === true ? 'correct' : a === false ? 'wrong' : ''}"></span>`;
                        }).join('')}
                    </div>
                </div>
                <div class="c1p-interactive-card-area" style="margin:30px 0; text-align:center;">
                    <div class="c1p-flashcard" style="font-size:52px; font-weight:bold; padding:50px 40px; display:inline-block;">${q.word}</div>
                </div>
                <p style="text-align:center; font-size:18px; margin-bottom:20px;">Is <strong>${q.word}</strong> a Common Noun or a Proper Noun?</p>
                <div class="c1p-tf-buttons">
                    <button class="c1p-tf-btn" id="c1p-common-btn" onclick="chapter1Practice.answerInteractive('Common Noun')">📘 Common Noun</button>
                    <button class="c1p-tf-btn" id="c1p-proper-btn" onclick="chapter1Practice.answerInteractive('Proper Noun')">📕 Proper Noun</button>
                </div>
                <div class="c1p-feedback-box" id="c1p-interactive-feedback" style="display:none;"></div>
            </div>
        `;
    }

    function answerInteractive(chosen) {
        const s = _state.nouns_sort_interactive;
        const q = INTERACTIVE_CARDS[s.qIndex];
        const correct = chosen === q.answer;

        s.answers[s.qIndex] = correct;
        if (!s.attempts[s.qIndex]) s.attempts[s.qIndex] = 0;
        s.attempts[s.qIndex]++;

        document.querySelectorAll('.c1p-tf-btn').forEach(btn => btn.disabled = true);

        const fb = $('#c1p-interactive-feedback');
        fb.style.display = 'flex';
        fb.className = `c1p-feedback-box ${correct ? 'c1p-fb-correct' : 'c1p-fb-wrong'}`;
        const isLast = s.qIndex >= INTERACTIVE_CARDS.length - 1;
        fb.innerHTML = `
            <div class="c1p-fb-icon">${correct ? '✅' : '❌'}</div>
            <div class="c1p-fb-text">
                <strong>${correct ? 'Correct!' : 'Not quite!'}</strong>
                <p><strong>${q.word}</strong> is a <strong>${q.answer}</strong>.</p>
            </div>
            <button class="c1p-btn c1p-btn-next" onclick="chapter1Practice.nextInteractiveQ()">
                ${isLast ? '🏆 See Score' : 'Next Card →'}
            </button>
        `;
        saveState();
    }

    function retryInteractiveQ() {
        const s = _state.nouns_sort_interactive;
        s.answers[s.qIndex] = undefined;
        saveState();
        renderActivity($('.c1p-main-content'), 'nouns_sort_interactive');
    }

    function nextInteractiveQ() {
        const s = _state.nouns_sort_interactive;
        s.qIndex++;
        saveState();
        renderActivity($('.c1p-main-content'), 'nouns_sort_interactive');
    }

    // ── ACTIVITY 3: NOUN SORTING CHALLENGE (Drag / Click) ────────────────────
    function renderNounsSort(body) {
        const s = _state.nouns_sort;
        const items = NOUNS_DATA;
        const unplaced = items.filter(n => !s.placed[n.word]);
        const placedProper = items.filter(n => s.placed[n.word] === 'proper');
        const placedCommon = items.filter(n => s.placed[n.word] === 'common');

        body.innerHTML = `
            <div class="c1p-panel">
                <p class="c1p-instruction">Click a word, then click a zone to sort it!</p>
                <div style="display:flex; gap:20px; flex-wrap:wrap; justify-content:center; margin-bottom:25px;">
                    ${unplaced.map(n => `
                        <button class="c1p-noun-chip" id="chip-${n.word}" onclick="chapter1Practice.selectNoun('${n.word}')"
                            title="${n.hint}">${n.word}</button>
                    `).join('')}
                </div>
                <div class="c1p-sort-zones">
                    <div class="c1p-sort-zone" id="zone-proper" onclick="chapter1Practice.dropToZone('proper')">
                        <div class="c1p-zone-label">📕 Proper Nouns</div>
                        <div class="c1p-zone-items">${placedProper.map(n => `<span class="c1p-zone-chip">${n.word}</span>`).join('')}</div>
                    </div>
                    <div class="c1p-sort-zone" id="zone-common" onclick="chapter1Practice.dropToZone('common')">
                        <div class="c1p-zone-label">📘 Common Nouns</div>
                        <div class="c1p-zone-items">${placedCommon.map(n => `<span class="c1p-zone-chip">${n.word}</span>`).join('')}</div>
                    </div>
                </div>
                <div class="c1p-feedback-box" id="c1p-sort-feedback" style="display:none;"></div>
                ${unplaced.length === 0 ? `
                    <div style="text-align:center; margin-top:20px;">
                        <button class="c1p-btn c1p-btn-primary" onclick="chapter1Practice.checkNouns()">✅ Check My Sorting!</button>
                    </div>
                ` : ''}
            </div>
        `;

        // Highlight selected chip
        if (s._selectedWord) {
            const chip = document.getElementById('chip-' + s._selectedWord);
            if (chip) chip.classList.add('selected');
        }
    }

    function selectNoun(word) {
        _state.nouns_sort._selectedWord = word;
        renderActivity($('.c1p-main-content'), 'nouns_sort');
    }

    function removeNoun(word) {
        delete _state.nouns_sort.placed[word];
        saveState();
        renderActivity($('.c1p-main-content'), 'nouns_sort');
    }

    function dropToZone(zone) {
        const s = _state.nouns_sort;
        if (!s._selectedWord) return;
        s.placed[s._selectedWord] = zone;
        s._selectedWord = null;
        saveState();
        renderActivity($('.c1p-main-content'), 'nouns_sort');
    }

    function checkNouns() {
        const s = _state.nouns_sort;
        let correct = 0;
        NOUNS_DATA.forEach(n => {
            if (s.placed[n.word] === n.type) correct++;
        });
        const total = NOUNS_DATA.length;
        const isAllCorrect = correct === total;

        _state.scores.nouns_sort = { score: correct, total, attempts: 1, complete: isAllCorrect };
        if (isAllCorrect) {
            _state.screen = 'summary_nouns_sort';
            saveState();
            render();
        } else {
            saveState();
            const fb = $('#c1p-sort-feedback');
            if (fb) {
                fb.style.display = 'flex';
                fb.className = 'c1p-feedback-box c1p-fb-wrong';
                fb.innerHTML = `
                    <div class="c1p-fb-icon">❌</div>
                    <div class="c1p-fb-text"><strong>${correct}/${total} correct.</strong><p>Some words are in the wrong zone. Try again!</p></div>
                    <button class="c1p-btn c1p-btn-next" onclick="chapter1Practice.retryNounsSort()">Retry</button>
                `;
            }
        }
    }

    function retryNounsSort() {
        _state.nouns_sort = { placed: {}, attempts: {} };
        saveState();
        renderActivity($('.c1p-main-content'), 'nouns_sort');
    }

    // ── ACTIVITY 4: FIND THE NOUNS ────────────────────────────────────────────
    function renderFindNouns(body) {
        const s = _state.find_nouns;
        const q = FIND_NOUNS_QS[s.qIndex];
        const total = FIND_NOUNS_QS.length;

        body.innerHTML = `
            <div class="c1p-panel">
                <div class="c1p-question-meta">
                    <span class="c1p-q-counter">Sentence ${s.qIndex + 1} of ${total}</span>
                    <div class="c1p-q-dots">
                        ${FIND_NOUNS_QS.map((_, i) => {
                            const a = s.attempts[i];
                            return `<span class="c1p-dot ${i === s.qIndex ? 'active' : ''} ${a === true ? 'correct' : a === false ? 'wrong' : ''}"></span>`;
                        }).join('')}
                    </div>
                </div>
                <p class="c1p-instruction">Click on all the <strong>nouns</strong> in the sentence below.</p>
                <div class="c1p-story-phrase" style="font-size:28px; margin:30px 0; line-height:2.2; text-align:center;">
                    ${q.words.map(w => {
                        const isSelected = (s.selected || []).includes(w);
                        return `<span class="c1p-selectable-word ${isSelected ? 'selected' : ''}" onclick="chapter1Practice.toggleFindNoun('${w}')">${w}</span> `;
                    }).join('')}
                </div>
                <div style="text-align:center;">
                    <button class="c1p-btn c1p-btn-primary" onclick="chapter1Practice.checkFindNouns()">Check Answer</button>
                </div>
                <div class="c1p-feedback-box" id="c1p-find-feedback" style="display:none;"></div>
            </div>
        `;
    }

    function toggleFindNoun(word) {
        const s = _state.find_nouns;
        if (s.answered) return;
        if (!s.selected) s.selected = [];
        const idx = s.selected.indexOf(word);
        if (idx > -1) s.selected.splice(idx, 1);
        else s.selected.push(word);
        renderActivity($('.c1p-main-content'), 'find_nouns');
    }

    function checkFindNouns() {
        const s = _state.find_nouns;
        const q = FIND_NOUNS_QS[s.qIndex];
        const selected = s.selected || [];
        const correct = q.nouns.every(n => selected.includes(n)) && selected.every(n => q.nouns.includes(n));

        if (!s.attempts) s.attempts = [];
        s.attempts[s.qIndex] = correct;

        const fb = $('#c1p-find-feedback');
        fb.style.display = 'flex';
        fb.className = `c1p-feedback-box ${correct ? 'c1p-fb-correct' : 'c1p-fb-wrong'}`;
        const isLast = s.qIndex >= FIND_NOUNS_QS.length - 1;
        fb.innerHTML = `
            <div class="c1p-fb-icon">${correct ? '✅' : '❌'}</div>
            <div class="c1p-fb-text">
                <strong>${correct ? 'Correct!' : 'Not quite!'}</strong>
                <p>Nouns: <strong>${q.nouns.join(', ')}</strong></p>
            </div>
            ${!correct ? `<button class="c1p-btn" style="background:white;color:#DC2626;border:1px solid #DC2626;margin-right:8px;" onclick="chapter1Practice.retryFindNouns()">Retry</button>` : ''}
            <button class="c1p-btn c1p-btn-next" onclick="chapter1Practice.nextFindNouns()">${isLast ? '🏆 See Score' : 'Next →'}</button>
        `;
        document.querySelectorAll('.c1p-selectable-word').forEach(el => el.style.pointerEvents = 'none');
        saveState();
    }

    function retryFindNouns() {
        _state.find_nouns.selected = [];
        _state.find_nouns.answered = false;
        saveState();
        renderActivity($('.c1p-main-content'), 'find_nouns');
    }

    function nextFindNouns() {
        const s = _state.find_nouns;
        if (s.qIndex < FIND_NOUNS_QS.length - 1) {
            s.qIndex++;
            s.selected = [];
            s.answered = false;
            saveState();
            renderActivity($('.c1p-main-content'), 'find_nouns');
        } else {
            const score = (s.attempts || []).filter(Boolean).length;
            _state.scores.find_nouns = { score, total: FIND_NOUNS_QS.length, attempts: 1, complete: true };
            _state.screen = 'summary_find_nouns';
            saveState();
            render();
        }
    }

    // ── ACTIVITY 5: CAPITAL LETTER DETECTIVE ──────────────────────────────────
    function renderCapitalDetective(body) {
        const s = _state.capital_detective;
        const q = CAPITAL_QS[s.qIndex];
        const total = CAPITAL_QS.length;

        body.innerHTML = `
            <div class="c1p-panel">
                <div class="c1p-question-meta">
                    <span class="c1p-q-counter">Sentence ${s.qIndex + 1} of ${total}</span>
                    <div class="c1p-q-dots">
                        ${CAPITAL_QS.map((_, i) => {
                            const a = s.attempts[i];
                            return `<span class="c1p-dot ${i === s.qIndex ? 'active' : ''} ${a === true ? 'correct' : a === false ? 'wrong' : ''}"></span>`;
                        }).join('')}
                    </div>
                </div>
                <p class="c1p-instruction">Fix the capitalization! Proper nouns must start with a capital letter.</p>
                <div class="c1p-story-card" style="margin:20px 0;">
                    <div class="c1p-story-badge">Fix this sentence</div>
                    <p class="c1p-story-paragraph" style="font-size:20px;">${q.original}</p>
                </div>
                <div class="c1p-question-card">
                    <label style="font-weight:600; font-size:16px; display:block; margin-bottom:10px;">Type the corrected sentence:</label>
                    <input type="text" id="c1p-cap-input" value="${s.typed || ''}"
                        oninput="_state.capital_detective.typed = this.value"
                        class="c1p-text-input" placeholder="Type the corrected sentence here...">
                    <button class="c1p-btn c1p-btn-primary" style="margin-top:15px;" onclick="chapter1Practice.checkCapitalDetective()">Check Answer</button>
                </div>
                <div class="c1p-feedback-box" id="c1p-cap-feedback" style="display:none;"></div>
            </div>
        `;
    }

    function checkCapitalDetective() {
        const s = _state.capital_detective;
        const q = CAPITAL_QS[s.qIndex];
        const typed = (s.typed || '').trim();
        const correct = typed.toLowerCase() === q.correct.toLowerCase() && typed === q.correct;

        if (!s.attempts) s.attempts = [];
        s.attempts[s.qIndex] = correct;

        const fb = $('#c1p-cap-feedback');
        fb.style.display = 'flex';
        fb.className = `c1p-feedback-box ${correct ? 'c1p-fb-correct' : 'c1p-fb-wrong'}`;
        const isLast = s.qIndex >= CAPITAL_QS.length - 1;
        fb.innerHTML = `
            <div class="c1p-fb-icon">${correct ? '✅' : '❌'}</div>
            <div class="c1p-fb-text">
                <strong>${correct ? 'Perfect!' : 'Not quite!'}</strong>
                <p>Correct answer: <strong>${q.correct}</strong></p>
            </div>
            ${!correct ? `<button class="c1p-btn" style="background:white;color:#DC2626;border:1px solid #DC2626;margin-right:8px;" onclick="chapter1Practice.retryCapitalDetective()">Try Again</button>` : ''}
            <button class="c1p-btn c1p-btn-next" onclick="chapter1Practice.nextCapitalDetective()">${isLast ? '🏆 See Score' : 'Next →'}</button>
        `;
        const input = $('#c1p-cap-input');
        if (input) input.disabled = true;
        saveState();
    }

    function retryCapitalDetective() {
        _state.capital_detective.typed = '';
        _state.capital_detective.answered = false;
        saveState();
        renderActivity($('.c1p-main-content'), 'capital_detective');
    }

    function nextCapitalDetective() {
        const s = _state.capital_detective;
        if (s.qIndex < CAPITAL_QS.length - 1) {
            s.qIndex++;
            s.typed = '';
            s.answered = false;
            saveState();
            renderActivity($('.c1p-main-content'), 'capital_detective');
        } else {
            const score = (s.attempts || []).filter(Boolean).length;
            _state.scores.capital_detective = { score, total: CAPITAL_QS.length, attempts: 1, complete: true };
            _state.screen = 'summary_capital_detective';
            saveState();
            render();
        }
    }

    // ── ACTIVITY 6: FILL IN THE BLANKS ────────────────────────────────────────
    function renderFillBlanks(body) {
        const s = _state.fill_blanks;
        const q = FILL_BLANKS_QS[s.qIndex];
        const total = FILL_BLANKS_QS.length;

        body.innerHTML = `
            <div class="c1p-panel">
                <div class="c1p-question-meta">
                    <span class="c1p-q-counter">Sentence ${s.qIndex + 1} of ${total}</span>
                    <div class="c1p-q-dots">
                        ${FILL_BLANKS_QS.map((_, i) => {
                            const a = s.answers[i];
                            return `<span class="c1p-dot ${i === s.qIndex ? 'active' : ''} ${a === true ? 'correct' : a === false ? 'wrong' : ''}"></span>`;
                        }).join('')}
                    </div>
                </div>
                <div class="c1p-story-card" style="margin:20px 0;">
                    <div class="c1p-story-badge">Complete the sentence</div>
                    <p class="c1p-story-paragraph" style="font-size:22px;">${q.sentence}</p>
                </div>
                <div class="c1p-options-list" id="c1p-fill-options">
                    ${q.options.map((opt, i) => `
                        <button class="c1p-option-btn" id="c1p-fill-opt-${i}"
                            onclick="chapter1Practice.answerFillMCQ(${i})">
                            <span class="c1p-opt-letter">${'ABCD'[i]}</span>
                            <span>${opt}</span>
                        </button>
                    `).join('')}
                </div>
                <div class="c1p-feedback-box" id="c1p-fill-feedback" style="display:none;"></div>
            </div>
        `;
    }

    function answerFillMCQ(optIdx) {
        const s = _state.fill_blanks;
        const q = FILL_BLANKS_QS[s.qIndex];
        const chosen = q.options[optIdx];
        const correct = chosen === q.answer;

        if (!s.attempts[s.qIndex]) s.attempts[s.qIndex] = 0;
        s.attempts[s.qIndex]++;
        s.answers[s.qIndex] = correct;

        document.querySelectorAll('.c1p-option-btn').forEach((btn, i) => {
            btn.disabled = true;
            if (q.options[i] === q.answer) btn.classList.add('correct');
            else if (i === optIdx) btn.classList.add('wrong');
        });

        const fb = $('#c1p-fill-feedback');
        fb.style.display = 'flex';
        fb.className = `c1p-feedback-box ${correct ? 'c1p-fb-correct' : 'c1p-fb-wrong'}`;
        const isLast = s.qIndex >= FILL_BLANKS_QS.length - 1;
        fb.innerHTML = `
            <div class="c1p-fb-icon">${correct ? '✅' : '❌'}</div>
            <div class="c1p-fb-text">
                <strong>${correct ? 'Correct!' : 'Not quite!'}</strong>
                <p>${q.explanation}</p>
            </div>
            ${!correct ? `<button class="c1p-btn" style="background:white;color:#DC2626;border:1px solid #DC2626;margin-right:8px;" onclick="chapter1Practice.retryFillQ()">Try Again</button>` : ''}
            <button class="c1p-btn c1p-btn-next" onclick="chapter1Practice.nextFillQ()">${isLast ? '🏆 See Score' : 'Next →'}</button>
        `;
        saveState();
    }

    // ── ACTIVITY 7: QUICK CHALLENGE ──────────────────────────────────────────

    function renderQuickChallenge(body) {
        const s = _state.quick_challenge;
        
        if (!s.isActive && s.timeRemaining === 30) {
            // Start screen
            body.innerHTML = `
                <div class="c1p-panel" style="text-align:center;">
                    <h2>Common or Proper Noun?</h2>
                    <p>You have 30 seconds to classify as many words as you can!</p>
                    <button class="c1p-btn c1p-btn-primary" style="margin-top:20px;" onclick="chapter1Practice.startQuickChallenge()">Start Challenge</button>
                </div>
            `;
            return;
        }

        if (!s.isActive && s.timeRemaining <= 0) {
            // End screen
            body.innerHTML = `
                <div class="c1p-panel" style="text-align:center;">
                    <h2>Time's Up! ⏱️</h2>
                    <p style="font-size: 24px;">You scored <strong>${s.score}</strong> points!</p>
                    <button class="c1p-btn c1p-btn-primary" style="margin-top:20px;" onclick="chapter1Practice.finishQuickChallenge()">Continue</button>
                </div>
            `;
            return;
        }

        const words = INTERACTIVE_CARDS;
        const q = words[s.qIndex % words.length];

        body.innerHTML = `
            <div class="c1p-panel">
                <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
                    <div style="font-size:20px; font-weight:bold; color:var(--c1p-primary);">Score: ${s.score}</div>
                    <div style="font-size:20px; font-weight:bold; color:var(--c1p-error);">⏱️ ${s.timeRemaining}s</div>
                </div>
                
                <div class="c1p-interactive-card-area">
                    <div class="c1p-flashcard" style="font-size: 48px; padding: 40px;">${q.word}</div>
                </div>

                <div class="c1p-tf-buttons" style="margin-top: 40px;">
                    <button class="c1p-tf-btn" onclick="chapter1Practice.answerQuickChallenge('Common Noun')">
                        📘 Common Noun
                    </button>
                    <button class="c1p-tf-btn" onclick="chapter1Practice.answerQuickChallenge('Proper Noun')">
                        📕 Proper Noun
                    </button>
                </div>
            </div>
        `;
    }

    let _timer = null;

    function startQuickChallenge() {
        const s = _state.quick_challenge;
        s.isActive = true;
        s.score = 0;
        s.timeRemaining = 30;
        s.qIndex = 0;
        
        _timer = setInterval(() => {
            if (_state.screen !== 'activity_quick_challenge') {
                clearInterval(_timer);
                return;
            }
            s.timeRemaining--;
            if (s.timeRemaining <= 0) {
                clearInterval(_timer);
                s.isActive = false;
            }
            renderActivity($('.c1p-main-content'), 'quick_challenge');
        }, 1000);
        
        renderActivity($('.c1p-main-content'), 'quick_challenge');
    }

    function answerQuickChallenge(chosen) {
        const s = _state.quick_challenge;
        if (!s.isActive) return;
        
        const q = INTERACTIVE_CARDS[s.qIndex % INTERACTIVE_CARDS.length];
        if (chosen === q.answer) {
            s.score += 10;
        } else {
            s.score = Math.max(0, s.score - 5);
        }
        s.qIndex++;
        renderActivity($('.c1p-main-content'), 'quick_challenge');
    }

    function finishQuickChallenge() {
        _state.scores.quick_challenge = { score: _state.quick_challenge.score, total: 'Max', attempts: 1, complete: true };
        _state.screen = 'summary_quick_challenge';
        saveState();
        render();
    }

    // ── ACTIVITY 8: NOUN DETECTIVE MISSION ───────────────────────────────────
    function renderDetectiveMission(body) {
        const s = _state.detective_mission;
        const q = DETECTIVE_MISSION;
        
        const words = q.paragraph.split(/(\s+|[,.:"!?]+)/);

        body.innerHTML = `
            <div class="c1p-panel">
                <p class="c1p-instruction">Read the paragraph and tap to select <strong>2 Proper Nouns</strong> and <strong>2 Common Nouns</strong>.</p>
                
                <div class="c1p-story-phrase" style="line-height: 2;">
                    ${words.map((w, i) => {
                        if (/\w+/.test(w)) {
                            const isSelected = s.selected.includes(i);
                            return `<span class="c1p-selectable-word ${isSelected ? 'selected' : ''}" onclick="chapter1Practice.toggleDetectiveWord(${i})" id="det-word-${i}">${w}</span>`;
                        }
                        return w;
                    }).join('')}
                </div>

                <div style="text-align:center; margin-top:30px;">
                    <button class="c1p-btn c1p-btn-primary" onclick="chapter1Practice.checkDetectiveMission()">Submit Mission</button>
                </div>
                
                <div class="c1p-feedback-box" id="c1p-det-feedback" style="display:${s.completed ? 'block' : 'none'};"></div>
            </div>
        `;

        if (s.completed) {
            const fb = $('#c1p-det-feedback');
            
            let properFound = 0;
            let commonFound = 0;
            let incorrect = 0;

            s.selected.forEach(i => {
                const w = words[i].replace(/[^a-zA-Z]/g, '');
                if (q.allProper.includes(w)) properFound++;
                else if (q.allCommon.includes(w)) commonFound++;
                else incorrect++;
            });

            const isCorrect = properFound >= 2 && commonFound >= 2 && incorrect === 0 && s.selected.length === 4;

            fb.className = `c1p-feedback-box ${isCorrect ? 'c1p-fb-correct' : 'c1p-fb-wrong'}`;
            fb.innerHTML = `
                <div class="c1p-fb-icon">${isCorrect ? '✅' : '❌'}</div>
                <div class="c1p-fb-text">
                    <strong>${isCorrect ? 'Mission Accomplished!' : 'Mission Failed.'}</strong>
                    <p>You found ${properFound} proper noun(s) and ${commonFound} common noun(s). You needed 2 of each!</p>
                </div>
                ${isCorrect ? `
                <button class="c1p-btn c1p-btn-next" onclick="chapter1Practice.finishDetectiveMission()">🏆 See Score</button>
                ` : `
                <button class="c1p-btn c1p-btn-next" onclick="chapter1Practice.retryDetectiveMission()">Retry Mission</button>
                `}
            `;
        }
    }

    function toggleDetectiveWord(idx) {
        const s = _state.detective_mission;
        if (s.completed) return;
        
        if (s.selected.includes(idx)) {
            s.selected = s.selected.filter(i => i !== idx);
        } else {
            if (s.selected.length < 4) {
                s.selected.push(idx);
            }
        }
        renderActivity($('.c1p-main-content'), 'detective_mission');
    }

    function checkDetectiveMission() {
        const s = _state.detective_mission;
        s.completed = true;
        s.attempts++;
        saveState();
        renderActivity($('.c1p-main-content'), 'detective_mission');
    }

    function retryDetectiveMission() {
        _state.detective_mission.selected = [];
        _state.detective_mission.completed = false;
        saveState();
        renderActivity($('.c1p-main-content'), 'detective_mission');
    }

    function finishDetectiveMission() {
        _state.scores.detective_mission = { score: 10, total: 10, attempts: _state.detective_mission.attempts, complete: true };
        _state.screen = 'summary_detective_mission';
        saveState();
        render();
    }


    // ── SUMMARIES ────────────────────────────────────────────────────────────
    function renderActivitySummary(container, key) {
        const act = ACTIVITIES.find(a => a.key === key);
        const score = _state.scores[key];
        
        container.innerHTML = `
            <div class="c1p-summary">
                <div class="c1p-summary-hero" style="background:${act.color};">
                    <div class="c1p-summary-emoji">${act.emoji}</div>
                    <h2>${act.title} Complete!</h2>
                </div>
                
                <div class="c1p-summary-stats">
                    <div class="c1p-stat-card">
                        <div class="c1p-stat-value">${score.score}/${score.total}</div>
                        <div class="c1p-stat-label">Score</div>
                    </div>
                    <div class="c1p-stat-card">
                        <div class="c1p-stat-value">${score.attempts}</div>
                        <div class="c1p-stat-label">Attempts</div>
                    </div>
                </div>

                <div class="c1p-summary-message">
                    ${score.score === score.total || key === 'quick_challenge' ? 'Awesome job! 🌟' : 'Good effort! 👍'}
                </div>
                
                <span class="c1p-summary-skill-tag">Skill: ${act.skill}</span>

                <div class="c1p-summary-actions">
                    <button class="c1p-btn c1p-btn-primary c1p-btn-lg" onclick="chapter1Practice.goToDashboard()">
                        Back to Activities
                    </button>
                </div>
            </div>
        `;
    }

    function renderGrandSummary(container) {
        let totalScore = 0;
        let totalPossible = 0;
        
        ACTIVITIES.forEach(a => {
            const s = _state.scores[a.key];
            if (s && typeof s.score === 'number' && typeof s.total === 'number') {
                totalScore += s.score;
                totalPossible += s.total;
            } else if (a.key === 'quick_challenge' && s) {
                totalScore += s.score;
                totalPossible += s.score; // For Quick Challenge, score is added to both
            }
        });

        const pct = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

        container.innerHTML = `
            <div class="c1p-grand-summary">
                <div class="c1p-grand-hero">
                    <img src="assets/girl_aanya.png" class="c1p-grand-char">
                    <img src="assets/dragon_buddy.png" class="c1p-grand-char" style="z-index: -1;">
                </div>
                
                <div class="c1p-grand-badge">👑</div>
                <h1 class="c1p-grand-title">Chapter 1 Practice Complete!</h1>
                <p class="c1p-grand-sub">You are a Noun Master!</p>
                
                <div class="c1p-grand-score-circle" style="--pct: ${pct}%">
                    <div class="c1p-score-inner">
                        <span class="c1p-score-num">${pct}%</span>
                        <span class="c1p-score-sub">Overall Score</span>
                    </div>
                </div>

                <div class="c1p-grand-activity-scores">
                    ${ACTIVITIES.map(a => {
                        const s = _state.scores[a.key];
                        if (!s) return '';
                        let sPct = typeof s.total === 'number' && s.total > 0 ? (s.score / s.total) * 100 : 100;
                        if (a.key === 'quick_challenge') sPct = 100;
                        return `
                        <div class="c1p-grand-act-row">
                            <span>${a.emoji} ${a.title}</span>
                            <div class="c1p-mini-bar-bg">
                                <div class="c1p-mini-bar-fill" style="width:${sPct}%; background:${a.color}"></div>
                            </div>
                            <span class="c1p-grand-act-score">${s.score}/${s.total}</span>
                        </div>`;
                    }).join('')}
                </div>

                <button class="c1p-btn c1p-btn-primary c1p-btn-lg" onclick="chapter1Practice.finishPractice()">
                    Return to Student Portal
                </button>
            </div>
        `;
    }

    // ── PUBLIC API ───────────────────────────────────────────────────────────
    return {
        init(studentId) {
            PERSIST_KEY = keyFor(studentId);
            _state = loadState(PERSIST_KEY) || freshState();
            render();
        },

        // Real completion for one student, read without opening the practice.
        getProgress(studentId) {
            const saved = loadState(keyFor(studentId));
            const scores = (saved && saved.scores) || {};
            const done = ACTIVITIES.filter(a => scores[a.key] && scores[a.key].complete).length;
            return { done, total: ACTIVITIES.length };
        },
        
        goToDashboard() {
            _state.screen = 'dashboard';
            saveState();
            render();
        },

        startActivity(key) {
            _state.screen = 'activity_' + key;
            
            // Reset state if already completed, but don't delete score to keep history
            if (isActivityComplete(key)) {
                _state[key] = freshState()[key];
            } else if (!_state[key]) {
                _state[key] = freshState()[key];
            }
            
            saveState();
            render();
        },

        goToSummary(key) {
            _state.screen = `summary_${key}`;
            saveState();
            render();
        },

        showGrandSummary() {
            _state.screen = 'grand_summary';
            saveState();
            render();
        },

        // Keeps the scores (they are the student's record) and hands back to
        // the portal, which credits the practice only if every activity is done.
        finishPractice() {
            _state.screen = 'dashboard';
            saveState();
            if (typeof closeChapter1Practice === 'function') closeChapter1Practice();
        },

        toggleLessonPanel,

        // Handlers
        answerCompMCQ,
        answerInteractive,
        retryInteractiveQ,
        nextInteractiveQ,
        selectNoun,
        removeNoun,
        dropToZone,
        checkNouns,
        retryNounsSort,
        toggleFindNoun,
        checkFindNouns,
        retryFindNouns,
        nextFindNouns,
        checkCapitalDetective,
        retryCapitalDetective,
        nextCapitalDetective,
        answerFillMCQ,
        retryFillQ,
        nextFillQ,
        startQuickChallenge,
        answerQuickChallenge,
        finishQuickChallenge,
        toggleDetectiveWord,
        checkDetectiveMission,
        retryDetectiveMission,
        finishDetectiveMission

    };

})();

document.addEventListener('DOMContentLoaded', () => {
    // chapter1Practice.init()
});

