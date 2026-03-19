"use client"

// Unified Context Bar - shared across Strategy, ML, and Execution platforms
// Displays hierarchy scope, context badges, and identity information

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { 
  Building2, 
  Users, 
  FileCode, 
  Settings2, 
  Calendar, 
  Database,
  ChevronDown,
  Filter,
  X,
} from "lucide-react"

// Hierarchy types
export interface HierarchyScope {
  fund?: string
  client?: string
  strategyTemplate?: string
  configVersion?: string
  runId?: string
}

export interface ContextBadgeData {
  label: string
  value: string
  color?: "default" | "batch" | "live" | "strategy" | "ml" | "execution"
}

interface ContextBarProps {
  // Platform type determines color scheme
  platform: "strategy" | "ml" | "execution"
  // Current hierarchy scope
  scope: HierarchyScope
  onScopeChange?: (scope: HierarchyScope) => void
  // Context (batch vs live)
  context: "BATCH" | "LIVE"
  onContextChange?: (context: "BATCH" | "LIVE") => void
  // Additional badges
  badges?: ContextBadgeData[]
  // Template/Config identity
  templateId?: string
  templateName?: string
  configId?: string
  configVersion?: string
  // Data provenance
  dataSource?: string
  asOfDate?: string
  // Show filter toggle
  showFilters?: boolean
  onFiltersToggle?: () => void
  filtersActive?: boolean
  // Custom actions
  actions?: React.ReactNode
  className?: string
}

const platformColors = {
  strategy: "var(--surface-strategy)",
  ml: "var(--surface-ml)",
  execution: "var(--surface-execution, hsl(200 70% 50%))",
}

// Context badge component
function ContextBadge({ 
  context, 
  platform 
}: { 
  context: "BATCH" | "LIVE"
  platform: "strategy" | "ml" | "execution" 
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono text-xs font-medium",
        context === "LIVE"
          ? "bg-[var(--status-live)]/10 text-[var(--status-live)] border-[var(--status-live)]/30"
          : `bg-[${platformColors[platform]}]/10 border-[${platformColors[platform]}]/30`,
        context === "BATCH" && platform === "strategy" && "text-[var(--surface-strategy)]",
        context === "BATCH" && platform === "ml" && "text-[var(--surface-ml)]",
        context === "BATCH" && platform === "execution" && "text-[hsl(200,70%,50%)]"
      )}
    >
      {context}
    </Badge>
  )
}

// Hierarchy breadcrumb
function HierarchyBreadcrumb({ 
  scope, 
  onScopeChange 
}: { 
  scope: HierarchyScope
  onScopeChange?: (scope: HierarchyScope) => void 
}) {
  const items = [
    { key: "fund", icon: Building2, value: scope.fund },
    { key: "client", icon: Users, value: scope.client },
    { key: "strategyTemplate", icon: FileCode, value: scope.strategyTemplate },
    { key: "configVersion", icon: Settings2, value: scope.configVersion },
  ].filter(item => item.value)

  return (
    <div className="flex items-center gap-1 text-sm">
      {items.map((item, i) => (
        <React.Fragment key={item.key}>
          {i > 0 && <span className="text-muted-foreground/50 mx-1">/</span>}
          <button
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-muted/50 transition-colors"
            onClick={() => {
              // Clear scope below this level
              if (onScopeChange) {
                const newScope: HierarchyScope = {}
                const keys = ["fund", "client", "strategyTemplate", "configVersion", "runId"]
                const idx = keys.indexOf(item.key)
                keys.slice(0, idx + 1).forEach(k => {
                  if (scope[k as keyof HierarchyScope]) {
                    newScope[k as keyof HierarchyScope] = scope[k as keyof HierarchyScope]
                  }
                })
                onScopeChange(newScope)
              }
            }}
          >
            <item.icon className="size-3.5 text-muted-foreground" />
            <span className="font-medium">{item.value}</span>
          </button>
        </React.Fragment>
      ))}
    </div>
  )
}

export function ContextBar({
  platform,
  scope,
  onScopeChange,
  context,
  onContextChange,
  badges = [],
  templateId,
  templateName,
  configId,
  configVersion,
  dataSource,
  asOfDate,
  showFilters = false,
  onFiltersToggle,
  filtersActive = false,
  actions,
  className,
}: ContextBarProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-2 border-b bg-card/50",
        className
      )}
    >
      {/* Left: Hierarchy + Context */}
      <div className="flex items-center gap-4">
        <HierarchyBreadcrumb scope={scope} onScopeChange={onScopeChange} />
        
        <div className="h-4 w-px bg-border" />
        
        <ContextBadge context={context} platform={platform} />
        
        {/* Additional context badges */}
        {badges.map((badge, i) => (
          <Badge
            key={i}
            variant="outline"
            className="text-xs"
          >
            <span className="text-muted-foreground mr-1">{badge.label}:</span>
            {badge.value}
          </Badge>
        ))}
      </div>

      {/* Center: Identity */}
      <div className="flex items-center gap-4 text-xs">
        {templateName && (
          <div className="flex items-center gap-1.5">
            <FileCode className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Template:</span>
            <span className="font-mono font-medium">{templateName}</span>
            {templateId && (
              <span className="text-muted-foreground/70 font-mono">({templateId})</span>
            )}
          </div>
        )}
        
        {configVersion && (
          <div className="flex items-center gap-1.5">
            <Settings2 className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Config:</span>
            <span className="font-mono font-medium">v{configVersion}</span>
          </div>
        )}
        
        {dataSource && (
          <div className="flex items-center gap-1.5">
            <Database className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Source:</span>
            <span className="font-mono">{dataSource}</span>
          </div>
        )}
        
        {asOfDate && (
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">As-of:</span>
            <span className="font-mono">{asOfDate}</span>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {showFilters && (
          <Button
            variant={filtersActive ? "secondary" : "ghost"}
            size="sm"
            onClick={onFiltersToggle}
            className="gap-1.5"
          >
            <Filter className="size-3.5" />
            Filters
            {filtersActive && <X className="size-3" />}
          </Button>
        )}
        
        {onContextChange && (
          <Select value={context} onValueChange={(v) => onContextChange(v as "BATCH" | "LIVE")}>
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BATCH">BATCH</SelectItem>
              <SelectItem value="LIVE">LIVE</SelectItem>
            </SelectContent>
          </Select>
        )}
        
        {actions}
      </div>
    </div>
  )
}
