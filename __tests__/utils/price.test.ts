import { parsePrice, formatPrice } from '@/lib/utils/price'

describe('parsePrice', () => {
  it('returns null for null, undefined, and empty string', () => {
    expect(parsePrice(null)).toBeNull()
    expect(parsePrice(undefined)).toBeNull()
    expect(parsePrice('')).toBeNull()
  })

  it('parses a plain number', () => {
    expect(parsePrice(1234.56)).toBe(1234.56)
    expect(parsePrice(0)).toBe(0)
  })

  it('parses a string number', () => {
    expect(parsePrice('1234.56')).toBe(1234.56)
    expect(parsePrice('0')).toBe(0)
  })

  it('strips currency symbols and commas', () => {
    expect(parsePrice('$1,234.56')).toBe(1234.56)
    expect(parsePrice('$12,500')).toBe(12500)
    expect(parsePrice('$ 850.00')).toBe(850)
  })

  it('returns null for negative values', () => {
    expect(parsePrice(-5)).toBeNull()
    expect(parsePrice('-100')).toBeNull()
    expect(parsePrice('$-50')).toBeNull()
  })

  it('returns null for non-numeric strings', () => {
    expect(parsePrice('abc')).toBeNull()
    expect(parsePrice('$')).toBeNull()
    expect(parsePrice('N/A')).toBeNull()
  })

  it('rounds to 2 decimal places', () => {
    expect(parsePrice(1.999)).toBe(2)
    expect(parsePrice('10.555')).toBe(10.56)
  })

  it('returns null for Infinity and NaN', () => {
    expect(parsePrice(Infinity)).toBeNull()
    expect(parsePrice(NaN)).toBeNull()
  })
})

describe('formatPrice', () => {
  it('returns — for null and undefined', () => {
    expect(formatPrice(null)).toBe('—')
    expect(formatPrice(undefined)).toBe('—')
  })

  it('formats USD correctly', () => {
    expect(formatPrice(12500)).toBe('$12,500')
    expect(formatPrice(1049.99)).toBe('$1,049.99')
    expect(formatPrice(0)).toBe('$0')
  })

  it('omits cents when value is a whole number', () => {
    expect(formatPrice(1000)).toBe('$1,000')
  })

  it('includes cents when value has a fractional part', () => {
    expect(formatPrice(1049.5)).toBe('$1,049.5')
    expect(formatPrice(1049.55)).toBe('$1,049.55')
  })
})
