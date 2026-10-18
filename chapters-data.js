/* ==========================================================================
   Happy Minds — Master Chapter List
   ONE row per chapter. This is the ONLY place chapter-specific content
   lives: the Explore video, the 4 Think & Talk questions, the Practice
   quiz answers, and the Create writing prompt. The page templates in
   app.js read from this list by chapter number — there are no separate
   per-chapter HTML pages.
   ========================================================================== */

const CHAPTERS = [
    {
        id: 1,
        title: 'My Imaginary World',
        quote: 'Let your ideas fly beyond the sky.',
        video: 'chapter-01.mp4',
        // Uploaded to YouTube — set this to that video's ID to embed it
        // instead of the (missing) local chapter-01.mp4 file.
        videoYoutubeId: 'pWsvQnsjPhk',
        // The Lumora Storybook, Chapter 1: "The Door That Wasn't There".
        // One page per screen in the Explore stage's read-along step.
        // `character` picks which avatar appears next to that page (or null
        // for the room/door pages before anyone from Lumora has appeared).
        // Each page's `image` is a full illustrated background (see
        // storybook-page-illustrated in styles.css) — only Chapter 1 has
        // these today; every other chapter falls back to the plain
        // text-card layout, honestly, rather than faking an illustration.
        storybook: [
            { character: null, image: 'assets/chapter1-storybook/page1.png', text: "One rainy Saturday, Aanya was tidying her room when she noticed something strange: a small wooden door standing against her cupboard. It had never been there before. Curious, she turned the brass handle and pushed." },
            { character: null, image: 'assets/chapter1-storybook/page2.png', text: 'Bright light poured out. When her eyes adjusted, Aanya was standing in a meadow of purple grass under two round moons. Floating lanterns bobbed between silver trees, and somewhere close by, she heard a soft rumble, like distant thunder. "Hello?" she called.' },
            { character: 'flame', image: 'assets/chapter1-storybook/page3.png', text: 'A large shape landed gently in front of her. It was a dragon, golden-eyed and kind, with wings that shimmered like glass. "I\'m Flame," the dragon said with a friendly nod. "Not many visitors find this door. Welcome to Lumora."' },
            { character: 'flame', image: 'assets/chapter1-storybook/page4.png', text: 'Aanya\'s mouth fell open. "This is amazing! Is this whole world... imaginary?" "Only if you stop believing in it," Flame said, chuckling. "Come on, I\'ll show you around."' },
            { character: 'flame', image: 'assets/chapter1-storybook/page5.png', text: 'Flame carried Aanya over sparkling rivers and past a castle built entirely of clouds. They met chattering fox-like creatures who spoke backward, and a market where merchants sold bottled starlight.' },
            { character: 'pip', image: 'assets/chapter1-storybook/page6.png', text: 'Everywhere Aanya looked, she found something new to name: the cloud castle, the fox creatures, a tiny blue bird that landed on her shoulder and refused to leave. She decided to call the bird Pip.' },
            { character: 'flame', image: 'assets/chapter1-storybook/page7.png', text: 'Too soon, the sky began to dim, and Flame turned toward a hill where the little wooden door stood waiting. "Will I ever come back?" Aanya asked. "Whenever you open your mind," Flame said, "the door finds you."' },
            { character: 'aanya', image: 'assets/chapter1-storybook/page8.png', text: 'Aanya stepped through, and just like that, she was back in her room, rain still tapping the window. But in her pocket, she found a single glowing feather, proof that Lumora, Flame, and Pip were real after all. She smiled and began to write it all down.' }
        ],
        // From the printed worksheet's "Explore: Open Your Mind!" — Imagine
        // This: one day you find a magic door, and behind it is a whole new
        // world.
        thinkTalk: [
            'What do you see when you walk through the door?',
            'What kind of place is it?',
            "What's the name of this world?",
            'What can you smell, hear, or touch?'
        ],
        comprehension: { question: 'Which word best describes this place?', answer: 'Magical' },
        // "Practice: Play With Words! — Let's Learn: Nouns" teaches common vs
        // proper nouns, so the vocab slot teaches the word "Noun" itself.
        vocab: { meaning: 'a naming word for a person, place, or thing', word: 'Noun' },
        starter: 'One day, I opened my magic door and stepped into...',
        // Practice cards listed on the student portal's Practice page
        // (student-portal.js renderPractice) — id is routed by startPractice().
        practiceList: [
            { id: 'ch1-practice', title: 'Noun Detective: 8 Interactive Activities' }
        ],
        // "I Can Check Myself" from the worksheet maps one-to-one onto the
        // four stages, and drives this chapter's Class Planner items too.
        planner: {
            class1: [
                'Imagine a new world: watch the story and lead the Think & Talk discussion',
                'Use nouns to name people, places and things: teach common vs proper nouns and complete the Noun Hunt & Word Search'
            ],
            class2: [
                'Write a fun short story about the magical world',
                'Share ideas with others: pair share, then Explorer’s Stage read-aloud'
            ]
        },
        create: {
            challenge: 'Write a short story about your magical world.',
            bullets: ['What the place looks like', 'Who or what you met', 'What happened to you', 'How you felt'],
            starters: ['One day, I opened my magic door and stepped into...', 'In my magical world, I...'],
            target: '5-6 sentences',
            hints: [
                'Have you thought about what makes your world special for the people who live there?',
                'Try describing what you hear and smell in your imaginary world!',
                'What magical creature or robot friend travels by your side?',
                'How do people travel from island to island in your sky world?'
            ],
            // Teacher's model story from the lesson script — Create step 3,
            // revealed one sentence at a time with its nouns highlighted.
            modelText: [
                'One day, I opened my magic door and stepped into... a world called Glimmerwood.',
                'The trees had silver leaves that chimed like tiny bells when the wind blew.',
                'I met a fox with golden fur who could talk.',
                'He said, "Follow me!"',
                'We ran through a meadow of glowing flowers.',
                'I felt so happy and curious. I wanted to stay forever.'
            ],
            modelNouns: ['door', 'world', 'Glimmerwood', 'trees', 'leaves', 'bells', 'wind', 'fox', 'meadow', 'flowers']
        },
        // Student self-access remediation — opened on demand, never part of
        // the classroom run. Box D only applies once Create is finished.
        fixItZone: {
            questions: [
                { text: 'Do you know what a noun is?', box: 'A' },
                { text: 'Can you find nouns in your drawing?', box: 'B' },
                { text: 'Can you tell the difference between a common noun and a proper noun?', box: 'C' },
                { text: 'Did you write a story about your magical world?', box: 'D', requiresCreate: true }
            ],
            boxes: {
                A: {
                    title: 'Box A: What is a Noun?',
                    body: 'A noun is a <strong>naming word</strong>. It names a person, place, or thing.<br><br><strong>Person:</strong> boy, teacher, friend<br><strong>Place:</strong> school, park, mountain<br><strong>Thing:</strong> book, dragon, pencil<br><br>Remember: a noun is anything you can see, touch, or think about.',
                    practice: [
                        { q: 'Is "dragon" a noun?', a: 'Yes — it names a thing!' },
                        { q: 'Is "run" a noun?', a: 'No — that’s an action word, not a naming word.' }
                    ]
                },
                B: {
                    title: 'Box B: Finding Nouns in Your Drawing',
                    body: 'Point to something in your drawing and ask: "What is this?" — that’s a noun!<br><br><strong>Look for people:</strong> mother, father, friend, teacher<br><strong>Look for places:</strong> castle, forest, mountain, river<br><strong>Look for things:</strong> tree, flower, cloud, sun, moon<br><br>Every thing you drew is a noun! Even imaginary things like "dragon" or "magic wand" are nouns.',
                    practice: [
                        { q: 'You drew a castle. Is "castle" a noun?', a: 'Yes — it names a place!' },
                        { q: 'You drew a cloud. Is "cloud" a noun?', a: 'Yes — it names a thing!' }
                    ]
                },
                C: {
                    title: 'Box C: Common vs Proper Nouns',
                    body: '<strong>Common noun</strong> — a general name, like <em>dog</em>, <em>city</em>, <em>girl</em>.<br><strong>Proper noun</strong> — a special name for one particular thing, like <em>Bruno</em>, <em>India</em>, <em>Meera</em>.<br><br>Proper nouns always start with a <strong>CAPITAL letter</strong>.',
                    practice: [
                        { q: 'Is "dog" common or proper?', a: 'Common — it could be any dog.' },
                        { q: 'Is "Bruno" common or proper?', a: 'Proper — it’s one specific dog’s special name.' }
                    ]
                },
                D: {
                    title: 'Box D: Writing Your Story',
                    body: 'Can’t start? Use the starter: <em>"One day, I opened my magic door and stepped into..."</em><br><br>Don’t know what to write? Describe your drawing — what do you see? What happens next?<br><br>Only wrote 2 sentences? Add one more: "Then I saw...", "After that, I felt..."<br><br>Worried about spelling? Just sound it out. You can fix spelling later.',
                    practice: []
                }
            },
            mistakes: [
                { mistake: 'Wrote "scooby" without a capital letter', fix: 'Write "Scooby" — a proper noun needs a capital.' },
                { mistake: 'Wrote "I saw a dragon" — is that a noun?', fix: 'Yes! "Dragon" is a noun (a thing).' },
                { mistake: 'Forgot to write any nouns', fix: 'Look at your drawing — list 3 things you see.' },
                { mistake: 'Your story has only 1 sentence', fix: 'Add 2 more: What happened? How did you feel?' }
            ]
        },
        // Teacher Prep page: what the Teacher QR opens, before class. Script
        // lines are structured by type (matches the brief's admin-panel line
        // types) so the same data could later feed both this page and the
        // in-class teacher remote.
        prep: {
            lessonPlan: {
                objectives: [
                    'Use imagination and sensory detail to describe an invented world',
                    'Identify and use common and proper nouns correctly',
                    'Build confidence speaking and sharing ideas aloud'
                ],
                studentOutputs: {
                    session1: 'A drawing of their magical world + a list of 5 common nouns',
                    session2: 'A short story (at least 2-3 sentences) + verbal feedback to a peer'
                },
                materials: ['Whiteboard or chart paper', 'Markers (multiple colours)', 'Timer', 'Student workbooks', 'Pencils, erasers, coloured pencils'],
                differentiation: [
                    { level: 'Advanced', action: 'Can you write 8 sentences instead of 5? Can you add adjectives?' },
                    { level: 'Struggling', action: 'Write 3 sentences instead of 5. I will help you.' },
                    { level: 'Very Shy', action: 'You can draw your answer. You can whisper to me.' }
                ]
            },
            beforeClassChecklist: [
                'Materials ready (paper, pencils, colours)',
                'Drawing space in workbook',
                'Answer cards printed (if used)',
                'Projector tested'
            ],
            session1Script: [
                { step: 1, stage: 'Explore', title: 'Settle and breathe', lines: [
                    { type: 'teacher_says', text: "Good morning, everyone! Before we begin, let's take a deep breath together. Breathe in... and out. Now, get comfortable. I'm going to ask your imagination to do something special today. Is your imagination ready?" },
                    { type: 'stage_direction', text: 'Pause for nods, thumbs up, or verbal responses.' }
                ]},
                { step: 2, stage: 'Explore', title: 'Watch the video', lines: [
                    { type: 'teacher_says', text: 'Keep that picture in your mind as you watch — this door leads to a world just like the one I asked you to imagine.' },
                    { type: 'stage_direction', text: 'Play the Chapter 1 video. Pause if a question comes up.' }
                ]},
                { step: 3, stage: 'Explore', title: 'Storybook read-along', lines: [
                    { type: 'teacher_says', text: "Now let's read Aanya's story together, page by page." },
                    { type: 'stage_direction', text: 'Turn the page once everyone has looked at the pictures.' }
                ]},
                { step: 4, stage: 'Explore', title: 'Think and Talk circle', lines: [
                    { type: 'teacher_says', text: 'First question. You just walked through the door. What is the VERY first thing you see? Call it out!' },
                    { type: 'expected_answers', text: 'A giant mushroom! / A waterfall that goes up! / A rainbow tree!' },
                    { type: 'teacher_says', text: 'Now, tell me, what kind of place is this?' },
                    { type: 'expected_answers', text: 'A candy forest! / A floating castle! / An ocean of stars!' }
                ]},
                { step: 5, stage: 'Explore', title: 'Draw your world', lines: [
                    { type: 'teacher_says', text: 'Now, we are going to capture this world. Draw a map of your magical world. Use colors. You have about 7 minutes to draw.' },
                    { type: 'roving_prompt', text: 'Wow! Tell me about this. What is this tall thing here?' },
                    { type: 'roving_prompt', text: 'I see you have a river here. What color is the water in your world?' },
                    { type: 'support_prompt', text: 'Stuck? Remember you said you heard a dragon snoring. Where is that dragon? Can you draw a little cave for it?' }
                ]},
                { step: 6, stage: 'Explore', title: 'Wrap up', lines: [
                    { type: 'teacher_says', text: "Pencils down. Look at what you've created. Give yourself a clap! Now we're going on a word adventure." }
                ]},
                { step: 7, stage: 'Practice', title: 'Grammar Spotlight: Nouns', lines: [
                    { type: 'teacher_says', text: 'Every word has a job. Some words name things — we call these nouns. First, a noun can name a person. What are some people?' },
                    { type: 'expected_answers', text: 'Boy! / Teacher! / Mom! / King!' },
                    { type: 'teacher_says', text: 'Second, a noun can name a place. Third, a noun can name a thing.' },
                    { type: 'expected_answers', text: 'School! / Mountain! / Book! / Dragon!' }
                ]},
                { step: 8, stage: 'Practice', title: "Try It Together (Maya and Flame)", lines: [
                    { type: 'teacher_says', text: "'Dog' is a common noun — any dog. But 'Scooby' is a proper noun — one specific dog. Proper nouns always start with a capital letter." },
                    { type: 'stage_direction', text: "Point to Maya's drawing — her dragon is named Flame." },
                    { type: 'expected_answers', text: "Common! / Proper! / Because it's ONE specific dragon!" }
                ]},
                { step: 9, stage: 'Practice', title: 'Noun Hunt from your drawing', lines: [
                    { type: 'teacher_says', text: 'Look at your drawing. It is FULL of nouns. Find 5 common nouns and write them down. You have 8 minutes.' },
                    { type: 'roving_prompt', text: 'I see you drew a big mountain. What is that? Write that down.' },
                    { type: 'support_prompt', text: "Let's look together. Point to something in your drawing. What is it?" }
                ]},
                { step: 10, stage: 'Practice', title: 'Quick check and close', lines: [
                    { type: 'teacher_says', text: "Quick check! Is 'Mumbai' common or proper?" },
                    { type: 'stage_direction', text: 'Show of hands — tap how many got it: Most / Some / Few.' }
                ]}
            ],
            session2Script: [
                { step: 1, stage: 'Create', title: 'Opening ritual and recap', lines: [
                    { type: 'teacher_says', text: 'Welcome back, explorers! Last session, you stepped through a magic door, imagined a whole new world, drew it, and learned that everything in your world has a name. Remember?' },
                    { type: 'stage_direction', text: 'Pause for student responses.' }
                ]},
                { step: 2, stage: 'Create', title: 'Story starter', lines: [
                    { type: 'teacher_says', text: "Here is what we're going to do. You are going to write a short story. Your story will start like this: 'One day, I opened my magic door and stepped into...'" }
                ]},
                { step: 3, stage: 'Create', title: 'Teacher models a story', lines: [
                    { type: 'teacher_says', text: 'Let me try writing one together with you. One day, I opened my magic door and stepped into... a world called Glimmerwood...' },
                    { type: 'stage_direction', text: 'Write or speak slowly, thinking aloud. Point to the nouns as you go.' }
                ]},
                { step: 4, stage: 'Create', title: 'Write your story', lines: [
                    { type: 'teacher_says', text: 'You have about 15 minutes to write your adventure. Ready? Begin!' },
                    { type: 'roving_prompt', text: 'I see you met a dragon! What color is the dragon? Can you add that detail?' },
                    { type: 'support_prompt', text: "Stuck? Let's look at your drawing together. Point to something. What is it?" }
                ]},
                { step: 5, stage: 'Create', title: 'Check my story', lines: [
                    { type: 'teacher_says', text: 'Pencils down! Read your story to yourself. Is there one more detail you want to add?' },
                    { type: 'stage_direction', text: "Remind students: invented spelling is fine — we can fix spelling later." }
                ]},
                { step: 6, stage: 'Perform', title: 'Feedback frame', lines: [
                    { type: 'teacher_says', text: "When you listen to someone else's story, notice what you loved, and one cool thing they imagined. Let's practice: 'I loved ___. One cool thing: ___.'" }
                ]},
                { step: 7, stage: 'Perform', title: 'Pair share', lines: [
                    { type: 'teacher_says', text: "Reader, take a deep breath — you've got this. Listener, get ready to listen." },
                    { type: 'support_prompt', text: "Feeling nervous? That's okay. You don't have to read loudly — just so your partner can hear." }
                ]},
                { step: 8, stage: 'Perform', title: "Explorer's Stage", lines: [
                    { type: 'teacher_says', text: 'Who wants to share one favorite part of their story with the whole class?' },
                    { type: 'stage_direction', text: 'Pick 2-3 volunteers only. Never pick at random.' }
                ]},
                { step: 9, stage: 'Perform', title: 'Close', lines: [
                    { type: 'teacher_says', text: "Today, you created a story, performed by reading it aloud, and became a listener who celebrated someone else's creativity. See you next time, explorers!" }
                ]}
            ]
        },
        // Chapter Reflection: Sections 1-8 and 10-14 use the shared template
        // (REFLECTION_TEMPLATE in app.js); only the grammar focus and the
        // Section 9 common-errors checklist are chapter-specific.
        reflection: {
            grammarFocus: 'Nouns (common & proper)',
            commonErrors: [
                'Wrote a proper noun without a capital letter',
                'Called a proper noun "common" or vice versa',
                'Listed a verb or adjective as a noun',
                'Repeated the same noun instead of finding 5 different ones',
                'Left the proper-noun list empty or incomplete'
            ]
        }
    },
    {
        id: 2,
        title: 'My Journey Begins',
        quote: 'Every journey starts with one step.',
        video: 'chapter-02.mp4',
        thinkTalk: [
            'What was the very first step in the journey you watched?',
            'How do you think the character felt at the start?',
            'Have you ever started something new and felt a little nervous?',
            'What helped the character keep going?'
        ],
        comprehension: { question: 'How did the character feel on the first day of the journey?', answer: 'Excited' },
        vocab: { meaning: 'to begin something for the first time', word: 'Start' },
        starter: 'The moment I stepped out the door...',
        storybook: [
            { character: null, text: 'The next rainy Saturday, Aanya opened the small wooden door again, and found herself back in Lumora. Pip, the little blue bird, landed on her shoulder at once, chirping excitedly.' },
            { character: 'pip', text: '"Aanya! I have a dream," Pip said. "I want to fly all the way to the North Cloud Mountains for the Great Migration."' },
            { character: 'flame', text: 'Flame the dragon swooped down beside them. "That is a big dream, Pip. But right now, you only fly around the garden."' },
            { character: 'pip', text: 'Pip\'s wings drooped. "I know. The mountains feel so far away."' },
            { character: 'flame', text: '"Every big dream needs small steps," Flame said. "What do you do every morning, Pip?" "I eat breakfast, then I nap in the sunflower patch," Pip admitted.' },
            { character: 'aanya', text: 'Aanya smiled. "Let\'s change that. What if you practice flying a little farther each day instead of napping?" Pip\'s eyes brightened. "I could fly to the old oak tree tomorrow!" "And the silver river the day after," Flame added. "One step at a time."' },
            { character: null, text: 'Together, they made a plan. Each morning, Pip flew a bit farther: first the oak tree, then the silver river, then the hill of bluebells. Aanya cheered every time, and Flame kept count of the distance on his claw. By the end of the week, Pip flew all the way to the edge of the forest, farther than ever before.' },
            { character: 'pip', text: '"You are ready for a bigger goal now," Flame said. "Next season, you could really join the migration." Pip puffed out his feathers proudly. "I practice every day, and I never give up. I am going to reach those mountains."' }
        ],
        create: {
            challenge: 'Think about a journey you began — a new school, a new place, or a new skill. What was it like to start?',
            bullets: ['Where were you going?', 'How did you feel before you started?', 'Who was with you?', 'What happened on the way?'],
            starters: ['The moment I stepped out the door...', 'My journey began when...'],
            target: '5-6 sentences',
            hints: [
                'What sounds did you hear on your first day?',
                'Who gave you courage to start?',
                'What did you carry with you?',
                'What surprised you along the way?'
            ],
            modelText: [
                'Every morning, I wake up and think about my dream of becoming a wildlife photographer.',
                'I practice taking pictures of birds in my garden every weekend.',
                'My best friend Ritu believes in my goal and cheers me on.',
                'Sometimes I worry that cameras are expensive, but I save a little money every month.',
                'I know that small steps lead to big dreams.',
                'One day, I want to photograph tigers in the wild.'
            ],
            modelNouns: ['practice', 'believes', 'cheers', 'worry', 'save', 'know', 'want']
        },
        practice: {
            sortTitle: 'Simple Present Tense Sort',
            sortZones: [
                {
                    id: 'base',
                    label: 'I / We / They',
                    hint: 'Use the plain verb — no -s ending.',
                    words: ['play', 'want', 'read', 'dream', 'practice', 'believe']
                },
                {
                    id: 's-form',
                    label: 'He / She / It',
                    hint: 'Add -s (or -es) to the verb.',
                    words: ['plays', 'wants', 'reads', 'dreams', 'practices', 'believes']
                }
            ]
        },
        reflection: {
            grammarFocus: 'Simple Present Tense',
            commonErrors: [
                'Dropping the -s on he/she/it verbs ("She want" instead of "She wants")',
                'Mixing present and past tense within the same sentence',
                'Using "is" + verb instead of the plain Simple Present ("She is want" instead of "She wants")',
                'Forgetting -es on verbs ending in -sh, -ch, -ss, -x, -o (e.g. "wish" → "wishes")',
                'Confusing habits/routines (Simple Present) with actions happening right now (Present Continuous)'
            ]
        },
        fixItZone: {
            questions: [
                { text: 'Can you name one goal you want to achieve this year?', box: 'A' },
                { text: 'Do you have a person who inspires you?', box: 'B' },
                { text: 'Can you think of a habit you want to build?', box: 'C' },
                { text: 'Did you write steps for your goal?', box: 'D', requiresCreate: true }
            ],
            boxes: {
                A: {
                    title: 'Box A: Finding a Goal',
                    body: 'Not sure what your goal is? Ask yourself:<br><br><strong>What do you enjoy doing?</strong> — "I enjoy..."<br><strong>What do you want to get better at?</strong> — "I want to improve my..."<br><strong>What makes you feel proud?</strong> — "I feel proud when I..."<br><br><strong>Short-term examples (next 3 months):</strong> Read 5 books, learn to swim, finish homework on time, make a new friend.<br><strong>Long-term examples (5+ years):</strong> Become a doctor, be a teacher, start my own business, travel the world.',
                    practice: [
                        { q: 'Is "read 5 books" a short-term or long-term goal?', a: 'Short-term — you could do it in the next 3 months.' },
                        { q: 'Is "become a doctor" a short-term or long-term goal?', a: 'Long-term — it takes many years to reach.' }
                    ]
                },
                B: {
                    title: 'Box B: Finding Inspiration',
                    body: "Don't have an inspiration yet? Think about:<br><br>Who helps you when you are stuck?<br>Who works hard every day?<br>Who makes you feel happy or safe?<br>Who has achieved something you admire?<br><br>Inspiration can be a parent, grandparent, teacher, friend, athlete, scientist, artist — or anyone you admire.",
                    practice: [
                        { q: 'Does your inspiration have to be famous?', a: 'No — it can be anyone who helps or encourages you, like a parent or teacher.' }
                    ]
                },
                C: {
                    title: 'Box C: Building a Habit',
                    body: 'A habit is a small action you do every day — like brushing your teeth, making your bed, reading for 10 minutes, drinking water, or saying "thank you."<br><br><strong>Easy habits to start:</strong> Wake up on time, pack your bag at night, drink water in the morning.',
                    practice: [
                        { q: 'Is "reading for 10 minutes every day" a habit?', a: 'Yes — it is a small action you repeat every day.' }
                    ]
                },
                D: {
                    title: 'Box D: Writing Steps for Your Goal',
                    body: 'Every goal needs small, clear steps. For example:<br><br><strong>Improve in maths</strong> → 1. Practice 10 sums every day 2. Ask teacher for help 3. Check my answers<br><strong>Learn to swim</strong> → 1. Watch swimming videos 2. Practice floating 3. Join swimming classes<br><strong>Read more books</strong> → 1. Read 10 pages every day 2. Visit the library 3. Ask for book recommendations<br><br>Remember: steps should be small things you can do every day or every week.',
                    practice: []
                }
            },
            mistakes: [
                { mistake: 'Your goal is too big ("become a millionaire")', fix: 'Break it into smaller steps: "Save money every week."' },
                { mistake: 'Your step is not clear ("try harder")', fix: 'Make it specific: "Practice maths for 10 minutes every day."' },
                { mistake: "You don't know who inspires you", fix: 'Think of someone who helps you — that person inspires you.' },
                { mistake: 'Your vision board is empty', fix: 'Start with just one box — draw or write one goal. Add more later.' }
            ]
        },
        prep: {
            lessonPlan: {
                objectives: [
                    'Set personal goals and express them using the Simple Present Tense',
                    'Identify a short-term and a long-term goal with concrete steps',
                    "Build confidence sharing a goal aloud and respond to a classmate's goal"
                ],
                studentOutputs: {
                    session1: 'A personal vision board (4 boxes: goals, inspiration, habits, dream job)',
                    session2: 'A short-term and long-term goal with 3 steps each + verbal feedback to a partner'
                },
                materials: ['Whiteboard or chart paper', 'Markers (multiple colours)', 'Timer', 'Student workbooks', 'Pencils, erasers, coloured pencils'],
                differentiation: [
                    { level: 'Advanced', action: 'Can you add a deadline to each step? Can you write a 3rd, longer-term goal?' },
                    { level: 'Struggling', action: 'Write 1 step instead of 3. I will help you choose a goal.' },
                    { level: 'Very Shy', action: 'You can draw your goal instead of writing it. You can whisper to me.' }
                ]
            },
            beforeClassChecklist: [
                'Materials ready (paper, pencils, colours)',
                'Vision board space in workbook',
                'Timer ready',
                'Projector tested'
            ],
            session1Script: [
                { step: 1, stage: 'Explore', title: 'Settle and breathe', lines: [
                    { type: 'teacher_says', text: "Good morning, everyone! Today we start a brand-new chapter: 'My Journey Begins.' Close your eyes. Think about one thing — just one thing — that you really, truly want to do this year. Not because your parents said so. Because YOU want it." },
                    { type: 'stage_direction', text: 'Pause 10 seconds, then have students open their eyes.' }
                ]},
                { step: 2, stage: 'Explore', title: 'Watch the video', lines: [
                    { type: 'teacher_says', text: "Keep that dream in mind as you watch — this video is about a journey just like the one you're thinking of." },
                    { type: 'stage_direction', text: 'Play the Chapter 2 video. Pause if a question comes up.' }
                ]},
                { step: 3, stage: 'Explore', title: 'Storybook read-along', lines: [
                    { type: 'teacher_says', text: "Let's read Pip's story together, page by page — Pip has a big dream too, and needs small steps to reach it." },
                    { type: 'stage_direction', text: 'Turn the page once everyone has looked at the pictures.' }
                ]},
                { step: 4, stage: 'Explore', title: 'Think and Talk circle', lines: [
                    { type: 'teacher_says', text: 'First question: what is something you really want to do this year? Call it out!' },
                    { type: 'expected_answers', text: 'Learn to swim! / Get better at maths! / Make a new friend!' },
                    { type: 'teacher_says', text: 'Who inspires you, and why? Call out the name and the reason.' },
                    { type: 'expected_answers', text: 'My mom, because she works hard! / MS Dhoni, because he stays calm!' },
                    { type: 'teacher_says', text: 'What challenge might stop you, and how can you overcome it?' },
                    { type: 'expected_answers', text: 'I forget my homework — I can use a checklist. / I feel shy — I can practice talking to one new person each week.' }
                ]},
                { step: 5, stage: 'Explore', title: 'Vision board', lines: [
                    { type: 'teacher_says', text: 'Dreams stay small if we keep them only in our heads. Today we make them visible with a vision board — four boxes: your goals, who inspires you, habits you want to build, and your dream job.' },
                    { type: 'roving_prompt', text: "What's one goal you said earlier? Write it or draw it in Box 1." },
                    { type: 'roving_prompt', text: 'Who inspires you? Draw a small face or write their name in Box 2.' },
                    { type: 'support_prompt', text: "Stuck? Let's look at Box 1 together — what's one thing you want to do this year? Just write that one word." }
                ]},
                { step: 6, stage: 'Explore', title: 'Wrap up', lines: [
                    { type: 'teacher_says', text: 'Pencils down. Hold up your vision board. You have taken your real dreams and put them on paper — that is the first step of any journey. Keep it somewhere you can see it.' }
                ]},
                { step: 7, stage: 'Practice', title: 'Grammar Spotlight: Simple Present Tense', lines: [
                    { type: 'teacher_says', text: "We use the Simple Present Tense for things we do every day, our habits, and what we want. 'I play football every Sunday. She reads storybooks at night.'" },
                    { type: 'expected_answers', text: 'I want... / We like... / She plays...' }
                ]},
                { step: 8, stage: 'Practice', title: 'Try It Together', lines: [
                    { type: 'teacher_says', text: "Let's practice. I give a subject, you complete it with a present-tense verb. Ready? 'She ___ books every night.'" },
                    { type: 'expected_answers', text: 'Reads!' },
                    { type: 'stage_direction', text: 'Repeat with a few more pairs: He plays, They want, We practice.' }
                ]},
                { step: 9, stage: 'Practice', title: 'Write your goals and steps', lines: [
                    { type: 'teacher_says', text: 'A goal without a plan is just a wish. Write a short-term goal (next 3 months) and 3 small steps. Then a long-term goal (5+ years) and 3 steps.' },
                    { type: 'roving_prompt', text: "Look at Box 1 on your vision board — pick one goal. Now list 3 steps. Step 1: what will you do tomorrow?" },
                    { type: 'support_prompt', text: "If you don't have a dream job yet, write 'find a career I love' — that's fine." }
                ]},
                { step: 10, stage: 'Practice', title: 'Quick check and close', lines: [
                    { type: 'teacher_says', text: "Quick check! Is 'She want to read' correct, or should it be 'She wants to read'?" },
                    { type: 'stage_direction', text: 'Show of hands — tap how many got it: Most / Some / Few.' }
                ]}
            ],
            session2Script: [
                { step: 1, stage: 'Create', title: 'Opening ritual and recap', lines: [
                    { type: 'teacher_says', text: 'Welcome back, explorers! Last session, you made a vision board with your goals, your inspirations, your habits, and your dream job. Today we take one more step: writing down your goals and the steps to reach them.' },
                    { type: 'stage_direction', text: 'Pause for student responses.' }
                ]},
                { step: 2, stage: 'Create', title: 'Goal starter', lines: [
                    { type: 'teacher_says', text: 'A goal without a plan is just a wish. Today we make a plan — a short-term goal and a long-term goal, each with 3 steps.' }
                ]},
                { step: 3, stage: 'Create', title: 'Teacher models a goal', lines: [
                    { type: 'teacher_says', text: 'Let me model mine: my short-term goal is to learn 10 new spelling words. My steps: 1. Practice 10 minutes every day. 2. Ask my teacher for help if I get stuck. 3. Check my progress every Friday.' },
                    { type: 'stage_direction', text: 'Write or speak slowly, pointing to each step as you go.' }
                ]},
                { step: 4, stage: 'Create', title: 'Write your goals', lines: [
                    { type: 'teacher_says', text: 'You have about 12 minutes to write your short-term goal with 3 steps, then your long-term goal with 3 steps. Ready? Begin!' },
                    { type: 'roving_prompt', text: "Look at Box 4 on your vision board — your dream job. That's your long-term goal. Write it." },
                    { type: 'support_prompt', text: "Stuck? Look at your vision board — Box 1. Pick one goal and start there." }
                ]},
                { step: 5, stage: 'Create', title: 'Check my goals', lines: [
                    { type: 'teacher_says', text: 'Pencils down. Look at what you wrote — a short-term goal with steps, a long-term dream with steps. That is a plan. That is powerful.' }
                ]},
                { step: 6, stage: 'Perform', title: 'Feedback frame', lines: [
                    { type: 'teacher_says', text: "You will share ONE goal with a partner. After they share, don't just say 'good job' — tell them one thing you learned and how it inspired you." },
                    { type: 'stage_direction', text: 'Write the frame on the board: Their goal: ___. How it inspired me: ___.' }
                ]},
                { step: 7, stage: 'Perform', title: 'Pair share', lines: [
                    { type: 'teacher_says', text: 'Partner A shares first — short-term or long-term, your choice. Partner B listens, then writes the goal and how it inspired them. Then switch. 3-4 minutes each.' },
                    { type: 'roving_prompt', text: 'Partner B, what did you hear? Write their goal exactly, then how it made you feel.' }
                ]},
                { step: 8, stage: 'Perform', title: "Explorer's Stage", lines: [
                    { type: 'teacher_says', text: "Who wants to share something they learned from a classmate's goal — not your own? Call it out!" },
                    { type: 'stage_direction', text: 'Pick 2-3 volunteers; class claps after each share.' }
                ]},
                { step: 9, stage: 'Perform', title: 'Close', lines: [
                    { type: 'teacher_says', text: 'Today you created a plan and performed by sharing it. That is how journeys begin — not alone, but together. Keep your goal sheet and take one small step today.' }
                ]}
            ]
        }
    },
    {
        id: 3,
        title: 'Who Am I?',
        quote: 'Discover the you inside you.',
        video: 'chapter-03.mp4',
        thinkTalk: [
            'What three words did the character use to describe themselves?',
            'Why is it important to know what makes you special?',
            'What is something only you can do?',
            "How is your story different from anyone else's?"
        ],
        comprehension: { question: 'What made the character feel proud of themselves?', answer: 'Being unique' },
        vocab: { meaning: 'the qualities that make someone special', word: 'Identity' },
        starter: 'Three words that describe me are...',
        storybook: [
            { character: null, text: 'On her next visit through the little wooden door, Aanya found Flame and Pip waiting beside a still, silver pool she had never noticed before.' },
            { character: 'flame', text: '"This is the Mirror Pool," Flame said. "It does not show your face. It shows the words that describe you."' },
            { character: 'aanya', text: 'Aanya knelt down and looked in. Instead of her reflection, she saw glowing words drifting across the water: curious, kind, brave, creative, funny. "Those are all me?" Aanya asked, surprised.' },
            { character: 'pip', text: '"Every one of them," Pip chirped, landing on her knee. "You are curious because you always ask questions. You are kind because you helped me practice flying. You are brave because you walked through a strange door into a whole new world."' },
            { character: null, text: 'Just then, a small creature made of twigs and leaves stepped out from behind a bush. It looked shy, keeping its face half hidden.' },
            { character: 'aanya', text: '"Oh," Aanya said gently. "Hello! I\'m Aanya. I love drawing, I ask a lot of questions, and my goal this year is to finish my very own storybook." The twig creature blinked. "I have never met a human before. My name is Sela."' },
            { character: null, text: '"It\'s nice to meet you, Sela," Aanya said. "What are you like?" Sela thought for a moment. "I am quiet, but I am also patient, and I know every path through this forest." "Quiet, patient, and clever," Flame said warmly. "Those are wonderful words." Sela\'s leaves rustled happily, as if she were smiling.' },
            { character: 'aanya', text: 'Aanya looked back at the Mirror Pool one last time before the sky began to dim. The glowing words were still there, swirling gently. "I like knowing what makes me, me," she said.' }
        ],
        create: {
            challenge: 'Write about who you are. What makes you, you?',
            bullets: ['What are three words that describe you?', 'What is your favourite thing about yourself?', 'What do you want people to know about you?', 'What makes you different from everyone else?'],
            starters: ['Three words that describe me are...', 'One thing that makes me special is...'],
            target: '5-6 sentences',
            hints: [
                'What do you do better than anyone you know?',
                'What would your best friend say about you?',
                'What is a talent you are proud of?',
                'What makes your smile show up?'
            ],
            modelText: [
                'My name is Riya, and I am kind and curious.',
                'Something unique about me is that I can whistle any song I hear.',
                'I love reading books and playing badminton after school.',
                'My classroom is colourful, and my best friend is helpful whenever I feel stuck.',
                'My goal this year is to read twenty books before summer.'
            ],
            modelNouns: ['kind', 'curious', 'unique', 'colourful', 'helpful']
        },
        practice: {
            sortTitle: 'Adjective Sort',
            sortZones: [
                {
                    id: 'person',
                    label: 'Describes a Person',
                    hint: 'Words that tell us what someone is like.',
                    words: ['curious', 'kind', 'brave', 'creative', 'funny', 'patient']
                },
                {
                    id: 'place-thing',
                    label: 'Describes a Place or Thing',
                    hint: 'Words that tell us what something looks or feels like.',
                    words: ['tall', 'bright', 'ancient', 'sparkling', 'silver', 'colourful']
                }
            ]
        },
        reflection: {
            grammarFocus: 'Adjectives',
            commonErrors: [
                'Putting the adjective after the noun ("girl kind" instead of "kind girl")',
                'Overusing weak adjectives like "good" or "nice" instead of specific words',
                'Forgetting to give a reason when describing themselves (just the word, no "because...")',
                'Confusing adjectives with nouns (e.g. calling "kindness" an adjective instead of "kind")',
                'Writing a self-introduction with only 2-3 sentences and no unique detail'
            ]
        },
        fixItZone: {
            questions: [
                { text: 'Do you know what an adjective is?', box: 'A' },
                { text: 'Can you name 3 adjectives that describe you?', box: 'B' },
                { text: 'Did you write 3 sentences using adjectives?', box: 'C' },
                { text: 'Did you write a self-introduction paragraph?', box: 'D', requiresCreate: true }
            ],
            boxes: {
                A: {
                    title: 'Box A: What is an Adjective?',
                    body: 'An adjective is a <strong>describing word</strong>. It tells us more about a noun (person, place, or thing).<br><br>girl → <strong>kind</strong> girl (what kind of girl?)<br>dog → <strong>fluffy</strong> dog<br>tree → <strong>tall</strong> tree<br>sky → <strong>blue</strong> sky<br><br>Remember: adjectives answer the question "What kind?" or "How many?"',
                    practice: [
                        { q: 'In "a fluffy dog," which word is the adjective?', a: '"Fluffy" — it describes what kind of dog.' },
                        { q: 'Is "run" an adjective?', a: 'No — that\'s an action word, not a describing word.' }
                    ]
                },
                B: {
                    title: 'Box B: Finding Adjectives That Describe You',
                    body: "Stuck? Ask yourself:<br><br>How do you treat your friends? — I am... (kind, helpful, loyal)<br>How do you act in class? — I am... (quiet, curious, hardworking)<br>What makes you laugh? — I am... (funny, silly, playful)<br>How do you feel when someone needs help? — I am... (caring, generous, supportive)<br><br><strong>Personality:</strong> kind, helpful, funny, honest, brave, friendly<br><strong>Feelings:</strong> happy, proud, excited, calm<br><strong>Abilities:</strong> smart, creative, fast, strong, good at drawing",
                    practice: [
                        { q: 'Which list would "proud" belong to — personality, feelings, or abilities?', a: 'Feelings — it describes how you feel.' }
                    ]
                },
                C: {
                    title: 'Box C: Writing Sentences with Adjectives',
                    body: 'Stuck on a sentence? Try these frames:<br><br>"I am a _____ person." → I am a kind person.<br>"My friend is _____." → My friend is helpful.<br>"My classroom is _____." → My classroom is colourful.<br><br>Remember: put the adjective <strong>BEFORE</strong> the noun.<br><strong>Correct:</strong> a fluffy dog, a kind girl<br><strong>Not correct:</strong> a dog fluffy, a girl kind',
                    practice: [
                        { q: 'Which is correct: "a girl kind" or "a kind girl"?', a: '"A kind girl" — the adjective goes before the noun.' }
                    ]
                },
                D: {
                    title: 'Box D: Writing Your Self-Introduction',
                    body: 'Can\'t start? Use: <em>"My name is ______. I am ______ and ______."</em><br><br>Forgot something unique? What is something only you do or have — a pet, a talent, a funny habit?<br>Forgot your hobbies? What do you love doing after school?<br>Forgot your goal? What do you want to learn or get better at this year?<br><br><strong>Example:</strong> "My name is Riya. I am kind and curious. Something unique about me is that I can whistle any song. I love reading books and playing badminton. My goal this year is to read 20 books."',
                    practice: []
                }
            },
            mistakes: [
                { mistake: 'Used only "good" or "nice" (too common)', fix: 'Try a stronger word: kind, friendly, caring, thoughtful.' },
                { mistake: 'Put the adjective after the noun ("girl kind")', fix: 'Put the adjective before the noun: "kind girl."' },
                { mistake: 'Forgot to write "why" in the 5-word table', fix: 'Add a reason: "Kind — because I share my lunch with friends."' },
                { mistake: 'Self-introduction is too short (2-3 sentences)', fix: 'Add one more: "I also like...", "My favourite thing to do is..."' }
            ]
        },
        prep: {
            lessonPlan: {
                objectives: [
                    'Describe themselves and others using adjectives',
                    'Choose five words that capture their own identity, with reasons',
                    'Write and share a short self-introduction paragraph'
                ],
                studentOutputs: {
                    session1: 'Three adjective sentences about self/friend/classroom + a 5-word self-portrait table',
                    session2: 'A self-introduction paragraph (name, unique detail, hobbies, a goal) + written feedback for a partner'
                },
                materials: ['Whiteboard or chart paper', 'Markers', 'Timer', 'Student workbooks', 'Pencils, erasers', 'Optional: small mirror'],
                differentiation: [
                    { level: 'Advanced', action: 'Can you add a second sentence explaining each of your 5 words?' },
                    { level: 'Struggling', action: 'Choose 3 words instead of 5. I will help you think of a reason.' },
                    { level: 'Very Shy', action: 'You can draw a symbol for each word instead of writing a full reason.' }
                ]
            },
            beforeClassChecklist: [
                'Materials ready (paper, pencils)',
                'Optional small mirror',
                'Timer ready',
                'Projector tested'
            ],
            session1Script: [
                { step: 1, stage: 'Explore', title: 'Settle and breathe', lines: [
                    { type: 'teacher_says', text: "Good morning, everyone! Today the spotlight turns to someone very important — someone unique in the whole world. That person is YOU. Close your eyes and think: 'I am special because...'" },
                    { type: 'stage_direction', text: 'Pause 5 seconds, then have students open their eyes.' }
                ]},
                { step: 2, stage: 'Explore', title: 'Watch the video', lines: [
                    { type: 'teacher_says', text: 'Keep that thought as you watch — this video is about discovering what makes you, you.' },
                    { type: 'stage_direction', text: 'Play the Chapter 3 video. Pause if a question comes up.' }
                ]},
                { step: 3, stage: 'Explore', title: 'Storybook read-along', lines: [
                    { type: 'teacher_says', text: "Let's read about Aanya's visit to the Mirror Pool, where she discovers the words that describe her — and meets a new friend, Sela." },
                    { type: 'stage_direction', text: 'Turn the page once everyone has looked at the pictures.' }
                ]},
                { step: 4, stage: 'Explore', title: 'Think and Talk circle', lines: [
                    { type: 'teacher_says', text: "First question: what are three qualities that make you special? Call out one quality at a time — let's fill the room with them!" },
                    { type: 'expected_answers', text: 'Kind! / Funny! / Hardworking! / Good listener!' },
                    { type: 'teacher_says', text: 'How do your friends or family describe you?' },
                    { type: 'expected_answers', text: 'My mom says I am helpful. / My friend says I am fun to play with.' },
                    { type: 'teacher_says', text: 'What is something you are really proud of?' },
                    { type: 'expected_answers', text: 'I learned to ride a bike. / I helped my friend who was sad.' }
                ]},
                { step: 5, stage: 'Explore', title: 'Describe yourself', lines: [
                    { type: 'teacher_says', text: "You just described yourselves with wonderful words — kind, brave, helpful, creative. These describing words have a name: adjectives. On your paper, write three sentences: 'I am ___. My friend is ___. My classroom is ___.'" },
                    { type: 'roving_prompt', text: "What's one word for how you feel in your classroom?" },
                    { type: 'support_prompt', text: "What's a word your friend would like to be called?" }
                ]},
                { step: 6, stage: 'Explore', title: 'Wrap up', lines: [
                    { type: 'teacher_says', text: 'Pencils down. Read your three sentences to yourself. This is who you are — today, right now. You can always grow and add more adjectives to your list.' }
                ]},
                { step: 7, stage: 'Practice', title: 'Grammar Spotlight: Adjectives', lines: [
                    { type: 'teacher_says', text: "An adjective is a word that describes a noun — it tells us what kind, how many, or which one. 'She is a kind girl. We saw a tall mountain.'" },
                    { type: 'expected_answers', text: 'Fluffy! / Tall! / Colourful!' }
                ]},
                { step: 8, stage: 'Practice', title: 'Try It Together', lines: [
                    { type: 'teacher_says', text: "Let's practice. I say a noun, you call out an adjective. Ready? 'Dog!'" },
                    { type: 'expected_answers', text: 'Fluffy! Brown! Friendly!' },
                    { type: 'stage_direction', text: "Repeat with 'Teacher' and 'Classroom'." }
                ]},
                { step: 9, stage: 'Practice', title: 'Describe yourself in 5 words', lines: [
                    { type: 'teacher_says', text: "Choose five words that describe you best, and for each one, write why. Look at the example: 'Creative — I love drawing and coming up with fun ideas.'" },
                    { type: 'roving_prompt', text: "What's one word from our earlier list — kind, brave, helpful? Write that as your first word, then say why." },
                    { type: 'support_prompt', text: "Spelling doesn't matter. Sound it out. The idea is what counts." }
                ]},
                { step: 10, stage: 'Practice', title: 'Quick check and close', lines: [
                    { type: 'teacher_says', text: "Quick check! In 'a kind girl,' which word is the adjective?" },
                    { type: 'stage_direction', text: 'Show of hands — tap how many got it: Most / Some / Few.' }
                ]}
            ],
            session2Script: [
                { step: 1, stage: 'Create', title: 'Opening ritual and recap', lines: [
                    { type: 'teacher_says', text: 'Welcome back! Last session, you found words that describe you — kind, creative, helpful, curious, brave — and built a 5-word table. Today we turn those words into a self-introduction.' },
                    { type: 'stage_direction', text: 'Pause for student responses.' }
                ]},
                { step: 2, stage: 'Create', title: 'Self-introduction starter', lines: [
                    { type: 'teacher_says', text: 'Your self-introduction has four parts: your name, something unique about you, your hobbies, and one goal for this year.' },
                    { type: 'stage_direction', text: 'Write the four parts on the board.' }
                ]},
                { step: 3, stage: 'Create', title: 'Teacher models a self-introduction', lines: [
                    { type: 'teacher_says', text: "Listen to my example: 'My name is Mr. Sharma. Something unique about me is I can solve a Rubik's cube in under two minutes. My hobbies are reading mystery novels and playing chess. My goal this year is to learn guitar.'" },
                    { type: 'stage_direction', text: 'Point to each part as you say it.' }
                ]},
                { step: 4, stage: 'Create', title: 'Write your self-introduction', lines: [
                    { type: 'teacher_says', text: 'You have about 15 minutes to write your self-introduction. Ready? Begin!' },
                    { type: 'roving_prompt', text: "Look at your 5-word table — pick one word. What's a story that shows that quality?" },
                    { type: 'support_prompt', text: "Not sure what's unique? Ask yourself: what's one thing only you do in your family?" }
                ]},
                { step: 5, stage: 'Create', title: 'Check my self-introduction', lines: [
                    { type: 'teacher_says', text: 'Pencils down. Read your whole paragraph to yourself. Does it sound like you? If not, change a word.' }
                ]},
                { step: 6, stage: 'Perform', title: 'Feedback frame', lines: [
                    { type: 'teacher_says', text: "You will read your self-introduction to a partner. This is real listening — write one interesting thing you learned about them, not just 'good job.'" },
                    { type: 'stage_direction', text: 'Write the frame on the board: Something interesting about my partner: ___.' }
                ]},
                { step: 7, stage: 'Perform', title: 'Pair share', lines: [
                    { type: 'teacher_says', text: 'Partner A reads first, clearly. Partner B listens — no writing yet. Then Partner B writes what they learned. Switch. About 3-4 minutes each.' },
                    { type: 'roving_prompt', text: 'Partner B, what did you hear that was new or surprising? Write that down.' }
                ]},
                { step: 8, stage: 'Perform', title: "Explorer's Stage", lines: [
                    { type: 'teacher_says', text: 'Who wants to share one interesting thing they learned about their partner? Not the name — just the interesting thing!' },
                    { type: 'stage_direction', text: 'Pick 2-3 volunteers; class claps after each share.' }
                ]},
                { step: 9, stage: 'Perform', title: 'Close', lines: [
                    { type: 'teacher_says', text: 'Today you created a self-introduction and performed by sharing it. You let someone see you — that is brave and beautiful. Keep it, and add to it as you grow.' }
                ]}
            ]
        }
    },
    {
        id: 4,
        title: 'Friends & Feelings',
        quote: 'Good friends make good stories.',
        video: 'chapter-04.mp4',
        thinkTalk: [
            'How did the characters help each other in the video?',
            'What feeling did you notice change during the story?',
            'What would you do if your friend felt sad?',
            'Why do you think feelings are important to share?'
        ],
        comprehension: { question: 'How did the friend feel after receiving help?', answer: 'Grateful' },
        vocab: { meaning: 'a strong feeling of caring for someone', word: 'Friendship' },
        starter: 'My best friend always...',
        storybook: [
            { character: null, text: 'When Aanya stepped through the little wooden door again, she found Sela sitting alone under a willow tree, hugging her knees. "What\'s wrong?" Aanya asked, sitting beside her.' },
            { character: null, text: '"Tomorrow is the Lantern Festival," Sela said quietly. "Everyone performs a little dance for the village. I feel nervous. What if they laugh at me?"' },
            { character: 'flame', text: 'Flame landed nearby, folding his wings. "Nervous is normal before something new. I felt nervous before my very first flight too." "Really?" Sela asked, looking up at him. "Really," Flame said. "But I practiced with my friends, and by the time the day came, I felt proud instead."' },
            { character: 'pip', text: 'Pip fluttered down onto Sela\'s shoulder. "We can help you practice! I\'ll be your audience. Aanya and Flame can cheer too." Sela managed a small smile. "You would do that for me?"' },
            { character: 'aanya', text: '"Of course," Aanya said. "That\'s what friends are for. They help each other, even when it feels hard."' },
            { character: null, text: 'So Sela stood up, and the three friends formed a circle around her. She twirled slowly at first, then faster, her leaves rustling like tiny bells. Pip chirped a happy tune, Flame tapped his tail like a drum, and Aanya clapped along.' },
            { character: null, text: 'By the third try, Sela was laughing, twirling with her arms wide open. "I feel excited now, not nervous!" she said. "See?" Flame said warmly. "You did it."' },
            { character: 'aanya', text: 'That evening, before Aanya returned home, she wrote a short poem and read it aloud to Sela: "A friend is someone who stays by your side, they cheer you on and calm your worried mind. When you feel small, they make you feel tall, together, my friend, we can do it all." Sela hugged her tightly. "Thank you, Aanya. I feel ready now."' }
        ],
        create: {
            challenge: 'Write about a time a friend made you feel better, or a time you helped a friend.',
            bullets: ['Who is the friend in your story?', 'What happened?', 'How did it make you feel?', 'What did you learn about friendship?'],
            starters: ['My best friend always...', 'One day, my friend and I...'],
            target: '5-6 sentences',
            hints: [
                "What does a good friend do when you're upset?",
                'How did you show you cared?',
                'What made you both laugh?',
                'What would you thank your friend for?'
            ],
            modelText: [
                'A friend is someone who stays by your side.',
                'They cheer you on and calm your worried mind.',
                'When you feel small, they make you feel tall.',
                'Riya is my best friend, and she always listens when I feel nervous.',
                'My friends are kind, and they help me feel brave again.'
            ],
            modelNouns: ['they', 'she', 'them', 'he']
        },
        practice: {
            sortTitle: 'Pronoun Sort',
            sortZones: [
                {
                    id: 'one-person',
                    label: 'One Person',
                    hint: 'Use he, she, or it for a single person, animal, or thing.',
                    words: ['he', 'she', 'it', 'him', 'her']
                },
                {
                    id: 'many-people',
                    label: 'Many People / Me & You',
                    hint: 'Use they, we, or you for groups.',
                    words: ['they', 'we', 'you', 'them', 'us']
                }
            ]
        },
        reflection: {
            grammarFocus: 'Pronouns (he, she, they, it)',
            commonErrors: [
                'Using both the noun and pronoun together ("My friend she is kind" instead of "She is kind")',
                'Mixing up "he" and "she"',
                'Using "they" for a single person instead of "he" or "she"',
                'Using "it" for a person instead of "he" or "she"',
                'Confusing "excited" (future fun) with "happy" (feeling good now) when describing feelings'
            ]
        },
        fixItZone: {
            questions: [
                { text: 'Do you know what a pronoun is?', box: 'A' },
                { text: 'Can you use "he," "she," and "they" correctly?', box: 'B' },
                { text: 'Can you name different feelings (happy, nervous, excited, tired, proud)?', box: 'C' },
                { text: 'Did you write a friendship poem?', box: 'D', requiresCreate: true }
            ],
            boxes: {
                A: {
                    title: 'Box A: What is a Pronoun?',
                    body: 'A pronoun is a word that takes the place of a noun. Instead of repeating a name again and again, we use a pronoun.<br><br>"Riya is my friend. Riya is kind." → "Riya is my friend. <strong>She</strong> is kind."<br>"My brother plays cricket. My brother is fast." → "My brother plays cricket. <strong>He</strong> is fast."<br>"The books are on the desk. The books are new." → "The books are on the desk. <strong>They</strong> are new."<br><br>Pronouns we learned: I, you, he, she, it, we, they, me, him, her, us, them.',
                    practice: [
                        { q: 'Which pronoun replaces "Riya" in "Riya is kind"?', a: '"She" — Riya is kind becomes She is kind.' }
                    ]
                },
                B: {
                    title: 'Box B: Using He, She, They Correctly',
                    body: '<strong>He</strong> — for a boy or man. "Raj is my friend. He plays football."<br><strong>She</strong> — for a girl or woman. "Meera is my sister. She helps me."<br><strong>They</strong> — for more than one person or a group. "My parents are kind. They love me."<br><strong>It</strong> — for an animal or thing. "Look at the dog. It is fluffy."<br><br>Not sure? Use the name again — that\'s okay!',
                    practice: [
                        { q: 'Which pronoun fits: "Look at the dog. ___ is fluffy."', a: '"It" — the dog is a thing/animal, not a person.' }
                    ]
                },
                C: {
                    title: 'Box C: Understanding Feelings',
                    body: '<strong>Happy</strong> — when something good happens now. "My friend gave me a gift. I feel happy."<br><strong>Nervous</strong> — before something important. "I have a test tomorrow. I feel nervous."<br><strong>Excited</strong> — waiting for something fun. "It\'s my birthday tomorrow! I feel excited."<br><strong>Tired</strong> — after lots of activity. "I ran a race. Now I feel tired."<br><strong>Proud</strong> — when you achieve something. "I finished my project. I feel proud."<br><br>Remember: excited is for future fun, happy is for now.',
                    practice: [
                        { q: 'Is "excited" about now or about the future?', a: 'The future — it\'s the feeling of waiting for something fun.' }
                    ]
                },
                D: {
                    title: 'Box D: Writing Your Friendship Poem',
                    body: 'Stuck on your poem? Try these line starters:<br><br>Line 1: "A friend is someone who..." → "A friend is someone who listens to me."<br>Line 2: "They make me feel..." → "They make me feel safe and happy."<br>Line 3: "When I am sad, they..." → "When I am sad, they sit with me."<br>Line 4: "That\'s why..." → "That\'s why I am grateful for my friend."<br><br>Your poem does NOT need to rhyme. Just write from your heart.',
                    practice: []
                }
            },
            mistakes: [
                { mistake: 'Said "My friend she is kind" (both noun and pronoun)', fix: 'Use only the pronoun: "She is kind."' },
                { mistake: 'Used "he" for a girl or "she" for a boy', fix: 'Check: boy = he, girl = she.' },
                { mistake: 'Used "they" for one person', fix: 'For one person, use he or she.' },
                { mistake: 'Confused "excited" and "happy"', fix: 'Excited = waiting for future fun. Happy = feeling good now.' }
            ]
        },
        prep: {
            lessonPlan: {
                objectives: [
                    'Use pronouns (he, she, they, it) to talk about others without repeating names',
                    'Identify and name a range of feelings in different situations',
                    'Write a short friendship poem and express feelings through role play'
                ],
                studentOutputs: {
                    session1: 'Three pronoun sentences about a friend or family member + a feelings-matching activity',
                    session2: 'A 4-line friendship poem + a feelings role play with a partner'
                },
                materials: ['Whiteboard or chart paper', 'Markers', 'Timer', 'Student workbooks', 'Pencils', 'Optional: printed feeling words list'],
                differentiation: [
                    { level: 'Advanced', action: 'Can your poem rhyme? Can you add a 5th line?' },
                    { level: 'Struggling', action: 'Write 2 lines instead of 4, or use the given starter for all 4 lines.' },
                    { level: 'Very Shy', action: 'You can act your feeling without words — just face and hands.' }
                ]
            },
            beforeClassChecklist: [
                'Materials ready (paper, pencils)',
                'Optional printed feeling words',
                'Timer ready',
                'Projector tested'
            ],
            session1Script: [
                { step: 1, stage: 'Explore', title: 'Settle and breathe', lines: [
                    { type: 'teacher_says', text: "Good morning, everyone! Today we talk about something that makes everything better — friends and feelings. Raise your hand if you've ever felt happy because someone was kind to you." },
                    { type: 'stage_direction', text: 'Pause for hands, then bring the group back gently.' }
                ]},
                { step: 2, stage: 'Explore', title: 'Watch the video', lines: [
                    { type: 'teacher_says', text: 'Keep that feeling in mind as you watch — this video is about friendship and helping each other.' },
                    { type: 'stage_direction', text: 'Play the Chapter 4 video. Pause if a question comes up.' }
                ]},
                { step: 3, stage: 'Explore', title: 'Storybook read-along', lines: [
                    { type: 'teacher_says', text: "Let's read about Sela's big day — she feels nervous about the Lantern Festival, and her friends help her feel brave." },
                    { type: 'stage_direction', text: 'Turn the page once everyone has looked at the pictures.' }
                ]},
                { step: 4, stage: 'Explore', title: 'Think and Talk circle', lines: [
                    { type: 'teacher_says', text: "First question: who is your best friend? You don't have to say a name — 'my cousin' or 'my classmate' is fine. Turn to your partner and tell them." },
                    { type: 'expected_answers', text: 'My brother. / My friend from football. / My cousin.' },
                    { type: 'teacher_says', text: 'What makes a friend special?' },
                    { type: 'expected_answers', text: "They share their snacks. / They help me when I'm sad. / They don't laugh when I make mistakes." },
                    { type: 'teacher_says', text: 'What do you do when a friend feels sad?' },
                    { type: 'expected_answers', text: 'I give them a hug. / I listen to them. / I sit with them.' }
                ]},
                { step: 5, stage: 'Explore', title: 'Describe your friend', lines: [
                    { type: 'teacher_says', text: "When we repeat a name again and again, it can sound strange — 'Riya is my friend. Riya helps me.' Today we learn a shortcut: pronouns. On your paper, write three sentences about a friend or family member using he, she, or they." },
                    { type: 'roving_prompt', text: "Pick one friend or family member. What do they do? Write one sentence using 'he' or 'she.'" },
                    { type: 'support_prompt', text: "If you're writing about more than one person, use 'they.'" }
                ]},
                { step: 6, stage: 'Explore', title: 'Wrap up', lines: [
                    { type: 'teacher_says', text: 'Pencils down. Read your sentences — did you use a pronoun? Circle it. Great work noticing how we talk about the people we care about.' }
                ]},
                { step: 7, stage: 'Practice', title: 'Grammar Spotlight: Pronouns', lines: [
                    { type: 'teacher_says', text: "A pronoun is a word we use instead of a noun — he, she, it, they, we, you. 'Riya is kind. She helps me a lot.'" },
                    { type: 'expected_answers', text: 'She! / He! / They!' }
                ]},
                { step: 8, stage: 'Practice', title: 'Try It Together', lines: [
                    { type: 'teacher_says', text: "Let's practice. I say a noun, you say the pronoun. Ready? 'Sunita!'" },
                    { type: 'expected_answers', text: 'She!' },
                    { type: 'stage_direction', text: "Repeat with 'My father' (He), 'The pencils' (They), 'My friends and I' (We)." }
                ]},
                { step: 9, stage: 'Practice', title: 'How do you feel? Matching', lines: [
                    { type: 'teacher_says', text: "Match the feeling word to the situation: happy, nervous, excited, tired, proud. 'I finished my project and showed it to the class. I feel ___.'" },
                    { type: 'roving_prompt', text: 'A test tomorrow — do you feel nervous or proud? Which fits?' },
                    { type: 'support_prompt', text: "Birthday tomorrow — that's exciting, right?" }
                ]},
                { step: 10, stage: 'Practice', title: 'Quick check and close', lines: [
                    { type: 'teacher_says', text: "Quick check! 'My friend she is kind' — is that correct, or should we just say 'She is kind'?" },
                    { type: 'stage_direction', text: 'Show of hands — tap how many got it: Most / Some / Few.' }
                ]}
            ],
            session2Script: [
                { step: 1, stage: 'Create', title: 'Opening ritual and recap', lines: [
                    { type: 'teacher_says', text: 'Welcome back! Last session we talked about what makes a friend special, learned pronouns — he, she, they — and matched feelings like happy, nervous, excited, tired, proud. Today we turn those feelings into a poem.' },
                    { type: 'stage_direction', text: 'Pause for student responses.' }
                ]},
                { step: 2, stage: 'Create', title: 'Poem starter', lines: [
                    { type: 'teacher_says', text: "Your poem will have four lines, about a friend or a feeling. If you want a starter: 'A friend is someone who helps me grow, they smile with me when I feel low...' Add two more lines of your own." }
                ]},
                { step: 3, stage: 'Create', title: 'Teacher models a poem', lines: [
                    { type: 'teacher_says', text: "It does NOT have to rhyme. It can be as simple as: 'My friend helps me. I feel happy when we play. We share our food. I am grateful for my friend.' That's four lines — perfect." },
                    { type: 'stage_direction', text: 'Write or speak slowly, pointing to each line.' }
                ]},
                { step: 4, stage: 'Create', title: 'Write your poem', lines: [
                    { type: 'teacher_says', text: 'You have about 15 minutes to write your friendship poem. Ready? Begin!' },
                    { type: 'roving_prompt', text: "What's one word that describes your best friend? Write a line about that." },
                    { type: 'support_prompt', text: 'Look at the feeling words from last time — happy, nervous, excited, tired, proud. Pick one and write a line.' }
                ]},
                { step: 5, stage: 'Create', title: 'Check my poem', lines: [
                    { type: 'teacher_says', text: "Pencils down. Read your poem to yourself. Does it sound like you? Add a title if you'd like — 'My Friend' or 'Together.'" }
                ]},
                { step: 6, stage: 'Perform', title: 'Role-play setup', lines: [
                    { type: 'teacher_says', text: "Today's Perform is different — we act with our bodies and voices. Choose a feeling with your partner: happy, sad, surprised, nervous, excited, proud, tired." },
                    { type: 'stage_direction', text: 'Write the two questions on the board: What feeling did your partner show? What did they do well?' }
                ]},
                { step: 7, stage: 'Perform', title: 'Pair role-play', lines: [
                    { type: 'teacher_says', text: 'Partner A acts out the feeling for about 2 minutes. Partner B watches, then writes the feeling and what their partner did well. Then switch.' },
                    { type: 'roving_prompt', text: 'Partner B, watch carefully — what feeling are they showing? Write it down.' }
                ]},
                { step: 8, stage: 'Perform', title: "Explorer's Stage", lines: [
                    { type: 'teacher_says', text: 'Who wants to share one thing their partner did well? Call it out — no names, just the action!' },
                    { type: 'stage_direction', text: 'Pick 2-3 volunteers to perform for the whole class; class claps after each share.' }
                ]},
                { step: 9, stage: 'Perform', title: 'Close', lines: [
                    { type: 'teacher_says', text: 'Today you created a friendship poem and performed feelings with your body. That is the heart of friendship — noticing, caring, and celebrating each other. Keep your poem safe.' }
                ]}
            ]
        }
    },
    {
        id: 5,
        title: 'Home Sweet Home',
        quote: "There's no place like home.",
        video: 'chapter-05.mp4',
        thinkTalk: [
            'What did the character love most about their home?',
            'How is the home in the video similar to yours?',
            'What makes a house feel like a real home?',
            'Which room in your home is your favourite, and why?'
        ],
        comprehension: { question: 'What made the house feel like a home, not just a building?', answer: 'The people inside it' },
        vocab: { meaning: 'a warm, comfortable feeling of belonging', word: 'Cosy' },
        starter: 'My favourite corner of my home is...',
        storybook: [
            { character: null, text: 'The next time Aanya opened the little wooden door, Sela was waiting with an excited smile. "Come see my home today!" she said, tugging Aanya\'s sleeve.' },
            { character: null, text: 'They walked together until they reached a huge, hollow oak tree with a round door carved into its trunk. Sela pushed it open proudly. "Welcome," she said. "Let me give you a tour."' },
            { character: null, text: 'Inside, warm lantern light glowed softly. A woven hammock hung between two branches, swaying gently. "That is my bed," Sela said. "It hangs between the branches, so I sleep in the air." Aanya laughed with delight. "I\'ve never seen a bed like that!"' },
            { character: null, text: 'Sela pointed to a small wooden shelf built into the tree trunk. "My favorite books sit on that shelf, right next to my window. I can watch the stars every night."' },
            { character: null, text: 'She led Aanya past a round table made from a tree stump. "My breakfast bowl is always on this table," Sela said, "and my boots stay under the table, so I never lose them."' },
            { character: 'flame', text: 'Flame\'s head poked through the doorway, too big to fit the rest of him inside. "Knock knock," he said, grinning. "Flame! Come see," Sela said. "My favorite treasure is hidden behind that curtain."' },
            { character: 'pip', text: 'She pulled back a leafy curtain to reveal a small glass jar full of glowing fireflies. "They light up my whole room at night," Sela explained. "I keep them behind the curtain so they stay safe." Pip landed on the table, chirping happily. "Your home is so cozy, Sela."' },
            { character: 'aanya', text: '"Thank you," Sela said, blushing. "I like it because everything has its own place, and every place feels like mine." Aanya smiled, looking around at the hammock, the shelf, the table, and the glowing jar. "I think that\'s what makes a home sweet," she said. "Knowing exactly where everything belongs."' }
        ],
        create: {
            challenge: 'Describe your home and what makes it special to you.',
            bullets: ['What does your home look like?', 'Who lives there with you?', 'What is your favourite room?', 'What sound or smell reminds you of home?'],
            starters: ['My favourite corner of my home is...', 'When I walk through my front door...'],
            target: '5-6 sentences',
            hints: [
                'What can you hear in your home in the evening?',
                'What is a family tradition at home?',
                'What object in your home means a lot to you?',
                'Who makes your home feel warm?'
            ],
            modelText: [
                'My favorite room is my bedroom.',
                'It has a blue bed and a wooden bookshelf.',
                'I keep my books on the shelf, next to my window.',
                'My schoolbag is under the table, and my lamp is next to my bed.',
                'I feel happy when I am in my room.'
            ],
            modelNouns: ['on', 'next to', 'under', 'in', 'behind']
        },
        practice: {
            sortTitle: 'Prepositions of Place Sort',
            sortZones: [
                {
                    id: 'touching',
                    label: 'Touching / Inside',
                    hint: 'on, in — the thing is resting on or inside something.',
                    words: ['on', 'in', 'on top of', 'inside']
                },
                {
                    id: 'around',
                    label: 'Around / Nearby',
                    hint: 'under, next to, behind — the thing is near, but not touching the top.',
                    words: ['under', 'next to', 'behind', 'beside']
                }
            ]
        },
        reflection: {
            grammarFocus: 'Prepositions of Place',
            commonErrors: [
                'Dropping "the" before the noun ("on table" instead of "on the table")',
                'Confusing "in" and "on" (e.g. "The cat is in the table" instead of "on the table")',
                'Confusing "under" and "behind" (position below vs. position at the back)',
                'Forgetting to use any preposition at all when describing where something is',
                'Describing an imaginary dream room instead of a real room for the Create paragraph'
            ]
        },
        fixItZone: {
            questions: [
                { text: 'Do you know what prepositions of place are?', box: 'A' },
                { text: 'Can you use "on," "under," "next to," "in," and "behind" correctly?', box: 'B' },
                { text: 'Did you draw and label your dream room?', box: 'C' },
                { text: 'Did you write a paragraph about your favorite room?', box: 'D', requiresCreate: true }
            ],
            boxes: {
                A: {
                    title: 'Box A: What are Prepositions of Place?',
                    body: 'Prepositions of place tell us WHERE something is — the position of a person, object, or animal.<br><br><strong>on</strong> — resting above, touching. "The book is on the table."<br><strong>under</strong> — below something. "The cat is under the bed."<br><strong>next to</strong> — beside. "The lamp is next to the sofa."<br><strong>in</strong> — inside something. "The shoes are in the box."<br><strong>behind</strong> — at the back. "The poster is behind the door."',
                    practice: [
                        { q: 'The shoes are ___ the box (inside it). Which word fits?', a: '"In" — the shoes are inside the box.' }
                    ]
                },
                B: {
                    title: 'Box B: Using Prepositions Correctly',
                    body: '<strong>"on" vs "in":</strong> On = on top of a surface. In = inside something.<br><strong>"next to" vs "behind":</strong> Next to = beside. Behind = at the back, not visible.<br><strong>"under" vs "below":</strong> Under = directly below. Below = lower than (both are okay).<br><br>Practice: "My pencil is ___ the desk" → on. "My eraser is ___ my pencil case" → in. "My chair is ___ the table" → next to. "My bag is ___ the door" → behind.',
                    practice: [
                        { q: 'Is "My eraser is ___ my pencil case" on or in?', a: '"In" — the eraser is inside the pencil case.' }
                    ]
                },
                C: {
                    title: 'Box C: Drawing and Labeling Your Dream Room',
                    body: "Can't draw well? Use simple shapes: square for bed, rectangle for table, circle for lamp.<br>Forgot an item? You need: bed, bookshelf, table, toys, and one special object.<br>Forgot to label? Write the word next to each item: \"bed (on the left).\"<br>Forgot to show position? Add words: \"bookshelf next to the window.\"<br><br>Even stick figures are perfect! Your drawing just needs to show where things are.",
                    practice: []
                },
                D: {
                    title: 'Box D: Writing About Your Favorite Room',
                    body: 'Stuck? Try these sentence starters:<br><br>1. "My favorite room is my ___."<br>2. "It has a ___ and a ___."<br>3. "I keep my ___ on/in/under the ___."<br>4. "My ___ is next to my ___."<br>5. "I feel ___ when I am in this room."<br><br><strong>Example:</strong> "My favorite room is my bedroom. It has a blue bed and a wooden bookshelf. I keep my books on the shelf. My schoolbag is under the table. My lamp is next to my bed. I feel happy when I am in my room."',
                    practice: []
                }
            },
            mistakes: [
                { mistake: 'Wrote "My book is on table" (missing "the")', fix: 'Add "the": "My book is on the table."' },
                { mistake: 'Wrote "The cat is in the table" (should be on)', fix: 'Think: is the cat inside the table? No — use "on" or "under."' },
                { mistake: 'Forgot to use any preposition', fix: 'Add one: "My bed is next to the window."' },
                { mistake: 'Described a dream room instead of a real room (for the paragraph)', fix: "That's okay to imagine, but try describing a real room you know." }
            ]
        }
    },
    {
        id: 6,
        title: 'A Day in My Life',
        quote: 'Small moments make a big life.',
        video: 'chapter-06.mp4',
        thinkTalk: [
            'What was the first thing the character did in their day?',
            'Which part of the day looked the most fun?',
            'How is your daily routine similar or different?',
            'What small moment made the day special?'
        ],
        comprehension: { question: 'What time of day did the story begin?', answer: 'Morning' },
        vocab: { meaning: 'the things you do every day in the same order', word: 'Routine' },
        starter: 'My day starts when...',
        storybook: [
            { character: 'pip', text: 'Pip landed on the fence with a pout. "I missed yesterday! I was stuck inside because of the rain. Tell me everything!" Aanya laughed and sat down beside Flame and Sela. "Let\'s take turns," she said. "I\'ll go first."' },
            { character: 'aanya', text: '"Yesterday, I woke up early and ate breakfast with my family," Aanya began. "Then I walked to school and read a whole chapter of my favorite book at lunch. In the evening, I watched the sunset from my window before I went to bed." Pip\'s eyes widened. "That sounds like a wonderful day!"' },
            { character: 'flame', text: 'Flame stretched his wings. "My turn. Yesterday, I flew to the mountains and played a game of chase with some clouds. I ate three baskets of berries for lunch, which is probably too many." Everyone laughed.' },
            { character: 'flame', text: '"Then," Flame continued, "I watched the stars come out one by one until I fell asleep on a warm rock."' },
            { character: null, text: 'Sela rustled her leaves happily. "I have a story too! Yesterday, I planted new flowers behind my treehouse. I went to the river and washed all my berry jars. Then my friends and I sang songs until the sky turned orange."' },
            { character: 'pip', text: '"You all had such busy days," Pip sighed. "I just watched the rain from my nest." "That still counts," Aanya said kindly. "You watched, you waited, and you dreamed about today. That\'s a story too."' },
            { character: 'pip', text: 'Pip perked up. "You\'re right! Yesterday, I watched raindrops race down my window, and I dreamed about flying with all of you again." "See?" Flame said warmly. "Everyone has a story, even a quiet one."' },
            { character: null, text: 'The four friends sat together as the sky turned pink, each one glad they had shared their day.' }
        ],
        create: {
            challenge: 'Write about a normal day in your life, from morning to night.',
            bullets: ['What is the first thing you do when you wake up?', 'What is your favourite part of the day?', 'Who do you spend your day with?', 'How does your day end?'],
            starters: ['My day starts when...', 'The best part of my day is...'],
            target: '5-6 sentences',
            hints: [
                'What sound wakes you up?',
                'What do you look forward to after school?',
                'What is the last thing you do before bed?',
                'What makes an ordinary day feel special?'
            ],
            modelText: [
                'Dear Diary, yesterday was a special day.',
                'First, I woke up at 7 a.m. and ate pancakes for breakfast.',
                'Then, I went to the park with my friend and we played football.',
                'I felt very happy when we won our game.',
                'Finally, I watched a cartoon and went to bed at 9 p.m.'
            ],
            modelNouns: ['woke', 'ate', 'went', 'played', 'felt', 'watched']
        },
        practice: {
            sortTitle: 'Past Tense Verb Sort',
            sortZones: [
                {
                    id: 'regular',
                    label: 'Regular (+ed)',
                    hint: 'Just add -ed to the base verb.',
                    words: ['played', 'watched', 'walked', 'cooked']
                },
                {
                    id: 'irregular',
                    label: 'Irregular (changes form)',
                    hint: 'The whole word changes — no -ed.',
                    words: ['went', 'ate', 'saw', 'woke']
                }
            ]
        },
        reflection: {
            grammarFocus: 'Simple Past Tense',
            commonErrors: [
                'Using present tense for yesterday ("I go to school yesterday" instead of "I went")',
                'Adding -ed to irregular verbs ("I eated," "I goed" instead of "ate," "went")',
                'Mixing past and present tense in the same sentence',
                'Forgetting sequence words (First, Then, After that, Finally) in the diary entry',
                'Writing a diary entry with only 1-2 sentences instead of the full 5-6'
            ]
        },
        fixItZone: {
            questions: [
                { text: 'Do you know what past tense means?', box: 'A' },
                { text: 'Can you change a present tense verb to past tense?', box: 'B' },
                { text: 'Did you draw 3 moments from yesterday and write captions?', box: 'C' },
                { text: 'Did you write a diary entry about yesterday?', box: 'D', requiresCreate: true }
            ],
            boxes: {
                A: {
                    title: 'Box A: What is Past Tense?',
                    body: 'Past tense tells us that something already happened — yesterday, last week, or any time before now.<br><br>"I eat breakfast" → "I <strong>ate</strong> breakfast."<br>"I go to school" → "I <strong>went</strong> to school."<br>"I play football" → "I <strong>played</strong> football."<br>"I see a bird" → "I <strong>saw</strong> a bird."<br><br>Remember: when you talk about yesterday, you MUST change the verb.',
                    practice: [
                        { q: 'How do you say "I eat breakfast" about yesterday?', a: '"I ate breakfast."' }
                    ]
                },
                B: {
                    title: 'Box B: How to Change Verbs to Past Tense',
                    body: '<strong>Regular verbs</strong> — add -ed: play → played, walk → walked, cook → cooked.<br><strong>Irregular verbs</strong> — change completely: go → went, eat → ate, see → saw, wake → woke.<br><br>Other common irregular verbs: read → read, sleep → slept, write → wrote, teach → taught, build → built, win → won.<br><br>Tip: make flashcards or a chant — "Go – went. Eat – ate. See – saw."',
                    practice: [
                        { q: 'What is the past tense of "see"?', a: '"Saw" — it changes completely, it\'s irregular.' },
                        { q: 'What is the past tense of "walk"?', a: '"Walked" — just add -ed, it\'s regular.' }
                    ]
                },
                C: {
                    title: 'Box C: Drawing Your Yesterday (3 Moments)',
                    body: "Can't remember yesterday? Think about: morning, afternoon, evening — what did you do?<br>Don't know what to draw? Draw what you ate, who you played with, what you watched.<br>Forgot captions? Write 1 sentence under each picture: \"I ate cereal.\"<br>Using present tense instead of past? Change it: \"I eat\" → \"I ate.\"",
                    practice: []
                },
                D: {
                    title: 'Box D: Writing Your Diary Entry',
                    body: 'Stuck? Try these starters:<br><br>Start: "Dear Diary, Yesterday was a special day."<br>First event: "First, I ___."<br>Next event: "Then, I ___."<br>Feeling: "I felt ___."<br>End of day: "Finally, I ___."<br><br>Tip: use sequence words — First, Then, After that, Finally.<br><br><strong>Example:</strong> "Dear Diary, Yesterday was a special day. First, I woke up at 7 a.m. Then, I ate pancakes for breakfast. After that, I went to the park with my friend. We played football. I felt very happy. Finally, I went to bed at 9 p.m."',
                    practice: []
                }
            },
            mistakes: [
                { mistake: 'Said "I go to school yesterday" (present tense)', fix: 'Change to past: "I went to school yesterday."' },
                { mistake: 'Said "I eated breakfast" (added -ed to an irregular verb)', fix: 'Use the correct irregular form: "I ate breakfast."' },
                { mistake: 'Mixed present and past in the same sentence', fix: 'Pick one tense — for yesterday, use past: "I woke up and ate breakfast."' },
                { mistake: 'Diary entry has only 2 sentences', fix: 'Add one more: what happened in the afternoon? How did you feel?' }
            ]
        }
    },
    {
        id: 7,
        title: "Let's Celebrate!",
        quote: 'Every celebration has a story to tell.',
        video: 'chapter-07.mp4',
        thinkTalk: [
            'What is your favourite festival or celebration?',
            'Who do you celebrate it with?',
            'What do you wear, eat, or enjoy most on that day?',
            'How did the characters in the story celebrate together?'
        ],
        comprehension: { question: 'How did the forest creatures ask to light the first lantern?', answer: 'Politely' },
        vocab: { meaning: 'a word that describes how an action happens', word: 'Adverb' },
        starter: 'My favourite festival is...',
        storybook: [
            { character: null, text: 'Once a year, Lumora glowed brighter than ever for the Festival of Fireflies, and this time, Aanya arrived just in time to join.' },
            { character: null, text: '"You made it!" Sela said, hugging her tightly. "Everyone arrived early today. Even Flame." "Of course," Flame said proudly. "I never miss the festival."' },
            { character: 'pip', text: 'Lanterns swayed gently above the meadow, and music drifted through the trees. Pip zipped around excitedly, weaving between dancers. "Come on!" Pip chirped. "The dancing already started!"' },
            { character: 'aanya', text: 'Aanya laughed and joined the circle, where everyone danced happily beneath the glowing lights. Flame spun slowly at first, then faster, his tail sweeping patterns in the grass.' },
            { character: null, text: 'When the music paused, tables filled with food appeared beneath the trees. Sela ate quickly, eager to taste every dish before the next dance began. "Slow down," Flame teased, chuckling. "I can\'t help it," Sela said, grinning. "The berry cakes are my favorite!"' },
            { character: null, text: 'Nearby, a small group of forest creatures spoke politely to an elder, asking permission to light the first lantern. The elder nodded, and one by one, hundreds of tiny lanterns rose gently into the sky, glowing softly like floating stars.' },
            { character: 'flame', text: '"It\'s beautiful," Aanya whispered. "Every year, it gets more magical," Flame said. "Because every year, we celebrate together."' },
            { character: 'aanya', text: 'Pip landed on Aanya\'s shoulder. "What is your favorite festival back home?" Aanya thought for a moment. "We celebrate a Festival of Lights too. My family lights lamps, shares sweets, and laughs loudly late into the night." "That sounds a lot like tonight," Sela said warmly.' }
        ],
        create: {
            challenge: 'Draw your favourite celebration moment, then describe it using adverbs.',
            bullets: ['What festival or special day are you celebrating?', 'How did you dance, play, or celebrate?', 'How did your family react?', 'What did you eat, and how?'],
            starters: ['This is a picture of me celebrating...', 'We danced happily and...'],
            target: '5-6 sentences',
            hints: [
                'How did you open your gifts — slowly or excitedly?',
                'How did everyone laugh or shout?',
                'How did someone dance on stage?',
                'How did the celebration end?'
            ],
            modelText: [
                'This is a picture of me celebrating Diwali.',
                'We danced happily and played with sparklers.',
                'My family smiled joyfully as we enjoyed the day.',
                'I quickly ate my favourite sweets.',
                'Everyone laughed loudly when the fireworks lit up the sky.'
            ],
            modelNouns: ['happily', 'joyfully', 'quickly', 'loudly']
        },
        practice: {
            sortTitle: 'Adverb Sort',
            sortZones: [
                {
                    id: 'happy',
                    label: 'Happy / Excited Actions',
                    hint: 'How do people move during a celebration?',
                    words: ['happily', 'joyfully', 'excitedly', 'cheerfully']
                },
                {
                    id: 'calm',
                    label: 'Calm / Careful Actions',
                    hint: 'How do people move during a quiet or careful moment?',
                    words: ['quietly', 'gently', 'politely', 'slowly']
                }
            ]
        },
        reflection: {
            grammarFocus: 'Adverbs of Manner',
            commonErrors: [
                'Using an adjective instead of an adverb ("danced happy" instead of "danced happily")',
                'Forgetting to add -ly ("quick" instead of "quickly")',
                'Using the same adverb for every sentence instead of varying it',
                'Using an adverb that doesn\'t match the action (e.g. "danced quietly" at a loud party)',
                'Not realizing some adverbs don\'t end in -ly (fast, early, hard)'
            ]
        },
        fixItZone: {
            questions: [
                { text: 'Do you know what an adverb is?', box: 'A' },
                { text: 'Can you change an adjective to an adverb (happy → happily)?', box: 'B' },
                { text: 'Did you use adverbs in your celebration timeline?', box: 'C' },
                { text: 'Did you write a paragraph about a celebration using adverbs?', box: 'D', requiresCreate: true }
            ],
            boxes: {
                A: {
                    title: 'Box A: What is an Adverb?',
                    body: 'An adverb describes a verb (an action). It tells us HOW something happens.<br><br>"She danced." → "She danced <strong>happily</strong>." (How did she dance?)<br>"He ate." → "He ate <strong>quickly</strong>." (How did he eat?)<br>"They spoke." → "They spoke <strong>politely</strong>." (How did they speak?)<br><br>Remember: adverbs often end with -ly, but not always (fast, early, late are also adverbs).',
                    practice: [
                        { q: 'In "He spoke politely," which word is the adverb?', a: '"Politely" — it tells us how he spoke.' }
                    ]
                },
                B: {
                    title: 'Box B: How to Change Adjectives to Adverbs',
                    body: '<strong>Add -ly:</strong> happy, quick, loud, quiet, proud → happily, quickly, loudly, quietly, proudly.<br><strong>Change y to i and add -ly:</strong> easy, heavy, lucky → easily, heavily, luckily.<br><strong>Same word (no change):</strong> fast, hard, early stay the same.<br><br>Practice: joyful → joyfully, excited → excitedly, nervous → nervously, graceful → gracefully, careful → carefully.',
                    practice: [
                        { q: 'What is the adverb form of "careful"?', a: '"Carefully" — add -ly.' },
                        { q: 'What is the adverb form of "happy"?', a: '"Happily" — change y to i and add -ly.' }
                    ]
                },
                C: {
                    title: 'Box C: Using Adverbs in Your Celebration Timeline',
                    body: 'Stuck? Try these:<br><br>For happy celebrations: happily, joyfully, excitedly, cheerfully.<br>For fast actions: quickly, rapidly, suddenly.<br>For quiet moments: quietly, softly, gently.<br>For proud moments: proudly, confidently.<br><br><strong>Example:</strong> 7:00 AM — I woke up excitedly because it was my birthday. 9:00 AM — I opened my gifts happily. 12:00 PM — We ate cake joyfully.',
                    practice: []
                },
                D: {
                    title: 'Box D: Writing Your Festival Snapshot Paragraph',
                    body: 'Stuck? Try these starters:<br><br>1. "This is a picture of me celebrating ___."<br>2. "We danced ___ and played ___."<br>3. "My family smiled ___ as we enjoyed the day."<br>4. "I ate my favourite food ___."<br>5. "Everyone laughed ___ when ___."<br><br>Tip: circle all the adverbs you used — did you use at least 3?',
                    practice: []
                }
            },
            mistakes: [
                { mistake: 'Used an adjective instead of an adverb ("danced happy")', fix: 'Change to adverb: "danced happily."' },
                { mistake: 'Forgot to add -ly ("quick" instead of "quickly")', fix: 'Add -ly: "quickly."' },
                { mistake: 'Used the same adverb for everything ("happily" for every sentence)', fix: 'Try different adverbs: joyfully, excitedly, proudly, loudly.' },
                { mistake: 'Wrote an adverb that doesn\'t match the action (e.g. "danced quietly" at a party)', fix: 'Ask: does the adverb match the action? At a party, dance "happily" or "loudly."' }
            ]
        }
    },
    {
        id: 8,
        title: 'Animal Planet',
        quote: 'Every creature has a story worth discovering.',
        video: 'chapter-08.mp4',
        thinkTalk: [
            'What is your favourite animal, and where does it live?',
            'What new animal did the friends discover in the story?',
            'Why does the Glimmerwing only show itself to gentle visitors?',
            'What fun fact do you know about an animal?'
        ],
        comprehension: { question: 'What kind of creature was hiding in the hollow trunk?', answer: 'A Glimmerwing' },
        vocab: { meaning: 'a small word placed before a noun — a, an, or the', word: 'Article' },
        starter: 'I saw an animal in the jungle...',
        storybook: [
            { character: 'pip', text: 'While exploring near the river, Pip suddenly stopped and pointed upward. "Look! There is something in that tree." Everyone looked up. Perched on a high branch sat an owl, watching them with enormous golden eyes.' },
            { character: 'aanya', text: '"It\'s an owl," Aanya whispered. "I have never seen one this close before." The owl tilted her head and spoke in a soft, wise voice. "You may come closer. I do not bite."' },
            { character: null, text: 'Sela stepped forward carefully. "Hello. What is your name?" "I am called Nima," the owl said. "I am the oldest owl in this forest."' },
            { character: 'flame', text: 'Flame bowed his head politely. "It is an honor to meet the oldest owl in Lumora." Nima chuckled softly. "You are kind, dragon. Tell me, what animal are you looking for today?"' },
            { character: 'pip', text: '"We are not looking for one animal," Pip chirped. "We just love exploring! Yesterday we saw a fox, and last week we found a family of rabbits near the meadow."' },
            { character: null, text: '"The forest is full of wonders," Nima said. "Would you like to see a secret nest? It belongs to a very rare bird." The friends nodded eagerly, and Nima led them deeper into the trees. At last, she stopped beside a hollow trunk. Inside sat a tiny, shimmering bird with feathers like stardust.' },
            { character: 'aanya', text: '"This is a Glimmerwing," Nima explained. "It is the only bird of its kind in the whole forest." Aanya gasped. "It\'s beautiful. I have never seen a bird like that." "The Glimmerwing only shows itself to gentle visitors," Nima said, smiling. "You must have kind hearts."' },
            { character: 'aanya', text: 'As the sun began to set, the friends thanked Nima and said goodbye to the little Glimmerwing. "Today," Aanya said happily, "I learned about an owl and a Glimmerwing, all in one afternoon." "That," said Flame, "is what makes Lumora so wonderful."' }
        ],
        create: {
            challenge: 'Write a short story about an animal you like — real or imaginary.',
            bullets: ['What animal did you see, and where?', 'What did it look like?', 'What name did you give it?', 'What did the animal like to do?'],
            starters: ['I saw an animal in the jungle...', 'It was a...'],
            target: '5-6 sentences',
            hints: [
                'Is your animal\'s name starting with a vowel or consonant sound?',
                'What is one fun fact about your animal?',
                'Where does your animal live?',
                'What does your animal eat?'
            ],
            modelText: [
                'I saw an animal in the jungle.',
                'It was a tiger.',
                'The tiger was very big and strong.',
                'I gave it a name — it was called Raja.',
                'The animal liked to play in the river.'
            ],
            modelNouns: ['an', 'a', 'the']
        },
        practice: {
            sortTitle: 'A / An Sort',
            sortZones: [
                {
                    id: 'a',
                    label: '"a" — consonant sound',
                    hint: 'The word starts with a consonant SOUND.',
                    words: ['tiger', 'dog', 'monkey', 'lion']
                },
                {
                    id: 'an',
                    label: '"an" — vowel sound',
                    hint: 'The word starts with a vowel SOUND (a, e, i, o, u).',
                    words: ['elephant', 'owl', 'iguana', 'apple']
                }
            ]
        },
        reflection: {
            grammarFocus: 'Articles (a, an, the)',
            commonErrors: [
                'Using "a" before a vowel sound ("a elephant" instead of "an elephant")',
                'Using "an" before a consonant sound ("an dog" instead of "a dog")',
                'Forgetting the article entirely ("I saw tiger" instead of "I saw a tiger")',
                'Using "a/an" for something specific instead of "the" ("I saw a sun" instead of "the sun")',
                'Choosing the article by the letter instead of the sound (e.g. "a university" is correct because it sounds like "yoo")'
            ]
        },
        fixItZone: {
            questions: [
                { text: 'Do you know what articles are (a, an, the)?', box: 'A' },
                { text: 'Can you choose between "a" and "an" correctly?', box: 'B' },
                { text: 'Can you choose when to use "the"?', box: 'C' },
                { text: 'Did you write a sentence using a, an, or the?', box: 'D', requiresCreate: true }
            ],
            boxes: {
                A: {
                    title: 'Box A: What are Articles?',
                    body: 'Articles are small words that come before a noun. They tell us if we are talking about any thing (a/an) or a specific thing (the).<br><br><strong>a</strong> — before a consonant sound: a tiger, a monkey, a cat, a dog.<br><strong>an</strong> — before a vowel sound (a, e, i, o, u): an elephant, an owl, an iguana, an apple.<br><strong>the</strong> — before one particular, specific thing: the moon, the sun, the tiger in the zoo.<br><br>Remember: it\'s about the SOUND, not just the letter.',
                    practice: [
                        { q: 'Is "an hour" correct, even though "hour" starts with the letter h?', a: 'Yes — the "h" is silent, so it sounds like it starts with a vowel.' }
                    ]
                },
                B: {
                    title: 'Box B: A vs An — Which One?',
                    body: 'If the word starts with a consonant SOUND → use <strong>a</strong>: a cat, a dog, a tiger, a monkey, a lion.<br>If the word starts with a vowel SOUND → use <strong>an</strong>: an elephant, an owl, an iguana, an apple, an orange.<br><br><strong>Special cases</strong> — listen to the sound, not the letter:<br>"university" sounds like "yoo-niversity" (consonant sound) → <strong>a</strong> university.<br>"umbrella" sounds like "uh-mbrella" (vowel sound) → <strong>an</strong> umbrella.<br>"hour" has a silent h (vowel sound) → <strong>an</strong> hour.',
                    practice: [
                        { q: 'Which article fits "___ owl"?', a: '"An" — owl starts with a vowel sound.' },
                        { q: 'Which article fits "___ unicorn"?', a: '"A" — unicorn sounds like it starts with "yoo", a consonant sound.' }
                    ]
                },
                C: {
                    title: 'Box C: When to Use "The"',
                    body: 'Use "the" when:<br><br>There is only one of something: the sun, the moon, the Earth, the sky.<br>You are talking about a specific thing: the tiger in the zoo (not any tiger).<br>You have already mentioned it: "I saw a dog. The dog was barking."<br><br><strong>Not specific (a/an):</strong> "I saw a tiger." (any tiger)<br><strong>Specific (the):</strong> "The tiger was sleeping." (that specific tiger)',
                    practice: [
                        { q: 'Why do we say "the sun" and not "a sun"?', a: 'Because there is only one sun — it\'s specific.' }
                    ]
                },
                D: {
                    title: 'Box D: Writing Your Animal Discovery Poster and Story',
                    body: "Can't think of an animal? Choose: tiger, elephant, dog, cat, dolphin, peacock, lion, monkey.<br>Don't know a fun fact? Ask: how fast can it run? How big is it? What is special about it?<br>Forgot to use an article? Add \"a\" or \"an\" before your animal: \"A tiger is a powerful animal.\"<br>Article sentence wrong? Check: does your animal start with a vowel sound? If yes, use \"an.\"<br><br><strong>Example:</strong> \"I saw an animal in the jungle. It was a tiger. The tiger was very big and strong. I gave it a name — it was called Raja. The animal liked to play in the river.\"",
                    practice: []
                }
            },
            mistakes: [
                { mistake: 'Said "a elephant" (should be "an elephant")', fix: 'Elephant starts with a vowel sound → "an elephant."' },
                { mistake: 'Said "an dog" (should be "a dog")', fix: 'Dog starts with a consonant sound → "a dog."' },
                { mistake: 'Said "I saw tiger" (missing article)', fix: 'Add "a" or "an": "I saw a tiger."' },
                { mistake: 'Used "a" for a specific thing ("I saw a sun")', fix: 'There is only one sun → use "the sun."' }
            ]
        }
    },
    {
        id: 9,
        title: 'Time Travellers',
        quote: 'The past shapes us, but today is where we grow.',
        video: 'chapter-09.mp4',
        thinkTalk: [
            'What did the Clock Tree show the friends about old Lumora?',
            'How is Lumora different now compared to the past?',
            'What is something you used to do that you don\'t do anymore?',
            'What is something you do now that you didn\'t do before?'
        ],
        comprehension: { question: 'Who was the young owl standing beside an old, wise dragon in the vision?', answer: 'Nima' },
        vocab: { meaning: 'the form of a verb that shows something already happened', word: 'Past tense' },
        starter: 'One day, I found a strange machine in my backyard...',
        storybook: [
            { character: null, text: 'Deep in the forest, Nima led the friends to an enormous, ancient tree with a hollow trunk shaped like a clock. "This is the Clock Tree," Nima said. "Long ago, it showed travelers glimpses of the past."' },
            { character: 'aanya', text: '"Does it still work?" Aanya asked, her eyes wide. "Let\'s find out," Flame said, stepping closer.' },
            { character: null, text: 'Sela touched the bark gently, and the hollow trunk began to glow. Suddenly, the scene inside shimmered, and they saw a much younger Lumora: smaller trees, a simple wooden bridge, and just a handful of tiny huts.' },
            { character: 'pip', text: '"Look," Pip chirped. "Lumora looked so different then." "Back then, only a few creatures lived here," Nima explained. "Now, hundreds of us call it home."' },
            { character: 'aanya', text: 'The image shifted again, showing Nima as a young owl, perched beside an old, wise dragon. "Is that you?" Aanya asked, amazed. "It is," Nima said softly. "That was my grandfather. He taught me everything I know today."' },
            { character: 'flame', text: 'Flame stepped closer to the glowing trunk. "My family used to live near the mountains. Now we live closer to the river." "Everything changes," Sela said thoughtfully. "Yesterday, this forest had fewer flowers. Today, it blooms everywhere."' },
            { character: 'aanya', text: 'The glow faded slowly, and the ordinary forest returned around them. "That was incredible," Aanya whispered. "I saw the past, but I still live in the present." "Exactly," Nima said, smiling. "The past shapes us, but today is where we grow."' },
            { character: 'pip', text: 'Pip landed on Aanya\'s shoulder. "What do you think Lumora will look like in the future?" Aanya smiled. "I don\'t know yet. But I can\'t wait to find out."' }
        ],
        create: {
            challenge: 'Imagine you stepped into a time machine — write a short story about your trip to the past.',
            bullets: ['Where did you find the time machine?', 'What year did it take you to?', 'What did you see there?', 'How did you get back?'],
            starters: ['One day, I found a strange machine in my backyard...', 'It took me back to the year...'],
            target: '5-6 sentences',
            hints: [
                'What did people do differently back then?',
                'What sounds or sights surprised you?',
                'Who did you meet in the past?',
                'What did you feel when you returned home?'
            ],
            modelText: [
                'One day, I found a strange machine in my backyard.',
                'It took me back to the year 1985.',
                'I looked around and saw kids playing outside with no phones.',
                'They played hopscotch on the pavement, and I saw a small TV with only two channels.',
                'I felt happy and also surprised, then I pressed the red button and returned home.'
            ],
            modelNouns: ['found', 'took', 'saw', 'played', 'felt', 'pressed', 'returned']
        },
        practice: {
            sortTitle: 'Then vs Now Sort',
            sortZones: [
                {
                    id: 'then',
                    label: 'THEN (Past)',
                    hint: 'Yesterday, last week, long ago — past tense verbs.',
                    words: ['played', 'watched', 'went', 'ate']
                },
                {
                    id: 'now',
                    label: 'NOW (Present)',
                    hint: 'Today, every day, usually — present tense verbs.',
                    words: ['play', 'watch', 'go', 'eat']
                }
            ]
        },
        reflection: {
            grammarFocus: 'Past vs Present Tense',
            commonErrors: [
                'Using present tense for past events ("I go to the past" instead of "I went")',
                'Adding -ed to irregular verbs ("I goed," "I eated")',
                'Mixing present and past in the same sentence',
                'Forgetting to change "is/am/are" to "was/were" ("It is raining" instead of "It was raining")',
                'Writing both columns of the Then vs Now timeline in the same tense'
            ]
        },
        fixItZone: {
            questions: [
                { text: 'Do you know the difference between present tense (now) and past tense (yesterday)?', box: 'A' },
                { text: 'Can you change a present tense verb to past tense?', box: 'B' },
                { text: 'Did you create a "Then vs Now" timeline?', box: 'C' },
                { text: 'Did you write a time machine story using past tense?', box: 'D', requiresCreate: true }
            ],
            boxes: {
                A: {
                    title: 'Box A: Present vs Past Tense',
                    body: '<strong>Present Tense</strong> — things that happen now or every day: "I eat breakfast at 7 a.m." (every day)<br><strong>Past Tense</strong> — things that already happened: "I ate breakfast at 7 a.m. yesterday."<br><br>Remember: if you see words like yesterday, last night, last week, ago — use PAST tense.<br><br>Present time words: now, today, every day, usually.<br>Past time words: yesterday, last night, last week, ago.',
                    practice: [
                        { q: 'Which tense does "yesterday" signal?', a: 'Past tense.' }
                    ]
                },
                B: {
                    title: 'Box B: Changing Present to Past Tense',
                    body: '<strong>Regular verbs</strong> — add -ed: play → played, walk → walked, cook → cooked.<br><strong>Irregular verbs</strong> — change completely: go → went, eat → ate, see → saw, wake → woke.<br><br>Other common irregular verbs: read → read, sleep → slept, write → wrote, teach → taught, build → built, win → won.<br><br>Tip: make a chant — "Go – went. Eat – ate. See – saw. Wake – woke."',
                    practice: [
                        { q: 'What is the past tense of "write"?', a: '"Wrote" — it\'s irregular.' }
                    ]
                },
                C: {
                    title: 'Box C: Creating Your "Then vs Now" Timeline',
                    body: "Can't think of what you did when you were younger? Think about: what you ate, what toys you played with, what you couldn't do.<br><br><strong>Then (past) ideas:</strong> \"Then I drank milk from a bottle. Then I took naps.\"<br><strong>Now (present) ideas:</strong> \"Now I drink from a cup. Now I play outside.\"<br><br><strong>Example:</strong> Then: I played with blocks. Now: I play video games.",
                    practice: []
                },
                D: {
                    title: 'Box D: Writing Your Time Machine Story',
                    body: 'Stuck? Try these starters:<br><br>Start: "One day, I found a strange machine in my backyard."<br>Travel to the past: "It took me back to the year ___."<br>What did you see? "I looked around and saw ___."<br>What did you do? "I walked to ___. I met ___."<br>Return: "Then I pressed the button and came back home."<br><br>Important: when you travel to the past, use PAST tense for everything you did there.',
                    practice: []
                }
            },
            mistakes: [
                { mistake: 'Used present tense for past events ("I go to the past")', fix: 'Change to past: "I went to the past."' },
                { mistake: 'Added -ed to irregular verbs ("I goed," "I eated")', fix: 'Use the correct irregular form: "I went," "I ate."' },
                { mistake: 'Forgot to change "is/am/are" to "was/were"', fix: '"It is raining" → "It was raining."' },
                { mistake: 'Wrote both Then and Now columns in the same tense', fix: 'THEN = past tense ("I played"), NOW = present tense ("I play").' }
            ]
        }
    },
    {
        id: 10,
        title: 'Weather Wonders',
        quote: 'After every storm, something wonderful appears.',
        video: 'chapter-10.mp4',
        thinkTalk: [
            'What weather did the friends see turn into a storm?',
            'Where did the friends go to shelter from the storm?',
            'What is your favourite kind of weather, and why?',
            'What appeared in the sky after the storm passed?'
        ],
        comprehension: { question: 'What appeared in the sky after the storm passed?', answer: 'A rainbow' },
        vocab: { meaning: 'a joining word that connects two parts of a sentence', word: 'Conjunction' },
        starter: 'Today the weather is...',
        storybook: [
            { character: null, text: 'The sky over Lumora turned grey, and the wind began to pick up. "A storm is coming," Nima said, tilting her head toward the clouds. "We should find shelter because the wind will only get stronger."' },
            { character: 'pip', text: 'Pip zipped nervously between the branches. "But where should we go?" "The Clock Tree has a wide, hollow base," Flame said. "It\'s not far, but we need to hurry."' },
            { character: 'aanya', text: 'They ran together through the meadow as the first raindrops began to fall. Sela\'s leaves rustled wildly, and Aanya pulled her jacket tighter.' },
            { character: 'aanya', text: 'By the time they reached the tree, the storm had grown loud and fierce. Thunder rumbled overhead, but inside the hollow trunk, it felt warm and dry. "That was close," Aanya said, catching her breath.' },
            { character: null, text: '"I love storms," Sela said, smiling, "because the rain makes everything grow greener afterward." "I don\'t love them," Pip admitted, "but I do love hiding somewhere cozy with my friends." Everyone laughed.' },
            { character: 'flame', text: 'Flame peeked outside. "The wind is strong, and the trees are swaying, but I think it will pass soon." They waited together, listening to the rain drum against the leaves. Slowly, the thunder faded, and the wind grew gentle again.' },
            { character: 'aanya', text: 'When the storm finally passed, golden sunlight broke through the clouds, and a bright rainbow stretched across the sky. "Look!" Aanya said, pointing upward. "It rained, but now it\'s beautiful."' },
            { character: null, text: '"That\'s the best part," Nima said warmly. "Because after every storm, something wonderful appears." The five friends stepped outside together, breathing in the fresh, rain-washed air, grateful for shelter, and for each other.' }
        ],
        create: {
            challenge: 'Write a weather report or a short poem about your favourite kind of weather.',
            bullets: ['What is the weather like today?', 'What do you see in the sky?', 'What should people bring or wear?', 'How does this weather make you feel?'],
            starters: ['Today the weather is...', 'The wind is strong and...'],
            target: '4-6 sentences',
            hints: [
                'What joins two of your ideas together — and, but, or because?',
                'What would you warn people about?',
                'What sound does this weather make?',
                'What do you do on a day like this?'
            ],
            modelText: [
                'Today the weather is cold and cloudy.',
                'The wind is strong, so the trees are swaying.',
                'I wanted to play outside, but it is too windy.',
                'I stayed inside because it is not safe.',
                'I hope tomorrow will be sunny!'
            ],
            modelNouns: ['and', 'but', 'because', 'so']
        },
        practice: {
            sortTitle: 'Conjunction Sort',
            sortZones: [
                {
                    id: 'adds',
                    label: 'Adds / Contrasts Ideas',
                    hint: 'and = adds more. but = shows a difference.',
                    words: ['and', 'but', 'also', 'yet']
                },
                {
                    id: 'reason',
                    label: 'Gives a Reason',
                    hint: 'because = explains why something happened.',
                    words: ['because', 'since', 'so', 'as']
                }
            ]
        },
        reflection: {
            grammarFocus: 'Conjunctions (and, but, because)',
            commonErrors: [
                'Using "because" where the reason doesn\'t make sense ("I stayed inside because it was sunny")',
                'Using "and" where a contrast is needed instead of "but"',
                'Forgetting a comma before "but" ("It was sunny but I forgot my hat")',
                'Using two conjunctions in one sentence ("Because it was raining, so I stayed inside")',
                'Joining unrelated ideas just to use a conjunction'
            ]
        },
        fixItZone: {
            questions: [
                { text: 'Do you know what conjunctions are?', box: 'A' },
                { text: 'Can you use "and" to add ideas?', box: 'B' },
                { text: 'Can you use "but" to show contrast?', box: 'C' },
                { text: 'Can you use "because" to give a reason?', box: 'D' },
                { text: 'Did you write a weather report or poem using conjunctions?', box: 'E', requiresCreate: true }
            ],
            boxes: {
                A: {
                    title: 'Box A: What are Conjunctions?',
                    body: 'Conjunctions are joining words. They connect two short sentences into one longer sentence.<br><br><strong>and</strong> — adds more information: "The sun is shining and the sky is blue."<br><strong>but</strong> — shows a difference or contrast: "It is hot but I forgot my hat."<br><strong>because</strong> — gives a reason: "I wore a raincoat because it was raining."<br><br>"It was raining. I stayed inside." → "It was raining, so I stayed inside."',
                    practice: [
                        { q: 'Join these with a conjunction: "The sky is grey. The wind is strong."', a: '"The sky is grey and the wind is strong."' }
                    ]
                },
                B: {
                    title: 'Box B: Using "And" (Adding Ideas)',
                    body: 'Use "and" when both ideas are similar or go together, or you want to add more information.<br><br>"The sun is warm and the flowers are blooming."<br>"I bought apples and oranges."<br><br>Practice: "The clouds are dark. The wind is blowing." → "The clouds are dark and the wind is blowing."',
                    practice: [
                        { q: 'Join: "I like rain. I like thunder." with "and".', a: '"I like rain and thunder."' }
                    ]
                },
                C: {
                    title: 'Box C: Using "But" (Showing Contrast)',
                    body: 'Use "but" when the second idea is different or opposite from the first, or there\'s a problem/exception.<br><br>"I wanted to play outside, but it was raining."<br>"It was sunny, but I forgot my sunglasses."<br><br>Practice: "I love the beach. I don\'t like the sand." → "I love the beach, but I don\'t like the sand."',
                    practice: [
                        { q: 'Join: "It was a holiday. I had to study." with "but".', a: '"It was a holiday, but I had to study."' }
                    ]
                },
                D: {
                    title: 'Box D: Using "Because" (Giving a Reason)',
                    body: 'Use "because" when you want to explain WHY something happened.<br><br>"I took an umbrella because it was raining."<br>"I wore a jacket because it was cold."<br><br>Tip: "because" gives the reason — ask yourself "Why?" and the answer is the "because" part.',
                    practice: [
                        { q: 'Join: "I stayed inside. It was stormy." with "because".', a: '"I stayed inside because it was stormy."' }
                    ]
                },
                E: {
                    title: 'Box E: Writing Your Weather Report or Poem',
                    body: 'Stuck? Try these starters:<br><br>Start: "Today the weather is ___."<br>Add with "and": "The sky is grey and the wind is cold."<br>Show a problem with "but": "I want to play outside, but it is raining."<br>Give a reason with "because": "I brought an umbrella because it might rain."<br><br>Tip: circle the conjunctions in your writing — did you use "and," "but," or "because"?',
                    practice: []
                }
            },
            mistakes: [
                { mistake: 'Used "because" where the reason doesn\'t make sense ("I stayed inside because it was sunny")', fix: 'Check the logic: "I stayed inside because it was raining."' },
                { mistake: 'Used "and" where a contrast is needed', fix: 'Use "but" for contrast: "I wanted to play outside, but it was raining."' },
                { mistake: 'Forgot a comma before "but"', fix: 'Add a comma: "It was sunny, but I forgot my hat."' },
                { mistake: 'Used two conjunctions in one sentence ("Because it was raining, so I stayed inside")', fix: 'Remove one: "Because it was raining, I stayed inside."' }
            ]
        }
    },
    {
        id: 11,
        title: 'My Dream School',
        quote: 'A dream always needs one more thing: friends willing to build it together.',
        video: 'chapter-11.mp4',
        thinkTalk: [
            'What did the friends want to build for all of Lumora?',
            'What three rules did the friends choose for their dream school?',
            'What would your dream school have?',
            'What is one rule every school should have?'
        ],
        comprehension: { question: 'What did Nima say a dream always needs one more thing of?', answer: 'Friends willing to build it together' },
        vocab: { meaning: 'a helping word that shows ability, rules, or advice', word: 'Modal verb' },
        starter: 'In my dream school, we can...',
        storybook: [
            { character: 'pip', text: 'The next time Aanya stepped through the little wooden door, she found her four friends gathered beneath the Clock Tree, sketching pictures in the dirt with sticks. "What are you drawing?" Aanya asked, sitting beside Pip. "A school!" Pip chirped. "Nima told us about the schools where baby owls learn to fly. We want to build one for all of Lumora."' },
            { character: null, text: 'Nima nodded wisely. "Every creature should have a place to learn and grow together." "So what would our dream school look like?" Aanya asked, picking up a stick of her own.' },
            { character: 'flame', text: 'Flame stretched his wings proudly. "It must have a huge sky field, so dragons can practice flying without knocking down trees." "And it should have a quiet reading nook," Sela added, "somewhere soft and cozy, tucked behind the leaves."' },
            { character: 'pip', text: '"We can have a music tree too," Pip said, "where anyone can sing whenever they want."' },
            { character: null, text: 'Nima tapped her wing thoughtfully. "A good school must also have rules everyone follows kindly. What should ours be?"' },
            { character: 'aanya', text: '"You must be kind to every creature, big or small," Aanya said. "You can ask questions whenever you\'re curious," Sela offered. "And you should always try your best, even when something feels hard," Flame added.' },
            { character: 'pip', text: 'Together, they drew a large treehouse with wide branches for classrooms, a field for flying, and a cozy nook for stories. Pip flew circles above it, humming happily. "I think our dream school is almost ready," Aanya said, smiling at the sketch.' },
            { character: null, text: '"Almost," Nima said. "A dream always needs one more thing: friends willing to build it together." As the sun dipped low, the five friends looked at their drawing, already imagining the day Lumora\'s school would stand tall among the trees.' }
        ],
        create: {
            challenge: 'Imagine a day at your dream school, from morning to afternoon.',
            bullets: ['What can students do at your dream school?', 'What rules must everyone follow?', 'What should students try?', 'What makes this school special?'],
            starters: ['In my dream school, we can...', 'We must...'],
            target: '5-6 sentences',
            hints: [
                'What activity would you do first thing in the morning?',
                'What is one rule that keeps everyone safe or kind?',
                'What would you recommend other students try?',
                'What would make you excited to go to school?'
            ],
            modelText: [
                'In my dream school, we can choose our own activities.',
                'We can learn art, music, or science in special rooms.',
                'We must be kind to everyone — that is the most important rule.',
                'We should try something new every day, and we should also help keep the school clean.',
                'I would feel very happy at my dream school!'
            ],
            modelNouns: ['can', 'must', 'should']
        },
        practice: {
            sortTitle: 'Modal Verb Sort',
            sortZones: [
                {
                    id: 'rule',
                    label: 'Strong Rule (must)',
                    hint: 'No choice — a requirement everyone follows.',
                    words: ['must arrive on time', 'must be kind', 'must wear a uniform', 'must finish homework']
                },
                {
                    id: 'advice',
                    label: 'Advice or Ability (should / can)',
                    hint: 'A good idea, permission, or something you\'re able to do.',
                    words: ['should read daily', 'should try new things', 'can ask questions', 'can paint freely']
                }
            ]
        },
        reflection: {
            grammarFocus: 'Modal Verbs (can, must, should)',
            commonErrors: [
                'Adding "to" after a modal verb ("You must to go" instead of "You must go")',
                'Adding -s for he/she ("She cans swim" instead of "She can swim")',
                'Using "should" for a strong rule instead of "must"',
                'Using "must" for a suggestion instead of "should"',
                'Forgetting the main verb after the modal ("You can" instead of "You can play")'
            ]
        },
        fixItZone: {
            questions: [
                { text: 'Do you know what modal verbs are?', box: 'A' },
                { text: 'Can you use "can" to show permission or ability?', box: 'B' },
                { text: 'Can you use "must" to show a strong rule?', box: 'C' },
                { text: 'Can you use "should" to give good advice?', box: 'D' },
                { text: 'Did you write about a day in your dream school?', box: 'E', requiresCreate: true }
            ],
            boxes: {
                A: {
                    title: 'Box A: What are Modal Verbs?',
                    body: 'Modal verbs are helping words that come before the main verb. They show if something is possible, necessary, or a good idea.<br><br><strong>can</strong> — permission or ability: "You can play after finishing homework."<br><strong>must</strong> — strong rule, no choice: "You must be kind to everyone."<br><strong>should</strong> — good advice, your choice: "You should eat healthy food."<br><br>Important: modal verbs NEVER change form — no -ed, no -ing, no -s for he/she.<br>"She can swim" (not "She cans swim"). "He must go" (not "He musted go").',
                    practice: [
                        { q: 'Is "She cans swim" correct?', a: 'No — modal verbs never add -s. It should be "She can swim."' }
                    ]
                },
                B: {
                    title: 'Box B: Using "Can" (Permission or Ability)',
                    body: 'Use "can" when you are allowed to do something (permission), or you have the ability to do something.<br><br>"You can bring your pet to school." (permission)<br>"I can speak two languages." (ability)<br><br>"In my dream school, we can wear whatever we want." → permission.',
                    practice: [
                        { q: 'Does "I can solve maths problems easily" show permission or ability?', a: 'Ability.' }
                    ]
                },
                C: {
                    title: 'Box C: Using "Must" (Strong Rule — No Choice)',
                    body: 'Use "must" when there is a rule everyone follows, something is necessary, or there is no choice.<br><br>"You must raise your hand before speaking."<br>"Students must complete their homework."<br><br>Remember: "must" is for STRONG rules. If you break a "must" rule, there is a consequence.',
                    practice: [
                        { q: 'Is "Students must arrive on time" a rule or advice?', a: "It's a rule — no choice." }
                    ]
                },
                D: {
                    title: 'Box D: Using "Should" (Good Advice — Your Choice)',
                    body: 'Use "should" when you want to give advice or a suggestion — a good idea, but not a rule.<br><br>"You should try the new cafeteria food."<br>"We should have more art classes."<br><br><strong>must vs should:</strong> "You must be on time" (school rule) vs "You should be on time" (polite suggestion).',
                    practice: [
                        { q: 'Is "You should drink more water" a rule or advice?', a: "Advice — it's good for you, but your choice." }
                    ]
                },
                E: {
                    title: 'Box E: Writing About Your Dream School',
                    body: 'Stuck? Try these starters:<br><br>Start with "can": "In my dream school, we can ___."<br>Add a rule with "must": "We must ___ because ___."<br>Add advice with "should": "We should ___ so that ___."<br>Describe the school: "My dream school has a ___ where we can ___."<br><br><strong>Example:</strong> "In my dream school, we can choose our own activities. We must be kind to everyone — that is the most important rule. We should try something new every day."',
                    practice: []
                }
            },
            mistakes: [
                { mistake: 'Added "to" after a modal ("You must to go")', fix: 'Remove "to": "You must go."' },
                { mistake: 'Added "-s" for he/she ("She cans swim")', fix: 'Modal verbs never change: "She can swim."' },
                { mistake: 'Used "should" for a strong rule', fix: "If it's a rule with no choice, use \"must.\"" },
                { mistake: 'Used "must" for a suggestion', fix: "If it's just a good idea, use \"should.\"" }
            ]
        }
    },
    {
        id: 12,
        title: "Let's Go Shopping!",
        quote: 'Some things you count, and some things you simply cannot.',
        video: 'chapter-12.mp4',
        thinkTalk: [
            'What did Pip and Aanya need to buy at the market?',
            'Why couldn\'t the merchant count the starlight?',
            'What is something you can count when you go shopping?',
            'What is something you cannot count, but need to measure?'
        ],
        comprehension: { question: 'What did the merchant sell in glass bottles?', answer: 'Starlight' },
        vocab: { meaning: 'a noun that can be counted one by one', word: 'Countable noun' },
        starter: 'Last Saturday, I went shopping with my...',
        storybook: [
            { character: 'pip', text: 'The next time Aanya stepped through the little wooden door, Pip was waiting with a woven basket under his wing. "Today is Market Day!" Pip chirped. "Everyone in Lumora comes to trade. Want to help me shop?" Aanya laughed and took the basket. "Of course! What do we need?"' },
            { character: 'pip', text: '"Let\'s see," Pip said, checking a scrap of leaf. "We need three moonberries, a bag of silver seeds, and some honey for Sela\'s tea."' },
            { character: 'aanya', text: 'They wound through rows of stalls piled high with treasures. A fox-like merchant called out, "Fresh moonberries! Sweet and round, ten for a lantern coin!" "I\'ll take three, please," Aanya said, counting them carefully into the basket.' },
            { character: 'flame', text: 'Nearby, Flame leaned over a barrel almost as big as himself. "How much honey is in there?" he asked the shopkeeper. "Plenty," the shopkeeper said, chuckling. "But you only need a little, dragon, unless you plan to share." "I always share," Flame said proudly, holding out a small jar.' },
            { character: null, text: 'Sela wandered toward a stall glowing softly. "What is that?" she asked, pointing at glass bottles filled with shimmering light. "Bottled starlight," the merchant said. "You cannot count starlight, little one, but you can measure it. Would you like some?" "Just a little," Sela said, smiling. "Enough for my treehouse window."' },
            { character: null, text: 'By the time Nima found them, the basket was full: three moonberries, a bag of silver seeds, a jar of honey, and a small bottle of starlight. "You found everything," Nima said, peering inside.' },
            { character: 'aanya', text: '"We did," Aanya said happily. "Some things you count, and some things you simply cannot, but the market always has both."' },
            { character: null, text: 'The five friends carried their basket home together, already planning what to buy next time.' }
        ],
        create: {
            challenge: 'Write about going shopping with your family — what you bought and where.',
            bullets: ['Who did you go shopping with?', 'Where did you go?', 'What countable things did you buy?', 'What uncountable things did you buy?'],
            starters: ['Last Saturday, I went shopping with my...', 'We went to...'],
            target: '5-6 sentences',
            hints: [
                'What did you count as you put it in the bag?',
                'What needed a bottle, bag, or packet?',
                'Who carried the shopping bag?',
                'How did you feel at the end of the trip?'
            ],
            modelText: [
                'Last Saturday, I went shopping with my mother.',
                'We went to the supermarket and bought many things.',
                'I picked up three apples and a bunch of bananas — those are countable.',
                'Then we bought a bottle of milk, a packet of rice, and some cheese — those are uncountable.',
                'We also got two notebooks for school, and the shopkeeper gave us a big paper bag.'
            ],
            modelNouns: ['apples', 'bananas', 'milk', 'rice', 'cheese', 'notebooks']
        },
        practice: {
            sortTitle: 'Countable vs Uncountable Sort',
            sortZones: [
                {
                    id: 'countable',
                    label: 'Countable',
                    hint: 'You can say "one, two, three" — has a plural form.',
                    words: ['apple', 'pencil', 'book', 'banana']
                },
                {
                    id: 'uncountable',
                    label: 'Uncountable',
                    hint: 'You need a container — no plural form.',
                    words: ['rice', 'milk', 'water', 'sugar']
                }
            ]
        },
        reflection: {
            grammarFocus: 'Countable vs Uncountable Nouns',
            commonErrors: [
                'Saying "a rice" instead of "a bag of rice" (uncountable nouns need a container)',
                'Saying "two milks" instead of "two bottles of milk"',
                'Forgetting "an" before a countable noun ("I bought apple" instead of "an apple")',
                'Using a number directly with an uncountable noun ("three water" instead of "three bottles of water")',
                'Treating "rice" or "sugar" as countable ("one rice" instead of "a grain of rice")'
            ]
        },
        fixItZone: {
            questions: [
                { text: 'Do you know the difference between countable and uncountable nouns?', box: 'A' },
                { text: 'Can you identify countable nouns (things you can count)?', box: 'B' },
                { text: 'Can you identify uncountable nouns (things that need a container)?', box: 'C' },
                { text: 'Did you write sentences using both countable and uncountable nouns?', box: 'D', requiresCreate: true }
            ],
            boxes: {
                A: {
                    title: 'Box A: Countable vs Uncountable',
                    body: 'Some things you can count. Some things you cannot count — you need a container.<br><br><strong>Countable:</strong> you can say "one, two, three," and they have a plural form. Examples: apples, pencils, books, toys, oranges.<br><strong>Uncountable:</strong> you cannot say "one, two, three," and they have no plural form. Examples: milk, rice, water, sugar, cheese, juice.<br><br>"apple" → yes, one apple, two apples → countable.<br>"water" → no, you cannot say "one water" → uncountable.',
                    practice: [
                        { q: 'Is "book" countable or uncountable?', a: 'Countable — one book, two books.' },
                        { q: 'Is "rice" countable or uncountable?', a: 'Uncountable — you cannot say "one rice."' }
                    ]
                },
                B: {
                    title: 'Box B: Countable Nouns',
                    body: 'You can use: a/an ("a banana, an apple"), a number ("two oranges, three pencils"), many ("many books"), a few ("a few toys").<br><br>Examples: apples, bananas, oranges, eggs, pencils, books, erasers, desks, chairs, dogs, cats, birds.<br><br>"I bought three apples." "She has many books." "Can I have a banana?"',
                    practice: [
                        { q: 'Fill in: "Can I have ___ banana?"', a: '"A" — banana is countable and starts with a consonant sound.' }
                    ]
                },
                C: {
                    title: 'Box C: Uncountable Nouns',
                    body: 'You cannot say "a rice" — you must say "a bag of rice." You cannot say "two milks" — you must say "two bottles of milk."<br><br>Common containers: a bottle of (water, milk, juice), a bag of (rice, sugar, flour), a packet of (biscuits), a box of (cereal), a glass of (water, juice), a cup of (tea, coffee).<br><br>"I bought a bottle of milk." "Can I have some rice?" "We need a bag of sugar."',
                    practice: [
                        { q: 'How do you correctly ask for milk?', a: '"A bottle of milk" — milk needs a container.' }
                    ]
                },
                D: {
                    title: 'Box D: Writing Your Shopping Sentences and Grocery Story',
                    body: 'Stuck? Try these starters:<br><br>Shopping bag: "I put a ___ (countable) and a bottle of ___ (uncountable) in my bag."<br>First sentence: "Last Saturday, I went shopping with my ___."<br>Countable: "I bought three ___ and two ___."<br>Uncountable: "I also bought a bottle of ___ and a bag of ___."<br><br><strong>Example:</strong> "I bought three apples and two bananas. I also bought a bottle of milk and a bag of rice."',
                    practice: []
                }
            },
            mistakes: [
                { mistake: 'Said "a rice" (uncountable needs a container)', fix: 'Say "a bag of rice."' },
                { mistake: 'Said "two milks" (uncountable needs a container)', fix: 'Say "two bottles of milk."' },
                { mistake: 'Said "I bought apple" (missing "an")', fix: 'Say "I bought an apple."' },
                { mistake: 'Used a number with an uncountable noun ("three water")', fix: 'Add a container: "three bottles of water."' }
            ]
        }
    },
    {
        id: 13,
        title: 'Healthy Habits',
        quote: 'Healthy habits are more fun with friends.',
        video: 'chapter-13.mp4',
        thinkTalk: [
            'What healthy habit was each friend practicing?',
            'How did Flame warm up his wings?',
            'What is a healthy habit you are practicing this week?',
            'Why did Nima say sharing habits with friends is the healthiest habit of all?'
        ],
        comprehension: { question: 'What was Flame doing to get ready for long flights?', answer: 'Warming up his wings' },
        vocab: { meaning: 'an action that is happening right now', word: 'Present continuous' },
        starter: 'This week, I am...',
        storybook: [
            { character: 'aanya', text: 'When Aanya stepped through the little wooden door, the morning air in Lumora felt crisp and bright. "You\'re just in time!" Pip chirped, flapping excitedly. "We are having a Healthy Habits Day today." "What does that mean?" Aanya asked, tying her shoes.' },
            { character: null, text: '"Everyone practices something good for their body," Sela explained, stretching her twig arms overhead. "Look, I am stretching right now."' },
            { character: 'flame', text: 'Nearby, Flame was hopping from foot to foot, his wings tucked in. "I am warming up my wings," he said between breaths. "Dragons need strong wings for long flights." Aanya laughed. "I am warming up too!" She rolled her shoulders and stretched her arms high.' },
            { character: null, text: 'Nima glided down and landed gracefully on a branch. "I am watching all of you," she said, smiling. "That counts as resting my eyes after a long night of flying."' },
            { character: 'pip', text: '"That\'s cheating," Pip teased, hopping around in circles. "I am running laps around the meadow. Want to join me?"' },
            { character: 'aanya', text: '"I am drinking water first," Aanya said, lifting a small silver cup. "Staying healthy means taking care of your whole body, not just moving fast." Sela nodded. "I am eating a berry too. Growing creatures need good food."' },
            { character: null, text: 'They spent the morning together: Flame flapping his wings over the meadow, Pip racing between the trees, Sela stretching slowly by the willow, and Aanya jogging alongside her friends, sipping water whenever she felt thirsty.' },
            { character: 'flame', text: 'By midday, everyone flopped down under the shade of the Clock Tree, breathing hard and smiling. "I am feeling stronger already," Flame said proudly. "Me too," Aanya agreed. "I am learning that healthy habits are more fun with friends." Nima chuckled softly. "That," she said, "is the healthiest habit of all."' }
        ],
        create: {
            challenge: 'Write a diary entry about healthy habits you are practicing this week.',
            bullets: ['What are you eating that is healthy?', 'What exercise are you doing?', 'How are you sleeping and resting?', 'How are you feeling because of these habits?'],
            starters: ['This week, I am...', 'I am also...'],
            target: '5-6 sentences',
            hints: [
                'What are you doing right now for your health?',
                'What new habit are you trying this week?',
                'Who is practicing healthy habits with you?',
                'How does your body feel after a healthy habit?'
            ],
            modelText: [
                'This week, I am drinking more water.',
                'I am also eating fruits and vegetables every day.',
                'I am going for a walk in the evening.',
                'I am sleeping at least eight hours each night, and I am washing my hands before every meal.',
                'I am feeling stronger and happier already!'
            ],
            modelNouns: ['am drinking', 'am eating', 'am going', 'am sleeping', 'am washing', 'am feeling']
        },
        practice: {
            sortTitle: 'Present Continuous Sort',
            sortZones: [
                {
                    id: 'ing-add',
                    label: 'Just add -ing',
                    hint: 'Most verbs simply add -ing.',
                    words: ['reading', 'playing', 'eating', 'walking']
                },
                {
                    id: 'ing-change',
                    label: 'Spelling changes first',
                    hint: 'Drop the e, or double the last letter, then add -ing.',
                    words: ['dancing', 'running', 'swimming', 'writing']
                }
            ]
        },
        reflection: {
            grammarFocus: 'Present Continuous Tense',
            commonErrors: [
                'Forgetting the "be" verb ("I reading" instead of "I am reading")',
                'Using the wrong "be" verb ("He are playing" instead of "He is playing")',
                'Forgetting to add -ing ("I am play" instead of "I am playing")',
                'Using simple present instead of present continuous for "right now" actions',
                'Spelling errors when adding -ing ("runing" instead of "running")'
            ]
        },
        fixItZone: {
            questions: [
                { text: 'Do you know what present continuous tense is?', box: 'A' },
                { text: 'Can you form a sentence using "am/is/are + verb + ing"?', box: 'B' },
                { text: 'Can you describe what is happening right now?', box: 'C' },
                { text: 'Did you write a diary about healthy habits using present continuous?', box: 'D', requiresCreate: true }
            ],
            boxes: {
                A: {
                    title: 'Box A: What is Present Continuous Tense?',
                    body: 'Present continuous tense tells us what is happening RIGHT NOW — at this exact moment.<br><br><strong>Simple Present</strong> — every day, usually: "I eat breakfast at 7 a.m." (habit)<br><strong>Present Continuous</strong> — right now: "I am eating breakfast right now." (this moment)<br><br>Key words: now, right now, at the moment, today, this week.',
                    practice: [
                        { q: 'Which tense is "I am drinking water right now"?', a: 'Present continuous — it\'s happening right now.' }
                    ]
                },
                B: {
                    title: 'Box B: How to Form Present Continuous',
                    body: 'Formula: Subject + am/is/are + verb + ing.<br><br>I → am: "I am reading a book."<br>He/She/It → is: "She is dancing."<br>We/You/They → are: "We are playing."<br><br><strong>Adding -ing:</strong> read → reading, play → playing (just add -ing). dance → dancing (drop the e). run → running, swim → swimming (double the last letter).',
                    practice: [
                        { q: 'What is the -ing form of "run"?', a: '"Running" — double the n, then add -ing.' },
                        { q: 'Fill in: "He ___ playing." (is/are)', a: '"Is" — he is singular.' }
                    ]
                },
                C: {
                    title: 'Box C: Describing What Is Happening Right Now',
                    body: 'Stuck? Look around you and ask:<br><br>What is the teacher doing? "The teacher is writing on the board."<br>What are your friends doing? "My friend is sitting next to me."<br>What are you doing? "I am learning English."<br>What is happening around you? "The fan is spinning. The clock is ticking."',
                    practice: [
                        { q: 'How would you describe the sun shining right now?', a: '"The sun is shining."' }
                    ]
                },
                D: {
                    title: 'Box D: Writing Your Healthy Habits Diary',
                    body: 'Stuck? Try these starters:<br><br>Start: "This week, I am ___."<br>Healthy eating: "I am eating more fruits and vegetables."<br>Exercise: "I am playing outside every evening."<br>Sleep: "I am sleeping at least eight hours."<br>Hygiene: "I am washing my hands before meals."<br><br>Important: use present continuous to talk about things you ARE DOING this week.',
                    practice: []
                }
            },
            mistakes: [
                { mistake: 'Forgot the "be" verb ("I reading")', fix: 'Add it: "I am reading."' },
                { mistake: 'Used the wrong "be" verb ("He are playing")', fix: 'Use "is" for he/she/it: "He is playing."' },
                { mistake: 'Forgot to add -ing ("I am play")', fix: 'Add -ing: "I am playing."' },
                { mistake: 'Spelling error with -ing ("I am runing")', fix: 'Double the n: "I am running."' }
            ]
        }
    },
    {
        id: 14,
        title: 'The World Around Us',
        quote: 'I will remember it forever, especially the exact moment it happened.',
        video: 'chapter-14.mp4',
        thinkTalk: [
            'What special event happened once in a hundred years?',
            'What did the friends do in the morning, afternoon, and at sunset?',
            'When is your birthday, and what do you usually do that day?',
            'What time do you wake up and go to bed?'
        ],
        comprehension: { question: 'When did the river turn silver in the story?', answer: 'At seven o\'clock' },
        vocab: { meaning: 'a word that tells us when something happens', word: 'Preposition of time' },
        starter: 'On my special day, I woke up at...',
        storybook: [
            { character: 'pip', text: 'When Aanya stepped through the little wooden door, Pip was hopping with excitement. "Today is special! It\'s the Day of Falling Stars. It only happens once in a hundred years." "What time does it start?" Aanya asked. "At sunset," Flame said, stretching his wings. "But we have the whole day first. Want to see what a day in Lumora looks like?" "Yes, please!"' },
            { character: null, text: '"In the morning, we visit the river," Sela said, tugging Aanya\'s sleeve. "At seven o\'clock, the water turns silver when the sun rises over it." They walked together, and sure enough, at exactly seven, the river shimmered like liquid moonlight.' },
            { character: null, text: '"In the afternoon, we usually rest under the willow tree," Nima said, landing softly on a branch. "On quiet days, that is when I tell stories about old Lumora."' },
            { character: 'aanya', text: '"Tell me one!" Aanya said, sitting down eagerly. Nima told a tale of the very first falling star, and the whole group listened until the sky began to change color.' },
            { character: 'pip', text: '"At four o\'clock, the market opens for the festival," Pip chirped. "On Falling Star Day, everyone sells sparkling treats!" They wandered through the stalls, tasting honeyed nuts and frosty berries, until Flame pointed upward.' },
            { character: 'flame', text: '"It is almost time," he said. "At sunset, the stars begin to fall." They climbed a hill together and watched the sky. Right on time, one star, then another, streaked across the darkening sky, leaving trails of gold behind.' },
            { character: null, text: '"In a hundred years, will you remember this?" Sela asked softly.' },
            { character: 'aanya', text: 'Aanya smiled, watching the stars fall one by one. "I will remember it forever," she said, "especially the exact moment it happened."' }
        ],
        create: {
            challenge: 'Write about a special day — your birthday, a trip, or a festival — using "at," "on," and "in."',
            bullets: ['What day was it, and what time did it start?', 'What happened in the morning?', 'What happened at a specific time?', 'What happened in the evening?'],
            starters: ['On my special day, I woke up at...', 'In the morning, I...'],
            target: '5-6 sentences',
            hints: [
                'What time did the day begin?',
                'What happened during a specific part of the day?',
                'What was the most exciting moment, and when did it happen?',
                'How did you feel by the end of the day?'
            ],
            modelText: [
                'On my birthday, I woke up at 6:00 a.m.',
                'In the morning, I opened presents.',
                'At noon, we ate a special lunch with my family.',
                'In the afternoon, my friends came over and we played games.',
                'At 6:00 p.m., we had cake, and in the evening, we watched a movie together.'
            ],
            modelNouns: ['at', 'in', 'on']
        },
        practice: {
            sortTitle: 'At / On / In Sort',
            sortZones: [
                {
                    id: 'at-on',
                    label: '"at" and "on"',
                    hint: '"at" for exact times, "on" for days and dates.',
                    words: ['at 7:00', 'at noon', 'on Monday', 'on my birthday']
                },
                {
                    id: 'in',
                    label: '"in"',
                    hint: 'Months, years, and parts of the day.',
                    words: ['in July', 'in 2024', 'in the morning', 'in the evening']
                }
            ]
        },
        reflection: {
            grammarFocus: 'Prepositions of Time (at, on, in)',
            commonErrors: [
                'Using "in" for days instead of "on" ("in Monday" instead of "on Monday")',
                'Using "at" for months instead of "in" ("at July" instead of "in July")',
                'Using "on" for parts of the day instead of "in" ("on the morning" instead of "in the morning")',
                'Using "in" for specific times instead of "at" ("in 7:00" instead of "at 7:00")',
                'Forgetting the preposition entirely'
            ]
        },
        fixItZone: {
            questions: [
                { text: 'Do you know what prepositions of time are?', box: 'A' },
                { text: 'Can you use "at" for specific times?', box: 'B' },
                { text: 'Can you use "on" for days and dates?', box: 'C' },
                { text: 'Can you use "in" for months, years, and parts of the day?', box: 'D' },
                { text: 'Did you write about a special day using "at," "on," and "in"?', box: 'E', requiresCreate: true }
            ],
            boxes: {
                A: {
                    title: 'Box A: What are Prepositions of Time?',
                    body: 'Prepositions of time tell us WHEN something happens.<br><br><strong>at</strong> — specific times: at 7:00, at noon, at bedtime.<br><strong>on</strong> — days and dates: on Monday, on my birthday, on June 15th.<br><strong>in</strong> — months, years, parts of the day: in July, in 2024, in the morning.<br><br>Memory trick: "at" is a clock, "on" is a calendar, "in" is a long box (a month, a year, a morning).',
                    practice: [
                        { q: 'Which preposition fits a clock time like 7:00?', a: '"At" — at 7:00.' }
                    ]
                },
                B: {
                    title: 'Box B: Using "At" (Specific Times)',
                    body: 'Use "at" for clock times (at 6:00 a.m., at 7:30), meal times (at breakfast, at lunch), and special times of day (at noon, at midnight, at bedtime).<br><br>"I wake up at 7:00 a.m." "School ends at 3:00 p.m." "I go to bed at 9:00 p.m."',
                    practice: [
                        { q: 'Fill in: "I eat lunch ___ 12:00 p.m."', a: '"At" — it\'s a specific clock time.' }
                    ]
                },
                C: {
                    title: 'Box C: Using "On" (Days and Dates)',
                    body: 'Use "on" for days of the week (on Monday, on Saturday), specific dates (on June 15th), special days (on my birthday, on Diwali), and weekends (on the weekend).<br><br>"We have English class on Monday." "My birthday is on July 4th."',
                    practice: [
                        { q: 'Fill in: "I visit my grandmother ___ Sundays."', a: '"On" — Sundays is a day.' }
                    ]
                },
                D: {
                    title: 'Box D: Using "In" (Months, Years, Parts of the Day)',
                    body: 'Use "in" for months (in January), years (in 2023), parts of the day (in the morning, in the evening), and seasons (in summer).<br><br>Exception: we say "at night," not "in the night."<br><br>"My birthday is in August." "I eat breakfast in the morning." "I was born in 2015."',
                    practice: [
                        { q: 'Fill in: "I was born ___ 2015."', a: '"In" — years use "in."' }
                    ]
                },
                E: {
                    title: 'Box E: Writing About Your Special Day',
                    body: 'Stuck? Try these starters:<br><br>Start with "on": "On my birthday, I woke up at 7:00 a.m."<br>Add "in" for part of day: "In the morning, I opened my presents."<br>Add "at" for specific time: "At 2:00 p.m., we had cake."<br>Add another "in": "In the evening, we watched a movie."<br>End with how you felt: "I felt very happy in the end."',
                    practice: []
                }
            },
            mistakes: [
                { mistake: 'Said "in Monday"', fix: 'Use "on Monday" — days use "on."' },
                { mistake: 'Said "at July"', fix: 'Use "in July" — months use "in."' },
                { mistake: 'Said "on the morning"', fix: 'Use "in the morning" — parts of day use "in."' },
                { mistake: 'Said "in 7:00"', fix: 'Use "at 7:00" — specific times use "at."' }
            ]
        }
    },
    {
        id: 15,
        title: 'Magic Words',
        quote: 'The right word can make a story brighter, funnier, or kinder.',
        video: 'chapter-15.mp4',
        thinkTalk: [
            'What did the Book of Magic Words show for each word spoken?',
            'What two words appeared when Aanya said "happy"?',
            'What is a stronger word you could use instead of "good"?',
            'What is the opposite of "loud"?'
        ],
        comprehension: { question: 'What word did Flame say to the book, hoping for "bold" and "scared"?', answer: 'Brave' },
        vocab: { meaning: 'a word that means the same as another word', word: 'Synonym' },
        starter: 'Instead of "good," I can say...',
        storybook: [
            { character: null, text: 'When Aanya stepped through the little wooden door, she found Nima perched beside an old glowing book resting on a stone table. "What is that?" Aanya asked, peering closer. "The Book of Magic Words," Nima said. "Every word inside has a twin, one that means the same, and one that means the opposite."' },
            { character: 'pip', text: 'Pip fluttered down excitedly. "Try it! Say a word, and the book shows you its twins!" Aanya thought for a moment. "Happy," she said. The book glowed softly, and two words shimmered above the page: joyful and sad.' },
            { character: 'aanya', text: '"Joyful means almost the same as happy," Nima explained. "Sad means the opposite."' },
            { character: 'flame', text: 'Flame stretched his wings. "Let me try. Brave!" The book flashed, showing bold and scared. "I like bold better," Flame said proudly. "It sounds stronger."' },
            { character: null, text: 'Sela leaned in shyly. "Quiet," she whispered. The book shimmered: silent and loud. "Silent," Sela said softly. "That is exactly how I feel in a big crowd."' },
            { character: 'aanya', text: '"Your turn, Aanya," Pip chirped. Aanya grinned. "Small!" The book glowed once more: tiny and huge. "Tiny," Aanya said, "like Pip when he first hatched!" Pip puffed out his feathers. "I was never tiny. I was compact." Everyone laughed.' },
            { character: null, text: '"The Book of Magic Words teaches us something important," Nima said. "The right word can make a story brighter, or funnier, or even kinder." "Like magic," Aanya said, smiling. "Exactly like magic," Nima agreed.' },
            { character: null, text: 'As the sky began to dim, the friends took turns calling out more words, watching their twins shimmer to life, each one making their story a little more powerful than before.' }
        ],
        create: {
            challenge: 'Rewrite some ordinary sentences using stronger, more powerful synonyms.',
            bullets: ['What weak word can you replace?', 'What stronger synonym could you use instead?', 'Does your new sentence sound more exciting?', 'Can you use an antonym to show contrast somewhere?'],
            starters: ['The boy was nice. → The boy was...', 'The cake was good. → The cake was...'],
            target: '4-6 sentences',
            hints: [
                'What is a stronger word than "nice"?',
                'What is a stronger word than "big"?',
                'What word means the opposite of "happy"?',
                'Which magic word made your sentence more exciting?'
            ],
            modelText: [
                'The boy was kind and thoughtful.',
                'The cake was delicious and wonderful.',
                'I had a huge lunch.',
                'She was thrilled and overjoyed.',
                'I was exhausted after the long day.'
            ],
            modelNouns: ['kind', 'thoughtful', 'delicious', 'huge', 'thrilled', 'exhausted']
        },
        practice: {
            sortTitle: 'Synonym or Antonym?',
            sortZones: [
                {
                    id: 'synonym',
                    label: 'Synonym of "happy"',
                    hint: 'Means almost the same thing.',
                    words: ['joyful', 'glad', 'cheerful', 'delighted']
                },
                {
                    id: 'antonym',
                    label: 'Antonym of "happy"',
                    hint: 'Means the opposite.',
                    words: ['sad', 'upset', 'miserable', 'unhappy']
                }
            ]
        },
        reflection: {
            grammarFocus: 'Synonyms and Antonyms',
            commonErrors: [
                'Giving an antonym when asked for a synonym (or the reverse)',
                'Using a word that isn\'t a real synonym (e.g. "big" → "blue")',
                'Using a word that isn\'t a true antonym (e.g. "hot" → "warm" instead of "cold")',
                'Overusing the same weak word repeatedly ("good," "nice") instead of trying new synonyms',
                'Forgetting that synonyms must fit the sentence\'s meaning and tone'
            ]
        },
        fixItZone: {
            questions: [
                { text: 'Do you know what a synonym is?', box: 'A' },
                { text: 'Do you know what an antonym is?', box: 'B' },
                { text: 'Can you tell the difference between synonyms and antonyms?', box: 'C' },
                { text: 'Did you replace weak words with stronger synonyms?', box: 'D', requiresCreate: true }
            ],
            boxes: {
                A: {
                    title: 'Box A: What are Synonyms?',
                    body: 'Synonyms are words that have the SAME or almost the SAME meaning.<br><br>happy → joyful, glad, cheerful, delighted<br>big → large, huge, enormous, gigantic<br>good → nice, kind, excellent, wonderful<br><br>Use synonyms to avoid repeating the same word and make your writing more interesting: "The cake was good" → "The cake was delicious."',
                    practice: [
                        { q: 'What is a synonym for "fast"?', a: 'Quick, swift, rapid, or speedy.' }
                    ]
                },
                B: {
                    title: 'Box B: What are Antonyms?',
                    body: 'Antonyms are words that have the OPPOSITE meaning.<br><br>happy → sad, unhappy, miserable<br>big → small, tiny, little<br>fast → slow<br>hot → cold<br><br>Use antonyms to show contrast: "It was not big" → "It was small."',
                    practice: [
                        { q: 'What is the antonym of "loud"?', a: '"Quiet."' }
                    ]
                },
                C: {
                    title: 'Box C: Synonym vs Antonym — How to Remember',
                    body: 'Synonym = Same (both start with S).<br>Antonym = Against/opposite (A for Against).<br><br>"Find a word that means the SAME as big" → synonym.<br>"Find a word that means the OPPOSITE of hot" → antonym.',
                    practice: [
                        { q: '"What is the opposite of fast?" — is this asking for a synonym or antonym?', a: 'Antonym — it asks for the opposite.' }
                    ]
                },
                D: {
                    title: 'Box D: Replacing Weak Words with Stronger Synonyms',
                    body: '<strong>nice</strong> → kind, friendly, caring, thoughtful.<br><strong>good</strong> → excellent, wonderful, amazing, fantastic.<br><strong>big</strong> → huge, enormous, gigantic, massive.<br><strong>said</strong> → whispered, shouted, replied, exclaimed.<br><br><strong>Example:</strong> "The boy was nice" → "The boy was kind and thoughtful." "I had a big lunch" → "I had a huge lunch."',
                    practice: []
                }
            },
            mistakes: [
                { mistake: 'Gave an antonym when asked for a synonym', fix: 'Remember: Syn = Same (both start with S).' },
                { mistake: 'Gave a synonym when asked for an antonym', fix: 'Antonym = Opposite (A for Against).' },
                { mistake: 'Used a word that is not a real synonym ("big" → "blue")', fix: 'Check: does it mean the same thing?' },
                { mistake: 'Used the same weak word over and over', fix: 'Use a word bank or thesaurus to find new words.' }
            ]
        }
    },
    {
        id: 16,
        title: "Let's Describe!",
        quote: 'The real prize is noticing the small, beautiful details all around us.',
        video: 'chapter-16.mp4',
        thinkTalk: [
            'What did Flame, Pip, and Sela bring to the Color Contest?',
            'How did Aanya describe the butterfly and the pond?',
            'What describing words would you use for your favourite object?',
            'Why did Nima say there was no winner in the contest?'
        ],
        comprehension: { question: 'What did Sela bring to the Color Contest?', answer: 'A smooth, gray stone' },
        vocab: { meaning: 'a word that describes a noun', word: 'Adjective' },
        starter: 'I have a...',
        storybook: [
            { character: 'aanya', text: 'The moment Aanya climbed through the little wooden door, she gasped. Lumora looked different today. Every leaf, every flower, every stone seemed brighter than before.' },
            { character: null, text: '"Welcome to the Color Contest!" said Nima, swooping down with her big, round eyes shining. "Once a year, the creatures of Lumora show off the most wonderful, colorful, sparkly things they can find."' },
            { character: 'flame', text: 'Flame the dragon puffed proudly. His scales looked shinier and redder than usual. "Look at me," he said. "I am a bold, fiery, magnificent dragon today!"' },
            { character: 'pip', text: 'Pip the bird fluttered onto a tall, golden sunflower. "And I found the tallest flower in the whole meadow," she chirped. "It\'s bright, it\'s cheerful, and it smells sweet."' },
            { character: null, text: 'Sela the twig creature rustled her leafy arms. "I brought a smooth, gray stone from the river," she said. "It feels cool and it looks like a tiny moon."' },
            { character: 'aanya', text: 'Aanya walked around, describing everything she saw. "That butterfly has silky, purple wings. That bush has tiny, white berries. That pond looks calm and silvery." Nima nodded wisely. "You are all using wonderful describing words. They help us imagine exactly what something looks like, feels like, or sounds like."' },
            { character: null, text: 'Flame puffed out his chest again. "So who wins the contest?" Nima smiled. "There is no winner today. The real prize is noticing the small, beautiful details all around us."' },
            { character: 'aanya', text: 'Aanya smiled and wrote in her notebook: bold, fiery dragon. Tall, golden flower. Smooth, gray stone. Silky, purple wings. "I think I understand describing words now," she said softly. Nima\'s eyes twinkled. "That\'s because you used your eyes, your ears, and your imagination all at once."' }
        ],
        create: {
            challenge: 'Choose an object near you and describe it using at least 5 adjectives.',
            bullets: ['What object are you describing?', 'What colour, size, and shape is it?', 'How does it feel, smell, or sound?', 'What do you use it for?'],
            starters: ['I have a...', 'It is... and...'],
            target: '5-6 sentences',
            hints: [
                'What colour and size is your object?',
                'What shape and texture does it have?',
                'Does it have a smell or make a sound?',
                'When do you use it, and why do you like it?'
            ],
            modelText: [
                'I have a water bottle.',
                'It is blue and shiny.',
                'It is round and feels smooth and cool.',
                'It smells fresh and clean, and it makes a clicking sound when I open the cap.',
                'I use it when I am thirsty, and I like it because it keeps my water cold.'
            ],
            modelNouns: ['blue', 'shiny', 'round', 'smooth', 'cool', 'fresh']
        },
        practice: {
            sortTitle: 'Adjective Sort',
            sortZones: [
                {
                    id: 'look',
                    label: 'How It Looks',
                    hint: 'Colour, size, and shape words.',
                    words: ['red', 'tiny', 'round', 'square']
                },
                {
                    id: 'feel',
                    label: 'How It Feels or Sounds',
                    hint: 'Texture, smell, and sound words.',
                    words: ['soft', 'smooth', 'fragrant', 'noisy']
                }
            ]
        },
        reflection: {
            grammarFocus: 'Adjectives (describing words)',
            commonErrors: [
                'Using only basic adjectives ("good," "nice," "big") instead of stronger, specific words',
                'Forgetting to use any adjectives at all',
                'Putting adjectives in the wrong order (opinion → size → colour → noun)',
                'Repeating the same adjective instead of varying it',
                'Writing fewer than the 5 adjectives the task asks for'
            ]
        },
        fixItZone: {
            questions: [
                { text: 'Do you know what an adjective is?', box: 'A' },
                { text: 'Can you use adjectives to describe color, size, shape, texture?', box: 'B' },
                { text: 'Can you use adjectives to describe how something feels or smells?', box: 'C' },
                { text: 'Did you write a paragraph describing an object using at least 5 adjectives?', box: 'D', requiresCreate: true }
            ],
            boxes: {
                A: {
                    title: 'Box A: What are Adjectives?',
                    body: 'Adjectives are describing words. They tell us more about a noun.<br><br><strong>Color:</strong> a red apple. <strong>Size:</strong> a big dog. <strong>Shape:</strong> a round ball. <strong>Texture:</strong> a soft pillow. <strong>Sound:</strong> a loud noise. <strong>Smell:</strong> a fragrant flower. <strong>Taste:</strong> a sweet candy. <strong>Feeling:</strong> a happy girl.<br><br>Instead of "a dog," say "a fluffy, brown, playful dog."',
                    practice: [
                        { q: 'Which word describes shape: "round" or "loud"?', a: '"Round" — it describes shape; "loud" describes sound.' }
                    ]
                },
                B: {
                    title: 'Box B: Adjectives for Color, Size, and Shape',
                    body: '<strong>Colors:</strong> red, blue, green, yellow, purple, brown.<br><strong>Sizes:</strong> big, small, huge, tiny, enormous, gigantic.<br><strong>Shapes:</strong> round, square, oval, rectangle, curved.<br><br>"A round, red apple." "A tall, square building."',
                    practice: [
                        { q: 'Describe a balloon using color, size, and shape.', a: 'e.g. "A round, yellow balloon."' }
                    ]
                },
                C: {
                    title: 'Box C: Adjectives for Texture, Smell, and Sound',
                    body: '<strong>Texture:</strong> soft, hard, rough, smooth, fluffy, sticky.<br><strong>Smell:</strong> sweet, fresh, stinky, fragrant, spicy.<br><strong>Sound:</strong> loud, quiet, squeaky, crunchy, booming.<br><br>"A soft, fluffy, cuddly teddy bear." "Crunchy, salty, noisy chips."',
                    practice: [
                        { q: 'What word describes a texture — "fresh" or "fluffy"?', a: '"Fluffy" — "fresh" usually describes smell.' }
                    ]
                },
                D: {
                    title: 'Box D: Writing Your Object Description Paragraph',
                    body: 'Stuck? Ask yourself:<br><br>What does it look like? "It is blue and shiny."<br>What shape is it? "It is round and small."<br>How does it feel? "It feels smooth and cool."<br>Does it have a smell? "It smells fresh like lemons."<br>What sound does it make? "It makes a clicking sound."<br>What do you use it for? "I use it when I am thirsty."<br><br>Tip: circle all the adjectives you used — did you use at least 5?',
                    practice: []
                }
            },
            mistakes: [
                { mistake: 'Used only basic adjectives (good, nice, big, small)', fix: 'Try stronger words: wonderful, friendly, enormous, tiny.' },
                { mistake: 'Forgot to use any adjectives', fix: 'Add at least 2-3 adjectives to your paragraph.' },
                { mistake: 'Put adjectives in the wrong order', fix: 'English order: opinion → size → color → noun ("a beautiful big red balloon").' },
                { mistake: 'Repeated the same adjective', fix: 'Use different adjectives: "soft... fluffy... smooth" instead of "soft... soft... soft."' }
            ]
        }
    },
    {
        id: 17,
        title: 'Sounds Around Me',
        quote: 'You are learning to hear punctuation, not just see it.',
        video: 'chapter-17.mp4',
        thinkTalk: [
            'What sounds did the friends hear on their sound walk?',
            'Which punctuation mark matched the frog\'s sudden croak?',
            'What sounds can you hear right now?',
            'Which punctuation mark would match an exciting sound you\'ve heard?'
        ],
        comprehension: { question: 'What sudden sound made everyone jump at the Mirror Pool?', answer: 'A loud frog croak' },
        vocab: { meaning: 'a mark that shows how a sentence should be read', word: 'Punctuation' },
        starter: 'I heard a...',
        storybook: [
            { character: 'aanya', text: 'Aanya climbed through the little wooden door and stopped, closing her eyes to listen. "Do you hear that?" asked Pip, fluttering onto her shoulder. "The wind is whistling through the trees!" Aanya opened her eyes and smiled. "It sounds like a soft, happy song."' },
            { character: null, text: 'Nima glided down from her branch. "Today, let\'s take a sound walk through Lumora," she said. "Listen closely, and tell me what you hear."' },
            { character: 'flame', text: 'They walked past the Clock Tree, and a gentle chime rang out. "Ding, ding, ding!" said Flame. "That was exciting. It should end with an exclamation mark!"' },
            { character: null, text: '"You\'re right," said Nima. "Now listen to this." A soft breeze rustled through Sela\'s leafy arms, making a quiet, papery whisper. "That sound is calm," said Aanya. "I think it needs just a period."' },
            { character: 'pip', text: 'They reached the Mirror Pool, where a frog gave a sudden, loud croak. Everyone jumped. "What was that?" asked Pip, her feathers puffed up in surprise. "A question mark, for sure," laughed Aanya.' },
            { character: 'aanya', text: 'Sela pointed toward the market. "Listen there," she said. Voices called out, pots clanged, and a bell jingled above a shop door. "So many sounds at once," said Aanya. "I would use commas to list them all: bells, voices, and clanging pots."' },
            { character: null, text: 'Nima nodded, pleased. "You are learning to hear punctuation, not just see it. Every sound has its own mark, a calm one, an excited one, a curious one." Flame puffed a small ring of smoke. "I liked the chime best," he said. "It felt like an exclamation mark walking on legs!" Everyone laughed at that.' },
            { character: 'aanya', text: 'As the sun began to set, Aanya sat by the Mirror Pool and wrote in her notebook: The wind whistled. The bell chimed! Did you hear that frog?' }
        ],
        create: {
            challenge: 'Write a short sound poem or story using periods, exclamation marks, question marks, and one line of dialogue.',
            bullets: ['What setting are you writing about?', 'What 3 sounds happen?', 'What punctuation fits each sound?', 'What does someone say out loud?'],
            starters: ['I heard a whistle blow!', '"Let\'s...," said...'],
            target: '4-6 sentences',
            hints: [
                'Which sound is calm and needs a period?',
                'Which sound is exciting and needs an exclamation mark?',
                'Which sound makes you curious and needs a question mark?',
                'What could a character say out loud, in quotation marks?'
            ],
            modelText: [
                'I heard a whistle blow!',
                '"Let\'s line up," said the teacher.',
                'Chairs scraped the floor.',
                'Then, everything went silent.',
                'Why did everyone stop moving?'
            ],
            modelNouns: ['!', '"', '.', '?']
        },
        practice: {
            sortTitle: 'Punctuation Sort',
            sortZones: [
                {
                    id: 'calm',
                    label: 'Calm Statement (.)',
                    hint: 'A telling sentence that just states something.',
                    words: ['I hear a bird.', 'The bell rang.', 'It is quiet.', 'She is listening.']
                },
                {
                    id: 'strong',
                    label: 'Excited or Curious (! / ?)',
                    hint: 'Shows surprise, excitement, or a question.',
                    words: ['Watch out!', 'What was that?', 'That was loud!', 'Did you hear that?']
                }
            ]
        },
        reflection: {
            grammarFocus: 'Punctuation (. ! ? , " ")',
            commonErrors: [
                'Forgetting a period at the end of a statement',
                'Using a period for an exciting sentence instead of an exclamation mark',
                'Using a period for a question instead of a question mark',
                'Putting punctuation outside the quotation marks instead of inside',
                'Forgetting to close quotation marks after dialogue'
            ]
        },
        fixItZone: {
            questions: [
                { text: 'Do you know what punctuation marks are used for?', box: 'A' },
                { text: 'Can you use a period (.) correctly?', box: 'B' },
                { text: 'Can you use an exclamation mark (!) correctly?', box: 'C' },
                { text: 'Can you use a question mark (?) correctly?', box: 'D' },
                { text: 'Can you use quotation marks (" ") for dialogue?', box: 'E' },
                { text: 'Did you write a sound poem or story using proper punctuation?', box: 'F', requiresCreate: true }
            ],
            boxes: {
                A: {
                    title: 'Box A: What is Punctuation?',
                    body: 'Punctuation marks are like traffic signals for reading. They tell you when to stop, pause, be excited, or ask a question.<br><br><strong>.</strong> Period — stop, end of a sentence.<br><strong>!</strong> Exclamation mark — excitement, surprise, strong feeling.<br><strong>?</strong> Question mark — a question is being asked.<br><strong>,</strong> Comma — a small pause.<br><strong>" "</strong> Quotation marks — someone is speaking.',
                    practice: [
                        { q: 'Which mark shows someone is speaking?', a: 'Quotation marks (" ").' }
                    ]
                },
                B: {
                    title: 'Box B: Using Periods (.)',
                    body: 'Use a period at the end of a telling sentence (a statement).<br><br>"I hear a bird singing." "The bell rang loudly." "My friend is sitting next to me."<br><br>When you see a period: take a breath and stop.',
                    practice: [
                        { q: 'What punctuation ends "The class is quiet"?', a: 'A period — it\'s a calm statement.' }
                    ]
                },
                C: {
                    title: 'Box C: Using Exclamation Marks (!)',
                    body: 'Use an exclamation mark for excitement, surprise, or strong feeling.<br><br>"That sound was so loud!" "Watch out!" "I love that song!"<br><br>When you see an exclamation mark: read with excitement.',
                    practice: [
                        { q: 'How should "The bell rang!" be read compared to "The bell rang."?', a: 'With more excitement — the ! shows a stronger feeling.' }
                    ]
                },
                D: {
                    title: 'Box D: Using Question Marks (?)',
                    body: 'Use a question mark at the end of a sentence that asks something.<br><br>"What is that noise?" "Can you hear that?" "Why did the bell ring?"<br><br>When you see a question mark: make your voice go up at the end.',
                    practice: [
                        { q: 'Turn "The bell rang." into a question.', a: '"Did the bell ring?"' }
                    ]
                },
                E: {
                    title: 'Box E: Using Quotation Marks (" ") for Dialogue',
                    body: 'Use quotation marks to show someone is speaking — before the first word and after the last word they say.<br><br>"Come here," said the teacher.<br><br>Periods and commas go INSIDE the quotation marks: "Come here," said the teacher. (not "Come here", said the teacher.)',
                    practice: [
                        { q: 'Where does the comma go in dialogue — inside or outside the quotes?', a: 'Inside: "Come here," said the teacher.' }
                    ]
                },
                F: {
                    title: 'Box F: Writing Your Sound Poem or Story',
                    body: 'Stuck? Try these:<br><br>Start with a sound: "I heard a whistle blow!"<br>Add dialogue: "\'Let\'s line up,\' said the teacher."<br>Add another sound: "Chairs scraped the floor."<br>Add a question: "Why is it so quiet?"<br>End with silence: "Then… everything went silent."<br><br>Tip: read your story aloud — stop at periods, get excited at exclamation marks, raise your voice at question marks.',
                    practice: []
                }
            },
            mistakes: [
                { mistake: 'Forgot a period at the end of a sentence', fix: 'Add a period: "The bell rang."' },
                { mistake: 'Used a period for an exciting sentence', fix: 'Use an exclamation mark: "Watch out!"' },
                { mistake: 'Used a period for a question', fix: 'Use a question mark: "What time is it?"' },
                { mistake: 'Put punctuation outside quotation marks', fix: 'Put it inside: "Hello," she said.' }
            ]
        }
    },
    {
        id: 18,
        title: 'Story Builders',
        quote: 'Sequence words are like stepping stones, guiding the reader from start to end.',
        video: 'chapter-18.mp4',
        thinkTalk: [
            'What was out of order on the scrolls Pip found?',
            'What three sequence words did Aanya use to put the scrolls in order?',
            'What is the beginning, middle, and end of your favourite story?',
            'What sequence word would you use to start your own story?'
        ],
        comprehension: { question: 'What did Flame\'s story say was discovered in the hidden cave?', answer: 'A treasure of shiny gems' },
        vocab: { meaning: 'a word that shows the order events happen in', word: 'Sequence word' },
        starter: 'One day, a...',
        storybook: [
            { character: null, text: 'Nima was perched beside a strange, twisted tree when Aanya found her that afternoon. Its branches were covered in small wooden scrolls. "Welcome to the Story Tree," said Nima. "Every scroll holds a tale, but the words have come loose. Can you help me put one back in order?"' },
            { character: 'pip', text: 'Pip fluttered up and plucked down three scrolls. "This one says, \'I found a shiny stone.\' This one says, \'Suddenly, the stone began to glow.\' And this one says, \'In the end, the stone led me home.\'"' },
            { character: 'aanya', text: '"Those are out of order," said Aanya. "First, you find the stone. Then, something surprising happens. Finally, the story ends."' },
            { character: 'flame', text: 'Flame stretched his wings, knocking a few more scrolls loose. "Oops," he said. "Let me help fix that."' },
            { character: null, text: 'Sela gathered the fallen scrolls carefully. "This one says a lost fox wandered into the forest. That sounds like a beginning." "Then what happens?" asked Pip. "After that," Sela continued, "the fox meets a friendly owl who shows it the way."' },
            { character: 'aanya', text: '"And at last," said Aanya, smiling, "the fox finds its family again." Nima nodded, pleased. "You have just built a whole story: a beginning, a middle, and an end, all connected with sequence words."' },
            { character: 'flame', text: 'Flame puffed out his chest. "I want to try one!" "One day," he began grandly, "a brave dragon discovered a hidden cave. Suddenly, a puzzle blocked his path. In the end, he solved it and found a treasure of shiny gems." Everyone cheered.' },
            { character: null, text: '"See?" said Nima. "First, then, after that, finally. These words are like stepping stones. They guide the reader from the start of your story all the way to the end."' }
        ],
        create: {
            challenge: 'Write a full story with a clear beginning, middle, and end, using sequence words.',
            bullets: ['Who is your character, and where are they?', 'What problem happens in the middle?', 'How is the problem solved?', 'What sequence words did you use?'],
            starters: ['One day, a...', 'Suddenly...'],
            target: '6-8 sentences',
            hints: [
                'What is normal at the beginning, before the problem starts?',
                'What goes wrong, and how does your character feel?',
                'Who or what helps solve the problem?',
                'How does your character feel at the end?'
            ],
            modelText: [
                'One day, a small puppy named Max ran away from home.',
                'Lily, his owner, was very worried, and she searched in the park, but Max was not there.',
                'Then she looked near the river.',
                'Suddenly, she heard a soft bark — Max was hiding behind a bush, scared but safe.',
                'In the end, Lily brought him home, and Max never ran away again.'
            ],
            modelNouns: ['One day', 'Then', 'Suddenly', 'In the end']
        },
        practice: {
            sortTitle: 'Sequence Word Sort',
            sortZones: [
                {
                    id: 'beginning',
                    label: 'Beginning / Middle',
                    hint: 'Starts the story or introduces a change.',
                    words: ['One day', 'First', 'Then', 'Suddenly']
                },
                {
                    id: 'end',
                    label: 'End',
                    hint: 'Wraps up the story.',
                    words: ['Finally', 'At last', 'In the end', 'After that']
                }
            ]
        },
        reflection: {
            grammarFocus: 'Sequence Words (first, then, finally)',
            commonErrors: [
                'Forgetting to introduce the character at the beginning',
                'Forgetting to describe the setting (where the story happens)',
                'Writing a story with no problem — nothing goes wrong',
                'Ending the story abruptly with no clear solution',
                'Missing sequence words entirely (First, Then, Suddenly, Finally)'
            ]
        },
        fixItZone: {
            questions: [
                { text: 'Do you know the 4 ingredients of a good story?', box: 'A' },
                { text: 'Can you identify the character in a story?', box: 'B' },
                { text: 'Can you identify the setting (where it happens)?', box: 'C' },
                { text: 'Can you identify the problem in a story?', box: 'D' },
                { text: 'Can you identify the solution (how it ends)?', box: 'E' },
                { text: 'Did you write a story with a clear beginning, middle, and end?', box: 'F', requiresCreate: true }
            ],
            boxes: {
                A: {
                    title: 'Box A: The 4 Ingredients of a Good Story',
                    body: 'Every good story has four ingredients:<br><br><strong>Character</strong> — who the story is about.<br><strong>Setting</strong> — where and when it happens.<br><strong>Problem</strong> — what goes wrong.<br><strong>Solution</strong> — how the problem is solved.<br><br>No problem = no story. The problem is what makes it interesting!',
                    practice: [
                        { q: 'What makes a story interesting?', a: 'The problem — without one, nothing happens.' }
                    ]
                },
                B: {
                    title: 'Box B: Creating a Character',
                    body: 'Stuck? Try: name your character (Riya, Max, Luna), give them a trait (kind, brave, curious), and give them something they want (to find her lost puppy, to explore the forest).',
                    practice: []
                },
                C: {
                    title: 'Box C: Creating a Setting',
                    body: 'The setting is WHERE and WHEN. Places: a forest, a beach, a school, a spaceship. Times: morning, night, summer, long ago, the future.',
                    practice: []
                },
                D: {
                    title: 'Box D: Creating a Problem',
                    body: 'The problem is the most important part — without it, nothing interesting happens!<br><br>Ideas: lost something, trapped somewhere, needs help, wants something, something breaks.<br><br>Example: "The puppy runs away from home."',
                    practice: [
                        { q: 'Is "Lily has a puppy" a problem?', a: 'No — it\'s calm. A problem is something that goes wrong, like "the puppy runs away."' }
                    ]
                },
                E: {
                    title: 'Box E: Creating a Solution',
                    body: 'The solution is how the problem gets solved. Ideas: the character finds help, is brave, learns something, or fixes the problem.<br><br>Example: "The girl finds the puppy by the river."',
                    practice: []
                },
                F: {
                    title: 'Box F: Writing Your Full Story',
                    body: 'Use sequence words to show the order:<br><br><strong>Beginning:</strong> One day, In the beginning, First — introduce character and setting.<br><strong>Middle:</strong> Then, Suddenly, After that — introduce the problem.<br><strong>End:</strong> Finally, At last, In the end — solve the problem.<br><br><strong>Example:</strong> "One day, a small puppy named Max ran away from home... Suddenly, she heard a soft bark... In the end, Max never ran away again."',
                    practice: []
                }
            },
            mistakes: [
                { mistake: 'Forgot to introduce the character', fix: 'Start with: "There was a boy named..." or "Lily had a puppy named..."' },
                { mistake: 'Forgot to describe where the story happens', fix: 'Add: "They lived in a small village."' },
                { mistake: 'No problem in your story', fix: 'Add something that goes wrong: "Suddenly, the puppy ran away."' },
                { mistake: 'Sequence words are missing', fix: 'Add words like: First, Then, Suddenly, Finally.' }
            ]
        }
    },
    {
        id: 19,
        title: 'Rhyme Time',
        quote: 'Rhyming words share the same ending sound, like sun and fun.',
        video: 'chapter-19.mp4',
        thinkTalk: [
            'What rhymes did Pip, Flame, and Sela say at the Rhyming River?',
            'What rhyming words did the river give back for "sun"?',
            'What word rhymes with "cake"?',
            'What is alliteration, and which line of Flame\'s used it?'
        ],
        comprehension: { question: 'What rhyming words did the river give back when Aanya said "sun"?', answer: 'Fun, run, bun, one' },
        vocab: { meaning: 'a word that sounds the same at the end as another word', word: 'Rhyme' },
        starter: 'I had a dream I flew a kite...',
        storybook: [
            { character: 'aanya', text: 'A soft, bouncy sound drifted through the trees the moment Aanya arrived in Lumora. "Listen," said Nima, gliding down beside her. "That\'s the Rhyming River. Everything that flows through it comes out in rhyme."' },
            { character: 'pip', text: 'Pip zoomed ahead and dipped her beak into the water. "A cat sat on a mat," she chirped. "That sounded funny!"' },
            { character: 'flame', text: 'Flame lowered his big head to the river and took a sip. "A dragon so bright, flew into the light!" he boomed, then laughed at himself. "I like that one."' },
            { character: null, text: 'Sela dipped one leafy toe in and giggled as words bubbled up. "A twig so small, stood proud and tall."' },
            { character: 'aanya', text: 'Aanya knelt beside the water. "Can I try?" "Of course," said Nima. "Just think of a word, and let the river answer." Aanya cupped some water in her hands. "Sun," she whispered. The water rippled and shimmered, and a voice seemed to hum back: "Fun. Run. Bun. One."' },
            { character: 'aanya', text: 'Aanya laughed. "It\'s giving me rhymes!" "That\'s the magic of rhythm and sound," said Nima. "Rhyming words share the same ending sound, like sun and fun. Poets use them to make their words dance."' },
            { character: 'flame', text: 'Flame flicked his tail, splashing everyone. "Silly, splashy, super Flame!" he roared happily. "That\'s alliteration," said Nima with a smile. "Three words starting with the same sound."' },
            { character: 'pip', text: 'Pip fluttered around them, singing a little tune she made up on the spot: "The river flows, the river sings, it rhymes with everything!" Aanya pulled out her notebook and wrote down every rhyme she had heard that day.' }
        ],
        create: {
            challenge: 'Write a short 4-line poem using rhyming words.',
            bullets: ['What is your poem about — a pet, a dream, nature, a silly moment?', 'What word will you rhyme?', 'Do lines 2 and 4 (or 1 and 2) rhyme?', 'Does your poem sound good read aloud?'],
            starters: ['I had a dream I flew a kite...', 'My little...'],
            target: '4 lines',
            hints: [
                'What word could end your first line?',
                'What word rhymes with that ending?',
                'Does your rhyme still make sense?',
                'Can you read it aloud with a rhythm?'
            ],
            modelText: [
                'I had a dream I flew a kite,',
                'It took me far into the night.',
                'I saw the stars so big and bright,',
                'And everything was pure delight.'
            ],
            modelNouns: ['kite', 'night', 'bright', 'delight']
        },
        practice: {
            sortTitle: 'Rhyme Sort',
            sortZones: [
                {
                    id: 'at',
                    label: 'Rhymes with "cat"',
                    hint: 'Ends with the "-at" sound.',
                    words: ['hat', 'mat', 'bat', 'sat']
                },
                {
                    id: 'ay',
                    label: 'Rhymes with "day"',
                    hint: 'Ends with the "-ay" sound.',
                    words: ['play', 'say', 'way', 'may']
                }
            ]
        },
        reflection: {
            grammarFocus: 'Rhyming Words and Couplets',
            commonErrors: [
                'Choosing words that don\'t actually rhyme (e.g. "cake" and "cup")',
                'Writing a rhyme that doesn\'t make sense just to force the sound to match',
                'Writing only 2 lines instead of the full 4-line poem',
                'Lines with very different lengths that break the rhythm',
                'Forgetting to rhyme the ending words at all'
            ]
        },
        fixItZone: {
            questions: [
                { text: 'Do you know what a rhyme is?', box: 'A' },
                { text: 'Can you identify words that rhyme?', box: 'B' },
                { text: 'Can you write a rhyming pair (two words that rhyme)?', box: 'C' },
                { text: 'Do you know what a couplet is?', box: 'D' },
                { text: 'Did you write a 4-line rhyming poem?', box: 'E', requiresCreate: true }
            ],
            boxes: {
                A: {
                    title: 'Box A: What is a Rhyme?',
                    body: 'Rhyming words sound the same at the END.<br><br>cat / hat → yes, both end with "-at."<br>day / play → yes, both end with "-ay."<br>cake / cup → no, "ake" and "up" are different sounds.<br><br>Tip: say the words aloud — if the ending sound matches, they rhyme.',
                    practice: [
                        { q: 'Do "tree" and "car" rhyme?', a: 'No — "ee" and "ar" are different ending sounds.' }
                    ]
                },
                B: {
                    title: 'Box B: Finding Rhyming Words',
                    body: 'cat → bat, hat, mat, rat, sat.<br>day → play, say, way, may.<br>sun → bun, fun, run, son.<br>light → bright, night, kite, white.<br>ball → tall, small, call, fall.',
                    practice: [
                        { q: 'Name a word that rhymes with "light."', a: 'Night, bright, kite, or white.' }
                    ]
                },
                C: {
                    title: 'Box C: Writing Rhyming Pairs',
                    body: 'A rhyming pair is two words that sound the same at the end.<br><br>cake → bake, lake, make, snake.<br>tree → bee, see, three, free.<br><br>Practice writing 3 pairs of your own, then say them aloud to check they really rhyme.',
                    practice: []
                },
                D: {
                    title: 'Box D: What is a Couplet?',
                    body: 'A couplet is a two-line poem where the last words of each line rhyme.<br><br>"I saw a frog hop in the rain, it danced around the windowpane!"<br><br>Line 1 ends in "rain," line 2 ends in "pane" — same ending sound.',
                    practice: [
                        { q: 'In a couplet, which words need to rhyme?', a: 'The last word of each of the two lines.' }
                    ]
                },
                E: {
                    title: 'Box E: Writing Your 4-Line Rhyming Poem',
                    body: 'A 4-line poem can rhyme in different patterns — the most common is lines 2 and 4 rhyming.<br><br><strong>Example:</strong> "I had a dream I flew a kite, it took me far into the night. I saw the stars so big and bright, and everything was pure delight."<br><br>Stuck? Can\'t find a rhyme? Try a different word or ask a friend. Only have 2 lines? That\'s a couplet — add 2 more!',
                    practice: []
                }
            },
            mistakes: [
                { mistake: 'Chose words that don\'t rhyme (cake/cup)', fix: 'Say them aloud — do they sound the same? If not, try again.' },
                { mistake: 'The rhyme doesn\'t make sense', fix: 'Change the word order or choose a different rhyming word that still makes sense.' },
                { mistake: 'Only 2 lines in your poem', fix: 'That\'s a couplet — add 2 more lines!' },
                { mistake: 'Forgot to rhyme at all', fix: 'Change the last word of a line so it rhymes with another line.' }
            ]
        }
    },
    {
        id: 20,
        title: 'News Room',
        quote: 'This just in: your voice matters.',
        video: 'chapter-20.mp4',
        thinkTalk: [
            'What news story did the young reporter share in the video?',
            'How did they make sure their report was clear?',
            'What news would you like to report from your own life or school?',
            'Why is it important to report things clearly and honestly?'
        ],
        comprehension: { question: 'What made the news report easy to understand?', answer: 'It answered who, what, when and where' },
        vocab: { meaning: 'to share information about something that happened', word: 'Report' },
        starter: 'This just in:',
        storybook: [
            { character: 'aanya', text: 'Aanya arrived in Lumora holding a notebook and a pencil. Today, she had a new job. "I\'m a reporter!" she announced. "I\'m writing a story for the Lumora Times."' },
            { character: null, text: 'Nima swooped down and landed on a branch. "Wonderful. What is your first question?" Aanya thought for a moment. "Who lives at the top of the Clock Tree?" "A family of chimes," said Nima with a smile. "They ring every hour."' },
            { character: 'aanya', text: 'Aanya wrote quickly in her notebook. "What do they eat?" "Mostly starlight," Nima chuckled. "And a little morning dew."' },
            { character: 'pip', text: 'Pip fluttered down, eager to be interviewed too. "Ask me something! Ask me something!" "All right," said Aanya. "Where do you sleep at night?" "In the tallest branch of the Whispering Willow," Pip chirped proudly. "When do you wake up?" "The moment the sun peeks over the hills!"' },
            { character: 'flame', text: 'Flame stomped over, smoke curling from his nose. "Why hasn\'t anyone asked me a question yet?" Aanya laughed. "Why do you breathe fire, Flame?" "To keep my friends warm on chilly nights," he said, puffing out his chest.' },
            { character: null, text: 'Sela rustled closer, her leaves swaying. "How do I grow new leaves every spring?" she asked, answering her own question before Aanya could. "Magic, of course!" Everyone laughed.' },
            { character: 'aanya', text: 'Aanya flipped through her notebook, reading her notes aloud. "Who, what, where, when, why, how. I asked every question word today!" "That\'s what makes a good reporter," said Nima. "Curious questions lead to wonderful answers."' },
            { character: 'flame', text: 'Aanya tucked her pencil behind her ear. "Tomorrow, I\'ll interview the fish in the Mirror Pool." "Now that," said Flame, grinning, "sounds like a great story."' }
        ],
        create: {
            challenge: 'Write a short news report about something interesting that happened at home or school.',
            bullets: ['What happened?', 'Who was involved?', 'When and where did it happen?', 'Why does it matter?'],
            starters: ['This just in:', 'Breaking news from my classroom:'],
            target: '5-6 sentences',
            hints: [
                'Have you answered who, what, when and where?',
                'What would a reporter ask to make the story clearer?',
                'What is the most interesting part of your news?',
                'How would you end your report?'
            ],
            modelText: [
                'Today something exciting happened at our school.',
                'A famous author arrived for a surprise visit.',
                '"Who is it?" asked a student. The teacher smiled and said, "It is a surprise!"',
                '"How did you become a writer?" asked Riya. The author said, "I loved reading as a child."',
                'Everyone asked questions and listened carefully — it was an unforgettable day.'
            ],
            modelNouns: ['Who', 'What', 'How']
        },
        practice: {
            sortTitle: 'Question Word Sort',
            sortZones: [
                {
                    id: 'person-place',
                    label: 'Person or Place',
                    hint: 'Who asks about a person; where asks about a place.',
                    words: ['Who', 'Where', 'Who is', 'Where do']
                },
                {
                    id: 'reason-way',
                    label: 'Reason or Way',
                    hint: 'Why asks for a reason; how asks for a method.',
                    words: ['Why', 'How', 'Why did', 'How do']
                }
            ]
        },
        reflection: {
            grammarFocus: 'Question Words (who, what, where, when, why, how)',
            commonErrors: [
                'Forgetting the question mark at the end',
                'Using the wrong question word (e.g. "Who is your favourite colour?" instead of "What")',
                'Writing an incomplete question ("Where you live?" instead of "Where do you live?")',
                'Writing a statement instead of a real question',
                'Confusing "why" answers (which need "because") with other question types'
            ]
        },
        fixItZone: {
            questions: [
                { text: 'Do you know what question words are?', box: 'A' },
                { text: 'Can you use "who" and "what" correctly?', box: 'B' },
                { text: 'Can you use "where" and "when" correctly?', box: 'C' },
                { text: 'Can you use "why" and "how" correctly?', box: 'D' },
                { text: 'Did you write a news report using question words?', box: 'E', requiresCreate: true }
            ],
            boxes: {
                A: {
                    title: 'Box A: What are Question Words?',
                    body: 'Question words help us ask for specific information. Each one asks for a different type of answer.<br><br><strong>Who</strong> — a person. <strong>What</strong> — a thing or idea. <strong>Where</strong> — a place. <strong>When</strong> — a time. <strong>Why</strong> — a reason. <strong>How</strong> — a method or way.<br><br>Question words are the first word in a question sentence.',
                    practice: [
                        { q: 'Which question word asks about a place?', a: '"Where."' }
                    ]
                },
                B: {
                    title: 'Box B: Using "Who" and "What"',
                    body: '<strong>Who</strong> — "Who is your best friend?" → "My best friend is Riya."<br><strong>What</strong> — "What is your favourite colour?" → "My favourite colour is blue."<br><br>Sentence frames: "Who is ___?" "What did you ___?"',
                    practice: [
                        { q: 'Which question word fits: "___ is your favourite teacher?"', a: '"Who" — it asks about a person.' }
                    ]
                },
                C: {
                    title: 'Box C: Using "Where" and "When"',
                    body: '<strong>Where</strong> — "Where do you live?" → "I live in Mumbai."<br><strong>When</strong> — "When is your birthday?" → "My birthday is in May."<br><br>Sentence frames: "Where is ___?" "When do you ___?"',
                    practice: [
                        { q: 'Which question word fits: "___ is the library?"', a: '"Where" — it asks about a place.' }
                    ]
                },
                D: {
                    title: 'Box D: Using "Why" and "How"',
                    body: '<strong>Why</strong> — "Why are you smiling?" → "I am smiling because I am happy." (Answers to "why" often use "because.")<br><strong>How</strong> — "How do you make a sandwich?" → "First, I get bread. Then I add cheese."<br><br>Sentence frames: "Why did you ___?" "How do you ___?"',
                    practice: [
                        { q: 'What word usually appears in the answer to a "why" question?', a: '"Because."' }
                    ]
                },
                E: {
                    title: 'Box E: Writing Your News Report',
                    body: 'A news report tells about something exciting, including quotes with question words.<br><br><strong>Opening:</strong> what happened. <strong>Quotes:</strong> someone asks a question, someone answers. <strong>Closing:</strong> how it ended.<br><br><strong>Example:</strong> "Today something exciting happened at our school. \'Who is it?\' asked a student. The teacher said, \'It is a surprise!\'"',
                    practice: []
                }
            },
            mistakes: [
                { mistake: 'Forgot the question mark', fix: 'Add ? at the end: "What is your name?"' },
                { mistake: 'Used the wrong question word ("Who is your favourite colour?")', fix: '"What is your favourite colour?" — colour is a thing, not a person.' },
                { mistake: 'Question is not a complete sentence ("Where you live?")', fix: 'Add "do": "Where do you live?"' },
                { mistake: 'Used a statement instead of a question', fix: '"Tell me your name" → "What is your name?"' }
            ]
        }
    },
    {
        id: 21,
        title: 'I Can Explain',
        quote: 'Curiosity explained, one question at a time.',
        video: 'chapter-21.mp4',
        thinkTalk: [
            'What did the character explain in the video?',
            'How did they make a tricky idea easy to understand?',
            'What is something you could explain well to a friend?',
            'Why do good explanations use simple words?'
        ],
        comprehension: { question: 'How did the character check their explanation made sense?', answer: 'By asking if there were questions' },
        vocab: { meaning: 'to make something clear and easy to understand', word: 'Explain' },
        starter: 'Let me explain how...',
        storybook: [
            { character: null, text: 'Nima was sitting beneath an odd little tree covered in question marks instead of leaves when Aanya found her. "This is the Why Tree," said Nima. "Every question mark holds a mystery. Can you help me solve one?"' },
            { character: 'aanya', text: 'Aanya reached up and picked a question mark. It read: Why did the pond overflow? "Hmm," said Aanya. "Maybe it rained a lot?"' },
            { character: 'pip', text: 'Just then, Pip flew by, soaking wet. "It rained all night," she chirped, "so the pond filled up and spilled onto the path!" "There you go," said Nima. "It rained, so the pond overflowed. That\'s cause and effect. The rain is the cause, and the overflow is the effect."' },
            { character: 'flame', text: 'Flame lumbered over, dragging a scorched branch behind him. "Why is this branch black?" he asked, pointing at it. Sela examined it closely. "Because you breathed fire near it yesterday," she said, giggling. "Oh," said Flame, a little embarrassed. "I guess my fire causes things to happen, even when I don\'t mean it to."' },
            { character: 'aanya', text: 'Aanya picked another question mark from the tree. It read: Why did the flowers bloom early this year? "Since the days have been warmer," said Nima, "the flowers bloomed sooner than usual." Aanya smiled and wrote the sentence in her notebook. "Since the days were warm, the flowers bloomed early."' },
            { character: null, text: '"You are learning quickly," said Nima. "Every cause has an effect, and every effect has a cause. That is how the whole world connects."' },
            { character: 'pip', text: 'Pip landed on Aanya\'s shoulder. "Try one more!" Aanya thought hard. "I feel happy because I am with my friends in Lumora." "Perfect," said Nima, her eyes twinkling. "That is the best kind of cause and effect there is."' },
            { character: null, text: 'The Why Tree rustled softly, as if it agreed, and one more question mark drifted gently to the ground.' }
        ],
        create: {
            challenge: "Write a how-to explainer that explains why each step matters, using cause and effect.",
            bullets: ['What are you explaining how to do?', 'What happens first, and why?', 'What happens next, and why?', 'How does it end?'],
            starters: ['Let me explain how...', 'First, I... because...'],
            target: '5-6 sentences',
            hints: [
                'Would a younger student understand your explanation?',
                'What step is easy to forget?',
                'Which word shows a reason — "because"?',
                'Which word shows a result — "so"?'
            ],
            modelText: [
                'I can make a sandwich.',
                'First, I get the bread because I need something to hold the filling.',
                'Then I add cheese because it makes the sandwich tasty.',
                'Next, I add lettuce because it adds a nice crunch.',
                'Finally, I put the top bread on, so the sandwich is complete.'
            ],
            modelNouns: ['because', 'so']
        },
        practice: {
            sortTitle: 'Cause or Effect?',
            sortZones: [
                {
                    id: 'cause',
                    label: 'Cause (the reason)',
                    hint: 'Why something happened — comes first.',
                    words: ['It rained', 'I was hungry', 'I studied hard', 'I was tired']
                },
                {
                    id: 'effect',
                    label: 'Effect (what happened)',
                    hint: 'The result — happens after the cause.',
                    words: ['I used an umbrella', 'I ate lunch', 'I passed the test', 'I took a nap']
                }
            ]
        },
        reflection: {
            grammarFocus: 'Cause-Effect Words (because, so, since, therefore)',
            commonErrors: [
                'Confusing cause and effect (reversing which happened first)',
                'Using "because" and "so" together in the same sentence',
                'Forgetting the comma before "so"',
                'Writing a cause and effect that don\'t logically match',
                'Using "so" to introduce a reason instead of a result'
            ]
        },
        fixItZone: {
            questions: [
                { text: 'Do you know what cause and effect means?', box: 'A' },
                { text: 'Can you identify the cause (why something happens)?', box: 'B' },
                { text: 'Can you identify the effect (what happens)?', box: 'C' },
                { text: 'Can you use "because" and "so" correctly?', box: 'D' },
                { text: 'Did you write a "how-to" explainer using cause and effect?', box: 'E', requiresCreate: true }
            ],
            boxes: {
                A: {
                    title: 'Box A: What is Cause and Effect?',
                    body: 'Cause is WHY something happens. Effect is WHAT happens.<br><br>"It rained, so I used an umbrella." → Cause: it rained. Effect: I used an umbrella.<br><br>Remember: cause comes first in time, effect happens AFTER.',
                    practice: [
                        { q: 'In "I was hungry, so I ate lunch," what is the cause?', a: '"I was hungry" — it\'s the reason.' }
                    ]
                },
                B: {
                    title: 'Box B: Finding the Cause (The WHY)',
                    body: 'The cause answers "Why did this happen?"<br><br>"Why did you use an umbrella?" → "Because it was raining."<br><br>Signal words for cause: because, since, the reason is.',
                    practice: [
                        { q: 'What word signals a cause is coming?', a: '"Because" (or "since").' }
                    ]
                },
                C: {
                    title: 'Box C: Finding the Effect (The WHAT)',
                    body: 'The effect answers "What happened?"<br><br>"It rained" (cause) → "I used an umbrella." (effect)<br><br>Signal words for effect: so, therefore, as a result.',
                    practice: [
                        { q: 'What word signals an effect is coming?', a: '"So" (or "therefore").' }
                    ]
                },
                D: {
                    title: 'Box D: Using "Because" and "So"',
                    body: '<strong>Because</strong> gives the reason (cause). Formula: Effect + because + cause. "I stayed inside because it was raining."<br><strong>So</strong> shows the result (effect). Formula: Cause + so + effect. "It was raining, so I stayed inside."<br><br>Tip: place a comma before "so."',
                    practice: [
                        { q: 'Join: "It was cold. I wore a jacket." using "so".', a: '"It was cold, so I wore a jacket."' }
                    ]
                },
                E: {
                    title: 'Box E: Writing Your How-To Explainer',
                    body: 'A how-to explainer teaches someone how to do something, explaining WHY each step matters.<br><br>"First, I get the bread because I need something to hold the filling. Then I add cheese because it makes the sandwich tasty. Finally, I put the top bread on, so the sandwich is complete."',
                    practice: []
                }
            },
            mistakes: [
                { mistake: 'Confused cause and effect (reversed them)', fix: 'Ask: did this happen first (cause) or second (effect)?' },
                { mistake: 'Used "because" and "so" in the same sentence', fix: 'Remove one: "Because it rained, I stayed inside" OR "It rained, so I stayed inside."' },
                { mistake: 'Forgot the comma before "so"', fix: '"It rained, so I stayed inside."' },
                { mistake: "The cause and effect don't match", fix: '"I ate because I was tired" doesn\'t make sense → "I ate because I was hungry."' }
            ]
        }
    },
    {
        id: 22,
        title: 'People Who Inspire Me',
        quote: 'Everyone needs a hero.',
        video: 'chapter-22.mp4',
        thinkTalk: [
            'Who inspired the character in the video?',
            'What did that person do that was inspiring?',
            'Who is someone who inspires you?',
            'What would you like to learn from them?'
        ],
        comprehension: { question: 'What quality made the person in the video inspiring?', answer: 'Courage and kindness' },
        vocab: { meaning: 'someone who encourages you to do your best', word: 'Inspire' },
        starter: 'Someone who inspires me is...',
        storybook: [
            { character: null, text: 'Nima was sitting beside an old stone statue Aanya had never noticed before. "Who is this?" Aanya asked, looking up at the statue of a small, winged creature holding a lantern. "That is Toli," said Nima. "She was the bravest firefly who ever lived in Lumora."' },
            { character: 'aanya', text: '"Tell me about her," said Aanya, sitting down. Nima\'s eyes glowed softly as she began. "Toli was born near the Whispering Willow. When she was young, a terrible storm covered Lumora in darkness. The other creatures were scared, but Toli lit her tiny lantern and flew through the whole forest, guiding everyone home."' },
            { character: 'pip', text: 'Pip fluttered closer, listening carefully. "What happened next?" "She helped rebuild the market after the storm," said Nima. "She worked every day for a whole season, and she never once complained."' },
            { character: 'flame', text: 'Flame lowered his head. "I wish I could have met her." "She lived a long and happy life," Nima continued, "and when she grew old, she taught young fireflies how to light their own lanterns bravely."' },
            { character: null, text: 'Sela touched the stone gently. "That is why they built this statue."' },
            { character: 'aanya', text: 'Aanya opened her notebook and began to write. "Toli was born near the Whispering Willow. She lit her lantern during a storm. She helped rebuild the market. She taught young fireflies to be brave." "You just wrote her biography," said Nima, smiling.' },
            { character: 'aanya', text: '"I did!" said Aanya, surprised. "I used was, lit, helped, and taught. All past tense, because it already happened." Pip landed on the statue\'s lantern. "I admire her so much." "Everyone in Lumora does," said Nima. "That is why we remember her story and tell it again and again."' },
            { character: 'aanya', text: 'Aanya closed her notebook and looked up at Toli\'s tiny stone face. She hoped that someday, her own story might inspire someone too.' }
        ],
        create: {
            challenge: 'Write a short biography of someone who inspires you, using past tense.',
            bullets: ['Who are they, and when/where were they born?', 'What did they study or learn?', 'What did they achieve?', 'Why do you admire them?'],
            starters: ['Someone who inspires me is...', '...was born...'],
            target: '5-6 sentences',
            hints: [
                'What did this person do that was brave or kind?',
                'What past tense verbs describe their life?',
                'What would you thank them for?',
                'How do they inspire you to act?'
            ],
            modelText: [
                'Kalpana Chawla was a brave astronaut.',
                'She was born in India in 1962.',
                'She studied science and engineering.',
                'She worked hard and became an astronaut, and she went to space on a space shuttle.',
                'I admire her because she never gave up on her dreams.'
            ],
            modelNouns: ['was', 'studied', 'became', 'went', 'admire']
        },
        practice: {
            sortTitle: 'Past Tense Biography Sort',
            sortZones: [
                {
                    id: 'regular',
                    label: 'Regular (+ed)',
                    hint: 'Just add -ed to the base verb.',
                    words: ['lived', 'helped', 'studied', 'worked']
                },
                {
                    id: 'irregular',
                    label: 'Irregular (changes form)',
                    hint: 'The whole word changes.',
                    words: ['was', 'became', 'won', 'wrote']
                }
            ]
        },
        reflection: {
            grammarFocus: 'Past Simple Tense in Biographies',
            commonErrors: [
                'Using present tense for biographies ("She is born" instead of "She was born")',
                'Forgetting "was" or "were" ("She born in India" instead of "She was born in India")',
                'Adding -ed to irregular verbs ("She writed a book" instead of "She wrote a book")',
                'Mixing present and past tense within the same biography',
                'Writing a biography that is too short (2-3 sentences) without achievements or reasons for admiration'
            ]
        },
        fixItZone: {
            questions: [
                { text: 'Do you know who inspires you and why?', box: 'A' },
                { text: 'Do you know what past tense is?', box: 'B' },
                { text: 'Can you use "was" and "were" correctly?', box: 'C' },
                { text: 'Can you use past tense verbs (lived, helped, studied, won)?', box: 'D' },
                { text: 'Did you write a biography using past tense?', box: 'E', requiresCreate: true }
            ],
            boxes: {
                A: {
                    title: 'Box A: Finding Someone Who Inspires You',
                    body: 'An inspiring person is someone you look up to. Ask yourself: who helps you when you\'re stuck? Who works hard every day? Who has achieved something you admire?<br><br>Examples: family (mother, grandmother), teachers, scientists (Kalpana Chawla, Marie Curie), athletes, historical figures (Mahatma Gandhi), social workers.',
                    practice: []
                },
                B: {
                    title: 'Box B: What is Past Tense?',
                    body: 'Past tense tells us something already happened.<br><br>"I live in Mumbai" → "I lived in Delhi before."<br>"She helps people" → "She helped many people."<br><br>Biographies use past tense because we are talking about what someone DID in their life.',
                    practice: [
                        { q: 'Why do biographies use past tense?', a: "Because they describe what someone already did in their life." }
                    ]
                },
                C: {
                    title: 'Box C: Using "Was" and "Were"',
                    body: '"Was" and "were" are the past tense forms of "is" and "are."<br><br><strong>was</strong> — for one person/thing (he, she, it): "She was a doctor."<br><strong>were</strong> — for more than one (they, we, you): "They were teachers."<br><br>"Kalpana Chawla was a brave astronaut." "Her parents were very supportive."',
                    practice: [
                        { q: 'Fill in: "They ___ teachers." (was/were)', a: '"Were" — they is plural.' }
                    ]
                },
                D: {
                    title: 'Box D: Using Past Tense Verbs in Biographies',
                    body: 'live → lived, help → helped, study → studied, win → won, teach → taught, write → wrote, build → built, become → became.<br><br>Common irregular verbs: go → went, see → saw, eat → ate, begin → began, break → broke, bring → brought, buy → bought.',
                    practice: [
                        { q: 'What is the past tense of "become"?', a: '"Became" — it\'s irregular.' }
                    ]
                },
                E: {
                    title: 'Box E: Writing Your Biography Paragraph',
                    body: 'Structure: Introduction (who they are/were), Birth (when/where born), Education (what they studied), Achievements (what they did), Why inspiring (why they matter to you).<br><br><strong>Example:</strong> "Kalpana Chawla was a brave astronaut. She was born in India in 1962. She studied science and engineering. She went to space. I admire her because she never gave up."',
                    practice: []
                }
            },
            mistakes: [
                { mistake: 'Used present tense ("She is born")', fix: 'Change to past: "She was born."' },
                { mistake: 'Forgot "was" or "were" ("She born in India")', fix: 'Add "was": "She was born in India."' },
                { mistake: 'Added -ed to an irregular verb ("She writed a book")', fix: 'Use the correct irregular form: "She wrote a book."' },
                { mistake: 'The biography is too short (2-3 sentences)', fix: 'Add more: where did they study? What did they achieve? Why do you admire them?' }
            ]
        }
    },
    {
        id: 23,
        title: 'I Saw It!',
        quote: 'Look closely, tell clearly.',
        video: 'chapter-23.mp4',
        thinkTalk: [
            'What did the character see and describe in the video?',
            'What details helped you picture the scene?',
            'What is something interesting you saw recently?',
            'Why is it helpful to describe things with details?'
        ],
        comprehension: { question: 'What senses did the character use to describe the scene?', answer: 'Sight, sound and smell' },
        vocab: { meaning: 'to tell what someone said, without quotation marks', word: 'Reported speech' },
        starter: 'Sela said that...',
        storybook: [
            { character: 'pip', text: 'Excited chattering drifted from the Mirror Pool the moment Aanya arrived. Pip was zooming in circles. "You will not believe what happened!" Pip chirped. "What?" asked Aanya. "Tell me!" "Well," said Pip, catching her breath, "Sela said, \'I found a hidden path behind the willow tree!\'"' },
            { character: 'aanya', text: 'Aanya\'s eyes widened. "So Sela said that she found a hidden path behind the willow tree?" "Exactly!" said Pip. "You reported it perfectly."' },
            { character: null, text: 'Nima glided down and settled beside them. "What is all this excitement about?" "Sela found a hidden path," Aanya explained. "She said that it led somewhere new." "Interesting," said Nima. "Let\'s go ask her about it ourselves."' },
            { character: null, text: 'They found Sela near the willow tree, her leafy arms trembling with excitement. "I am so happy right now!" Sela announced. Aanya turned to Nima. "Sela said that she was happy." "Well done," said Nima. "You changed am to was, just like a true reporter."' },
            { character: 'flame', text: 'Flame stomped over, curious. "What did I miss?" "Sela found a path," said Pip. "And Aanya keeps turning everything into reported speech!" Flame grinned. "Let me try. I am hungry for berries." Aanya laughed. "Flame said that he was hungry for berries." "Perfect," said Nima.' },
            { character: null, text: 'They followed Sela down the hidden path, which wound through tall ferns and glowing mushrooms. At the end, they found a small clearing filled with soft, silver flowers.' },
            { character: 'aanya', text: '"We are amazed!" the whole group said together, looking around. Aanya smiled and wrote in her notebook: They said that they were amazed.' },
            { character: 'aanya', text: '"I think," said Nima, "you have learned to catch every word and carry it forward, exactly as reported speech should." Aanya nodded proudly. She could not wait to report the rest of their adventure too.' }
        ],
        create: {
            challenge: 'Write a short news report about something you saw, using reported speech for what people said.',
            bullets: ['What happened, and where?', 'What did one person say?', 'What did another person say?', 'How did it end?'],
            starters: ['Today something strange happened at...', 'A student said that...'],
            target: '5-6 sentences',
            hints: [
                'Remember: no quotation marks in reported speech.',
                'Did you change "am/is" to "was" and "are" to "were"?',
                'Did you change "I" to "he/she" where needed?',
                'How did everyone feel at the end?'
            ],
            modelText: [
                'Today something strange happened at recess.',
                'A student said that she saw a mysterious box near the swings.',
                'Another student said that the box was making a strange noise.',
                'The teacher said that everyone should stay back for safety.',
                'The students said that they were relieved and excited when it turned out to be a science project.'
            ],
            modelNouns: ['said that', 'was', 'were']
        },
        practice: {
            sortTitle: 'Direct vs Reported Speech Sort',
            sortZones: [
                {
                    id: 'direct',
                    label: 'Direct Speech',
                    hint: 'The exact words, in quotation marks.',
                    words: ['"I am tired," she said.', '"We are ready," they said.', '"It is raining," he said.', '"I am happy," said Riya.']
                },
                {
                    id: 'reported',
                    label: 'Reported Speech',
                    hint: 'Telling what was said, no quotation marks.',
                    words: ['She said that she was tired.', 'They said that they were ready.', 'He said that it was raining.', 'Riya said that she was happy.']
                }
            ]
        },
        reflection: {
            grammarFocus: 'Reported Speech (am/is → was, are → were)',
            commonErrors: [
                'Keeping the quotation marks in reported speech',
                'Forgetting to change the verb ("am/is" should become "was")',
                'Using the wrong pronoun (keeping "I" instead of changing to "he/she")',
                'Using both "that" and quotation marks together',
                'Changing a verb that was already in past tense'
            ]
        },
        fixItZone: {
            questions: [
                { text: 'Do you know what reported speech is?', box: 'A' },
                { text: 'Can you change "I am" and "We are" to reported speech?', box: 'B' },
                { text: 'Can you change "She is / He is / It is" to reported speech?', box: 'C' },
                { text: 'Do you know to remove quotation marks?', box: 'D' },
                { text: 'Did you write a news report using reported speech?', box: 'E', requiresCreate: true }
            ],
            boxes: {
                A: {
                    title: 'Box A: What is Reported Speech?',
                    body: 'Reported speech is when you tell someone what another person said — WITHOUT quotation marks.<br><br>Meera said, "I love chocolate." → Meera said that she loved chocolate.<br><br>Changes to make: remove quotation marks, change the verb (am/is → was, are → were), change the pronoun if needed (I → he/she), and add "that."',
                    practice: [
                        { q: 'What punctuation do you remove in reported speech?', a: 'Quotation marks.' }
                    ]
                },
                B: {
                    title: 'Box B: Changing "I am" and "We are"',
                    body: '"I am..." → "he/she was...". "I am happy," said Riya. → Riya said that she was happy.<br><br>"We are..." → "they were...". "We are ready," said the children. → The children said that they were ready.',
                    practice: [
                        { q: 'Report this: "I am tired," said Raj.', a: 'Raj said that he was tired.' }
                    ]
                },
                C: {
                    title: 'Box C: Changing "She is / He is / It is"',
                    body: 'Change "is" to "was." "She is late," said the teacher. → The teacher said that she was late. "It is raining," said the man. → The man said that it was raining.',
                    practice: [
                        { q: 'Report this: "It is raining," said the man.', a: 'The man said that it was raining.' }
                    ]
                },
                D: {
                    title: 'Box D: Removing Quotation Marks',
                    body: 'In reported speech, quotation marks are ALWAYS removed.<br><br>"I am happy," she said. → She said that she was happy.<br><br>Common mistake: "She said that \'she was happy\'" — don\'t keep the quotes inside! Just write: She said that she was happy.',
                    practice: []
                },
                E: {
                    title: 'Box E: Writing Your News Report with Reported Speech',
                    body: 'Structure: Opening (what happened), reported speech from 1-2 people, closing (how it ended).<br><br><strong>Example:</strong> "Today something strange happened at recess. A student said that she saw a mysterious box. The teacher said that everyone should stay back. The students said that they were relieved and excited." Use "said that" to introduce reported speech.',
                    practice: []
                }
            },
            mistakes: [
                { mistake: 'Kept quotation marks in reported speech', fix: 'Remove them: "She said that she was happy" (no quotes).' },
                { mistake: 'Forgot to change the verb ("I am" → "she is")', fix: 'Change to past: "she was."' },
                { mistake: 'Used the wrong pronoun ("I am happy," said Raj → "Raj said that I was happy")', fix: 'Change to "he": "Raj said that he was happy."' },
                { mistake: 'Used both "that" and quotation marks', fix: 'Choose one — reported speech has no quotes: "She said that she was happy."' }
            ]
        }
    },
    {
        id: 24,
        title: 'My Year in Review',
        quote: 'One year, countless stories.',
        video: 'chapter-24.mp4',
        thinkTalk: [
            'What moments did the character look back on in the video?',
            'How had the character changed over the year?',
            'What is your favourite memory from this year?',
            "What are you proud of from this year's journey?"
        ],
        comprehension: { question: 'What did Aanya say she was proud of learning this year?', answer: 'Writing her own stories, not just filling in blanks' },
        vocab: { meaning: 'to look back and think about something', word: 'Reflect' },
        starter: 'Dear Future Me,',
        storybook: [
            { character: 'aanya', text: 'Aanya climbed through the little wooden door one last time this year and gasped. The whole of Lumora was decorated with ribbons, lanterns, and glowing flowers. "What is all this?" she asked.' },
            { character: null, text: 'Nima glided down, her feathers catching the light. "A celebration, for you. You have learned so much this year, nouns, verbs, questions, rhymes, and even reported speech. We wanted to celebrate your journey."' },
            { character: 'pip', text: 'Pip zoomed around her in happy circles. "Remember when you didn\'t know what a conjunction was? Now you use them every day!"' },
            { character: null, text: '"And remember the Rhyming River?" added Sela, swaying gently. "You turned every word into a rhyme that day."' },
            { character: 'flame', text: 'Flame puffed out a warm, glowing breath. "I still remember your first weather poem. It made me proud, and I am a dragon who is hard to impress."' },
            { character: 'aanya', text: 'Aanya laughed, feeling her heart grow warm. "I remember all of it. The market, the Clock Tree, the Story Tree, the Why Tree. Every part of Lumora taught me something."' },
            { character: 'aanya', text: 'Nima settled beside her. "Now it is your turn to share. Tell us one thing you are proud of." Aanya thought for a moment. "I am proud that I learned to write my own stories, not just fill in blanks, but create whole worlds."' },
            { character: 'pip', text: '"Two Stars and a Wish," said Pip. "We loved your stories, and we loved how brave you became. Our wish is that you keep writing." Aanya smiled, her eyes a little misty. She pulled out her notebook and wrote one last line: Dear Future Me, this year I learned that words can build anything, even a whole magical world. As lanterns floated up into the Lumora sky, Aanya knew this was not really the end. It was only the beginning of everything she would write next.' }
        ],
        create: {
            challenge: "Write a letter to your future self about what you learned, what you're proud of, and what you want to improve.",
            bullets: ['What did you learn this year?', 'What are you proud of?', 'What was difficult?', 'What advice would you give yourself?'],
            starters: ['Dear Future Me,', 'I want to tell you about...'],
            target: '5-6 sentences',
            hints: [
                "What is something you couldn't do at the start of the year?",
                'Who helped you grow this year?',
                'What moment made you smile the most?',
                'What do you hope for next year?'
            ],
            modelText: [
                'Dear Future Me, I want to tell you about the things I\'ve learned in English this year.',
                'I learned how to write a story with a beginning, middle, and end.',
                'I am proud of my poem about rain.',
                'I found reported speech difficult because I kept forgetting to change the verb.',
                'My advice to you is: keep reading every day and don\'t be afraid to make mistakes.'
            ],
            modelNouns: ['learned', 'proud', 'difficult', 'advice']
        },
        practice: {
            sortTitle: 'All-Skills Review Sort',
            sortZones: [
                {
                    id: 'describing',
                    label: 'Describing Words',
                    hint: 'Adjectives that describe a noun.',
                    words: ['fluffy', 'kind', 'tall', 'bright']
                },
                {
                    id: 'past-action',
                    label: 'Past Action Words',
                    hint: 'Verbs that already happened.',
                    words: ['played', 'went', 'saw', 'helped']
                }
            ]
        },
        reflection: {
            grammarFocus: 'All Skills Review (Chapters 1-23)',
            commonErrors: [
                'Mixing up which chapter taught which grammar skill when reviewing',
                'Forgetting irregular past tense verbs learned earlier in the year',
                'Struggling most with reported speech (am/is → was, are → were)',
                'Needing a reminder on when to use "a/an" vs "the"',
                'Needing more practice distinguishing cause (because) from effect (so)'
            ]
        },
        fixItZone: {
            questions: [
                { text: 'Can you remember what you learned this year?', box: 'A' },
                { text: 'Can you name something you are proud of?', box: 'B' },
                { text: 'Did you complete your Language Portfolio?', box: 'C' },
                { text: 'Did you write a letter to your future self?', box: 'D', requiresCreate: true }
            ],
            boxes: {
                A: {
                    title: 'Box A: Remembering What You Learned',
                    body: 'This year you learned: nouns (common & proper), adjectives, pronouns, prepositions of place and time, simple past tense (regular & irregular), present continuous tense, adverbs, articles, conjunctions, modal verbs, countable/uncountable nouns, synonyms & antonyms, punctuation, sequence words, rhyming words, question words, cause & effect, and reported speech.<br><br>If you forgot any of these, go back to that chapter\'s Fix It Zone!',
                    practice: []
                },
                B: {
                    title: 'Box B: Things You Can Be Proud Of',
                    body: 'Check which of these you can do: write a story with a beginning, middle, and end; use adjectives to describe things; talk about yesterday using past tense; ask questions using who/what/where/when/why/how; write a rhyming poem; speak in front of the class; explain cause and effect; report what someone said.',
                    practice: []
                },
                C: {
                    title: 'Box C: Completing Your Language Portfolio',
                    body: 'Your portfolio collects your best work. Include: a poem you wrote, a new grammar topic you enjoyed, your best paragraph, a speaking activity you liked, and your proudest writing moment.<br><br>Can\'t remember a poem? Look back at Chapter 7 (Celebration) or Chapter 19 (Rhyme Time). Can\'t remember your best paragraph? Look back at Chapter 11 (Dream School) or Chapter 16 (Description).',
                    practice: []
                },
                D: {
                    title: 'Box D: Writing Your Letter to Future Self',
                    body: 'Stuck? Try these starters:<br><br>Start: "Dear Future Me,"<br>What you learned: "I want to tell you about the things I\'ve learned in English this year..."<br>What you\'re proud of: "I am proud that I can..."<br>What was difficult: "I found ___ difficult because..."<br>What to improve: "Next year, I want to get better at..."<br>Advice: "My advice to you is..."',
                    practice: []
                }
            },
            mistakes: [
                { mistake: 'Mixing up which skill belongs to which chapter', fix: 'Review Box A\'s full skill list to refresh your memory.' },
                { mistake: 'Giving generic feedback like "good job" when sharing work', fix: 'Use Two Stars and a Wish: "I liked how you used past tense correctly" + one specific improvement idea.' },
                { mistake: 'Forgetting irregular past tense verbs', fix: 'Review Chapter 6 and Chapter 9\'s Fix It Zones.' },
                { mistake: 'Struggling with reported speech', fix: 'Review Chapter 23\'s Fix It Zone — remember am/is → was, are → were.' }
            ]
        }
    }
];

function getChapterById(id) {
    return CHAPTERS.find(c => c.id === Number(id)) || CHAPTERS[0];
}
