'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BusinessTrip } from '@/types'
import { IRS_MILEAGE_RATE_2024 } from '@/lib/utils/mileage'

function toDateInputValue(d: Date | string | null | undefined): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toISOString().split('T')[0]
}

interface Props {
  trip?: BusinessTrip
}

export default function TripForm({ trip }: Props) {
  const router = useRouter()
  const isEdit = !!trip

  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const [clientOrProject, setClientOrProject] = useState(trip?.clientOrProject ?? '')
  const [description, setDescription] = useState(trip?.description ?? '')
  const [destination, setDestination] = useState(trip?.destination ?? '')
  const [startDate, setStartDate] = useState(toDateInputValue(trip?.startDate))
  const [endDate, setEndDate] = useState(toDateInputValue(trip?.endDate))
  const [miles, setMiles] = useState(trip?.miles != null ? String(trip.miles) : '')
  const [mileageRate, setMileageRate] = useState(
    trip?.mileageRate != null ? String(trip.mileageRate) : String(IRS_MILEAGE_RATE_2024)
  )
  const [perDiemDays, setPerDiemDays] = useState(
    trip?.perDiemDays != null ? String(trip.perDiemDays) : ''
  )
  const [perDiemRate, setPerDiemRate] = useState(
    trip?.perDiemRate != null ? String(trip.perDiemRate) : '200'
  )
  const [notes, setNotes] = useState(trip?.notes ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors([])
    setSubmitting(true)

    const body = {
      clientOrProject: clientOrProject || null,
      description: description || null,
      destination: destination || null,
      startDate,
      endDate,
      miles: miles ? parseFloat(miles) : null,
      mileageRate: mileageRate ? parseFloat(mileageRate) : null,
      perDiemDays: perDiemDays ? parseInt(perDiemDays) : null,
      perDiemRate: perDiemRate ? parseFloat(perDiemRate) : null,
      notes: notes || null,
    }

    const url = isEdit ? `/api/trips/${trip.id}` : '/api/trips'
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

    const savedId = data.data?.id ?? trip?.id
    router.push(`/trips/${savedId}`)
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

      {/* Purpose */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Business Purpose</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client / Project</label>
            <input type="text" value={clientOrProject} onChange={(e) => setClientOrProject(e.target.value)}
              placeholder="e.g. Acme Corp Q1 Review"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Quarterly review meeting"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destination</label>
            <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Chicago, IL"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      </section>

      {/* Dates */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Dates *</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date *</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date *</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      </section>

      {/* Mileage */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Mileage</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Miles driven</label>
            <input type="number" min="0" step="0.1" value={miles} onChange={(e) => setMiles(e.target.value)}
              placeholder="0"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rate ($/mi) <span className="text-gray-400 font-normal">IRS 2024: $0.67</span>
            </label>
            <input type="number" min="0" step="0.001" value={mileageRate}
              onChange={(e) => setMileageRate(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      </section>

      {/* Per Diem */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Per Diem</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Days</label>
            <input type="number" min="1" step="1" value={perDiemDays}
              onChange={(e) => setPerDiemDays(e.target.value)} placeholder="e.g. 3"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rate ($/day)</label>
            <input type="number" min="0" step="0.01" value={perDiemRate}
              onChange={(e) => setPerDiemRate(e.target.value)} placeholder="200.00"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Notes</h2>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </section>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={submitting}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create trip'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}
