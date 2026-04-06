'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  expenseId: string
  tripId: string
}

export default function DeleteExpenseButton({ expenseId, tripId }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/expenses/${expenseId}`, { method: 'DELETE' })
      if (!res.ok) {
        alert('Delete failed')
        setLoading(false)
        setConfirming(false)
        return
      }
      router.refresh()
    } catch {
      alert('Delete failed')
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs font-medium text-white bg-red-600 px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? '…' : 'Delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-red-400 hover:text-red-600 transition-colors"
    >
      Delete
    </button>
  )
}
