"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SendHorizontal } from "lucide-react"

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = React.useState("")
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const handleSubmit = React.useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue("")
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [value, disabled, onSend])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  // Auto-resize textarea
  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value)
      const el = e.target
      el.style.height = "auto"
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`
    },
    [],
  )

  return (
    <div className="flex items-end gap-2 p-3 border-t border-border">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "Ask a question..."}
        disabled={disabled}
        rows={1}
        className="min-h-[36px] max-h-[120px] resize-none text-sm"
      />
      <Button
        size="icon-sm"
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="flex-shrink-0"
      >
        <SendHorizontal className="size-4" />
      </Button>
    </div>
  )
}
