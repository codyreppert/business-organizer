import { formatDate, isWarrantyActive } from '@/lib/utils/date'
import { formatPrice } from '@/lib/utils/price'
import { formatDepreciationMethod, calcCurrentBookValue } from '@/lib/utils/depreciation'
import InferredBadge from './InferredBadge'

interface AssetCardProps {
  asset: {
    id: string
    name: string
    category: string
    subcategory?: string | null
    brand?: string | null
    model?: string | null
    status: string
    purchasePrice?: number | string | null
    purchaseDate?: Date | string | null
    warrantyEnd?: Date | string | null
    depreciationMethod?: string | null
    usefulLifeYears?: number | null
    salvageValue?: number | string | null
    inferredFields: string[]
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  equipment: 'Equipment',
  technology: 'Technology',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  retired: 'bg-gray-100 text-gray-600',
  disposed: 'bg-red-100 text-red-700',
}

export default function AssetCard({ asset }: AssetCardProps) {
  const warrantyActive = isWarrantyActive(asset.warrantyEnd)
  const price = asset.purchasePrice != null ? formatPrice(Number(asset.purchasePrice)) : null

  const bookValue = calcCurrentBookValue(
    asset.purchasePrice != null ? Number(asset.purchasePrice) : null,
    asset.salvageValue != null ? Number(asset.salvageValue) : null,
    asset.usefulLifeYears ?? null,
    asset.depreciationMethod ?? null,
    asset.purchaseDate ?? null,
  )

  return (
    <article className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow p-4 h-full flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {asset.name}
            {asset.inferredFields.length > 0 && (
              <InferredBadge label="Contains unconfirmed AI-inferred data" />
            )}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {CATEGORY_LABELS[asset.category] ?? asset.category}
            {asset.subcategory && ` · ${asset.subcategory}`}
          </p>
        </div>
        <span
          className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
            STATUS_COLORS[asset.status] ?? 'bg-gray-100 text-gray-600'
          }`}
        >
          {asset.status}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm flex-1">
        {asset.brand && (
          <>
            <dt className="text-gray-500 dark:text-gray-400">Brand</dt>
            <dd className="text-gray-900 dark:text-gray-100 truncate">
              {asset.brand}{asset.model ? ` ${asset.model}` : ''}
            </dd>
          </>
        )}
        {price && (
          <>
            <dt className="text-gray-500 dark:text-gray-400">Purchase</dt>
            <dd className="text-gray-900 dark:text-gray-100">{price}</dd>
          </>
        )}
        {bookValue != null && (
          <>
            <dt className="text-gray-500 dark:text-gray-400">Book value</dt>
            <dd className="text-gray-900 dark:text-gray-100">{formatPrice(bookValue)}</dd>
          </>
        )}
        {asset.depreciationMethod && (
          <>
            <dt className="text-gray-500 dark:text-gray-400">Depreciation</dt>
            <dd className="text-gray-900 dark:text-gray-100">{formatDepreciationMethod(asset.depreciationMethod)}</dd>
          </>
        )}
      </dl>

      {asset.warrantyEnd && (
        <div
          className={`text-xs rounded-md px-2 py-1 ${
            warrantyActive
              ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
          }`}
        >
          {warrantyActive
            ? `Warranty active until ${formatDate(asset.warrantyEnd)}`
            : 'Warranty expired'}
        </div>
      )}
    </article>
  )
}
