# ProjectTracker

A full-stack project & task management app with role-based access control. Built as a 48-hour assessment project.

## Features

- JWT authentication (signup/login)
- Project CRUD with per-project roles (Admin / Member)
- Task management with Kanban board (drag-and-drop between columns)
- Member invitation and role management
- Dashboard with stats, assigned tasks, and overdue tracking
- Dark mode support
- Responsive design

## Tech Stack

**Backend:** Node.js, Express, Prisma, PostgreSQL (Neon), Zod, JWT  
**Frontend:** React, Vite, Tailwind CSS v4, shadcn/ui, TanStack Query, React Hook Form, dnd-kit  
**Database:** PostgreSQL hosted on Neon

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (or a Neon account)

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your database URL and JWT secret
npm install
npx prisma migrate dev
npm run prisma:seed   # optional - creates demo users
npm run dev
```

Demo credentials (after seeding):
- `admin@demo.com` / `Demo1234!` (Admin role)
- `member@demo.com` / `Demo1234!` (Member role)

### Frontend Setup

```bash
cd frontend
cp .env.example .env   # or create one with VITE_API_URL=http://localhost:3000
npm install
npm run dev
```

Open http://localhost:5173

## Project Structure

```
project-tracker/
├── backend/
│   ├── prisma/          # Schema + migrations
│   ├── src/
│   │   ├── config/      # DB, env validation, swagger
│   │   ├── middleware/   # Auth, RBAC, validation, error handler
│   │   ├── modules/     # Feature-based (auth, projects, tasks, members, dashboard)
│   │   └── utils/       # JWT helpers, ApiError class, asyncHandler
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/         # Axios endpoint functions
│   │   ├── components/  # UI primitives (shadcn) + shared layout
│   │   ├── features/    # Feature hooks + components
│   │   ├── pages/       # Route-level components
│   │   └── lib/         # Axios instance, query client, utils
│   └── package.json
└── docs/                # API contract, schema docs
```

## RBAC Model

Roles are per-project (on `ProjectMember`), not global. A user can be Admin in one project and Member in another.

| Action | Admin | Member |
|--------|-------|--------|
| Create/view project | ✓ | ✓ |
| Edit/delete project | ✓ | ✗ |
| Manage members | ✓ | ✗ |
| Create task | ✓ | ✓ |
| Edit any task | ✓ | ✗ |
| Edit own/assigned task | ✓ | ✓ |
| Delete task | ✓ | Creator only |

## Deployment

Both services deploy on Railway:

- **Backend:** Root dir `backend`, start command `npm start`
- **Frontend:** Root dir `frontend`, build `npm run build`, start `npm start`

Set `CORS_ORIGIN` on backend to the frontend URL, and `VITE_API_URL` on frontend to the backend URL.

## API Documentation

Interactive Swagger docs available at `/api/docs` when the backend is running.

See [docs/API.md](docs/API.md) for the full contract.
