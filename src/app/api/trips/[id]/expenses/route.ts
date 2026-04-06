import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateTripExpense } from '@/lib/utils/validation'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const trip = await db.businessTrip.findUnique({ where: { id: params.id } })
  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  const expenses = await db.tripExpense.findMany({
    where: { tripId: params.id },
    include: { documents: { orderBy: { createdAt: 'desc' } } },
    orderBy: { date: 'asc' },
  })

  return NextResponse.json({ data: expenses })
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const trip = await db.businessTrip.findUnique({ where: { id: params.id } })
  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  const body = await request.json()
  const { valid, errors } = validateTripExpense(body)

  if (!valid) {
    return NextResponse.json({ error: errors.join('; ') }, { status: 400 })
  }

  const expense = await db.tripExpense.create({
    data: {
      tripId: params.id,
      category: body.category,
      amount: body.amount,
      date: new Date(body.date),
      merchant: body.merchant ?? null,
      description: body.description ?? null,
      inferredFields: body.inferredFields ?? [],
    },
    include: { documents: true },
  })

  return NextResponse.json({ data: expense }, { status: 201 })
}
