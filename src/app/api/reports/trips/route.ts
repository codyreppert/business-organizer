import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calcMileageDeduction } from '@/lib/utils/mileage'
import { calcPerDiem, calcTripTotal } from '@/lib/utils/trip'

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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : null

  const where = year
    ? { startDate: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) } }
    : {}

  const trips = await db.businessTrip.findMany({
    where,
    include: { expenses: true },
    orderBy: { startDate: 'asc' },
  })

  const headers = [
    'Trip ID',
    'Client / Project',
    'Destination',
    'Start Date',
    'End Date',
    'Miles',
    'Mileage Rate',
    'Mileage Deduction',
    'Per Diem Days',
    'Per Diem Rate',
    'Per Diem Total',
    'Trip Expenses Total',
    'Total Deduction',
    'Notes',
  ]

  const rows = trips.map((trip) => {
    const miles = trip.miles ? Number(trip.miles) : null
    const mileageRate = trip.mileageRate ? Number(trip.mileageRate) : null
    const perDiemRate = trip.perDiemRate ? Number(trip.perDiemRate) : null
    const expenseAmounts = trip.expenses.map((e) => Number(e.amount))

    const mileageDeduction = calcMileageDeduction(miles, mileageRate ?? undefined)
    const perDiem = calcPerDiem(trip.perDiemDays ?? null, perDiemRate)
    const total = calcTripTotal({ miles, mileageRate, perDiemDays: trip.perDiemDays ?? null, perDiemRate, expenseAmounts })

    return csvRow([
      trip.id,
      trip.clientOrProject,
      trip.destination,
      trip.startDate,
      trip.endDate,
      miles ?? '',
      mileageRate ?? '',
      mileageDeduction?.toFixed(2) ?? '',
      trip.perDiemDays ?? '',
      perDiemRate ?? '',
      perDiem?.toFixed(2) ?? '',
      expenseAmounts.reduce((s, a) => s + a, 0).toFixed(2),
      total.toFixed(2),
      trip.notes,
    ])
  })

  // IRS summary footer
  const grandTotal = trips.reduce((sum, trip) => {
    const miles = trip.miles ? Number(trip.miles) : null
    const mileageRate = trip.mileageRate ? Number(trip.mileageRate) : null
    const perDiemRate = trip.perDiemRate ? Number(trip.perDiemRate) : null
    const expenseAmounts = trip.expenses.map((e) => Number(e.amount))
    return sum + calcTripTotal({ miles, mileageRate, perDiemDays: trip.perDiemDays ?? null, perDiemRate, expenseAmounts })
  }, 0)

  const totalMiles = trips.reduce((sum, t) => sum + (t.miles ? Number(t.miles) : 0), 0)

  const lines = [
    csvRow(headers),
    ...rows,
    '',
    `# IRS Summary${year ? ` — Tax Year ${year}` : ''}`,
    `# Total trips,${trips.length}`,
    `# Total miles,${totalMiles.toFixed(1)}`,
    `# Total deductions,$${grandTotal.toFixed(2)}`,
    `# Generated,${new Date().toISOString().slice(0, 10)}`,
  ]

  const filename = year ? `trips-${year}.csv` : 'trips-all.csv'

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
