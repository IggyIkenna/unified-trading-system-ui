import { create } from "zustand"

export interface AuthStoreState {
  /** Current persona ID (synced with localStorage via useAuth) */
  personaId: string | null
  setPersonaId: (id: string | null) => void
  reset: () => void
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  personaId: null,
  setPersonaId: (personaId) => set({ personaId }),
  reset: () => set({ personaId: null }),
}))
