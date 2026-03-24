"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/api/use-chat";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Minus,
  X,
  Trash2,
  Maximize2,
  Minimize2,
} from "lucide-react";

type ChatTier = "public" | "client" | "internal";

interface ChatWidgetProps {
  tier?: ChatTier;
}

const TIER_LABELS: Record<ChatTier, string> = {
  public: "General Help",
  client: "Client Support",
  internal: "Internal Assistant",
};

const TIER_COLORS: Record<ChatTier, string> = {
  public: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  client: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  internal: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const TIER_PLACEHOLDERS: Record<ChatTier, string> = {
  public: "Ask about our services, capabilities, or trading concepts...",
  client: "Ask about your portfolio, UI navigation, or features...",
  internal:
    "Ask about backend ops, compliance, architecture, or troubleshooting...",
};

export function ChatWidget({ tier = "public" }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const { messages, isStreaming, sendMessage, clearHistory, error } = useChat();

  // Cmd+? shortcut to toggle
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Floating button when closed
  if (!isOpen) {
    return (
      <div className="fixed bottom-5 right-5 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full shadow-lg size-12 p-0 bg-primary hover:bg-primary/90"
        >
          <MessageCircle className="size-5" />
          <span className="sr-only">Open help chat</span>
        </Button>
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center font-medium">
            {messages.filter((m) => m.role === "assistant").length}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col bg-background border border-border rounded-lg shadow-2xl transition-all duration-200",
        isExpanded
          ? "bottom-3 right-3 w-[560px] h-[680px]"
          : "bottom-5 right-5 w-[380px] h-[520px]",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-4 text-primary" />
          <span className="text-sm font-medium">Help</span>
          <Badge
            variant="outline"
            className={cn("text-[10px] px-1.5 py-0", TIER_COLORS[tier])}
          >
            {TIER_LABELS[tier]}
          </Badge>
        </div>
        <div className="flex items-center gap-0.5">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={clearHistory}
              className="size-7"
              title="Clear chat"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="size-7"
            title={isExpanded ? "Shrink" : "Expand"}
          >
            {isExpanded ? (
              <Minimize2 className="size-3.5" />
            ) : (
              <Maximize2 className="size-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsOpen(false)}
            className="size-7"
            title="Minimise (Cmd+Shift+/)"
          >
            <Minus className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setIsOpen(false);
              clearHistory();
            }}
            className="size-7"
            title="Close"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-3 py-1.5 bg-destructive/10 text-destructive text-xs border-b border-destructive/20">
          {error}
        </div>
      )}

      {/* Messages */}
      <ChatMessages messages={messages} isStreaming={isStreaming} />

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        disabled={isStreaming}
        placeholder={TIER_PLACEHOLDERS[tier]}
      />

      {/* Footer hint */}
      <div className="px-3 py-1 text-[10px] text-muted-foreground/50 text-center border-t border-border/50">
        Powered by Claude &middot; Cmd+Shift+/ to toggle
      </div>
    </div>
  );
}
