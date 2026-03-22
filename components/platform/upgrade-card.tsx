"use client"

/**
 * UpgradeCard — FOMO upsell card shown when a user lacks entitlements for a service.
 * Renders a centered lock icon, upgrade prompt, optional description, and CTA button.
 */

import { Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface UpgradeCardProps {
  serviceName: string
  description?: string
  className?: string
}

export function UpgradeCard({ serviceName, description, className }: UpgradeCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-10 text-center",
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-amber-500/10">
        <Lock className="size-5 text-amber-500" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold text-foreground">
          Upgrade to access {serviceName}
        </h3>
        {description && (
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <Button variant="outline" className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
        Contact Sales
      </Button>
    </div>
  )
}
