"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/hooks/api/use-chat";
import { Bot, User } from "lucide-react";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isStreaming: boolean;
}

export function ChatMessages({ messages, isStreaming }: ChatMessagesProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="space-y-2">
          <Bot className="mx-auto size-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Ask me anything about the Unified Trading System.
          </p>
          <p className="text-xs text-muted-foreground/70">
            Your access level determines what I can help with.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            "flex gap-2",
            msg.role === "user" ? "justify-end" : "justify-start",
          )}
        >
          {msg.role === "assistant" && (
            <div className="flex-shrink-0 mt-0.5">
              <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="size-3.5 text-primary" />
              </div>
            </div>
          )}
          <div
            className={cn(
              "max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed",
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground",
            )}
          >
            {msg.content ||
              (isStreaming && msg.role === "assistant" ? (
                <span className="inline-flex gap-1">
                  <span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
                  <span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
                  <span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
                </span>
              ) : null)}
            <WhitespacePreserved text={msg.content} />
          </div>
          {msg.role === "user" && (
            <div className="flex-shrink-0 mt-0.5">
              <div className="size-6 rounded-full bg-secondary flex items-center justify-center">
                <User className="size-3.5 text-secondary-foreground" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function WhitespacePreserved({ text }: { text: string }) {
  if (!text) return null;

  // Split on double newlines for paragraphs, preserve single newlines
  const paragraphs = text.split("\n\n");
  return (
    <>
      {paragraphs.map((para, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {i > 0 && <br />}
          {para.split("\n").map((line, j) => (
            <span key={j}>
              {j > 0 && <br />}
              {line}
            </span>
          ))}
        </span>
      ))}
    </>
  );
}
