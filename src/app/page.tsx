import Link from 'next/link'
import { db } from '@/lib/db'
import { formatPrice } from '@/lib/utils/price'
import { calcTripTotal } from '@/lib/utils/trip'

export default async function Home() {
  const year = new Date().getFullYear()
  const yearStart = new Date(`${year}-01-01`)
  const yearEnd = new Date(`${year + 1}-01-01`)

  const [assetCount, tripCount, expenseCount, ytdTrips, ytdExpenses] = await Promise.all([
    db.businessAsset.count(),
    db.businessTrip.count(),
    db.standaloneExpense.count(),
    db.businessTrip.findMany({
      where: { startDate: { gte: yearStart, lt: yearEnd } },
      include: { expenses: { select: { amount: true } } },
    }),
    db.standaloneExpense.findMany({
      where: { date: { gte: yearStart, lt: yearEnd } },
      select: { amount: true },
    }),
  ])

  const ytdTripTotal = ytdTrips.reduce((sum, trip) => {
    return sum + calcTripTotal({
      miles: trip.miles ? Number(trip.miles) : null,
      mileageRate: trip.mileageRate ? Number(trip.mileageRate) : null,
      perDiemDays: trip.perDiemDays ?? null,
      perDiemRate: trip.perDiemRate ? Number(trip.perDiemRate) : null,
      expenseAmounts: trip.expenses.map((e) => Number(e.amount)),
    })
  }, 0)

  const ytdExpenseTotal = ytdExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const ytdTotal = ytdTripTotal + ytdExpenseTotal

  const cards = [
    { label: 'Assets', count: assetCount, href: '/assets', color: 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-900 dark:text-indigo-300' },
    { label: 'Trips', count: tripCount, href: '/trips', color: 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-900 dark:text-green-300' },
    { label: 'Expenses', count: expenseCount, href: '/expenses', color: 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950 dark:border-orange-900 dark:text-orange-300' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Business Organizer</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">Track assets, trips, and expenses for your business.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`border rounded-xl p-6 hover:shadow-md transition-shadow ${card.color}`}
          >
            <p className="text-4xl font-bold">{card.count}</p>
            <p className="mt-1 text-sm font-medium">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* YTD Summary */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
          {year} Year-to-Date
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Trip Deductions</p>
            <p className="mt-0.5 text-xl font-bold text-gray-900 dark:text-gray-100">{formatPrice(ytdTripTotal)}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{ytdTrips.length} trip{ytdTrips.length !== 1 ? 's' : ''}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Standalone Expenses</p>
            <p className="mt-0.5 text-xl font-bold text-gray-900 dark:text-gray-100">{formatPrice(ytdExpenseTotal)}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{ytdExpenses.length} expense{ytdExpenses.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="sm:border-l sm:border-gray-100 dark:border-gray-800 sm:pl-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total</p>
            <p className="mt-0.5 text-2xl font-bold text-indigo-700">{formatPrice(ytdTotal)}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">mileage + per diem + all expenses</p>
          </div>
        </div>
      </section>
    </div>
  )
}
