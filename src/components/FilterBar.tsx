'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface FilterOption {
  value: string
  label: string
}

interface Props {
  filters: {
    key: string
    label: string
    options: FilterOption[]
  }[]
}

export default function FilterBar({ filters }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const hasFilters = filters.some((f) => searchParams.get(f.key))

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {filters.map((filter) => (
        <select
          key={filter.key}
          value={searchParams.get(filter.key) ?? ''}
          onChange={(e) => update(filter.key, e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">{filter.label}</option>
          {filter.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ))}

      {hasFilters && (
        <button
          onClick={() => router.push(pathname)}
          className="text-sm text-indigo-600 hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
