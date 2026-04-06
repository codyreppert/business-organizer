# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Commands

```bash
npm run dev          # Start Next.js dev server (http://localhost:3000)
npm run build        # Production build
npm test             # Run all unit tests
npm run test:watch   # Watch mode

npm run db:push      # Push schema to DB without migrations (dev only — Phase A only)
npm run db:migrate   # Create and apply a migration
npm run db:seed      # Seed the database
npm run db:studio    # Open Prisma Studio (visual DB browser)
npm run db:reset     # Drop and recreate DB, re-run migrations + seed
```

Requires a `.env` file with:
- `DATABASE_URL` — PostgreSQL connection string
- `ANTHROPIC_API_KEY` — required for Phase 3 AI receipt ingestion (`/ingest` page)

Do not modify `.env`.

## Phase Status

- [x] Phase A — Bootstrap + Schema + DB
- [x] Phase B — Types, utilities, tests
- [x] Phase C — Seed data, API routes
- [x] Phase D — Components, pages

## Long-term Roadmap

- [x] Phase 1 — Foundation (Phases A–D above)
- [x] Phase 2 — UI polish, delete flows, dashboard YTD totals
- [x] Phase 3 — AI receipt ingestion (receipts → TripExpense / StandaloneExpense)
- [x] Phase 4 — Tax report exports (CSV, IRS summaries)
- [x] Phase 5 — PWA / Mobile (installable, offline shell, shortcuts)

## Architecture

**Stack:** Next.js 14 App Router · PostgreSQL · Prisma · TypeScript · Tailwind CSS

- `prisma/schema.prisma` — single source of truth for the DB schema; run `db:migrate` after changes
- `src/lib/db.ts` — singleton Prisma client (safe for Next.js hot reload)
- `src/types/index.ts` — TypeScript interfaces mirroring the Prisma schema
- `src/app/` — Next.js App Router pages and API routes (server components hit DB directly)
- `src/components/` — shared React components
- `src/lib/utils/` — pure utility functions; independently tested via `__tests__/`

## API Conventions

All routes return `{ data?, error? }`.
PATCH routes accept `confirmedFields: string[]` to remove field names from `inferredFields` without
touching other values. This supports the AI-inferred field confirmation workflow.

## Core Design Principle: Inferred vs Confirmed Data

AI must never be treated as the source of truth. Any field value set by AI ingestion must:
1. Have its field name added to the model's `inferredFields` (a `String[]` column)
2. Be displayed with `<InferredBadge />` in the UI
3. Only be removed from `inferredFields` when the user explicitly confirms it (via PATCH `confirmedFields`)

This pattern applies to `BusinessAsset`, `BusinessTrip`, `TripExpense`, `StandaloneExpense`, and `Document`.
Do not bypass it for any reason.

## Key Relationships

```
BusinessAsset → Document (one-to-many)
BusinessTrip → TripExpense (one-to-many, onDelete: Cascade)
BusinessTrip → Document (one-to-many)
TripExpense → Document (one-to-many)
StandaloneExpense → Document (one-to-many)
```

Documents are polymorphic: `assetId`, `tripId`, `expenseId` (TripExpense), and `standaloneExpenseId`
are all nullable FKs. Exactly one should be set per document row. Enforced by application logic.

## Business-Specific Calculations

- Mileage deduction: `miles × mileageRate` (default IRS rate in `src/lib/utils/mileage.ts`)
- Per diem: `perDiemDays × perDiemRate` (IRS standard ~$200/day for 2024, configurable per trip)
- Trip total: `mileageDeduction + perDiem + sum(TripExpense.amount)`
- Depreciation: straight-line or double-declining in `src/lib/utils/depreciation.ts`

## Project Guardrails

- Do not build AI ingestion features until Phase 3 is explicitly started.
- Do not add authentication — out of scope currently.
- Do not change the `inferredFields` pattern without explicit instruction.
- When adding a new schema field, always create a migration — never use `db:push` after Phase A.
- New pages go in `src/app/`, components in `src/components/`, utilities in `src/lib/utils/` with a
  corresponding test in `__tests__/`.
- The IRS mileage rate constant lives in `src/lib/utils/mileage.ts`. Update it annually; do not
  hardcode it elsewhere.

## Context Files

- `plan.md` — overall project plan with schema, structure, and phase breakdown
- `implementation_notes.md` — running notes on decisions made per phase; read this first when starting a new session
