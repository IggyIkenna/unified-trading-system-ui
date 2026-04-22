"use client";

import * as React from "react";
import Link from "next/link";
import { MessageCircle, X, ChevronLeft, ChevronRight, Bot, ExternalLink, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { HELP_TREE, type HelpNode } from "@/lib/help/help-tree";
import { searchHelp } from "@/lib/help/help-search";
import { WidgetScroll } from "@/components/shared/widget-scroll";

interface ChatMessage {
  id: string;
  role: "bot" | "user";
  content: string;
  link?: { href: string; label: string };
  options?: HelpNode[];
}

const GREETING: ChatMessage = {
  id: "greeting",
  role: "bot",
  content:
    "Hi! I'm the Odum Research assistant. I can help you navigate the platform, set up widgets, find your P&L, and more. What would you like to know?",
  options: HELP_TREE,
};

interface ChatWidgetTreeProps {
  accentColor?: "emerald" | "amber" | "blue";
}

const ACCENT = {
  emerald: {
    button: "bg-emerald-600 hover:bg-emerald-500",
    userBubble: "bg-emerald-600/20 text-emerald-200",
    optionHover: "hover:border-emerald-500/40",
    chevron: "group-hover:text-emerald-500",
    icon: "text-emerald-500",
  },
  amber: {
    button: "bg-amber-600 hover:bg-amber-500",
    userBubble: "bg-amber-600/20 text-amber-200",
    optionHover: "hover:border-amber-500/40",
    chevron: "group-hover:text-amber-500",
    icon: "text-amber-500",
  },
  blue: {
    button: "bg-blue-600 hover:bg-blue-500",
    userBubble: "bg-blue-600/20 text-blue-200",
    optionHover: "hover:border-blue-500/40",
    chevron: "group-hover:text-blue-500",
    icon: "text-blue-500",
  },
};

export function ChatWidgetTree({ accentColor = "emerald" }: ChatWidgetTreeProps) {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([GREETING]);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const colors = ACCENT[accentColor];

  React.useEffect(() => {
    // Defer scroll to after DOM paint so new content is measured
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }
    });
  }, [messages]);

  // Cmd+Shift+/ shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSelect(node: HelpNode) {
    const userMsg: ChatMessage = {
      id: `user-${node.id}`,
      role: "user",
      content: node.question,
    };
    const botMsg: ChatMessage = {
      id: `bot-${node.id}`,
      role: "bot",
      content: node.answer,
      link: node.link,
      options: node.children,
    };
    setMessages((prev) => [...prev, userMsg, botMsg]);
  }

  const [input, setInput] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  function handleReset() {
    setMessages([GREETING]);
    setInput("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = input.trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `search-user-${Date.now()}`,
      role: "user",
      content: query,
    };

    const matches = searchHelp(query, 5);

    const botMsg: ChatMessage =
      matches.length > 0
        ? {
            id: `search-bot-${Date.now()}`,
            role: "bot",
            content: `I found ${matches.length} topic${matches.length > 1 ? "s" : ""} that might help:`,
            options: matches,
          }
        : {
            id: `search-bot-${Date.now()}`,
            role: "bot",
            content: "I couldn't find a match for that. Try browsing the topics below, or rephrase your question.",
            options: HELP_TREE,
          };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center justify-center",
          "size-12 rounded-full shadow-lg transition-all text-white",
          colors.button,
          open && "scale-0 opacity-0",
        )}
        aria-label="Open help"
      >
        <MessageCircle className="size-5" />
      </button>

      {/* Chat panel */}
      <div
        className={cn(
          "fixed top-4 bottom-4 right-4 z-50 flex flex-col",
          "w-[380px] rounded-xl border border-border/60 overflow-hidden",
          "bg-background shadow-2xl transition-all duration-200 origin-bottom-right",
          open ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Bot className={cn("size-4", colors.icon)} />
            <span className="text-sm font-medium">Help Assistant</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleReset}
              className="p-1 rounded hover:bg-muted text-muted-foreground text-xs"
              title="Start over"
            >
              <ChevronLeft className="size-3.5 inline" />
              Start over
            </button>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted text-muted-foreground">
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <WidgetScroll
          viewportRef={scrollRef}
          className="flex-1 min-h-0"
          viewportClassName="overscroll-contain p-4 space-y-3"
        >
          {messages.map((msg) => (
            <div key={msg.id}>
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-relaxed",
                  msg.role === "bot" ? "bg-muted/60 text-foreground mr-auto" : cn(colors.userBubble, "ml-auto"),
                )}
              >
                <MarkdownLite text={msg.content} />
                {msg.link && (
                  <Link
                    href={msg.link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "mt-2 flex items-center gap-1.5 text-[11px] font-medium transition-colors",
                      colors.icon,
                      "hover:underline",
                    )}
                  >
                    <ExternalLink className="size-3 flex-shrink-0" />
                    {msg.link.label}
                  </Link>
                )}
              </div>

              {msg.options && msg.options.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {msg.options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleSelect(opt)}
                      className={cn(
                        "flex items-center gap-2 w-full text-left text-[12px] px-3 py-2 rounded-md",
                        "border border-border/40 hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors group",
                        colors.optionHover,
                      )}
                    >
                      <span className="flex-1">{opt.question}</span>
                      <ChevronRight
                        className={cn(
                          "size-3 text-muted-foreground/40 transition-colors flex-shrink-0",
                          colors.chevron,
                        )}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </WidgetScroll>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 px-3 py-2 border-t border-border/40 flex-shrink-0"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              input.trim() ? cn(colors.button, "text-white") : "text-muted-foreground/30",
            )}
          >
            <Send className="size-3.5" />
          </button>
        </form>
      </div>
    </>
  );
}

function MarkdownLite({ text }: { text: string }) {
  // Split by newlines first, then handle bold within each line
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, li) => (
        <React.Fragment key={li}>
          {li > 0 && <br />}
          {line.split(/(\*\*[^*]+\*\*)/g).map((part, pi) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <span key={pi} className="font-semibold text-foreground">
                  {part.slice(2, -2)}
                </span>
              );
            }
            return <React.Fragment key={pi}>{part}</React.Fragment>;
          })}
        </React.Fragment>
      ))}
    </>
  );
}
