import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";

/** Shared gate / checklist status used across promote and other surfaces. */
export type GateStatus =
  | "passed"
  | "failed"
  | "pending"
  | "warning"
  | "not_started";

export function statusColor(status: GateStatus) {
  switch (status) {
    case "passed":
      return "text-emerald-400";
    case "failed":
      return "text-rose-400";
    case "pending":
      return "text-amber-400";
    case "warning":
      return "text-orange-400";
    case "not_started":
      return "text-muted-foreground/40";
  }
}

export function statusBg(status: GateStatus) {
  switch (status) {
    case "passed":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "failed":
      return "bg-rose-500/15 text-rose-400 border-rose-500/30";
    case "pending":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    case "warning":
      return "bg-orange-500/15 text-orange-400 border-orange-500/30";
    case "not_started":
      return "bg-muted/30 text-muted-foreground border-border/30";
  }
}

export function StatusIcon({
  status,
  className,
}: {
  status: GateStatus;
  className?: string;
}) {
  switch (status) {
    case "passed":
      return <CheckCircle2 className={cn("text-emerald-400", className)} />;
    case "failed":
      return <XCircle className={cn("text-rose-400", className)} />;
    case "pending":
      return <Clock className={cn("text-amber-400", className)} />;
    case "warning":
      return <AlertTriangle className={cn("text-orange-400", className)} />;
    case "not_started":
      return <Lock className={cn("text-muted-foreground/40", className)} />;
  }
}
