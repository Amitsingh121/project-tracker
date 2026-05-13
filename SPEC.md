# SPEC.md - Product Specification

> Complete functional specification. This is the source of truth for what we're building.
> If `CLAUDE.md` is "how we build", this is "what we build".

---

## 1. Product Summary

A multi-tenant project & task management web app where users sign up, create projects, invite teammates with Admin or Member roles, create and assign tasks, track status through a Kanban-style board, and view a dashboard summarizing their work.

---

## 2. User Roles

### 2.1 Authenticated User (any logged-in user)
- Can sign up, log in, log out
- Can view and edit their own profile (name only - email is immutable after signup)
- Can create new projects (becomes Admin of any project they create)
- Can view only projects they are a member of

### 2.2 Project Admin
- All Member permissions, plus:
- Edit project name and description
- Delete the project (cascades to tasks and memberships)
- Invite users to the project by email
- Remove members from the project
- Promote Members to Admin / demote Admins to Member
- Assign any task to any member
- Edit or delete any task in the project

### 2.3 Project Member
- View project details, members, and all tasks
- Create new tasks (becomes the task creator)
- Edit and delete tasks they created
- Update the status of tasks assigned to them
- Cannot change task assignment
- Cannot edit project settings or manage members

---

## 3. Features (User Stories)

### 3.1 Authentication
- **Signup:** User provides name, email, password (min 8 chars). Receives JWT on success.
- **Login:** User provides email + password. Receives JWT on success.
- **Logout:** Client-side token removal (stateless JWT).
- **Get current user:** `GET /api/auth/me` returns the authenticated user's info.
- **Validation:**
  - Email must be valid format, unique, lowercased before storage
  - Password min 8 chars, must contain at least one letter and one number
  - Name min 2 chars, max 50 chars
- **Errors to handle:** duplicate email (409), wrong password (401), user not found (401 - same message as wrong password to prevent enumeration)

### 3.2 Project Management
- **List my projects:** `GET /api/projects` - returns projects where the user is a member, with their role and task count
- **Create project:** `POST /api/projects` - creates project + creates a `ProjectMember` row for the creator with role `ADMIN`. Wrap in a transaction.
- **Get project details:** `GET /api/projects/:id` - returns project info, members list, current user's role. Member-only.
- **Update project:** `PATCH /api/projects/:id` - name and description. Admin-only.
- **Delete project:** `DELETE /api/projects/:id` - Admin-only. Cascades to tasks and memberships.
- **Validation:** name 2–100 chars, description max 500 chars.

### 3.3 Team / Member Management
- **List members:** included in `GET /api/projects/:id`
- **Add member:** `POST /api/projects/:projectId/members` - body: `{ email, role }`. Admin-only.
  - If user doesn't exist by email → return 404 (do NOT auto-create user accounts; this is an assessment, not a real product)
  - If user is already a member → 409
- **Remove member:** `DELETE /api/projects/:projectId/members/:userId` - Admin-only.
  - Cannot remove the last Admin (must demote or transfer first → return 400)
  - Cannot remove yourself if you're the last Admin
- **Change member role:** `PATCH /api/projects/:projectId/members/:userId` - body: `{ role }`. Admin-only.
  - Cannot demote yourself if you're the last Admin

### 3.4 Task Management
- **List tasks for a project:** `GET /api/projects/:projectId/tasks?status=&assigneeId=&priority=&search=`
- **Create task:** `POST /api/projects/:projectId/tasks` - Any project member.
  - Body: `{ title, description?, priority?, dueDate?, assigneeId? }`
  - `assigneeId` must be a member of the project (validate)
  - Creator is auto-set from `req.user.id`
- **Update task:** `PATCH /api/tasks/:taskId`
  - Admin can update anything
  - Member can update tasks they created (all fields except assigneeId)
  - Member can update status of tasks assigned to them
- **Delete task:** `DELETE /api/tasks/:taskId` - Admin OR task creator
- **Validation:**
  - title 2–200 chars, required
  - description max 2000 chars
  - status: enum `TODO | IN_PROGRESS | DONE`
  - priority: enum `LOW | MEDIUM | HIGH`
  - dueDate: ISO 8601 date string, must be in the future on creation (allow past on update)

