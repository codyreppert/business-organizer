import { parseDate, formatDate, isWarrantyActive, daysUntilWarrantyExpires } from '@/lib/utils/date'

describe('parseDate', () => {
  it('returns null for null, undefined, and empty string', () => {
    expect(parseDate(null)).toBeNull()
    expect(parseDate(undefined)).toBeNull()
    expect(parseDate('')).toBeNull()
  })

  it('parses ISO 8601 strings', () => {
    const result = parseDate('2023-06-15')
    expect(result).toBeInstanceOf(Date)
    expect(result?.getUTCFullYear()).toBe(2023)
    expect(result?.getUTCMonth()).toBe(5)
    expect(result?.getUTCDate()).toBe(15)
  })

  it('parses MM/DD/YYYY format', () => {
    const result = parseDate('06/15/2023')
    expect(result).toBeInstanceOf(Date)
    expect(result?.getFullYear()).toBe(2023)
    expect(result?.getMonth()).toBe(5)
    expect(result?.getDate()).toBe(15)
  })

  it('parses MM-DD-YYYY format', () => {
    const result = parseDate('06-15-2023')
    expect(result).toBeInstanceOf(Date)
    expect(result?.getFullYear()).toBe(2023)
  })

  it('returns an existing Date object unchanged', () => {
    const d = new Date('2022-01-01')
    expect(parseDate(d)).toEqual(d)
  })

  it('returns null for an invalid Date object', () => {
    expect(parseDate(new Date('not-a-date'))).toBeNull()
  })

  it('parses unix timestamp numbers', () => {
    const ts = new Date('2020-03-15').getTime()
    const result = parseDate(ts)
    expect(result).toBeInstanceOf(Date)
    expect(result?.getFullYear()).toBe(2020)
  })

  it('returns null for nonsense strings', () => {
    expect(parseDate('not-a-date')).toBeNull()
    expect(parseDate('hello world')).toBeNull()
  })
})

describe('formatDate', () => {
  it('returns — for null and undefined', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
  })

  it('formats a valid date', () => {
    const result = formatDate(new Date('2023-06-15T12:00:00.000Z'))
    expect(typeof result).toBe('string')
    expect(result).toContain('2023')
  })

  it('returns — for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('—')
  })
})

describe('isWarrantyActive', () => {
  it('returns false for null and undefined', () => {
    expect(isWarrantyActive(null)).toBe(false)
    expect(isWarrantyActive(undefined)).toBe(false)
  })

  it('returns true for a future date', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
    expect(isWarrantyActive(future)).toBe(true)
  })

  it('returns false for a past date', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24)
    expect(isWarrantyActive(past)).toBe(false)
  })

  it('accepts a date string', () => {
    expect(isWarrantyActive('2099-01-01')).toBe(true)
    expect(isWarrantyActive('2000-01-01')).toBe(false)
  })
})

describe('daysUntilWarrantyExpires', () => {
  it('returns null for null/undefined', () => {
    expect(daysUntilWarrantyExpires(null)).toBeNull()
    expect(daysUntilWarrantyExpires(undefined)).toBeNull()
  })

  it('returns a positive number for a future date', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    const days = daysUntilWarrantyExpires(future)
    expect(days).toBeGreaterThan(0)
    expect(days).toBeLessThanOrEqual(31)
  })

  it('returns a negative number for a past date', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24 * 10)
    expect(daysUntilWarrantyExpires(past)).toBeLessThan(0)
  })
})
