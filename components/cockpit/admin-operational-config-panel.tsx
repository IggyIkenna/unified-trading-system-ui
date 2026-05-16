"use client";

/**
 * AdminOperationalConfigPanel — surfaces the unversioned, audited operational
 * config that lives outside the immutable bundle.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.md §4.8 (configuration
 * lifecycle) — the "everything not in the bundle" surface:
 *
 *   - TreasuryOperationalConfig — wallet routing (mutable, audited, no version
 *     bump). RuntimeOverride.treasury_route writes through this.
 *   - AccountConnectivityConfig — CeFi accounts + DeFi wallets + signer
 *     profiles + outbound endpoints. Promote validation reads it via
 *     `hasCefiAccountsForVenues` / `hasDefiWalletsForProtocols`.
 *
 * Renders on Terminal/Ops mode (operator view) and on the dedicated `surface=ops`
 * admin route group. This is the "Ops & Controls" buyer-facing surface.
 */

import { Activity, Database, KeyRound, Network, Wallet } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type {
  AccountConnectivityConfig,
  CefiVenueAccount,
  ConnectivityStatus,
  DefiWallet,
  OutboundEndpoint,
  SignerProfile,
} from "@/lib/architecture-v2/account-connectivity-config";
import type { TreasuryOperationalConfig } from "@/lib/architecture-v2/treasury-config";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<ConnectivityStatus, string> = {
  connected: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  degraded: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  disconnected: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  unknown: "border-border/40 bg-muted/20 text-muted-foreground",
};

interface AdminOperationalConfigPanelProps {
  readonly treasury: TreasuryOperationalConfig;
  readonly connectivity: AccountConnectivityConfig;
  readonly className?: string;
}

