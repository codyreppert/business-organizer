'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AssetCategory, AssetSubcategory, AssetStatus, DepreciationMethod, BusinessAsset } from '@/types'

const CATEGORIES: AssetCategory[] = ['equipment', 'technology']

const SUBCATEGORIES: Record<AssetCategory, AssetSubcategory[]> = {
  equipment: ['machinery', 'tools', 'office', 'other'],
  technology: ['computer', 'phone', 'software', 'other'],
}

const STATUSES: AssetStatus[] = ['active', 'retired', 'disposed']

const DEPRECIATION_METHODS: DepreciationMethod[] = ['straight-line', 'double-declining', 'none']

function toDateInputValue(d: Date | string | null | undefined): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toISOString().split('T')[0]
}

interface Props {
  asset?: BusinessAsset
}

export default function AssetForm({ asset }: Props) {
  const router = useRouter()
  const isEdit = !!asset

  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const [name, setName] = useState(asset?.name ?? '')
  const [category, setCategory] = useState<AssetCategory>(asset?.category ?? 'equipment')
  const [subcategory, setSubcategory] = useState<string>(asset?.subcategory ?? '')
  const [status, setStatus] = useState<AssetStatus>(asset?.status ?? 'active')
  const [brand, setBrand] = useState(asset?.brand ?? '')
  const [model, setModel] = useState(asset?.model ?? '')
  const [serialNumber, setSerialNumber] = useState(asset?.serialNumber ?? '')
  const [purchaseDate, setPurchaseDate] = useState(toDateInputValue(asset?.purchaseDate))
  const [purchasePrice, setPurchasePrice] = useState(
    asset?.purchasePrice != null ? String(asset.purchasePrice) : ''
  )
  const [warrantyStart, setWarrantyStart] = useState(toDateInputValue(asset?.warrantyStart))
  const [warrantyEnd, setWarrantyEnd] = useState(toDateInputValue(asset?.warrantyEnd))
  const [depreciationMethod, setDepreciationMethod] = useState<string>(
    asset?.depreciationMethod ?? ''
  )
  const [usefulLifeYears, setUsefulLifeYears] = useState(
    asset?.usefulLifeYears != null ? String(asset.usefulLifeYears) : ''
  )
  const [salvageValue, setSalvageValue] = useState(
    asset?.salvageValue != null ? String(asset.salvageValue) : ''
  )
  const [notes, setNotes] = useState(asset?.notes ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors([])
    setSubmitting(true)

    const body = {
      name,
      category,
      subcategory: subcategory || null,
      status,
      brand: brand || null,
      model: model || null,
      serialNumber: serialNumber || null,
      purchaseDate: purchaseDate || null,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
      warrantyStart: warrantyStart || null,
      warrantyEnd: warrantyEnd || null,
      depreciationMethod: depreciationMethod || null,
      usefulLifeYears: usefulLifeYears ? parseInt(usefulLifeYears) : null,
      salvageValue: salvageValue ? parseFloat(salvageValue) : null,
      notes: notes || null,
    }

    const url = isEdit ? `/api/assets/${asset.id}` : '/api/assets'
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

    const savedId = data.data?.id ?? asset?.id
    router.push(`/assets/${savedId}`)
    router.refresh()
  }

  const subcategoryOptions = SUBCATEGORIES[category] ?? []

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          {errors.map((e, i) => (
            <p key={i} className="text-sm text-red-700">{e}</p>
          ))}
        </div>
      )}

      {/* Core */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Core</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. MacBook Pro 16&quot;"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as AssetCategory)
                setSubcategory('')
              }}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subcategory</label>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">— None —</option>
              {subcategoryOptions.map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AssetStatus)}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brand</label>
            <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model</label>
            <input type="text" value={model} onChange={(e) => setModel(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Serial Number</label>
            <input type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      </section>

      {/* Dates & Price */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Dates & Price</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchase Date</label>
            <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchase Price ($)</label>
            <input type="number" min="0" step="0.01" value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)} placeholder="0.00"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      </section>

      {/* Warranty */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Warranty</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Warranty Start</label>
            <input type="date" value={warrantyStart} onChange={(e) => setWarrantyStart(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Warranty End</label>
            <input type="date" value={warrantyEnd} onChange={(e) => setWarrantyEnd(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      </section>

      {/* Depreciation */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Depreciation</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Method</label>
            <select value={depreciationMethod} onChange={(e) => setDepreciationMethod(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">— None —</option>
              {DEPRECIATION_METHODS.map((m) => (
                <option key={m} value={m}>{m === 'straight-line' ? 'Straight-Line' : m === 'double-declining' ? 'Double-Declining' : 'None'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Useful Life (years)</label>
            <input type="number" min="1" step="1" value={usefulLifeYears}
              onChange={(e) => setUsefulLifeYears(e.target.value)} placeholder="e.g. 5"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Salvage Value ($)</label>
            <input type="number" min="0" step="0.01" value={salvageValue}
              onChange={(e) => setSalvageValue(e.target.value)} placeholder="0.00"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Notes</h2>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </section>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={submitting}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create asset'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}
