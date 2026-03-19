import { create } from "zustand";
import type { ResultSummary, FilterOptions } from "../api/types";

interface ResultsState {
  results: ResultSummary[];
  filters: FilterOptions;
  selectedResultId: string | null;

  setResults: (results: ResultSummary[], filters: FilterOptions) => void;
  addResults: (results: ResultSummary[]) => void;
  clearResults: () => void;
  selectResult: (resultId: string | null) => void;
}

const emptyFilters: FilterOptions = {
  categories: [],
  assets: [],
  strategies: [],
  algorithms: [],
  timeframes: [],
  instruction_types: [],
  modes: [],
};

export const useResultsStore = create<ResultsState>((set) => ({
  results: [],
  filters: emptyFilters,
  selectedResultId: null,

  setResults: (results, filters) => set({ results, filters }),

  addResults: (newResults) =>
    set((state) => {
      const existingIds = new Set(state.results.map((r) => r.result_id));
      const uniqueNew = newResults.filter((r) => !existingIds.has(r.result_id));
      return { results: [...state.results, ...uniqueNew] };
    }),

  clearResults: () =>
    set({ results: [], filters: emptyFilters, selectedResultId: null }),

  selectResult: (resultId) => set({ selectedResultId: resultId }),
}));
