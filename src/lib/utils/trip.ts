import { calcMileageDeduction } from './mileage'

/**
 * Calculate the per diem amount for a trip.
 * Returns null if either days or rate is null/undefined.
 */
export function calcPerDiem(
  days: number | null | undefined,
  rate: number | null | undefined,
): number | null {
  if (days == null || rate == null) return null
  return Math.round(days * rate * 100) / 100
}

/**
 * Calculate the total deductible/reimbursable value of a business trip.
 * Null components are treated as 0.
 */
export function calcTripTotal(params: {
  miles: number | null | undefined
  mileageRate: number | null | undefined
  perDiemDays: number | null | undefined
  perDiemRate: number | null | undefined
  expenseAmounts: number[]
}): number {
  const mileage = calcMileageDeduction(params.miles, params.mileageRate ?? undefined) ?? 0
  const perDiem = calcPerDiem(params.perDiemDays, params.perDiemRate) ?? 0
  const expenses = params.expenseAmounts.reduce((sum, a) => sum + a, 0)
  return Math.round((mileage + perDiem + expenses) * 100) / 100
}
