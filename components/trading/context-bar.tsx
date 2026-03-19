"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Building2,
  Users,
  BarChart3,
  Coins,
  ChevronDown,
  Check,
  X,
  Trophy,
  TrendingUp,
  Radio,
  Calendar,
  AlertTriangle,
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
// Import centralized trading data
import {
  ORGANIZATIONS as TRADING_ORGS,
  CLIENTS as TRADING_CLIENTS,
  STRATEGIES as TRADING_STRATEGIES,
} from "@/lib/trading-data"

// Types for the hierarchy
export interface Organization {
  id: string
  name: string
  logo?: string
}

export interface Client {
  id: string
  name: string
  orgId: string
  status: "active" | "onboarding" | "inactive"
}

export interface Strategy {
  id: string
  name: string
  clientId: string
  assetClass: string
  strategyType: string
  status: "live" | "paused" | "warning" | "stopped"
}

export interface Underlying {
  id: string
  symbol: string
  name: string
  type: "crypto" | "equity" | "commodity" | "sport" | "event"
  icon?: React.ReactNode
}

// Default demo data - now using centralized trading data
const defaultOrganizations: Organization[] = TRADING_ORGS.map(o => ({
  id: o.id,
  name: o.name,
}))

const defaultClients: Client[] = TRADING_CLIENTS.map(c => ({
  id: c.id,
  name: c.name,
  orgId: c.orgId,
  status: c.status,
}))

const defaultStrategies: Strategy[] = TRADING_STRATEGIES.map(s => ({
  id: s.id,
  name: s.name,
  clientId: s.clientId,
  assetClass: s.assetClass,
  strategyType: s.archetype,
  status: s.status,
}))

const defaultUnderlyings: Underlying[] = [
  // Crypto
  { id: "btc", symbol: "BTC", name: "Bitcoin", type: "crypto" },
  { id: "eth", symbol: "ETH", name: "Ethereum", type: "crypto" },
  { id: "sol", symbol: "SOL", name: "Solana", type: "crypto" },
  { id: "usdt", symbol: "USDT", name: "Tether", type: "crypto" },
  // Equities
  { id: "spy", symbol: "SPY", name: "S&P 500 ETF", type: "equity" },
  { id: "qqq", symbol: "QQQ", name: "Nasdaq 100 ETF", type: "equity" },
  { id: "nvda", symbol: "NVDA", name: "NVIDIA", type: "equity" },
  // Sports (leagues as underlyings)
  { id: "nba", symbol: "NBA", name: "NBA Basketball", type: "sport" },
  { id: "nfl", symbol: "NFL", name: "NFL Football", type: "sport" },
  { id: "epl", symbol: "EPL", name: "English Premier League", type: "sport" },
  { id: "mlb", symbol: "MLB", name: "MLB Baseball", type: "sport" },
  // Prediction Events
  { id: "elections", symbol: "ELEC", name: "Elections", type: "event" },
  { id: "fed", symbol: "FED", name: "Fed Decisions", type: "event" },
]

// Context state type - NOW WITH MULTI-SELECT (arrays) and Live/Batch mode
export interface ContextState {
  mode: "live" | "batch" // Live = real-time streaming, Batch = historical snapshot
  asOfDatetime?: string // For batch mode - point-in-time snapshot (ISO datetime string)
  organizationIds: string[] // One or many orgs
  clientIds: string[] // Empty = All Clients, otherwise specific clients
  strategyIds: string[] // Empty = All Strategies, otherwise specific strategies
  underlyingIds: string[] // Empty = All Underlyings, otherwise specific underlyings
}

interface ContextBarProps {
  organizations?: Organization[]
  clients?: Client[]
  strategies?: Strategy[]
  underlyings?: Underlying[]
  context: ContextState
  onContextChange: (context: ContextState) => void
  // Which levels are available for the current surface
  availableLevels?: {
    organization?: boolean
    client?: boolean
    strategy?: boolean
    underlying?: boolean
  }
  className?: string
}

