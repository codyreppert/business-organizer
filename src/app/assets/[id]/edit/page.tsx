import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import AssetForm from '@/components/AssetForm'

interface Props {
  params: { id: string }
}

export default async function EditAssetPage({ params }: Props) {
  const asset = await db.businessAsset.findUnique({ where: { id: params.id } })
  if (!asset) notFound()

  // Coerce Decimal → number for the form
  const assetForForm = {
    ...asset,
    purchasePrice: asset.purchasePrice ? Number(asset.purchasePrice) : null,
    salvageValue: asset.salvageValue ? Number(asset.salvageValue) : null,
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Asset</h1>
      <AssetForm asset={assetForForm as any} />
    </div>
  )
}
