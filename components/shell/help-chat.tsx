"use client";

import * as React from "react";
import Link from "next/link";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { CALENDLY_URL } from "@/lib/marketing/calendly";
import { PRODUCT_LABELS } from "@/lib/brand/product-labels";

/**
 * Public floating help chat. Not an LLM — it's a curated decision tree so
 * knowledge stays deterministic. The canonical next-steps map lives in
 * TOPICS below; add / rename entries there rather than inline in the JSX.
 */

type OptionAction = () => void;

interface ChatOption {
  readonly label: string;
  readonly action: OptionAction;
}

interface ChatLink {
  readonly href: string;
  readonly label: string;
  readonly external?: boolean;
}

interface ChatMessage {
  readonly from: "bot" | "user";
  readonly text: string;
  readonly options?: readonly ChatOption[];
  readonly links?: readonly ChatLink[];
}

type ServiceId = "investment-management" | "dart" | "signals" | "regulatory";

const SERVICES: ReadonlyArray<{
  id: ServiceId;
  label: string;
  briefingSlug: string;
  marketingHref: string;
  questionnaireService: "IM" | "DART" | "RegUmbrella";
  oneLiner: string;
}> = [
  {
    id: "investment-management",
    label: PRODUCT_LABELS.investmentManagement,
    briefingSlug: "investment-management",
    marketingHref: "/investment-management",
    questionnaireService: "IM",
    oneLiner: "Odum allocates capital to its own systematic strategies under FCA oversight.",
  },
  {
    id: "dart",
    label: PRODUCT_LABELS.dart,
    briefingSlug: "platform",
    marketingHref: "/platform",
    questionnaireService: "DART",
    oneLiner: "The full research + execution + reporting platform. Two modes: Signals-In and Full Pipeline.",
  },
  {
    id: "signals",
    label: PRODUCT_LABELS.odumSignals,
    briefingSlug: "signals-out",
    marketingHref: "/signals",
    questionnaireService: "DART",
    oneLiner: "Odum-generated signals delivered to your own execution stack.",
  },
  {
    id: "regulatory",
    label: PRODUCT_LABELS.regulatoryUmbrella,
    briefingSlug: "regulatory",
    marketingHref: "/regulatory",
    questionnaireService: "RegUmbrella",
    oneLiner: "FCA permissions extended to firms via AR or advisory structure.",
  },
];

