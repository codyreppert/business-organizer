import {
  calcStraightLineDepreciation,
  calcDoubleDecliningDepreciation,
  calcCurrentBookValue,
  formatDepreciationMethod,
} from '@/lib/utils/depreciation'

const NOW = new Date('2026-04-04T12:00:00Z')

describe('calcStraightLineDepreciation', () => {
  it('returns annual depreciation amount', () => {
    expect(calcStraightLineDepreciation(4200, 200, 7)).toBeCloseTo(571.43, 1)
  })

  it('spreads evenly over life', () => {
    expect(calcStraightLineDepreciation(1000, 0, 10)).toBe(100)
  })

  it('returns 0 when usefulLifeYears is 0', () => {
    expect(calcStraightLineDepreciation(1000, 0, 0)).toBe(0)
  })

  it('handles zero salvage value', () => {
    expect(calcStraightLineDepreciation(5000, 0, 5)).toBe(1000)
  })
})

describe('calcDoubleDecliningDepreciation', () => {
  it('year 1 equals 2/life × purchasePrice', () => {
    // 2/5 × 2499 = 999.6
    expect(calcDoubleDecliningDepreciation(2499, 100, 5, 1)).toBeCloseTo(999.6, 1)
  })

  it('book value never falls below salvage value', () => {
    let bookValue = 1000
    const salvage = 100
    const life = 3
    for (let y = 1; y <= 10; y++) {
      const amount = calcDoubleDecliningDepreciation(1000, salvage, life, y)
      bookValue -= amount
      expect(bookValue).toBeGreaterThanOrEqual(salvage - 0.01) // float tolerance
    }
  })

  it('returns 0 for year 0 or negative year', () => {
    expect(calcDoubleDecliningDepreciation(1000, 0, 5, 0)).toBe(0)
    expect(calcDoubleDecliningDepreciation(1000, 0, 5, -1)).toBe(0)
  })

  it('returns 0 when usefulLifeYears is 0', () => {
    expect(calcDoubleDecliningDepreciation(1000, 0, 0, 1)).toBe(0)
  })
})

describe('calcCurrentBookValue', () => {
  it('returns null when purchasePrice is null', () => {
    expect(calcCurrentBookValue(null, 0, 5, 'straight-line', '2020-01-01', NOW)).toBeNull()
  })

  it('returns null when usefulLifeYears is null', () => {
    expect(calcCurrentBookValue(1000, 0, null, 'straight-line', '2020-01-01', NOW)).toBeNull()
  })

  it('returns null when method is null or "none"', () => {
    expect(calcCurrentBookValue(1000, 0, 5, null, '2020-01-01', NOW)).toBeNull()
    expect(calcCurrentBookValue(1000, 0, 5, 'none', '2020-01-01', NOW)).toBeNull()
  })

  it('returns null when purchaseDate is null', () => {
    expect(calcCurrentBookValue(1000, 0, 5, 'straight-line', null, NOW)).toBeNull()
  })

  it('returns null for unrecognized method', () => {
    expect(calcCurrentBookValue(1000, 0, 5, 'units-of-production', '2020-01-01', NOW)).toBeNull()
  })

  it('straight-line: book value decreases over time', () => {
    // Purchase price 10000, salvage 0, life 10 years
    // At purchase: 10000. After 5 years: 5000.
    const fiveYearsAgo = new Date(NOW.getTime() - 5 * 365.25 * 24 * 60 * 60 * 1000)
    const bv = calcCurrentBookValue(10000, 0, 10, 'straight-line', fiveYearsAgo, NOW)
    expect(bv).toBeCloseTo(5000, 0)
  })

  it('straight-line: book value does not go below salvage', () => {
    // Already 15 years into a 10-year life
    const fifteenYearsAgo = new Date(NOW.getTime() - 15 * 365.25 * 24 * 60 * 60 * 1000)
    const bv = calcCurrentBookValue(10000, 500, 10, 'straight-line', fifteenYearsAgo, NOW)
    expect(bv).toBe(500)
  })

  it('double-declining: book value is less than straight-line in early years', () => {
    const twoYearsAgo = new Date(NOW.getTime() - 2 * 365.25 * 24 * 60 * 60 * 1000)
    const slBv = calcCurrentBookValue(10000, 0, 10, 'straight-line', twoYearsAgo, NOW)!
    const ddbBv = calcCurrentBookValue(10000, 0, 10, 'double-declining', twoYearsAgo, NOW)!
    expect(ddbBv).toBeLessThan(slBv)
  })
})

describe('formatDepreciationMethod', () => {
  it('formats known methods', () => {
    expect(formatDepreciationMethod('straight-line')).toBe('Straight-Line')
    expect(formatDepreciationMethod('double-declining')).toBe('Double-Declining')
    expect(formatDepreciationMethod('none')).toBe('None')
  })

  it('returns — for null, undefined, and unknown values', () => {
    expect(formatDepreciationMethod(null)).toBe('—')
    expect(formatDepreciationMethod(undefined)).toBe('—')
    expect(formatDepreciationMethod('units-of-production')).toBe('—')
  })
})
