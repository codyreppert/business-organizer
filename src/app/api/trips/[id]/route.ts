import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const trip = await db.businessTrip.findUnique({
    where: { id: params.id },
    include: {
      expenses: { orderBy: { date: 'asc' } },
      documents: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  return NextResponse.json({ data: trip })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const existing = await db.businessTrip.findUnique({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  const body = await request.json()

  const confirmedFields: string[] = body.confirmedFields ?? []
  const updatedInferredFields = existing.inferredFields.filter(
    (f) => !confirmedFields.includes(f),
  )

  const trip = await db.businessTrip.update({
    where: { id: params.id },
    data: {
      ...(body.clientOrProject !== undefined && { clientOrProject: body.clientOrProject }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.destination !== undefined && { destination: body.destination }),
      ...(body.startDate !== undefined && { startDate: new Date(body.startDate) }),
      ...(body.endDate !== undefined && { endDate: new Date(body.endDate) }),
      ...(body.miles !== undefined && { miles: body.miles }),
      ...(body.mileageRate !== undefined && { mileageRate: body.mileageRate }),
      ...(body.perDiemDays !== undefined && { perDiemDays: body.perDiemDays }),
      ...(body.perDiemRate !== undefined && { perDiemRate: body.perDiemRate }),
      ...(body.notes !== undefined && { notes: body.notes }),
      inferredFields: updatedInferredFields,
    },
    include: {
      expenses: { orderBy: { date: 'asc' } },
      documents: { orderBy: { createdAt: 'desc' } },
    },
  })

  return NextResponse.json({ data: trip })
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const existing = await db.businessTrip.findUnique({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  // TripExpenses cascade automatically via onDelete: Cascade
  await db.businessTrip.delete({ where: { id: params.id } })
  return NextResponse.json({ data: { deleted: true } })
}
