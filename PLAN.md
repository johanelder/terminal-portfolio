# PLAN.md — Terminal Portfolio Project

> Source of truth for architecture, design decisions, build order, and CI/CD pipeline.
> Last updated: Session 004

---

## 1. Project Vision

A personal portfolio and blog site with a Unix terminal aesthetic. The experience is built around a single-page shell where content panels expand and collapse with animation rather than navigating to new pages. The design language is black background, green text, and glowing box outlines — evoking a classic CRT terminal. Hidden easter eggs reward curious users.

---

## 2. Finalised Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React + TypeScript | Component-based, typed |
| Styling | CSS Modules or Tailwind | Terminal aesthetic, green on black |
| Backend | Node.js + Express | REST API |
| Database | MySQL (Cloud SQL) | Managed, GCP hosted |
| Auth | JWT + bcrypt | Role field on user record for admin |
| Containerisation | Docker | One image per service (frontend, backend) |
| Hosting | GCP Cloud Run | Serverless containers, auto-scaling |
| Image Registry | GCP Artifact Registry | Stores Docker images |
| CI/CD | GitHub Actions | Test → Build → Push → Deploy |
| Version Control | GitHub | Source of truth for code |

---

## 3. Site Structure & Routing

### Single Page Shell (/)
The root URL is the entire user-facing experience. No navigation away. Content is revealed via state and animation.

```
Main Shell — always rendered
├── Header bar
│   └── >_ login prompt — top right, always visible
├── Three-box row (below header)
│   ├── [ABOUT] box
│   ├── [RESUME] box
│   └── [PROJECTS] box
├── Expanded panel state (one active at a time, grows down into viewport)
│   ├── About content (types in on expand)
│   ├── Resume content (types in on expand)
│   └── Projects/Blog content (types in on expand)
└── Easter egg — Space Invaders logo, bottom center, invisible at rest
    └── Space Invaders panel (expands up into viewport on click)
```

**Panel state model:**
```
activePanel: null | 'about' | 'resume' | 'projects' | 'spaceinvaders'
```

Closing any expanded panel: click the `[x]` symbol in the top corner of the expanded box. Returns to three-box idle state.

### Separate Routes (true page navigation)
```
/login          Login page
/register       Register page
/admin          Admin dashboard (protected, admin role required)
```

---

## 4. UI & Interaction Design

### Aesthetic Rules
- Background: `#000000`
- Primary text & lines: `#00FF00` (terminal green)
- Font: `JetBrains Mono` (Google Fonts) — modern terminal feel, excellent legibility, fallback to monospace
- No images on main page — pure text and line-drawn boxes
- All interactive elements glow on hover (CSS `text-shadow` / `box-shadow` in green)

### Three-Box Idle State
- Three small rectangular boxes positioned near the top of the viewport, below the header bar
- Side by side, horizontally centered
- Each contains a single label: `ABOUT`, `RESUME`, `PROJECTS`
- Hover: box and text glow (green glow, `box-shadow` effect)
- Click: triggers expand animation

### Expand Animation Sequence
1. Box outline grows from its position near the top, expanding down and out to fill the main viewport
2. Once expanded, text content types in character by character (typewriter effect)
3. `[x]` appears in top-right corner of the expanded box
4. Clicking `[x]` collapses the box back to its original size and position

### Login Prompt — `>_`
- Small, pixel/8-bit style, top-right corner
- Subtle green glow on hover
- Clicking navigates to `/login`

### Easter Egg — Space Invaders
- A small Space Invaders logo, bottom center of page — fully transparent at rest (opacity: 0)
- On hover: logo fades in and glows green (CSS transition on opacity + text-shadow)
- On click: triggers the expand animation — box grows up and out from bottom center to fill the main viewport
- Inside the expanded box: a fully playable Space Invaders game (HTML5 Canvas)
- Closes with `[x]`

### Login / Register Pages
- Same black + green aesthetic as main page
- Outer box outline wraps the entire form (same line-box style as main page panels)
- Individual fields have no box — each renders as a bare terminal prompt line, e.g. `> username: _`
- Field labels and placeholder text use the typewriter effect on page load
- Minimal layout — form box centered on screen

### Admin Dashboard
- Protected route — redirect to `/login` if not authenticated or not admin role
- CRUD interface for blog/project posts
- Same terminal aesthetic carried through
- Fields per post: title, description, external URL, tags, published/draft status, created date

---

## 5. Database Schema

