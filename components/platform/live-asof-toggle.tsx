"use client"

/**
 * LiveAsOfToggle — compact Live/As-Of mode switch for Row 2 (service tabs).
 * Shown conditionally: only for services where comparing live vs historical is meaningful.
 * Reads/writes from the global scope store.
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { Radio, Calendar, AlertTriangle } from "lucide-react"
import { useGlobalScope } from "@/lib/stores/global-scope-store"

export function LiveAsOfToggle({ className }: { className?: string }) {
  const { scope, setMode, setAsOfDatetime } = useGlobalScope()

  const selectedDateTime = scope.asOfDatetime ? new Date(scope.asOfDatetime) : new Date()
  const now = new Date()
  const yesterday8am = new Date(now)
  yesterday8am.setDate(yesterday8am.getDate() - 1)
  yesterday8am.setHours(8, 0, 0, 0)
  const showWarning = scope.mode === "batch" && selectedDateTime > yesterday8am

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center border border-border rounded-md overflow-hidden">
        <button
          onClick={() => setMode("live")}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 text-xs transition-colors",
            scope.mode === "live"
              ? "bg-emerald-500/10 text-emerald-400 font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          <Radio className="size-3" />
          Live
        </button>
        <div className="w-px h-4 bg-border" />
        <button
          onClick={() => setMode("batch")}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 text-xs transition-colors",
            scope.mode === "batch"
              ? "bg-sky-500/10 text-sky-400 font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          <Calendar className="size-3" />
          As-Of
        </button>
      </div>

      {scope.mode === "batch" && (
        <>
          <div className={cn(
            "hidden sm:flex items-center gap-1.5 px-2 py-1 border rounded-md",
            showWarning ? "border-amber-500 bg-amber-500/5" : "border-border"
          )}>
            <Calendar className={cn("size-3", showWarning ? "text-amber-500" : "text-muted-foreground")} />
            <input
              type="datetime-local"
              value={scope.asOfDatetime || new Date().toISOString().slice(0, 16)}
              onChange={(e) => setAsOfDatetime(e.target.value)}
              className="bg-transparent text-xs border-none focus:outline-none w-36"
            />
          </div>

          {showWarning && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
              <AlertTriangle className="size-3 text-amber-500" />
              <span className="text-[10px] text-amber-500">T+1 after 8am</span>
            </div>
          )}

          <div className="hidden md:flex items-center gap-1">
            {[
              { label: "Yest", offset: -1 },
              { label: "2d", offset: -2 },
              { label: "1w", offset: -7 },
            ].map(({ label, offset }) => (
              <button
                key={label}
                onClick={() => {
                  const dt = new Date()
                  dt.setDate(dt.getDate() + offset)
                  dt.setHours(23, 59, 0, 0)
                  setAsOfDatetime(dt.toISOString().slice(0, 16))
                }}
                className="px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary rounded"
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
