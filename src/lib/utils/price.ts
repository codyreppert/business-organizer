/**
 * Parse a price from user input or raw values.
 * Accepts numbers, strings with/without currency symbols and commas.
 * Returns null for empty, negative, or non-numeric values.
 */
export function parsePrice(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null

  if (typeof value === 'number') {
    if (!isFinite(value) || value < 0) return null
    return Math.round(value * 100) / 100
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,\s]/g, '').trim()
    if (cleaned === '') return null
    const num = parseFloat(cleaned)
    if (isNaN(num) || !isFinite(num) || num < 0) return null
    return Math.round(num * 100) / 100
  }

  return null
}

/** Format a price for display. Returns '—' for null/undefined. */
export function formatPrice(value: number | null | undefined, currency = 'USD'): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}
