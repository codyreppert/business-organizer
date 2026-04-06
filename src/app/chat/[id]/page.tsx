import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import ConversationList from '@/components/chat/ConversationList'
import ChatInterface from '@/components/chat/ChatInterface'

export default async function ChatPage({ params }: { params: { id: string } }) {
  const [conversation, allConversations] = await Promise.all([
    db.conversation.findUnique({
      where: { id: params.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    }),
    db.conversation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { role: true, content: true } },
      },
    }),
  ])

  if (!conversation) notFound()

  return (
    <div className="flex h-[calc(100vh-3.5rem-4rem)] -mx-4 sm:-mx-6 lg:-mx-8 -my-8">
      <aside className="hidden sm:flex flex-col w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shrink-0">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Conversations</h2>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <ConversationList conversations={allConversations as any} />
      </aside>

      <div className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-950">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <ChatInterface conversationId={params.id} initialMessages={conversation.messages as any} />
      </div>
    </div>
  )
}
