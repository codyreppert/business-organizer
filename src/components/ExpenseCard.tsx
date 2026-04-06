import { formatDate } from '@/lib/utils/date'
import { formatPrice } from '@/lib/utils/price'
import InferredBadge from './InferredBadge'

const CATEGORY_COLORS: Record<string, string> = {
  meals: 'bg-orange-100 text-orange-800',
  lodging: 'bg-blue-100 text-blue-800',
  transport: 'bg-green-100 text-green-800',
  supplies: 'bg-yellow-100 text-yellow-800',
  software: 'bg-purple-100 text-purple-800',
  other: 'bg-gray-100 text-gray-700',
}

interface ExpenseCardProps {
  expense: {
    id: string
    category: string
    amount: number | string
    date: Date | string
    merchant?: string | null
    description?: string | null
    businessPurpose?: string | null
    reimbursable: boolean
    inferredFields: string[]
  }
}

export default function ExpenseCard({ expense }: ExpenseCardProps) {
  return (
    <article className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {expense.merchant ?? expense.description ?? 'Expense'}
            {expense.inferredFields.length > 0 && (
              <InferredBadge label="Contains unconfirmed AI-inferred data" />
            )}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(expense.date)}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-semibold text-gray-900 dark:text-gray-100">{formatPrice(Number(expense.amount))}</p>
          {expense.reimbursable && (
            <span className="text-xs text-blue-600 font-medium">Reimbursable</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
          CATEGORY_COLORS[expense.category] ?? 'bg-gray-100 text-gray-700'
        }`}>
          {expense.category}
        </span>
        {expense.businessPurpose && (
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{expense.businessPurpose}</span>
        )}
      </div>
    </article>
  )
}
