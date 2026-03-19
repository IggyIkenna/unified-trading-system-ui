/**
 * Re-export Tabs components from @unified-trading/ui-kit.
 * Single source of truth — no local duplicates.
 *
 * ui-kit Tabs supports variant="underline" | "pill" (default: "underline").
 * deployment-ui previously used pill-only; pass variant="pill" to TabsList
 * if the pill style is needed.
 */
export {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@unified-trading/ui-kit";
export type { TabsVariant } from "@unified-trading/ui-kit";
