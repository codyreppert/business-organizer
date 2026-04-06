import type {
  AssetCategory,
  AssetSubcategory,
  AssetStatus,
  DepreciationMethod,
  ExpenseCategory,
  DocumentType,
} from '@/types'

// ── Constants ─────────────────────────────────────────────────────────────────

export const ASSET_CATEGORIES: AssetCategory[] = ['equipment', 'technology']

export const ASSET_SUBCATEGORIES: AssetSubcategory[] = [
  'machinery', 'tools', 'office', 'computer', 'phone', 'software', 'other',
]

export const ASSET_STATUSES: AssetStatus[] = ['active', 'retired', 'disposed']

export const DEPRECIATION_METHODS: DepreciationMethod[] = [
  'straight-line', 'double-declining', 'none',
]

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'meals', 'lodging', 'transport', 'supplies', 'software', 'other',
]

export const DOCUMENT_TYPES: DocumentType[] = [
  'receipt', 'invoice', 'contract', 'warranty', 'other',
]

// ── Type guards ───────────────────────────────────────────────────────────────

export function isAssetCategory(value: string): value is AssetCategory {
  return ASSET_CATEGORIES.includes(value as AssetCategory)
}

export function isAssetSubcategory(value: string): value is AssetSubcategory {
  return ASSET_SUBCATEGORIES.includes(value as AssetSubcategory)
}

export function isAssetStatus(value: string): value is AssetStatus {
  return ASSET_STATUSES.includes(value as AssetStatus)
}

export function isDepreciationMethod(value: string): value is DepreciationMethod {
  return DEPRECIATION_METHODS.includes(value as DepreciationMethod)
}

export function isExpenseCategory(value: string): value is ExpenseCategory {
  return EXPENSE_CATEGORIES.includes(value as ExpenseCategory)
}

export function isDocumentType(value: string): value is DocumentType {
  return DOCUMENT_TYPES.includes(value as DocumentType)
}

// ── Shared result type ────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

// ── Validators ────────────────────────────────────────────────────────────────

export function validateBusinessAsset(data: unknown): ValidationResult {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object'] }
  }

  const body = data as Record<string, unknown>

  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    errors.push('name is required')
  }

  if (!body.category || typeof body.category !== 'string') {
    errors.push('category is required')
  } else if (!isAssetCategory(body.category)) {
    errors.push(`category must be one of: ${ASSET_CATEGORIES.join(', ')}`)
  }

  if (body.subcategory !== undefined && body.subcategory !== null) {
    if (typeof body.subcategory !== 'string' || !isAssetSubcategory(body.subcategory)) {
      errors.push(`subcategory must be one of: ${ASSET_SUBCATEGORIES.join(', ')}`)
    }
  }

  if (body.status !== undefined && body.status !== null) {
    if (typeof body.status !== 'string' || !isAssetStatus(body.status)) {
      errors.push(`status must be one of: ${ASSET_STATUSES.join(', ')}`)
    }
  }

  if (body.purchasePrice !== undefined && body.purchasePrice !== null) {
    const price = Number(body.purchasePrice)
    if (isNaN(price) || price < 0) {
      errors.push('purchasePrice must be a non-negative number')
    }
  }

  if (body.salvageValue !== undefined && body.salvageValue !== null) {
    const sv = Number(body.salvageValue)
    if (isNaN(sv) || sv < 0) {
      errors.push('salvageValue must be a non-negative number')
    }
  }

  if (body.usefulLifeYears !== undefined && body.usefulLifeYears !== null) {
    const years = Number(body.usefulLifeYears)
    if (isNaN(years) || years <= 0 || !Number.isInteger(years)) {
      errors.push('usefulLifeYears must be a positive integer')
    }
  }

  if (body.depreciationMethod !== undefined && body.depreciationMethod !== null) {
    if (typeof body.depreciationMethod !== 'string' || !isDepreciationMethod(body.depreciationMethod)) {
      errors.push(`depreciationMethod must be one of: ${DEPRECIATION_METHODS.join(', ')}`)
    }
  }

  return { valid: errors.length === 0, errors }
}

export function validateBusinessTrip(data: unknown): ValidationResult {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object'] }
  }

  const body = data as Record<string, unknown>

  if (!body.startDate) {
    errors.push('startDate is required')
  }

  if (!body.endDate) {
    errors.push('endDate is required')
  }

  if (body.startDate && body.endDate) {
    const start = new Date(body.startDate as string)
    const end = new Date(body.endDate as string)
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end < start) {
      errors.push('endDate must be on or after startDate')
    }
  }

  if (body.miles !== undefined && body.miles !== null) {
    const miles = Number(body.miles)
    if (isNaN(miles) || miles < 0) {
      errors.push('miles must be a non-negative number')
    }
  }

  if (body.mileageRate !== undefined && body.mileageRate !== null) {
    const rate = Number(body.mileageRate)
    if (isNaN(rate) || rate <= 0) {
      errors.push('mileageRate must be a positive number')
    }
  }

  if (body.perDiemDays !== undefined && body.perDiemDays !== null) {
    const days = Number(body.perDiemDays)
    if (isNaN(days) || days <= 0 || !Number.isInteger(days)) {
      errors.push('perDiemDays must be a positive integer')
    }
  }

  if (body.perDiemRate !== undefined && body.perDiemRate !== null) {
    const rate = Number(body.perDiemRate)
    if (isNaN(rate) || rate <= 0) {
      errors.push('perDiemRate must be a positive number')
    }
  }

  return { valid: errors.length === 0, errors }
}

export function validateTripExpense(data: unknown): ValidationResult {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object'] }
  }

  const body = data as Record<string, unknown>

  if (!body.category || typeof body.category !== 'string') {
    errors.push('category is required')
  } else if (!isExpenseCategory(body.category)) {
    errors.push(`category must be one of: ${EXPENSE_CATEGORIES.join(', ')}`)
  }

  if (body.amount === undefined || body.amount === null) {
    errors.push('amount is required')
  } else {
    const amount = Number(body.amount)
    if (isNaN(amount) || amount <= 0) {
      errors.push('amount must be a positive number')
    }
  }

  if (!body.date) {
    errors.push('date is required')
  }

  return { valid: errors.length === 0, errors }
}

export function validateStandaloneExpense(data: unknown): ValidationResult {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object'] }
  }

  const body = data as Record<string, unknown>

  if (!body.category || typeof body.category !== 'string') {
    errors.push('category is required')
  } else if (!isExpenseCategory(body.category)) {
    errors.push(`category must be one of: ${EXPENSE_CATEGORIES.join(', ')}`)
  }

  if (body.amount === undefined || body.amount === null) {
    errors.push('amount is required')
  } else {
    const amount = Number(body.amount)
    if (isNaN(amount) || amount <= 0) {
      errors.push('amount must be a positive number')
    }
  }

  if (!body.date) {
    errors.push('date is required')
  }

  if (body.reimbursable !== undefined && body.reimbursable !== null) {
    if (typeof body.reimbursable !== 'boolean') {
      errors.push('reimbursable must be a boolean')
    }
  }

  return { valid: errors.length === 0, errors }
}
