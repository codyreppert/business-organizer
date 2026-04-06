import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; expenseId: string } }
) {
  const expense = await db.tripExpense.findUnique({
    where: { id: params.expenseId },
  })

  if (!expense || expense.tripId !== params.id) {
    return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
  }

  await db.tripExpense.delete({ where: { id: params.expenseId } })
  return NextResponse.json({ data: null })
}
