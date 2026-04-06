import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function fmt(v: unknown): string {
  if (v == null) return ''
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : null

  const where = year
    ? { date: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) } }
    : {}

  const expenses = await db.standaloneExpense.findMany({
    where,
    orderBy: { date: 'asc' },
  })

  const headers = [
    'Expense ID',
    'Date',
    'Category',
    'Merchant',
    'Amount',
    'Business Purpose',
    'Reimbursable',
    'Description',
  ]

  const rows = expenses.map((e) =>
    csvRow([
      e.id,
      e.date,
      e.category,
      e.merchant,
      Number(e.amount).toFixed(2),
      e.businessPurpose,
      e.reimbursable,
      e.description,
    ])
  )

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const reimbursableTotal = expenses
    .filter((e) => e.reimbursable)
    .reduce((sum, e) => sum + Number(e.amount), 0)

  const lines = [
    csvRow(headers),
    ...rows,
    '',
    `# IRS Summary${year ? ` — Tax Year ${year}` : ''}`,
    `# Total expenses,${expenses.length}`,
    `# Total amount,$${total.toFixed(2)}`,
    `# Reimbursable,$${reimbursableTotal.toFixed(2)}`,
    `# Non-reimbursable,$${(total - reimbursableTotal).toFixed(2)}`,
    `# Generated,${new Date().toISOString().slice(0, 10)}`,
  ]

  const filename = year ? `expenses-${year}.csv` : 'expenses-all.csv'

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
