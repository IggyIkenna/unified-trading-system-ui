import { create } from "zustand";

interface UserFilterState {
  search: string;
  roleFilter: string;
  statusFilter: string;
  setSearch: (search: string) => void;
  setRoleFilter: (role: string) => void;
  setStatusFilter: (status: string) => void;
  resetFilters: () => void;
}

export const useUserFilters = create<UserFilterState>((set) => ({
  search: "",
  roleFilter: "all",
  statusFilter: "all",
  setSearch: (search) => set({ search }),
  setRoleFilter: (roleFilter) => set({ roleFilter }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  resetFilters: () =>
    set({ search: "", roleFilter: "all", statusFilter: "all" }),
}));
