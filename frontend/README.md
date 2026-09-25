# ReStockMX Frontend

> **An enterprise interface to discover, publish, compare, negotiate, and track industrial opportunities.**

**Recruiter snapshot:** The ReStockMX frontend is a modern, domain-driven Next.js application that turns complex industrial data into a clear, decision-oriented experience. It demonstrates advanced React patterns, TypeScript throughout, modular component architecture, centralized API client design, form validation with Zod, theme support, and a deliberate design system. This is not a collection of isolated CRUD pages—it models the real product flow from dashboard to surplus, matching, offer, and transaction.

Built with **Next.js, React, TypeScript, and Tailwind CSS**, the frontend transforms complex industrial information into a clear, decision-oriented experience.

It is not designed as a collection of isolated CRUDs. The navigation represents the actual product flow:

```text
Dashboard
   │
   ├── Surpluses
   ├── Needs
   └── Marketplace
            │
            ▼
         Matching
            │
            ▼
          Offer
            │
            ▼
       Transaction
```

## Engineering highlights

- App Router with route groups separating public and authenticated areas.
- Domain-driven component organization for scalability.
- Centralized API client with typed endpoint modules.
- Authentication context and protected routes integrated with httpOnly cookies.
- Complex forms using React Hook Form + Zod.
- Consistent UI system with light/dark theme support.
- Thoughtful design system: industrial, sober, data-first.
- Full TypeScript coverage and lint/build validation.
- Modular structure ready for team growth.

## Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | Web framework |
| React 19 | UI |
| TypeScript | Typing |
| Tailwind CSS v4 | Styling |
| React Hook Form | Forms |
| Zod | Validation |
| next-themes | Light/dark theme |
| lucide-react | Icons |

## Architecture

The frontend uses App Router and route groups:

```text
app/
├── (auth)/
│   ├── login/
│   └── registro/
│
└── (app)/
    ├── dashboard/
    ├── empresas/
    ├── excedentes/
    ├── marketplace/
    ├── materiales/
    ├── necesidades/
    ├── notificaciones/
    ├── ofertas/
    └── transacciones/
```

Authenticated pages are kept separate from public pages.

### Components by domain

```text
components/
├── dashboard/
├── matching/
├── material/
├── need/
├── notification/
├── offer/
├── surplus/
├── transaction/
├── valuation/
├── company/
├── layout/
└── ui/
```

This allows the UI to grow by modules without becoming a collection of unrelated components.

### API client

Backend calls are centralized:

```text
lib/
├── api/
│   ├── client.ts
│   └── endpoints/
│       ├── auth.ts
│       ├── companies.ts
│       ├── dashboard.ts
│       ├── matches.ts
│       ├── materials.ts
│       ├── needs.ts
│       ├── notifications.ts
│       ├── offers.ts
│       ├── specifications.ts
│       ├── surpluses.ts
│       ├── transactions.ts
│       └── valuation.ts
└── auth/
    ├── auth-context.tsx
    ├── protected-route.tsx
    └── use-auth.ts
```

## Views and features

### Home

Entry page that presents ReStockMX’s value proposition and guides the user into the enterprise experience.

### Login

```text
/login
```

Allows users to sign in and access the authenticated environment.

### Registration

```text
/registro
```

Creates the organization and its initial user.

### Dashboard

```text
/dashboard
```

Business control center.

Includes:

- KPIs;
- recent offers;
- recent transactions;
- operational activity.

```text
dashboard/
├── kpi-card.tsx
├── recent-offers.tsx
└── recent-transactions.tsx
```

### Marketplace

```text
/marketplace
/marketplace/{id}
```

Allows users to explore surpluses and view their details.

The experience aims to answer:

```text
What material is it?
How much is there?
Where is it?
How much does it cost?
What specifications does it have?
Could it be compatible with me?
```

### Surpluses

```text
/excedentes
/excedentes/nuevo
/excedentes/{id}
/excedentes/{id}/editar
```

Allows users to:

- view surpluses;
- publish;
- edit;
- manage status;
- capture specifications;
- review opportunities.

Components:

