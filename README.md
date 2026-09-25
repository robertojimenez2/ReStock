# ReStockMX

> **Intelligence to turn industrial surplus into value.**

**Recruiter snapshot:** ReStockMX is a full-stack B2B platform for the intelligent valorization and commercialization of industrial surplus. It demonstrates end-to-end product engineering: modern frontend development, a layered FastAPI backend, PostgreSQL data modeling, explainable matching logic, secure authentication, Dockerized environments, and CI-ready workflows. The architecture is a **modular monolith**—professional domain separation without the operational overhead of microservices.

**Initial market:** Guadalajara / El Salto, Jalisco — initially focused on the plastics industry.

## Engineering highlights

- Full-stack delivery with Next.js, React, TypeScript, FastAPI, SQLAlchemy, and PostgreSQL.
- Clean backend layering: API → Services → Repositories → Models.
- Explainable matching engine with weighted, transparent scoring.
- Business logic for valuation, logistics cost, offers, counteroffers, transactions, and notifications.
- Security with JWT, httpOnly cookies, and Argon2.
- Docker Compose for reproducible local development and GitHub Actions for CI.

## What makes ReStockMX different?

ReStockMX is not just a marketplace for leftovers. It combines technical, economic, and geographic information to help companies discover what to do with a surplus, who could use it, and which alternative can create the most value.

```text
Industrial surplus
        +
Technical information
        +
Compatibility
        +
Location
        +
Logistics
        +
Valorization
        ↓
Recommendation of alternatives
        ↓
Offer → Negotiation → Transaction
```

The platform enables users to:

- Catalog materials and technical specifications.
- Publish industrial surpluses.
- Register purchasing needs.
- Find technically compatible companies.
- Explain why an opportunity is compatible.
- Estimate logistics and net value.
- Negotiate through offers and counteroffers.
- Track transactions and notifications.
- Review operational metrics from a dashboard.

The core idea is to transform **“I have leftover material”** into **“I know what I have, who can use it, how much it may be worth, and which alternative is worth analyzing.”**

## General architecture

ReStockMX uses a **modular monolith** with separate frontend and backend layers:

```text
┌─────────────────────────────────────────┐
│ Frontend                                │
│ Next.js · React · TypeScript            │
│ Dashboard · Marketplace · Operations    │
└──────────────────┬──────────────────────┘
                   │ REST / HTTP
                   ▼
┌─────────────────────────────────────────┐
│ Backend                                 │
│ FastAPI · Python                        │
│ API → Services → Repositories → Models  │
└──────────────────┬──────────────────────┘
                   │ SQLAlchemy
                   ▼
┌─────────────────────────────────────────┐
│ PostgreSQL 17                           │
└─────────────────────────────────────────┘
```

This modular separation maintains a professional architecture without introducing the operational complexity of microservices.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 · React 19 · TypeScript |
| UI | Tailwind CSS v4 |
| Backend | Python 3.13 · FastAPI |
| ORM | SQLAlchemy 2.x |
| Migrations | Alembic |
| Database | PostgreSQL 17 |
| Validation | Pydantic |
| Security | JWT · httpOnly cookies · Argon2 |
| Infrastructure | Docker · Docker Compose |
| CI | GitHub Actions |

## Product domains

```text
Auth
Companies
Materials
Specifications
Surpluses
Needs
Matching
Valuation
Offers
Transactions
Notifications
Dashboard
```

The business model connects materials with specifications, surpluses, and needs; a match can then evolve into an offer and a transaction.

## Matching engine

The initial matching logic is deterministic and explainable:

```text
Material          40%
Quantity          20%
Location          20%
Price             10%
Specifications    10%
```

Each result can display a score breakdown, so the platform does not simply say **“there is compatibility”**—it can explain the components behind that compatibility.

## Valuation and logistics

The platform estimates:

```text
gross value = quantity × unit price

estimated net value
    = gross value − logistics cost
```

This allows an opportunity to be analyzed not only by its published price, but also by the estimated cost of moving the material to the buyer.

## Repository structure

```text
restock/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   └── services/
│   ├── alembic/
│   └── tests/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   └── lib/
│
├── docker-compose.yml
├── .env.example
└── README.md
```

## Running the project

Requirements:

- Docker
- Docker Compose

```bash
git clone <repo-url>
cd restock
cp .env.example .env
docker compose up --build
```

Services:

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8000 |
| Swagger | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |

To stop:

```bash
docker compose down
```

To also delete PostgreSQL data:

```bash
docker compose down -v
```

## Philosophy

> **Surplus is not necessarily waste; it can be an asset for another company.**

ReStockMX aims to turn scattered industrial information into clearer operational decisions, making the platform a tool for **industrial intelligence, valorization, and commercialization**—not just a materials catalog.

---

## Documentation

- [Backend](backend/README.md)
- [Frontend](frontend/README.md)
