/**
 * Re-export MockModeBanner from ui-kit with MOCK_MODE guard.
 */
import { MockModeBanner as UiKitBanner } from "@unified-trading/ui-kit";
import { MOCK_MODE } from "../lib/mock-api";

export function MockModeBanner() {
  if (!MOCK_MODE) return null;
  return <UiKitBanner />;
}
