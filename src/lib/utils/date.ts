/**
 * Parse a variety of date inputs into a Date object.
 * Returns null for empty, invalid, or unrecognized values.
 */
export function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'number') {
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  }

  if (typeof value === 'string') {
    const cleaned = value.trim()
    if (cleaned === '') return null

    // ISO 8601 and most standard formats
    const iso = new Date(cleaned)
    if (!isNaN(iso.getTime())) return iso

    // MM/DD/YYYY
    const mdy = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (mdy) {
      const d = new Date(Number(mdy[3]), Number(mdy[1]) - 1, Number(mdy[2]))
      if (!isNaN(d.getTime())) return d
    }

    // MM-DD-YYYY
    const mdyDash = cleaned.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
    if (mdyDash) {
      const d = new Date(Number(mdyDash[3]), Number(mdyDash[1]) - 1, Number(mdyDash[2]))
      if (!isNaN(d.getTime())) return d
    }
  }

  return null
}

/** Format a date for display. Returns '—' for null/invalid. */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

/** Returns true if warrantyEnd is in the future. */
export function isWarrantyActive(warrantyEnd: Date | string | null | undefined): boolean {
  if (!warrantyEnd) return false
  const d = typeof warrantyEnd === 'string' ? new Date(warrantyEnd) : warrantyEnd
  return d > new Date()
}

/**
 * Returns the number of days until the warranty expires.
 * Negative means already expired. Null means no warranty date set.
 */
export function daysUntilWarrantyExpires(
  warrantyEnd: Date | string | null | undefined,
): number | null {
  if (!warrantyEnd) return null
  const d = typeof warrantyEnd === 'string' ? new Date(warrantyEnd) : warrantyEnd
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}
