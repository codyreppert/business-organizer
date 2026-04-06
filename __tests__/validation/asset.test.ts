import {
  validateBusinessAsset,
  isAssetCategory,
  isAssetSubcategory,
  isAssetStatus,
  isDepreciationMethod,
  ASSET_CATEGORIES,
  ASSET_STATUSES,
} from '@/lib/utils/validation'

describe('isAssetCategory', () => {
  it('returns true for valid categories', () => {
    expect(isAssetCategory('equipment')).toBe(true)
    expect(isAssetCategory('technology')).toBe(true)
  })

  it('returns false for invalid categories', () => {
    expect(isAssetCategory('vehicle')).toBe(false)
    expect(isAssetCategory('')).toBe(false)
    expect(isAssetCategory('EQUIPMENT')).toBe(false)
  })
})

describe('isAssetSubcategory', () => {
  it('returns true for valid subcategories', () => {
    expect(isAssetSubcategory('machinery')).toBe(true)
    expect(isAssetSubcategory('computer')).toBe(true)
    expect(isAssetSubcategory('other')).toBe(true)
  })

  it('returns false for invalid subcategories', () => {
    expect(isAssetSubcategory('vehicle')).toBe(false)
    expect(isAssetSubcategory('')).toBe(false)
  })
})

describe('isAssetStatus', () => {
  it('returns true for valid statuses', () => {
    ASSET_STATUSES.forEach(s => expect(isAssetStatus(s)).toBe(true))
  })

  it('returns false for invalid statuses', () => {
    expect(isAssetStatus('unknown')).toBe(false)
    expect(isAssetStatus('replaced')).toBe(false)
    expect(isAssetStatus('')).toBe(false)
  })
})

describe('isDepreciationMethod', () => {
  it('returns true for valid methods', () => {
    expect(isDepreciationMethod('straight-line')).toBe(true)
    expect(isDepreciationMethod('double-declining')).toBe(true)
    expect(isDepreciationMethod('none')).toBe(true)
  })

  it('returns false for invalid methods', () => {
    expect(isDepreciationMethod('macrs')).toBe(false)
    expect(isDepreciationMethod('')).toBe(false)
  })
})

describe('validateBusinessAsset', () => {
  it('fails for non-object input', () => {
    expect(validateBusinessAsset(null).valid).toBe(false)
    expect(validateBusinessAsset('string').valid).toBe(false)
    expect(validateBusinessAsset(42).valid).toBe(false)
  })

  it('passes for minimal valid input', () => {
    const result = validateBusinessAsset({ name: 'MacBook Pro', category: 'technology' })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('fails when name is missing', () => {
    const result = validateBusinessAsset({ category: 'equipment' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('name is required')
  })

  it('fails when name is empty string', () => {
    const result = validateBusinessAsset({ name: '  ', category: 'equipment' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('name is required')
  })

  it('fails when category is missing', () => {
    const result = validateBusinessAsset({ name: 'Press' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('category is required')
  })

  it('fails for invalid category', () => {
    const result = validateBusinessAsset({ name: 'Press', category: 'vehicle' })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('category must be one of'))).toBe(true)
  })

  it('fails for invalid subcategory', () => {
    const result = validateBusinessAsset({ name: 'Press', category: 'equipment', subcategory: 'airplane' })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('subcategory must be one of'))).toBe(true)
  })

  it('passes for valid subcategory', () => {
    const result = validateBusinessAsset({ name: 'Press', category: 'equipment', subcategory: 'machinery' })
    expect(result.valid).toBe(true)
  })

  it('fails for invalid status', () => {
    const result = validateBusinessAsset({ name: 'Press', category: 'equipment', status: 'lost' })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('status must be one of'))).toBe(true)
  })

  it('fails for negative purchasePrice', () => {
    const result = validateBusinessAsset({ name: 'Press', category: 'equipment', purchasePrice: -100 })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('purchasePrice must be a non-negative number')
  })

  it('passes for purchasePrice of 0', () => {
    const result = validateBusinessAsset({ name: 'Press', category: 'equipment', purchasePrice: 0 })
    expect(result.valid).toBe(true)
  })

  it('fails for negative salvageValue', () => {
    const result = validateBusinessAsset({ name: 'Press', category: 'equipment', salvageValue: -50 })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('salvageValue must be a non-negative number')
  })

  it('fails for non-integer usefulLifeYears', () => {
    const result = validateBusinessAsset({ name: 'Press', category: 'equipment', usefulLifeYears: 5.5 })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('usefulLifeYears must be a positive integer')
  })

  it('fails for usefulLifeYears of 0', () => {
    const result = validateBusinessAsset({ name: 'Press', category: 'equipment', usefulLifeYears: 0 })
    expect(result.valid).toBe(false)
  })

  it('fails for invalid depreciationMethod', () => {
    const result = validateBusinessAsset({ name: 'Press', category: 'equipment', depreciationMethod: 'macrs' })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('depreciationMethod must be one of'))).toBe(true)
  })

  it('accepts all valid categories', () => {
    ASSET_CATEGORIES.forEach(cat => {
      const result = validateBusinessAsset({ name: 'Item', category: cat })
      expect(result.valid).toBe(true)
    })
  })
})
