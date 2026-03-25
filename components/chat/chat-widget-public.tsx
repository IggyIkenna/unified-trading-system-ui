"use client";

import { HelpChat } from "@/components/shell/help-chat";

/**
 * Public-tier chat widget — guided navigation chatbot.
 * No AI, no API calls — just clickable decision tree.
 */
export function ChatWidgetPublic() {
  return <HelpChat />;
}
