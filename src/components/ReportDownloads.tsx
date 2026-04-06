'use client'

interface Props {
  year?: number
  assets?: boolean
}

export default function ReportDownloads({ year, assets }: Props) {
  if (assets) {
    return (
      <a
        href="/api/reports/assets"
        download
        className="inline-flex items-center gap-2 text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Download assets CSV
      </a>
    )
  }

  if (!year) return null

  return (
    <div className="flex flex-wrap gap-3">
      <a
        href={`/api/reports/trips?year=${year}`}
        download
        className="inline-flex items-center gap-2 text-sm font-medium border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        Download trips CSV
      </a>
      <a
        href={`/api/reports/expenses?year=${year}`}
        download
        className="inline-flex items-center gap-2 text-sm font-medium border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        Download expenses CSV
      </a>
    </div>
  )
}
