"use client"

import * as React from "react"
import Link from "next/link"
import { Bell, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { typedFetch } from "@/lib/api/typed-fetch"
import { cn } from "@/lib/utils"

interface Alert {
  id: string
  severity: "critical" | "high" | "medium" | "low"
  message: string
  timestamp: string
  acknowledged: boolean
}

const severityColors: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-blue-500",
}

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function NotificationBell() {
  const { user, token } = useAuth()
  const queryClient = useQueryClient()

  const { data: alerts } = useQuery<Alert[]>({
    queryKey: ["alerts-active", user?.id],
    queryFn: async () => {
      try {
        const res = await typedFetch<{ alerts: Alert[] }>("/api/alerts/active?acknowledged=false", token)
        return (res as { alerts: Alert[] })?.alerts ?? []
      } catch {
        return []
      }
    },
    enabled: !!user,
    refetchInterval: 15000,
  })

  const ackMutation = useMutation({
    mutationFn: (alertId: string) =>
      typedFetch<unknown>(`/api/alerts/${alertId}/acknowledge`, token, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts-active"] })
      queryClient.invalidateQueries({ queryKey: ["alerts"] })
    },
  })

  const count = alerts?.length ?? 0
  const recentAlerts = (alerts ?? []).slice(0, 5)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-8">
          <Bell className="size-4" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 size-3.5 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Alerts</span>
          {count > 0 && (
            <Badge variant="outline" className="text-[10px]">{count} active</Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {recentAlerts.length === 0 ? (
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">
            No active alerts
          </div>
        ) : (
          recentAlerts.map(alert => (
            <DropdownMenuItem key={alert.id} className="flex items-start gap-2 py-2" onSelect={(e) => e.preventDefault()}>
              <span className={cn("mt-1.5 size-2 rounded-full shrink-0", severityColors[alert.severity])} />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{alert.message}</p>
                <p className="text-[10px] text-muted-foreground">{formatRelativeTime(alert.timestamp)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 shrink-0"
                onClick={(e) => { e.stopPropagation(); ackMutation.mutate(alert.id) }}
                title="Acknowledge"
              >
                <Check className="size-3" />
              </Button>
            </DropdownMenuItem>
          ))
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/services/trading/alerts" className="justify-center text-xs text-primary">
            View All Alerts
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
