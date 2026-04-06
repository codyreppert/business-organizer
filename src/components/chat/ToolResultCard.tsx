import Link from 'next/link'
import { formatPrice } from '@/lib/utils/price'

interface Props {
  name: string
  result: Record<string, unknown>
}

export default function ToolResultCard({ name, result }: Props) {
  if ((name === 'create_asset') && result.success && result.asset) {
    const a = result.asset as Record<string, unknown>
    return (
      <div className="my-2 border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 rounded-xl p-4 text-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-semibold text-green-900 dark:text-green-300">✓ Asset saved</p>
            <p className="text-green-700 dark:text-green-400 mt-0.5 capitalize">{a.name as string} · {a.category as string}</p>
          </div>
          <Link href={`/assets/${a.id}`} className="text-xs text-indigo-600 hover:underline shrink-0">
            View →
          </Link>
        </div>
      </div>
    )
  }

  if (name === 'create_trip' && result.success && result.trip) {
    const t = result.trip as Record<string, unknown>
    return (
      <div className="my-2 border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 rounded-xl p-4 text-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-semibold text-green-900 dark:text-green-300">✓ Trip saved</p>
            <p className="text-green-700 dark:text-green-400 mt-0.5">
              {(t.clientOrProject as string | null) ?? 'Trip'} · {t.startDate as string} – {t.endDate as string}
            </p>
          </div>
          <Link href={`/trips/${t.id}`} className="text-xs text-indigo-600 hover:underline shrink-0">
            View →
          </Link>
        </div>
      </div>
    )
  }

  if (name === 'add_trip_expense' && result.success) {
    const e = result.expense as Record<string, unknown>
    return (
      <div className="my-2 border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 rounded-xl p-3 text-sm">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-green-900 dark:text-green-300">
            ✓ Expense added — {formatPrice(e.amount as number)} ({e.category as string})
          </p>
          <Link href={`/trips/${result.tripId}`} className="text-xs text-indigo-600 hover:underline shrink-0">
            View trip →
          </Link>
        </div>
      </div>
    )
  }

  if (name === 'create_expense' && result.success && result.expense) {
    const e = result.expense as Record<string, unknown>
    return (
      <div className="my-2 border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 rounded-xl p-4 text-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-semibold text-green-900 dark:text-green-300">✓ Expense saved</p>
            <p className="text-green-700 dark:text-green-400 mt-0.5">
              {formatPrice(e.amount as number)} · {e.category as string}
              {e.businessPurpose ? ` · ${e.businessPurpose}` : ''}
            </p>
          </div>
          <Link href={`/expenses/${e.id}`} className="text-xs text-indigo-600 hover:underline shrink-0">
            View →
          </Link>
        </div>
      </div>
    )
  }

  if (name === 'search_trips' && result.trips) {
    const trips = result.trips as Array<Record<string, unknown>>
    if (trips.length === 0) return null
    return (
      <div className="my-2 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-xl p-3 text-sm space-y-1.5">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {trips.length} trip{trips.length !== 1 ? 's' : ''} found
        </p>
        {trips.slice(0, 5).map((t) => (
          <Link
            key={t.id as string}
            href={`/trips/${t.id}`}
            className="flex items-center justify-between hover:bg-white dark:hover:bg-gray-800 rounded px-2 py-1 transition-colors"
          >
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {(t.clientOrProject as string | null) ?? 'Trip'} · {t.destination as string | null}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-xs">{t.startDate as string}</span>
          </Link>
        ))}
      </div>
    )
  }

  if (name === 'search_assets' && result.assets) {
    const assets = result.assets as Array<Record<string, unknown>>
    if (assets.length === 0) return null
    return (
      <div className="my-2 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-xl p-3 text-sm space-y-1.5">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {assets.length} asset{assets.length !== 1 ? 's' : ''} found
        </p>
        {assets.slice(0, 5).map((a) => (
          <Link
            key={a.id as string}
            href={`/assets/${a.id}`}
            className="flex items-center justify-between hover:bg-white dark:hover:bg-gray-800 rounded px-2 py-1 transition-colors"
          >
            <span className="font-medium text-gray-900 dark:text-gray-100">{a.name as string}</span>
            <span className="text-gray-500 dark:text-gray-400 capitalize text-xs">{a.category as string}</span>
          </Link>
        ))}
      </div>
    )
  }

  if (name === 'search_expenses' && result.expenses) {
    const expenses = result.expenses as Array<Record<string, unknown>>
    const total = result.total as number
    if (expenses.length === 0) return null
    return (
      <div className="my-2 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-xl p-3 text-sm space-y-1.5">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {expenses.length} expense{expenses.length !== 1 ? 's' : ''} · {formatPrice(total)} total
        </p>
        {expenses.slice(0, 5).map((e) => (
          <Link
            key={e.id as string}
            href={`/expenses/${e.id}`}
            className="flex items-center justify-between hover:bg-white dark:hover:bg-gray-800 rounded px-2 py-1 transition-colors"
          >
            <span className="text-gray-700 dark:text-gray-300">{(e.merchant as string | null) ?? (e.category as string)}</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{formatPrice(e.amount as number)}</span>
          </Link>
        ))}
      </div>
    )
  }

  if (name === 'get_trip_details' && result.trip) {
    const t = result.trip as Record<string, unknown>
    return (
      <div className="my-2 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-xl p-3 text-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {(t.clientOrProject as string | null) ?? 'Trip'}
          </p>
          <Link href={`/trips/${t.id}`} className="text-xs text-indigo-600 hover:underline">View →</Link>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
          {t.mileageDeduction != null && (
            <>
              <dt className="text-gray-500 dark:text-gray-400">Mileage deduction</dt>
              <dd>{formatPrice(t.mileageDeduction as number)}</dd>
            </>
          )}
          {t.perDiem != null && (
            <>
              <dt className="text-gray-500 dark:text-gray-400">Per diem</dt>
              <dd>{formatPrice(t.perDiem as number)}</dd>
            </>
          )}
          <dt className="text-gray-500 dark:text-gray-400">Expenses</dt>
          <dd>{formatPrice(t.expenseTotal as number)}</dd>
          <dt className="text-gray-700 dark:text-gray-300 font-semibold">Total</dt>
          <dd className="font-semibold text-indigo-700">{formatPrice(t.total as number)}</dd>
        </dl>
      </div>
    )
  }

  if (name === 'get_summary') {
    return (
      <div className="my-2 border border-indigo-100 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950 rounded-xl p-3 text-sm">
        <p className="font-semibold text-indigo-900 dark:text-indigo-300 mb-1">{result.year as number} Summary</p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
          <dt className="text-indigo-700 dark:text-indigo-400">Trip deductions</dt>
          <dd className="dark:text-gray-300">{formatPrice(result.tripTotal as number)} ({result.trips as number} trips)</dd>
          <dt className="text-indigo-700 dark:text-indigo-400">Standalone expenses</dt>
          <dd className="dark:text-gray-300">{formatPrice(result.expenseTotal as number)} ({result.expenses as number} items)</dd>
          <dt className="text-indigo-800 dark:text-indigo-300 font-semibold">Total</dt>
          <dd className="font-bold text-indigo-900 dark:text-indigo-200">{formatPrice(result.grandTotal as number)}</dd>
        </dl>
      </div>
    )
  }

  return null
}
