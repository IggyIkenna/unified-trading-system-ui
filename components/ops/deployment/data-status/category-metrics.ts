import type { CategoryStatus } from "@/lib/types/deployment";

export function getCompletionColor(percent: number): string {
  if (percent >= 100) return "var(--color-accent-green)";
  if (percent >= 80) return "var(--color-accent-cyan)";
  if (percent >= 50) return "var(--color-accent-amber)";
  return "var(--color-accent-red)";
}

export function getCompletionBadgeClass(percent: number): string {
  if (percent >= 100)
    return "bg-[var(--color-status-success-bg)] text-[var(--color-accent-green)] border-[var(--color-status-success-border-strong)]";
  if (percent >= 80)
    return "bg-[var(--color-status-running-bg)] text-[var(--color-accent-cyan)] border-[var(--color-status-running-border)]";
  if (percent >= 50)
    return "bg-[var(--color-status-warning-bg)] text-[var(--color-accent-amber)] border-[var(--color-status-warning-border)]";
  return "bg-[var(--color-status-error-bg)] text-[var(--color-accent-red)] border-[var(--color-status-error-border-strong)]";
}

export function getCategoryCompletion(catData: CategoryStatus): number {
  let complete = 0;
  let total = 0;
  Object.values(catData.venues).forEach((v) => {
    complete += v.complete;
    total += v.total;
  });
  return total > 0 ? (complete / total) * 100 : 0;
}

export function getMissingCount(catData: CategoryStatus): number {
  let missing = 0;
  Object.values(catData.venues).forEach((v) => {
    missing += v.total - v.complete;
  });
  return missing;
}
