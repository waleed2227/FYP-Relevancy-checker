# AI-Based FYP Relevancy System – Backend API

Production-ready **FastAPI** backend with **PostgreSQL**, **SQLAlchemy**, **JWT auth**, and **role-based access** (Admin, Professor, Student).

## Database configuration

| Setting  | Value                  |
|----------|------------------------|
| Database | `fyp_relevancy_system` |
| User     | `postgres`             |
| Password | `postgres123`          |
| Host     | `localhost`            |
| Port     | `5432`                 |

Connection URL (in `.env`):

```
postgresql+asyncpg://postgres:postgres123@localhost:5432/fyp_relevancy_system
```

## Project structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, routers
│   ├── config/
│   │   └── settings.py      # Environment variables
│   ├── database/            # PostgreSQL connection & sessions
│   │   ├── base.py          # SQLAlchemy Base
│   │   ├── connection.py    # URL builder
│   │   └── session.py       # Engine, get_db()
│   ├── models/              # ORM tables (users, projects, reviews…)
│   ├── schemas/             # Pydantic validation
│   ├── routes/              # API endpoints
│   │   ├── auth.py          # register, login, JWT
│   │   ├── projects.py      # submit, relevancy, review
│   │   ├── admin.py         # admin dashboards
│   │   ├── notifications.py
│   │   └── profile.py
│   ├── services/            # Business logic
│   ├── auth/                # JWT + bcrypt + dependencies
│   ├── ai/                  # Relevancy engine (ready for ML upgrade)
│   ├── middleware/          # Error handlers
│   └── utils/               # Validators, exceptions
├── alembic/                 # Migrations
├── scripts/
│   ├── create_database.py   # Create DB in PostgreSQL
│   ├── init_schema.py       # Create tables
│   └── seed.py              # UOL test users
├── requirements.txt
├── .env.example
├── run.py
└── README.md
```

## Quick start

### 1. Install dependencies

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

### 2. Set PostgreSQL password in `.env`

Open `backend/.env` and set **`DB_PASSWORD`** to the password you chose when installing PostgreSQL (not necessarily `postgres123`).

Verify connection:

```powershell
python scripts/check_connection.py
```

### 3. Create database & tables

```powershell
python scripts/setup_db.py
```

Or step by step:

```powershell
python scripts/create_database.py
python scripts/init_schema.py
python -m scripts.seed
```

**Wrong command:** `python -m scripts.init_schema`  
**Correct:** `python scripts/init_schema.py`

### 4. Run server

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or: `python run.py`

- **Swagger UI:** http://localhost:8000/docs  
- **Health:** http://localhost:8000/health  

## API endpoints

Base path: `/api/v1`

### Authentication (JWT + bcrypt)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register student or professor |
| POST | `/auth/login` | Login, returns access + refresh tokens |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout |
| GET | `/auth/me` | Current user (requires Bearer token) |

### Projects

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/projects` | Student | Submit project idea (+ files) |
| GET | `/projects/my` | Student | Own projects |
| GET | `/projects/{id}/relevancy` | Student | AI relevancy results |
| GET | `/projects/review-queue` | Professor | Pending reviews |
| POST | `/projects/{id}/review` | Professor | Approve / reject / revision |
| GET | `/projects/stats` | All | Dashboard statistics |

### Admin

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/dashboard` | System stats |
| GET | `/admin/users` | All users |
| GET | `/admin/students` | Students |
| GET | `/admin/professors` | Professors |
| GET | `/admin/departments` | Departments |

## Roles

| Role | Access |
|------|--------|
| **Student** | Register, submit projects, view relevancy |
| **Professor** | Review queue, approve/reject projects |
| **Admin** | User & system management |

## Security

- Passwords hashed with **bcrypt** (`passlib`)
- **JWT** access + refresh tokens
- Protected routes via `Authorization: Bearer <token>`
- **CORS** enabled for React (`http://localhost:5173`)

## AI module (extensible)

`app/ai/` – cosine similarity relevancy today; plug in:

- `sentence-transformers`
- OpenAI embeddings (`OPENAI_API_KEY` in `.env`)

## Troubleshooting: password authentication failed

```
asyncpg.exceptions.InvalidPasswordError: password authentication failed for user "postgres"
```

1. Run `python scripts/check_connection.py`
2. Edit `backend/.env` → set `DB_PASSWORD=` to your **actual** PostgreSQL password
3. Do **not** use a typo (e.g. `postgre123` vs `postgres123`)
4. In pgAdmin: connect to server → use the same password you put in `.env`
5. Re-run `python scripts/setup_db.py`

To reset PostgreSQL password (Windows): use pgAdmin → Login/Group Roles → postgres → Definition → set new password.

## Test accounts (after seed)

| Role | Email | Password |
|------|--------|----------|
| Student | `70140912@student.uol.edu.pk` | `Student123` |
| Professor | `professor@uol.edu.pk` | `Professor123` |
| Admin | `admin@uol.edu.pk` | `Admin123` |

## Frontend connection

In `Frontend/.env`:

```
VITE_API_URL=http://localhost:8000/api/v1
```

See **PROJECT_BACKEND_GUIDE.md** in the repo root for full documentation.
