import type { Time } from "lightweight-charts";

/**
 * Lightweight Charts asserts that series data is strictly ascending by time.
 * Duplicate UNIX timestamps (e.g. mock trades sharing day+hour, or markers snapped
 * to the same bar) throw at runtime. This normalizes by bumping ties to prev+1 second.
 */
export function bumpDuplicateTimes<T extends { time: Time }>(rows: T[]): T[] {
  if (rows.length === 0) return [];
  const sorted = [...rows].sort(
    (a, b) => (a.time as number) - (b.time as number),
  );
  const out: T[] = [];
  let prev = -Infinity;
  for (const row of sorted) {
    let t = row.time as number;
    if (t <= prev) t = prev + 1;
    prev = t;
    out.push({ ...row, time: t as Time } as T);
  }
  return out;
}
