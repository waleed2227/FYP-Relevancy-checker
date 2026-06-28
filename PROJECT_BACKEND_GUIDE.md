# AI-Based FYP Relevancy System – Complete Backend Guide

This guide explains the **entire project** in beginner-friendly language so you can understand, run, and maintain it later.

---

## 1. What is this project?

A **Final Year Project (FYP) relevancy system** for the **University of Lahore (UOL)**:

- **Students** submit project ideas and get an **AI relevancy score**.
- **Professors** review and approve/reject/revision requests.
- **Admins** manage users, departments, and system analytics.

**Tech stack:**

| Layer      | Technology                          |
|-----------|--------------------------------------|
| Frontend  | React + Vite + TypeScript + Tailwind |
| Backend   | FastAPI (Python)                     |
| Database  | PostgreSQL                           |
| Auth      | JWT (access + refresh tokens)        |
| Passwords | bcrypt (via passlib)                 |
| ORM       | SQLAlchemy (async)                   |
| Migrations| Alembic                              |

---

## 2. Project folder structure

```
FYP-Relevancy-checker/
├── Frontend/                 # React UI (do not change layout when wiring APIs)
│   └── src/app/
│       ├── components/       # Screens (Login, Registration, Dashboards…)
│       ├── context/          # Auth, Notifications, Theme
│       ├── services/         # api.ts, authService.ts → calls backend
│       └── utils/            # validation.ts (UOL rules on frontend)
│
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── main.py           # App entry, CORS, routes
│   │   ├── database.py       # PostgreSQL connection
│   │   ├── config/           # Settings from .env
│   │   ├── models/           # Database tables (SQLAlchemy)
│   │   ├── schemas/          # Request/response validation (Pydantic)
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Business logic
│   │   ├── auth/             # JWT + password hashing
│   │   ├── ai/               # Relevancy / similarity engine
│   │   ├── middleware/       # Error formatting
│   │   └── utils/            # validators.py (UOL rules)
│   ├── alembic/              # Database migrations
│   ├── scripts/seed.py       # Create test users + sample data
│   ├── requirements.txt
│   └── .env.example
│
└── PROJECT_BACKEND_GUIDE.md  # This file
```

### What each backend folder does

| Folder        | Purpose |
|---------------|---------|
| `config/`     | Reads `.env` (DB URL, JWT secret, CORS). |
| `models/`     | Defines **tables** as Python classes. |
| `schemas/`    | Validates **incoming JSON** before it hits the database. |
| `routes/`     | Maps URLs like `POST /auth/register` to functions. |
| `services/`   | Core logic: register user, submit project, run AI score. |
| `auth/`       | Hash passwords, create/verify JWT tokens. |
| `ai/`         | Compares project text to existing projects (cosine similarity). |
| `middleware/` | Turns validation errors into readable messages. |

---

## 3. Database tables (PostgreSQL)

| Table               | What it stores |
|---------------------|----------------|
| `users`             | Login email, hashed password, role, phone (unique email). |
| `students`          | Links to `users`, **unique** `student_id` (numeric). |
| `professors`        | Links to `users`, department. |
| `admins`            | Links to `users`. |
| `departments`       | CS, Data Science, etc. |
| `project_ideas`     | Title, description, status, relevancy score. |
| `project_attachments` | Uploaded PDF/DOC files. |
| `relevancy_results` | AI scores per project. |
| `matched_projects`  | Similar past projects. |
| `reviews`           | Professor approve/reject/revision + feedback. |
| `notifications`     | User alerts. |
| `ai_suggestions`    | AI tips for students. |
| `duplicate_reports` | Admin duplicate-detection reports. |

**Relationships (simple view):**

- One **user** → one profile: student OR professor OR admin.
- One **student** → many **project_ideas**.
- One **professor** → supervises many **project_ideas**.
- One **project** → one **relevancy_result**.

---

## 4. UOL registration validation rules

Validation runs on **both frontend and backend** (never trust the browser alone).

### Student

| Field        | Rule |
|-------------|------|
| Email       | `{studentId}@student.uol.edu.pk` e.g. `70140912@student.uol.edu.pk` |
| Student ID  | **Digits only**, 5–12 characters, must match email prefix |
| Phone       | Pakistani: `+923001234567` or `03001234567` (optional) |
| Password    | Minimum **8** characters |

