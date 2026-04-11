"use client";

import * as React from "react";
import Link from "next/link";
import { MessageCircle, X, Database, Brain, Layers, Shield, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatStep = "welcome" | "service" | "action" | "fallback";

const SERVICES = [
  { id: "data", label: "Data", icon: Database, color: "text-sky-400" },
  { id: "research", label: "Research", icon: Brain, color: "text-violet-400" },
  { id: "platform", label: "Trading", icon: Layers, color: "text-amber-400" },
  { id: "regulatory", label: "Regulatory Umbrella", icon: Shield, color: "text-slate-400" },
  { id: "investment", label: "Manage", icon: Briefcase, color: "text-rose-400" },
];

interface ChatMessage {
  from: "bot" | "user";
  text: string;
  options?: Array<{ label: string; action: () => void }>;
  link?: { href: string; label: string };
}

export function HelpChat() {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<ChatStep>("welcome");
  const [selectedService, setSelectedService] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function reset() {
    setStep("service");
    setSelectedService(null);
    setMessages([
      {
        from: "bot",
        text: "Hi! What service are you interested in?",
        options: SERVICES.map((s) => ({
          label: s.label,
          action: () => pickService(s.id, s.label),
        })),
      },
    ]);
  }

  function startChat() {
    setOpen(true);
    if (messages.length === 0) {
      setMessages([
        {
          from: "bot",
          text: "Hi! What service are you interested in?",
          options: SERVICES.map((s) => ({
            label: s.label,
            action: () => pickService(s.id, s.label),
          })),
        },
      ]);
      setStep("service");
    }
  }

  function pickService(id: string, label: string) {
    setSelectedService(id);
    setMessages((prev) => [
      ...prev,
      { from: "user", text: label },
      {
        from: "bot",
        text: `Great choice. What would you like to do?`,
        options: [
          { label: "Sign up", action: () => pickAction(id, "signup") },
          { label: "Book a demo", action: () => pickAction(id, "demo") },
          { label: "Ask a question", action: () => pickAction(id, "question") },
        ],
      },
    ]);
    setStep("action");
  }

  function pickAction(serviceId: string, action: string) {
    const svc = SERVICES.find((s) => s.id === serviceId);
    const svcLabel = svc?.label || serviceId;

    if (action === "signup") {
      setMessages((prev) => [
        ...prev,
        { from: "user", text: "Sign up" },
        {
          from: "bot",
          text: `Taking you to sign up for ${svcLabel}.`,
          link: { href: `/signup?service=${serviceId}`, label: `Sign up for ${svcLabel}` },
        },
      ]);
    } else if (action === "demo") {
      setMessages((prev) => [
        ...prev,
        { from: "user", text: "Book a demo" },
        {
          from: "bot",
          text: `Let's get a demo booked for ${svcLabel}.`,
          link: { href: `/demo?service=${serviceId}`, label: `Book a demo` },
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        { from: "user", text: "Ask a question" },
        {
          from: "bot",
          text: `For specific questions, it's best to speak with our team directly. They can walk you through ${svcLabel} in detail.`,
          link: { href: `/contact?service=${serviceId}`, label: "Get in touch" },
        },
      ]);
    }

    // After a pause, offer to start over
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "Anything else I can help with?",
          options: [
            { label: "Yes, another service", action: () => restartServicePick() },
            { label: "No, thanks!", action: () => setOpen(false) },
          ],
        },
      ]);
    }, 500);
  }

  function restartServicePick() {
    setMessages((prev) => [
      ...prev,
      { from: "user", text: "Yes, another service" },
      {
        from: "bot",
        text: "Sure! Which service?",
        options: SERVICES.map((s) => ({
          label: s.label,
          action: () => pickService(s.id, s.label),
        })),
      },
    ]);
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={startChat}
          className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
          aria-label="Help"
        >
          <MessageCircle className="size-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-80 rounded-xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
            <div className="flex items-center gap-2">
              <MessageCircle className="size-4 text-primary" />
              <span className="text-sm font-medium">Odum Help</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={reset}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent"
              >
                Start over
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-accent"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-80"
          >
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.from === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "rounded-lg px-3 py-2 max-w-[85%] text-sm",
                  msg.from === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}>
                  <p>{msg.text}</p>
                  {msg.options && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.options.map((opt) => (
                        <button
                          key={opt.label}
                          onClick={opt.action}
                          className="text-xs px-2.5 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {msg.link && (
                    <Link
                      href={msg.link.href}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      onClick={() => setOpen(false)}
                    >
                      {msg.link.label} →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
