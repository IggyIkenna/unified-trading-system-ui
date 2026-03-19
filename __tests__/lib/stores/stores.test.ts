import { useFilterStore } from "@/lib/stores/filter-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useUIPrefsStore } from "@/lib/stores/ui-prefs-store"
import { act } from "@testing-library/react"

// Zustand stores work outside React in tests since they're just JS objects
describe("filter-store", () => {
  beforeEach(() => {
    act(() => useFilterStore.getState().reset())
  })

  it("starts with null values", () => {
    const state = useFilterStore.getState()
    expect(state.category).toBeNull()
    expect(state.venue).toBeNull()
    expect(state.instrument).toBeNull()
  })

  it("setCategory updates and clears downstream", () => {
    act(() => {
      useFilterStore.getState().setVenue("Binance")
      useFilterStore.getState().setInstrument("BTC/USDT")
      useFilterStore.getState().setCategory("CEFI")
    })
    const state = useFilterStore.getState()
    expect(state.category).toBe("CEFI")
    expect(state.venue).toBeNull()
    expect(state.instrument).toBeNull()
  })

  it("setVenue updates and clears instrument", () => {
    act(() => {
      useFilterStore.getState().setInstrument("BTC/USDT")
      useFilterStore.getState().setVenue("Binance")
    })
    const state = useFilterStore.getState()
    expect(state.venue).toBe("Binance")
    expect(state.instrument).toBeNull()
  })

  it("reset clears all state", () => {
    act(() => {
      useFilterStore.getState().setCategory("DEFI")
      useFilterStore.getState().setVenue("Uniswap")
      useFilterStore.getState().reset()
    })
    const state = useFilterStore.getState()
    expect(state.category).toBeNull()
    expect(state.venue).toBeNull()
    expect(state.instrument).toBeNull()
  })
})

describe("auth-store", () => {
  beforeEach(() => {
    act(() => useAuthStore.getState().reset())
  })

  it("starts with null personaId", () => {
    expect(useAuthStore.getState().personaId).toBeNull()
  })

  it("setPersonaId updates state", () => {
    act(() => useAuthStore.getState().setPersonaId("client-full"))
    expect(useAuthStore.getState().personaId).toBe("client-full")
  })

  it("reset clears personaId", () => {
    act(() => {
      useAuthStore.getState().setPersonaId("admin")
      useAuthStore.getState().reset()
    })
    expect(useAuthStore.getState().personaId).toBeNull()
  })
})

describe("ui-prefs-store", () => {
  beforeEach(() => {
    act(() => useUIPrefsStore.getState().reset())
  })

  it("starts with default values", () => {
    const state = useUIPrefsStore.getState()
    expect(state.sidebarCollapsed).toBe(false)
    expect(state.theme).toBe("dark")
    expect(state.showDebugPanel).toBe(false)
  })

  it("toggleSidebar flips state", () => {
    act(() => useUIPrefsStore.getState().toggleSidebar())
    expect(useUIPrefsStore.getState().sidebarCollapsed).toBe(true)
    act(() => useUIPrefsStore.getState().toggleSidebar())
    expect(useUIPrefsStore.getState().sidebarCollapsed).toBe(false)
  })

  it("toggleDebugPanel flips state", () => {
    act(() => useUIPrefsStore.getState().toggleDebugPanel())
    expect(useUIPrefsStore.getState().showDebugPanel).toBe(true)
  })

  it("reset restores defaults", () => {
    act(() => {
      useUIPrefsStore.getState().toggleSidebar()
      useUIPrefsStore.getState().toggleDebugPanel()
      useUIPrefsStore.getState().reset()
    })
    const state = useUIPrefsStore.getState()
    expect(state.sidebarCollapsed).toBe(false)
    expect(state.showDebugPanel).toBe(false)
  })
})
