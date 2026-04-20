import { isMockDataMode } from "@/lib/runtime/data-mode";

export type StrategyCatalogSourceMode = "mock" | "api";

/**
 * Explicit `NEXT_PUBLIC_STRATEGY_CATALOG_SOURCE` wins when set to `mock` or `api`.
 * Otherwise: mock when `NEXT_PUBLIC_MOCK_API=true`, else API.
 */
export function getStrategyCatalogSource(): StrategyCatalogSourceMode {
  const explicit = process.env.NEXT_PUBLIC_STRATEGY_CATALOG_SOURCE;
  if (explicit === "mock" || explicit === "api") {
    return explicit;
  }
  return isMockDataMode() ? "mock" : "api";
}
