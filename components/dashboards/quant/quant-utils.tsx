import { CheckCircle, Clock, RefreshCw, Rocket, XCircle } from "lucide-react";

export function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-positive" />;
    case "promoted":
      return <Rocket className="h-4 w-4 text-[var(--accent-blue)]" />;
    case "running":
      return <RefreshCw className="h-4 w-4 animate-spin text-info" />;
    case "queued":
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}
