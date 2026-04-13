"use client";

import * as React from "react";
import { Calendar, Radio, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContextState } from "./types";

interface ContextBarModeControlsProps {
  context: ContextState;
  onContextChange: (context: ContextState) => void;
}

export function ContextBarModeControls({ context, onContextChange }: ContextBarModeControlsProps) {
  return (
    <>
      <div className="flex items-center border border-border rounded-md overflow-hidden mr-3">
        <button
          type="button"
          onClick={() =>
            onContextChange({
              ...context,
              mode: "live",
              asOfDatetime: undefined,
            })
          }
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 text-xs transition-colors",
            context.mode === "live"
              ? "bg-[var(--status-live)]/10 text-[var(--status-live)] font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary",
          )}
        >
          <Radio className="size-3" />
          Live
        </button>
        <div className="w-px h-4 bg-border" />
        <button
          type="button"
          onClick={() =>
            onContextChange({
              ...context,
              mode: "batch",
              asOfDatetime: new Date().toISOString().slice(0, 16),
            })
          }
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 text-xs transition-colors",
            context.mode === "batch"
              ? "bg-[var(--surface-markets)]/10 text-[var(--surface-markets)] font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary",
          )}
        >
          <Calendar className="size-3" />
          As-Of
        </button>
      </div>

      {context.mode === "batch" &&
        (() => {
          const selectedDateTime = context.asOfDatetime ? new Date(context.asOfDatetime) : new Date();
          const now = new Date();
          const yesterday8am = new Date(now);
          yesterday8am.setDate(yesterday8am.getDate() - 1);
          yesterday8am.setHours(8, 0, 0, 0);

          const isDateTooRecent = selectedDateTime > yesterday8am;
          const isTodayBefore8am = now.getHours() < 8;
          const showWarning = isDateTooRecent || isTodayBefore8am;

          return (
            <div className="flex items-center gap-2 mr-3">
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 border rounded-md",
                  showWarning ? "border-[var(--status-warning)] bg-[var(--status-warning)]/5" : "border-border",
                )}
              >
                <Calendar
                  className={cn("size-3", showWarning ? "text-[var(--status-warning)]" : "text-muted-foreground")}
                />
                <input
                  type="datetime-local"
                  value={context.asOfDatetime || new Date().toISOString().slice(0, 16)}
                  onChange={(e) =>
                    onContextChange({
                      ...context,
                      asOfDatetime: e.target.value,
                    })
                  }
                  className="bg-transparent text-xs border-none focus:outline-none w-36"
                />
              </div>

              {showWarning && (
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/30">
                  <AlertTriangle className="size-3 text-[var(--status-warning)]" />
                  <span className="text-[10px] text-[var(--status-warning)]">Batch available T+1 after 8am</span>
                </div>
              )}

              <div className="flex items-center gap-1">
                {[
                  { label: "Yest EOD", offset: "yesterday" as const },
                  { label: "2d ago", offset: "2days" as const },
                  { label: "1w ago", offset: "1week" as const },
                ].map(({ label, offset }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      let dt: Date = new Date();
                      if (offset === "yesterday") {
                        dt.setDate(dt.getDate() - 1);
                        dt.setHours(23, 59, 0, 0);
                      } else if (offset === "2days") {
                        dt.setDate(dt.getDate() - 2);
                        dt.setHours(23, 59, 0, 0);
                      } else if (offset === "1week") {
                        dt.setDate(dt.getDate() - 7);
                        dt.setHours(23, 59, 0, 0);
                      }
                      onContextChange({
                        ...context,
                        asOfDatetime: dt.toISOString().slice(0, 16),
                      });
                    }}
                    className="px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary rounded"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
    </>
  );
}
