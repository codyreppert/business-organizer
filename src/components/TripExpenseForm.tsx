'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExpenseCategory } from '@/types'

const CATEGORIES: ExpenseCategory[] = ['meals', 'lodging', 'transport', 'supplies', 'software', 'other']

interface Props {
  tripId: string
}

export default function TripExpenseForm({ tripId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [category, setCategory] = useState<ExpenseCategory>('meals')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [merchant, setMerchant] = useState('')
  const [description, setDescription] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const res = await fetch(`/api/trips/${tripId}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category,
        amount: parseFloat(amount),
        date,
        merchant: merchant || null,
        description: description || null,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setSubmitting(false)
      return
    }

    setCategory('meals')
    setAmount('')
    setDate('')
    setMerchant('')
    setDescription('')
    setOpen(false)
    router.refresh()
    setSubmitting(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-lg px-4 py-2 transition-colors"
      >
        + Add expense
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">New expense</p>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Amount ($)</label>
          <input type="number" min="0.01" step="0.01" value={amount}
            onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
            className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Merchant</label>
          <input type="text" value={merchant} onChange={(e) => setMerchant(e.target.value)}
            placeholder="e.g. Marriott"
            className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Description</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Hotel night 1"
            className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={submitting}
          className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {submitting ? 'Adding…' : 'Add expense'}
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}
