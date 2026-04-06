import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateBusinessAsset } from '@/lib/utils/validation'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const subcategory = searchParams.get('subcategory')
  const status = searchParams.get('status')

  const assets = await db.businessAsset.findMany({
    where: {
      ...(category && { category }),
      ...(subcategory && { subcategory }),
      ...(status && { status }),
    },
    include: { documents: { orderBy: { createdAt: 'desc' } } },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json({ data: assets })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { valid, errors } = validateBusinessAsset(body)

  if (!valid) {
    return NextResponse.json({ error: errors.join('; ') }, { status: 400 })
  }

  const asset = await db.businessAsset.create({
    data: {
      name: body.name,
      category: body.category,
      subcategory: body.subcategory ?? null,
      brand: body.brand ?? null,
      model: body.model ?? null,
      serialNumber: body.serialNumber ?? null,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
      purchasePrice: body.purchasePrice ?? null,
      warrantyStart: body.warrantyStart ? new Date(body.warrantyStart) : null,
      warrantyEnd: body.warrantyEnd ? new Date(body.warrantyEnd) : null,
      depreciationMethod: body.depreciationMethod ?? null,
      usefulLifeYears: body.usefulLifeYears ?? null,
      salvageValue: body.salvageValue ?? null,
      status: body.status ?? 'active',
      notes: body.notes ?? null,
      inferredFields: body.inferredFields ?? [],
    },
    include: { documents: true },
  })

  return NextResponse.json({ data: asset }, { status: 201 })
}
