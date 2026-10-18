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

### Setting up a new Supabase project

1. In the SQL Editor, run `supabase/schema.sql`.
2. Then run `supabase/seed-accounts.sql`.
3. Under **Authentication → Sign In / Providers**, turn off **Allow new users to sign up**.
4. Put the project URL and publishable key in `config.js`.
