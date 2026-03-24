"use client";

import { ChatWidget } from "./chat-widget";

/**
 * Public-tier chat widget — no auth context needed.
 * Used in the public layout (Server Component) via client boundary.
 */
export function ChatWidgetPublic() {
  return <ChatWidget tier="public" />;
}
