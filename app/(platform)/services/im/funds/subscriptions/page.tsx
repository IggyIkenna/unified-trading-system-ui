"use client";

import * as React from "react";
import { FilePlus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createSubscription,
  listSubscriptions,
  type AllocatorSubscription,
  type SubscriptionStatus,
} from "@/lib/api/fund-administration";
import {
  MOCK_DEFAULT_FUND_ID,
  MOCK_DEFAULT_SHARE_CLASS,
} from "@/lib/mocks/fund-administration";

const STATUS_FILTER_OPTIONS: Array<SubscriptionStatus | "ALL"> = [
  "ALL",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "SETTLED",
];

function statusBadge(status: SubscriptionStatus) {
  const styles: Record<SubscriptionStatus, string> = {
    PENDING: "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border-[var(--accent-blue)]/20",
    APPROVED: "bg-primary/10 text-primary border-primary/20",
    REJECTED: "bg-[var(--pnl-negative)]/10 text-[var(--pnl-negative)] border-[var(--pnl-negative)]/20",
    SETTLED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${styles[status]}`} data-testid={`im-funds-sub-status-${status}`}>
      {status}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Validation — pulled out so the unit tests can exercise it in isolation.
// ---------------------------------------------------------------------------

export interface NewSubscriptionForm {
  subscription_id: string;
  allocator_id: string;
  share_class: string;
  requested_amount_usd: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: Partial<Record<keyof NewSubscriptionForm, string>>;
}

export function validateNewSubscription(form: NewSubscriptionForm): ValidationResult {
  const errors: Partial<Record<keyof NewSubscriptionForm, string>> = {};
  if (!form.subscription_id.trim()) errors.subscription_id = "required";
  if (!form.allocator_id.trim()) errors.allocator_id = "required";
  if (!form.share_class.trim()) errors.share_class = "required";
  const amount = Number(form.requested_amount_usd);
  if (!form.requested_amount_usd.trim()) {
    errors.requested_amount_usd = "required";
  } else if (!Number.isFinite(amount) || amount <= 0) {
    errors.requested_amount_usd = "must be a positive number";
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

export default function SubscriptionsPage() {
  const [rows, setRows] = React.useState<AllocatorSubscription[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<SubscriptionStatus | "ALL">("ALL");
  const [open, setOpen] = React.useState(false);

  const refresh = React.useCallback(() => {
    listSubscriptions()
      .then((data) => setRows(data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = React.useMemo(() => {
    if (!rows) return null;
    if (statusFilter === "ALL") return rows;
    return rows.filter((r) => r.status === statusFilter);
  }, [rows, statusFilter]);

  return (
    <main className="flex-1 p-6 space-y-6" data-testid="im-funds-subscriptions-page">
      <PageHeader
        title="Subscriptions"
        description="Investor capital inflows into the IM Pooled fund."
      >
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="im-funds-sub-new-open">
              <FilePlus className="size-4 mr-1.5" />
              New subscription
            </Button>
          </DialogTrigger>
          <NewSubscriptionDialog
            onClose={() => setOpen(false)}
            onCreated={() => {
              setOpen(false);
              refresh();
            }}
          />
        </Dialog>
      </PageHeader>

      <div className="flex items-center gap-3">
        <Label className="text-xs text-muted-foreground">Status</Label>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as SubscriptionStatus | "ALL")}
        >
          <SelectTrigger className="w-[160px] h-8 text-xs" data-testid="im-funds-sub-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Subscription list</CardTitle>
            {filtered ? (
              <Badge variant="outline" className="text-xs font-mono">
                {filtered.length} row{filtered.length === 1 ? "" : "s"}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-[var(--pnl-negative)]" data-testid="im-funds-sub-error">
              {error}
            </p>
          ) : filtered === null ? (
            <Skeleton className="h-40" />
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No subscriptions match the filter.</p>
          ) : (
            <Table data-testid="im-funds-sub-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Subscription ID</TableHead>
                  <TableHead>Allocator</TableHead>
                  <TableHead>Share class</TableHead>
                  <TableHead className="text-right">Requested (USD)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested at</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((sub) => (
                  <TableRow key={sub.subscription_id} data-testid={`im-funds-sub-row-${sub.subscription_id}`}>
                    <TableCell className="text-xs font-mono">{sub.subscription_id}</TableCell>
                    <TableCell className="text-sm">{sub.allocator_id}</TableCell>
                    <TableCell className="text-sm">{sub.share_class}</TableCell>
                    <TableCell className="text-right text-sm font-mono">{sub.requested_amount_usd}</TableCell>
                    <TableCell>{statusBadge(sub.status)}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {sub.requested_timestamp}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

interface DialogProps {
  onClose: () => void;
  onCreated: () => void;
}

function NewSubscriptionDialog({ onClose, onCreated }: DialogProps) {
  const [form, setForm] = React.useState<NewSubscriptionForm>({
    subscription_id: "",
    allocator_id: "",
    share_class: MOCK_DEFAULT_SHARE_CLASS,
    requested_amount_usd: "",
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const validation = validateNewSubscription(form);

  function update<K extends keyof NewSubscriptionForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validation.ok) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createSubscription({
        subscription_id: form.subscription_id.trim(),
        fund_id: MOCK_DEFAULT_FUND_ID,
        allocator_id: form.allocator_id.trim(),
        share_class: form.share_class.trim(),
        requested_amount_usd: form.requested_amount_usd.trim(),
      });
      onCreated();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DialogContent data-testid="im-funds-sub-new-dialog">
      <DialogHeader>
        <DialogTitle>New subscription</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="sub-id" className="text-xs">Subscription ID</Label>
          <Input
            id="sub-id"
            data-testid="im-funds-sub-field-subscription_id"
            value={form.subscription_id}
            onChange={(e) => update("subscription_id", e.target.value)}
            placeholder="sub-..."
          />
          {validation.errors.subscription_id ? (
            <p className="text-[11px] text-[var(--pnl-negative)]">{validation.errors.subscription_id}</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="sub-allocator" className="text-xs">Allocator / client ID</Label>
          <Input
            id="sub-allocator"
            data-testid="im-funds-sub-field-allocator_id"
            value={form.allocator_id}
            onChange={(e) => update("allocator_id", e.target.value)}
            placeholder="client-..."
          />
          {validation.errors.allocator_id ? (
            <p className="text-[11px] text-[var(--pnl-negative)]">{validation.errors.allocator_id}</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="sub-share-class" className="text-xs">Share class</Label>
          <Input
            id="sub-share-class"
            data-testid="im-funds-sub-field-share_class"
            value={form.share_class}
            onChange={(e) => update("share_class", e.target.value)}
          />
          {validation.errors.share_class ? (
            <p className="text-[11px] text-[var(--pnl-negative)]">{validation.errors.share_class}</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="sub-amount" className="text-xs">Requested amount (USD)</Label>
          <Input
            id="sub-amount"
            inputMode="decimal"
            data-testid="im-funds-sub-field-requested_amount_usd"
            value={form.requested_amount_usd}
            onChange={(e) => update("requested_amount_usd", e.target.value)}
            placeholder="100000.00"
          />
          {validation.errors.requested_amount_usd ? (
            <p className="text-[11px] text-[var(--pnl-negative)]">{validation.errors.requested_amount_usd}</p>
          ) : null}
        </div>
        {submitError ? (
          <p className="text-sm text-[var(--pnl-negative)]" data-testid="im-funds-sub-submit-error">{submitError}</p>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            data-testid="im-funds-sub-submit"
            disabled={!validation.ok || submitting}
          >
            {submitting ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
