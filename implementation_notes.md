# Implementation Notes

Read this file at the start of each new Claude Code session to restore context.
See `plan.md` for the full project plan and schema reference.

---

## Phase A — Bootstrap + Schema + DB ✅ (2026-04-04)

### What was done
- Created all config files: `package.json`, `tsconfig.json`, `jest.config.js`, `next.config.js`, `tailwind.config.js`, `postcss.config.js`
- Created `CLAUDE.md` with project guardrails, phase status, and architecture notes
- Created `.env.example` and `.env` (DATABASE_URL points to local `business_organizer` postgres DB)
- Created `prisma/schema.prisma` with all 5 models: `BusinessAsset`, `BusinessTrip`, `TripExpense`, `StandaloneExpense`, `Document`
- Ran `npm install` — all deps installed successfully
- Created `business_organizer` PostgreSQL database
- Ran `prisma migrate dev --name init` — migration `20260404213621_init` applied successfully
- `prisma validate` — schema valid ✅

### Key decisions made
- `DATABASE_URL` uses local postgres with username `codyreppert` (no password), matching household-organizer pattern
- Prisma v5.22.0 (matches household-organizer; newer v7.x available but not upgrading to stay consistent)
- No `@anthropic-ai/sdk` or `@modelcontextprotocol/sdk` in deps — Phase 3+ only

### Next: Phase C

---

## Phase B — Types + Utilities + Tests ✅ (2026-04-04)

### What was done
- `src/types/index.ts` — all enums, core entities, relational shapes, form types, API envelopes
- `src/lib/db.ts` — singleton Prisma client (copied from household-organizer)
- `src/lib/utils/date.ts` + `price.ts` — copied verbatim from household-organizer (domain-agnostic)
- `src/lib/utils/depreciation.ts` — `calcStraightLineDepreciation`, `calcDoubleDecliningDepreciation`, `calcCurrentBookValue`, `formatDepreciationMethod`
- `src/lib/utils/mileage.ts` — `IRS_MILEAGE_RATE_2024 = 0.67`, `calcMileageDeduction`, `formatMileage`
- `src/lib/utils/trip.ts` — `calcPerDiem`, `calcTripTotal`
- `src/lib/utils/validation.ts` — type guards + validators for all 4 data models
- 8 test files: 127 tests, all passing ✅
- `npx tsc --noEmit` — 0 errors ✅

---

## Phase C — Seed + API Routes ✅ (2026-04-04)

### What was done
- `prisma/seed.ts` — 2 assets, 2 trips (6 trip expenses), 3 standalone expenses, 4 documents
- `npm run db:seed` — seeded successfully ✅
- Minimal app shell: `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`
- 13 API routes:
  - `GET/POST /api/assets`, `GET/PATCH/DELETE /api/assets/[id]`, `POST /api/assets/[id]/documents`
  - `GET/POST /api/trips`, `GET/PATCH/DELETE /api/trips/[id]`, `GET/POST /api/trips/[id]/expenses`, `POST /api/trips/[id]/documents`
  - `GET/POST /api/expenses`, `GET/PATCH/DELETE /api/expenses/[id]`, `POST /api/expenses/[id]/documents`
  - `GET/DELETE /api/documents/[id]`
- `npm run build` — clean build, 0 errors ✅
- All PATCH routes implement `confirmedFields` pattern for inferredFields

### Notes
- Seed produces 6 trip expenses (3 per trip), not 5 as originally estimated — the count is correct
- File uploads write to `public/uploads/` with subdirectory by entity type/id

---

## Phase D — Components + Pages ✅ (2026-04-04)

### What was done
- 12 components: `Nav`, `InferredBadge`, `ConfirmFieldButton`, `DocumentList`, `FilterBar`, `AssetCard`, `AssetForm`, `TripCard`, `TripForm`, `TripExpenseForm`, `ExpenseCard`, `ExpenseForm`
- 13 pages: dashboard, assets (list/new/detail/edit), trips (list/new/detail/edit), expenses (list/new/detail/edit)
- `ConfirmFieldButton` generalized — accepts `apiPath` prop (works for all entity types)
- `FilterBar` generalized — accepts `filters` config array (not hardcoded to categories)
- `DocumentList` generalized — accepts `uploadPath` prop (works for all entity types)
- Prisma `Decimal` → `number` coercion done at page boundary before passing to components
- `npm run build` — clean, 25 routes, 0 errors ✅

