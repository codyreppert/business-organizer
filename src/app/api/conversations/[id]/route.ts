import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const conversation = await db.conversation.findUnique({
    where: { id: params.id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })
  if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: conversation })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await db.conversation.delete({ where: { id: params.id } })
  return NextResponse.json({ data: null })
}
