/* ============================================
   PROJECTOR VIEW — receives state over BroadcastChannel from the teacher's
   Explore screen (see app.js) and renders only student-safe content.

   Same-device, same-origin, no backend: BroadcastChannel only reaches other
   windows/tabs of this site open in the same browser. Phase 2 (a real
   separate phone-as-remote over Wi-Fi) swaps this channel for a Supabase
   Realtime channel keyed by a pairing code — the render functions below
   don't need to change, only how messages arrive.
   ============================================ */

const REMOTE_CHANNEL_NAME = 'happyminds_remote_v1';
const channel = new BroadcastChannel(REMOTE_CHANNEL_NAME);

const params = new URLSearchParams(location.search);
const chapterId = parseInt(params.get('chapter'), 10) || 1;
const chapter = (typeof getChapterById === 'function') ? getChapterById(chapterId) : CHAPTERS.find(c => c.id === chapterId);

// Duplicated intentionally from app.js's STORYBOOK_CHARACTERS — this page
// never loads app.js, by design (no path for teacher-only data to leak in).
const STORYBOOK_CHARACTERS = {
    aanya: { img: 'assets/girl_aanya.png', name: 'Aanya' },
    flame: { img: 'assets/dragon_buddy.png', name: 'Flame' },
    pip: { img: 'assets/pip_bird.jpg', name: 'Pip' }
};

// Duplicated intentionally from chapter1-practice.js's WORLD_OBJECTS/NAMEABLE_IDS
// — same reason as STORYBOOK_CHARACTERS above: this page never loads that
// module either, it only reuses its CSS classes. Positions/images must stay
// in sync with chapter1-practice.js if that data ever changes.
const C1_WORLD_OBJECTS = {
    dragon:   { emoji: '🐉', label: 'dragon',   size: 'lg', top: 82, left: 72, img: 'assets/chapter1-practice/characters/dragon.jpg', pos: '50% 55%' },
    girl:     { emoji: '👧', label: 'girl',     size: 'lg', top: 88, left: 4,  img: 'assets/chapter1-practice/characters/girl.jpg', pos: '50% 12%' },
    castle:   { emoji: '🏰', label: 'castle',   size: 'lg', top: 16, left: 27, img: 'assets/chapter1-practice/world/castle.png' },
    bird:     { emoji: '🐦', label: 'bird',     size: 'md', top: 10, left: 65, img: 'assets/chapter1-practice/characters/bird.jpg', pos: '48% 32%' },
    tree:     { emoji: '🌳', label: 'tree',     size: 'md', top: 34, left: 84, img: 'assets/chapter1-practice/world/tree.png' },
    bridge:   { emoji: '🌉', label: 'bridge',   size: 'md', top: 56, left: 58, img: 'assets/chapter1-practice/world/bridge.png' },
    river:    { emoji: '🏞️', label: 'river',    size: 'md', top: 58, left: 40, img: 'assets/chapter1-practice/world/river.png' },
    rock:     { emoji: '🪨', label: 'rock',     size: 'sm', top: 78, left: 12, img: 'assets/chapter1-practice/world/rocks.png' },
    flower:   { emoji: '🌸', label: 'flower',   size: 'sm', top: 90, left: 34, img: 'assets/chapter1-practice/world/flowers.png' },
    mushroom: { emoji: '🍄', label: 'mushroom', size: 'sm', top: 80, left: 92, img: 'assets/chapter1-practice/world/mushroom.png' }
};
const C1_DISCOVER_IDS = Object.keys(C1_WORLD_OBJECTS).filter(id => id !== 'girl');
const C1_HUNT_IDS = Object.keys(C1_WORLD_OBJECTS);
const C1_NAMEABLE_IDS = ['dragon', 'rock', 'bird', 'flower', 'castle'];
const C1_FIXER_SENTENCE = [
    { word: 'maya',   fixed: 'Maya'  },
    { word: 'saw',    fixed: 'saw'   },
    { word: 'a',      fixed: 'a'     },
    { word: 'dragon', fixed: 'dragon'},
    { word: 'named',  fixed: 'named' },
    { word: 'flame.', fixed: 'Flame.'}
];

