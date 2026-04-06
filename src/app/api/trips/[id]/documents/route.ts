import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { db } from '@/lib/db'
import { validateUpload, sanitizeFilename } from '@/lib/utils/upload'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const trip = await db.businessTrip.findUnique({ where: { id: params.id } })
  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const name = formData.get('name') as string | null
  const type = (formData.get('type') as string | null) ?? 'other'

  if (!file) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }

  const validationError = validateUpload(file)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'trips', params.id)
  await mkdir(uploadDir, { recursive: true })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const filename = sanitizeFilename(file.name)
  const filePath = path.join(uploadDir, filename)
  await writeFile(filePath, buffer)

  const document = await db.document.create({
    data: {
      tripId: params.id,
      name: name ?? file.name,
      type,
      filePath: `/uploads/trips/${params.id}/${filename}`,
      fileSizeBytes: file.size,
      mimeType: file.type || null,
    },
  })

  return NextResponse.json({ data: document }, { status: 201 })
}
