const STORAGE_KEY = "promote-strategy-list-filters:v1";

export type PromoteListFiltersStored = {
  stageFilter: string;
  asset: string;
  archetype: string;
  submitterQ: string;
  submittedFrom: string;
  submittedTo: string;
  listPage: number;
  pageSize: number;
};

const DEFAULT_PAGE_SIZE = 15;

/** `YYYY-MM-DD` in the user's local calendar (avoids UTC day skew from `toISOString`). */
function formatLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Default submitted-at window: last 7 days through today (local). */
export function getDefaultSubmittedDateRange(): {
  submittedFrom: string;
  submittedTo: string;
} {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 7);
  return {
    submittedFrom: formatLocalYmd(from),
    submittedTo: formatLocalYmd(to),
  };
}

export function readPromoteListFiltersFromStorage(): Partial<PromoteListFiltersStored> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Partial<PromoteListFiltersStored>;
  } catch {
    return {};
  }
}

export function writePromoteListFiltersToStorage(
  state: PromoteListFiltersStored,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

export { DEFAULT_PAGE_SIZE };
