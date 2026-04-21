"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { FormWidget, useFormSubmit } from "@/components/shared/form-widget";
import {
  CEFI_VENUES,
  NETWORKS,
  SUB_ACCOUNT_VENUES,
  SUB_ACCOUNTS,
  TRANSFER_ASSETS,
} from "@/lib/config/services/accounts.config";
import { formatCurrency } from "@/lib/reference-data";
import type { BalanceRecord } from "@/lib/types/accounts";
import { CheckCircle2, Clock, Copy } from "lucide-react";
import { toast } from "sonner";
import { useExecutionMode } from "@/lib/execution-mode-context";
import { useSubmitTransfer, type SubmitTransferRequest } from "@/hooks/api/use-submit-transfer";
import { useAccountsData } from "./accounts-data-context";

type TransferType = "venue-to-venue" | "sub-account" | "withdraw" | "deposit";

function freeUsdForVenue(venue: string, balances: BalanceRecord[]): number {
  return balances.filter((b) => b.venue === venue).reduce((sum, b) => sum + b.free, 0);
}

const TYPE_PILLS: { id: TransferType; label: string }[] = [
  { id: "venue-to-venue", label: "Venue" },
  { id: "sub-account", label: "Sub ↔ Main" },
  { id: "withdraw", label: "Withdraw" },
  { id: "deposit", label: "Deposit" },
];

