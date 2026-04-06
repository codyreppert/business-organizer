import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import ExpenseForm from '@/components/ExpenseForm'

interface Props {
  params: { id: string }
}

export default async function EditExpensePage({ params }: Props) {
  const expense = await db.standaloneExpense.findUnique({ where: { id: params.id } })
  if (!expense) notFound()

  const expenseForForm = {
    ...expense,
    amount: Number(expense.amount),
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Expense</h1>
      <ExpenseForm expense={expenseForForm as any} />
    </div>
  )
}
