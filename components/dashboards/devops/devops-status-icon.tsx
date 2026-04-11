"use client";

import { AlertTriangle, CheckCircle, Clock, RefreshCw, XCircle } from "lucide-react";

export function getStatusIcon(status: string) {
  switch (status) {
    case "healthy":
    case "success":
    case "completed":
      return <CheckCircle className="h-4 w-4 text-positive" />;
    case "degraded":
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    case "unhealthy":
    case "failed":
      return <XCircle className="h-4 w-4 text-destructive" />;
    case "running":
      return <RefreshCw className="h-4 w-4 animate-spin text-info" />;
    case "queued":
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}
