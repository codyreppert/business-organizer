import ExpenseForm from '@/components/ExpenseForm'

export default function NewExpensePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Add Expense</h1>
      <ExpenseForm />
    </div>
  )
}
