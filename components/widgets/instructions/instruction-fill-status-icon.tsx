"use client";

import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";

export function InstructionFillStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "FILLED":
      return <CheckCircle2 className="size-3.5 text-emerald-500" />;
    case "PARTIAL_FILL":
      return <AlertTriangle className="size-3.5 text-amber-500" />;
    case "REJECTED":
      return <XCircle className="size-3.5 text-rose-500" />;
    default:
      return <Clock className="size-3.5 text-muted-foreground" />;
  }
}