function getUnderlyingIcon(type: Underlying["type"]) {
  switch (type) {
    case "crypto":
      return <Coins className="size-3.5" />
    case "equity":
      return <TrendingUp className="size-3.5" />
    case "sport":
      return <Trophy className="size-3.5" />
    case "event":
      return <BarChart3 className="size-3.5" />
    default:
      return <Coins className="size-3.5" />
  }
}

// Multi-select dropdown component
function MultiSelectDropdown<T extends { id: string }>({
  label,
  icon,
  items,
  selectedIds,
  onSelectionChange,
  renderItem,
  groupBy,
  getGroupLabel,
  allLabel = "All",
  emptyMessage = "No items",
}: {
  label: string
  icon: React.ReactNode
  items: T[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  renderItem: (item: T, isSelected: boolean) => React.ReactNode
  groupBy?: (item: T) => string
  getGroupLabel?: (group: string) => string
  allLabel?: string
  emptyMessage?: string
}) {
  const [open, setOpen] = React.useState(false)
  
  const isAllSelected = selectedIds.length === 0
  const selectedCount = selectedIds.length
  
  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }
  
  const selectAll = () => {
    onSelectionChange([])
  }
  
  // Get display text
  const getDisplayText = () => {
    if (isAllSelected) return allLabel
    if (selectedCount === 1) {
      const item = items.find((i) => i.id === selectedIds[0])
      return item ? (item as { name?: string; symbol?: string }).name || (item as { symbol?: string }).symbol || item.id : selectedIds[0]
    }
    return `${selectedCount} selected`
  }
  
  // Group items if groupBy is provided
  const groupedItems = React.useMemo(() => {
    if (!groupBy) return { default: items }
    const groups: Record<string, T[]> = {}
    items.forEach((item) => {
      const group = groupBy(item)
      if (!groups[group]) groups[group] = []
      groups[group].push(item)
    })
    return groups
  }, [items, groupBy])
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-6 gap-1 px-2 hover:bg-secondary text-xs",
            !isAllSelected ? "text-foreground font-medium" : "text-muted-foreground"
          )}
        >
          {icon}
          <span>{getDisplayText()}</span>
          {selectedCount > 1 && (
            <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-0.5">
              {selectedCount}
            </Badge>
          )}
          <ChevronDown className="size-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <div className="p-2 border-b border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            {!isAllSelected && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1.5 text-[10px] text-muted-foreground"
                onClick={selectAll}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-[280px]">
          <div className="p-1">
            {/* All option */}
            <div
              role="button"
              tabIndex={0}
              onClick={selectAll}
              onKeyDown={(e) => e.key === "Enter" && selectAll()}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-secondary cursor-pointer",
                isAllSelected && "bg-secondary"
              )}
            >
              <span
                className={cn(
                  "size-4 rounded border flex items-center justify-center shrink-0",
                  isAllSelected ? "bg-primary border-primary" : "border-input"
                )}
              >
                {isAllSelected && <Check className="size-3 text-primary-foreground" />}
              </span>
              <span className="text-muted-foreground">{allLabel}</span>
            </div>
            
            <div className="h-px bg-border my-1" />
            
            {items.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : groupBy ? (
              // Grouped items
              Object.entries(groupedItems).map(([group, groupItems]) => (
                <div key={group}>
                  <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {getGroupLabel ? getGroupLabel(group) : group}
                  </div>
                  {groupItems.map((item) => {
                    const isSelected = selectedIds.includes(item.id)
                    return (
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleItem(item.id)}
                        onKeyDown={(e) => e.key === "Enter" && toggleItem(item.id)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-secondary cursor-pointer",
                          isSelected && "bg-secondary"
                        )}
                      >
                        <span
                          className={cn(
                            "size-4 rounded border flex items-center justify-center shrink-0",
                            isSelected ? "bg-primary border-primary" : "border-input"
                          )}
                        >
                          {isSelected && <Check className="size-3 text-primary-foreground" />}
                        </span>
                        {renderItem(item, isSelected)}
                      </div>
                    )
                  })}
                </div>
              ))
            ) : (
              // Ungrouped items
              items.map((item) => {
                const isSelected = selectedIds.includes(item.id)
                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleItem(item.id)}
                    onKeyDown={(e) => e.key === "Enter" && toggleItem(item.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-secondary cursor-pointer",
                      isSelected && "bg-secondary"
                    )}
                  >
                    <span
                      className={cn(
                        "size-4 rounded border flex items-center justify-center shrink-0",
                        isSelected ? "bg-primary border-primary" : "border-input"
                      )}
                    >
                      {isSelected && <Check className="size-3 text-primary-foreground" />}
                    </span>
                    {renderItem(item, isSelected)}
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

export function ContextBar({
  organizations = defaultOrganizations,
  clients = defaultClients,
  strategies = defaultStrategies,
  underlyings = defaultUnderlyings,
  context,
  onContextChange,
  availableLevels = { organization: true, client: true, strategy: true, underlying: true },
  className,
}: ContextBarProps) {
  // Filtered lists based on hierarchy
  const filteredClients = React.useMemo(() => {
    if (context.organizationIds.length === 0) return clients
    return clients.filter((c) => context.organizationIds.includes(c.orgId))
  }, [clients, context.organizationIds])

  const filteredStrategies = React.useMemo(() => {
    let result = strategies
    
    // Filter by organization
    if (context.organizationIds.length > 0) {
      const orgClientIds = clients
        .filter((c) => context.organizationIds.includes(c.orgId))
        .map((c) => c.id)
      result = result.filter((s) => orgClientIds.includes(s.clientId))
    }
    
    // Filter by client
    if (context.clientIds.length > 0) {
      result = result.filter((s) => context.clientIds.includes(s.clientId))
    }
    
    return result
  }, [strategies, clients, context.organizationIds, context.clientIds])

  // Cascading underlying filter - only show underlyings available in filtered strategies
  const filteredUnderlyings = React.useMemo(() => {
    // Get underlyings used by the currently filtered strategies
    const strategiesForUnderlyings = context.strategyIds.length > 0 
      ? filteredStrategies.filter(s => context.strategyIds.includes(s.id))
      : filteredStrategies
    
    // Extract unique underlying symbols from TRADING_STRATEGIES (which have underlyings array)
    const usedUnderlyingSymbols = new Set<string>()
    strategiesForUnderlyings.forEach(s => {
      const tradingStrategy = TRADING_STRATEGIES.find(ts => ts.id === s.id)
      if (tradingStrategy?.underlyings) {
        tradingStrategy.underlyings.forEach(u => usedUnderlyingSymbols.add(u.toUpperCase()))
      }
    })
    
    // Filter underlyings to only those used
    if (usedUnderlyingSymbols.size === 0) return underlyings
    return underlyings.filter(u => usedUnderlyingSymbols.has(u.symbol.toUpperCase()))
  }, [filteredStrategies, context.strategyIds, underlyings])

  // Count active filters
  const activeFilters = [
    context.organizationIds.length > 0 && context.organizationIds.length < organizations.length,
    context.clientIds.length > 0,
    context.strategyIds.length > 0,
    context.underlyingIds.length > 0,
  ].filter(Boolean).length

  return (
    <div
      className={cn(
        "h-9 flex items-center gap-1 px-4 border-b border-border bg-[#111113] text-sm",
        className
      )}
    >
      {/* Live/Batch Mode Toggle */}
      <div className="flex items-center border border-border rounded-md overflow-hidden mr-3">
        <button
          onClick={() => onContextChange({ ...context, mode: "live", asOfDatetime: undefined })}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 text-xs transition-colors",
            context.mode === "live"
              ? "bg-[var(--status-live)]/10 text-[var(--status-live)] font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          <Radio className="size-3" />
          Live
        </button>
        <div className="w-px h-4 bg-border" />
        <button
          onClick={() => onContextChange({ ...context, mode: "batch", asOfDatetime: new Date().toISOString().slice(0, 16) })}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 text-xs transition-colors",
            context.mode === "batch"
              ? "bg-[var(--surface-markets)]/10 text-[var(--surface-markets)] font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          <Calendar className="size-3" />
          As-Of
        </button>
      </div>
      
      {/* Datetime Picker (Batch/As-Of mode only) */}
      {context.mode === "batch" && (() => {
        // Batch data validation - batch is T+1, available after 8am
        const selectedDateTime = context.asOfDatetime ? new Date(context.asOfDatetime) : new Date()
        const now = new Date()
        const yesterday8am = new Date(now)
        yesterday8am.setDate(yesterday8am.getDate() - 1)
        yesterday8am.setHours(8, 0, 0, 0)
        
        const isDateTooRecent = selectedDateTime > yesterday8am
        const isTodayBefore8am = now.getHours() < 8
        const showWarning = isDateTooRecent || isTodayBefore8am
        
        return (
          <div className="flex items-center gap-2 mr-3">
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 border rounded-md",
              showWarning ? "border-[var(--status-warning)] bg-[var(--status-warning)]/5" : "border-border"
            )}>
              <Calendar className={cn("size-3", showWarning ? "text-[var(--status-warning)]" : "text-muted-foreground")} />
              <input
                type="datetime-local"
                value={context.asOfDatetime || new Date().toISOString().slice(0, 16)}
                onChange={(e) => onContextChange({ ...context, asOfDatetime: e.target.value })}
                className="bg-transparent text-xs border-none focus:outline-none w-36"
              />
            </div>
            
            {/* Warning for date too recent */}
            {showWarning && (
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/30">
                <AlertTriangle className="size-3 text-[var(--status-warning)]" />
                <span className="text-[10px] text-[var(--status-warning)]">
                  Batch available T+1 after 8am
                </span>
              </div>
            )}
            
            {/* Quick shortcuts */}
            <div className="flex items-center gap-1">
              {[
                { label: "Yest EOD", offset: "yesterday" },
                { label: "2d ago", offset: "2days" },
                { label: "1w ago", offset: "1week" },
              ].map(({ label, offset }) => (
                <button
                  key={label}
                  onClick={() => {
                    let dt: Date = new Date()
                    if (offset === "yesterday") {
                      dt.setDate(dt.getDate() - 1)
                      dt.setHours(23, 59, 0, 0)
                    } else if (offset === "2days") {
                      dt.setDate(dt.getDate() - 2)
                      dt.setHours(23, 59, 0, 0)
                    } else if (offset === "1week") {
                      dt.setDate(dt.getDate() - 7)
                      dt.setHours(23, 59, 0, 0)
                    }
                    onContextChange({ ...context, asOfDatetime: dt.toISOString().slice(0, 16) })
                  }}
                  className="px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary rounded"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )
      })()}
      
      {/* Context Selectors */}
      <div className="flex items-center gap-1">
        {/* Organization - Multi-select */}
        {availableLevels.organization && (
          <>
            <MultiSelectDropdown
              label="Organizations"
              icon={<Building2 className="size-3.5 text-primary" />}
              items={organizations}
              selectedIds={context.organizationIds}
              onSelectionChange={(ids) =>
                onContextChange({
                  ...context,
                  organizationIds: ids,
                  // Reset downstream when orgs change
                  clientIds: [],
                  strategyIds: [],
                })
              }
              allLabel="All Organizations"
              renderItem={(org) => (
                <span className="flex items-center gap-2 flex-1">
                  <Building2 className="size-3.5 text-muted-foreground" />
                  {org.name}
                </span>
              )}
            />
            <span className="text-muted-foreground/30">/</span>
          </>
        )}

        {/* Client - Multi-select */}
        {availableLevels.client && (
          <>
            <MultiSelectDropdown
              label={`Clients (${filteredClients.length})`}
              icon={<Users className="size-3.5" />}
              items={filteredClients}
              selectedIds={context.clientIds}
              onSelectionChange={(ids) =>
                onContextChange({
                  ...context,
                  clientIds: ids,
                  // Reset downstream when clients change
                  strategyIds: [],
                })
              }
              allLabel="All Clients"
              emptyMessage="No clients for selected org"
              renderItem={(client) => (
                <span className="flex items-center gap-2 flex-1">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      client.status === "active" && "bg-[var(--status-live)]",
                      client.status === "onboarding" && "bg-[var(--status-warning)]",
                      client.status === "inactive" && "bg-[var(--status-idle)]"
                    )}
                  />
                  {client.name}
                </span>
              )}
            />
            
            {context.clientIds.length > 0 && (
              <button
                onClick={() => onContextChange({ ...context, clientIds: [], strategyIds: [] })}
                className="p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
            
            <span className="text-muted-foreground/30">/</span>
          </>
        )}

        {/* Strategy - Multi-select */}
        {availableLevels.strategy && (
          <>
            <MultiSelectDropdown
              label={`Strategies (${filteredStrategies.length})`}
              icon={<BarChart3 className="size-3.5" />}
              items={filteredStrategies}
              selectedIds={context.strategyIds}
              onSelectionChange={(ids) =>
                onContextChange({
                  ...context,
                  strategyIds: ids,
                })
              }
              allLabel="All Strategies"
              emptyMessage="No strategies for selection"
              groupBy={(s) => s.assetClass}
              getGroupLabel={(group) => group}
              renderItem={(strategy) => (
                <span className="flex items-center gap-2 flex-1">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      strategy.status === "live" && "bg-[var(--status-live)]",
                      strategy.status === "paused" && "bg-[var(--status-idle)]",
                      strategy.status === "warning" && "bg-[var(--status-warning)]"
                    )}
                  />
                  <span className="flex-1 truncate">{strategy.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {strategy.strategyType}
                  </span>
                </span>
              )}
            />
            
            {context.strategyIds.length > 0 && (
              <button
                onClick={() => onContextChange({ ...context, strategyIds: [] })}
                className="p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
            
            <span className="text-muted-foreground/30">/</span>
          </>
        )}

        {/* Underlying - Multi-select (cascading based on filtered strategies) */}
        {availableLevels.underlying && (
          <>
            <MultiSelectDropdown
              label={`Underlyings (${filteredUnderlyings.length})`}
              icon={<Coins className="size-3.5" />}
              items={filteredUnderlyings}
              selectedIds={context.underlyingIds}
              onSelectionChange={(ids) =>
                onContextChange({
                  ...context,
                  underlyingIds: ids,
                })
              }
              allLabel="All Underlyings"
              groupBy={(u) => u.type}
              getGroupLabel={(type) => ({
                crypto: "Crypto",
                equity: "Equities",
                sport: "Sports (Leagues)",
                event: "Events",
                commodity: "Commodities",
              }[type] || type)}
              renderItem={(underlying) => (
                <span className="flex items-center gap-2 flex-1">
                  {getUnderlyingIcon(underlying.type)}
                  <span className="font-mono">{underlying.symbol}</span>
                  <span className="text-xs text-muted-foreground">{underlying.name}</span>
                </span>
              )}
            />
            
            {context.underlyingIds.length > 0 && (
              <button
                onClick={() => onContextChange({ ...context, underlyingIds: [] })}
                className="p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Active Filters Count */}
      {activeFilters > 0 && (
        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium">
          {activeFilters} filter{activeFilters > 1 ? "s" : ""} active
        </Badge>
      )}

      {/* Clear All Button */}
      {activeFilters > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() =>
            onContextChange({
              ...context,
              organizationIds: [],
              clientIds: [],
              strategyIds: [],
              underlyingIds: [],
            })
          }
        >
          Clear all
        </Button>
      )}
    </div>
  )
}

// Hook to use context state with URL persistence
export function useContextState(initialState?: Partial<ContextState>) {
  const [context, setContext] = React.useState<ContextState>({
    mode: initialState?.mode || "live",
    asOfDatetime: initialState?.asOfDatetime,
    organizationIds: initialState?.organizationIds || [],
    clientIds: initialState?.clientIds || [],
    strategyIds: initialState?.strategyIds || [],
    underlyingIds: initialState?.underlyingIds || [],
  })

  return { context, setContext }
}

// Export default data for use in pages
export const DEFAULT_ORGANIZATIONS = defaultOrganizations
export const DEFAULT_CLIENTS = defaultClients
export const DEFAULT_STRATEGIES = defaultStrategies
export const DEFAULT_UNDERLYINGS = defaultUnderlyings