### Notes
- Phase 1 (Foundation) is complete. App is functional: all CRUD flows work, seeded data renders correctly, `inferredFields` pattern is wired up end-to-end

---

## Phase 2 — UI Polish + Delete + Dashboard YTD ✅ (2026-04-04)

### What was done
- `.gitignore` — added (was missing entirely); excludes `node_modules`, `.next`, `.env`, `public/uploads`
- `src/app/not-found.tsx` — root 404 page, used for all `notFound()` calls across the app
- `src/components/DeleteButton.tsx` — reusable confirm-then-DELETE client component; accepts `apiPath` + `redirectTo` props; inline confirm/cancel UI (no `window.confirm`)
- `src/components/DeleteExpenseButton.tsx` — inline per-expense delete for trip detail page; calls `DELETE /api/trips/[id]/expenses/[expenseId]` and `router.refresh()`
- `src/app/api/trips/[id]/expenses/[expenseId]/route.ts` — new DELETE route for individual trip expenses
- `src/app/assets/[id]/page.tsx` — added DeleteButton (redirects to /assets)
- `src/app/trips/[id]/page.tsx` — added DeleteButton (redirects to /trips) + DeleteExpenseButton per expense row
- `src/app/expenses/[id]/page.tsx` — added DeleteButton (redirects to /expenses)
- `src/app/page.tsx` (dashboard) — added YTD summary section: trip deductions, standalone expenses, total; uses `calcTripTotal` per trip for accuracy
- `npm run build` — 27 routes, 0 errors ✅

---

## Phase 3 — AI Receipt Ingestion ✅ (2026-04-04)

### What was done
- Installed `@anthropic-ai/sdk`
- `src/app/api/ingest/receipt/route.ts` — POST endpoint; accepts multipart image/PDF; sends to Claude claude-sonnet-4-6 with vision/document blocks; returns extracted fields + `inferredFields` list
- `src/components/ReceiptIngester.tsx` — full-featured client component: file upload → extract → review form (with InferredBadge per AI field) → save as trip expense or standalone expense
- `src/app/ingest/page.tsx` — page housing ReceiptIngester; fetches trips for dropdown
- Nav updated to include "AI Ingest" link
- `npm run build` — 29 routes, 0 errors ✅

### Notes
- Requires `ANTHROPIC_API_KEY` in `.env` (not added — user must add it)
- All AI-extracted fields have their names added to `inferredFields` on the created record — fully consistent with the existing confirm/inferred pattern
- Supports JPEG, PNG, GIF, WebP, and PDF receipts

---

## Phase 4 — Tax Report Exports ✅ (2026-04-04)

### What was done
- `src/app/api/reports/trips/route.ts` — GET with optional `?year=YYYY`; returns CSV with mileage deduction, per diem, expenses, total per trip; includes IRS summary footer
- `src/app/api/reports/expenses/route.ts` — GET with optional `?year=YYYY`; returns CSV with all standalone expenses; includes totals by reimbursable/non-reimbursable
- `src/app/api/reports/assets/route.ts` — GET; returns full asset list with current book values via depreciation utils
- `src/components/ReportDownloads.tsx` — download buttons (trips CSV + expenses CSV per year; assets CSV)
- `src/app/reports/page.tsx` — per-year summary cards (trip deductions + expense totals) with download buttons; separate assets section
- Nav updated to include "Reports" link
- `npm run build` — 33 routes, 0 errors ✅

---

## Phase 5 — PWA / Mobile ✅ (2026-04-04)

### What was done
- `public/manifest.json` — full PWA manifest: name, icons, theme color, shortcuts (Add Expense, Add Trip, AI Ingest)
- `public/sw.js` — service worker: cache-first for static assets, network-first for navigation; offline shell fallback
- `public/icons/icon-192.svg` + `icon-512.svg` — indigo "B" branded SVG icons
- `src/components/ServiceWorkerRegistrar.tsx` — client component that registers SW on mount
- `src/app/layout.tsx` — added manifest link, viewport meta, apple-web-app meta, apple-touch-icon, ServiceWorkerRegistrar
- App is installable as PWA on iOS Safari and Android Chrome; works offline for previously-cached pages
- `npm run build` — 33 routes, 0 errors ✅

### Notes
- Full native App Store release would require React Native (out of scope); PWA gives 90% of the mobile experience without a separate codebase
- All 5 phases (2–5) of the roadmap are now complete
- 127 tests, all passing ✅