export function AdminOperationalConfigPanel({ treasury, connectivity, className }: AdminOperationalConfigPanelProps) {
  const cefiByStatus = React.useMemo(() => groupByStatus(connectivity.cefiAccounts), [connectivity.cefiAccounts]);
  const defiByStatus = React.useMemo(() => groupByStatus(connectivity.defiWallets), [connectivity.defiWallets]);

  return (
    <Card
      className={cn("border-border/50 bg-gradient-to-br from-background to-muted/15", className)}
      data-testid="admin-operational-config-panel"
    >
      <CardContent className="p-3 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="size-3.5 text-violet-400" aria-hidden />
            <h3 className="text-sm font-semibold tracking-tight">Operational config — Treasury &amp; Connectivity</h3>
          </div>
          <Badge variant="outline" className="text-[9px] font-mono">
            unversioned · audited
          </Badge>
        </div>

        <p className="text-[11px] leading-snug text-muted-foreground">
          Operational config sits outside the immutable bundle. Mutations route through the audit log without bumping a
          bundle version — the bundle pins which wallets / venues are <em>permitted</em>; this panel pins which are{" "}
          <em>active right now</em>.
        </p>

        {/* Treasury operational */}
        <section className="space-y-2" data-testid="admin-treasury-section">
          <SectionHeader icon={<Wallet className="size-3" />} label="Treasury routing" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <KeyValue label="Inbound default" value={treasury.inboundDefaultWalletId} />
            <KeyValue label="Outbound default" value={treasury.outboundDefaultWalletId} />
            <KeyValue label="Fee bucket" value={treasury.feeBucketWalletId} />
            <KeyValue label="Settlement venue" value={treasury.settlementVenueId ?? "—"} />
            <KeyValue label="Last updated by" value={treasury.lastUpdatedBy} />
            <KeyValue label="Last audit event" value={treasury.lastAuditEventId} />
          </div>
        </section>

        {/* CeFi accounts */}
        <section className="space-y-2" data-testid="admin-cefi-section">
          <SectionHeader
            icon={<Database className="size-3" />}
            label={`CeFi venue accounts (${cefiByStatus.connected}/${connectivity.cefiAccounts.length} connected)`}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {connectivity.cefiAccounts.map((acc) => (
              <CefiAccountCard key={acc.accountId} account={acc} />
            ))}
          </div>
        </section>

        {/* DeFi wallets */}
        <section className="space-y-2" data-testid="admin-defi-section">
          <SectionHeader
            icon={<Wallet className="size-3" />}
            label={`DeFi wallets (${defiByStatus.connected}/${connectivity.defiWallets.length} connected)`}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {connectivity.defiWallets.map((w) => (
              <DefiWalletCard key={w.walletId} wallet={w} />
            ))}
          </div>
        </section>

        {/* Signer profiles */}
        <section className="space-y-2" data-testid="admin-signer-section">
          <SectionHeader icon={<KeyRound className="size-3" />} label="Signer profiles" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {connectivity.signerProfiles.map((s) => (
              <SignerProfileCard key={s.signerProfileId} profile={s} />
            ))}
          </div>
        </section>

        {/* Outbound endpoints */}
        {connectivity.outboundEndpoints.length > 0 ? (
          <section className="space-y-2" data-testid="admin-outbound-section">
            <SectionHeader icon={<Network className="size-3" />} label="Outbound signal endpoints (Signals-Out)" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {connectivity.outboundEndpoints.map((e) => (
                <OutboundEndpointCard key={e.endpointId} endpoint={e} />
              ))}
            </div>
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SectionHeader({ icon, label }: { readonly icon: React.ReactNode; readonly label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground/70" aria-hidden>
        {icon}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{label}</span>
    </div>
  );
}

function KeyValue({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded border border-border/40 bg-muted/10 p-2 space-y-0.5">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground/60">{label}</p>
      <p className="text-[11px] font-mono truncate" title={value}>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { readonly status: ConnectivityStatus }) {
  return (
    <Badge variant="outline" className={cn("text-[9px] font-mono", STATUS_TONE[status])}>
      {status}
    </Badge>
  );
}

function CefiAccountCard({ account }: { readonly account: CefiVenueAccount }) {
  return (
    <div
      className="rounded border border-border/40 bg-card/50 p-2.5 space-y-1.5"
      data-testid={`cefi-account-${account.accountId}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-tight">{account.venueId}</span>
        <StatusBadge status={account.status} />
      </div>
      <p className="text-[10px] font-mono text-muted-foreground/80 truncate">{account.accountId}</p>
      <div className="flex flex-wrap gap-1">
        {account.permissions.map((p) => (
          <Badge key={p} variant="secondary" className="text-[9px] font-mono">
            {p}
          </Badge>
        ))}
        {account.subaccount ? (
          <Badge variant="secondary" className="text-[9px] font-mono">
            sub: {account.subaccount}
          </Badge>
        ) : null}
      </div>
      {account.accountOrMandateId ? (
        <p className="text-[9px] text-muted-foreground/60">mandate: {account.accountOrMandateId}</p>
      ) : null}
    </div>
  );
}

function DefiWalletCard({ wallet }: { readonly wallet: DefiWallet }) {
  return (
    <div
      className="rounded border border-border/40 bg-card/50 p-2.5 space-y-1.5"
      data-testid={`defi-wallet-${wallet.walletId}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-tight">{wallet.walletId}</span>
        <StatusBadge status={wallet.status} />
      </div>
      <p className="text-[10px] font-mono text-muted-foreground/80 truncate" title={wallet.address}>
        {wallet.address}
      </p>
      <div className="flex flex-wrap gap-1">
        <Badge variant="secondary" className="text-[9px] font-mono">
          chain {wallet.chainId}
        </Badge>
        <Badge variant="secondary" className="text-[9px] font-mono">
          {wallet.signerKind}
        </Badge>
      </div>
      <p className="text-[9px] text-muted-foreground/60">protocols: {wallet.approvedProtocols.join(", ")}</p>
    </div>
  );
}

function SignerProfileCard({ profile }: { readonly profile: SignerProfile }) {
  return (
    <div
      className="rounded border border-border/40 bg-card/50 p-2 space-y-1"
      data-testid={`signer-profile-${profile.signerProfileId}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono">{profile.provider}</span>
        <StatusBadge status={profile.status} />
      </div>
      <p className="text-[9px] font-mono text-muted-foreground/70 truncate" title={profile.providerRef}>
        {profile.providerRef}
      </p>
    </div>
  );
}

function OutboundEndpointCard({ endpoint }: { readonly endpoint: OutboundEndpoint }) {
  return (
    <div
      className="rounded border border-border/40 bg-card/50 p-2.5 space-y-1.5"
      data-testid={`outbound-endpoint-${endpoint.endpointId}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-tight">{endpoint.counterpartyId}</span>
        <StatusBadge status={endpoint.status} />
      </div>
      <p className="text-[10px] font-mono text-muted-foreground/80 truncate" title={endpoint.url}>
        {endpoint.url}
      </p>
    </div>
  );
}

function groupByStatus<T extends { status: ConnectivityStatus }>(items: readonly T[]) {
  const counts: Record<ConnectivityStatus, number> = {
    connected: 0,
    degraded: 0,
    disconnected: 0,
    unknown: 0,
  };
  for (const item of items) {
    counts[item.status] = (counts[item.status] ?? 0) + 1;
  }
  return counts;
}
