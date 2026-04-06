import { formatDate } from '@/lib/utils/date'
import { formatPrice } from '@/lib/utils/price'
import { calcMileageDeduction, formatMileage } from '@/lib/utils/mileage'
import { calcTripTotal } from '@/lib/utils/trip'
import InferredBadge from './InferredBadge'

interface TripCardProps {
  trip: {
    id: string
    clientOrProject?: string | null
    destination?: string | null
    startDate: Date | string
    endDate: Date | string
    miles?: number | string | null
    mileageRate?: number | string | null
    perDiemDays?: number | null
    perDiemRate?: number | string | null
    inferredFields: string[]
    expenses?: { amount: number | string }[]
  }
}

export default function TripCard({ trip }: TripCardProps) {
  const miles = trip.miles != null ? Number(trip.miles) : null
  const mileageRate = trip.mileageRate != null ? Number(trip.mileageRate) : null
  const perDiemRate = trip.perDiemRate != null ? Number(trip.perDiemRate) : null
  const expenseAmounts = (trip.expenses ?? []).map((e) => Number(e.amount))

  const total = calcTripTotal({
    miles,
    mileageRate,
    perDiemDays: trip.perDiemDays ?? null,
    perDiemRate,
    expenseAmounts,
  })

  const mileageDeduction = calcMileageDeduction(miles, mileageRate ?? undefined)

  return (
    <article className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {trip.clientOrProject ?? 'Untitled trip'}
            {trip.inferredFields.length > 0 && (
              <InferredBadge label="Contains unconfirmed AI-inferred data" />
            )}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {trip.destination && `${trip.destination} · `}
            {formatDate(trip.startDate)}
            {' – '}
            {formatDate(trip.endDate)}
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold text-indigo-700">
          {formatPrice(total)}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {miles != null && (
          <>
            <dt className="text-gray-500 dark:text-gray-400">Mileage</dt>
            <dd className="text-gray-900 dark:text-gray-100">
              {formatMileage(miles)}
              {mileageDeduction != null && ` (${formatPrice(mileageDeduction)})`}
            </dd>
          </>
        )}
        {trip.perDiemDays != null && (
          <>
            <dt className="text-gray-500 dark:text-gray-400">Per diem</dt>
            <dd className="text-gray-900 dark:text-gray-100">
              {trip.perDiemDays} day{trip.perDiemDays !== 1 ? 's' : ''}
              {perDiemRate != null && ` @ ${formatPrice(perDiemRate)}/day`}
            </dd>
          </>
        )}
        {expenseAmounts.length > 0 && (
          <>
            <dt className="text-gray-500 dark:text-gray-400">Expenses</dt>
            <dd className="text-gray-900 dark:text-gray-100">
              {expenseAmounts.length} item{expenseAmounts.length !== 1 ? 's' : ''} ·{' '}
              {formatPrice(expenseAmounts.reduce((s, a) => s + a, 0))}
            </dd>
          </>
        )}
      </dl>
    </article>
  )
}
