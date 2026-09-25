# ReStockMX Backend

> **The engine that turns industrial data into commercial opportunities.**

**Recruiter snapshot:** The ReStockMX backend is a production-minded FastAPI API that connects companies, materials, surpluses, needs, matching, valuation, offers, and transactions. It showcases clean layered architecture, strong separation of concerns, SQLAlchemy data modeling, Alembic migrations, secure authentication, explainable matching logic, unit and integration testing, Docker multi-stage builds, and a professional local development workflow.

Built with **Python 3.13, FastAPI, SQLAlchemy 2.x, and PostgreSQL 17**, following a modular architecture where business logic is separated from HTTP and persistence.

## Engineering highlights

- Clean backend layering: API → Services → Repositories → Models.
- Business rules isolated from HTTP and database concerns.
- Pydantic schemas kept separate from ORM models.
- Deterministic, explainable matching engine with weighted scoring.
- Valuation logic that accounts for logistics costs and net value.
- Secure auth using Argon2, JWT, and httpOnly cookies.
- Alembic-managed database evolution.
- Unit and integration test coverage.
- Dockerized backend with multi-stage production image.
- Clear developer experience with `uv`, Docker Compose, and Swagger.

## Architecture

```text
HTTP
 │
 ▼
api/
 │
 ▼
services/
 │
 ▼
repositories/
 │
 ▼
models/
 │
 ▼
PostgreSQL
```

### Layers

| Layer | Responsibility |
|---|---|
| `api/` | HTTP endpoints, validation, and HTTP status codes |
| `services/` | Business rules and orchestration |
| `repositories/` | Queries and persistence |
| `models/` | SQLAlchemy entities and relationships |
| `schemas/` | Pydantic input/output contracts |
| `core/` | Configuration, security, and exceptions |
| `db/` | Engine, sessions, and metadata |

Principles:

- Endpoints do not write SQL.
- Services do not depend on `HTTPException`.
- Repositories do not contain business rules.
- ORM models remain separate from API schemas.
- Alembic controls database evolution.

## Domains

```text
auth
companies
materials
specifications
surpluses
needs
matching
valuation
offers
transactions
notifications
dashboard
```

## Matching Engine

The current engine uses a deterministic and explainable algorithm:

```text
score =
    material × 0.40
  + quantity × 0.20
  + location × 0.20
  + price × 0.10
  + specifications × 0.10
```

Material acts as a compatibility condition, and the other dimensions refine the match.

Endpoints:

```text
GET /matches/for-surplus/{id}
GET /matches/for-need/{id}
```

Results can include a per-dimension breakdown to make the recommendation interpretable.

## Valuation

```text
gross value = quantity × unit price

estimated net value
    = gross value − logistics cost
```

Endpoints:

```text
GET /valuation/surplus/{id}
GET /valuation/surplus/{id}/buyers
```

The architecture leaves room to evolve toward more precise geographic information and PostGIS.

## Main API

### Auth

```text
POST /auth/register
POST /auth/login
POST /auth/logout
GET  /auth/me
```

### Companies

```text
GET   /companies/me
PATCH /companies/me
```

### Materials

```text
GET    /materials
POST   /materials
GET    /materials/{id}
PATCH  /materials/{id}
DELETE /materials/{id}
```

### Specifications

```text
GET    /materials/{id}/specifications
POST   /materials/{id}/specifications
PATCH  /materials/{id}/specifications/{sid}
DELETE /materials/{id}/specifications/{sid}
```

### Surpluses

```text
GET    /surpluses
POST   /surpluses
GET    /surpluses/{id}
PATCH  /surpluses/{id}
DELETE /surpluses/{id}
PATCH  /surpluses/{id}/status
```

### Needs

```text
GET    /needs
POST   /needs
GET    /needs/{id}
PATCH  /needs/{id}
DELETE /needs/{id}
```

### Offers

```text
POST /offers
GET  /offers
GET  /offers/{id}
POST /offers/{id}/accept
POST /offers/{id}/reject
POST /offers/{id}/counter
POST /offers/{id}/cancel
```

### Transactions

```text
GET   /transactions
GET   /transactions/{id}
PATCH /transactions/{id}/status
```

### Notifications

```text
GET   /notifications
GET   /notifications/count
PATCH /notifications/{id}/read
PATCH /notifications/read-all
```

### Dashboard

```text
GET /dashboard
```

### Health

```text
GET /health
GET /health/database
```

## Data model

```text
Company ─── Users
         ├── Surpluses ── SurplusSpecifications
         └── Needs     ── NeedSpecifications

Material ── Specifications
         ├── Surpluses
         └── Needs

Surplus ── Offers ── Transaction
```

## Security

Authentication uses:

```text
Password
   ↓
Argon2
   ↓
Hash

Login
   ↓
JWT
   ↓
httpOnly Cookie
```

Credentials and keys are provided through environment variables.

Generate a secure key:

```bash
openssl rand -hex 32
```

## Run locally

From the root:

```bash
cp .env.example .env
docker compose up -d postgres
```

Then:

```bash
cd backend
uv sync
uv run alembic upgrade head
```

Start FastAPI:

```bash
uv run uvicorn main:app --app-dir src --reload --reload-dir src
```

API:

```text
http://localhost:8000
```

Swagger:

```text
http://localhost:8000/docs
```

Important: run backend commands from `backend/`, not from `src/`.

## Docker

The project includes a multi-stage Dockerfile to build a production image with Python 3.13 and uv.

From the root:

```bash
docker compose up --build
```

The `docker-compose.yml` separates PostgreSQL, migrations, and backend, so migrations complete before the API starts.

## Migrations

Create:

```bash
uv run alembic revision --autogenerate -m "description"
```

Apply:

```bash
uv run alembic upgrade head
```

Check:

```bash
uv run alembic current
uv run alembic history
```

Roll back:

```bash
uv run alembic downgrade -1
```

## Testing

```text
tests/
├── unit/
│   ├── test_logistics.py
│   ├── test_matching.py
│   └── test_valuation.py
│
└── integration/
    ├── test_auth.py
    ├── test_companies.py
    ├── test_materials.py
    ├── test_offers.py
    ├── test_surpluses.py
    └── test_transactions.py
```

Run the full suite:

```bash
uv run pytest -q
```

Unit tests only:

```bash
uv run pytest -m unit
```

Integration tests only:

```bash
uv run pytest -m integration
```

With coverage:

```bash
uv run pytest --cov=src
```

## The backend in one sentence

> **FastAPI is the entry point; the services contain ReStockMX’s intelligence; PostgreSQL preserves the platform’s operational knowledge.**
