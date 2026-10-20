# Happy Minds Portal

A learning portal for Happy Minds with separate views for teachers, students, parents and trainers/admins. It tracks class progress, practice scores and student creations.

## Running locally

The portal is plain HTML, CSS and JavaScript, so there is no build step.

1. Clone the repo.
2. Serve the folder with any static server, for example:
   - VS Code: install **Live Server**, right-click `index.html`, and choose **Open with Live Server**
   - Python: `python -m http.server 8000`, then open http://localhost:8000
3. Open `index.html` for the teacher/trainer/admin portal, or `student-portal.html` for students and parents.

An internet connection is needed. Sign-in and saved data come from Supabase, and Font Awesome, confetti and supabase-js load from a CDN.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` / `app.js` / `styles.css` | Main portal (login, teacher, trainer, admin, parent views) |
| `student-portal.html` / `student-portal.js` | Student portal |
| `student-practice.js` / `chapter1-practice.*` | Practice activities |
| `projector.html` / `projector.js` | Classroom projector view |
| `chapters-data.js` | Chapter content |
| `config.js` | Endpoints and the Supabase project address/publishable key |
| `cloud.js` | Supabase connection: sign-in, roster and saved data |
| `supabase/schema.sql` | Database tables and access rules |

## Backend (Supabase)

Sign-in, the class roster and all saved progress live in Supabase, so every device sees the same data.

- **Tables:** `students` (roster), `profiles` (one per account: role, name, linked student) and `app_documents` (every saved record, one JSON document each).
- **Access rules:** Row Level Security in `supabase/schema.sql` decides who sees what. Staff (teacher, trainer, admin) see everything. A student sees and writes only their own records. A parent sees only their own child's records. Class progress and the Lumora Wall are readable by every signed-in account.
- **Accounts:** people sign in with a username. Behind the scenes it is stored as `<username>@happyminds.local`, and no email is ever sent there. Accounts are created by running `supabase/seed-accounts.sql` in the Supabase SQL Editor. That file holds passwords, so it is kept out of git. Ask the project admin for it. Sign-up is off.

### Projector remote

The teacher's phone controls the classroom projector.

1. On the laptop connected to the projector, sign in and choose **Projector mode** from the account menu (or the projector button in any lesson stage). Press **Start projector**.
2. On the phone, sign in with the same account and open the chapter. The two connect automatically.
3. Every step the teacher takes on the phone (settle, video, storybook pages, Think & Talk, practice, Create, Perform) appears on the projector. The script and prompts stay on the phone.

The devices talk over a private Supabase Realtime channel (`projector:<teacher's user id>`) that only that signed-in teacher can join.

### Student stories (handwriting reader + feedback)

The `stories` Edge Function (`supabase/functions/stories/index.ts`) reads photos of handwritten stories and gives kind feedback with Claude Haiku. Stories and feedback are saved in the `story_submissions` table.

- **Teacher, Create step:** pick a student, scan their story, check the text, **Get Feedback**, then **Save** it to that student. Teachers choose how many students to scan.
- **Student portal, Create Studio:** the student sends a photo and gets their story back with feedback. Each student has 2 chances per chapter. The function enforces the limit, and a photo that can't be read doesn't use a chance. Teacher scans don't count toward it.

Students see their own stories, parents see their child's, and staff see all. The Claude API key is stored only as the Supabase secret `ANTHROPIC_API_KEY`, never in the portal code.

### Setting up a new Supabase project

1. In the SQL Editor, run `supabase/schema.sql`.
2. Then run `supabase/seed-accounts.sql`.
3. Under **Authentication → Sign In / Providers**, turn off **Allow new users to sign up**.
4. Put the project URL and publishable key in `config.js`.
5. Under **Edge Functions**, deploy `supabase/functions/stories/index.ts` as `stories` with **Verify JWT** off (the function checks the signed-in account itself), and add the secret `ANTHROPIC_API_KEY`. Update `STORIES_ENDPOINT` in `config.js` to the new project's address.
