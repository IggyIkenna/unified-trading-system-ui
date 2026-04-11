"use client";

import { Activity, AlertTriangle, FileText, LogIn, Settings, TrendingUp } from "lucide-react";

export function getEventIcon(type: string) {
  switch (type) {
    case "trade":
      return <TrendingUp className="h-3.5 w-3.5" />;
    case "order":
      return <FileText className="h-3.5 w-3.5" />;
    case "alert":
      return <AlertTriangle className="h-3.5 w-3.5" />;
    case "login":
      return <LogIn className="h-3.5 w-3.5" />;
    case "config":
      return <Settings className="h-3.5 w-3.5" />;
    default:
      return <Activity className="h-3.5 w-3.5" />;
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case "success":
      return "text-positive";
    case "failed":
      return "text-destructive";
    case "warning":
      return "text-warning";
    case "pending":
      return "text-info";
    default:
      return "text-muted-foreground";
  }
}
