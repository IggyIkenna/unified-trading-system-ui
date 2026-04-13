"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface UseChatOptions {
  apiBase?: string;
  /** localStorage key — defaults to "unified-chat-history". Pass null to disable persistence. */
  persistKey?: string | null;
  /** Max messages to persist (oldest truncated first). Default 50. */
  maxPersistedMessages?: number;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearHistory: () => void;
  error: string | null;
}

const DEFAULT_PERSIST_KEY = "unified-chat-history";
const DEFAULT_MAX_MESSAGES = 50;

// Serialise/deserialise — Date objects need JSON reviver
function loadFromStorage(key: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{ id: string; role: "user" | "assistant"; content: string; timestamp: string }>;
    return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [];
  }
}

function saveToStorage(key: string, messages: ChatMessage[], max: number): void {
  if (typeof window === "undefined") return;
  try {
    const toSave = messages.slice(-max);
    localStorage.setItem(key, JSON.stringify(toSave));
  } catch {
    // ignore quota errors
  }
}

let _msgId = 0;
function nextId(): string {
  _msgId += 1;
  return `msg-${_msgId}-${Date.now()}`;
}

export function useChat(options?: UseChatOptions): UseChatReturn {
  const apiBase = options?.apiBase ?? "/api/chat";
  const persistKey = options?.persistKey === undefined ? DEFAULT_PERSIST_KEY : options.persistKey;
  const maxMessages = options?.maxPersistedMessages ?? DEFAULT_MAX_MESSAGES;

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    persistKey ? loadFromStorage(persistKey) : [],
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Persist to localStorage whenever messages change
  useEffect(() => {
    if (!persistKey || messages.length === 0) return;
    saveToStorage(persistKey, messages, maxMessages);
  }, [messages, persistKey, maxMessages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      setError(null);

      // Add user message
      const userMsg: ChatMessage = {
        id: nextId(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      const assistantId = nextId();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      // Build history from previous messages (exclude the new ones)
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        abortRef.current = new AbortController();

        const res = await fetch(`${apiBase}/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text.trim(), history }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Chat API error: ${res.status} — ${errText}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events from buffer
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr) as {
                type: string;
                text?: string;
              };

              if (event.type === "content" && event.text) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + event.text }
                      : m,
                  ),
                );
              }
            } catch {
              // Skip malformed SSE events
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;

        const message =
          err instanceof Error ? err.message : "Failed to send message";
        setError(message);

        // Remove the empty assistant message on error
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [apiBase, isStreaming, messages],
  );

  const clearHistory = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setError(null);
    setIsStreaming(false);
    if (persistKey && typeof window !== "undefined") {
      try { localStorage.removeItem(persistKey); } catch { /* ignore */ }
    }
  }, [persistKey]);

  return { messages, isStreaming, sendMessage, clearHistory, error };
}
