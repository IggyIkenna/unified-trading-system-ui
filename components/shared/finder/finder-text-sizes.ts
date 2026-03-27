/**
 * Finder UI type scale — ~20% larger than the original 9–14px usage.
 * Use these in shared finder components and *-finder-config column renderers.
 */
export const finderText = {
  /** Column headers, detail chrome, counts (was ~10px) */
  meta: "text-[12px]",
  /** Tiny badges / micro copy (was ~9px) */
  micro: "text-[10.8px]",
  /** List labels, breadcrumb, context strip, search field (was text-xs / 12px) */
  body: "text-[14.4px]",
  /** Row hit target text (was text-sm / 14px) */
  row: "text-[16.8px]",
  /** Empty-state title (was text-sm) */
  title: "text-[16.8px]",
  /** Empty-state subtitle (was text-xs) */
  sub: "text-[14.4px]",
} as const;
