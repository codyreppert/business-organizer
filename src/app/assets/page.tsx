import Link from 'next/link'
import { db } from '@/lib/db'
import AssetCard from '@/components/AssetCard'

export const dynamic = 'force-dynamic'
import FilterBar from '@/components/FilterBar'
import { Suspense } from 'react'

const ASSET_FILTERS = [
  {
    key: 'category',
    label: 'All Categories',
    options: [
      { value: 'equipment', label: 'Equipment' },
      { value: 'technology', label: 'Technology' },
    ],
  },
  {
    key: 'status',
    label: 'All Statuses',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'retired', label: 'Retired' },
      { value: 'disposed', label: 'Disposed' },
    ],
  },
]

interface Props {
  searchParams: { category?: string; status?: string }
}

export default async function AssetsPage({ searchParams }: Props) {
  const assets = await db.businessAsset.findMany({
    where: {
      ...(searchParams.category && { category: searchParams.category }),
      ...(searchParams.status && { status: searchParams.status }),
    },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assets</h1>
        <Link
          href="/assets/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + Add asset
        </Link>
      </div>

      <Suspense>
        <FilterBar filters={ASSET_FILTERS} />
      </Suspense>

      {assets.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">No assets found.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <Link key={asset.id} href={`/assets/${asset.id}`}>
              <AssetCard asset={{
                ...asset,
                purchasePrice: asset.purchasePrice ? Number(asset.purchasePrice) : null,
                salvageValue: asset.salvageValue ? Number(asset.salvageValue) : null,
              }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
