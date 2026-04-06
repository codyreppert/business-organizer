'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

interface Conversation {
  id: string
  title: string | null
  updatedAt: string | Date
  messages?: Array<{ role: string; content: string }>
}

interface Props {
  conversations: Conversation[]
}

export default function ConversationList({ conversations }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleNew() {
    const res = await fetch('/api/conversations', { method: 'POST', body: JSON.stringify({}) })
    const data = await res.json()
    router.push(`/chat/${data.data.id}`)
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDeleting(id)
    await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
    router.refresh()
    if (pathname === `/chat/${id}`) router.push('/chat')
    setDeleting(null)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={handleNew}
          className="w-full text-sm bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          + New chat
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {conversations.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6">No conversations yet</p>
        )}
        {conversations.map((c) => {
          const isActive = pathname === `/chat/${c.id}`
          const preview = c.messages?.[0]?.content?.slice(0, 50)
          return (
            <Link
              key={c.id}
              href={`/chat/${c.id}`}
              className={`group flex items-start justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive ? 'bg-indigo-50 text-indigo-700 dark:bg-gray-800 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{c.title ?? 'New conversation'}</p>
                {preview && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{preview}</p>
                )}
              </div>
              <button
                onClick={(e) => handleDelete(c.id, e)}
                disabled={deleting === c.id}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 ml-2 shrink-0 transition-opacity text-xs mt-0.5"
                title="Delete conversation"
              >
                ✕
              </button>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
