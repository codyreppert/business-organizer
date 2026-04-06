'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExpenseCategory, StandaloneExpense } from '@/types'

const CATEGORIES: ExpenseCategory[] = ['meals', 'lodging', 'transport', 'supplies', 'software', 'other']

function toDateInputValue(d: Date | string | null | undefined): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toISOString().split('T')[0]
}

interface Props {
  expense?: StandaloneExpense
}

export default function ExpenseForm({ expense }: Props) {
  const router = useRouter()
  const isEdit = !!expense

  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const [category, setCategory] = useState<ExpenseCategory>(expense?.category ?? 'meals')
  const [amount, setAmount] = useState(expense?.amount != null ? String(expense.amount) : '')
  const [date, setDate] = useState(toDateInputValue(expense?.date))
  const [merchant, setMerchant] = useState(expense?.merchant ?? '')
  const [description, setDescription] = useState(expense?.description ?? '')
  const [businessPurpose, setBusinessPurpose] = useState(expense?.businessPurpose ?? '')
  const [reimbursable, setReimbursable] = useState(expense?.reimbursable ?? false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors([])
    setSubmitting(true)

    const body = {
      category,
      amount: parseFloat(amount),
      date,
      merchant: merchant || null,
      description: description || null,
      businessPurpose: businessPurpose || null,
      reimbursable,
    }

    const url = isEdit ? `/api/expenses/${expense.id}` : '/api/expenses'
    const method = isEdit ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    if (!res.ok) {
      setErrors([data.error ?? 'Something went wrong'])
      setSubmitting(false)
      return
    }

    const savedId = data.data?.id ?? expense?.id
    router.push(`/expenses/${savedId}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          {errors.map((e, i) => (
            <p key={i} className="text-sm text-red-700">{e}</p>
          ))}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Expense</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount ($) *</label>
            <input type="number" min="0.01" step="0.01" value={amount}
              onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Merchant</label>
            <input type="text" value={merchant} onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. Staples"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Printer paper and ink"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Purpose</label>
            <input type="text" value={businessPurpose} onChange={(e) => setBusinessPurpose(e.target.value)}
              placeholder="e.g. Office supplies"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="reimbursable" checked={reimbursable}
              onChange={(e) => setReimbursable(e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
            <label htmlFor="reimbursable" className="text-sm text-gray-700 dark:text-gray-300">Reimbursable</label>
          </div>
        </div>
      </section>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={submitting}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create expense'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}
