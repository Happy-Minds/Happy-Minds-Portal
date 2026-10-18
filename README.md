# Happy Minds Portal

A learning portal for Happy Minds with separate views for teachers, students, parents and trainers/admins. It tracks class progress, practice scores and student creations.

## Running locally

The portal is plain HTML, CSS and JavaScript, so there is no build step.

1. Clone the repo.
2. Serve the folder with any static server, for example:
   - VS Code: install **Live Server**, right-click `index.html`, and choose **Open with Live Server**
   - Python: `python -m http.server 8000`, then open http://localhost:8000
3. Open `index.html` for the teacher/trainer/admin portal, or `student-portal.html` for students and parents.

An internet connection is needed for Font Awesome icons and the confetti library, which load from a CDN.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` / `app.js` / `styles.css` | Main portal (login, teacher, trainer, admin, parent views) |
| `student-portal.html` / `student-portal.js` | Student portal |
| `student-practice.js` / `chapter1-practice.*` | Practice activities |
| `projector.html` / `projector.js` | Classroom projector view |
| `chapters-data.js` | Chapter content |
| `config.js` | Endpoints, demo roster and demo login accounts |

## Demo logins

The logins in `config.js` are placeholders checked in the browser. They are not real authentication.

| Role | Username | Password |
| --- | --- | --- |
| Teacher | `teacher1` | `teacher123` |
| Trainer | `trainer1` | `trainer123` |
| Admin | `admin1` | `admin123` |
| Student | `arjun1` / `aanya1` | `arjun123` / `aanya123` |
| Parent | `parent1` / `parent2` | `parent123` |

## Data

All progress is currently saved in the browser's `localStorage`, so it is not shared between devices. Supabase (database, auth and file storage) is the next step and will replace both the local storage and the demo logins.
