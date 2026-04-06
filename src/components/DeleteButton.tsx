'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  apiPath: string
  redirectTo: string
  label?: string
}

export default function DeleteButton({ apiPath, redirectTo, label = 'Delete' }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(apiPath, { method: 'DELETE' })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Delete failed' }))
        alert(error ?? 'Delete failed')
        setLoading(false)
        setConfirming(false)
        return
      }
      router.push(redirectTo)
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
        <span className="text-sm text-gray-600 dark:text-gray-400">Are you sure?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-sm font-medium text-white bg-red-600 px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
    >
      {label}
    </button>
  )
}
