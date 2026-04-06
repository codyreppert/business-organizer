import { validateBusinessTrip } from '@/lib/utils/validation'

describe('validateBusinessTrip', () => {
  it('fails for non-object input', () => {
    expect(validateBusinessTrip(null).valid).toBe(false)
    expect(validateBusinessTrip('string').valid).toBe(false)
  })

  it('passes for minimal valid input', () => {
    const result = validateBusinessTrip({ startDate: '2024-02-12', endDate: '2024-02-14' })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('fails when startDate is missing', () => {
    const result = validateBusinessTrip({ endDate: '2024-02-14' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('startDate is required')
  })

  it('fails when endDate is missing', () => {
    const result = validateBusinessTrip({ startDate: '2024-02-12' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('endDate is required')
  })

  it('fails when endDate is before startDate', () => {
    const result = validateBusinessTrip({ startDate: '2024-02-14', endDate: '2024-02-12' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('endDate must be on or after startDate')
  })

  it('passes when startDate equals endDate (same-day trip)', () => {
    const result = validateBusinessTrip({ startDate: '2024-02-12', endDate: '2024-02-12' })
    expect(result.valid).toBe(true)
  })

  it('fails for negative miles', () => {
    const result = validateBusinessTrip({ startDate: '2024-02-12', endDate: '2024-02-14', miles: -10 })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('miles must be a non-negative number')
  })

  it('passes for 0 miles', () => {
    const result = validateBusinessTrip({ startDate: '2024-02-12', endDate: '2024-02-14', miles: 0 })
    expect(result.valid).toBe(true)
  })

  it('fails for zero or negative mileageRate', () => {
    const result = validateBusinessTrip({ startDate: '2024-02-12', endDate: '2024-02-14', mileageRate: 0 })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('mileageRate must be a positive number')
  })

  it('fails for non-integer perDiemDays', () => {
    const result = validateBusinessTrip({ startDate: '2024-02-12', endDate: '2024-02-14', perDiemDays: 2.5 })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('perDiemDays must be a positive integer')
  })

  it('fails for perDiemDays of 0', () => {
    const result = validateBusinessTrip({ startDate: '2024-02-12', endDate: '2024-02-14', perDiemDays: 0 })
    expect(result.valid).toBe(false)
  })

  it('fails for zero or negative perDiemRate', () => {
    const result = validateBusinessTrip({ startDate: '2024-02-12', endDate: '2024-02-14', perDiemRate: -50 })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('perDiemRate must be a positive number')
  })

  it('passes with all optional fields valid', () => {
    const result = validateBusinessTrip({
      startDate: '2024-02-12',
      endDate: '2024-02-14',
      miles: 240,
      mileageRate: 0.67,
      perDiemDays: 3,
      perDiemRate: 200,
      clientOrProject: 'Acme Corp',
      destination: 'Chicago, IL',
    })
    expect(result.valid).toBe(true)
  })
})
