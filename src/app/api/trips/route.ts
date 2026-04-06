import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateBusinessTrip } from '@/lib/utils/validation'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientOrProject = searchParams.get('clientOrProject')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const trips = await db.businessTrip.findMany({
    where: {
      ...(clientOrProject && { clientOrProject: { contains: clientOrProject, mode: 'insensitive' } }),
      ...(startDate && { startDate: { gte: new Date(startDate) } }),
      ...(endDate && { endDate: { lte: new Date(endDate) } }),
    },
    include: {
      expenses: { orderBy: { date: 'asc' } },
      documents: { orderBy: { createdAt: 'desc' } },
    },
    orderBy: { startDate: 'desc' },
  })

  return NextResponse.json({ data: trips })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { valid, errors } = validateBusinessTrip(body)

  if (!valid) {
    return NextResponse.json({ error: errors.join('; ') }, { status: 400 })
  }

  const trip = await db.businessTrip.create({
    data: {
      clientOrProject: body.clientOrProject ?? null,
      description: body.description ?? null,
      destination: body.destination ?? null,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      miles: body.miles ?? null,
      mileageRate: body.mileageRate ?? null,
      perDiemDays: body.perDiemDays ?? null,
      perDiemRate: body.perDiemRate ?? null,
      notes: body.notes ?? null,
      inferredFields: body.inferredFields ?? [],
    },
    include: {
      expenses: true,
      documents: true,
    },
  })

  return NextResponse.json({ data: trip }, { status: 201 })
}
