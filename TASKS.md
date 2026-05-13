# TASKS.md - Phased Implementation Plan

> This is the execution roadmap. Work through phases sequentially.
> **Do not start a phase until the previous one is fully working and committed.**
> Each phase ends with a working, deployable checkpoint.

---

## How to Use This File

When starting a Claude Code session, say:
> *"Read CLAUDE.md, SPEC.md, and TASKS.md. We are starting Phase X, Task Y. Show me the plan, then proceed."*

Mark tasks complete with `[x]` as you finish them. Commit after every task with the suggested commit message.

---

## ⏱️ Phase 0 - Foundation (Hour 0–2)

### Goals
Repo initialized. Both apps boot. Database connected. "Hello world" deployable.

### Tasks
- [ ] **0.1** Initialize monorepo: `git init`, create `backend/` and `frontend/` folders, add root `.gitignore` and `README.md`
  - *Commit:* `chore: initialize monorepo structure`
- [ ] **0.2** Backend: `npm init -y` in `backend/`, install dependencies:
  ```
  express prisma @prisma/client bcryptjs jsonwebtoken zod cors helmet morgan dotenv express-rate-limit swagger-jsdoc swagger-ui-express
  ```
  Dev deps: `nodemon`
  Set `"type": "module"` in package.json. Add scripts: `dev`, `start`, `prisma:migrate`, `prisma:seed`, `prisma:studio`.
  - *Commit:* `chore(backend): install dependencies`
- [ ] **0.3** Backend: create folder structure exactly as in CLAUDE.md. Create `src/server.js` with minimal Express app responding to `GET /health` with `{ status: 'ok' }`. Verify with `npm run dev`.
  - *Commit:* `feat(backend): scaffold express app with health check`
