# TaskFlow – Team Task Manager

A full-stack collaborative task management web application built with Node.js, Express, SQLite, and React.

![Tech Stack](https://img.shields.io/badge/Node.js-18+-green) ![React](https://img.shields.io/badge/React-18-blue) ![SQLite](https://img.shields.io/badge/SQLite-3-orange) ![JWT](https://img.shields.io/badge/Auth-JWT-yellow)

---

## ✨ Features

- **User Authentication** — Secure signup/login with JWT tokens (7-day expiry)
- **Project Management** — Create projects, manage members with Admin/Member roles
- **Task Management** — Create tasks with title, description, priority, due date, and assignment
- **Kanban Board** — Visual task board grouped by status (To Do / In Progress / Done)
- **Dashboard** — Real-time stats: total tasks, tasks by status, overdue tasks, tasks per user
- **Role-Based Access Control**
  - **Admin**: Full CRUD on tasks, members, and project settings
  - **Member**: View tasks, update status of assigned tasks only

---

## 🏗 Architecture

```
taskflow/
├── backend/                  # Node.js + Express REST API
│   ├── db/database.js        # SQLite schema & connection
│   ├── middleware/auth.js    # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js           # POST /api/auth/signup, /login, GET /me
│   │   ├── projects.js       # CRUD + member management
│   │   ├── tasks.js          # CRUD + dashboard stats
│   │   └── users.js          # User search
│   └── server.js             # Express app entry point
├── frontend/                 # React + Vite SPA
│   └── src/
│       ├── contexts/         # AuthContext (global auth state)
│       ├── pages/            # Login, Signup, Dashboard, Projects, ProjectDetail
│       ├── components/       # Layout, Toast notifications
│       └── utils/            # API client, date/status helpers
├── package.json              # Root scripts for monorepo build
└── railway.json              # Railway deployment config
```

---

## 🗄 Database Schema

```sql
users             – id, name, email, password (bcrypt), created_at
projects          – id, name, description, created_by, created_at
project_members   – project_id, user_id, role (admin|member)
tasks             – id, title, description, project_id, assigned_to,
                    created_by, status, priority, due_date, timestamps
```

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/taskflow.git
cd taskflow
```

### 2. Install all dependencies
```bash
npm run install:all
```

### 3. Configure environment variables

**Backend** — create `backend/.env`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-key-at-least-32-chars
DB_PATH=./data
FRONTEND_URL=http://localhost:5173
```

**Frontend** — create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
```

### 4. Start development servers

In two separate terminals:

```bash
# Terminal 1 – Backend API (http://localhost:5000)
npm run dev:backend

# Terminal 2 – Frontend (http://localhost:5173)
npm run dev:frontend
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET  | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/projects` | Member+ |
| POST | `/api/projects` | Any user |
| GET | `/api/projects/:id` | Member+ |
| PUT | `/api/projects/:id` | Admin |
| DELETE | `/api/projects/:id` | Admin |
| POST | `/api/projects/:id/members` | Admin |
| DELETE | `/api/projects/:id/members/:userId` | Admin |

### Tasks
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/tasks` | Member+ (own projects) |
| GET | `/api/tasks/dashboard` | Member+ (stats) |
| GET | `/api/tasks/project/:id` | Member+ |
| POST | `/api/tasks` | Admin |
| PUT | `/api/tasks/:id` | Admin (full) / Assignee (status only) |
| DELETE | `/api/tasks/:id` | Admin |

---

## 🚂 Deployment on Railway

### Option A: One-Click Deploy (Recommended)

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub Repo**
3. Select your repository
4. Railway auto-detects the `railway.json` config

### Option B: Railway CLI

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Environment Variables on Railway

Set these in Railway dashboard → Variables:

```
NODE_ENV=production
JWT_SECRET=<generate a strong random string>
PORT=5000        # Railway sets this automatically
```

> **Note:** The frontend is built during `npm run build` and served as static files by the Express backend. No separate frontend service needed.

---

## 🔑 Role-Based Access Control

| Action | Admin | Member |
|--------|-------|--------|
| Create project | ✅ | ✅ |
| Add/remove members | ✅ | ❌ |
| Create tasks | ✅ | ❌ |
| Edit any task | ✅ | ❌ |
| Update task status | ✅ | Own tasks only |
| Delete tasks | ✅ | ❌ |
| Delete project | ✅ | ❌ |
| View project & tasks | ✅ | ✅ |

---

## 🛡 Security

- Passwords hashed with **bcrypt** (10 salt rounds)
- JWT tokens with **7-day expiry**, verified on every protected route
- SQL injection prevented via **parameterized queries** (better-sqlite3)
- Project access enforced server-side on every request
- Role checks on every mutating endpoint

---

## 🧪 Testing the Application

1. Sign up as **User A** → create a project → you become Admin
2. Sign up as **User B** → note their email
3. As User A (Admin): add User B to the project as Member
4. As User A: create tasks and assign to User B
5. As User B (Member): log in → open the project → update status of assigned tasks
6. Observe User B cannot create/edit/delete tasks

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, Vite |
| Backend | Node.js, Express 4 |
| Database | SQLite (better-sqlite3) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Deployment | Railway |
| Fonts | Syne, DM Sans, JetBrains Mono |

---

## 📁 Key Design Decisions

- **SQLite** chosen for zero-config deployment (no external database service required on Railway)
- **Monorepo** structure: frontend built to `frontend/dist/`, served as static files by Express in production
- **No ORM** — raw SQL for transparency and performance; better-sqlite3 for synchronous API (cleaner code)
- **Kanban view** — tasks grouped by status column for at-a-glance project health

---

*Built as part of Full-Stack Coding Assignment – Team Task Manager*
