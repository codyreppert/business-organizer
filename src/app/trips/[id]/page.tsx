import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils/date'
import { formatPrice } from '@/lib/utils/price'
import { calcMileageDeduction, formatMileage } from '@/lib/utils/mileage'
import { calcPerDiem, calcTripTotal } from '@/lib/utils/trip'
import InferredBadge from '@/components/InferredBadge'
import DocumentList from '@/components/DocumentList'
import TripExpenseForm from '@/components/TripExpenseForm'
import DeleteButton from '@/components/DeleteButton'
import DeleteExpenseButton from '@/components/DeleteExpenseButton'

const EXPENSE_CATEGORY_COLORS: Record<string, string> = {
  meals: 'bg-orange-100 text-orange-800',
  lodging: 'bg-blue-100 text-blue-800',
  transport: 'bg-green-100 text-green-800',
  supplies: 'bg-yellow-100 text-yellow-800',
  software: 'bg-purple-100 text-purple-800',
  other: 'bg-gray-100 text-gray-700',
}

interface Props {
  params: { id: string }
}

export default async function TripDetailPage({ params }: Props) {
  const trip = await db.businessTrip.findUnique({
    where: { id: params.id },
    include: {
      expenses: { orderBy: { date: 'asc' } },
      documents: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!trip) notFound()

  const miles = trip.miles ? Number(trip.miles) : null
  const mileageRate = trip.mileageRate ? Number(trip.mileageRate) : null
  const perDiemRate = trip.perDiemRate ? Number(trip.perDiemRate) : null
  const expenseAmounts = trip.expenses.map((e) => Number(e.amount))

  const mileageDeduction = calcMileageDeduction(miles, mileageRate ?? undefined)
  const perDiem = calcPerDiem(trip.perDiemDays ?? null, perDiemRate)
  const total = calcTripTotal({ miles, mileageRate, perDiemDays: trip.perDiemDays ?? null, perDiemRate, expenseAmounts })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            {trip.clientOrProject ?? 'Untitled trip'}
            {trip.inferredFields.length > 0 && (
              <InferredBadge label="This trip has unconfirmed AI-inferred fields" />
            )}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {trip.destination && `${trip.destination} · `}
            {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/trips/${trip.id}/edit`}
            className="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Edit
          </Link>
          <DeleteButton apiPath={`/api/trips/${trip.id}`} redirectTo="/trips" />
        </div>
      </div>

      {/* Summary */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Trip Summary</h2>
        <dl className="grid sm:grid-cols-3 gap-4">
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Mileage</dt>
            <dd className="mt-0.5 text-sm text-gray-900 dark:text-gray-100">
              {miles != null ? formatMileage(miles) : '—'}
              {mileageDeduction != null && (
                <span className="text-gray-500 dark:text-gray-400 ml-1">({formatPrice(mileageDeduction)})</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Per Diem</dt>
            <dd className="mt-0.5 text-sm text-gray-900 dark:text-gray-100">
              {trip.perDiemDays != null
                ? `${trip.perDiemDays} days × ${formatPrice(perDiemRate ?? 0)} = ${formatPrice(perDiem ?? 0)}`
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Expenses</dt>
            <dd className="mt-0.5 text-sm text-gray-900 dark:text-gray-100">
              {expenseAmounts.length > 0
                ? formatPrice(expenseAmounts.reduce((s, a) => s + a, 0))
                : '—'}
            </dd>
          </div>
        </dl>
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total</span>
          <span className="text-xl font-bold text-indigo-700">{formatPrice(total)}</span>
        </div>
      </section>

      {/* Description */}
      {trip.description && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Description</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">{trip.description}</p>
        </section>
      )}

      {/* Expenses */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Expenses</h2>
        {trip.expenses.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No expenses recorded.</p>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
            {trip.expenses.map((exp) => (
              <div key={exp.id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                      EXPENSE_CATEGORY_COLORS[exp.category] ?? 'bg-gray-100 text-gray-700'
                    }`}>
                      {exp.category}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {exp.merchant ?? exp.description ?? '—'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(exp.date)}</p>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatPrice(Number(exp.amount))}
                  </span>
                  <DeleteExpenseButton expenseId={exp.id} tripId={trip.id} />
                </div>
              </div>
            ))}
          </div>
        )}
        <TripExpenseForm tripId={trip.id} />
      </section>

      {/* Documents */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Documents</h2>
        <DocumentList uploadPath={`/api/trips/${trip.id}/documents`} documents={trip.documents} />
      </section>
    </div>
  )
}