- [ ] **0.4** Database: create free Postgres DB on Neon (https://neon.tech). Copy connection string into `backend/.env` as `DATABASE_URL`. Create `.env.example` with placeholders.
  - *No commit (env file is gitignored)*
- [ ] **0.5** Prisma: `npx prisma init`, paste the full schema from `docs/SCHEMA.md`, run `npx prisma migrate dev --name init`. Verify with `npx prisma studio`.
  - *Commit:* `feat(backend): add prisma schema and initial migration`
- [ ] **0.6** Frontend: `npm create vite@latest frontend -- --template react`. Install:
  ```
  react-router-dom @tanstack/react-query axios react-hook-form @hookform/resolvers zod
  tailwindcss postcss autoprefixer lucide-react sonner date-fns clsx tailwind-merge
  ```
  Init Tailwind: `npx tailwindcss init -p`. Configure `tailwind.config.js` and `index.css` per Tailwind docs.
  - *Commit:* `chore(frontend): scaffold vite + react + tailwind`
- [ ] **0.7** Frontend: install shadcn/ui (`npx shadcn@latest init`), add starter components: `button`, `input`, `card`, `dialog`, `toast` (sonner), `dropdown-menu`, `tabs`, `skeleton`, `badge`.
  - *Commit:* `chore(frontend): install shadcn/ui components`

### Checkpoint
- `cd backend && npm run dev` → http://localhost:3000/health returns OK
- `cd frontend && npm run dev` → Vite app loads
- `npx prisma studio` → can see empty tables

---

## 🔐 Phase 1 - Auth (Hour 2–5)

### Goals
Users can sign up, log in, and the backend authenticates JWTs.

### Backend Tasks
- [ ] **1.1** Create `src/config/env.js` that loads and validates env vars with Zod (DATABASE_URL, JWT_SECRET, PORT, NODE_ENV, CORS_ORIGIN). Throw on missing required vars.
- [ ] **1.2** Create `src/config/db.js` exporting the Prisma client singleton.
- [ ] **1.3** Create `src/utils/ApiError.js` (custom error class with status + code), `src/utils/asyncHandler.js` (wraps async route handlers), `src/utils/jwt.js` (sign + verify helpers).
- [ ] **1.4** Create `src/middleware/error.js` - central error handler. Logs error, returns standardized JSON shape.
- [ ] **1.5** Create `src/middleware/validate.js` - takes a Zod schema, validates `req.body` (or query/params), attaches parsed result to `req`.
- [ ] **1.6** Create `src/middleware/auth.js` - `requireAuth` middleware verifying JWT from `Authorization: Bearer` header, attaches `req.user`.
- [ ] **1.7** Create `src/modules/auth/auth.schema.js` - Zod schemas: `signupSchema`, `loginSchema`.
- [ ] **1.8** Create `src/modules/auth/auth.service.js` - pure functions: `signupUser`, `loginUser`, `getUserById`. Handles bcrypt + JWT.
- [ ] **1.9** Create `src/modules/auth/auth.controller.js` - thin controllers calling services.
- [ ] **1.10** Create `src/modules/auth/auth.routes.js` - wires routes with validation middleware.
- [ ] **1.11** Update `src/app.js` to wire helmet, cors, rate limiter, JSON parser, morgan, routes, error handler.
- [ ] **1.12** Test all three endpoints with curl or Postman: signup → login → /me.
  - *Commit:* `feat(auth): implement signup, login, and /me endpoints`

### Frontend Tasks
- [ ] **1.13** Create `src/lib/queryClient.js` (TanStack Query client), `src/lib/axios.js` (axios instance with baseURL from env and Bearer token interceptor reading from localStorage).
- [ ] **1.14** Wrap `App` in `QueryClientProvider`, `BrowserRouter`, and `<Toaster />` from sonner.
- [ ] **1.15** Create `src/features/auth/AuthContext.jsx` - context exposing `user`, `login`, `signup`, `logout`. On app load, if token exists, call `/me`.
- [ ] **1.16** Create `src/api/auth.js` - `signup`, `login`, `me` functions.
- [ ] **1.17** Create `src/pages/SignupPage.jsx` and `LoginPage.jsx` using React Hook Form + Zod. Show server error messages inline.
- [ ] **1.18** Create `src/components/shared/ProtectedRoute.jsx` - redirects to `/login` if not authenticated.
- [ ] **1.19** Wire routes in `App.jsx`: `/login`, `/signup`, `/` (placeholder dashboard behind ProtectedRoute).
  - *Commit:* `feat(auth): implement signup, login pages and protected routes`

### Checkpoint
A new user can sign up, get redirected to dashboard, refresh the page and stay logged in, and log out.

---

## 📁 Phase 2 - Projects + RBAC Middleware (Hour 5–10)

### Goals
Users can create, list, view, edit, delete projects with RBAC enforced. **This is the most important phase for the assessment grade.**

### Backend Tasks
- [ ] **2.1** Create `src/middleware/rbac.js` - `requireProjectRole(...roles)`. Looks up `ProjectMember`, attaches `req.membership`, returns 403 if not allowed. **Read CLAUDE.md RBAC section carefully before writing.**
- [ ] **2.2** Create `src/modules/projects/projects.schema.js` - Zod for create/update.
- [ ] **2.3** Create `src/modules/projects/projects.service.js`:
  - `listMyProjects(userId)` - includes role + task count via Prisma `_count`
  - `createProject(userId, data)` - uses `prisma.$transaction` to create project + admin membership atomically
  - `getProjectById(projectId, userId)` - includes members and current user's role
  - `updateProject(projectId, data)`
  - `deleteProject(projectId)`
- [ ] **2.4** Create controller + routes. Apply `requireAuth` to all routes. Apply `requireProjectRole('ADMIN')` to update/delete.
- [ ] **2.5** Mount routes in `app.js`. Test all endpoints with both Admin and Member tokens.
  - *Commit:* `feat(projects): implement project CRUD with rbac middleware`

### Members Module
- [ ] **2.6** Create `src/modules/members/members.schema.js`, `.service.js`, `.controller.js`, `.routes.js` (nested under `/api/projects/:projectId/members`).
- [ ] **2.7** Implement: add member by email, remove member, change role.
- [ ] **2.8** **Critical edge cases to handle:**
  - Cannot add user that doesn't exist (404)
  - Cannot add user already a member (409)
  - Cannot remove or demote the last Admin (400 with clear message)
- [ ] **2.9** Test all edge cases.
  - *Commit:* `feat(members): implement member management with last-admin protection`

### Frontend Tasks
- [ ] **2.10** Create `src/api/projects.js` and `src/api/members.js`.
- [ ] **2.11** Create `src/features/projects/hooks.js` - `useMyProjects`, `useProject`, `useCreateProject`, `useUpdateProject`, `useDeleteProject` (TanStack Query).
- [ ] **2.12** Create `src/pages/ProjectsPage.jsx` - grid of project cards (using shadcn Card), "New Project" button opens Dialog.
- [ ] **2.13** Create `src/pages/ProjectDetailPage.jsx` with Tabs: Tasks (placeholder), Members, Settings.
- [ ] **2.14** Build Members tab: list members with role badges, invite form (Admin only), role dropdown (Admin only), remove button with confirmation Dialog (Admin only).
- [ ] **2.15** Build Settings tab: edit name/description form, delete project button with confirmation.
- [ ] **2.16** Empty state for projects list, loading skeletons, error toasts on mutations.
  - *Commit:* `feat(projects): implement projects pages with member management UI`

### Checkpoint
A user can create a project, invite the demo Member account, switch accounts, see the project, but not edit it. The Admin can promote them, remove them, etc.

---

## ✅ Phase 3 - Tasks 

### Goals
Full task CRUD with permissions, status updates, filtering.

### Backend Tasks
- [ ] **3.1** Create tasks module schemas (create, update, query filters).
- [ ] **3.2** Create tasks service:
  - `listTasks(projectId, filters)` - supports status, assigneeId, priority, search (case-insensitive title contains)
  - `createTask(projectId, userId, data)` - validates assigneeId is a project member
  - `updateTask(taskId, userId, userRole, data)` - encapsulates the permission logic (Admin can do all; Member with assignee can change status; Member with creator can edit own task)
  - `deleteTask(taskId, userId, userRole)` - Admin or creator only
- [ ] **3.3** Routes: nested for list/create under project, top-level for update/delete by taskId. Use `requireProjectRole('ADMIN','MEMBER')` for list/create.
- [ ] **3.4** For update/delete: create a `requireTaskAccess` middleware that fetches the task, derives the user's role in that task's project, and attaches both to `req`.
- [ ] **3.5** Test all permission combinations.
  - *Commit:* `feat(tasks): implement task crud with granular permissions`

### Frontend Tasks
- [ ] **3.6** Create `src/api/tasks.js`, hooks file.
- [ ] **3.7** Build Tasks tab on ProjectDetailPage: **3-column Kanban board** (just static layout for now, no DnD yet).
- [ ] **3.8** TaskCard component: title, assignee avatar, priority badge, due date (red if overdue).
- [ ] **3.9** "New Task" Dialog with form (title, description, priority, dueDate picker, assignee select from project members).
- [ ] **3.10** TaskDetailDialog: click card to view/edit task. Permission-aware (fields disabled based on user's role and relationship to task).
- [ ] **3.11** Filter bar above board: status filter, assignee filter, search input.
  - *Commit:* `feat(tasks): implement task board, create dialog, and detail dialog`

### Checkpoint
Tasks can be created, viewed, edited, deleted with full permission enforcement. Filters work.

---

## 🎯 Phase 4 - Dashboard + Kanban DnD 

### Goals
Polished dashboard. Drag-and-drop on the task board (THE differentiator).

### Backend Tasks
- [ ] **4.1** Create `src/modules/dashboard/dashboard.service.js` - single function `getDashboard(userId)` returning the structure from SPEC.md §3.5. Use `Promise.all` for parallel queries.
- [ ] **4.2** Create controller + route. Auth required.
- [ ] **4.3** Test response shape.
  - *Commit:* `feat(dashboard): implement aggregated dashboard endpoint`

### Frontend Tasks
- [ ] **4.4** Build `DashboardPage.jsx`:
  - 4 stat cards across the top (Total Projects, Total Tasks, In Progress, Overdue)
  - Two-column section: "My Tasks" list (left), "Overdue" list (right, red accent)
  - "Recent Projects" horizontal scroll cards at bottom
- [ ] **4.5** Install `@dnd-kit/core @dnd-kit/sortable`. Refactor the Kanban board into a `DndContext` with three `Droppable` columns and `Draggable` task cards.
- [ ] **4.6** On drag end: optimistically update the task's status in TanStack Query cache, fire mutation, rollback on error with toast.
- [ ] **4.7** Permission check on drag: if user can't update this task's status, prevent the drag (or revert with toast).
- [ ] **4.8** Polish: nice drag overlay, drop indicators, smooth transitions.
  - *Commit:* `feat(tasks): add drag-and-drop kanban with optimistic updates`

### Checkpoint
Dashboard shows real stats. Tasks can be dragged between columns and the change persists.

---

## 🎨 Phase 5 - Polish + Deploy 

### Goals
The app looks professional. It is live on the internet.

### UI Polish
- [ ] **5.1** App shell: top navbar with logo, project switcher, user avatar dropdown (Profile, Logout).
- [ ] **5.2** Consistent page headers with breadcrumbs.
- [ ] **5.3** Dark mode toggle (Tailwind dark class + shadcn theme).
- [ ] **5.4** Loading skeletons for every list and detail view.
- [ ] **5.5** Empty states with illustrations or clean icons + CTA.
- [ ] **5.6** Form errors styled consistently.
- [ ] **5.7** Mobile/tablet responsive - verify on 768px viewport at minimum.
- [ ] **5.8** Favicon and proper page titles.
  - *Commit:* `style: polish UI, add dark mode, responsive layout`

### Backend Polish
- [ ] **5.9** Swagger setup: annotate routes with JSDoc swagger comments. Mount at `/api/docs`.
- [ ] **5.10** Postman collection: export all endpoints into `docs/postman_collection.json`.
- [ ] **5.11** Seed script (`prisma/seed.js`) per SPEC.md §8.
  - *Commit:* `docs(api): add swagger documentation and postman collection`

### Deploy
- [ ] **5.12** Backend → Render or Railway. Set env vars. Confirm `/health` works on production URL.
- [ ] **5.13** Run seed script against production DB (one-time).
- [ ] **5.14** Frontend → Vercel. Set `VITE_API_URL` env var to backend URL. Confirm signup works on production.
- [ ] **5.15** Update backend CORS_ORIGIN to the Vercel URL.
  - *Commit:* `chore: deploy to render and vercel`

### Checkpoint
Anyone in the world can visit your URL, log in with `admin@demo.com / Demo1234`, and use the app.

---

## 📚 Phase 6 - Docs + Submission

### Tasks
- [ ] **6.1** Write the killer `README.md` (see template in `docs/README_TEMPLATE.md` - generate it if missing):
  - One-line description
  - **Live demo link + demo credentials (Admin + Member)** ← biggest ROI item
  - Screenshots (use a tool like Cleanshot or even browser screenshots; 3–4 max)
  - Tech stack
  - Features (mapped to assignment requirements)
  - Local setup (5 numbered steps, copy-pasteable)
  - API docs link (Swagger URL)
  - Database schema image (use Mermaid or screenshot from Prisma)
  - RBAC matrix table
  - Known limitations / future improvements
- [ ] **6.2** Write `docs/ARCHITECTURE.md` - diagram (Excalidraw export or Mermaid), explanation of folder structure, request lifecycle, why these tech choices.
- [ ] **6.3** Run through every flow manually as Admin and Member. Note bugs.
- [ ] **6.4** Fix bugs. Commit fixes individually.
- [ ] **6.5** Record 3-minute Loom demo: signup → create project → invite member → create tasks → drag on kanban → dashboard → switch to member account, show restricted permissions. Add Loom link to README.
- [ ] **6.6** Final pass: remove all `console.log`, dead code, commented code. Check `.env` is gitignored. Make sure repo is public.
- [ ] **6.7** Submit.

### Done. Ship it.

---

## Quick Reference: Commit Message Format

```
feat(scope): short description       # new feature
fix(scope): short description        # bug fix
refactor(scope): short description   # code change, no behavior change
docs(scope): short description       # documentation
chore(scope): short description      # tooling, deps, config
style(scope): short description      # formatting, UI tweaks
test(scope): short description       # tests
```

Scopes used: `auth`, `projects`, `members`, `tasks`, `dashboard`, `backend`, `frontend`, `db`.
