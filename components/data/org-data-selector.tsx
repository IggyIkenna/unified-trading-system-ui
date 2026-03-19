"use client"

// OrgDataSelector — Data service org picker (org-level only, no client sub-level)
// Adapted from components/trading/org-client-selector.tsx
// Admin: sees all orgs. Client: locked to their org. Demo: fixed "Demo Org".

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Building2, ChevronDown, Check, FlaskConical, Shield } from "lucide-react"
import type { DataOrg, OrgMode } from "@/lib/data-service-types"

interface OrgDataSelectorProps {
  orgs: DataOrg[]
  currentOrg: DataOrg
  orgMode: OrgMode
  onOrgChange: (org: DataOrg) => void
  className?: string
}

export function OrgDataSelector({
  orgs,
  currentOrg,
  orgMode,
  onOrgChange,
  className,
}: OrgDataSelectorProps) {
  // Demo mode: always locked, show demo badge
  if (orgMode === "demo") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5">
          <FlaskConical className="size-3.5 text-amber-400" />
          <span className="text-sm font-medium text-amber-400">Demo Org</span>
          <Badge variant="outline" className="h-4 text-[10px] border-amber-500/40 text-amber-500">
            MOCK
          </Badge>
        </div>
      </div>
    )
  }

  // Client mode: locked to their org, no dropdown
  if (orgMode === "client") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
          <Building2 className="size-3.5 text-sky-400" />
          <span className="text-sm font-semibold">{currentOrg.name}</span>
        </div>
      </div>
    )
  }

  // Admin mode: full org dropdown
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge variant="outline" className="border-violet-500/30 text-violet-400 text-[10px]">
        <Shield className="mr-1 size-2.5" />
        ADMIN
      </Badge>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-2 px-2 font-semibold hover:bg-secondary"
          >
            <Building2 className="size-4 text-sky-400" />
            <span>{currentOrg.name}</span>
            <ChevronDown className="size-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            All Organisations ({orgs.filter(o => o.mode !== "demo").length})
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {orgs.filter(o => o.mode !== "demo").map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => onOrgChange(org)}
              className="flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground" />
                <span>{org.name}</span>
                {org.mode === "admin" && (
                  <Badge variant="secondary" className="text-[10px]">internal</Badge>
                )}
              </span>
              {org.id === currentOrg.id && (
                <Check className="size-4 text-sky-400" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
