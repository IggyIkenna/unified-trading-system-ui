"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Building2, ChevronDown, Users, Check } from "lucide-react"

export interface Organization {
  id: string
  name: string
  logo?: string
}

export interface Client {
  id: string
  name: string
  orgId: string
  strategyCount: number
  status: "active" | "onboarding" | "inactive"
}

interface OrgClientSelectorProps {
  organizations: Organization[]
  clients: Client[]
  currentOrg: Organization
  currentClient?: Client
  onOrgChange: (org: Organization) => void
  onClientChange: (client: Client | null) => void
  showAllClientsOption?: boolean
  className?: string
}

export function OrgClientSelector({
  organizations,
  clients,
  currentOrg,
  currentClient,
  onOrgChange,
  onClientChange,
  showAllClientsOption = true,
  className,
}: OrgClientSelectorProps) {
  const orgClients = clients.filter((c) => c.orgId === currentOrg.id)

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Organization Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-2 px-2 text-foreground font-semibold hover:bg-secondary"
          >
            <Building2 className="size-4 text-primary" />
            <span>{currentOrg.name}</span>
            <ChevronDown className="size-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Organizations
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => {
                onOrgChange(org)
                onClientChange(null) // Reset client when org changes
              }}
              className="flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground" />
                {org.name}
              </span>
              {org.id === currentOrg.id && (
                <Check className="size-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="text-muted-foreground">/</span>

      {/* Client Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-2 px-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <Users className="size-4" />
            <span>{currentClient?.name || "All Clients"}</span>
            <ChevronDown className="size-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Clients ({orgClients.length})
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {showAllClientsOption && (
            <>
              <DropdownMenuItem
                onClick={() => onClientChange(null)}
                className="flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  All Clients
                </span>
                {!currentClient && <Check className="size-4 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {orgClients.map((client) => (
            <DropdownMenuItem
              key={client.id}
              onClick={() => onClientChange(client)}
              className="flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    client.status === "active" && "bg-[var(--status-live)]",
                    client.status === "onboarding" && "bg-[var(--status-warning)]",
                    client.status === "inactive" && "bg-[var(--status-idle)]"
                  )}
                />
                <span>{client.name}</span>
                <span className="text-xs text-muted-foreground">
                  {client.strategyCount} strategies
                </span>
              </span>
              {currentClient?.id === client.id && (
                <Check className="size-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
