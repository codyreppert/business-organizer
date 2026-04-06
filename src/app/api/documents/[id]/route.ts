import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import path from 'path'
import { db } from '@/lib/db'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const document = await db.document.findUnique({ where: { id: params.id } })

  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  return NextResponse.json({ data: document })
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const document = await db.document.findUnique({ where: { id: params.id } })

  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  // Delete the file from disk if it exists
  try {
    const filePath = path.join(process.cwd(), 'public', document.filePath)
    await unlink(filePath)
  } catch {
    // File may not exist on disk (e.g. seed data); proceed with DB deletion
  }

  await db.document.delete({ where: { id: params.id } })
  return NextResponse.json({ data: { deleted: true } })
}
