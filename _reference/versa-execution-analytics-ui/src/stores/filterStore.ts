import { create } from "zustand";

interface FilterState {
  category: string;
  asset: string;
  strategy: string;
  mode: string;
  timeframe: string;
  instructionType: string;
  algorithm: string;
  dateStart: string;
  dateEnd: string;

  setCategory: (value: string) => void;
  setAsset: (value: string) => void;
  setStrategy: (value: string) => void;
  setMode: (value: string) => void;
  setTimeframe: (value: string) => void;
  setInstructionType: (value: string) => void;
  setAlgorithm: (value: string) => void;
  setDateStart: (value: string) => void;
  setDateEnd: (value: string) => void;
  resetFilters: () => void;
}

const initialState = {
  category: "All",
  asset: "All",
  strategy: "All",
  mode: "All",
  timeframe: "All",
  instructionType: "All",
  algorithm: "All",
  dateStart: "",
  dateEnd: "",
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,

  setCategory: (value) => set({ category: value }),
  setAsset: (value) => set({ asset: value }),
  setStrategy: (value) => set({ strategy: value }),
  setMode: (value) => set({ mode: value }),
  setTimeframe: (value) => set({ timeframe: value }),
  setInstructionType: (value) => set({ instructionType: value }),
  setAlgorithm: (value) => set({ algorithm: value }),
  setDateStart: (value) => set({ dateStart: value }),
  setDateEnd: (value) => set({ dateEnd: value }),
  resetFilters: () => set(initialState),
}));
