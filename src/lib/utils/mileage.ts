/** IRS standard mileage rate for 2024 (dollars per mile). Update annually. */
export const IRS_MILEAGE_RATE_2024 = 0.67

/**
 * Calculate the IRS mileage deduction for a trip.
 * Returns null if miles is null/undefined.
 */
export function calcMileageDeduction(
  miles: number | null | undefined,
  rate: number = IRS_MILEAGE_RATE_2024,
): number | null {
  if (miles == null) return null
  return Math.round(miles * rate * 100) / 100
}

/** Format miles for display. Returns '—' for null/undefined. */
export function formatMileage(miles: number | null | undefined): string {
  if (miles == null) return '—'
  return `${miles.toLocaleString('en-US')} mi`
}