### Professor

| Field        | Rule |
|-------------|------|
| Email       | `name@uol.edu.pk` — **not** `@student.uol.edu.pk` |
| Department  | Required |
| Phone       | Pakistani format (optional) |
| Password    | Minimum 8 characters |

### Admin

- Created via seed script (not self-registration in UI).
- Email: `admin@uol.edu.pk`

**Backend files:** `app/utils/validators.py`, `app/schemas/auth.py`  
**Frontend file:** `Frontend/src/app/utils/validation.ts`

---

## 5. How registration works (step by step)

1. User fills the form on `Registration.tsx`.
2. Frontend `validation.ts` checks UOL email, student ID, phone.
3. `authService.register()` sends JSON to `POST /api/v1/auth/register`.
4. FastAPI validates body with **Pydantic** `RegisterRequest`.
5. `auth_service.register_user()`:
   - Checks email not already used.
   - Hashes password with **bcrypt**.
   - Inserts into `users` + `students` or `professors`.
6. API returns **access_token** and **refresh_token**.
7. Frontend saves tokens in `localStorage`, calls `GET /auth/me` for profile.
8. User is redirected to dashboard.

**Common errors (now shown clearly):**

- `Email already registered`
- `Invalid UOL student email…`
- `Student ID must contain numbers only`
- `Cannot reach server` (backend not running)

---

## 6. How login works

1. User submits email + password + role on `Login.tsx`.
2. `POST /api/v1/auth/login` with `{ email, password, role }`.
3. Backend finds user, verifies password with `verify_password()`.
4. Checks role matches (student/professor/admin).
5. Returns JWT tokens.
6. Frontend stores tokens and loads `/auth/me`.

---

## 7. JWT authentication (how tokens work)

| Token          | Lifetime   | Used for |
|----------------|------------|----------|
| Access token   | 30 minutes | Every API call (`Authorization: Bearer …`) |
| Refresh token  | 7 days     | Get new access token when expired |

**Flow:**

```
Login → receive tokens → save in localStorage
     → each API request sends access token
     → if 401 → try refresh → retry request
     → if refresh fails → logout
```

**Backend:** `app/auth/security.py` (create/verify tokens)  
**Frontend:** `Frontend/src/app/services/api.ts`

---

## 8. API routes (Swagger)

Base URL: `http://localhost:8000/api/v1`

Interactive docs: **http://localhost:8000/docs**

### Authentication

| Method | Path            | Description |
|--------|-----------------|-------------|
| POST   | `/auth/register`| Student/professor signup |
| POST   | `/auth/login`   | Login |
| POST   | `/auth/refresh` | New access token |
| POST   | `/auth/logout`  | Logout (client clears tokens) |
| GET    | `/auth/me`      | Current user profile |

### Projects

| Method | Path                      | Who |
|--------|---------------------------|-----|
| POST   | `/projects`               | Student (multipart form) |
| GET    | `/projects/my`            | Student |
| GET    | `/projects/stats`         | All roles |
| GET    | `/projects/assigned`      | Professor |
| GET    | `/projects/review-queue`  | Professor |
| POST   | `/projects/{id}/review`   | Professor |
| GET    | `/projects/{id}/relevancy`| Student/Professor |

### Admin

| Method | Path                |
|--------|---------------------|
| GET    | `/admin/dashboard`  |
| GET    | `/admin/users`      |
| GET    | `/admin/students`   |
| GET    | `/admin/professors` |
| GET    | `/admin/departments`|

---

## 9. AI module purpose

Location: `backend/app/ai/`

| File                 | Role |
|----------------------|------|
| `embeddings.py`      | Text → vectors, cosine similarity |
| `relevancy_engine.py`| Overall score, novelty, feasibility, matched projects |

**Today:** lightweight TF-IDF + cosine similarity (no GPU required).  
**Later:** swap in `sentence-transformers` or OpenAI embeddings in `embeddings.py`.

When a student submits a project, `run_relevancy_analysis()` compares it to existing projects and saves scores in `relevancy_results`.

---

## 10. Environment variables

### Backend (`backend/.env`)

