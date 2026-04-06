import { db } from '@/lib/db'
import ReceiptIngester from '@/components/ReceiptIngester'

export default async function IngestPage() {
  const trips = await db.businessTrip.findMany({
    select: { id: true, clientOrProject: true, startDate: true },
    orderBy: { startDate: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Receipt Ingestion</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Upload a receipt image or PDF. Claude will extract the expense details — review and confirm before saving.
          All AI-extracted fields are marked and must be confirmed before they&apos;re treated as verified.
        </p>
      </div>

      <ReceiptIngester trips={trips.map((t) => ({ ...t, startDate: t.startDate.toISOString() }))} />
    </div>
  )
}