### `users` table
```sql
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50) NOT NULL UNIQUE,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('guest', 'user', 'admin') DEFAULT 'user',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### `posts` table
```sql
CREATE TABLE posts (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(150) NOT NULL,
  description   TEXT,
  external_url  VARCHAR(500),
  tags          VARCHAR(255),
  status        ENUM('draft', 'published') DEFAULT 'draft',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

> Both tables are the full scope for v1. Additional tables added in later slices as needed.

---

## 6. API Endpoints

### Auth
```
POST   /api/auth/register       Register new user
POST   /api/auth/login          Login, returns JWT
POST   /api/auth/logout         Invalidate token (client-side clear)
GET    /api/auth/me             Return current user from JWT
```

### Posts (public)
```
GET    /api/posts               Return all published posts
GET    /api/posts/:id           Return single published post
```

### Posts (admin protected)
```
POST   /api/admin/posts         Create new post
PUT    /api/admin/posts/:id     Update post
DELETE /api/admin/posts/:id     Delete post
GET    /api/admin/posts         Return all posts including drafts
```

### Auth middleware
All `/api/admin/*` routes require a valid JWT with `role: admin`. A middleware function checks this on every admin request.

---

## 7. CI/CD Pipeline

### Pipeline Trigger
- Push to `main` branch → full pipeline runs
- Push to feature branches → tests only (no deploy)

### Pipeline Steps (GitHub Actions)
```
1. Checkout code
2. Install dependencies (frontend + backend)
3. Run tests
   ├── Backend: Jest (unit + integration tests)
   └── Frontend: Vitest + React Testing Library
4. Build Docker images
   ├── frontend image
   └── backend image
5. Push images to GCP Artifact Registry
6. Deploy to Cloud Run
   ├── Deploy frontend service
   └── Deploy backend service
7. Health check — confirm services are live
```

### Environment Variables
Secrets stored in GitHub Actions secrets and injected at build time:
- `GCP_PROJECT_ID`
- `GCP_SA_KEY` (service account JSON for GCP auth)
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`

---

## 8. Project Folder Structure

```
terminal-portfolio/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions pipeline
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Shell/           # Main page shell
│   │   │   ├── PanelBox/        # Expandable box component
│   │   │   ├── TypewriterText/  # Typewriter animation
│   │   │   ├── LoginPrompt/     # >_ top-right button
│   │   │   ├── EasterEgg/       # Invisible logo trigger + invaders reveal
│   │   │   └── SpaceInvaders/   # Canvas game component
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── Admin.tsx
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # API call functions
│   │   ├── types/               # Shared TypeScript types
│   │   └── App.tsx
│   ├── Dockerfile
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   └── posts.ts
│   │   ├── middleware/
│   │   │   └── authGuard.ts     # JWT + role check
│   │   ├── controllers/
│   │   ├── models/              # DB query functions
│   │   ├── db/
│   │   │   └── connection.ts    # MySQL connection pool
│   │   └── index.ts             # Express app entry point
│   ├── tests/
│   ├── Dockerfile
│   └── package.json
├── db/
│   └── schema.sql               # Full schema, run once on setup
├── PLAN.md                      # This file
└── README.md
```

---

## 9. Vertical Build Slices (Build Order)

Each slice is fully built, tested, and deployed before the next begins.

```
Slice 1 — Project scaffold & CI/CD pipeline
  ├── Create GitHub repo
  ├── Scaffold frontend (Vite + React + TS)
  ├── Scaffold backend (Node + Express + TS)
  ├── Write basic health check endpoint (GET /api/health)
  ├── Dockerise both services
  ├── Set up GCP project, Cloud Run, Artifact Registry, Cloud SQL
  └── Build and validate GitHub Actions pipeline end to end

Slice 2 — Main page shell & animation
  ├── Header bar with >_ login prompt (top right)
  ├── Three glowing boxes below header, horizontally centered
  ├── Expand/collapse animation (grows down into main viewport)
  ├── Typewriter text effect
  ├── [x] close button
  └── Static content for About, Resume, Projects panels

Slice 3 — Easter egg & Space Invaders
  ├── Small Space Invaders logo, invisible at rest (opacity: 0), bottom center
  ├── Logo fades in and glows on hover
  ├── Click triggers expand animation (grows up from bottom into viewport)
  ├── Space Invaders Canvas game component
  └── Game closes with [x]

Slice 4 — Database & Auth backend
  ├── Cloud SQL MySQL instance provisioned
  ├── Schema applied (users + posts)
  ├── Register endpoint
  ├── Login endpoint (returns JWT)
  ├── /api/auth/me endpoint
  ├── authGuard middleware
  └── Tests for all auth routes

Slice 5 — Login & Register pages (frontend)
  ├── /login page with terminal-style form
  ├── /register page
  ├── JWT stored in memory / httpOnly cookie
  ├── >_ prompt redirects correctly after login
  └── Protected route wrapper for /admin

Slice 6 — Posts API & Admin Dashboard
  ├── Public posts endpoints
  ├── Admin posts endpoints (CRUD)
  ├── Admin dashboard UI (terminal aesthetic)
  ├── Create / edit / delete posts
  └── Published posts appear in Projects panel on main page

Slice 7 — Polish & additional easter eggs
  ├── Refine animations and timing
  ├── Additional easter eggs (TBD)
  ├── Mobile responsiveness (if desired)
  └── Final review and cleanup
```

---

## 10. Notes & Decisions Log

| # | Decision | Rationale |
|---|---|---|
| 1 | Single page shell, not multi-page routing | Matches the interaction vision — content reveals, not navigation |
| 2 | MySQL over PostgreSQL | Familiar to developer, Cloud SQL supports it natively |
| 3 | Cloud Run over Compute Engine VM | Less ops overhead, fits project scale, pairs well with Docker CI/CD |
| 4 | GitHub Actions for CI/CD | Free, integrates cleanly with GCP, YAML config straightforward |
| 5 | JWT auth, no OAuth for v1 | Keeps auth simple, OAuth can be added later |
| 6 | HTML5 Canvas for Space Invaders | No game engine needed, self-contained React component |
| 7 | Vertical slices, not horizontal layers | Keeps app integrated and deployable throughout build |
| 8 | `[x]` to close expanded panels | Clean, on-brand, unambiguous |
| 9 | Three-tier role enum: guest, user, admin | Leaves a middle permission tier available for future features |
| 10 | JetBrains Mono font | Modern terminal aesthetic, highly legible, Google Fonts hosted |
| 11 | Three boxes positioned top, expand downward | More natural spatial flow — boxes anchor at top, content fills below |
| 12 | Easter egg as invisible logo not 1px target | More discoverable on varied screen sizes, same surprise effect |
| 13 | Login form: outer box, bare prompt-style fields | Consistent with terminal aesthetic, outer box frames the experience |

---

*End of PLAN.md — update this file as decisions change throughout the build.*
