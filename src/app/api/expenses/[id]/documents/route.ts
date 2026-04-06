import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { db } from '@/lib/db'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const expense = await db.standaloneExpense.findUnique({ where: { id: params.id } })
  if (!expense) {
    return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const name = formData.get('name') as string | null
  const type = (formData.get('type') as string | null) ?? 'other'

  if (!file) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'expenses', params.id)
  await mkdir(uploadDir, { recursive: true })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const filename = `${Date.now()}-${file.name}`
  const filePath = path.join(uploadDir, filename)
  await writeFile(filePath, buffer)

  const document = await db.document.create({
    data: {
      standaloneExpenseId: params.id,
      name: name ?? file.name,
      type,
      filePath: `/uploads/expenses/${params.id}/${filename}`,
      fileSizeBytes: file.size,
      mimeType: file.type || null,
    },
  })

  return NextResponse.json({ data: document }, { status: 201 })
}