function titleCaseC1(str) {
    return str.split(/\s+/).filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Read-only hotspots — no click handlers, since the projector shows state,
// not controls a student would reach up and tap (there's no touchscreen).
function renderC1Hotspots(sceneEl, ids, foundIds, namedIds, selectedId) {
    sceneEl.querySelectorAll('.world-hotspot').forEach(el => el.remove());
    ids.forEach(id => {
        const obj = C1_WORLD_OBJECTS[id];
        const el = document.createElement('div');
        el.className = `world-hotspot hotspot-${obj.size}`;
        el.style.top = obj.top + '%';
        el.style.left = obj.left + '%';
        if (foundIds.includes(id)) el.classList.add('found');
        if (namedIds.includes(id)) el.classList.add('named');
        if (id === selectedId) el.classList.add('selected');
        let visual = `<span class="hotspot-emoji">${obj.emoji}</span>`;
        if (obj.img) {
            const pos = obj.pos ? `object-position: ${obj.pos};` : '';
            visual = `<img src="${obj.img}" class="hotspot-img" style="${pos}" alt="${obj.label}">`;
        }
        el.innerHTML = `${visual}<span class="object-label">${obj.emoji} ${titleCaseC1(obj.label)}</span>`;
        sceneEl.appendChild(el);
    });
}

let breatheInterval = null;
let timerInterval = null;
let ytPlayer = null;
let ytApiReady = false;
let pendingYoutubeId = null;

function showProjScreen(id) {
    document.querySelectorAll('.proj-screen').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id !== 'proj-settle' && breatheInterval) { clearInterval(breatheInterval); breatheInterval = null; }
    if (id !== 'proj-draw' && timerInterval) { clearInterval(timerInterval); timerInterval = null; document.getElementById('proj-draw-timer').style.display = 'none'; }
}

// ---------- 1. Settle & breathe ----------
function renderSettle() {
    showProjScreen('proj-settle');
    const label = document.getElementById('proj-breathe-text');
    let breatheIn = true;
    label.textContent = 'Breathe in...';
    breatheInterval = setInterval(() => {
        breatheIn = !breatheIn;
        label.textContent = breatheIn ? 'Breathe in...' : '...and out';
    }, 4000);
}

// ---------- 2. Video ----------
function onYouTubeIframeAPIReady() {
    ytApiReady = true;
    if (pendingYoutubeId) {
        const id = pendingYoutubeId;
        pendingYoutubeId = null;
        loadProjYoutube(id);
    }
}

function loadProjYoutube(videoId) {
    if (!ytApiReady) { pendingYoutubeId = videoId; return; }
    if (ytPlayer) { ytPlayer.loadVideoById(videoId); return; }
    ytPlayer = new YT.Player('projYoutubePlayer', {
        videoId,
        playerVars: { rel: 0, controls: 0 }
    });
}

function renderVideoLoad(payload) {
    showProjScreen('proj-video');
    const video = document.getElementById('projVideo');
    const ytContainer = document.getElementById('projYoutubePlayer');

    if (payload.youtubeId) {
        video.style.display = 'none';
        ytContainer.style.display = 'block';
        loadProjYoutube(payload.youtubeId);
    } else if (payload.src) {
        ytContainer.style.display = 'none';
        video.style.display = 'block';
        video.src = payload.src;
        video.load();
    }
}

function handleVideoCmd(msg) {
    const action = msg.action;
    const video = document.getElementById('projVideo');
    const videoActive = video && video.style.display !== 'none';
    const ytActive = ytPlayer && typeof ytPlayer.playVideo === 'function';

    if (action === 'play') {
        if (ytActive) ytPlayer.playVideo();
        if (videoActive) video.play().catch(() => {});
    } else if (action === 'pause') {
        if (ytActive) ytPlayer.pauseVideo();
        if (videoActive) video.pause();
    } else if (action === 'seek') {
        if (ytActive) ytPlayer.seekTo(Math.max(0, ytPlayer.getCurrentTime() + msg.delta), true);
        if (videoActive) video.currentTime = Math.max(0, video.currentTime + msg.delta);
    } else if (action === 'replay') {
        if (ytActive) { ytPlayer.seekTo(0, true); ytPlayer.playVideo(); }
        if (videoActive) { video.currentTime = 0; video.play().catch(() => {}); }
    }
}

