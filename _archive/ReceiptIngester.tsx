'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import InferredBadge from '@/components/InferredBadge'

interface TripOption {
  id: string
  clientOrProject: string | null
  startDate: Date | string
}

interface Extracted {
  category?: string
  amount?: number
  date?: string
  merchant?: string
  description?: string
  businessPurpose?: string
  inferredFields?: string[]
}

interface Props {
  trips: TripOption[]
}

const EXPENSE_CATEGORIES = ['meals', 'lodging', 'transport', 'supplies', 'software', 'other']

export default function ReceiptIngester({ trips }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [target, setTarget] = useState<'trip' | 'standalone'>('standalone')
  const [tripId, setTripId] = useState<string>(trips[0]?.id ?? '')
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extracted, setExtracted] = useState<Extracted | null>(null)

  // Editable fields after extraction
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [merchant, setMerchant] = useState('')
  const [description, setDescription] = useState('')
  const [businessPurpose, setBusinessPurpose] = useState('')
  const [reimbursable, setReimbursable] = useState(false)

  function populateFields(data: Extracted) {
    setCategory(data.category ?? '')
    setAmount(data.amount != null ? String(data.amount) : '')
    setDate(data.date ?? '')
    setMerchant(data.merchant ?? '')
    setDescription(data.description ?? '')
    setBusinessPurpose(data.businessPurpose ?? '')
  }

  async function handleExtract() {
    if (!file) {
      setError('Select a receipt file first.')
      return
    }
    setExtracting(true)
    setError(null)
    setExtracted(null)

    const fd = new FormData()
    fd.append('file', file)

    const res = await fetch('/api/ingest/receipt', { method: 'POST', body: fd })
    const json = await res.json()
    setExtracting(false)

    if (!res.ok) {
      setError(json.error ?? 'Extraction failed')
      return
    }

    setExtracted(json.data)
    populateFields(json.data)
  }

  async function handleSave() {
    if (!category || !amount || !date) {
      setError('Category, amount, and date are required.')
      return
    }
    setSaving(true)
    setError(null)

    const inferredFields = extracted?.inferredFields ?? []

    let res: Response
    let redirectTo: string

    if (target === 'trip') {
      if (!tripId) {
        setError('Select a trip.')
        setSaving(false)
        return
      }
      res = await fetch(`/api/trips/${tripId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          amount: parseFloat(amount),
          date,
          merchant: merchant || undefined,
          description: description || undefined,
          inferredFields,
        }),
      })
      redirectTo = `/trips/${tripId}`
    } else {
      res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          amount: parseFloat(amount),
          date,
          merchant: merchant || undefined,
          description: description || undefined,
          businessPurpose: businessPurpose || undefined,
          reimbursable,
          inferredFields,
        }),
      })
      const data = await res.json()
      setSaving(false)
      if (!res.ok) {
        setError(data.error ?? 'Save failed')
        return
      }
      router.push(`/expenses/${data.data.id}`)
      router.refresh()
      return
    }

    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      setError(data.error ?? 'Save failed')
      return
    }
    router.push(redirectTo)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 px-4 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
      >
        <span>+ AI Receipt Ingest</span>
      </button>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI Receipt Ingestion</h3>
        <button onClick={() => setOpen(false)} className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}

      {/* Step 1: File + Target */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Receipt file (image or PDF)</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-gray-600 dark:text-gray-400 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Save as</label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value as 'trip' | 'standalone')}
            className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="standalone">Standalone expense</option>
            <option value="trip">Trip expense</option>
          </select>
        </div>
      </div>

      {target === 'trip' && (
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Trip</label>
          <select
            value={tripId}
            onChange={(e) => setTripId(e.target.value)}
            className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {trips.length === 0 && <option value="">No trips available</option>}
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.clientOrProject ?? 'Untitled'} ({typeof t.startDate === 'string' ? t.startDate.slice(0, 10) : new Date(t.startDate).toISOString().slice(0, 10)})
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        onClick={handleExtract}
        disabled={extracting || !file}
        className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {extracting ? 'Extracting…' : 'Extract from receipt'}
      </button>

      {/* Step 2: Review extracted fields */}
      {extracted && (
        <div className="space-y-4 border-t border-gray-100 dark:border-gray-800 pt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            Fields marked <InferredBadge /> were set by AI — review and edit before saving.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Category {extracted.inferredFields?.includes('category') && <InferredBadge />}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select…</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Amount ($) {extracted.inferredFields?.includes('amount') && <InferredBadge />}
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Date {extracted.inferredFields?.includes('date') && <InferredBadge />}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Merchant {extracted.inferredFields?.includes('merchant') && <InferredBadge />}
              </label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Description {extracted.inferredFields?.includes('description') && <InferredBadge />}
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {target === 'standalone' && (
              <>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Business Purpose {extracted.inferredFields?.includes('businessPurpose') && <InferredBadge />}
                  </label>
                  <input
                    type="text"
                    value={businessPurpose}
                    onChange={(e) => setBusinessPurpose(e.target.value)}
                    className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="reimbursable"
                    type="checkbox"
                    checked={reimbursable}
                    onChange={(e) => setReimbursable(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600"
                  />
                  <label htmlFor="reimbursable" className="text-sm text-gray-700 dark:text-gray-300">Reimbursable</label>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save expense'}
            </button>
            <button
              onClick={() => { setExtracted(null); setFile(null) }}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
