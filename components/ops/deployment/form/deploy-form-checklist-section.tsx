"use client";

import { ShieldAlert } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useDeployFormContext } from "@/components/ops/deployment/form/deploy-form-context";

export function DeployFormChecklistSection() {
  const { serviceName, dryRun, checklistValidation, acknowledgedWarnings, setAcknowledgedWarnings } =
    useDeployFormContext();

  if (dryRun || !checklistValidation || checklistValidation.ready) {
    return null;
  }

  return (
    <div
      className={cn(
        "p-4 rounded-lg border",
        checklistValidation.blocking_items.length > 0 ? "status-error" : "status-warning",
      )}
    >
      <div className="flex items-start gap-3">
        <ShieldAlert
          className={cn(
            "h-5 w-5 shrink-0 mt-0.5",
            checklistValidation.blocking_items.length > 0
              ? "text-[var(--color-accent-red)]"
              : "text-[var(--color-accent-amber)]",
          )}
        />
        <div className="flex-1">
          <h3
            className={cn(
              "text-sm font-medium",
              checklistValidation.blocking_items.length > 0
                ? "text-[var(--color-accent-red)]"
                : "text-[var(--color-accent-amber)]",
            )}
          >
            Deployment Readiness Warning
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {serviceName} has{" "}
            {checklistValidation.blocking_items.length > 0
              ? `${checklistValidation.blocking_items.length} blocking issue${checklistValidation.blocking_items.length > 1 ? "s" : ""}`
              : "pending readiness items"}
            :
          </p>

          {checklistValidation.blocking_items.length > 0 && (
            <ul className="mt-2 space-y-1">
              {checklistValidation.blocking_items.map((item) => (
                <li key={item.id} className="text-sm text-[var(--color-text-secondary)] flex items-start gap-2">
                  <span className="text-[var(--color-accent-red)]">•</span>
                  {item.description}
                </li>
              ))}
            </ul>
          )}

          {checklistValidation.warnings.length > 0 && checklistValidation.blocking_items.length === 0 && (
            <ul className="mt-2 space-y-1">
              {checklistValidation.warnings.slice(0, 5).map((warning, i) => (
                <li key={i} className="text-sm text-[var(--color-text-secondary)] flex items-start gap-2">
                  <span className="text-[var(--color-accent-amber)]">•</span>
                  {warning}
                </li>
              ))}
              {checklistValidation.warnings.length > 5 && (
                <li className="text-xs text-[var(--color-text-muted)]">
                  ...and {checklistValidation.warnings.length - 5} more
                </li>
              )}
            </ul>
          )}

          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-muted)]">
              Readiness: {checklistValidation.readiness_percent}% ({checklistValidation.completed_items}/
              {checklistValidation.total_items} items)
            </span>
          </div>

          {checklistValidation.can_proceed_with_acknowledgment && checklistValidation.blocking_items.length === 0 && (
            <div className="mt-3 flex items-center gap-2">
              <Checkbox
                id="acknowledgeWarnings"
                checked={acknowledgedWarnings}
                onCheckedChange={(checked) => setAcknowledgedWarnings(checked as boolean)}
              />
              <Label htmlFor="acknowledgeWarnings" className="text-sm cursor-pointer">
                I understand the risks and want to proceed anyway
              </Label>
            </div>
          )}

          {checklistValidation.blocking_items.length > 0 && (
            <p className="mt-3 text-sm text-[var(--color-accent-red)]">
              Deployment blocked. Resolve blocking issues in the Readiness tab first.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
