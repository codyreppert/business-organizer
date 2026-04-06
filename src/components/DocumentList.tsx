'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils/date'
import { DocumentType } from '@/types'

interface DocumentRow {
  id: string
  name: string
  type: string
  filePath: string
  fileSizeBytes?: number | null
  mimeType?: string | null
  createdAt: Date
  inferredFields: string[]
}

const DOCUMENT_TYPES: DocumentType[] = ['receipt', 'invoice', 'contract', 'warranty', 'other']

interface Props {
  /** Upload endpoint, e.g. /api/assets/[id]/documents */
  uploadPath: string
  documents: DocumentRow[]
}

export default function DocumentList({ uploadPath, documents }: Props) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState<DocumentType>('receipt')
  const [file, setFile] = useState<File | null>(null)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !name) {
      setUploadError('Please provide a name and select a file.')
      return
    }
    setUploading(true)
    setUploadError(null)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('name', name)
    fd.append('type', type)

    const res = await fetch(uploadPath, { method: 'POST', body: fd })
    if (!res.ok) {
      const data = await res.json()
      setUploadError(data.error ?? 'Upload failed')
    } else {
      setName('')
      setType('receipt')
      setFile(null)
      ;(e.target as HTMLFormElement).reset()
      router.refresh()
    }
    setUploading(false)
  }

  async function handleDelete(docId: string) {
    if (!confirm('Delete this document?')) return
    await fetch(`/api/documents/${docId}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {documents.length === 0 ? (
        <p className="text-sm text-gray-500">No documents attached.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {documents.map((doc) => (
            <li key={doc.id} className="py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <a
                    href={doc.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-indigo-600 hover:underline truncate block"
                  >
                    {doc.name}
                  </a>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {doc.type} · {formatDate(doc.createdAt)}
                    {doc.fileSizeBytes ? ` · ${(doc.fileSizeBytes / 1024).toFixed(0)} KB` : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-xs text-red-500 hover:text-red-700 shrink-0"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={handleUpload}
        className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 space-y-3"
      >
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload document</p>
        {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hotel Receipt"
              className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DocumentType)}
              className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t} className="capitalize">{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">File</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-gray-600 dark:text-gray-400 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </form>
    </div>
  )
}
