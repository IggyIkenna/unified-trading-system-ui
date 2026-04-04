/** Today at 08:00 local, formatted for datetime-local input. */
export function getTodayAt8am(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}T08:00:00`;
}
