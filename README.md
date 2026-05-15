# TaskPilot

A full-stack project & task management app with role-based access control. Built as a take-home assessment project.

## Live Demo

- **Frontend:** [deployed on Railway]
- **Backend API:** [deployed on Railway] — Swagger docs at `/api/docs`

## Features

- JWT + Google OAuth authentication
- Project CRUD with per-project roles (Admin / Member)
- Kanban board with drag-and-drop task management
- Member invitations and role management
- Dashboard with stats, assigned tasks, and overdue tracking
- Dark mode support
- Responsive design

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js, Express 5, TypeScript, Prisma ORM |
| Database | PostgreSQL (Neon) |
| Validation | Zod v4 |
| Auth | JWT, bcryptjs, Google OAuth |
| Frontend | React 19, TypeScript, Vite |
| UI | Tailwind CSS v4, shadcn/ui (base-ui), dnd-kit |
| Data fetching | TanStack Query v5, React Hook Form |

## RBAC Model

Roles are **per-project** — a user can be Admin in one project and Member in another.

| Action | Admin | Member |
|--------|-------|--------|
| Create / view project | ✓ | ✓ |
| Edit / delete project | ✓ | ✗ |
| Manage members | ✓ | ✗ |
| Create task | ✓ | ✓ |
| Edit any task | ✓ | ✗ |
| Edit own / assigned task | ✓ | ✓ |
| Delete task | ✓ | Creator only |

## Project Structure

```
project-tracker/
├── backend/
│   ├── prisma/              # Schema + migrations
│   ├── src/
│   │   ├── config/          # DB, env validation (Zod), Swagger
│   │   ├── middleware/       # requireAuth, RBAC, validate, error handler
│   │   ├── modules/         # auth · projects · tasks · members · dashboard · invitations
│   │   └── utils/           # ApiError, asyncHandler, JWT helpers
│   ├── tests/               # Vitest integration tests
│   ├── tsconfig.json
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/             # Axios endpoint functions
    │   ├── components/      # shadcn UI primitives + shared layout
    │   ├── features/        # Feature-level hooks & components
    │   ├── pages/           # Route-level page components
    │   └── lib/             # Axios instance, query client, utils
    ├── tsconfig.json
    └── package.json
```

## Local Setup

### Prerequisites
- Node.js 20+
- PostgreSQL database (or a free [Neon](https://neon.tech) account)

### Backend

```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, GOOGLE_CLIENT_ID
npm install
npx prisma migrate dev
npm run dev          # http://localhost:3000
```

Demo seed (optional):
```bash
npm run prisma:seed
# admin@demo.com / Demo1234!
# member@demo.com / Demo1234!
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:3000
# Set VITE_GOOGLE_CLIENT_ID=...
npm install
npm run dev          # http://localhost:5173
```

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Random string, min 32 chars |
| `PORT` | Server port (default 3000) |
| `NODE_ENV` | `development` \| `production` |
| `CORS_ORIGIN` | Frontend URL (e.g. `https://yourapp.up.railway.app`) |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |

### Frontend (`frontend/.env`)
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL |
| `VITE_GOOGLE_CLIENT_ID` | Same Google Client ID |

## Deployment (Railway)

Both services deploy from this monorepo on Railway.

**Backend service**
- Root directory: `backend`
- Build command: `npm run build`
- Start command: `npm start`
- Set all backend env vars in Railway dashboard

**Frontend service**
- Root directory: `frontend`
- Build command: `npm run build`
- Start command: `npx serve dist`  *(or use Nixpacks static output)*

After deploying:
1. Set `CORS_ORIGIN` on the backend to your frontend Railway URL
2. Set `VITE_API_URL` on the frontend to your backend Railway URL
3. Redeploy both services after env var changes

## API Documentation

Swagger UI available at `GET /api/docs` when the backend is running.
