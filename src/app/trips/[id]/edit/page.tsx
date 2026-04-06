import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import TripForm from '@/components/TripForm'

interface Props {
  params: { id: string }
}

export default async function EditTripPage({ params }: Props) {
  const trip = await db.businessTrip.findUnique({ where: { id: params.id } })
  if (!trip) notFound()

  const tripForForm = {
    ...trip,
    miles: trip.miles ? Number(trip.miles) : null,
    mileageRate: trip.mileageRate ? Number(trip.mileageRate) : null,
    perDiemRate: trip.perDiemRate ? Number(trip.perDiemRate) : null,
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Trip</h1>
      <TripForm trip={tripForForm as any} />
    </div>
  )
}
