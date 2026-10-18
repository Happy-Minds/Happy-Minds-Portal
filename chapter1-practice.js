/* ============================================
   CHAPTER 1 PRACTICE — NOUN DETECTIVE
   All logic scoped under chapter1Practice.
   No globals, no listeners outside #chapter1-practice.

   Loaded only for chapter 1 — chapters 2-24 still run the generic
   5-activity Practice template in app.js. Host app hands off via the
   completeChapter1Practice() bridge at the bottom of app.js, called from
   goToNextSection() below.
   ============================================ */

const chapter1Practice = (() => {

    const ROOT = document.getElementById('chapter1-practice');
    const $  = (sel, ctx) => (ctx || ROOT).querySelector(sel);
    const $$ = (sel, ctx) => Array.from((ctx || ROOT).querySelectorAll(sel));

    // ─── NOUN / SCENE DATA ────────────────
    // Positions are % coordinates over assets/chapter1-practice/world/background.png,
    // eyeballed against the actual artwork (castle top-left, forest
    // cluster right, river/bridge center, rocks/mushrooms/flowers
    // scattered bottom). Hotspots are drawn as glowing markers rather
    // than stamping the individual object photos on top of the scene,
    // because those source images (dragon.jpg, girl.jpg, tree.png,
    // rocks.png, flowers.png, river.png, mushroom.png, bridge.png,
    // castle.png) all render on solid white/gray/cream studio
    // backgrounds and would otherwise show as visible boxes. Swap in
    // true transparent cutouts here later if better art becomes
    // available — the hotspot markup/positioning can stay the same.
    const WORLD_OBJECTS = {
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
    // Discover mission intentionally omits "girl" — she is the guide
    // speaking in that screen's bubble, not a scene clue to find yet.
    const DISCOVER_IDS = Object.keys(WORLD_OBJECTS).filter(id => id !== 'girl');
    const HUNT_IDS = Object.keys(WORLD_OBJECTS);

    // Objects offered in the Magical Naming Machine (mission 4).
    const NAMEABLE_IDS = ['dragon', 'rock', 'bird', 'flower', 'castle'];

    const HUNT_COMMON_TARGET = 5;
    const HUNT_PROPER_TARGET = 3;

    const FIXER_SENTENCE = [
        { word: 'maya',   needsFix: true,  fixed: 'Maya'  },
        { word: 'saw',    needsFix: false, fixed: 'saw'   },
        { word: 'a',      needsFix: false, fixed: 'a'     },
        { word: 'dragon', needsFix: false, fixed: 'dragon'},
        { word: 'named',  needsFix: false, fixed: 'named' },
        { word: 'flame.', needsFix: true,  fixed: 'Flame.'}
    ];

    const missionScreens = [
        'screen-intro', 'screen-discover', 'screen-classify', 'screen-why',
        'screen-name', 'screen-fix', 'screen-hunt', 'screen-quickcheck', 'screen-complete'
    ];
    const progressLabels = ['Discover', 'Classify', 'Why?', 'Name', 'Fix', 'Hunt', 'Check', 'Complete'];

    // The brief's Practice step 10: 3 oral quick-check questions, show of
    // hands, teacher taps how many of the class got it right.
    const QUICKCHECK_QUESTIONS = [
        { text: 'Is "mountain" a common noun or a proper noun?', answer: 'Common noun' },
        { text: 'Is "Mumbai" a common noun or a proper noun?', answer: 'Proper noun' },
        { text: 'Is "Flame" a common noun or a proper noun?', answer: 'Proper noun' }
    ];

    // ─── STATE (single source of truth) ──
    let state = freshState();

    function freshState() {
        return {
            selectedDiscoverNoun: null,
            classifyAnswered: false,
            whyAnswered: false,
            fixerChecked: false,
            fixerFixed: {},
            namingSelectedNoun: 'dragon',
            huntCurrentNoun: null,
            // nounId -> { common: bool, properName: string|null }
            discoveries: {},
            quickCheckIndex: 0,
            quickCheckTallies: []
        };
    }

    function getDiscovery(nounId) {
        if (!state.discoveries[nounId]) {
            state.discoveries[nounId] = { common: false, properName: null };
        }
        return state.discoveries[nounId];
    }
    function commonIds() {
        return Object.keys(state.discoveries).filter(id => state.discoveries[id].common);
    }
    function properEntries() {
        return Object.keys(state.discoveries)
            .filter(id => state.discoveries[id].properName)
            .map(id => ({ source: id, name: state.discoveries[id].properName }));
    }

    function titleCase(str) {
        return str.split(/\s+/).filter(Boolean)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
    }

    // ─── PROGRESS BAR ────────────────────
    function buildProgressBarHTML() {
        let html = '';
        for (let i = 1; i <= 8; i++) {
            const circleContent = i <= 7 ? i : '🏆';
            html += `<div class="progress-step" data-step="${i}">
                <div class="progress-circle">${circleContent}</div>
                <div class="progress-label">${progressLabels[i - 1]}</div>
            </div>`;
        }
        return html;
    }

    function renderAllProgressBars() {
        const html = buildProgressBarHTML();
        $$('.progress-bar').forEach(bar => { bar.innerHTML = html; });
    }

    function updateProgressBar(missionIndex) {
        $$('.progress-bar').forEach(bar => {
            $$('.progress-step', bar).forEach((step, i) => {
                step.classList.remove('active', 'completed');
                if (i + 1 < missionIndex) step.classList.add('completed');
                else if (i + 1 === missionIndex) step.classList.add('active');
            });
        });
    }

    // ─── WORLD SCENE RENDERING ───────────
    function renderWorldScene(sceneEl, ids, onClick) {
        $$('.world-hotspot', sceneEl).forEach(el => el.remove());
        ids.forEach(id => {
            const obj = WORLD_OBJECTS[id];
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `world-hotspot hotspot-${obj.size}`;
            btn.style.top = obj.top + '%';
            btn.style.left = obj.left + '%';
            btn.dataset.noun = id;
            btn.setAttribute('aria-label', obj.label);
            
            let visual = `<span class="hotspot-emoji">${obj.emoji}</span>`;
            if (obj.img) {
                const pos = obj.pos ? `object-position: ${obj.pos};` : '';
                visual = `<img src="${obj.img}" class="hotspot-img" style="${pos}" alt="${obj.label}">`;
            }
            
            btn.innerHTML = `${visual}<span class="object-label">${obj.emoji} ${titleCase(obj.label)}</span>`;
            btn.addEventListener('click', () => onClick(id, btn));
            sceneEl.appendChild(btn);
        });
    }

    function refreshHotspotState(sceneEl) {
        $$('.world-hotspot', sceneEl).forEach(btn => {
            const id = btn.dataset.noun;
            const d = state.discoveries[id];
            btn.classList.toggle('found', !!(d && d.common));
            btn.classList.toggle('named', !!(d && d.properName));
        });
    }

    // ─── PROJECTOR MIRRORING ──────────────
    // Full mirroring, one message type per mission screen, each carrying
    // enough of `state` for projector.js to render that screen from
    // scratch — not just the mission name. Only the interactive controls
    // (buttons, text inputs, the Hunt modal's back-and-forth) are left off
    // the projector; everything a student would actually look at is sent.
    // broadcastToProjector is defined in app.js, loaded after this file but
    // long before any click fires.
    // Guarded wrapper — every broadcast in this file goes through this
    // instead of calling the global directly, so there's one place that
    // knows app.js might not be loaded yet.
    function emit(msg) {
        if (typeof broadcastToProjector === 'function') broadcastToProjector(msg);
    }

    function syncProjector() {
        const active = ROOT.querySelector('.screen.active');
        if (active) broadcastC1Screen(active.id);
    }

    function broadcastC1Screen(screenId) {
        if (screenId === 'screen-discover') {
            emit({ type: 'practice-c1-discover', foundIds: commonIds(), selectedId: state.selectedDiscoverNoun });
        } else if (screenId === 'screen-classify') {
            emit({ type: 'practice-c1-classify', nounId: state.selectedDiscoverNoun, shown: false });
        } else if (screenId === 'screen-why') {
            emit({ type: 'practice-c1-why', shown: false });
        } else if (screenId === 'screen-name') {
            const d = getDiscovery(state.namingSelectedNoun);
            emit({ type: 'practice-c1-name', nounId: state.namingSelectedNoun, namedIds: NAMEABLE_IDS.filter(id => getDiscovery(id).properName), properName: d.properName });
        } else if (screenId === 'screen-fix') {
            emit({ type: 'practice-c1-fix', fixerFixed: state.fixerFixed, checked: state.fixerChecked, allCorrect: state.fixerChecked ? Object.values(state.fixerFixed).every(v => v === true) : null });
        } else if (screenId === 'screen-hunt') {
            emit({ type: 'practice-c1-hunt', foundIds: commonIds(), namedIds: Object.keys(state.discoveries).filter(id => state.discoveries[id].properName), commons: commonIds(), propers: properEntries(), commonTarget: HUNT_COMMON_TARGET, properTarget: HUNT_PROPER_TARGET });
        } else if (screenId === 'screen-quickcheck') {
            const i = state.quickCheckIndex;
            if (i >= QUICKCHECK_QUESTIONS.length) {
                emit({ type: 'practice-c1-quickcheck', done: true });
            } else {
                emit({ type: 'practice-c1-quickcheck', done: false, index: i, total: QUICKCHECK_QUESTIONS.length, question: QUICKCHECK_QUESTIONS[i].text, answer: QUICKCHECK_QUESTIONS[i].answer });
            }
        } else if (screenId === 'screen-complete') {
            emit({ type: 'practice-c1-complete', commons: Math.min(commonIds().length, HUNT_COMMON_TARGET), commonTarget: HUNT_COMMON_TARGET, propers: Math.min(properEntries().length, HUNT_PROPER_TARGET), properTarget: HUNT_PROPER_TARGET });
        }
    }

    // ─── SCREEN MANAGEMENT ───────────────
    function goToScreen(screenId) {
        $$('.screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(screenId);
        if (!target) return;
        target.classList.add('active');

        const idx = missionScreens.indexOf(screenId);
        if (idx >= 0) updateProgressBar(idx);

        // Screen-entry init runs first (e.g. initFixer() resets fixerFixed) so
        // the broadcast below reflects the freshly-entered screen's real
        // starting state, not whatever was left over from a previous visit.
        if (screenId === 'screen-hunt') renderHuntSidebar();
        if (screenId === 'screen-fix') initFixer();
        if (screenId === 'screen-quickcheck') renderQuickCheck();
        if (screenId === 'screen-complete') {
            renderCompletionChecklist();
            setTimeout(launchConfetti, 350);
        }

        syncProjector();

        ROOT.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ─── INTRO → DISCOVER ────────────────
    function startMission() {
        goToScreen('screen-discover');
    }

    // ─── MISSION 1: DISCOVER ─────────────
    function initDiscover() {
        renderWorldScene($('#discover-scene'), DISCOVER_IDS, selectDiscoverObject);
        refreshHotspotState($('#discover-scene'));
    }

    function selectDiscoverObject(nounId, btn) {
        $$('.world-hotspot', $('#discover-scene')).forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        state.selectedDiscoverNoun = nounId;
        const obj = WORLD_OBJECTS[nounId];

        const display = $('#discover-noun-display');
        display.innerHTML = `<span class="emoji">${obj.emoji}</span><span>${obj.label.toUpperCase()}</span>`;
        display.className = 'noun-display';

        const resultWrap = $('#discover-result');
        resultWrap.style.display = 'flex';
        resultWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
        syncProjector();
    }

    // ─── MISSION 2: CLASSIFY ─────────────
    function goToClassify() {
        state.classifyAnswered = false;
        goToScreen('screen-classify');

        const obj = WORLD_OBJECTS[state.selectedDiscoverNoun];
        const display = $('#classify-noun-display');
        display.innerHTML = `<span class="emoji">${obj.emoji}</span><span>${obj.label.toUpperCase()}</span>`;
        display.className = 'noun-display';

        $('#classify-result').style.display = 'none';
        $('#classify-result').innerHTML = '';
        $('#classify-buttons').style.display = 'flex';
        $('#btn-classify-common').disabled = false;
        $('#btn-classify-proper').disabled = false;
    }

    function classifyAnswer(answer) {
        if (state.classifyAnswered) return;
        const nounId = state.selectedDiscoverNoun;
        const obj = WORLD_OBJECTS[nounId];
        const resultDiv = $('#classify-result');

        // Every raw scene object is, by definition, still just a general
        // name until someone gives it a special name — so the only
        // correct classification here is "common". Selecting "proper"
        // must NEVER rename the noun or create a Proper Noun entry.
        if (answer === 'common') {
            state.classifyAnswered = true;
            $('#btn-classify-common').disabled = true;
            $('#btn-classify-proper').disabled = true;
            markCommon(nounId);

            resultDiv.innerHTML = `
                <div class="result-card">
                    <div class="result-emoji">🎉</div>
                    <div class="result-title">Correct!</div>
                    <p class="result-text">
                        <span class="noun-badge common">${obj.label} — Common Noun</span><br><br>
                        A Common Noun gives a general name to a person, place, animal, or thing.
                    </p>
                    <div class="result-actions">
                        <button class="btn btn-next btn-sm" onclick="chapter1Practice.goToScreen('screen-why')">Next Mission →</button>
                    </div>
                </div>`;
        } else {
            resultDiv.innerHTML = `
                <div class="result-card incorrect">
                    <div class="result-emoji">🤔</div>
                    <div class="result-title">Not Quite!</div>
                    <p class="result-text">
                        <strong>"${obj.label}"</strong> is a Common Noun, not a Proper Noun.
                    </p>
                    <p class="hint-line">💡 Hint: Is "${obj.label}" a special name for one particular ${obj.label}, or a general name?</p>
                    <div class="result-actions">
                        <button class="btn btn-secondary btn-sm" onclick="chapter1Practice.dismissClassifyResult()">Try Again</button>
                    </div>
                </div>`;
        }
        resultDiv.style.display = 'flex';
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        emit({ type: 'practice-c1-classify', nounId, shown: true, correct: answer === 'common' });
    }

    function dismissClassifyResult() {
        $('#classify-result').style.display = 'none';
        $('#classify-result').innerHTML = '';
        emit({ type: 'practice-c1-classify', nounId: state.selectedDiscoverNoun, shown: false });
    }

    // ─── MISSION 3: WHY ──────────────────
    function whyAnswer(btn, answer) {
        if (state.whyAnswered) return;
        const resultDiv = $('#why-result');

        if (answer === 'b') {
            state.whyAnswered = true;
            btn.classList.add('selected-correct');
            $$('.option-btn', $('#why-options')).forEach(b => { b.disabled = true; if (b !== btn) b.style.opacity = '0.5'; });

            resultDiv.innerHTML = `
                <div class="result-card">
                    <div class="result-emoji">✨</div>
                    <div class="result-title">Exactly!</div>
                    <p class="result-text">
                        <strong>Flame</strong> is the special name given to the dragon, so it is a <span class="noun-badge proper">Proper Noun</span>.<br><br>
                        Proper Nouns always begin with a <strong>capital letter!</strong>
                    </p>
                    <div class="result-actions">
                        <button class="btn btn-next btn-sm" onclick="chapter1Practice.goToScreen('screen-name')">Next Mission →</button>
                    </div>
                </div>`;
        } else {
            btn.classList.add('selected-incorrect');
            resultDiv.innerHTML = `
                <div class="result-card incorrect">
                    <div class="result-emoji">🤔</div>
                    <div class="result-title">Not Quite!</div>
                    <p class="result-text">
                        Think about it: <strong>"dragon"</strong> tells us what it is, but <strong>"Flame"</strong> is its special name.
                    </p>
                    <p class="hint-line">💡 Hint: which answer talks about a special name?</p>
                    <div class="result-actions">
                        <button class="btn btn-secondary btn-sm" onclick="chapter1Practice.dismissWhyResult(this)">Try Again</button>
                    </div>
                </div>`;
        }
        resultDiv.style.display = 'flex';
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        emit({ type: 'practice-c1-why', shown: true, correct: answer === 'b' });
    }

    function dismissWhyResult() {
        $$('.option-btn', $('#why-options')).forEach(b => b.classList.remove('selected-incorrect'));
        $('#why-result').style.display = 'none';
        $('#why-result').innerHTML = '';
        emit({ type: 'practice-c1-why', shown: false });
    }

    // ─── MISSION 4: NAMING MACHINE ───────
    function renderNamingChips() {
        const container = $('#naming-chips');
        container.innerHTML = NAMEABLE_IDS.map(id => {
            const obj = WORLD_OBJECTS[id];
            const d = getDiscovery(id);
            const active = state.namingSelectedNoun === id ? ' active' : '';
            const check = d.properName ? `<span class="chip-check">✓ ${d.properName}</span>` : '';
            return `<button type="button" class="naming-chip${active}" data-noun="${id}" onclick="chapter1Practice.selectNamingChip('${id}')">
                <span>${obj.emoji} ${titleCase(obj.label)}</span>${check}
            </button>`;
        }).join('');
    }

    function renderNamingPreview() {
        const nounId = state.namingSelectedNoun;
        const obj = WORLD_OBJECTS[nounId];
        const d = getDiscovery(nounId);

        $('#naming-preview').innerHTML = `<span class="emoji">${obj.emoji}</span><span>${obj.label}</span>`;
        $('#naming-input').value = '';
        $('#naming-error').textContent = '';
        $('#naming-input').classList.remove('input-error');

        const full = properEntries().length >= HUNT_PROPER_TARGET && !d.properName;
        $('#naming-full-row').style.display = full ? 'block' : 'none';
        $('#naming-input-row').style.display = full ? 'none' : 'block';

        const resultBox = $('#transform-result');
        if (d.properName) {
            resultBox.classList.add('visible');
            $('#transform-name').innerHTML = `✨ ${d.properName}`;
            $('#transform-common-name').textContent = obj.label;
            $('#transform-proper-name').textContent = d.properName;
        } else {
            resultBox.classList.remove('visible');
        }
    }

    function selectNamingChip(nounId) {
        state.namingSelectedNoun = nounId;
        renderNamingChips();
        renderNamingPreview();
        syncProjector();
    }

    function submitName() {
        const nounId = state.namingSelectedNoun;
        const obj = WORLD_OBJECTS[nounId];
        const input = $('#naming-input');
        const errorEl = $('#naming-error');
        const raw = input.value.trim();

        if (!raw) {
            errorEl.textContent = 'Please type a special name first!';
            input.classList.remove('input-error');
            void input.offsetWidth; // restart shake animation
            input.classList.add('input-error');
            input.focus();
            return;
        }
        if (properEntries().length >= HUNT_PROPER_TARGET && !getDiscovery(nounId).properName) {
            renderNamingPreview();
            return;
        }

        const properName = titleCase(raw);
        errorEl.textContent = '';
        input.classList.remove('input-error');

        markCommon(nounId);
        getDiscovery(nounId).properName = properName;

        $('#transform-name').innerHTML = `✨ ${properName}`;
        $('#transform-common-name').textContent = obj.label;
        $('#transform-proper-name').textContent = properName;
        $('#transform-result').classList.add('visible');
        $('#transform-result').scrollIntoView({ behavior: 'smooth', block: 'center' });

        addSparkles($('.naming-machine'), 6);
        renderNamingChips();
        renderNamingPreview();
        syncProjector();
    }

    // ─── SHARED: MARK A COMMON NOUN FOUND ─
    function markCommon(nounId) {
        const d = getDiscovery(nounId);
        if (d.common) return false;
        d.common = true;
        return true;
    }

    // ─── MISSION 5: GRAMMAR FIXER ────────
    function initFixer() {
        const container = $('#fixer-sentence');
        state.fixerFixed = {};
        state.fixerChecked = false;

        let html = '<span class="fixer-quote">&ldquo;</span>';
        FIXER_SENTENCE.forEach((item, index) => {
            const cls = item.needsFix ? 'fixer-word fixable' : 'fixer-word not-fixable';
            html += `<span class="${cls}" data-index="${index}" tabindex="${item.needsFix ? '0' : '-1'}">${item.word}</span>`;
            if (item.needsFix) state.fixerFixed[index] = false;
        });
        html += '<span class="fixer-quote">&rdquo;</span>';
        container.innerHTML = html;

        $$('.fixer-word.fixable', container).forEach(span => {
            const index = Number(span.dataset.index);
            span.addEventListener('click', () => toggleFix(span, index));
            span.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFix(span, index); }
            });
        });

        $('#fixer-result').style.display = 'none';
        $('#fixer-result').innerHTML = '';
        $('#fixer-check-btn').style.display = 'inline-flex';
        $('#fixer-check-btn').disabled = false;
    }

    function toggleFix(span, index) {
        if (state.fixerChecked) return;
        const item = FIXER_SENTENCE[index];
        const isFixed = !state.fixerFixed[index];
        span.textContent = isFixed ? item.fixed : item.word;
        span.classList.toggle('fixed', isFixed);
        span.setAttribute('aria-pressed', String(isFixed));
        state.fixerFixed[index] = isFixed;
        syncProjector();
    }

    function checkFixer() {
        state.fixerChecked = true;
        const allFixed = Object.values(state.fixerFixed).every(v => v === true);
        const resultDiv = $('#fixer-result');

        if (allFixed) {
            resultDiv.innerHTML = `
                <div class="result-card">
                    <div class="result-emoji">🎉</div>
                    <div class="result-title">Perfect!</div>
                    <p class="result-text">
                        <strong>"Maya saw a dragon named Flame."</strong><br><br>
                        <strong>Maya</strong> and <strong>Flame</strong> are Proper Nouns, so they begin with <strong>capital letters!</strong>
                    </p>
                    <div class="result-actions">
                        <button class="btn btn-next btn-sm" onclick="chapter1Practice.goToScreen('screen-hunt')">Next Mission →</button>
                    </div>
                </div>`;
            $('#fixer-check-btn').style.display = 'none';
        } else {
            resultDiv.innerHTML = `
                <div class="result-card incorrect">
                    <div class="result-emoji">🤔</div>
                    <div class="result-title">Almost There!</div>
                    <p class="result-text">Look for the <strong>special names</strong> (Proper Nouns) — they need capital letters!</p>
                    <div class="result-actions">
                        <button class="btn btn-secondary btn-sm" onclick="chapter1Practice.dismissFixerResult()">Try Again</button>
                    </div>
                </div>`;
            state.fixerChecked = false;
        }
        resultDiv.style.display = 'flex';
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        emit({ type: 'practice-c1-fix', fixerFixed: state.fixerFixed, checked: true, allCorrect: allFixed });
    }

    function dismissFixerResult() {
        $('#fixer-result').style.display = 'none';
        $('#fixer-result').innerHTML = '';
        syncProjector();
    }

    // ─── MISSION 6: NOUN HUNT ────────────
    function initHunt() {
        // Populate the scene once; do NOT clear collected state here —
        // re-entering this screen (e.g. after visiting Complete and
        // coming back) must never wipe progress already made.
        renderWorldScene($('#hunt-scene'), HUNT_IDS, huntSelectObject);
        refreshHotspotState($('#hunt-scene'));
    }

    function renderHuntSidebar() {
        initHunt();
        updateHuntCollections();
    }

    function huntSelectObject(nounId) {
        state.huntCurrentNoun = nounId;
        const obj = WORLD_OBJECTS[nounId];
        const d = getDiscovery(nounId);

        $('#hunt-modal-noun').innerHTML = `<span class="emoji">${obj.emoji}</span><span>${obj.label.toUpperCase()}</span>`;
        $('#hunt-modal-noun').className = 'noun-display';

        if (!d.common) {
            huntRenderClassifyQuestion(nounId);
        } else if (!d.properName && properEntries().length < HUNT_PROPER_TARGET) {
            huntRenderNamingOffer(nounId);
        } else {
            huntRenderAlreadyDiscovered(nounId);
        }

        $('#hunt-modal').classList.add('visible');
    }

    function huntCloseModal() {
        $('#hunt-modal').classList.remove('visible');
        state.huntCurrentNoun = null;
        updateHuntCollections();
        checkHuntComplete();
    }

    function huntRenderClassifyQuestion(nounId) {
        $('#hunt-modal-body').innerHTML = `
            <p style="font-size:1.2rem; font-weight:600; margin:12px 0 20px;">Is this a Common Noun or a Proper Noun?</p>
            <div class="btn-row">
                <button class="btn btn-common" onclick="chapter1Practice.huntClassify('common')">📘 Common Noun</button>
                <button class="btn btn-proper" onclick="chapter1Practice.huntClassify('proper')">📕 Proper Noun</button>
            </div>`;
    }

    function huntClassify(answer) {
        const nounId = state.huntCurrentNoun;
        if (!nounId) return;
        const obj = WORLD_OBJECTS[nounId];

        if (answer === 'proper') {
            // CRITICAL: an un-named scene object can never be correctly
            // classified as a Proper Noun. Never rename it, never add
            // it to the Proper Noun collection here.
            $('#hunt-modal-body').innerHTML = `
                <div class="result-card incorrect">
                    <div class="result-emoji">🤔</div>
                    <div class="result-title">Not Quite!</div>
                    <p class="result-text"><strong>"${obj.label}"</strong> is a Common Noun.</p>
                    <p class="hint-line">💡 Hint: Is "${obj.label}" a special name for one particular ${obj.label}, or a general name?</p>
                    <div class="result-actions">
                        <button class="btn btn-secondary btn-sm" onclick="chapter1Practice.huntRenderClassifyQuestion('${nounId}')">Try Again</button>
                    </div>
                </div>`;
            return;
        }

        markCommon(nounId);
        refreshHotspotState($('#hunt-scene'));
        updateHuntCollections();
        syncProjector();

        $('#hunt-modal-body').innerHTML = `
            <div class="result-card">
                <div class="result-emoji">✅</div>
                <div class="result-title">Got it!</div>
                <p class="result-text">
                    <span class="noun-badge common">${obj.label} — Common Noun</span><br>
                    <em>"${obj.label}" is a general name.</em>
                </p>
                <div class="result-actions" id="hunt-post-classify-actions"></div>
            </div>`;

        const actions = $('#hunt-post-classify-actions');
        if (properEntries().length >= HUNT_PROPER_TARGET) {
            actions.innerHTML = `<button class="btn btn-next btn-sm" onclick="chapter1Practice.huntCloseModal()">Close</button>`;
        } else {
            actions.innerHTML = `
                <button class="btn btn-secondary btn-sm" onclick="chapter1Practice.huntCloseModal()">Skip</button>
                <button class="btn btn-accent btn-sm" onclick="chapter1Practice.huntRenderNamingInput('${nounId}')">✨ Give it a special name</button>`;
        }
    }

    function huntRenderNamingOffer(nounId) {
        const obj = WORLD_OBJECTS[nounId];
        $('#hunt-modal-body').innerHTML = `
            <p style="font-size:1.15rem; font-weight:600; margin:12px 0 4px;">📘 "${obj.label}" is already a Common Noun.</p>
            <p style="font-size:1.1rem; color:var(--c-text-light); margin-bottom:18px;">✨ Want to give this ${obj.label} a special name?</p>
            <div class="btn-row">
                <button class="btn btn-secondary" onclick="chapter1Practice.huntCloseModal()">Skip</button>
                <button class="btn btn-accent" onclick="chapter1Practice.huntRenderNamingInput('${nounId}')">✨ Give it a name</button>
            </div>`;
    }

    function huntRenderNamingInput(nounId) {
        const obj = WORLD_OBJECTS[nounId];
        $('#hunt-modal-body').innerHTML = `
            <p style="font-size:1.1rem; font-weight:600; margin:12px 0 14px;">What should we call this ${obj.label}?</p>
            <input type="text" class="naming-input" id="hunt-naming-input" placeholder="e.g. ${obj.label === 'dragon' ? 'Flame' : titleCase(obj.label) + 'y'}" maxlength="24" autocomplete="off">
            <div class="naming-error-msg" id="hunt-naming-error"></div>
            <div class="btn-row" style="margin-top:10px;">
                <button class="btn btn-secondary btn-sm" onclick="chapter1Practice.huntCloseModal()">Cancel</button>
                <button class="btn btn-accent btn-sm" onclick="chapter1Practice.huntSubmitName('${nounId}')">✨ Transform!</button>
            </div>`;
        $('#hunt-naming-input').focus();
    }

    function huntSubmitName(nounId) {
        const input = $('#hunt-naming-input');
        const errorEl = $('#hunt-naming-error');
        const raw = input.value.trim();
        const obj = WORLD_OBJECTS[nounId];

        if (!raw) {
            errorEl.textContent = 'Please type a special name first!';
            input.classList.remove('input-error');
            void input.offsetWidth;
            input.classList.add('input-error');
            input.focus();
            return;
        }

        const properName = titleCase(raw);
        getDiscovery(nounId).properName = properName;
        refreshHotspotState($('#hunt-scene'));
        updateHuntCollections();
        syncProjector();

        $('#hunt-modal-body').innerHTML = `
            <div class="transform-arrow">⬇️</div>
            <div class="noun-display proper">✨ ${properName}</div>
            <span class="noun-badge proper">Proper Noun</span>
            <p class="result-text" style="margin-top:14px;">
                <strong>${obj.label}</strong> is a Common Noun.<br>
                <strong>${properName}</strong> is a Proper Noun — a special name!
            </p>
            <div class="result-actions">
                <button class="btn btn-next btn-sm" onclick="chapter1Practice.huntCloseModal()">Close</button>
            </div>`;
        addSparkles($('.hunt-modal-content'), 5);
    }

    function huntRenderAlreadyDiscovered(nounId) {
        const obj = WORLD_OBJECTS[nounId];
        const d = getDiscovery(nounId);
        const properLine = d.properName
            ? `<br>✨ Special name: <strong style="color:var(--c-proper);">${d.properName}</strong>`
            : `<br><em>Proper Noun collection is already complete — great job!</em>`;
        $('#hunt-modal-body').innerHTML = `
            <p style="font-size:1.1rem; margin:12px 0 18px;">
                You've already found this one! <span class="noun-badge common">${obj.label}</span>${properLine}
            </p>
            <div class="result-actions">
                <button class="btn btn-next btn-sm" onclick="chapter1Practice.huntCloseModal()">Close</button>
            </div>`;
    }

    function updateHuntCollections() {
        const commons = commonIds();
        const propers = properEntries();

        const commonEl = $('#common-collection');
        commonEl.innerHTML = '';
        for (let i = 0; i < HUNT_COMMON_TARGET; i++) {
            const id = commons[i];
            const slot = document.createElement('div');
            if (id) {
                slot.className = 'collection-slot filled common-filled';
                slot.textContent = `${i + 1}. ${WORLD_OBJECTS[id].emoji} ${WORLD_OBJECTS[id].label}`;
            } else {
                slot.className = 'collection-slot';
                slot.textContent = `${i + 1}. ___`;
            }
            commonEl.appendChild(slot);
        }

        const properEl = $('#proper-collection');
        properEl.innerHTML = '';
        for (let i = 0; i < HUNT_PROPER_TARGET; i++) {
            const entry = propers[i];
            const slot = document.createElement('div');
            if (entry) {
                slot.className = 'collection-slot filled proper-filled';
                slot.textContent = `${i + 1}. ⭐ ${entry.name}`;
            } else {
                slot.className = 'collection-slot';
                slot.textContent = `${i + 1}. ___`;
            }
            properEl.appendChild(slot);
        }

        $('#common-progress').textContent = `Found: ${Math.min(commons.length, HUNT_COMMON_TARGET)} / ${HUNT_COMMON_TARGET}`;
        $('#proper-progress').textContent = `Found: ${Math.min(propers.length, HUNT_PROPER_TARGET)} / ${HUNT_PROPER_TARGET}`;
    }

    function checkHuntComplete() {
        const done = commonIds().length >= HUNT_COMMON_TARGET && properEntries().length >= HUNT_PROPER_TARGET;
        const btn = $('#hunt-complete-btn');
        btn.style.display = done ? 'flex' : 'none';
        if (done) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ─── COMPLETION SCREEN ───────────────
    function renderCompletionChecklist() {
        const commons = commonIds();
        const propers = properEntries();
        const items = [
            'Found nouns in the magical world',
            `Classified ${Math.min(commons.length, HUNT_COMMON_TARGET)} Common Nouns`,
            'Explained why a Proper Noun is special',
            `Created ${Math.min(propers.length, HUNT_PROPER_TARGET)} Proper Nouns`,
            'Fixed capitalization mistakes',
            'Completed the Noun Hunt'
        ];
        $('#completion-checklist').innerHTML = items.map((text, i) => `
            <div class="checklist-item" style="animation-delay:${(i + 1) * 0.08}s;">
                <span class="check-icon">✓</span>
                <span>${text}</span>
            </div>`).join('');
    }

    // ─── SPARKLE / CONFETTI EFFECTS ──────
    function addSparkles(container, count) {
        for (let i = 0; i < count; i++) {
            const sparkle = document.createElement('span');
            sparkle.className = 'sparkle';
            sparkle.textContent = '✨';
            sparkle.style.left = Math.random() * 90 + 5 + '%';
            sparkle.style.top = Math.random() * 90 + 5 + '%';
            sparkle.style.animationDelay = Math.random() * 2 + 's';
            container.style.position = container.style.position || 'relative';
            container.appendChild(sparkle);
            setTimeout(() => sparkle.remove(), 2200);
        }
    }

    function launchConfetti() {
        const container = $('#confetti-container');
        container.innerHTML = '';
        const colors = ['#FF9F43', '#A855F7', '#3B82F6', '#EC4899', '#28C76F', '#FECA57', '#FF6B6B'];
        for (let i = 0; i < 60; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDuration = (Math.random() * 2 + 2) + 's';
            piece.style.animationDelay = Math.random() * 1.5 + 's';
            piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            piece.style.width = (Math.random() * 8 + 6) + 'px';
            piece.style.height = (Math.random() * 8 + 6) + 'px';
            container.appendChild(piece);
        }
        setTimeout(() => { container.innerHTML = ''; }, 5000);
    }

    // ─── RESTART / RESET ─────────────────
    function restart() {
        state = freshState();

        $('#discover-result').style.display = 'none';
        $$('.option-btn', $('#why-options')).forEach(b => {
            b.disabled = false;
            b.classList.remove('selected-correct', 'selected-incorrect');
            b.style.opacity = '1';
        });
        $('#why-result').style.display = 'none';
        $('#why-result').innerHTML = '';

        $('#naming-input').value = '';
        $('#transform-result').classList.remove('visible');
        renderNamingChips();
        renderNamingPreview();

        initDiscover();
        initHunt();
        updateHuntCollections();
        $('#hunt-complete-btn').style.display = 'none';

        goToScreen('screen-intro');
    }

    // ─── QUICK CHECK (Practice step 10) ──
    function renderQuickCheck() {
        const i = state.quickCheckIndex;
        const panel = $('#quickcheck-panel');

        if (i >= QUICKCHECK_QUESTIONS.length) {
            const fewCount = state.quickCheckTallies.filter(t => t === 'few').length;
            panel.innerHTML = `
                <div class="result-card">
                    <div class="result-emoji">✅</div>
                    <div class="result-title">Quick Check complete!</div>
                    <p class="result-text">${fewCount > 0
                        ? "Noted — a Fix It Zone suggestion will be flagged for this class."
                        : "Most of the class has got it. Great work, explorers!"}</p>
                </div>
                <button class="btn btn-next" onclick="chapter1Practice.goToScreen('screen-complete')" style="margin-top:16px;">
                    Finish Practice →
                </button>`;
            $('#quickcheck-guide-bubble').textContent = "That's a wrap on nouns for today!";
            return;
        }

        const q = QUICKCHECK_QUESTIONS[i];
        $('#quickcheck-guide-bubble').textContent = `Question ${i + 1} of ${QUICKCHECK_QUESTIONS.length}: ask the class, then take a show of hands.`;
        panel.innerHTML = `
            <div class="noun-display">${q.text}</div>
            <p style="text-align:center; color:var(--c-text-light); font-weight:600; margin-bottom:16px;">Answer: <strong>${q.answer}</strong></p>
            <p style="text-align:center; font-weight:700; margin-bottom:12px;">How many students got it right?</p>
            <div class="btn-row">
                <button class="btn btn-common" onclick="chapter1Practice.quickCheckAnswer('most')">👍 Most</button>
                <button class="btn" style="background:#FEF3C7; color:#92400E;" onclick="chapter1Practice.quickCheckAnswer('some')">🤔 Some</button>
                <button class="btn btn-proper" onclick="chapter1Practice.quickCheckAnswer('few')">🆘 Few</button>
            </div>`;
    }

    function quickCheckAnswer(tally) {
        state.quickCheckTallies.push(tally);
        state.quickCheckIndex += 1;
        renderQuickCheck();
        syncProjector();
    }

    // ─── NEXT SECTION ─────────────────────
    function goToNextSection() {
        const btn = $('#btn-continue-create');
        if (btn) {
            btn.disabled = true;
            btn.textContent = '🚀 Heading to Create...';
        }
        // Host app hook (see app.js): marks Practice done for the Class 1
        // Planner's auto-tracking and navigates into the Create stage.
        if (typeof completeChapter1Practice === 'function') {
            const needsFixItZone = state.quickCheckTallies.includes('few');
            completeChapter1Practice(needsFixItZone);
        }
    }

    // ─── INITIALIZE ──────────────────────
    function init() {
        renderAllProgressBars();
        updateProgressBar(0);
        initDiscover();
        renderNamingChips();
        renderNamingPreview();
        initFixer();
        initHunt();
        updateHuntCollections();

        $('#hunt-modal').addEventListener('click', (e) => {
            if (e.target === $('#hunt-modal')) huntCloseModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && $('#hunt-modal').classList.contains('visible')) huntCloseModal();
        });
    }
    init();

    // ─── PUBLIC API ──────────────────────
    return {
        startMission,
        selectDiscoverObject,
        goToClassify,
        classifyAnswer,
        dismissClassifyResult,
        whyAnswer,
        dismissWhyResult,
        selectNamingChip,
        submitName,
        checkFixer,
        dismissFixerResult,
        huntSelectObject,
        huntClassify,
        huntCloseModal,
        huntRenderClassifyQuestion,
        huntRenderNamingInput,
        huntSubmitName,
        quickCheckAnswer,
        goToScreen,
        restart,
        goToNextSection,
        // Called from app.js's broadcastCurrentState() when a projector
        // connects (or reconnects) mid-game, so it catches up to whatever
        // screen is actually showing instead of sitting on a blank one.
        broadcastCurrentState: syncProjector
    };
})();