// ---------- 3. Storybook ----------
function renderStorybookPage(pageIndex) {
    showProjScreen('proj-storybook');
    const pages = chapter.storybook || [];
    const page = pages[pageIndex];
    if (!page) return;

    const card = document.getElementById('proj-storybook-card');
    const charFrame = document.getElementById('proj-storybook-char');
    const charImg = document.getElementById('proj-storybook-img');
    if (page.character && STORYBOOK_CHARACTERS[page.character]) {
        const char = STORYBOOK_CHARACTERS[page.character];
        charImg.src = char.img;
        charImg.alt = char.name;
        charFrame.classList.remove('empty');
    } else {
        charImg.src = '';
        charFrame.classList.add('empty');
    }

    document.getElementById('proj-storybook-text').textContent = page.text;

    // Same real per-page illustration as the teacher/student screens (only
    // Chapter 1 has these today — see chapters-data.js's page.image). No
    // read-aloud here: narration plays from whichever device tapped it, not
    // duplicated onto the projector's own speakers.
    if (card) card.classList.toggle('illustrated', !!page.image);
    if (page.image) {
        document.getElementById('proj-storybook-illustration-img').src = page.image;
        document.getElementById('proj-storybook-caption').textContent = page.text;
    }

    document.getElementById('proj-storybook-dots').innerHTML = pages.map((_, i) =>
        `<span class="dot ${i === pageIndex ? 'active' : ''}"></span>`).join('');
}

// ---------- 4. Think & Talk ----------
function renderThinkTalk(cardIndex) {
    showProjScreen('proj-thinktalk');
    const question = (chapter.thinkTalk || [])[cardIndex] || '';
    document.getElementById('proj-thinktalk-question').textContent = question;
}

// ---------- 5. Draw ----------
function renderDraw() {
    showProjScreen('proj-draw');
}

function renderTimerStart(seconds) {
    const ring = document.getElementById('proj-draw-timer');
    const fill = document.getElementById('proj-timer-fill');
    const label = document.getElementById('proj-timer-label');
    const circumference = 339.3;
    const total = seconds;
    ring.style.display = 'block';

    if (timerInterval) clearInterval(timerInterval);
    const tick = () => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        label.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
        fill.style.strokeDashoffset = circumference * (1 - seconds / total);
        fill.style.stroke = seconds <= 30 ? '#F59E0B' : 'var(--accent-green)';
        if (seconds <= 0) {
            clearInterval(timerInterval);
            label.textContent = "Time's up!";
            return;
        }
        seconds--;
    };
    tick();
    timerInterval = setInterval(tick, 1000);
}

// ---------- 6. Wrap up ----------
function renderWrapup() {
    showProjScreen('proj-wrapup');
}

// ---------- Create stage ----------
// Duplicated from app.js's highlightNouns — same reasoning as
// STORYBOOK_CHARACTERS above: this page never loads app.js.
function highlightNouns(sentence, nouns) {
    let html = sentence;
    (nouns || []).forEach(noun => {
        const re = new RegExp(`\\b(${noun})\\b`, 'gi');
        html = html.replace(re, '<strong class="noun-highlight">$1</strong>');
    });
    return html;
}

function renderWallTiles(containerId, words) {
    const el = document.getElementById(containerId);
    if (!words || !words.length) {
        el.innerHTML = '<span class="proj-wall-tiles-empty">The word wall is empty so far.</span>';
        return;
    }
    el.innerHTML = words.map(w => `<span class="tile">${typeof w === 'string' ? w : w.text}</span>`).join('');
}

function renderCreateRitual(wallWords) {
    showProjScreen('proj-create-ritual');
    renderWallTiles('proj-wall-tiles', wallWords);
}

function renderCreateStarter() {
    showProjScreen('proj-create-starter');
    document.getElementById('proj-starter-text').textContent = `"${chapter.starter}"`;
}

function renderCreateModel(sentenceIndex) {
    showProjScreen('proj-create-model');
    const sentences = (chapter.create.modelText && chapter.create.modelText.length) ? chapter.create.modelText : [chapter.starter];
    const nouns = chapter.create.modelNouns || [];
    document.getElementById('proj-model-text').innerHTML = highlightNouns(sentences[sentenceIndex] || sentences[0], nouns);
    document.getElementById('proj-model-dots').innerHTML = sentences.map((_, i) =>
        `<span class="dot ${i === sentenceIndex ? 'active' : ''}"></span>`).join('');
}

function renderCreateWrite(wallWords) {
    showProjScreen('proj-create-write');
    document.getElementById('proj-write-reminder').textContent = (chapter.create.bullets && chapter.create.bullets[0]) || 'Use words from the wall below.';
    renderWallTiles('proj-write-wall-tiles', wallWords);
}

