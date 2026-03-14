# PROGRESS.md — Terminal Portfolio Build Tracker

> Tracks completion status of every step across all slices.
> Update this file as each step is completed.

---

## Slice 1 — Project Scaffold & CI/CD Pipeline

- [x] Create GitHub repo (public)
- [x] Scaffold frontend — Vite + React + TypeScript (`frontend/`)
- [x] Install frontend dependencies
- [x] Scaffold backend — Node + Express + TypeScript (`backend/`)
- [x] Install backend dependencies
- [x] Backend `tsconfig.json`
- [x] Health check endpoint — `GET /api/health`
- [x] Backend test — `tests/health.test.ts` (Jest + Supertest) ✅ passing
- [x] Frontend `Dockerfile` (multi-stage: Node build → Nginx serve)
- [x] Backend `Dockerfile` (multi-stage: TS compile → Node run)
- [x] `.dockerignore` files for both services
- [x] GitHub Actions pipeline — `.github/workflows/deploy.yml`
- [x] GCP: Create Artifact Registry repository
- [x] GCP: Create Cloud Run services (frontend + backend)
- [ ] GCP: Create Cloud SQL instance (MySQL 8) — deferred to Slice 4
- [x] GCP: Create Service Account + download key JSON
- [x] GitHub: Add all secrets to repo settings
- [x] Push to `main` → validate pipeline runs end to end
- [ ] Confirm health check passes post-deploy (blocked: Cloud Run requires --allow-unauthenticated flag — fix in next push)

---

## Slice 2 — Main Page Shell & Animation

- [x] Header bar component
- [x] `>_` login prompt (top right, navigates to `/login`)
- [x] Three-box idle state (ABOUT, RESUME, PROJECTS)
- [x] Hover glow effect on boxes
- [x] Expand/collapse animation (box grows down into viewport)
- [x] `activePanel` state model wired up
- [x] `[x]` close button per expanded panel
- [x] `useTypewriter` custom hook
- [x] Typewriter text renders on panel expand
- [x] Static content for About panel (placeholder)
- [x] Static content for Resume panel (placeholder)
- [x] Static content for Projects panel (placeholder)
- [x] JetBrains Mono font loaded via Google Fonts
- [x] Terminal aesthetic CSS (black bg, green text, glowing borders)

---

## Slice 3 — Easter Egg & Space Invaders

- [ ] Space Invaders logo placed at bottom center
- [ ] Logo invisible at rest (`opacity: 0`)
- [ ] Logo fades in and glows on hover (CSS transition)
- [ ] Click triggers expand animation (grows up from bottom)
- [ ] Space Invaders Canvas game component
- [ ] Game loop runs inside expanded panel
- [ ] Game loop cleans up on panel close (`useEffect` cleanup)
- [ ] `[x]` closes the panel and stops the game

---

## Slice 4 — Database & Auth Backend

- [ ] Cloud SQL schema applied (`users` + `posts` tables)
- [ ] MySQL connection pool (`src/db/connection.ts`)
- [ ] `POST /api/auth/register` endpoint
- [ ] `POST /api/auth/login` endpoint (returns JWT)
- [ ] `GET /api/auth/me` endpoint
- [ ] `POST /api/auth/logout` (client-side clear documented)
- [ ] `authGuard` middleware (JWT verify + role check)
- [ ] Tests for all auth routes (Jest + Supertest)

---

## Slice 5 — Login & Register Pages (Frontend)

- [ ] React Router set up (`/`, `/login`, `/register`, `/admin`)
- [ ] `/login` page — terminal-style form with outer box
- [ ] `/register` page — terminal-style form with outer box
- [ ] Typewriter effect on form field labels
- [ ] JWT stored in httpOnly cookie (set by backend on login)
- [ ] Auth context / hook for current user state
- [ ] `>_` prompt redirects to `/login`, then back after login
- [ ] Protected route wrapper — redirects to `/login` if not authenticated
- [ ] `/admin` route protected (admin role required)

---

## Slice 6 — Posts API & Admin Dashboard

- [ ] `GET /api/posts` — public published posts
- [ ] `GET /api/posts/:id` — single published post
- [ ] `POST /api/admin/posts` — create post (admin)
- [ ] `PUT /api/admin/posts/:id` — update post (admin)
- [ ] `DELETE /api/admin/posts/:id` — delete post (admin)
- [ ] `GET /api/admin/posts` — all posts including drafts (admin)
- [ ] Admin dashboard UI — post list with draft/published status
- [ ] Admin create post form
- [ ] Admin edit post form
- [ ] Admin delete post (with confirmation)
- [ ] Published posts fetched and rendered in Projects panel on main page

---

## Slice 7 — Polish & Additional Easter Eggs

- [ ] Animation timing refinement
- [ ] Additional easter eggs (TBD)
- [ ] Mobile responsiveness review
- [ ] Final accessibility pass
- [ ] Final code review and cleanup
- [ ] Production smoke test

---

*Last updated: Slice 1 complete. Slice 2 complete. UI polish done. Ready for Slice 3.*
