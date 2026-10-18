/* ==========================================================================
   Happy Minds — Integration Config
   The only file that needs editing when a backend teammate hands you a
   real address. Everything else in the app reads from here.
   ========================================================================== */

const HappyMindsConfig = {
    // --- Intern D: video + photo hosting -----------------------------------
    // Base folder/CDN where finished chapter videos are uploaded. Each chapter
    // in chapters-data.js points to "<VIDEO_BASE_URL>/chapter-XX.mp4". Until
    // Intern D shares the real hosting location, this stays a relative local
    // path and the Explore page shows a friendly "video coming soon" state.
    VIDEO_BASE_URL: 'videos',

    // Where the Perform (scanner) screen uploads each captured worksheet
    // photo. Ask Rittu/Intern D for: (1) this exact address, (2) what
    // student/chapter fields must travel with the photo. Leave null to run
    // in offline demo mode (scan always succeeds instantly, nothing is sent).
    SCAN_UPLOAD_ENDPOINT: null,

    // --- Rittu: AI writing-feedback backend ---------------------------------
    // Exact address Rittu gives you for the "Check My Story" button. Expected
    // response shape: { "hint": "<one short hint or question>" }.
    // Leave null to run in offline demo mode using the placeholder hints
    // already written into each chapter's create.hints list.
    AI_FEEDBACK_ENDPOINT: null,

    // Handwriting OCR: the teacher scans a student's notebook page (in Create
    // or Perform) and this address should return the recognised text.
    // Expected response shape: { "text": "<recognised story text>" }.
    // Leave null to run in offline demo mode with a placeholder sample.
    OCR_ENDPOINT: null,

    // Demo class roster for the Perform screen's student picker. Replace with
    // a real class list / API call when one exists.
    STUDENTS: [
        { id: 'arjun', name: 'Arjun', grade: 'Grade 3', avatar: 'assets/boy_arjun.png' },
        { id: 'aanya', name: 'Aanya', grade: 'Grade 3', avatar: 'assets/girl_aanya.png' },
        { id: 'kabir', name: 'Kabir', grade: 'Grade 3', avatar: 'assets/boy_arjun.png' },
        { id: 'meera', name: 'Meera', grade: 'Grade 3', avatar: 'assets/girl_aanya.png' }
    ],

    // --- Placeholder login accounts ------------------------------------------
    // FRONTEND-ONLY STAND-IN, NOT REAL AUTH. Plain-text passwords checked in
    // the browser are fine for demoing the role-based UI but must never touch
    // real student/teacher data. Replace with Supabase Auth (or equivalent)
    // before this goes anywhere near a real school — see the pre-stored
    // credentials / no-signup requirement from the original brief.
    //
    // Student and parent accounts reuse this same username/password shape as
    // a stand-in for the brief's real model (Portfolio ID + PIN, issued by
    // the school, no password of the student's choosing) — same placeholder
    // pattern as teacher/trainer/admin above, not a smaller commitment to
    // real auth than those already get.
    //
    // Each student account carries studentId, matching an entry in STUDENTS
    // above — everything student-scoped (Fix It Zone time, Create attempts,
    // Lumora Wall contributions, Practice results) is keyed off that id.
    // Each parent account carries the same studentId, so a parent only ever
    // sees their own child's report.
    ACCOUNTS: [
        { username: 'teacher1', password: 'teacher123', role: 'teacher', name: 'Ms. Anita', avatar: 'assets/teacher_avatar.png' },
        { username: 'trainer1', password: 'trainer123', role: 'trainer', name: 'Mr. Rahul', avatar: 'assets/teacher_avatar.png' },
        { username: 'admin1', password: 'admin123', role: 'admin', name: 'Admin', avatar: 'assets/teacher_avatar.png' },
        { username: 'arjun1', password: 'arjun123', role: 'student', name: 'Arjun', avatar: 'assets/boy_arjun.png', studentId: 'arjun' },
        { username: 'aanya1', password: 'aanya123', role: 'student', name: 'Aanya', avatar: 'assets/girl_aanya.png', studentId: 'aanya' },
        { username: 'parent1', password: 'parent123', role: 'parent', name: "Arjun's Parent", avatar: 'assets/teacher_avatar.png', studentId: 'arjun' },
        { username: 'parent2', password: 'parent123', role: 'parent', name: "Aanya's Parent", avatar: 'assets/teacher_avatar.png', studentId: 'aanya' }
    ]
};

// One-time fresh start. Everything the app saves lives in this browser's
// localStorage; when DATA_VERSION changes, every saved Happy Minds record
// (class progress, prep, reflections, student portal progress, practice
// scores, saved login) is cleared once, so all portals start from zero.
// Runs here because config.js is the first app script on every page.
(function freshStartOnce() {
    const DATA_VERSION = '2026-10-fresh-1';
    const VERSION_KEY = 'happyMindsDataVersion';
    const APP_KEY_PREFIXES = ['happyMinds', 'spState_', 'spCurrentUser', 'ch1PracticeState'];
    try {
        if (localStorage.getItem(VERSION_KEY) === DATA_VERSION) return;
        Object.keys(localStorage)
            .filter(key => APP_KEY_PREFIXES.some(prefix => key.startsWith(prefix)))
            .forEach(key => localStorage.removeItem(key));
        localStorage.setItem(VERSION_KEY, DATA_VERSION);
    } catch (err) { /* localStorage unavailable — nothing saved to clear */ }
})();
