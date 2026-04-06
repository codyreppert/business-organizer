import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calcCurrentBookValue } from '@/lib/utils/depreciation'

function fmt(v: unknown): string {
  if (v == null) return ''
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v)
}

function csvRow(fields: unknown[]): string {
  return fields
    .map((f) => {
      const s = fmt(f)
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s
    })
    .join(',')
}

export async function GET(_request: NextRequest) {
  const assets = await db.businessAsset.findMany({
    orderBy: { purchaseDate: 'asc' },
  })

  const headers = [
    'Asset ID',
    'Name',
    'Category',
    'Subcategory',
    'Brand',
    'Model',
    'Serial Number',
    'Status',
    'Purchase Date',
    'Purchase Price',
    'Depreciation Method',
    'Useful Life (Years)',
    'Salvage Value',
    'Current Book Value',
    'Warranty End',
  ]

  const rows = assets.map((a) => {
    const purchasePrice = a.purchasePrice ? Number(a.purchasePrice) : null
    const salvageValue = a.salvageValue ? Number(a.salvageValue) : null
    const bookValue = calcCurrentBookValue(
      purchasePrice,
      salvageValue,
      a.usefulLifeYears ?? null,
      a.depreciationMethod ?? null,
      a.purchaseDate ?? null,
    )

    return csvRow([
      a.id,
      a.name,
      a.category,
      a.subcategory,
      a.brand,
      a.model,
      a.serialNumber,
      a.status,
      a.purchaseDate,
      purchasePrice != null ? purchasePrice.toFixed(2) : '',
      a.depreciationMethod,
      a.usefulLifeYears,
      salvageValue != null ? salvageValue.toFixed(2) : '',
      bookValue != null ? bookValue.toFixed(2) : '',
      a.warrantyEnd,
    ])
  })

  const totalCost = assets.reduce((sum, a) => sum + (a.purchasePrice ? Number(a.purchasePrice) : 0), 0)
  const activeCount = assets.filter((a) => a.status === 'active').length

  const lines = [
    csvRow(headers),
    ...rows,
    '',
    `# Asset Summary`,
    `# Total assets,${assets.length}`,
    `# Active assets,${activeCount}`,
    `# Total original cost,$${totalCost.toFixed(2)}`,
    `# Generated,${new Date().toISOString().slice(0, 10)}`,
  ]

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="assets.csv"',
    },
  })
}
