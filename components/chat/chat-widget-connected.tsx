"use client";

import { useAuth } from "@/hooks/use-auth";
import { ChatWidget } from "./chat-widget";

/**
 * Auth-aware chat widget wrapper.
 *
 * Resolves the chat tier from the current auth context:
 *   - No user / unauthenticated → "public"
 *   - External org → "client"
 *   - Internal org → "internal"
 */
export function ChatWidgetConnected() {
  const auth = useAuth();

  let tier: "public" | "client" | "internal" = "public";

  if (auth.user) {
    tier = auth.isInternal() ? "internal" : "client";
  }

  return <ChatWidget tier={tier} />;
}
