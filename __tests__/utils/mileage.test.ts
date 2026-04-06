import { calcMileageDeduction, formatMileage, IRS_MILEAGE_RATE_2024 } from '@/lib/utils/mileage'

describe('IRS_MILEAGE_RATE_2024', () => {
  it('is 0.67', () => {
    expect(IRS_MILEAGE_RATE_2024).toBe(0.67)
  })
})

describe('calcMileageDeduction', () => {
  it('returns null for null and undefined', () => {
    expect(calcMileageDeduction(null)).toBeNull()
    expect(calcMileageDeduction(undefined)).toBeNull()
  })

  it('returns 0 for 0 miles', () => {
    expect(calcMileageDeduction(0)).toBe(0)
  })

  it('uses IRS_MILEAGE_RATE_2024 by default', () => {
    expect(calcMileageDeduction(100)).toBe(67)
  })

  it('uses a custom rate when provided', () => {
    expect(calcMileageDeduction(100, 0.655)).toBe(65.5)
  })

  it('rounds to 2 decimal places', () => {
    expect(calcMileageDeduction(3, 0.67)).toBe(2.01)
  })

  it('calculates correctly for 240 miles at 0.67', () => {
    expect(calcMileageDeduction(240, 0.67)).toBe(160.8)
  })
})

describe('formatMileage', () => {
  it('returns — for null and undefined', () => {
    expect(formatMileage(null)).toBe('—')
    expect(formatMileage(undefined)).toBe('—')
  })

  it('formats whole miles', () => {
    expect(formatMileage(240)).toBe('240 mi')
  })

  it('formats decimal miles', () => {
    expect(formatMileage(123.4)).toBe('123.4 mi')
  })

  it('formats large numbers with commas', () => {
    expect(formatMileage(10000)).toBe('10,000 mi')
  })
})
