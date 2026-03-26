import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Play, XCircle } from "lucide-react";

export const STATUS_CONFIG = {
  completed: {
    label: "Complete",
    color: "text-emerald-400",
    badgeClass: "border-emerald-400/30 text-emerald-400",
    icon: CheckCircle2,
  },
  running: {
    label: "Running",
    color: "text-blue-400",
    badgeClass: "border-blue-400/30 text-blue-400",
    icon: Play,
  },
  queued: {
    label: "Queued",
    color: "text-muted-foreground",
    badgeClass: "text-muted-foreground",
    icon: Clock,
  },
  failed: {
    label: "Failed",
    color: "text-red-400",
    badgeClass: "border-red-400/30 text-red-400",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-muted-foreground",
    badgeClass: "text-muted-foreground",
    icon: XCircle,
  },
} as const;

export function StatusBadge({ status }: { status: string }) {
  const cfg =
    STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.queued;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn("text-xs gap-1", cfg.badgeClass)}>
      <Icon className="size-3" />
      {cfg.label}
    </Badge>
  );
}
