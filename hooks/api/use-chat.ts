"use client"

import { useCallback, useRef, useState } from "react"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface UseChatOptions {
  apiBase?: string
}

interface UseChatReturn {
  messages: ChatMessage[]
  isStreaming: boolean
  sendMessage: (text: string) => Promise<void>
  clearHistory: () => void
  error: string | null
}

let _msgId = 0
function nextId(): string {
  _msgId += 1
  return `msg-${_msgId}-${Date.now()}`
}

export function useChat(options?: UseChatOptions): UseChatReturn {
  const apiBase = options?.apiBase ?? "/api/chat"
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return

      setError(null)

      // Add user message
      const userMsg: ChatMessage = {
        id: nextId(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      }

      const assistantId = nextId()
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setIsStreaming(true)

      // Build history from previous messages (exclude the new ones)
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      try {
        abortRef.current = new AbortController()

        const res = await fetch(`${apiBase}/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text.trim(), history }),
          signal: abortRef.current.signal,
        })

        if (!res.ok) {
          const errText = await res.text()
          throw new Error(`Chat API error: ${res.status} — ${errText}`)
        }

        const reader = res.body?.getReader()
        if (!reader) throw new Error("No response body")

        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Parse SSE events from buffer
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue

            const jsonStr = line.slice(6).trim()
            if (!jsonStr) continue

            try {
              const event = JSON.parse(jsonStr) as {
                type: string
                text?: string
              }

              if (event.type === "content" && event.text) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + event.text }
                      : m,
                  ),
                )
              }
            } catch {
              // Skip malformed SSE events
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return

        const message =
          err instanceof Error ? err.message : "Failed to send message"
        setError(message)

        // Remove the empty assistant message on error
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [apiBase, isStreaming, messages],
  )

  const clearHistory = useCallback(() => {
    if (abortRef.current) abortRef.current.abort()
    setMessages([])
    setError(null)
    setIsStreaming(false)
  }, [])

  return { messages, isStreaming, sendMessage, clearHistory, error }
}
