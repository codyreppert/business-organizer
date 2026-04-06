import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const expense = await db.standaloneExpense.findUnique({
    where: { id: params.id },
    include: { documents: { orderBy: { createdAt: 'desc' } } },
  })

  if (!expense) {
    return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
  }

  return NextResponse.json({ data: expense })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const existing = await db.standaloneExpense.findUnique({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
  }

  const body = await request.json()

  const confirmedFields: string[] = body.confirmedFields ?? []
  const updatedInferredFields = existing.inferredFields.filter(
    (f) => !confirmedFields.includes(f),
  )

  const expense = await db.standaloneExpense.update({
    where: { id: params.id },
    data: {
      ...(body.category !== undefined && { category: body.category }),
      ...(body.amount !== undefined && { amount: body.amount }),
      ...(body.date !== undefined && { date: new Date(body.date) }),
      ...(body.merchant !== undefined && { merchant: body.merchant }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.businessPurpose !== undefined && { businessPurpose: body.businessPurpose }),
      ...(body.reimbursable !== undefined && { reimbursable: body.reimbursable }),
      inferredFields: updatedInferredFields,
    },
    include: { documents: true },
  })

  return NextResponse.json({ data: expense })
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const existing = await db.standaloneExpense.findUnique({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
  }

  await db.standaloneExpense.delete({ where: { id: params.id } })
  return NextResponse.json({ data: { deleted: true } })
}
