import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { formatDate, isWarrantyActive, daysUntilWarrantyExpires } from '@/lib/utils/date'
import { formatPrice } from '@/lib/utils/price'
import { formatDepreciationMethod, calcCurrentBookValue } from '@/lib/utils/depreciation'
import InferredBadge from '@/components/InferredBadge'
import ConfirmFieldButton from '@/components/ConfirmFieldButton'
import DocumentList from '@/components/DocumentList'
import DeleteButton from '@/components/DeleteButton'

interface Props {
  params: { id: string }
}

export default async function AssetDetailPage({ params }: Props) {
  const asset = await db.businessAsset.findUnique({
    where: { id: params.id },
    include: { documents: { orderBy: { createdAt: 'desc' } } },
  })

  if (!asset) notFound()

  const inferred = new Set(asset.inferredFields)
  const apiPath = `/api/assets/${asset.id}`
  const warrantyActive = isWarrantyActive(asset.warrantyEnd)
  const daysLeft = daysUntilWarrantyExpires(asset.warrantyEnd)

  const bookValue = calcCurrentBookValue(
    asset.purchasePrice ? Number(asset.purchasePrice) : null,
    asset.salvageValue ? Number(asset.salvageValue) : null,
    asset.usefulLifeYears ?? null,
    asset.depreciationMethod ?? null,
    asset.purchaseDate ?? null,
  )

  function Field({ label, field, value }: { label: string; field: string; value: React.ReactNode }) {
    return (
      <div>
        <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</dt>
        <dd className="mt-0.5 text-sm text-gray-900 dark:text-gray-100 flex items-center">
          {value}
          {inferred.has(field) && (
            <>
              <InferredBadge />
              <ConfirmFieldButton apiPath={apiPath} fieldName={field} />
            </>
          )}
        </dd>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            {asset.name}
            {asset.inferredFields.length > 0 && (
              <InferredBadge label="This asset has unconfirmed AI-inferred fields" />
            )}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize mt-1">
            {asset.category}{asset.subcategory && ` · ${asset.subcategory}`} ·{' '}
            <span className={asset.status === 'active' ? 'text-green-700' : 'text-gray-500'}>
              {asset.status}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/assets/${asset.id}/edit`}
            className="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Edit
          </Link>
          <DeleteButton apiPath={`/api/assets/${asset.id}`} redirectTo="/assets" />
        </div>
      </div>

      {/* Warranty alert */}
      {asset.warrantyEnd && (
        <div className={`rounded-lg px-4 py-3 text-sm ${
          warrantyActive
            ? daysLeft != null && daysLeft <= 30
              ? 'bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-900 text-yellow-800 dark:text-yellow-300'
              : 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 text-green-800 dark:text-green-300'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
        }`}>
          {warrantyActive
            ? `Warranty active · expires ${formatDate(asset.warrantyEnd)}${daysLeft != null ? ` (${daysLeft} days)` : ''}`
            : `Warranty expired ${formatDate(asset.warrantyEnd)}`}
        </div>
      )}

      {/* Details */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Details</h2>
        <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Brand" field="brand" value={asset.brand ?? '—'} />
          <Field label="Model" field="model" value={asset.model ?? '—'} />
          <Field label="Serial Number" field="serialNumber" value={asset.serialNumber ?? '—'} />
          <Field label="Purchase Date" field="purchaseDate" value={formatDate(asset.purchaseDate)} />
          <Field label="Purchase Price" field="purchasePrice"
            value={asset.purchasePrice ? formatPrice(Number(asset.purchasePrice)) : '—'} />
          <Field label="Warranty Start" field="warrantyStart" value={formatDate(asset.warrantyStart)} />
          <Field label="Warranty End" field="warrantyEnd" value={formatDate(asset.warrantyEnd)} />
        </dl>
      </section>

      {/* Depreciation */}
      {asset.depreciationMethod && asset.depreciationMethod !== 'none' && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Depreciation</h2>
          <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Method</dt>
              <dd className="mt-0.5 text-sm text-gray-900 dark:text-gray-100">{formatDepreciationMethod(asset.depreciationMethod)}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Useful Life</dt>
              <dd className="mt-0.5 text-sm text-gray-900 dark:text-gray-100">
                {asset.usefulLifeYears ? `${asset.usefulLifeYears} years` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Salvage Value</dt>
              <dd className="mt-0.5 text-sm text-gray-900 dark:text-gray-100">
                {asset.salvageValue ? formatPrice(Number(asset.salvageValue)) : '—'}
              </dd>
            </div>
            {bookValue != null && (
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Current Book Value</dt>
                <dd className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-gray-100">{formatPrice(bookValue)}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

      {/* Notes */}
      {asset.notes && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Notes</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{asset.notes}</p>
        </section>
      )}

      {/* Documents */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Documents</h2>
        <DocumentList uploadPath={`/api/assets/${asset.id}/documents`} documents={asset.documents} />
      </section>
    </div>
  )
}
