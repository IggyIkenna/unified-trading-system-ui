import { Inbox } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  /** Inline list/widget empty row (no dashed card). */
  variant?: "default" | "inline";
  className?: string;
}

function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  if (variant === "inline") {
    return (
      <div
        data-slot="empty-state"
        className={cn("flex items-center justify-center py-12 text-center text-base text-muted-foreground", className)}
      >
        {title}
      </div>
    );
  }

  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center",
        className,
      )}
    >
      <Icon className="text-muted-foreground size-10" />
      <h3 className="text-muted-foreground text-sm font-semibold">{title}</h3>
      {description && <p className="text-muted-foreground/70 max-w-sm text-sm">{description}</p>}
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export { EmptyState };
