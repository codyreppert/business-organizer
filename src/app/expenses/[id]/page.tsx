import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils/date'
import { formatPrice } from '@/lib/utils/price'
import InferredBadge from '@/components/InferredBadge'
import ConfirmFieldButton from '@/components/ConfirmFieldButton'
import DocumentList from '@/components/DocumentList'
import DeleteButton from '@/components/DeleteButton'

interface Props {
  params: { id: string }
}

export default async function ExpenseDetailPage({ params }: Props) {
  const expense = await db.standaloneExpense.findUnique({
    where: { id: params.id },
    include: { documents: { orderBy: { createdAt: 'desc' } } },
  })

  if (!expense) notFound()

  const inferred = new Set(expense.inferredFields)
  const apiPath = `/api/expenses/${expense.id}`

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            {expense.merchant ?? expense.description ?? 'Expense'}
            {expense.inferredFields.length > 0 && (
              <InferredBadge label="Has unconfirmed AI-inferred fields" />
            )}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 capitalize">
            {expense.category} · {formatDate(expense.date)}
            {expense.reimbursable && ' · Reimbursable'}
          </p>
        </div>
        <div className="shrink-0 text-right space-y-2">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatPrice(Number(expense.amount))}</p>
          <div className="flex items-center gap-2 justify-end">
            <Link
              href={`/expenses/${expense.id}/edit`}
              className="text-sm text-indigo-600 hover:underline"
            >
              Edit
            </Link>
            <DeleteButton apiPath={`/api/expenses/${expense.id}`} redirectTo="/expenses" />
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Details</h2>
        <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Category" field="category" value={expense.category} />
          <Field label="Date" field="date" value={formatDate(expense.date)} />
          <Field label="Merchant" field="merchant" value={expense.merchant ?? '—'} />
          <Field label="Description" field="description" value={expense.description ?? '—'} />
          <Field label="Business Purpose" field="businessPurpose" value={expense.businessPurpose ?? '—'} />
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Reimbursable</dt>
            <dd className="mt-0.5 text-sm text-gray-900 dark:text-gray-100">{expense.reimbursable ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Documents</h2>
        <DocumentList
          uploadPath={`/api/expenses/${expense.id}/documents`}
          documents={expense.documents}
        />
      </section>
    </div>
  )
}