function renderCreateCheck() {
    showProjScreen('proj-create-check');
}

// ---------- Practice stage (generic 5-activity template) ----------
// Mirrors the teacher's actual interactions live (a tile placed, a word
// found, a sentence word picked) rather than just the activity's starting
// state — the grid/word-pool data is deterministic per chapter, so both
// screens already agree on it without needing to send the whole thing twice.
function renderPracticeActivity(msg) {
    showProjScreen('proj-practice');
    document.getElementById('proj-practice-result').style.display = 'none';
    document.getElementById('proj-practice-badge').innerHTML = `<i class="fa-solid fa-gamepad"></i> ${msg.title}`;
    document.getElementById('proj-practice-counter').textContent = `Activity ${msg.index + 1} of ${msg.total}`;

    document.querySelectorAll('.proj-practice-body').forEach(el => el.style.display = 'none');

    if (msg.activityType === 'word-detective') {
        document.getElementById('proj-practice-detective').style.display = 'flex';
        document.getElementById('proj-practice-clue').textContent = `"${msg.clue}"`;
    } else if (msg.activityType === 'word-sort') {
        document.getElementById('proj-practice-sort').style.display = 'flex';
        document.getElementById('proj-sort-zones').innerHTML = msg.zones.map(z => `
            <div class="proj-sort-zone" id="proj-sort-zone-${z.id}">
                <h4>${z.label}</h4>
                <span class="hint">${z.hint}</span>
                <div class="proj-sort-zone-items" id="proj-sort-items-${z.id}"></div>
            </div>`).join('');
    } else if (msg.activityType === 'sentence-builder') {
        document.getElementById('proj-practice-builder').style.display = 'flex';
        document.getElementById('proj-builder-assembly').innerHTML = '';
    } else if (msg.activityType === 'word-search') {
        document.getElementById('proj-practice-search').style.display = 'flex';
        const grid = document.getElementById('proj-ws-grid');
        grid.style.gridTemplateColumns = `repeat(${msg.grid.length}, 1fr)`;
        grid.innerHTML = msg.grid.map((row, r) => row.map((letter, c) =>
            `<span class="cell" id="proj-ws-cell-${r}-${c}">${letter}</span>`).join('')).join('');
        document.getElementById('proj-ws-word-list').innerHTML = msg.words.map(w =>
            `<span class="word" id="proj-ws-word-${w}">${w}</span>`).join('');
    } else if (msg.activityType === 'quick-check') {
        document.getElementById('proj-practice-quickcheck').style.display = 'flex';
        document.getElementById('proj-practice-question').textContent = msg.question;
        const letters = ['A', 'B', 'C', 'D'];
        document.getElementById('proj-quickcheck-options').innerHTML = msg.options.map((opt, i) =>
            `<div class="option"><span class="letter">${letters[i]}</span><span>${opt}</span></div>`).join('');
    }
}

function renderPracticeSortPlaced(zoneId, word) {
    const target = document.getElementById(`proj-sort-items-${zoneId}`);
    if (!target) return;
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = word;
    target.appendChild(chip);
}

function renderPracticeBuilderWord(word) {
    const assembly = document.getElementById('proj-builder-assembly');
    if (!assembly) return;
    const span = document.createElement('span');
    span.className = 'word';
    span.textContent = word;
    assembly.appendChild(span);
}

function renderPracticeWordFound(cells, word) {
    cells.forEach(([r, c]) => {
        const cell = document.getElementById(`proj-ws-cell-${r}-${c}`);
        if (cell) cell.classList.add('found');
    });
    const wordEl = document.getElementById(`proj-ws-word-${word}`);
    if (wordEl) wordEl.classList.add('found');
}

function renderPracticeResult(correct) {
    const el = document.getElementById('proj-practice-result');
    el.className = `proj-practice-result ${correct ? 'correct' : 'wrong'}`;
    el.textContent = correct ? '✓ Correct!' : '✗ Not quite';
    el.style.display = 'block';
}

