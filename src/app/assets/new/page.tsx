import AssetForm from '@/components/AssetForm'

export default function NewAssetPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Add Asset</h1>
      <AssetForm />
    </div>
  )
}
