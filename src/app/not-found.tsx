import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
      <p className="text-5xl font-bold text-gray-200 dark:text-gray-700">404</p>
      <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Page not found</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">The record you're looking for doesn't exist or was deleted.</p>
      <Link href="/" className="text-sm text-indigo-600 hover:underline">
        ← Back to dashboard
      </Link>
    </div>
  )
}
