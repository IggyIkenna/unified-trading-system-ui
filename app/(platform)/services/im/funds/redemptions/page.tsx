"use client";

import * as React from "react";
import { ScrollText } from "lucide-react";

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
  createRedemption,
  listRedemptions,
  type AllocatorRedemption,
  type RedemptionStatus,
} from "@/lib/api/fund-administration";
import {
  MOCK_DEFAULT_FUND_ID,
  MOCK_DEFAULT_SHARE_CLASS,
} from "@/lib/mocks/fund-administration";

const STATUS_FILTER_OPTIONS: Array<RedemptionStatus | "ALL"> = [
  "ALL",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "PROCESSED",
  "SETTLED",
];

function statusBadge(status: RedemptionStatus) {
  const styles: Record<RedemptionStatus, string> = {
    PENDING: "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border-[var(--accent-blue)]/20",
    APPROVED: "bg-primary/10 text-primary border-primary/20",
    REJECTED: "bg-[var(--pnl-negative)]/10 text-[var(--pnl-negative)] border-[var(--pnl-negative)]/20",
    PROCESSED: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    SETTLED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${styles[status]}`} data-testid={`im-funds-red-status-${status}`}>
      {status}
    </Badge>
  );
}

export interface NewRedemptionForm {
  redemption_id: string;
  allocator_id: string;
  share_class: string;
  units_to_redeem: string;
  destination: string;
  grace_period_days: string;
}

export interface RedemptionValidationResult {
  ok: boolean;
  errors: Partial<Record<keyof NewRedemptionForm, string>>;
}

export function validateNewRedemption(form: NewRedemptionForm): RedemptionValidationResult {
  const errors: Partial<Record<keyof NewRedemptionForm, string>> = {};
  if (!form.redemption_id.trim()) errors.redemption_id = "required";
  if (!form.allocator_id.trim()) errors.allocator_id = "required";
  if (!form.share_class.trim()) errors.share_class = "required";
  if (!form.destination.trim()) errors.destination = "required";
  const units = Number(form.units_to_redeem);
  if (!form.units_to_redeem.trim()) {
    errors.units_to_redeem = "required";
  } else if (!Number.isFinite(units) || units <= 0) {
    errors.units_to_redeem = "must be a positive number";
  }
  if (form.grace_period_days.trim() !== "") {
    const grace = Number(form.grace_period_days);
    if (!Number.isInteger(grace) || grace < 0) {
      errors.grace_period_days = "must be a non-negative integer";
    }
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

export default function RedemptionsPage() {
  const [rows, setRows] = React.useState<AllocatorRedemption[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<RedemptionStatus | "ALL">("ALL");
  const [open, setOpen] = React.useState(false);

  const refresh = React.useCallback(() => {
    listRedemptions()
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
    <main className="flex-1 p-6 space-y-6" data-testid="im-funds-redemptions-page">
      <PageHeader
        title="Redemptions"
        description="Investor capital outflows — grace-period scheduled before NAV strike."
      >
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="im-funds-red-new-open">
              <ScrollText className="size-4 mr-1.5" />
              New redemption
            </Button>
          </DialogTrigger>
          <NewRedemptionDialog
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
          onValueChange={(v) => setStatusFilter(v as RedemptionStatus | "ALL")}
        >
          <SelectTrigger className="w-[160px] h-8 text-xs" data-testid="im-funds-red-status-filter">
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
            <CardTitle className="text-sm">Redemption list</CardTitle>
            {filtered ? (
              <Badge variant="outline" className="text-xs font-mono">
                {filtered.length} row{filtered.length === 1 ? "" : "s"}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-[var(--pnl-negative)]" data-testid="im-funds-red-error">
              {error}
            </p>
          ) : filtered === null ? (
            <Skeleton className="h-40" />
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No redemptions match the filter.</p>
          ) : (
            <Table data-testid="im-funds-red-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Redemption ID</TableHead>
                  <TableHead>Allocator</TableHead>
                  <TableHead>Share class</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Grace (days)</TableHead>
                  <TableHead>Settled at</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((red) => (
                  <TableRow key={red.redemption_id} data-testid={`im-funds-red-row-${red.redemption_id}`}>
                    <TableCell className="text-xs font-mono">{red.redemption_id}</TableCell>
                    <TableCell className="text-sm">{red.allocator_id}</TableCell>
                    <TableCell className="text-sm">{red.share_class}</TableCell>
                    <TableCell className="text-right text-sm font-mono">{red.units_to_redeem}</TableCell>
                    <TableCell>{statusBadge(red.status)}</TableCell>
                    <TableCell className="text-right text-sm font-mono">{red.grace_period_days}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {red.settlement_timestamp ?? "—"}
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

function NewRedemptionDialog({ onClose, onCreated }: DialogProps) {
  const [form, setForm] = React.useState<NewRedemptionForm>({
    redemption_id: "",
    allocator_id: "",
    share_class: MOCK_DEFAULT_SHARE_CLASS,
    units_to_redeem: "",
    destination: "",
    grace_period_days: "5",
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const validation = validateNewRedemption(form);

  function update<K extends keyof NewRedemptionForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validation.ok) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createRedemption({
        redemption_id: form.redemption_id.trim(),
        fund_id: MOCK_DEFAULT_FUND_ID,
        allocator_id: form.allocator_id.trim(),
        share_class: form.share_class.trim(),
        units_to_redeem: form.units_to_redeem.trim(),
        destination: form.destination.trim(),
        grace_period_days:
          form.grace_period_days.trim() === "" ? null : Number(form.grace_period_days),
      });
      onCreated();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DialogContent data-testid="im-funds-red-new-dialog">
      <DialogHeader>
        <DialogTitle>New redemption</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="red-id" className="text-xs">Redemption ID</Label>
          <Input
            id="red-id"
            data-testid="im-funds-red-field-redemption_id"
            value={form.redemption_id}
            onChange={(e) => update("redemption_id", e.target.value)}
            placeholder="red-..."
          />
          {validation.errors.redemption_id ? (
            <p className="text-[11px] text-[var(--pnl-negative)]">{validation.errors.redemption_id}</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="red-allocator" className="text-xs">Allocator / client ID</Label>
          <Input
            id="red-allocator"
            data-testid="im-funds-red-field-allocator_id"
            value={form.allocator_id}
            onChange={(e) => update("allocator_id", e.target.value)}
            placeholder="client-..."
          />
          {validation.errors.allocator_id ? (
            <p className="text-[11px] text-[var(--pnl-negative)]">{validation.errors.allocator_id}</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="red-share-class" className="text-xs">Share class</Label>
          <Input
            id="red-share-class"
            data-testid="im-funds-red-field-share_class"
            value={form.share_class}
            onChange={(e) => update("share_class", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="red-units" className="text-xs">Units to redeem</Label>
          <Input
            id="red-units"
            inputMode="decimal"
            data-testid="im-funds-red-field-units_to_redeem"
            value={form.units_to_redeem}
            onChange={(e) => update("units_to_redeem", e.target.value)}
            placeholder="100000.00"
          />
          {validation.errors.units_to_redeem ? (
            <p className="text-[11px] text-[var(--pnl-negative)]">{validation.errors.units_to_redeem}</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="red-destination" className="text-xs">Destination (IBAN / wire ref / on-chain addr)</Label>
          <Input
            id="red-destination"
            data-testid="im-funds-red-field-destination"
            value={form.destination}
            onChange={(e) => update("destination", e.target.value)}
            placeholder="iban:GB82..."
          />
          {validation.errors.destination ? (
            <p className="text-[11px] text-[var(--pnl-negative)]">{validation.errors.destination}</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="red-grace" className="text-xs">Grace period (days, default 5)</Label>
          <Input
            id="red-grace"
            inputMode="numeric"
            data-testid="im-funds-red-field-grace_period_days"
            value={form.grace_period_days}
            onChange={(e) => update("grace_period_days", e.target.value)}
          />
          {validation.errors.grace_period_days ? (
            <p className="text-[11px] text-[var(--pnl-negative)]">{validation.errors.grace_period_days}</p>
          ) : null}
        </div>
        {submitError ? (
          <p className="text-sm text-[var(--pnl-negative)]" data-testid="im-funds-red-submit-error">{submitError}</p>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            data-testid="im-funds-red-submit"
            disabled={!validation.ok || submitting}
          >
            {submitting ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
