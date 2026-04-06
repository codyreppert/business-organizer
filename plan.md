# Business Organizer — Project Plan

## Purpose

Track business assets, trips (with mileage/per diem/expenses), and standalone expenses for tax paper-trail purposes. Sibling project to household-organizer; identical stack.

## Stack

- Next.js 14 App Router + TypeScript + Tailwind CSS
- Prisma ORM + PostgreSQL (`business_organizer` database)
- Jest + ts-jest (unit testing)
- `@/*` → `./src/*` path alias
- REST API: `{ data?, error? }` response shape
- `inferredFields: String[]` on all models (AI-readiness)

## Database Models

### `BusinessAsset`
`id`, `name`, `category` (equipment|technology), `subcategory`, `brand`, `model`, `serialNumber`, `purchaseDate`, `purchasePrice`, `warrantyStart`, `warrantyEnd`, `depreciationMethod` (straight-line|double-declining|none), `usefulLifeYears`, `salvageValue`, `status` (active|retired|disposed), `notes`, `inferredFields`
→ has many `Document`

### `BusinessTrip`
`id`, `clientOrProject`, `description`, `destination`, `startDate`, `endDate`, `miles`, `mileageRate`, `perDiemDays`, `perDiemRate`, `notes`, `inferredFields`
→ has many `TripExpense` (onDelete: Cascade), `Document`

### `TripExpense`
`id`, `tripId` (FK), `category` (meals|lodging|transport|supplies|software|other), `amount`, `date`, `merchant`, `description`, `inferredFields`
→ has many `Document`

### `StandaloneExpense`
`id`, `category`, `amount`, `date`, `merchant`, `description`, `businessPurpose`, `reimbursable`, `inferredFields`
→ has many `Document`

### `Document` (polymorphic)
Nullable FKs: `assetId?`, `tripId?`, `expenseId?` (TripExpense), `standaloneExpenseId?`
`name`, `type` (receipt|invoice|contract|warranty|other), `filePath`, `fileSizeBytes`, `mimeType`, `inferredFields`

## File Structure

```
business-organizer/
├── CLAUDE.md
├── plan.md                        ← this file
├── implementation_notes.md        ← running phase notes
├── package.json, tsconfig.json, jest.config.js, next.config.js
├── tailwind.config.js, postcss.config.js
├── .env (DATABASE_URL only)
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── __tests__/
│   ├── utils/  (date, price, depreciation, mileage, trip)
│   └── validation/  (asset, trip, expense)
└── src/
    ├── types/index.ts
    ├── lib/
    │   ├── db.ts
    │   └── utils/  (date, price, depreciation, mileage, trip, validation)
    ├── components/
    │   ├── Nav.tsx, InferredBadge.tsx, ConfirmFieldButton.tsx
    │   ├── DocumentList.tsx, FilterBar.tsx
    │   ├── AssetCard.tsx, AssetForm.tsx
    │   ├── TripCard.tsx, TripForm.tsx, TripExpenseForm.tsx
    │   └── ExpenseCard.tsx, ExpenseForm.tsx
    └── app/
        ├── layout.tsx, globals.css, page.tsx (dashboard)
        ├── assets/ (list, new, [id], [id]/edit)
        ├── trips/  (list, new, [id], [id]/edit)
        ├── expenses/ (list, new, [id], [id]/edit)
        └── api/
            ├── assets/ + [id]/ + [id]/documents/
            ├── trips/ + [id]/ + [id]/expenses/ + [id]/documents/
            ├── expenses/ + [id]/ + [id]/documents/
            └── documents/[id]/
```

## Phases

### Phase A — Bootstrap + Schema + DB ✅
Config files, CLAUDE.md, Prisma schema, initial migration.

### Phase B — Types + Utilities + Tests ✅
### Phase C — Seed + API Routes ✅
### Phase D — Components + Pages ✅
`src/types/index.ts`, `src/lib/db.ts`, 6 utility files, 8 test files.
Verify: `npm test` all green, `npx tsc --noEmit` passes.

### Phase C — Seed + API Routes
`prisma/seed.ts`, all API route files.
Verify: `npm run db:seed` logs correct counts, `npm run build` passes.

### Phase D — Components + Pages
All `src/components/` and `src/app/` page files.
Verify: build passes, pages render with seeded data, CRUD flows work.

## Key Design Decisions

- No root "business" entity — assets, trips, expenses are parallel first-class entities
- `mileageRate` and `perDiemRate` stored per trip — preserves historical IRS accuracy
- `TripExpense` cascades on trip delete
- `inferredFields` on all models now — zero migration needed for Phase 3 AI
- No `@anthropic-ai/sdk` until Phase 3
- IRS mileage rate 2024: $0.67/mile — lives in `src/lib/utils/mileage.ts` only

## Long-term Roadmap

1. Foundation (Phases A–D)
2. UI polish, file uploads, document management
3. AI receipt ingestion
4. Tax report exports (CSV, IRS summaries)
5. Mobile / App Store
