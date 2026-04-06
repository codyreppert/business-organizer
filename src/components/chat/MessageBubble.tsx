import ToolResultCard from './ToolResultCard'

interface ToolResult {
  name: string
  result: Record<string, unknown>
}

interface Props {
  role: 'user' | 'assistant'
  content: string
  toolResults?: ToolResult[]
  isStreaming?: boolean
  attachmentName?: string
}

export default function MessageBubble({ role, content, toolResults, isStreaming, attachmentName }: Props) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] space-y-1">
          {attachmentName && (
            <div className="flex justify-end">
              <span className="flex items-center gap-1.5 bg-indigo-500 text-white text-xs px-2.5 py-1 rounded-full">
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                {attachmentName}
              </span>
            </div>
          )}
          {content && (
            <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
              {content}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-1">
        {toolResults?.map((tr, i) => (
          <ToolResultCard key={i} name={tr.name} result={tr.result} />
        ))}
        {content && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {content}
            {isStreaming && (
              <span className="inline-block w-1.5 h-3.5 bg-gray-400 dark:bg-gray-500 rounded-sm ml-0.5 animate-pulse" />
            )}
          </div>
        )}
        {!content && isStreaming && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-2.5">
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
