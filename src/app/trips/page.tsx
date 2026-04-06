import Link from 'next/link'
import { db } from '@/lib/db'
import TripCard from '@/components/TripCard'

export const dynamic = 'force-dynamic'

export default async function TripsPage() {
  const trips = await db.businessTrip.findMany({
    include: { expenses: true },
    orderBy: { startDate: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trips</h1>
        <Link
          href="/trips/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + Add trip
        </Link>
      </div>

      {trips.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">No trips recorded.</p>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => (
            <Link key={trip.id} href={`/trips/${trip.id}`}>
              <TripCard trip={{
                ...trip,
                miles: trip.miles ? Number(trip.miles) : null,
                mileageRate: trip.mileageRate ? Number(trip.mileageRate) : null,
                perDiemRate: trip.perDiemRate ? Number(trip.perDiemRate) : null,
                expenses: trip.expenses.map((e) => ({ amount: Number(e.amount) })),
              }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
