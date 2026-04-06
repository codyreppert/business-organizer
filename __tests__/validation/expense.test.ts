import { validateTripExpense, validateStandaloneExpense, EXPENSE_CATEGORIES } from '@/lib/utils/validation'

describe('validateTripExpense', () => {
  it('fails for non-object input', () => {
    expect(validateTripExpense(null).valid).toBe(false)
    expect(validateTripExpense(42).valid).toBe(false)
  })

  it('passes for minimal valid input', () => {
    const result = validateTripExpense({ category: 'meals', amount: 45.5, date: '2024-02-12' })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('fails when category is missing', () => {
    const result = validateTripExpense({ amount: 45.5, date: '2024-02-12' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('category is required')
  })

  it('fails for invalid category', () => {
    const result = validateTripExpense({ category: 'entertainment', amount: 45.5, date: '2024-02-12' })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('category must be one of'))).toBe(true)
  })

  it('fails when amount is missing', () => {
    const result = validateTripExpense({ category: 'meals', date: '2024-02-12' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('amount is required')
  })

  it('fails for amount of 0', () => {
    const result = validateTripExpense({ category: 'meals', amount: 0, date: '2024-02-12' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('amount must be a positive number')
  })

  it('fails for negative amount', () => {
    const result = validateTripExpense({ category: 'meals', amount: -10, date: '2024-02-12' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('amount must be a positive number')
  })

  it('fails when date is missing', () => {
    const result = validateTripExpense({ category: 'meals', amount: 45.5 })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('date is required')
  })

  it('accepts all valid expense categories', () => {
    EXPENSE_CATEGORIES.forEach(cat => {
      const result = validateTripExpense({ category: cat, amount: 10, date: '2024-02-12' })
      expect(result.valid).toBe(true)
    })
  })
})

describe('validateStandaloneExpense', () => {
  it('fails for non-object input', () => {
    expect(validateStandaloneExpense(null).valid).toBe(false)
  })

  it('passes for minimal valid input', () => {
    const result = validateStandaloneExpense({ category: 'software', amount: 29.99, date: '2024-01-05' })
    expect(result.valid).toBe(true)
  })

  it('fails when category is missing', () => {
    const result = validateStandaloneExpense({ amount: 29.99, date: '2024-01-05' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('category is required')
  })

  it('fails for invalid category', () => {
    const result = validateStandaloneExpense({ category: 'entertainment', amount: 29.99, date: '2024-01-05' })
    expect(result.valid).toBe(false)
  })

  it('fails when amount is 0 or negative', () => {
    expect(validateStandaloneExpense({ category: 'software', amount: 0, date: '2024-01-05' }).valid).toBe(false)
    expect(validateStandaloneExpense({ category: 'software', amount: -5, date: '2024-01-05' }).valid).toBe(false)
  })

  it('fails when amount is missing', () => {
    const result = validateStandaloneExpense({ category: 'software', date: '2024-01-05' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('amount is required')
  })

  it('fails when date is missing', () => {
    const result = validateStandaloneExpense({ category: 'software', amount: 29.99 })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('date is required')
  })

  it('fails when reimbursable is not a boolean', () => {
    const result = validateStandaloneExpense({
      category: 'supplies',
      amount: 50,
      date: '2024-01-05',
      reimbursable: 'yes',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('reimbursable must be a boolean')
  })

  it('passes when reimbursable is true or false', () => {
    expect(validateStandaloneExpense({ category: 'supplies', amount: 50, date: '2024-01-05', reimbursable: true }).valid).toBe(true)
    expect(validateStandaloneExpense({ category: 'supplies', amount: 50, date: '2024-01-05', reimbursable: false }).valid).toBe(true)
  })

  it('passes with all optional fields', () => {
    const result = validateStandaloneExpense({
      category: 'meals',
      amount: 62,
      date: '2024-03-22',
      merchant: 'The Capital Grille',
      description: 'Client lunch',
      businessPurpose: 'Client entertainment',
      reimbursable: false,
    })
    expect(result.valid).toBe(true)
  })
})
