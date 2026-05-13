# API Reference

Base URL: `/api`

All responses follow this shape:
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": { "message": "...", "code": "..." } }
```

Authenticated endpoints need: `Authorization: Bearer <jwt>`

---

## Auth

### POST /api/auth/signup
Creates a new account. Returns a JWT immediately (no email verification for now).

```json
{ "name": "Jane Doe", "email": "jane@example.com", "password": "Pass1234" }
→ 201 { "success": true, "data": { "user": {...}, "token": "..." } }
```

### POST /api/auth/login
```json
{ "email": "jane@example.com", "password": "Pass1234" }
→ 200 { "success": true, "data": { "user": {...}, "token": "..." } }
```
Returns 401 on bad credentials.

### GET /api/auth/me
Returns the logged-in user's profile. Used on page load to restore session from localStorage token.

---

## Projects

### GET /api/projects
Lists all projects the user belongs to. Includes their role, task count, and member count.

### POST /api/projects
Creates a project. The creator automatically becomes Admin.
```json
{ "name": "My Project", "description": "optional" }
```

### GET /api/projects/:id
Full project detail including member list. Only accessible to project members.

### PATCH /api/projects/:id
Update name/description. Admin only.

### DELETE /api/projects/:id
Deletes project + all tasks + all memberships (cascade). Admin only. Returns 204.

---

## Members

All member endpoints require project Admin role.

### POST /api/projects/:projectId/members
Add a user by email. They get MEMBER role by default.
```json
{ "email": "bob@example.com" }
```
Returns 404 if email not found, 409 if already a member.

### PATCH /api/projects/:projectId/members/:userId
Change role. Can't demote the last admin (returns 400).
```json
{ "role": "ADMIN" }
```

### DELETE /api/projects/:projectId/members/:userId
Remove a member. Can't remove the last admin.

---

## Tasks

### GET /api/projects/:projectId/tasks
List tasks for a project. Optional query filters: `status`, `priority`, `assigneeId`, `search`.

### POST /api/projects/:projectId/tasks
Any project member can create tasks.
```json
{ "title": "Design homepage", "priority": "HIGH", "dueDate": "2026-06-01T00:00:00Z", "assigneeId": "..." }
```
Assignee must be a project member (validated server-side).

### PATCH /api/tasks/:taskId
Permission-based updates:
- **Admin**: can edit everything
- **Creator**: can edit title, description, priority, dueDate, status
- **Assignee**: can only change status (for Kanban drag-and-drop)

### DELETE /api/tasks/:taskId
Admin or task creator only. Returns 204.

---

## Dashboard

### GET /api/dashboard
Aggregated view for the current user:
- Total projects and tasks
- Tasks grouped by status
- My assigned tasks (not done)
- Overdue tasks
- 5 most recently updated projects

---

## Error Codes

| HTTP | Code | When |
|------|------|------|
| 400 | BAD_REQUEST | Business rule (e.g. can't remove last admin) |
| 401 | UNAUTHORIZED | No token / bad token / wrong password |
| 403 | FORBIDDEN | Not a member, or insufficient role |
| 404 | NOT_FOUND | Resource doesn't exist |
| 409 | CONFLICT | Duplicate (email, membership) |
| 422 | VALIDATION_ERROR | Zod validation failed |
| 429 | - | Rate limited (5/min on auth, 100/15min global) |
| 500 | SERVER_ERROR | Something broke |