```text
surplus/
├── filters-bar.tsx
├── surplus-card.tsx
├── surplus-form.tsx
├── surplus-actions.tsx
├── spec-input.tsx
├── spec-inputs-group.tsx
└── spec-list.tsx
```

### Needs

```text
/necesidades
/necesidades/nuevo
/necesidades/{id}
/necesidades/{id}/editar
```

Allows users to register purchasing needs with:

- material;
- quantity;
- maximum price;
- description;
- specifications;
- technical ranges.

### Materials

```text
/materiales
/materiales/nuevo
/materiales/{id}
/materiales/{id}/editar
```

Allows users to manage the structured catalog of materials and their specifications.

Components:

```text
material/
├── material-card.tsx
├── material-form.tsx
├── material-actions.tsx
├── specification-form-dialog.tsx
└── specifications-section.tsx
```

### Matching

Matching is one of the differentiating experiences.

A match can be represented as:

```text
┌──────────────────────────────┐
│ Compatible company           │
│ LDPE · 5,000 kg              │
│                              │
│ Compatibility       86%      │
│ ████████████████░░           │
│                              │
│ Material           100%      │
│ Quantity            92%      │
│ Location            80%      │
│ Price               90%      │
│ Specifications      75%      │
└──────────────────────────────┘
```

Components:

```text
matching/
├── match-card.tsx
├── match-score-bar.tsx
└── matches-section.tsx
```

The goal is to show both the result and its reasons.

### Valuation

The UI presents the estimated economic impact:

```text
Gross value
      −
Estimated logistics
      =
Estimated net value
```

Components:

```text
valuation/
├── valuation-metrics.tsx
├── valuation-quick-view.tsx
└── valuation-section.tsx
```

### Offers

```text
/ofertas
/ofertas/{id}
```

An opportunity can turn into a negotiation:

```text
Offer
 ├── Accept
 ├── Reject
 ├── Counteroffer
 └── Cancel
```

Components:

```text
offer/
├── counter-dialog.tsx
├── offer-actions.tsx
├── offer-card.tsx
├── offer-form.tsx
└── offer-tabs.tsx
```

### Transactions

```text
/transacciones
/transacciones/{id}
```

Allows users to view closed operations and their evolution.

Components:

```text
transaction/
├── transaction-actions.tsx
├── transaction-card.tsx
└── transaction-timeline.tsx
```

### Companies

```text
/empresas
```

Allows users to view company information relevant to operations and the geographic component of matching.

### Notifications

```text
/notificaciones
```

Communicates relevant events in the commercial cycle.

Includes:

```text
notification-bell.tsx
notification-dropdown.tsx
```

## Authentication

```text
Login
  ↓
FastAPI
  ↓
httpOnly session cookie
  ↓
Auth Context
  ↓
ProtectedRoute
```

The frontend centralizes the session through:

```text
useAuth()
AuthContext
ProtectedRoute
```

and communicates with the backend via the API client.

## Forms

The combination:

```text
React Hook Form + Zod
```

allows handling complex forms with structured validation, especially useful for materials and technical specifications.

## Design System

The interface follows a philosophy:

> **Industrial, sober, clear, and data-oriented.**

Principles:

- data is the protagonist;
- the interface must convey operational trust;
- Mexican identity appears subtly;
- no decorative gradients or glassmorphism;
- numerical and technical values receive consistent visual treatment;
- light and dark mode support.

The visual system is based on an industrial teal with amber as an accent, maintaining a professional aesthetic.

## UI Components

```text
ui/
├── badge.tsx
├── button.tsx
├── card.tsx
├── dialog.tsx
├── empty-state.tsx
├── input.tsx
├── pagination.tsx
├── select.tsx
├── skeleton.tsx
├── spinner.tsx
├── status-badge.tsx
└── theme-toggle.tsx
```

These components help maintain visual consistency across modules.

## Run locally

Requirements:

- Node.js
- npm
- ReStockMX backend running

Install:

```bash
cd frontend
npm install
```

Configure the API:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start development:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Production

Build:

```bash
npm run build
```

Start:

```bash
npm start
```

Validations:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## The frontend in one sentence

> **ReStockMX turns the complexity of an industrial operation into an experience where discovering, comparing, negotiating, and tracking feels natural.**
