"use client"

import * as React from "react"
import { type ExecutionMode, EXECUTION_MODES } from "./strategy-registry"

interface ExecutionModeContextValue {
  mode: ExecutionMode
  setMode: (mode: ExecutionMode) => void
  config: typeof EXECUTION_MODES[ExecutionMode]
  isLive: boolean
  isBatch: boolean
}

const ExecutionModeContext = React.createContext<ExecutionModeContextValue | undefined>(undefined)

export function ExecutionModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = React.useState<ExecutionMode>("live")
  
  const value = React.useMemo(() => ({
    mode,
    setMode,
    config: EXECUTION_MODES[mode],
    isLive: mode === "live",
    isBatch: mode === "batch",
  }), [mode])
  
  return (
    <ExecutionModeContext.Provider value={value}>
      {children}
    </ExecutionModeContext.Provider>
  )
}

export function useExecutionMode() {
  const context = React.useContext(ExecutionModeContext)
  if (!context) {
    throw new Error("useExecutionMode must be used within ExecutionModeProvider")
  }
  return context
}
