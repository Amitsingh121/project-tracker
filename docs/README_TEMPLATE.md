# Project Tracker

> A full-stack project & task management app with role-based access control. Built as an assessment submission.

## 🚀 Live Demo

**App:** https://your-app.vercel.app
**API:** https://your-api.onrender.com
**API Docs (Swagger):** https://your-api.onrender.com/api/docs

### Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@demo.com` | `Demo1234` |
| Member | `member@demo.com` | `Demo1234` |

**📹 Video walkthrough:** [Loom link here]

---

## 📸 Screenshots

> Add 3-4 screenshots: Dashboard, Kanban board, Members management, Project list.

---

## ✨ Features

✅ **Authentication** - Signup, login, JWT-based sessions
✅ **Projects** - Create, edit, delete projects (Admin-gated)
✅ **Team Management** - Invite members by email, assign Admin/Member roles
✅ **Tasks** - Create, assign, prioritize, set due dates
✅ **Kanban Board** - Drag-and-drop status updates with optimistic UI
✅ **Dashboard** - Aggregated stats: tasks by status, overdue, my assignments
✅ **Role-Based Access Control** - Granular per-project permissions
✅ **Search & Filters** - Filter tasks by status, assignee, priority
✅ **REST API** - Documented with Swagger
✅ **Responsive UI** - Works on mobile, tablet, desktop
✅ **Dark Mode** - Toggle in user menu

---

## 🛠️ Tech Stack

**Backend:** Node.js · Express · Prisma · PostgreSQL · JWT · Zod · bcrypt
**Frontend:** React 18 · Vite · TanStack Query · Tailwind CSS · shadcn/ui · React Hook Form · @dnd-kit
**Deployment:** Vercel (frontend) · Render (backend) · Neon (database)

---

## 🏗️ Architecture

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for full architecture details.

```
[ React SPA ] ←→ [ Express REST API ] ←→ [ Prisma ORM ] ←→ [ PostgreSQL ]
                          ↑
                  JWT auth + RBAC middleware
```

**Backend** uses a **feature-based module structure** (`modules/auth`, `modules/projects`, etc.) where each module has its own routes, controller, service, and validation schema. Business logic lives in services, controllers stay thin, and validation/auth/RBAC are middleware concerns. All errors flow through a central error handler.

**Frontend** mirrors the backend's feature structure. Server state is managed entirely by TanStack Query (no Redux). Forms use React Hook Form with shared Zod schemas. UI uses shadcn/ui components built on Tailwind.

---

## 🔐 RBAC Matrix

| Action | Admin | Member |
|---|---|---|
| Create project | ✅ | ✅ |
| View project | ✅ | ✅ |
| Edit/delete project | ✅ | ❌ |
| Add/remove members | ✅ | ❌ |
| Change member roles | ✅ | ❌ |
| Create task | ✅ | ✅ |
| Edit any task | ✅ | ❌ |
| Edit own task | ✅ | ✅ |
| Update status of assigned task | ✅ | ✅ |
| Delete task | ✅ | only own |
| Assign tasks | ✅ | ❌ |

Roles are stored on the `ProjectMember` join table, so a user can hold different roles in different projects.

---

## 🗄️ Database Schema

See [`docs/SCHEMA.md`](./docs/SCHEMA.md) for the full Prisma schema and ER diagram.

Core entities: **User**, **Project**, **ProjectMember** (join with role), **Task**.

---

## 🧪 Local Setup

### Prerequisites
- Node.js 20+
- PostgreSQL (or a free Neon/Supabase Postgres URL)

### 1. Clone
```bash
git clone https://github.com/your-username/project-tracker.git
cd project-tracker
```

### 2. Backend
```bash
cd backend
cp .env.example .env  # then fill in DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev
npm run prisma:seed   # creates demo users + sample data
npm run dev           # starts on http://localhost:3000
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env  # set VITE_API_URL=http://localhost:3000/api
npm install
npm run dev           # starts on http://localhost:5173
```

### 4. Log in
Visit http://localhost:5173 and log in with `admin@demo.com / Demo1234`.

---

## 📡 API Documentation

Full REST API reference: [`docs/API.md`](./docs/API.md)
Interactive Swagger UI: `<backend-url>/api/docs`
Postman collection: [`docs/postman_collection.json`](./docs/postman_collection.json)

---

## 🔒 Security Considerations

- Passwords hashed with bcrypt (10 rounds)
- JWT signed with a 32+ char secret, 7-day expiry
- `helmet` for security headers
- `express-rate-limit` (5/min on auth, 100/15min globally)
- CORS restricted to known frontend origin
- Generic error messages on login (prevents user enumeration)
- All input validated with Zod on the server
- SQL injection prevented by Prisma's parameterized queries

---

## 🚧 Known Limitations & Future Improvements

- No email sending - invites require the invitee to have an existing account
- No refresh tokens - access tokens expire after 7 days
- No real-time updates - would add Socket.io for live task changes
- No file attachments on tasks
- No comments on tasks
- No activity log / audit trail
- Pagination not implemented (works fine for assessment-scale data)

---

## 📁 Project Structure

```
project-tracker/
├── backend/         # Express + Prisma API
│   ├── prisma/
│   └── src/
│       ├── config/, middleware/, modules/, utils/
│       └── app.js, server.js
├── frontend/        # React SPA
│   └── src/
│       ├── api/, components/, features/, pages/, hooks/, lib/
│       └── App.jsx, main.jsx
└── docs/            # SPEC, API, SCHEMA, ARCHITECTURE
```

---

## 📝 License

MIT - built for assessment purposes.

---

**Author:** [Your Name] · [Your Email] · [Your GitHub]
