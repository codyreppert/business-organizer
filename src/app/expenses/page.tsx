import Link from 'next/link'
import { db } from '@/lib/db'
import ExpenseCard from '@/components/ExpenseCard'

export const dynamic = 'force-dynamic'
import FilterBar from '@/components/FilterBar'
import { formatPrice } from '@/lib/utils/price'
import { Suspense } from 'react'

const EXPENSE_FILTERS = [
  {
    key: 'category',
    label: 'All Categories',
    options: [
      { value: 'meals', label: 'Meals' },
      { value: 'lodging', label: 'Lodging' },
      { value: 'transport', label: 'Transport' },
      { value: 'supplies', label: 'Supplies' },
      { value: 'software', label: 'Software' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    key: 'reimbursable',
    label: 'All',
    options: [
      { value: 'true', label: 'Reimbursable' },
      { value: 'false', label: 'Non-reimbursable' },
    ],
  },
]

interface Props {
  searchParams: { category?: string; reimbursable?: string }
}

export default async function ExpensesPage({ searchParams }: Props) {
  const expenses = await db.standaloneExpense.findMany({
    where: {
      ...(searchParams.category && { category: searchParams.category }),
      ...(searchParams.reimbursable !== undefined && {
        reimbursable: searchParams.reimbursable === 'true',
      }),
    },
    orderBy: { date: 'desc' },
  })

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expenses</h1>
          {expenses.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {expenses.length} item{expenses.length !== 1 ? 's' : ''} · {formatPrice(total)}
            </p>
          )}
        </div>
        <Link
          href="/expenses/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + Add expense
        </Link>
      </div>

      <Suspense>
        <FilterBar filters={EXPENSE_FILTERS} />
      </Suspense>

      {expenses.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">No expenses found.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenses.map((expense) => (
            <Link key={expense.id} href={`/expenses/${expense.id}`}>
              <ExpenseCard expense={{ ...expense, amount: Number(expense.amount) }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
