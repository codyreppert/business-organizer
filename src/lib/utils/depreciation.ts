/**
 * Annual straight-line depreciation amount.
 * Spreads (purchasePrice - salvageValue) evenly over usefulLifeYears.
 */
export function calcStraightLineDepreciation(
  purchasePrice: number,
  salvageValue: number,
  usefulLifeYears: number,
): number {
  if (usefulLifeYears <= 0) return 0
  return (purchasePrice - salvageValue) / usefulLifeYears
}

/**
 * Double-declining balance depreciation for a specific year (1-indexed).
 * Returns the depreciation amount for that year; book value never falls below salvageValue.
 */
export function calcDoubleDecliningDepreciation(
  purchasePrice: number,
  salvageValue: number,
  usefulLifeYears: number,
  year: number,
): number {
  if (usefulLifeYears <= 0 || year <= 0) return 0
  const rate = 2 / usefulLifeYears
  let bookValue = purchasePrice
  let amount = 0
  for (let y = 1; y <= year; y++) {
    amount = Math.min(bookValue * rate, bookValue - salvageValue)
    if (amount <= 0) { amount = 0; break }
    if (y < year) bookValue -= amount
  }
  return Math.max(amount, 0)
}

/**
 * Current book value of an asset given its depreciation parameters.
 * Returns null if required fields are missing or method is unrecognized.
 */
export function calcCurrentBookValue(
  purchasePrice: number | null | undefined,
  salvageValue: number | null | undefined,
  usefulLifeYears: number | null | undefined,
  method: string | null | undefined,
  purchaseDate: Date | string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (purchasePrice == null || usefulLifeYears == null || !method || method === 'none') return null
  if (!purchaseDate) return null

  const purchase = typeof purchaseDate === 'string' ? new Date(purchaseDate) : purchaseDate
  if (isNaN(purchase.getTime())) return null

  const msPerYear = 1000 * 60 * 60 * 24 * 365.25
  const yearsElapsed = Math.max(0, (now.getTime() - purchase.getTime()) / msPerYear)
  const salvage = salvageValue ?? 0

  if (method === 'straight-line') {
    const annual = calcStraightLineDepreciation(purchasePrice, salvage, usefulLifeYears)
    return Math.max(salvage, purchasePrice - annual * yearsElapsed)
  }

  if (method === 'double-declining') {
    const fullYears = Math.floor(yearsElapsed)
    let bookValue = purchasePrice
    for (let y = 1; y <= fullYears; y++) {
      const amount = calcDoubleDecliningDepreciation(purchasePrice, salvage, usefulLifeYears, y)
      bookValue -= amount
      if (bookValue <= salvage) return salvage
    }
    return Math.max(salvage, bookValue)
  }

  return null
}

/** Display label for a depreciation method value. Returns '—' for null/undefined. */
export function formatDepreciationMethod(method: string | null | undefined): string {
  if (!method) return '—'
  const labels: Record<string, string> = {
    'straight-line': 'Straight-Line',
    'double-declining': 'Double-Declining',
    none: 'None',
  }
  return labels[method] ?? '—'
}
