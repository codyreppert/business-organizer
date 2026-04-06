import { calcPerDiem, calcTripTotal } from '@/lib/utils/trip'

describe('calcPerDiem', () => {
  it('returns null when days is null', () => {
    expect(calcPerDiem(null, 200)).toBeNull()
  })

  it('returns null when rate is null', () => {
    expect(calcPerDiem(5, null)).toBeNull()
  })

  it('returns null when both are null', () => {
    expect(calcPerDiem(null, null)).toBeNull()
  })

  it('calculates correctly', () => {
    expect(calcPerDiem(5, 200)).toBe(1000)
  })

  it('calculates with decimal rate', () => {
    expect(calcPerDiem(3, 214.0)).toBe(642)
  })

  it('returns 0 for 0 days', () => {
    expect(calcPerDiem(0, 200)).toBe(0)
  })
})

describe('calcTripTotal', () => {
  it('sums mileage + per diem + expenses', () => {
    const total = calcTripTotal({
      miles: 240,
      mileageRate: 0.67,
      perDiemDays: 3,
      perDiemRate: 200,
      expenseAmounts: [45.5, 189, 189],
    })
    // 160.80 + 600 + 423.50 = 1184.30
    expect(total).toBeCloseTo(1184.3, 1)
  })

  it('treats null miles as 0', () => {
    const total = calcTripTotal({
      miles: null,
      mileageRate: 0.67,
      perDiemDays: 3,
      perDiemRate: 200,
      expenseAmounts: [],
    })
    expect(total).toBe(600)
  })

  it('treats null perDiem as 0', () => {
    const total = calcTripTotal({
      miles: 100,
      mileageRate: 0.67,
      perDiemDays: null,
      perDiemRate: 200,
      expenseAmounts: [],
    })
    expect(total).toBe(67)
  })

  it('treats empty expenses array as 0', () => {
    const total = calcTripTotal({
      miles: 100,
      mileageRate: 0.67,
      perDiemDays: 1,
      perDiemRate: 200,
      expenseAmounts: [],
    })
    expect(total).toBe(267)
  })

  it('returns 0 when all inputs are null/empty', () => {
    const total = calcTripTotal({
      miles: null,
      mileageRate: null,
      perDiemDays: null,
      perDiemRate: null,
      expenseAmounts: [],
    })
    expect(total).toBe(0)
  })

  it('handles expenses only', () => {
    const total = calcTripTotal({
      miles: null,
      mileageRate: null,
      perDiemDays: null,
      perDiemRate: null,
      expenseAmounts: [699, 87.25, 32],
    })
    expect(total).toBeCloseTo(818.25, 2)
  })
})
