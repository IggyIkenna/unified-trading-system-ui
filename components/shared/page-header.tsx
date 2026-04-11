import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Primary actions (buttons, toggles) — right side on wide screens */
  children?: ReactNode;
  className?: string;
  /** Extra row below title row (e.g. filters) */
  footer?: ReactNode;
}

/**
 * Standard platform page title + description + actions.
 * Use on `(platform)` route pages; not for marketing `(public)` or in-card section titles.
 */
export function PageHeader({ title, description, children, className, footer }: PageHeaderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="text-page-title font-semibold tracking-tight text-foreground">{title}</h1>
          {description != null && description !== "" ? (
            <div className="max-w-3xl space-y-1 text-body text-muted-foreground">{description}</div>
          ) : null}
        </div>
        {children ? <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div> : null}
      </div>
      {footer}
    </div>
  );
}