| Variable | Example | Meaning |
|----------|---------|---------|
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@localhost:5432/fyp_relevancy` | PostgreSQL connection |
| `SECRET_KEY` | long random string | Signs JWT tokens |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed frontend URLs |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Access token lifetime |

### Frontend (`Frontend/.env`)

| Variable | Example |
|----------|---------|
| `VITE_API_URL` | `http://localhost:8000/api/v1` |

---

## 11. How to run the project

### Step A – PostgreSQL

```sql
CREATE DATABASE fyp_relevancy;
```

Or Docker:

```bash
docker run -d --name fyp-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=fyp_relevancy -p 5432:5432 postgres:16
```

### Step B – Backend

```powershell
cd backend
py -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
py -m scripts.seed
uvicorn app.main:app --reload --port 8000
```

### Step C – Frontend

```powershell
cd Frontend
copy .env.example .env
npm install
npm run dev
```

Open: http://localhost:5173

---

## 12. Test accounts (after seed)

| Role      | Email                             | Password     |
|-----------|-----------------------------------|--------------|
| Student   | 70140912@student.uol.edu.pk       | Student123   |
| Professor | professor@uol.edu.pk              | Professor123 |
| Admin     | admin@uol.edu.pk                  | Admin123     |

Re-create test users:

```powershell
py -m scripts.seed --force
```

---

## 13. How to test APIs

### Swagger UI

1. Go to http://localhost:8000/docs  
2. Try `POST /auth/login` with student credentials.  
3. Click **Authorize**, paste: `Bearer <access_token>`.  
4. Call `GET /auth/me` or `GET /projects/my`.

### curl

```bash
curl -X POST http://localhost:8000/api/v1/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"full_name\":\"Test Student\",\"email\":\"70140912@student.uol.edu.pk\",\"password\":\"Student123\",\"role\":\"student\",\"student_id\":\"70140912\",\"phone_number\":\"03001234567\"}"
```

### Register new student (must follow UOL rules)

- Email: `70140912@student.uol.edu.pk`
- Student ID: `70140912`
- Password: min 8 chars

---

## 14. Frontend ↔ backend connection

```
Registration.tsx
    → authService.register()
        → api.post('/auth/register')
            → FastAPI routes/auth.py
                → auth_service.register_user()
                    → PostgreSQL
```

**Important:** Frontend must use `VITE_API_URL`. If registration says "Cannot reach server", start uvicorn first.

---

## 15. Important commands

| Task | Command |
|------|---------|
| Start backend | `uvicorn app.main:app --reload --port 8000` |
| Seed database | `py -m scripts.seed` |
| Reset UOL users | `py -m scripts.seed --force` |
| Start frontend | `npm run dev` (in Frontend/) |
| Alembic migrate | `alembic upgrade head` |

---

## 16. End-to-end workflow

```mermaid
flowchart LR
    A[Student registers] --> B[Login JWT]
    B --> C[Submit project idea]
    C --> D[AI relevancy analysis]
    D --> E[Professor review queue]
    E --> F[Approve / Reject / Revision]
    F --> G[Notification to student]
```

1. **Register** with UOL email rules.  
2. **Login** → receive JWT.  
3. **Submit idea** → stored in `project_ideas`, AI runs.  
4. **Professor** sees item in review queue.  
5. **Review** updates status + creates notification.  
6. **Student** sees result on dashboard.

---

## 17. Troubleshooting registration

| Problem | Fix |
|---------|-----|
| "Cannot reach server" | Run backend on port 8000; check `Frontend/.env` |
| "Invalid UOL student email" | Use `70140912@student.uol.edu.pk` format |
| "Email already registered" | Use different email or `--force` seed |
| "Student ID must contain numbers only" | Remove letters from student ID |
| 422 validation error | Read message; frontend now shows field errors |
| Database connection error | PostgreSQL running? Check `DATABASE_URL` in `.env` |

---

## 18. Security notes (for production)

- Change `SECRET_KEY` to a long random value.
- Use HTTPS.
- Restrict `CORS_ORIGINS` to your real domain.
- Never commit `.env` to Git.
- Rate-limit login/register endpoints.

---

You now have a full map of the backend: structure, database, APIs, auth, validation, AI, and how to run and test everything. Keep this file in the repo root for future reference.
