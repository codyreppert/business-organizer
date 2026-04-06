'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  /** The API endpoint to PATCH, e.g. /api/assets/[id] */
  apiPath: string
  fieldName: string
}

export default function ConfirmFieldButton({ apiPath, fieldName }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function confirm() {
    setLoading(true)
    await fetch(apiPath, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmedFields: [fieldName] }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={confirm}
      disabled={loading}
      className="text-xs text-yellow-700 dark:text-yellow-400 border border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 rounded px-2 py-0.5 ml-1 disabled:opacity-50 transition-colors"
    >
      {loading ? '…' : 'Confirm'}
    </button>
  )
}
