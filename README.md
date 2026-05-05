<div align="center">

```
████████╗ █████╗ ███████╗██╗  ██╗███████╗██╗      ██████╗ ██╗    ██╗
╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝██╔════╝██║     ██╔═══██╗██║    ██║
   ██║   ███████║███████╗█████╔╝ █████╗  ██║     ██║   ██║██║ █╗ ██║
   ██║   ██╔══██║╚════██║██╔═██╗ ██╔══╝  ██║     ██║   ██║██║███╗██║
   ██║   ██║  ██║███████║██║  ██╗██║     ███████╗╚██████╔╝╚███╔███╔╝
   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝
```

### ⚡ NEO // v2.0 — Full-Stack Team Task Manager

[![Live Demo](https://img.shields.io/badge/🚀_LIVE_DEMO-task--flow--y42v.onrender.com-00d4ff?style=for-the-badge&logoColor=white)](https://task-flow-y42v.onrender.com)
[![GitHub](https://img.shields.io/badge/GitHub-CoderParva%2FTask--Flow-181717?style=for-the-badge&logo=github)](https://github.com/CoderParva/Task-Flow)

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-FF6B35?style=flat-square&logo=jsonwebtokens&logoColor=white)
![Render](https://img.shields.io/badge/Deployed_on-Render-46E3B7?style=flat-square&logo=render&logoColor=white)

</div>

---

## 🌐 Live Application

> **👉 [https://task-flow-y42v.onrender.com](https://task-flow-y42v.onrender.com)**

> ⚠️ Hosted on Render free tier — first load may take **~30 seconds** to wake up. Subsequent requests are instant.

---

## ✨ What is TaskFlow?

TaskFlow is a **collaborative team task management platform** where teams can create projects, assign tasks, and track progress — all with role-based access control. Think of it as a simplified Trello/Asana with a futuristic cyberpunk UI.

---

## 🚀 Features

| Feature | Description |
|---|---|
| 🔐 **JWT Authentication** | Secure signup/login with 7-day token expiry and bcrypt password hashing |
| 📁 **Project Management** | Create projects, invite teammates, manage roles |
| 📋 **Task Management** | Create tasks with title, description, priority, due date, assignee |
| 🗂️ **Kanban Board** | Visual board with To Do / In Progress / Done columns |
| 📊 **Dashboard** | Real-time stats — total tasks, completion rate, overdue, per-member load |
| 🛡️ **Role-Based Access** | Admins manage everything; Members update only their assigned tasks |
| 🎨 **Futuristic UI** | Cyberpunk dark theme with neon glows, glassmorphism and animations |

---

## 🛡️ Role-Based Access Control

| Action | Admin | Member |
|---|---|---|
| Create project | ✅ | ✅ |
| Add / remove members | ✅ | ❌ |
| Create tasks | ✅ | ❌ |
| Edit task details | ✅ | ❌ |
| Update task status | ✅ | ✅ Own tasks only |
| Delete tasks | ✅ | ❌ |
| Delete project | ✅ | ❌ |
| View all tasks | ✅ | ✅ |

---

## 🏗️ Project Structure

```
Task-Flow/
├── backend/
│   ├── db/
│   │   └── database.js        # SQLite schema & connection
│   ├── middleware/
│   │   └── auth.js            # JWT verification middleware
│   ├── routes/
│   │   ├── auth.js            # Signup, Login, /me
│   │   ├── projects.js        # Project CRUD + member management
│   │   ├── tasks.js           # Task CRUD + dashboard stats
│   │   └── users.js           # User search
│   └── server.js              # Express entry point
├── frontend/
│   └── src/
│       ├── contexts/          # AuthContext — global auth state
│       ├── pages/             # Login, Signup, Dashboard, Projects, ProjectDetail
│       ├── components/        # Layout, Toast notifications
│       └── utils/             # API client, date/label helpers
├── .nvmrc                     # Node version pin (20.x)
├── package.json               # Root monorepo scripts
└── README.md
```

---

## 🗄️ Database Schema

```sql
users            — id, name, email, password(bcrypt), created_at
projects         — id, name, description, created_by, created_at
project_members  — project_id, user_id, role(admin|member), joined_at
tasks            — id, title, description, project_id, assigned_to,
                   created_by, status, priority, due_date, timestamps
```

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login — returns JWT token |
| GET | `/api/auth/me` | Get current logged-in user |

### Projects
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/projects` | All members |
| POST | `/api/projects` | Any user |
| GET | `/api/projects/:id` | Members only |
| PUT | `/api/projects/:id` | Admin only |
| DELETE | `/api/projects/:id` | Admin only |
| POST | `/api/projects/:id/members` | Admin only |
| DELETE | `/api/projects/:id/members/:userId` | Admin only |

### Tasks
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/tasks/dashboard` | All members (stats) |
| GET | `/api/tasks/project/:id` | All members |
| POST | `/api/tasks` | Admin only |
| PUT | `/api/tasks/:id` | Admin (full) / Assignee (status) |
| DELETE | `/api/tasks/:id` | Admin only |

---

## ⚙️ Local Setup

### Prerequisites
- Node.js **v20.x**
- npm v9+
- Git

### 1. Clone the repo
```bash
git clone https://github.com/CoderParva/Task-Flow.git
cd Task-Flow
```

### 2. Install dependencies
```bash
npm run install:all
```

### 3. Create environment files

**`backend/.env`**
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-key-minimum-32-chars
DB_PATH=./data
FRONTEND_URL=http://localhost:5173
```

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:5000
```

### 4. Run the app
```bash
# Terminal 1 — Backend (http://localhost:5000)
npm run dev:backend

# Terminal 2 — Frontend (http://localhost:5173)
npm run dev:frontend
```

---

## 🚀 Deployment

Deployed on **Render** as a single service.

- `npm run build` — installs deps + builds React frontend
- `node backend/server.js` — Express serves both API and static frontend
- No separate frontend hosting needed

### Environment Variables on Render
```
NODE_ENV=production
JWT_SECRET=your-secret-key
PORT=10000
```

---

## 🔒 Security

- Passwords encrypted with **bcrypt** (10 salt rounds)
- **JWT tokens** verified on every protected route
- **Parameterized SQL queries** — no injection possible
- **Server-side role checks** on every mutating endpoint
- Project data isolated — users only see their own projects

---

## 🧪 How to Test Role-Based Access

1. Sign up as **User A** → create a project → you are now Admin
2. Open incognito window → sign up as **User B**
3. As User A → go to Operators tab → add User B by email
4. As User A → create a task → assign it to User B
5. Log in as User B → you can only update **status** of your task
6. User B cannot create, edit, or delete anything ✅

---

## 📦 Tech Stack

| Layer | Tech |
|---|---|
| **Frontend** | React 18, React Router v6, Vite |
| **Backend** | Node.js v20, Express.js |
| **Database** | SQLite, better-sqlite3 |
| **Auth** | JSON Web Tokens, bcryptjs |
| **Deployment** | Render, GitHub |
| **Fonts** | Orbitron, Outfit, JetBrains Mono |

---

<div align="center">

**Built by [Parva Nachan](https://github.com/CoderParva)**

⭐ Star this repo if you found it useful!

</div>