export function AccountsTransferWidget(_props: WidgetComponentProps) {
  const { balances, isLoading, error: contextError, addTransferEntry } = useAccountsData();
  const { isBatch, isPaper } = useExecutionMode();
  const { isSubmitting, error: submitError, clearError, handleSubmit } = useFormSubmit();
  const submitTransfer = useSubmitTransfer();
  const [transferType, setTransferType] = React.useState<TransferType>("venue-to-venue");
  const [fromVenue, setFromVenue] = React.useState<string>(CEFI_VENUES[0]);
  const [toVenue, setToVenue] = React.useState<string>(CEFI_VENUES[1]);
  const [asset, setAsset] = React.useState<string>(TRANSFER_ASSETS[0]);
  const [amount, setAmount] = React.useState("");
  const [toAddress, setToAddress] = React.useState("");
  const [network, setNetwork] = React.useState<string>(NETWORKS[0]);
  const [direction, setDirection] = React.useState<"sub-to-main" | "main-to-sub">("sub-to-main");
  const [subAccount, setSubAccount] = React.useState(SUB_ACCOUNTS[0] as string);
  const [copied, setCopied] = React.useState(false);

  const availableUsd = freeUsdForVenue(fromVenue, balances);
  const amountNum = parseFloat(amount) || 0;

  const handleCopyAddress = () => {
    void navigator.clipboard.writeText("0x7a23b8c1d9e4f6a2b3c5d7e8f0a1b2c3d4e5f691");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Gate real-money operations in batch mode (historical replay is read-only).
  // Paper mode is allowed (simulated transfers are useful); callers append a
  // "(Paper)" label downstream via the context.
  const guardBatch = (): boolean => {
    if (isBatch) {
      toast.info("Read-only in batch mode", {
        description: "Transfers are disabled while replaying historical data. Switch to Live or Paper to continue.",
      });
      return false;
    }
    return true;
  };

  const idempotencyKey = (): string =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `tx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const submitBackend = (req: SubmitTransferRequest, onSettled: () => void) => {
    submitTransfer.mutate(req, {
      onSuccess: (result) => {
        toast.success("Transfer submitted", {
          description: `${result.transfer_id} (${result.status})`,
        });
        onSettled();
      },
      onError: (err) => {
        toast.error("Transfer failed", { description: err.message ?? "Unexpected error." });
      },
    });
  };

  const handleVenueTransfer = () => {
    if (!guardBatch()) return;
    addTransferEntry({
      type: isPaper ? "Venue→Venue (Paper)" : "Venue→Venue",
      from: fromVenue,
      to: toVenue,
      asset,
      amount: amountNum,
      status: "Pending",
    });
    submitBackend(
      {
        direction: "cross_venue",
        from_account_id: fromVenue,
        to_account_id: toVenue,
        from_venue: fromVenue,
        to_venue: toVenue,
        asset,
        amount: String(amountNum),
        idempotency_key: idempotencyKey(),
      },
      () => setAmount(""),
    );
  };

  const handleSubAccountTransfer = () => {
    if (!guardBatch()) return;
    const [from, to] =
      direction === "sub-to-main" ? [subAccount, `${fromVenue} Main`] : [`${fromVenue} Main`, subAccount];
    addTransferEntry({
      type: isPaper ? "Sub↔Main (Paper)" : "Sub↔Main",
      from,
      to,
      asset,
      amount: amountNum,
      status: "Processing",
    });
    submitBackend(
      {
        direction: "internal",
        from_account_id: from,
        to_account_id: to,
        from_venue: fromVenue,
        to_venue: fromVenue,
        asset,
        amount: String(amountNum),
        idempotency_key: idempotencyKey(),
      },
      () => setAmount(""),
    );
  };

  const handleWithdraw = () => {
    if (!guardBatch()) return;
    const shortAddr = toAddress.length > 12 ? `${toAddress.slice(0, 6)}…${toAddress.slice(-4)}` : toAddress;
    addTransferEntry({
      type: isPaper ? "Withdraw (Paper)" : "Withdraw",
      from: fromVenue,
      to: shortAddr,
      asset,
      amount: amountNum,
      status: "Pending",
    });
    submitBackend(
      {
        direction: "withdraw",
        from_account_id: fromVenue,
        to_account_id: toAddress,
        from_venue: fromVenue,
        to_venue: "external",
        asset,
        amount: String(amountNum),
        network,
        address: toAddress,
        idempotency_key: idempotencyKey(),
      },
      () => {
        setAmount("");
        setToAddress("");
      },
    );
  };

  const handleDepositConfirm = () => {
    if (!guardBatch()) return;
    addTransferEntry({
      type: isPaper ? "Deposit (Paper)" : "Deposit",
      from: "External",
      to: fromVenue,
      asset: "—",
      amount: 0,
      status: "Pending",
    });
    submitBackend(
      {
        direction: "deposit",
        from_account_id: "external",
        to_account_id: fromVenue,
        from_venue: "external",
        to_venue: fromVenue,
        asset,
        amount: "0",
        network,
        idempotency_key: idempotencyKey(),
      },
      () => {},
    );
  };

  const displayError = contextError?.message ?? submitError ?? null;

  if (!isLoading && balances.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center">
        <p className="text-xs text-muted-foreground">No accounts available. Connect a venue to initiate a transfer.</p>
      </div>
    );
  }

  return (
    <FormWidget isLoading={isLoading} error={displayError} onClearError={clearError} className="px-1 pb-1">
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Transfer type</span>
        <div className="grid grid-cols-4 gap-1">
          {TYPE_PILLS.map((p) => (
            <Button
              key={p.id}
              type="button"
              variant={transferType === p.id ? "default" : "outline"}
              size="sm"
              className="h-8 text-micro px-1"
              onClick={() => setTransferType(p.id)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {transferType === "venue-to-venue" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">From</label>
              <Select value={fromVenue} onValueChange={setFromVenue}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CEFI_VENUES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">To</label>
              <Select value={toVenue} onValueChange={setToVenue}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CEFI_VENUES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Asset</label>
            <Select value={asset} onValueChange={setAsset}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSFER_ASSETS.map((a) => (
                  <SelectItem key={a} value={a}>
                    <span className="font-mono">{a}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Amount</label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-8 font-mono text-xs"
            />
          </div>
          <div className="p-2 rounded-md border bg-muted/30 space-y-1.5 text-xs">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground shrink-0">Available (venue free USD)</span>
              <span className="font-mono text-right">${formatCurrency(availableUsd)}</span>
            </div>
            <div className="flex items-center justify-between text-micro text-muted-foreground">
              <span>Asset</span>
              <span className="font-mono">{asset}</span>
            </div>
            <div className="flex items-center gap-1 text-micro text-muted-foreground">
              <Clock className="size-3 shrink-0" />
              ~30 min (chain confirmation)
            </div>
          </div>
          <Button
            className="w-full h-8 text-xs"
            disabled={amountNum <= 0 || fromVenue === toVenue || isSubmitting || isBatch}
            onClick={() => handleSubmit(handleVenueTransfer)}
          >
            {isBatch ? "Disabled in Batch" : "Initiate Transfer"}
          </Button>
        </div>
      )}

      {transferType === "sub-account" && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Venue</label>
            <Select value={fromVenue} onValueChange={setFromVenue}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUB_ACCOUNT_VENUES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <Button
              type="button"
              variant={direction === "sub-to-main" ? "default" : "outline"}
              size="sm"
              className="text-micro h-8"
              onClick={() => setDirection("sub-to-main")}
            >
              Sub → Main
            </Button>
            <Button
              type="button"
              variant={direction === "main-to-sub" ? "default" : "outline"}
              size="sm"
              className="text-micro h-8"
              onClick={() => setDirection("main-to-sub")}
            >
              Main → Sub
            </Button>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Sub-account</label>
            <Select value={subAccount} onValueChange={setSubAccount}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUB_ACCOUNTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Asset</label>
            <Select value={asset} onValueChange={setAsset}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSFER_ASSETS.map((a) => (
                  <SelectItem key={a} value={a}>
                    <span className="font-mono">{a}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Amount</label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-8 font-mono text-xs"
            />
          </div>
          <div className="p-2 rounded-md border bg-muted/30 text-micro">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Speed</span>
              <span className="text-emerald-400">Instant</span>
            </div>
          </div>
          <Button
            className="w-full h-8 text-xs"
            disabled={amountNum <= 0 || isSubmitting || isBatch}
            onClick={() => handleSubmit(handleSubAccountTransfer)}
          >
            {isBatch ? "Disabled in Batch" : "Transfer"}
          </Button>
        </div>
      )}

      {transferType === "withdraw" && (
        <div className="space-y-3">
          {/* From venue + available balance inline */}
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">From venue</label>
              <Select value={fromVenue} onValueChange={setFromVenue}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CEFI_VENUES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="shrink-0 pb-1.5 text-right">
              <p className="text-micro text-muted-foreground">Available</p>
              <p className="text-xs font-mono">${formatCurrency(availableUsd)}</p>
            </div>
          </div>

          {/* To address — full row */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">To address</label>
            <Input
              placeholder="0x… or ENS"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              className="h-8 font-mono text-xs"
            />
          </div>

          {/* Network / Asset / Amount in one row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Network</label>
              <Select value={network} onValueChange={setNetwork}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NETWORKS.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Asset</label>
              <Select value={asset} onValueChange={setAsset}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSFER_ASSETS.map((a) => (
                    <SelectItem key={a} value={a}>
                      <span className="font-mono">{a}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Amount
                <span className="ml-1 text-muted-foreground/60">· fee ~$2.50</span>
              </label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-8 font-mono text-xs"
              />
            </div>
          </div>

          <Button
            className="w-full h-8 text-xs"
            disabled={amountNum <= 0 || !toAddress || isSubmitting || isBatch}
            onClick={() => handleSubmit(handleWithdraw)}
          >
            {isBatch ? "Disabled in Batch" : "Withdraw"}
          </Button>
        </div>
      )}

      {transferType === "deposit" && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Deposit to</label>
            <Select value={fromVenue} onValueChange={setFromVenue}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CEFI_VENUES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Network</label>
            <Select value={network} onValueChange={setNetwork}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NETWORKS.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="p-2 rounded-md border bg-muted/30 space-y-2">
            <div className="space-y-1">
              <p className="text-micro text-muted-foreground">Deposit address</p>
              <div className="flex items-center gap-1.5">
                <code className="text-micro font-mono bg-background px-1.5 py-0.5 rounded flex-1 truncate">
                  0x7a23b8c1d9e4f6a2b3c5d7e8f0a1b2c3d4e5f691
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-micro shrink-0 px-2"
                  onClick={handleCopyAddress}
                >
                  {copied ? <CheckCircle2 className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                  {copied ? "OK" : "Copy"}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-md border border-dashed border-muted-foreground/30 bg-background">
              <span className="text-micro text-muted-foreground">QR</span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full h-8 text-xs"
            disabled={isBatch}
            onClick={() => handleSubmit(handleDepositConfirm)}
          >
            {isBatch ? "Disabled in Batch" : "I've sent the deposit"}
          </Button>
        </div>
      )}
    </FormWidget>
  );
}