### 3.5 Dashboard
- **Endpoint:** `GET /api/dashboard`
- **Returns** (scoped to current user, across all their projects):
  ```json
  {
    "totals": { "projects": 5, "tasks": 23 },
    "tasksByStatus": { "TODO": 8, "IN_PROGRESS": 10, "DONE": 5 },
    "myAssignedTasks": [ /* 10 most recent, with project name */ ],
    "overdueTasks": [ /* tasks where dueDate < now AND status != DONE, assigned to me */ ],
    "recentProjects": [ /* 5 most recently updated */ ]
  }
  ```

---

## 4. UI / Pages

### 4.1 Public Pages
- `/login` - email + password form, link to signup
- `/signup` - name + email + password form, link to login
- `/` - landing page (simple hero + CTA; can be minimal)

### 4.2 Authenticated Pages
- `/dashboard` - stat cards, overdue tasks list, my tasks list, recent projects
- `/projects` - grid of project cards, "New Project" button
- `/projects/:id` - tabbed view:
  - **Tasks tab:** Kanban board (3 columns: To Do / In Progress / Done), drag-to-update-status, filters
  - **Members tab:** member list, invite form (Admin only), role dropdown (Admin only), remove button (Admin only)
  - **Settings tab:** edit name/description, delete project (Admin only)
- `/profile` - view/edit name, see email (read-only)

### 4.3 UX Requirements
- **Loading states:** Skeleton components for lists, spinner for actions
- **Empty states:** Friendly messages with CTAs ("No projects yet. Create your first!")
- **Error states:** Inline error messages on forms, toast for global errors
- **Confirmation modals** for destructive actions (delete project, remove member)
- **Optimistic updates** on task status changes (Kanban drag)
- **Toast notifications** on every mutation (sonner)
- **Mobile responsive** - at minimum, must work on tablet (768px+); phone is bonus

---

## 5. Non-Functional Requirements

### 5.1 Security
- Passwords hashed with bcrypt (10 rounds minimum)
- JWT signed with strong secret (env var `JWT_SECRET`, min 32 chars)
- JWT expiry: 7 days (assessment context; production would be shorter)
- `helmet` middleware on backend
- CORS configured to allow only the frontend origin
- Rate limiting: 100 req/15min globally, 5 req/min on `/api/auth/*`
- No sensitive data in error messages or logs
- SQL injection: prevented by Prisma (parameterized queries)
- XSS: React escapes by default; never use `dangerouslySetInnerHTML`

### 5.2 Performance
- Indexed DB columns: `ProjectMember(userId)`, `Task(projectId, status)`, `Task(assigneeId)`
- Pagination on task lists if > 50 tasks (Phase 5 optional)
- Frontend bundle: code-split routes via React.lazy

### 5.3 Documentation
- README.md with: demo link, demo credentials, screenshots, setup, tech stack, features, architecture diagram
- Swagger UI at `/api/docs`
- Postman collection committed at `/docs/postman_collection.json`
- Architecture doc at `/docs/ARCHITECTURE.md`

---

## 6. Out of Scope (do NOT build these unless explicitly requested)

- Email sending (invites are in-app only; user must exist)
- File attachments on tasks
- Subtasks / task hierarchies
- Time tracking
- Comments on tasks (could be Phase 6 stretch goal)
- Notifications (in-app or push)
- Multi-language i18n
- Two-factor auth / OAuth
- Admin "super-user" across the whole platform
- Team-level billing / org accounts

---

## 7. Differentiator (the "wow" feature)

**Drag-and-drop Kanban board** using `@dnd-kit/core`:
- Three columns: To Do, In Progress, Done
- Drag a task card between columns to update its status
- Optimistic UI update with rollback on API error
- Only allowed if user has permission to update that task's status

This is the primary visual differentiator. Allocate Phase 4 to this.

---

## 8. Demo Data

The seed script (`prisma/seed.js`) must create:
- 1 Admin demo user: `admin@demo.com` / `Demo1234`
- 1 Member demo user: `member@demo.com` / `Demo1234`
- 2 sample projects, with both users as members (admin as ADMIN in one, MEMBER in the other; reverse for the other project)
- 10–15 sample tasks distributed across statuses, priorities, and assignees
- README must surface these credentials prominently
