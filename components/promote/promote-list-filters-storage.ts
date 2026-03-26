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