export function HelpChat() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<readonly ChatMessage[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  /** Shared "top menu" prompt. Function declarations below are hoisted so
   *  this can reference them even though they appear later in source. */
  function welcomeMessage(): ChatMessage {
    return {
      from: "bot",
      text: "Hi! I can point you at the right page. What are you after?",
      options: [
        { label: "See Odum's services", action: handleShowServices },
        { label: "Read a briefing", action: handleBriefings },
        { label: "Book a call or demo", action: handleBookCall },
        { label: "How do I sign in?", action: handleSignIn },
        { label: "Briefings access code", action: handleAccessCode },
        { label: "Contact us", action: handleContact },
      ],
    };
  }

  function appendBot(partial: Omit<ChatMessage, "from">): void {
    setMessages((prev) => [...prev, { from: "bot", ...partial }]);
  }

  function appendUser(text: string): void {
    setMessages((prev) => [...prev, { from: "user", text }]);
  }

  function offerFollowUp(): void {
    setTimeout(() => {
      appendBot({
        text: "Anything else?",
        options: [
          { label: "Back to the menu", action: () => setMessages([welcomeMessage()]) },
          { label: "No, thanks", action: () => setOpen(false) },
        ],
      });
    }, 400);
  }

  function handleShowServices(): void {
    appendUser("See Odum's services");
    appendBot({
      text: "Four commercial paths, one operating system. Pick one for a quick next step:",
      options: SERVICES.map((s) => ({
        label: s.label,
        action: () => handlePickService(s.id),
      })),
    });
  }

  function handlePickService(id: ServiceId): void {
    const svc = SERVICES.find((s) => s.id === id);
    if (!svc) return;
    appendUser(svc.label);
    appendBot({
      text: svc.oneLiner,
      links: [
        { href: `/briefings/${svc.briefingSlug}`, label: `Read the ${svc.label} briefing` },
        { href: `/questionnaire?service=${svc.questionnaireService}`, label: "Start the questionnaire" },
        { href: svc.marketingHref, label: `${svc.label} overview` },
        { href: CALENDLY_URL, label: "Book a 45-minute call", external: true },
      ],
    });
    offerFollowUp();
  }

  function handleBriefings(): void {
    appendUser("Read a briefing");
    appendBot({
      text: "Briefings are lightly gated — one access code unlocks all of them. If you don't have one, ask us on a call or via contact.",
      links: [
        { href: "/briefings", label: "Briefings hub" },
        { href: "/contact?service=general", label: "Request an access code" },
      ],
    });
    offerFollowUp();
  }

  function handleBookCall(): void {
    appendUser("Book a call or demo");
    appendBot({
      text: "A 45-minute intro call is the fastest way in. Pick a slot:",
      links: [
        { href: CALENDLY_URL, label: "Book on Calendly", external: true },
        { href: "/contact?service=general&action=demo", label: "Email us instead" },
      ],
    });
    offerFollowUp();
  }

  function handleSignIn(): void {
    appendUser("How do I sign in?");
    appendBot({
      text: "Sign-in is locked to registered clients. Once you're onboarded we'll send credentials; in the meantime, request access or book a call.",
      links: [
        { href: "/signup", label: "Start signup" },
        { href: "/contact?service=general&action=access", label: "Request access" },
        { href: CALENDLY_URL, label: "Book a call", external: true },
      ],
    });
    offerFollowUp();
  }

  function handleAccessCode(): void {
    appendUser("Briefings access code");
    appendBot({
      text: "Access codes are issued to qualified prospects. Tell us who you are and we'll send one — usually within a working day.",
      links: [
        { href: "/contact?service=general&action=access", label: "Request an access code" },
        { href: CALENDLY_URL, label: "Or hop on a quick call", external: true },
      ],
    });
    offerFollowUp();
  }

  function handleContact(): void {
    appendUser("Contact us");
    appendBot({
      text: "info@odum-research.co.uk, or use the contact form:",
      links: [
        { href: "/contact", label: "Contact form" },
        { href: CALENDLY_URL, label: "Book a call instead", external: true },
      ],
    });
    offerFollowUp();
  }

  function startChat(): void {
    setOpen(true);
    if (messages.length === 0) {
      setMessages([welcomeMessage()]);
    }
  }

  function reset(): void {
    setMessages([welcomeMessage()]);
  }

  return (
    <>
      {!open && (
        <button
          onClick={startChat}
          className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
          aria-label="Help"
        >
          <MessageCircle className="size-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex w-80 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border bg-primary/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="size-4 text-primary" />
              <span className="text-sm font-medium">Odum Help</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={reset}
                className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                Start over
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Close help chat"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <WidgetScroll viewportRef={scrollRef} className="max-h-96 flex-1" viewportClassName="space-y-3 px-4 py-3">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.from === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    msg.from === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  <p className="leading-snug">{msg.text}</p>
                  {msg.options && msg.options.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.options.map((opt) => (
                        <button
                          key={opt.label}
                          onClick={opt.action}
                          className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary transition-colors hover:bg-primary/20"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {msg.links && msg.links.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1.5">
                      {msg.links.map((lnk) =>
                        lnk.external === true ? (
                          <a
                            key={lnk.href + lnk.label}
                            href={lnk.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                            onClick={() => setOpen(false)}
                          >
                            {lnk.label} →
                          </a>
                        ) : (
                          <Link
                            key={lnk.href + lnk.label}
                            href={lnk.href}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                            onClick={() => setOpen(false)}
                          >
                            {lnk.label} →
                          </Link>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </WidgetScroll>
        </div>
      )}
    </>
  );
}
