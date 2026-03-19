"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"

export interface BreadcrumbItem {
  label: string
  href?: string
  entityType?: "fund" | "client" | "strategy" | "config" | "run"
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[]
  className?: string
}

const entityColors: Record<string, string> = {
  fund: "var(--surface-trading)",
  client: "var(--surface-markets)",
  strategy: "var(--surface-strategy)",
  config: "var(--surface-config)",
  run: "var(--status-live)",
}

export function BreadcrumbNav({ items, className }: BreadcrumbNavProps) {
  return (
    <nav
      className={cn(
        "flex items-center gap-1 px-4 py-2 text-sm",
        className
      )}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const color = item.entityType ? entityColors[item.entityType] : undefined

          return (
            <li key={index} className="flex items-center gap-1">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="font-medium hover:underline transition-all duration-150 ease-out"
                  style={{ color: color || "inherit" }}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    "font-medium",
                    isLast ? "text-foreground" : "text-muted-foreground"
                  )}
                  style={isLast && color ? { color } : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight className="size-4 text-muted-foreground/60" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
