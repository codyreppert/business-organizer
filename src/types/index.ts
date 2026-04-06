// ── Enumerations ──────────────────────────────────────────────────────────────

export type AssetCategory = 'equipment' | 'technology'

export type AssetSubcategory =
  | 'machinery'
  | 'tools'
  | 'office'
  | 'computer'
  | 'phone'
  | 'software'
  | 'other'

export type AssetStatus = 'active' | 'retired' | 'disposed'

export type DepreciationMethod = 'straight-line' | 'double-declining' | 'none'

export type ExpenseCategory = 'meals' | 'lodging' | 'transport' | 'supplies' | 'software' | 'other'

export type DocumentType = 'receipt' | 'invoice' | 'contract' | 'warranty' | 'other'

// ── Core Entities ─────────────────────────────────────────────────────────────

export interface BusinessAsset {
  id: string

  name: string
  category: AssetCategory
  subcategory?: AssetSubcategory | null

  brand?: string | null
  model?: string | null
  serialNumber?: string | null

  purchaseDate?: Date | null
  purchasePrice?: number | null

  warrantyStart?: Date | null
  warrantyEnd?: Date | null

  depreciationMethod?: DepreciationMethod | null
  usefulLifeYears?: number | null
  salvageValue?: number | null

  status: AssetStatus
  notes?: string | null

  /**
   * Names of fields whose values were set by AI inference and have not yet
   * been confirmed by the user. The UI should visually flag these fields.
   * When the user confirms a value, remove its key from this array via PATCH.
   */
  inferredFields: string[]

  createdAt: Date
  updatedAt: Date
}

export interface BusinessTrip {
  id: string

  clientOrProject?: string | null
  description?: string | null
  destination?: string | null

  startDate: Date
  endDate: Date

  miles?: number | null
  mileageRate?: number | null

  perDiemDays?: number | null
  perDiemRate?: number | null

  notes?: string | null

  inferredFields: string[]

  createdAt: Date
  updatedAt: Date
}

export interface TripExpense {
  id: string
  tripId: string

  category: ExpenseCategory
  amount: number
  date: Date
  merchant?: string | null
  description?: string | null

  inferredFields: string[]

  createdAt: Date
  updatedAt: Date
}

export interface StandaloneExpense {
  id: string

  category: ExpenseCategory
  amount: number
  date: Date
  merchant?: string | null
  description?: string | null
  businessPurpose?: string | null
  reimbursable: boolean

  inferredFields: string[]

  createdAt: Date
  updatedAt: Date
}

export interface Document {
  id: string

  assetId?: string | null
  tripId?: string | null
  expenseId?: string | null
  standaloneExpenseId?: string | null

  name: string
  type: DocumentType
  filePath: string
  fileSizeBytes?: number | null
  mimeType?: string | null

  inferredFields: string[]

  createdAt: Date
  updatedAt: Date
}

// ── Relational shapes ─────────────────────────────────────────────────────────

export interface BusinessAssetWithDocuments extends BusinessAsset {
  documents: Document[]
}

export interface BusinessTripWithRelations extends BusinessTrip {
  expenses: TripExpense[]
  documents: Document[]
}

export interface TripExpenseWithDocuments extends TripExpense {
  documents: Document[]
}

export interface StandaloneExpenseWithDocuments extends StandaloneExpense {
  documents: Document[]
}

// ── Form / input shapes ───────────────────────────────────────────────────────

/** Dates represented as ISO strings for controlled form inputs. Amounts as strings. */
export interface BusinessAssetFormData {
  name: string
  category: AssetCategory
  subcategory?: AssetSubcategory
  brand?: string
  model?: string
  serialNumber?: string
  purchaseDate?: string
  purchasePrice?: string
  warrantyStart?: string
  warrantyEnd?: string
  depreciationMethod?: DepreciationMethod
  usefulLifeYears?: number
  salvageValue?: string
  status?: AssetStatus
  notes?: string
}

export interface BusinessTripFormData {
  clientOrProject?: string
  description?: string
  destination?: string
  startDate: string
  endDate: string
  miles?: string
  mileageRate?: string
  perDiemDays?: number
  perDiemRate?: string
  notes?: string
}

export interface TripExpenseFormData {
  category: ExpenseCategory
  amount: string
  date: string
  merchant?: string
  description?: string
}

export interface StandaloneExpenseFormData {
  category: ExpenseCategory
  amount: string
  date: string
  merchant?: string
  description?: string
  businessPurpose?: string
  reimbursable: boolean
}

// ── API response envelopes ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
