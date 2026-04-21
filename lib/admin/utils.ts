/**
 * Admin utils shim. Provides helpers the migrated admin surface expects that
 * don't live in the main UI's `@/lib/utils` module.
 *
 * `cn` is re-exported from `@/lib/utils` for convenience so migrated pages can
 * pull a single entry point.
 */
export { cn } from "@/lib/utils";

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
