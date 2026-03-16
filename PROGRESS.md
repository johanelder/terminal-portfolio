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

- [x] Space Invaders logo placed at bottom center
- [x] Logo invisible at rest (`opacity: 0`)
- [x] Logo fades in and glows on hover (CSS transition)
- [x] Click triggers expand animation (grows up from bottom)
- [x] Space Invaders Canvas game component
- [x] Game loop runs inside expanded panel
- [x] Game loop cleans up on panel close (`useEffect` cleanup)
- [x] `[x]` closes the panel and stops the game

---

## Slice 4 — Database & Auth Backend

- [ ] Cloud SQL schema applied (`users` + `posts` tables) — apply manually: `db/schema.sql`
- [x] MySQL connection pool (`src/db/connection.ts`) — socket (Cloud Run) + TCP (CI/local)
- [x] `POST /api/auth/register` endpoint (with input validation)
- [x] `POST /api/auth/login` endpoint (returns JWT, 7d expiry)
- [x] `GET /api/auth/me` endpoint
- [x] `POST /api/auth/logout` (client-side clear)
- [x] `authGuard` middleware (JWT verify + role check)
- [x] `adminGuard` middleware (role === 'admin')
- [x] Tests for all auth routes (Jest + Supertest + real MySQL via CI service container)

---

## Slice 5 — Login & Register Pages (Frontend)

- [x] React Router set up (`/`, `/login`, `/register`, `/admin`)
- [x] `/login` page — terminal-style form with outer box, prompt-style fields (`> username:`, `> password:`)
- [x] `/register` page — same aesthetic, three fields, navigates to `/login` on success
- [x] Fade-in reveal on form field labels (typewriter-style opacity transition on mount)
- [x] JWT stored in httpOnly cookie (SameSite=strict, Secure in prod, 7-day expiry)
- [x] `authGuard` updated to read from `req.cookies.token`
- [x] `cookie-parser` added to backend; CORS updated with `credentials: true` + `FRONTEND_ORIGIN` env var
- [x] Auth tests updated — assert `set-cookie` on login, send `Cookie` header on `/me`
- [x] `services/auth.ts` — all API calls use `credentials: 'include'`
- [x] `hooks/useAuth.ts` — fetches current user on mount, exposes `logout()`
- [x] `ProtectedRoute` component — redirects to `/login` if unauthenticated; to `/` if non-admin
- [x] Header auth-aware: `>_ username [logout]` when logged in, `>_` link when logged out
- [x] Admin header prompt: `#_ [root@terminal]` on the left when logged in as admin (links to `/admin`)
- [x] `/admin` stub page (real content in Slice 6)
- [x] Frontend `Dockerfile` updated — accepts `VITE_API_URL` as build arg
- [x] `deploy.yml` updated — `VITE_API_URL` passed to Docker build; `FRONTEND_ORIGIN` + `NODE_ENV=production` added to backend Cloud Run env vars
- [x] `FRONTEND_URL` added to GitHub Actions secrets

---

## Slice 6 — Posts API & Admin Dashboard ✅

- [x] `GET /api/posts` — public published posts
- [x] `GET /api/posts/:id` — single published post
- [x] `POST /api/admin/posts` — create post (admin, title required, status validated)
- [x] `PUT /api/admin/posts/:id` — partial update (only sent fields updated)
- [x] `DELETE /api/admin/posts/:id` — delete post (admin)
- [x] `GET /api/admin/posts` — all posts including drafts (admin)
- [x] All admin routes protected by `adminGuard` at router level
- [x] `tests/posts.test.ts` — full coverage: public routes + admin CRUD + auth enforcement
- [x] `services/posts.ts` — frontend API calls for all post endpoints
- [x] Published posts fetched on Shell mount, rendered in Projects panel (terminal-formatted string)
- [x] Admin dashboard — post list with `[draft]` / `[published]` badges, edit and delete per row
- [x] Admin create post form — terminal prompt-style fields, status radio toggle
- [x] Admin edit post form — pre-populated from existing post data
- [x] Delete with two-click confirmation (`[delete]` → `[confirm?]` → deleted)
- [x] Delete error is swallowed gracefully, list reloads either way

---

## Slice 7 — Polish & Additional Easter Eggs

- [ ] Animation timing refinement
- [ ] Additional easter eggs (TBD)
- [ ] Mobile responsiveness review
- [ ] Final accessibility pass
- [ ] Final code review and cleanup
- [ ] Production smoke test

---

*Last updated: Slices 1–6 complete. Ready for Slice 7 (Polish & additional easter eggs).*
