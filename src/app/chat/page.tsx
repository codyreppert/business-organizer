import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import ConversationList from '@/components/chat/ConversationList'

export const dynamic = 'force-dynamic'

export default async function ChatIndexPage() {
  const conversations = await db.conversation.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { role: true, content: true } },
    },
  })

  if (conversations.length > 0) {
    redirect(`/chat/${conversations[0].id}`)
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem-4rem)]">
      <aside className="hidden sm:flex flex-col w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shrink-0">
        <ConversationList conversations={[]} />
      </aside>

      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 text-gray-400 dark:text-gray-500 px-4">
        <p className="text-5xl">💼</p>
        <div>
          <p className="font-semibold text-gray-700 dark:text-gray-300 text-lg">Start a conversation</p>
          <p className="text-sm mt-1">
            Tell me about a trip, expense, or asset and I'll structure it for your tax records.
          </p>
        </div>
        <NewChatButton />
      </div>
    </div>
  )
}

function NewChatButton() {
  return (
    <form action={async () => {
      'use server'
      const { db } = await import('@/lib/db')
      const conv = await db.conversation.create({ data: {} })
      redirect(`/chat/${conv.id}`)
    }}>
      <button
        type="submit"
        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors text-sm"
      >
        + New chat
      </button>
    </form>
  )
}
