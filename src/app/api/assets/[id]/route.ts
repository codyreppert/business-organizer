import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const asset = await db.businessAsset.findUnique({
    where: { id: params.id },
    include: { documents: { orderBy: { createdAt: 'desc' } } },
  })

  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }

  return NextResponse.json({ data: asset })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const existing = await db.businessAsset.findUnique({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }

  const body = await request.json()

  // confirmedFields: string[] removes those names from inferredFields without touching values.
  const confirmedFields: string[] = body.confirmedFields ?? []
  const updatedInferredFields = existing.inferredFields.filter(
    (f) => !confirmedFields.includes(f),
  )

  const asset = await db.businessAsset.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.subcategory !== undefined && { subcategory: body.subcategory }),
      ...(body.brand !== undefined && { brand: body.brand }),
      ...(body.model !== undefined && { model: body.model }),
      ...(body.serialNumber !== undefined && { serialNumber: body.serialNumber }),
      ...(body.purchaseDate !== undefined && {
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
      }),
      ...(body.purchasePrice !== undefined && { purchasePrice: body.purchasePrice }),
      ...(body.warrantyStart !== undefined && {
        warrantyStart: body.warrantyStart ? new Date(body.warrantyStart) : null,
      }),
      ...(body.warrantyEnd !== undefined && {
        warrantyEnd: body.warrantyEnd ? new Date(body.warrantyEnd) : null,
      }),
      ...(body.depreciationMethod !== undefined && { depreciationMethod: body.depreciationMethod }),
      ...(body.usefulLifeYears !== undefined && { usefulLifeYears: body.usefulLifeYears }),
      ...(body.salvageValue !== undefined && { salvageValue: body.salvageValue }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes }),
      inferredFields: updatedInferredFields,
    },
    include: { documents: true },
  })

  return NextResponse.json({ data: asset })
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const existing = await db.businessAsset.findUnique({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }

  await db.businessAsset.delete({ where: { id: params.id } })
  return NextResponse.json({ data: { deleted: true } })
}
