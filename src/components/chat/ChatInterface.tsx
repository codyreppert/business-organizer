'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MessageBubble from './MessageBubble'

interface StoredMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: Array<{ name: string; input: Record<string, unknown> }> | null
  toolResults?: Array<{ name: string; result: Record<string, unknown> }> | null
}

interface ToolResult {
  name: string
  result: Record<string, unknown>
}

interface LiveMessage {
  role: 'user' | 'assistant'
  content: string
  toolResults?: ToolResult[]
  isStreaming?: boolean
  attachmentName?: string
}

interface Props {
  conversationId: string
  initialMessages: StoredMessage[]
}

const EXAMPLES = [
  'I drove 180 miles to visit Acme Corp in Chicago last Tuesday',
  'Just bought a MacBook Pro for $2,499 — it\'s for development work',
  'Had dinner with a client at Nobu last night, spent $340',
  'What\'s my total deductions for this year?',
  'Add a Zoom subscription, $20/month, it\'s a business tool',
]

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/gif,image/webp,application/pdf'

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the "data:<mime>;base64," prefix
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ChatInterface({ conversationId, initialMessages }: Props) {
  const router = useRouter()
  const [messages, setMessages] = useState<LiveMessage[]>(
    initialMessages.map((m) => ({
      role: m.role,
      content: m.content,
      toolResults: (m.toolResults as ToolResult[] | null) ?? undefined,
    }))
  )
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setAttachedFile(file)
    // Reset so the same file can be re-attached if removed and re-selected
    e.target.value = ''
  }

  async function send(content: string) {
    if ((!content.trim() && !attachedFile) || sending) return
    setSending(true)

    const file = attachedFile
    setAttachedFile(null)

    const displayContent = content.trim() || (file ? `[Receipt: ${file.name}]` : '')
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: displayContent, attachmentName: file?.name },
    ])
    setInput('')
    setMessages((prev) => [...prev, { role: 'assistant', content: '', isStreaming: true }])

    const accToolResults: ToolResult[] = []
    let accText = ''

    try {
      let body: string
      if (file) {
        const base64 = await fileToBase64(file)
        body = JSON.stringify({
          content: content.trim(),
          attachment: { base64, mediaType: file.type, filename: file.name },
        })
      } else {
        body = JSON.stringify({ content })
      }

      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error ?? `Server error ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))

            if (event.type === 'text_delta') {
              accText += event.content
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: accText,
                  toolResults: accToolResults.length > 0 ? [...accToolResults] : undefined,
                  isStreaming: true,
                }
                return updated
              })
            } else if (event.type === 'tool_result') {
              accToolResults.push({ name: event.name, result: event.result })
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: accText,
                  toolResults: [...accToolResults],
                  isStreaming: true,
                }
                return updated
              })
            } else if (event.type === 'done') {
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: accText,
                  toolResults: accToolResults.length > 0 ? [...accToolResults] : undefined,
                  isStreaming: false,
                }
                return updated
              })
              router.refresh()
            } else if (event.type === 'error') {
              throw new Error(event.message)
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `Sorry, something went wrong: ${msg}`,
          isStreaming: false,
        }
        return updated
      })
    } finally {
      setSending(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    send(input)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && !sending && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 text-gray-400 dark:text-gray-500 px-4">
            <p className="text-4xl">💼</p>
            <div>
              <p className="font-medium text-gray-600 dark:text-gray-300">Tell me what happened</p>
              <p className="text-sm mt-1 text-gray-400 dark:text-gray-500">
                Describe a trip, expense, or asset — or attach a receipt.
              </p>
            </div>
            <div className="text-left space-y-2 max-w-sm w-full">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => send(ex)}
                  className="w-full text-left text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-indigo-300 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            role={msg.role}
            content={msg.content}
            toolResults={msg.toolResults}
            isStreaming={msg.isStreaming}
            attachmentName={msg.attachmentName}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-3 bg-white dark:bg-gray-900">
        {/* Attachment preview */}
        {attachedFile && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-700 max-w-xs truncate">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="truncate">{attachedFile.name}</span>
            </span>
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs"
              aria-label="Remove attachment"
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Attach button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            title="Attach receipt or document"
            className="shrink-0 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-40 transition-colors p-1.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            placeholder={attachedFile ? 'Add a note (optional)…' : 'Describe a trip, expense, or asset…'}
            rows={1}
            className="flex-1 resize-none border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 max-h-32 overflow-y-auto"
            style={{ minHeight: '38px' }}
          />
          <button
            type="submit"
            disabled={sending || (!input.trim() && !attachedFile)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors shrink-0"
          >
            {sending ? '…' : 'Send'}
          </button>
        </form>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 text-center">
          Enter to send · Shift+Enter for new line · Attach receipts with the paperclip
        </p>
      </div>
    </div>
  )
}