// Chapter 1's Noun Detective — full mirroring (see chapter1-practice.js's
// "PROJECTOR MIRRORING" section for what triggers each message). Shows the
// same visual content as the teacher's own screen; interactive controls
// (buttons, text inputs, the Hunt modal) are deliberately left out.
function showC1Screen(id) {
    document.querySelectorAll('#proj-practice-c1 .screen').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function renderC1Discover(msg) {
    showProjScreen('proj-practice-c1');
    showC1Screen('screen-discover');
    renderC1Hotspots(document.getElementById('proj-c1-discover-scene'), C1_DISCOVER_IDS, msg.foundIds, [], msg.selectedId);
    const resultWrap = document.getElementById('proj-c1-discover-result');
    if (msg.selectedId) {
        const obj = C1_WORLD_OBJECTS[msg.selectedId];
        document.getElementById('proj-c1-discover-noun-display').innerHTML = `<span class="emoji">${obj.emoji}</span><span>${obj.label.toUpperCase()}</span>`;
        resultWrap.style.display = 'flex';
    } else {
        resultWrap.style.display = 'none';
    }
}

function renderC1Classify(msg) {
    showProjScreen('proj-practice-c1');
    showC1Screen('screen-classify');
    const obj = C1_WORLD_OBJECTS[msg.nounId];
    if (obj) document.getElementById('proj-c1-classify-noun-display').innerHTML = `<span class="emoji">${obj.emoji}</span><span>${obj.label.toUpperCase()}</span>`;
    const resultDiv = document.getElementById('proj-c1-classify-result');
    if (msg.shown && obj) {
        resultDiv.innerHTML = msg.correct
            ? `<div class="result-card">
                <div class="result-emoji">🎉</div>
                <div class="result-title">Correct!</div>
                <p class="result-text">
                    <span class="noun-badge common">${obj.label} — Common Noun</span><br><br>
                    A Common Noun gives a general name to a person, place, animal, or thing.
                </p></div>`
            : `<div class="result-card incorrect">
                <div class="result-emoji">🤔</div>
                <div class="result-title">Not Quite!</div>
                <p class="result-text"><strong>"${obj.label}"</strong> is a Common Noun, not a Proper Noun.</p></div>`;
        resultDiv.style.display = 'flex';
    } else {
        resultDiv.style.display = 'none';
        resultDiv.innerHTML = '';
    }
}

function renderC1Why(msg) {
    showProjScreen('proj-practice-c1');
    showC1Screen('screen-why');
    document.querySelectorAll('#proj-c1-why-options .option-btn').forEach(b => b.classList.remove('selected-correct', 'selected-incorrect'));
    const resultDiv = document.getElementById('proj-c1-why-result');
    if (msg.shown) {
        document.querySelector(`#proj-c1-why-options .option-btn[data-answer="${msg.correct ? 'b' : ''}"]`)?.classList.add('selected-correct');
        resultDiv.innerHTML = msg.correct
            ? `<div class="result-card">
                <div class="result-emoji">✨</div>
                <div class="result-title">Exactly!</div>
                <p class="result-text">
                    <strong>Flame</strong> is the special name given to the dragon, so it is a <span class="noun-badge proper">Proper Noun</span>.<br><br>
                    Proper Nouns always begin with a <strong>capital letter!</strong>
                </p></div>`
            : `<div class="result-card incorrect">
                <div class="result-emoji">🤔</div>
                <div class="result-title">Not Quite!</div>
                <p class="result-text">Think about it: <strong>"dragon"</strong> tells us what it is, but <strong>"Flame"</strong> is its special name.</p></div>`;
        resultDiv.style.display = 'flex';
    } else {
        resultDiv.style.display = 'none';
        resultDiv.innerHTML = '';
    }
}

function renderC1Name(msg) {
    showProjScreen('proj-practice-c1');
    showC1Screen('screen-name');
    document.getElementById('proj-c1-naming-chips').innerHTML = C1_NAMEABLE_IDS.map(id => {
        const obj = C1_WORLD_OBJECTS[id];
        const active = msg.nounId === id ? ' active' : '';
        const named = msg.namedIds.includes(id);
        return `<div class="naming-chip${active}"><span>${obj.emoji} ${titleCaseC1(obj.label)}</span>${named ? '<span class="chip-check">✓</span>' : ''}</div>`;
    }).join('');
    const obj = C1_WORLD_OBJECTS[msg.nounId];
    document.getElementById('proj-c1-naming-preview').innerHTML = `<span class="emoji">${obj.emoji}</span><span>${obj.label}</span>`;
    const resultBox = document.getElementById('proj-c1-transform-result');
    if (msg.properName) {
        resultBox.classList.add('visible');
        document.getElementById('proj-c1-transform-name').innerHTML = `✨ ${msg.properName}`;
        document.getElementById('proj-c1-transform-common-name').textContent = obj.label;
        document.getElementById('proj-c1-transform-proper-name').textContent = msg.properName;
    } else {
        resultBox.classList.remove('visible');
    }
}

function renderC1Fix(msg) {
    showProjScreen('proj-practice-c1');
    showC1Screen('screen-fix');
    const container = document.getElementById('proj-c1-fixer-sentence');
    let html = '<span class="fixer-quote">&ldquo;</span>';
    C1_FIXER_SENTENCE.forEach((item, index) => {
        const isFixed = !!msg.fixerFixed[index];
        const fixable = item.word !== item.fixed;
        const cls = fixable ? `fixer-word fixable${isFixed ? ' fixed' : ''}` : 'fixer-word not-fixable';
        html += `<span class="${cls}">${isFixed ? item.fixed : item.word}</span>`;
    });
    html += '<span class="fixer-quote">&rdquo;</span>';
    container.innerHTML = html;

    const resultDiv = document.getElementById('proj-c1-fixer-result');
    if (msg.checked) {
        resultDiv.innerHTML = msg.allCorrect
            ? `<div class="result-card">
                <div class="result-emoji">🎉</div>
                <div class="result-title">Perfect!</div>
                <p class="result-text">
                    <strong>"Maya saw a dragon named Flame."</strong><br><br>
                    <strong>Maya</strong> and <strong>Flame</strong> are Proper Nouns, so they begin with <strong>capital letters!</strong>
                </p></div>`
            : `<div class="result-card incorrect">
                <div class="result-emoji">🤔</div>
                <div class="result-title">Almost There!</div>
                <p class="result-text">Look for the <strong>special names</strong> (Proper Nouns) — they need capital letters!</p></div>`;
        resultDiv.style.display = 'flex';
    } else {
        resultDiv.style.display = 'none';
        resultDiv.innerHTML = '';
    }
}

function renderC1Hunt(msg) {
    showProjScreen('proj-practice-c1');
    showC1Screen('screen-hunt');
    renderC1Hotspots(document.getElementById('proj-c1-hunt-scene'), C1_HUNT_IDS, msg.foundIds, msg.namedIds, null);

    const commonEl = document.getElementById('proj-c1-common-collection');
    commonEl.innerHTML = '';
    for (let i = 0; i < msg.commonTarget; i++) {
        const id = msg.commons[i];
        const slot = document.createElement('div');
        slot.className = id ? 'collection-slot filled common-filled' : 'collection-slot';
        slot.textContent = id ? `${i + 1}. ${C1_WORLD_OBJECTS[id].emoji} ${C1_WORLD_OBJECTS[id].label}` : `${i + 1}. ___`;
        commonEl.appendChild(slot);
    }
    document.getElementById('proj-c1-common-progress').textContent = `Found: ${Math.min(msg.commons.length, msg.commonTarget)} / ${msg.commonTarget}`;

    const properEl = document.getElementById('proj-c1-proper-collection');
    properEl.innerHTML = '';
    for (let i = 0; i < msg.properTarget; i++) {
        const entry = msg.propers[i];
        const slot = document.createElement('div');
        slot.className = entry ? 'collection-slot filled proper-filled' : 'collection-slot';
        slot.textContent = entry ? `${i + 1}. ⭐ ${entry.name}` : `${i + 1}. ___`;
        properEl.appendChild(slot);
    }
    document.getElementById('proj-c1-proper-progress').textContent = `Found: ${Math.min(msg.propers.length, msg.properTarget)} / ${msg.properTarget}`;
}

function renderC1QuickCheck(msg) {
    showProjScreen('proj-practice-c1');
    showC1Screen('screen-quickcheck');
    const panel = document.getElementById('proj-c1-quickcheck-panel');
    panel.innerHTML = msg.done
        ? `<div class="result-card"><div class="result-emoji">✅</div><div class="result-title">Quick Check complete!</div></div>`
        : `<div class="noun-display">${msg.question}</div>
           <p style="text-align:center; color:var(--c-text-light); font-weight:600; margin-top:12px;">Answer: <strong>${msg.answer}</strong></p>
           <p style="text-align:center; font-weight:700; margin-top:8px;">Question ${msg.index + 1} of ${msg.total}</p>`;
}

function renderC1Complete(msg) {
    showProjScreen('proj-practice-c1');
    showC1Screen('screen-complete');
    const items = [
        'Found nouns in the magical world',
        `Classified ${msg.commons} Common Nouns`,
        'Explained why a Proper Noun is special',
        `Created ${msg.propers} Proper Nouns`,
        'Fixed capitalization mistakes',
        'Completed the Noun Hunt'
    ];
    document.getElementById('proj-c1-completion-checklist').innerHTML = items.map(text => `
        <div class="checklist-item"><span class="check-icon">✓</span><span>${text}</span></div>`).join('');
}

// ---------- Perform stage ----------
function renderPerformFrame() {
    showProjScreen('proj-perform-frame');
}

function renderPerformPair(seconds, totalSeconds) {
    showProjScreen('proj-perform-pair');
    const fill = document.getElementById('proj-pair-timer-fill');
    const label = document.getElementById('proj-pair-timer-label');
    const circumference = 339.3;
    label.textContent = seconds <= 0 ? "Time's up!" : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    fill.style.strokeDashoffset = circumference * (1 - seconds / totalSeconds);
    fill.style.stroke = seconds <= 30 ? '#F59E0B' : 'var(--accent-green)';
}

function renderPerformSpotlight(name) {
    showProjScreen('proj-perform-spotlight');
    const icon = document.getElementById('proj-spotlight-icon');
    const text = document.getElementById('proj-spotlight-text');
    if (name) {
        icon.classList.add('active');
        icon.innerHTML = '<i class="fa-solid fa-star"></i>';
        text.innerHTML = `🎤 ${name}<br><span style="font-size:0.5em;">👏 👏 👏</span>`;
    } else {
        icon.classList.remove('active');
        icon.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        text.textContent = 'Ask for a volunteer…';
    }
}

function renderPerformClose() {
    showProjScreen('proj-perform-close');
}

// ---------- Message routing ----------
channel.onmessage = (event) => {
    const msg = event.data || {};
    switch (msg.type) {
        case 'settle': renderSettle(); break;
        case 'video-load': renderVideoLoad(msg); break;
        case 'video-cmd': handleVideoCmd(msg); break;
        case 'storybook': renderStorybookPage(msg.pageIndex); break;
        case 'thinktalk': renderThinkTalk(msg.cardIndex); break;
        case 'draw': renderDraw(); break;
        case 'timer-start': renderTimerStart(msg.seconds); break;
        case 'wrapup': renderWrapup(); break;
        case 'create-ritual': renderCreateRitual(msg.wallWords); break;
        case 'create-starter': renderCreateStarter(); break;
        case 'create-model': renderCreateModel(msg.sentenceIndex); break;
        case 'create-write': renderCreateWrite(msg.wallWords); break;
        case 'create-check': renderCreateCheck(); break;
        case 'practice-activity': renderPracticeActivity(msg); break;
        case 'practice-sort-placed': renderPracticeSortPlaced(msg.zoneId, msg.word); break;
        case 'practice-builder-word': renderPracticeBuilderWord(msg.word); break;
        case 'practice-word-found': renderPracticeWordFound(msg.cells, msg.word); break;
        case 'practice-result': renderPracticeResult(msg.correct); break;
        case 'practice-c1-discover': renderC1Discover(msg); break;
        case 'practice-c1-classify': renderC1Classify(msg); break;
        case 'practice-c1-why': renderC1Why(msg); break;
        case 'practice-c1-name': renderC1Name(msg); break;
        case 'practice-c1-fix': renderC1Fix(msg); break;
        case 'practice-c1-hunt': renderC1Hunt(msg); break;
        case 'practice-c1-quickcheck': renderC1QuickCheck(msg); break;
        case 'practice-c1-complete': renderC1Complete(msg); break;
        case 'perform-frame': renderPerformFrame(); break;
        case 'perform-pair': renderPerformPair(msg.seconds, msg.totalSeconds); break;
        case 'perform-spotlight': renderPerformSpotlight(msg.name); break;
        case 'perform-close': renderPerformClose(); break;
        case 'ping': channel.postMessage({ type: 'projector-ready' }); break;
    }
};

// Announce presence so the teacher's window can show a "Connected" status.
channel.postMessage({ type: 'projector-ready' });
window.addEventListener('beforeunload', () => channel.postMessage({ type: 'projector-closed' }));
