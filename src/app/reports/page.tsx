import { db } from '@/lib/db'
import { formatPrice } from '@/lib/utils/price'
import { calcTripTotal } from '@/lib/utils/trip'
import ReportDownloads from '@/components/ReportDownloads'

export default async function ReportsPage() {
  const currentYear = new Date().getFullYear()

  // Get years that have data
  const [firstTrip, firstExpense] = await Promise.all([
    db.businessTrip.findFirst({ orderBy: { startDate: 'asc' }, select: { startDate: true } }),
    db.standaloneExpense.findFirst({ orderBy: { date: 'asc' }, select: { date: true } }),
  ])

  const earliestYear = Math.min(
    firstTrip ? new Date(firstTrip.startDate).getFullYear() : currentYear,
    firstExpense ? new Date(firstExpense.date).getFullYear() : currentYear,
  )
  const years = Array.from({ length: currentYear - earliestYear + 1 }, (_, i) => currentYear - i)

  // YTD summary for each year
  const summaries = await Promise.all(
    years.map(async (year) => {
      const yearStart = new Date(`${year}-01-01`)
      const yearEnd = new Date(`${year + 1}-01-01`)

      const [trips, expenses] = await Promise.all([
        db.businessTrip.findMany({
          where: { startDate: { gte: yearStart, lt: yearEnd } },
          include: { expenses: { select: { amount: true } } },
        }),
        db.standaloneExpense.findMany({
          where: { date: { gte: yearStart, lt: yearEnd } },
          select: { amount: true },
        }),
      ])

      const tripTotal = trips.reduce((sum, trip) => {
        return sum + calcTripTotal({
          miles: trip.miles ? Number(trip.miles) : null,
          mileageRate: trip.mileageRate ? Number(trip.mileageRate) : null,
          perDiemDays: trip.perDiemDays ?? null,
          perDiemRate: trip.perDiemRate ? Number(trip.perDiemRate) : null,
          expenseAmounts: trip.expenses.map((e) => Number(e.amount)),
        })
      }, 0)

      const expenseTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

      return { year, trips: trips.length, expenses: expenses.length, tripTotal, expenseTotal }
    })
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tax Reports</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Download CSV exports for IRS Schedule C preparation.
        </p>
      </div>

      {/* Per-year summaries + downloads */}
      <div className="space-y-4">
        {summaries.map((s) => (
          <div key={s.year} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tax Year {s.year}</h2>
              {s.year === currentYear && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Current</span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Trip deductions</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{formatPrice(s.tripTotal)}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{s.trips} trip{s.trips !== 1 ? 's' : ''}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Standalone expenses</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{formatPrice(s.expenseTotal)}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{s.expenses} item{s.expenses !== 1 ? 's' : ''}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total</p>
                <p className="text-xl font-bold text-indigo-700">{formatPrice(s.tripTotal + s.expenseTotal)}</p>
              </div>
            </div>

            <ReportDownloads year={s.year} />
          </div>
        ))}
      </div>

      {/* All-time asset report */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Business Assets</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Full asset list with depreciation and current book values.</p>
        <ReportDownloads assets />
      </div>
    </div>
  )
}
