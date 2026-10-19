/* ==========================================================================
   Happy Minds — storybook read-aloud (narration.js)
   Shared by the teacher app (app.js) and the projector (projector.js), so the
   voice and pronunciation are the same wherever the story is read. When a
   projector is connected, the teacher's buttons make the PROJECTOR read
   (through the classroom speakers); otherwise the teacher's own device reads.

   Browser text-to-speech with a female voice, read one sentence at a time:
   natural pauses at full stops, long pages are never cut off (some voices
   stop after ~15 seconds of one utterance), and Pause/Resume is dependable —
   several voices ignore speechSynthesis.pause(), so Pause cancels and Resume
   re-reads the sentence it stopped in. Words are highlighted as they are
   spoken where the voice reports word positions; otherwise the sentence is.
   ========================================================================== */

const HMNarration = (() => {
    const supported = 'speechSynthesis' in window;

    // Female English voices, best first. Which ones exist depends on the
    // device and browser, so the first one found is used.
    const VOICE_PREFERENCES = [
        /Neerja/i,                                      // Indian English — Edge / Windows
        /Heera/i,                                       // Indian English — Windows
        /Veena/i,                                       // Indian English — Mac / iPhone
        /(Aria|Jenny|Sonia|Libby|Natasha).*Natural/i,   // Edge natural voices
        /Google UK English Female/i,
        /Google US English/i,
        /Zira/i,                                        // US English — Windows
        /Samantha|Karen|Moira|Tessa|Fiona|Serena|Victoria/i, // Mac / iPhone
        /female|woman/i
    ];
    const MALE_VOICE = /David|Mark|Ravi|George|Guy|Ryan|Prabhat|Daniel|Alex|Fred|Rishi|Thomas|\bmale\b/i;

    // Story names respelled so text-to-speech says them the way we do.
    // Add a name here if a voice gets it wrong (key = word as written).
    const PRONUNCIATIONS = {
        Aanya: 'Aahnya',
        Lumora: 'Loomora',
        Nima: 'Neema'
    };

    let voice = null;
    if (supported) {
        // Voices load after the page; choose again once they arrive.
        window.speechSynthesis.addEventListener('voiceschanged', () => { voice = null; });
    }

    function pickVoice() {
        if (voice) return voice;
        const english = window.speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
        for (const pattern of VOICE_PREFERENCES) {
            const match = english.find(v => pattern.test(v.name) && !MALE_VOICE.test(v.name));
            if (match) return (voice = match);
        }
        const notMale = english.filter(v => !MALE_VOICE.test(v.name));
        voice = notMale.find(v => /en-IN/i.test(v.lang)) || notMale.find(v => /en-GB/i.test(v.lang)) || notMale[0] || english[0] || null;
        return voice;
    }

    const spokenForm = word => word.replace(/[A-Za-z]+/g, w => PRONUNCIATIONS[w] || w);

    // One <span class="sb-word"> per word, so the word being read can be lit up.
    function renderWords(el, text) {
        el.innerHTML = '';
        text.split(/(\s+)/).forEach(chunk => {
            if (/^\s+$/.test(chunk)) {
                el.appendChild(document.createTextNode(chunk));
            } else if (chunk.length) {
                const span = document.createElement('span');
                span.className = 'sb-word';
                span.textContent = chunk;
                el.appendChild(span);
            }
        });
    }

    // Sentences to speak, each remembering where every word sits in the
    // spoken text (which can differ from the printed text: respelled names).
    function buildSentences(container) {
        const sentences = [];
        let current = null;
        container.querySelectorAll('.sb-word').forEach(span => {
            if (!current) current = { text: '', words: [] };
            const spoken = spokenForm(span.textContent);
            if (current.text) current.text += ' ';
            current.words.push({ span, start: current.text.length, end: current.text.length + spoken.length });
            current.text += spoken;
            if (/[.!?]["'”’)]*$/.test(span.textContent)) { sentences.push(current); current = null; }
        });
        if (current) sentences.push(current);
        return sentences;
    }

    // A reader for one storybook display. `container()` returns the element
    // holding the page's .sb-word spans; `onChange(state, info)` is called
    // with 'playing' | 'paused' | 'idle' (idle = next play starts from the
    // top), and info.error = 'not-allowed' if the browser blocked sound.
    function createReader({ container, onChange }) {
        const r = { state: 'idle', sentences: [], index: 0, run: 0, el: null };
        const notify = info => { if (onChange) onChange(r.state, info || {}); };
        const clear = () => {
            if (r.el) r.el.querySelectorAll('.sb-word').forEach(w => w.classList.remove('speaking', 'reading'));
        };

        function finish(info) {
            r.state = 'idle';
            r.index = 0;
            clear();
            notify(info);
        }

        function speakSentence() {
            const run = ++r.run;
            const sentence = r.sentences[r.index];
            if (!sentence) { finish(); return; }

            clear();
            sentence.words.forEach(w => w.span.classList.add('reading'));

            const utter = new SpeechSynthesisUtterance(sentence.text);
            const v = pickVoice();
            if (v) { utter.voice = v; utter.lang = v.lang; } else { utter.lang = 'en-IN'; }
            utter.rate = 0.9;
            utter.pitch = 1.05;

            utter.onboundary = (e) => {
                if (run !== r.run || (e.name && e.name !== 'word')) return;
                sentence.words.forEach(w => w.span.classList.remove('speaking'));
                const word = sentence.words.find(w => e.charIndex >= w.start && e.charIndex < w.end);
                if (word) word.span.classList.add('speaking');
            };
            const next = () => {
                if (run !== r.run || r.state !== 'playing') return;
                r.index++;
                speakSentence();
            };
            utter.onend = next;
            utter.onerror = (e) => {
                if (run !== r.run || e.error === 'interrupted' || e.error === 'canceled') return;
                if (e.error === 'not-allowed') { r.run++; finish({ error: 'not-allowed' }); return; }
                next();
            };
            window.speechSynthesis.speak(utter);
        }

        return {
            get state() { return r.state; },

            // Starts from the top; after pause() it resumes.
            play() {
                if (!supported || r.state === 'playing') return;
                if (r.state === 'idle') {
                    r.el = container();
                    r.sentences = r.el ? buildSentences(r.el) : [];
                    r.index = 0;
                }
                if (!r.sentences.length) return;
                r.state = 'playing';
                notify();
                window.speechSynthesis.cancel();
                speakSentence();
            },

            pause() {
                if (r.state !== 'playing') return;
                r.state = 'paused';
                r.run++;
                window.speechSynthesis.cancel();
                if (r.el) r.el.querySelectorAll('.sb-word.speaking').forEach(w => w.classList.remove('speaking'));
                notify();
            },

            // Ends reading; the next play() starts from the top again.
            stop() {
                if (r.state === 'idle') return;
                r.run++;
                window.speechSynthesis.cancel();
                finish();
            }
        };
    }

    return { supported, renderWords, createReader, pickVoice };
})();
