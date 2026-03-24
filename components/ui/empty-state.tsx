import * as React from "react";
import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center",
      )}
    >
      <Icon className="text-muted-foreground size-10" />
      <h3 className="text-muted-foreground text-sm font-semibold">{title}</h3>
      {description && (
        <p className="text-muted-foreground/70 max-w-sm text-sm">
          {description}
        </p>
      )}
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export { EmptyState };
