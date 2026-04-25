"use client";

/**
 * Plan D — ForkDialog.
 *
 * Modal config-diff editor for forking the parent instance. Two primary
 * actions:
 *   - "Save draft" → POST /fork (status=draft)
 *   - "Request approval" → POST /fork then POST /request-approval
 *
 * Gated to holders of the dart_exclusive subscription on this instance.
 */

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forkInstance } from "@/lib/api/strategy-subscriptions";
import { requestApproval } from "@/lib/api/strategy-versions";

export interface ForkDialogField {
  readonly name: string;
  readonly currentValue: string;
}

export interface ForkDialogProps {
  readonly instanceId: string;
  readonly clientId: string;
  readonly fields: readonly ForkDialogField[];
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onForked?: (versionId: string) => void;
}

export function ForkDialog({
  instanceId,
  clientId,
  fields,
  open,
  onOpenChange,
  onForked,
}: ForkDialogProps): React.JSX.Element {
  const [edits, setEdits] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setEdits({});
      setError(null);
    }
  }, [open]);

  const changedTuples: [string, string, string][] = fields
    .filter((f) => edits[f.name] !== undefined && edits[f.name] !== f.currentValue)
    .map((f) => [f.name, f.currentValue, edits[f.name]] as [string, string, string]);

  const onAction = async (alsoRequestApproval: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const draft = await forkInstance(instanceId, {
        clientId,
        changedFields: changedTuples,
      });
      if (alsoRequestApproval) {
        await requestApproval(draft.version_id);
      }
      onForked?.(draft.version_id);
      onOpenChange(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="fork-dialog">
        <DialogHeader>
          <DialogTitle>Fork strategy for research</DialogTitle>
          <DialogDescription>
            Forked versions run through the canonical batch=live pipeline before rollout. Only the fields you change
            appear in the version diff.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          {fields.map((f) => (
            <div key={f.name} className="grid gap-1">
              <Label htmlFor={`fork-${f.name}`}>{f.name}</Label>
              <Input
                id={`fork-${f.name}`}
                defaultValue={f.currentValue}
                onChange={(e) => setEdits((prev) => ({ ...prev, [f.name]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={busy || changedTuples.length === 0}
            onClick={() => onAction(false)}
          >
            Save draft
          </Button>
          <Button type="button" disabled={busy || changedTuples.length === 0} onClick={() => onAction(true)}>
            Request approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
