# Finance Planner

**A full-stack personal finance application for tracking cash flow, managing category budgets, and turning transaction data into actionable insights.**

Built with **Next.js 14, React, TypeScript, Node.js, Express, Prisma, and SQLite**, Finance Planner combines an interactive financial dashboard with a dedicated REST API and a relational data model.

The project focuses on clear separation of concerns, user-scoped data access, runtime input validation, and a straightforward, extensible application structure.

## Highlights

- **End-to-end financial workflows:** record, edit, filter, and review income and expenses.
- **Category-based budgeting:** define monthly spending limits, track utilization, and surface over-budget warnings.
- **Interactive reporting:** explore spending distribution and income-versus-expense trends across configurable periods.
- **Authenticated, user-scoped API:** JWT-protected endpoints with ownership checks for financial records.
- **Typed frontend integration:** reusable TypeScript API client, shared request handling, and structured response models.
- **Database-backed analytics:** Prisma aggregations power balance calculations, spending summaries, and budget status.
- **Responsive dashboard UX:** Material UI layouts, progress indicators, loading skeletons, and interactive Recharts visualizations.

## Tech Stack

| Layer              | Technologies                                  |
| ------------------ | --------------------------------------------- |
| Frontend           | Next.js 14 (App Router), React 18, TypeScript |
| UI & visualization | Material UI 6, Recharts, MUI X Date Pickers   |
| Backend            | Node.js, Express 4, TypeScript                |
| Data access        | Prisma ORM 5, SQLite                          |
| Authentication     | JSON Web Tokens (JWT), bcryptjs               |
| Validation         | Zod                                           |

## Architecture

```text
┌─────────────────────────────────────────────────────────┐
│ Next.js application                                    │
│ App Router · React · Material UI · Recharts             │
│ Auth Context · Route Guards · Typed API Client         │
└──────────────────────────┬──────────────────────────────┘
                           │ /api/* (Next.js rewrite)
                           ▼
┌─────────────────────────────────────────────────────────┐
│ Express REST API                                        │
│ Authentication · Transactions · Categories · Analytics │
│ JWT middleware · Zod request validation                │
└──────────────────────────┬──────────────────────────────┘
                           ▼
                 Prisma ORM → SQLite
```

The repository separates the `frontend/` and `backend/` applications. The frontend communicates with the backend through a centralized, typed `fetch` wrapper. In local development, Next.js rewrites `/api/*` requests to the Express server on port `4000`.

### Key design decisions

1. **Authorization at the API boundary.** Protected routes validate bearer tokens, and user-owned transactions and categories are queried using the authenticated user's ID. Mutation routes verify ownership before making changes.
2. **Validation before persistence.** Zod schemas validate registration, login, and write-operation payloads before they reach the database.
3. **Relational data modeling.** Prisma models represent users, categories, and transactions, including user-scoped category-name uniqueness, foreign-key relations, migrations, and cascading deletes.
4. **Server-side data processing.** Filtering and pagination are handled by the API, while aggregate queries calculate balances, category spending, and historical trends.
5. **Dedicated frontend data-access layer.** API calls, bearer-token attachment, query-string serialization, response typing, and HTTP error handling are consolidated rather than duplicated across pages.
6. **UX built around financial visibility.** The dashboard combines high-level metrics, recent activity, and budget utilization; the analytics view provides period controls and interactive charts.

## Features

### Authentication and accounts

- Register and sign in with email and password.
- Store password hashes using bcryptjs and authenticate API requests using JWTs.
- Restore an existing session by requesting the authenticated user's profile.
- Restrict application pages through client-side route guards.
- Initialize default categories when a user registers.

### Transactions

- Create, update, and delete income and expense records.
- Associate each transaction with a category, date, and optional comment.
- Filter by transaction type, category, and date range.
- Browse paginated results and see a running summary of total income, expenses, and net balance.

### Categories and budgets

