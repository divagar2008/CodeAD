# 💻 CodeAD v2

A full-stack coding practice platform for students — solve problems, get AI-powered code reviews, track progress, live session points, achievements, and an admin panel.

- **Frontend:** React 18 + React Router + Zustand + CodeMirror (in `frontend/`)
- **Backend:** Node.js + Express + Prisma + PostgreSQL (in `backend/`)
- **AI Reviews:** OpenRouter-compatible API (free Nemotron model by default)

---

## 🚀 Quick Start (Local Development)

### 1. Backend

```bash
cd backend
npm install

# Create your environment file
cp .env.example .env
# → edit .env: set DATABASE_URL, JWT_SECRET, NEMOTRON_API_KEY, FRONTEND_URL

# Create the database schema and seed demo data
npx prisma db push
npm run db:seed

# Start the API (http://localhost:5000)
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install

# Create your environment file
cp .env.example .env
# → edit .env: set REACT_APP_API_URL=http://localhost:5000/api

# Start the dev server (http://localhost:3000)
npm start
```

### Demo accounts (from seed)

| Role | Email | Password |
| ---- | ----- | -------- |
| Admin | `divagar@college.edu` / `dharshan@college.edu` | `student123` |
| Student | `athief@college.edu` (and 11 others) | `student123` |

> Admins are students with `role = 'admin'`. They log in through the normal
> student login and switch to the Admin view via the sidebar.

---

## 🧪 Testing

The repo ships with integration test suites that run against a live server:

```bash
cd backend
npm run dev            # terminal 1 — start the API on :5000

node test-all-logins.js          # verifies every seeded student can log in
node test-full-production.js     # end-to-end: auth → dashboard → problems → submit → admin CRUD
node test-free-models.js         # lists currently-free OpenRouter models
```

---

## ☁️ Production Deployment

### Required environment variables

**Backend** (`backend/.env`):

| Variable | Description |
| -------- | ----------- |
| `DATABASE_URL` | PostgreSQL connection string (**required**) |
| `JWT_SECRET` | Long random string for signing tokens (**required**) |
| `NEMOTRON_API_KEY` | OpenRouter API key for AI reviews (**required** for compile/submit) |
| `NEMOTRON_API_URL` | Defaults to `https://openrouter.ai/api/v1/chat/completions` |
| `NEMOTRON_MODEL` | Defaults to `nvidia/nemotron-3-nano-30b-a3b:free` |
| `FRONTEND_URL` | Exact URL of deployed frontend (CORS allowlist) |
| `PORT` | Port for the API (hosting platforms set this automatically) |
| `NODE_ENV` | Set to `production` |

**Frontend** (`frontend/.env`):

| Variable | Description |
| -------- | ----------- |
| `REACT_APP_API_URL` | Public URL of the backend API (baked in at **build time**) |

### Steps (generic / platform-agnostic)

1. Provision a PostgreSQL database (e.g. Neon, Supabase, Railway, RDS).
2. Deploy the **backend**: install deps, run `npx prisma db push`, run
   `npm run db:seed` once, then start with `npm start` (`node src/server.js`).
3. Deploy the **frontend**: set `REACT_APP_API_URL` to your backend's public URL,
   then build with `npm run build` and serve the `build/` folder as static files.
   The frontend is a plain static SPA (React Router uses client-side routes), so
   configure your host to rewrite all paths to `index.html`.

### Deployment notes

- **Python execution** (`compile` for python code) spawns the system Python.
  Use `python` or `python3` on the server; the app falls back between both.
  Install Python on your host if you want Python compile support.
- **Rate limiting:** 200 requests / 15 min per IP is enabled globally. Raise it
  via `max` in `server.js` if a campus shares one public IP.
- **Static build:** the frontend has no server; serve `build/` behind any static
  host (Netlify, Vercel, Nginx, S3+CloudFront, etc.).
- **Security:** JWT is passed via `Authorization: Bearer` header and stored in
  `localStorage`. For stricter setups, switch to httpOnly cookies.

---

## 📁 Project Structure

```
backend/
  prisma/            # schema + seed
  src/
    ai/              # Nemotron/OpenRouter review service
    config/          # env config, db client
    middleware/      # auth, validation, error handler
    modules/         # auth, students, problems, sessions, admin
    shared/          # errors, utils (code executor, helpers, responses)
  test-*.js          # integration test suites
frontend/
  public/
  src/
    components/      # layout + UI (Sidebar, Modal, loaders, shader)
    features/        # auth, student pages, admin pages
    hooks/           # useFetch
    lib/             # axios instance
    stores/          # zustand auth store
    styles/          # global CSS
```
