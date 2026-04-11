/**
 * Append `mode` (and optionally `as_of` for batch) query params to an API URL.
 *
 * Used by all read-only API hooks so the backend sees the global scope mode.
 */
export function withMode(
  base: string,
  mode: string,
  asOfDatetime?: string,
): string {
  const sep = base.includes("?") ? "&" : "?";
  let url = `${base}${sep}mode=${mode}`;
  if (mode === "batch" && asOfDatetime) {
    url += `&as_of=${encodeURIComponent(asOfDatetime)}`;
  }
  return url;
}
