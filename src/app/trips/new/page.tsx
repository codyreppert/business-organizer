import TripForm from '@/components/TripForm'

export default function NewTripPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Add Trip</h1>
      <TripForm />
    </div>
  )
}
