import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const conversations = await db.conversation.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { role: true, content: true } },
    },
  })
  return NextResponse.json({ data: conversations })
}

export async function POST() {
  const conversation = await db.conversation.create({ data: {} })
  return NextResponse.json({ data: conversation }, { status: 201 })
}