- Manage custom categories and their icons.
- Define or clear optional monthly expense limits.
- Compare current-month spending with configured budgets.
- View utilization percentages and warnings for exceeded limits.

### Financial analytics

- Explore expense distribution by category for the current day, previous seven days, or current month.
- Compare monthly income and expenses over 3, 6, or 12 months in the UI.
- Use responsive charts and interactive tooltips to inspect the results.

> **Current scope:** The interface is Russian-language and formats monetary values in RUB. The application tracks manually entered financial records; it does not connect to banks or synchronize external accounts.

## Getting Started

### Requirements

- Node.js 18+
- npm

### 1. Clone the repository

```bash
git clone https://github.com/dimkasss/finance-planner.git
cd finance-planner
```

### 2. Start the backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

The Express API runs at **http://localhost:4000**. Prisma uses a local SQLite database.

For local development, configure a signing secret before starting the backend:

```bash
# macOS / Linux
export JWT_SECRET="replace-with-a-long-random-secret"
```

On Windows PowerShell, set it with `$env:JWT_SECRET = "replace-with-a-long-random-secret"`.

**Do not use the fallback JWT secret from the source code for a public deployment.**

### 3. Start the frontend

Open another terminal from the repository root:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**.

### Optional: Seed a demo account

From the `backend/` directory:

```bash
npm run prisma:seed
```

| Field    | Value              |
| -------- | ------------------ |
| Email    | `demo@example.com` |
| Password | `demo1234`         |

This account is intended for local demonstration only.

## REST API

All paths are relative to `/api`.

| Method   | Endpoint                          | Purpose                                       |
| -------- | --------------------------------- | --------------------------------------------- |
| `POST`   | `/auth/register`                  | Register a user                               |
| `POST`   | `/auth/login`                     | Sign in and receive a JWT                     |
| `GET`    | `/auth/me`                        | Retrieve the authenticated user               |
| `GET`    | `/transactions`                   | List transactions with filters and pagination |
| `GET`    | `/transactions/balance`           | Retrieve total income, expenses, and balance  |
| `POST`   | `/transactions`                   | Create a transaction                          |
| `PUT`    | `/transactions/:id`               | Update a transaction                          |
| `DELETE` | `/transactions/:id`               | Delete a transaction                          |
| `GET`    | `/categories`                     | List categories with spending data            |
| `POST`   | `/categories`                     | Create a category                             |
| `PUT`    | `/categories/:id`                 | Update a category                             |
| `PUT`    | `/categories/:id/limit`           | Set or clear a monthly budget                 |
| `DELETE` | `/categories/:id`                 | Delete a category and its transactions        |
| `GET`    | `/analytics/expenses-by-category` | Summarize expenses by category                |
| `GET`    | `/analytics/income-expense-trend` | Retrieve monthly income/expense trends        |
| `GET`    | `/analytics/limits-status`        | Retrieve category budget status               |
| `GET`    | `/health`                         | API health check                              |

Protected endpoints require `Authorization: Bearer <token>`.

Examples of supported query parameters:

- `GET /api/transactions?type=expense&page=1&limit=20`
- `GET /api/transactions?categoryId=2&dateFrom=2026-01-01&dateTo=2026-01-31`
- `GET /api/analytics/expenses-by-category?period=month`
- `GET /api/analytics/income-expense-trend?months=12`

## Project Structure

```text
finance-planner/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Relational data model
│   │   ├── migrations/       # Schema migrations
│   │   └── seed.ts           # Optional demo data
│   └── src/
│       ├── index.ts          # Express setup and route mounting
│       ├── middleware/       # JWT authentication
│       └── routes/           # Auth, transactions, categories, analytics
├── frontend/
│   └── src/
│       ├── app/              # Next.js App Router pages
│       ├── components/       # App layout and auth guard
│       ├── lib/              # API client, auth context, types
│       └── theme/            # Material UI theme
└── README.md
```
