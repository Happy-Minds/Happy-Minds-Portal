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

    // Student stories: reads photos of handwritten stories and gives kind
    // feedback with Claude Haiku. It is the `stories` Supabase Edge Function
    // (supabase/functions/stories); cloud.js calls it.
    STORIES_ENDPOINT: 'https://odjrafygmednsooyiicd.supabase.co/functions/v1/stories',

    // --- Supabase: sign-in + saved data ---------------------------------------
    // Project address and publishable key. The publishable key is meant to be
    // in browser code; what each account can read or write is enforced by
    // Row Level Security in supabase/schema.sql. Never put the secret /
    // service_role key here.
    SUPABASE_URL: 'https://odjrafygmednsooyiicd.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_Je_dad4ZXQnSm14mI92u-g_1ZHrOjiu',
    // People sign in with a username; Supabase Auth stores it as
    // <username>@AUTH_EMAIL_DOMAIN. No email is sent to these addresses.
    AUTH_EMAIL_DOMAIN: 'happyminds.local',

    // Filled in by cloud.js after sign-in, from the Supabase students and
    // profiles tables (accounts and the roster are managed there now; see
    // supabase/seed-accounts.sql). Each account looks like
    // { username, role, name, avatar, studentId }; students and parents carry
    // the studentId of the child they belong to.
    STUDENTS: [],
    ACCOUNTS: []
};

