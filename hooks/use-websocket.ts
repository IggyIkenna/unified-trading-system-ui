"use client"

import * as React from "react"

export type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error"

interface WebSocketMessage {
  channel?: string
  type?: string
  instrument?: string
  price?: number
  volume?: number
  bid?: number
  ask?: number
  timestamp?: string
  data?: Record<string, unknown>
  [key: string]: unknown
}

interface UseWebSocketOptions {
  url: string
  enabled?: boolean
  onMessage?: (msg: WebSocketMessage) => void
  reconnectInterval?: number
}

export function useWebSocket({ url, enabled = true, onMessage, reconnectInterval = 5000 }: UseWebSocketOptions) {
  const [status, setStatus] = React.useState<WebSocketStatus>("disconnected")
  const wsRef = React.useRef<WebSocket | null>(null)
  const reconnectTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const onMessageRef = React.useRef(onMessage)
  onMessageRef.current = onMessage

  const connect = React.useCallback(() => {
    if (!enabled || wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      setStatus("connecting")
      const ws = new WebSocket(url)

      ws.onopen = () => {
        setStatus("connected")
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as WebSocketMessage
          onMessageRef.current?.(msg)
        } catch {
          // non-JSON message, ignore
        }
      }

      ws.onclose = () => {
        setStatus("disconnected")
        wsRef.current = null
        if (enabled) {
          reconnectTimerRef.current = setTimeout(connect, reconnectInterval)
        }
      }

      ws.onerror = () => {
        setStatus("error")
        ws.close()
      }

      wsRef.current = ws
    } catch {
      setStatus("error")
    }
  }, [url, enabled, reconnectInterval])

  const send = React.useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  const subscribe = React.useCallback((instruments: string[]) => {
    send({ action: "subscribe", instruments })
  }, [send])

  const unsubscribe = React.useCallback((instruments: string[]) => {
    send({ action: "unsubscribe", instruments })
  }, [send])

  React.useEffect(() => {
    if (enabled) {
      connect()
    }
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [enabled, connect])

  return { status, send, subscribe, unsubscribe }
}
