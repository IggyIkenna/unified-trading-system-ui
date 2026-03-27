"use client";

import { useAuth } from "@/hooks/use-auth";
import { ChatWidgetTree } from "./chat-widget-tree";

/**
 * Auth-aware chat widget wrapper.
 *
 * Currently uses the decision-tree chatbot (no backend needed).
 * When the agentic backend is wired, swap to ChatWidget with tier prop.
 *
 * Tier → accent color:
 *   - No user / unauthenticated → blue (should not appear — public layout has its own)
 *   - External org → emerald (green)
 *   - Internal org → amber (gold)
 */
export function ChatWidgetConnected() {
  const auth = useAuth();

  let accent: "blue" | "emerald" | "amber" = "blue";

  if (auth.user) {
    accent = auth.isInternal() ? "amber" : "emerald";
  }

  return <ChatWidgetTree accentColor={accent} />;
}
