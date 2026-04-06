import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateStandaloneExpense } from '@/lib/utils/validation'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const reimbursable = searchParams.get('reimbursable')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const expenses = await db.standaloneExpense.findMany({
    where: {
      ...(category && { category }),
      ...(reimbursable !== null && { reimbursable: reimbursable === 'true' }),
      ...(startDate && { date: { gte: new Date(startDate) } }),
      ...(endDate && { date: { lte: new Date(endDate) } }),
    },
    include: { documents: { orderBy: { createdAt: 'desc' } } },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json({ data: expenses })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { valid, errors } = validateStandaloneExpense(body)

  if (!valid) {
    return NextResponse.json({ error: errors.join('; ') }, { status: 400 })
  }

  const expense = await db.standaloneExpense.create({
    data: {
      category: body.category,
      amount: body.amount,
      date: new Date(body.date),
      merchant: body.merchant ?? null,
      description: body.description ?? null,
      businessPurpose: body.businessPurpose ?? null,
      reimbursable: body.reimbursable ?? false,
      inferredFields: body.inferredFields ?? [],
    },
    include: { documents: true },
  })

  return NextResponse.json({ data: expense }, { status: 201 })
}
