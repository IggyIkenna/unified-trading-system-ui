import { create } from "zustand";

export interface FilterState {
  /** Selected venue asset group (CEFI, TRADFI, DEFI, etc.) */
  assetGroup: string | null;
  /** Selected venue (binance, deribit, etc.) */
  venue: string | null;
  /** Selected instrument key */
  instrument: string | null;
  /** Date range filter */
  dateRange: { start: string; end: string } | null;

  setAssetGroup: (assetGroup: string | null) => void;
  setVenue: (venue: string | null) => void;
  setInstrument: (instrument: string | null) => void;
  setDateRange: (range: { start: string; end: string } | null) => void;
  reset: () => void;
}

const initialState = {
  assetGroup: null,
  venue: null,
  instrument: null,
  dateRange: null,
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,
  setAssetGroup: (assetGroup) => set({ assetGroup, venue: null, instrument: null }),
  setVenue: (venue) => set({ venue, instrument: null }),
  setInstrument: (instrument) => set({ instrument }),
  setDateRange: (dateRange) => set({ dateRange }),
  reset: () => set(initialState),
}));
