"use client";

import { PageHeader } from "@/components/shared/page-header";
import * as React from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Building2,
  Plus,
  ArrowLeft,
  Users,
  Key,
  Database,
  CreditCard,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";
import { useOrganizationsList, useSubscriptions } from "@/hooks/api/use-organizations";
import { ApiError } from "@/components/shared/api-error";

import { ClientsOrgDetail } from "./clients-org-detail";
import type { Organization, Subscription } from "./clients-types";
import { TIERS } from "./clients-types";
import { formatNumber } from "@/lib/utils/formatters";

export default function ClientsManagementPage() {
  const {
    data: orgsApiData,
    isLoading: orgsLoading,
    isError: orgsIsError,
    error: orgsError,
    refetch: refetchOrgs,
  } = useOrganizationsList();
  const {
    data: subsApiData,
    isLoading: subsLoading,
    isError: subsIsError,
    error: subsError,
    refetch: refetchSubs,
  } = useSubscriptions();

  const INITIAL_ORGS: Organization[] = ((orgsApiData as any)?.data ?? []).map((o: any) => ({
    id: o.id ?? "",
    name: o.name ?? "",
    type: o.type ?? "client",
    status: o.status ?? "active",
    memberCount: o.memberCount ?? 0,
    subscriptionTier: o.subscriptionTier ?? "starter",
    createdAt: o.createdAt ?? "",
    monthlyFee: o.monthlyFee ?? 0,
    apiKeys: o.apiKeys ?? 0,
    usageGb: o.usageGb ?? 0,
  }));
  const INITIAL_SUBS: Subscription[] = ((subsApiData as any)?.data ?? []).map((s: any) => ({
    orgId: s.orgId ?? "",
    tier: s.tier ?? "",
    entitlements: s.entitlements ?? [],
    startDate: s.startDate ?? "",
    renewalDate: s.renewalDate ?? "",
    monthlyFee: s.monthlyFee ?? 0,
    managementFeePct: s.managementFeePct,
    performanceFeePct: s.performanceFeePct,
    dataFeePct: s.dataFeePct,
    aumUsd: s.aumUsd,
  }));

  const isApiLoading = orgsLoading || subsLoading;

  const [orgs, setOrgs] = React.useState<Organization[]>([]);
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([]);

  // Sync API data into local state for mutation
  React.useEffect(() => {
    if (INITIAL_ORGS.length > 0 && orgs.length === 0) setOrgs(INITIAL_ORGS);
  }, [INITIAL_ORGS, orgs.length]);
  React.useEffect(() => {
    if (INITIAL_SUBS.length > 0 && subscriptions.length === 0) setSubscriptions(INITIAL_SUBS);
  }, [INITIAL_SUBS, subscriptions.length]);
  const addOrg = (org: Organization) => setOrgs((prev) => [...prev, org]);
  const updateOrg = (id: string, updates: Partial<Organization>) =>
    setOrgs((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
  const updateSubscription = (orgId: string, updates: Partial<Subscription>) =>
    setSubscriptions((prev) => prev.map((s) => (s.orgId === orgId ? { ...s, ...updates } : s)));
  const addSubscription = (sub: Subscription) => setSubscriptions((prev) => [...prev, sub]);
  const [selectedOrgId, setSelectedOrgId] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);

  // Create form state
  const [newName, setNewName] = React.useState("");
  const [newType, setNewType] = React.useState<"internal" | "client">("client");
  const [newTier, setNewTier] = React.useState<(typeof TIERS)[number]>("professional");

  const selectedOrg = orgs.find((o) => o.id === selectedOrgId);
  const selectedSub = subscriptions.find((s) => s.orgId === selectedOrgId);

  function handleCreateOrg() {
    if (!newName.trim()) {
      toast.error("Organization name is required");
      return;
    }
    const id = `org-${String(Date.now()).slice(-6)}`;
    const monthlyFee =
      newTier === "starter" ? 1500 : newTier === "professional" ? 5500 : newTier === "institutional" ? 15000 : 25000;

    const org: Organization = {
      id,
      name: newName.trim(),
      type: newType,
      status: "onboarding",
      memberCount: 0,
      subscriptionTier: newTier,
      monthlyFee,
      apiKeys: 0,
      usageGb: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };
    addOrg(org);
    addSubscription({
      orgId: id,
      tier: newTier,
      entitlements: ["data-basic"],
      startDate: new Date().toISOString().split("T")[0],
      renewalDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
      monthlyFee,
      managementFeePct: newTier === "enterprise" ? 1.0 : newTier === "institutional" ? 1.5 : 2.0,
      performanceFeePct: 20,
      dataFeePct: 0.05,
      aumUsd: 0,
    });
    toast.success("Organization created", {
      description: `${org.name} added as ${org.type} (${org.subscriptionTier})`,
    });
    setNewName("");
    setNewType("client");
    setNewTier("professional");
    setCreateOpen(false);
  }

  function handleTierChange(orgId: string, tier: (typeof TIERS)[number]) {
    const monthlyFee =
      tier === "starter" ? 1500 : tier === "professional" ? 5500 : tier === "institutional" ? 15000 : 25000;
    updateOrg(orgId, { subscriptionTier: tier, monthlyFee });
    updateSubscription(orgId, { tier, monthlyFee });
    const org = orgs.find((o) => o.id === orgId);
    toast.success("Subscription updated", {
      description: `${org?.name} moved to ${tier}`,
    });
  }

  // Multi-step onboarding state
  const [onboardOpen, setOnboardOpen] = React.useState(false);
  const [onboardStep, setOnboardStep] = React.useState(0);
  const [onboardData, setOnboardData] = React.useState({
    name: "",
    type: "client" as "internal" | "client",
    tier: "professional" as (typeof TIERS)[number],
    contactEmail: "",
    contactName: "",
    strategies: [] as string[],
    venues: [] as string[],
    maxDrawdown: "10",
    maxPositionSize: "1000000",
    maxLeverage: "3",
  });

  const STRATEGY_OPTIONS = [
    "CeFi Momentum",
    "CeFi Mean-Reversion",
    "CeFi Market-Making",
    "TradFi ML-Directional",
    "TradFi Options-ML",
    "DeFi Basis-Trade",
    "DeFi AAVE-Lending",
    "DeFi AMM-LP",
    "Sports Arbitrage",
    "Sports Value-Betting",
  ];
  const VENUE_OPTIONS = [
    "Binance",
    "Coinbase",
    "Deribit",
    "OKX",
    "Bybit",
    "Hyperliquid",
    "Aave",
    "Uniswap",
    "Polymarket",
    "Betfair",
  ];

  function handleOnboardComplete() {
    if (!onboardData.name.trim()) {
      toast.error("Organization name is required");
      return;
    }
    const monthlyFee =
      onboardData.tier === "starter"
        ? 1500
        : onboardData.tier === "professional"
          ? 5500
          : onboardData.tier === "institutional"
            ? 15000
            : 25000;
    const id = `org-${String(Date.now()).slice(-6)}`;
    const org: Organization = {
      id,
      name: onboardData.name.trim(),
      type: onboardData.type,
      status: "onboarding",
      memberCount: 0,
      subscriptionTier: onboardData.tier,
      monthlyFee,
      apiKeys: 0,
      usageGb: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };
    addOrg(org);
    addSubscription({
      orgId: id,
      tier: onboardData.tier,
      entitlements: ["data-basic"],
      startDate: new Date().toISOString().split("T")[0],
      renewalDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
      monthlyFee,
      managementFeePct: onboardData.tier === "enterprise" ? 1.0 : onboardData.tier === "institutional" ? 1.5 : 2.0,
      performanceFeePct: 20,
      dataFeePct: 0.05,
      aumUsd: 0,
    });
    toast.success("Client onboarded", {
      description: `${org.name} created with ${onboardData.strategies.length} strategies and ${onboardData.venues.length} venues`,
    });
    setOnboardData({
      name: "",
      type: "client",
      tier: "professional",
      contactEmail: "",
      contactName: "",
      strategies: [],
      venues: [],
      maxDrawdown: "10",
      maxPositionSize: "1000000",
      maxLeverage: "3",
    });
    setOnboardStep(0);
    setOnboardOpen(false);
  }

  const ONBOARD_STEPS = ["Client Details", "Strategy Selection", "Risk Config", "Review"];

  if (isApiLoading)
    return (
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6 space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );

  const clientsError = (orgsError ?? subsError) as Error | null;
  if ((orgsIsError || subsIsError) && clientsError) {
    return (
      <div className="p-6">
        <ApiError
          error={clientsError}
          onRetry={() => {
            void refetchOrgs();
            void refetchSubs();
          }}
          title="Failed to load clients"
        />
      </div>
    );
  }

  // Detail view
  if (selectedOrg) {
    return (
      <ClientsOrgDetail
        selectedOrg={selectedOrg}
        selectedSub={selectedSub}
        onBack={() => setSelectedOrgId(null)}
        onTierChange={handleTierChange}
      />
    );
  }

  // List view
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="container px-4 py-6 md:px-6">
          <div className="flex items-center justify-between">
            <PageHeader
              title="Client Management"
              description="Manage client organizations, subscriptions, and access"
            />
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setOnboardOpen(true)}>
                <Plus className="mr-2 size-4" />
                Onboard Client
              </Button>
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Plus className="mr-2 size-4" />
                    Quick Create
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Organization</DialogTitle>
                    <DialogDescription>Add a new organization to the platform.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Organization Name <span className="text-destructive">*</span>
                      </label>
                      <Input
                        placeholder="e.g. Apex Trading Group"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Type</label>
                      <Select value={newType} onValueChange={(v) => setNewType(v as "internal" | "client")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">Client</SelectItem>
                          <SelectItem value="internal">Internal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Subscription Tier</label>
                      <Select value={newTier} onValueChange={(v) => setNewTier(v as (typeof TIERS)[number])}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIERS.map((t: (typeof TIERS)[number]) => (
                            <SelectItem key={t} value={t} className="capitalize">
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateOrg}>Create Organization</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 py-8 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map((org) => {
            const sub = subscriptions.find((s) => s.orgId === org.id);
            return (
              <Card
                key={org.id}
                className="cursor-pointer hover:border-foreground/20 transition-colors"
                onClick={() => setSelectedOrgId(org.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="size-4 text-muted-foreground" />
                      <CardTitle className="text-base">{org.name}</CardTitle>
                    </div>
                    <Badge
                      className={
                        org.status === "active"
                          ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                          : org.status === "onboarding"
                            ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                            : "bg-red-500/20 text-red-400"
                      }
                    >
                      {org.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {org.type === "internal" ? "Internal" : "Client"}: {org.memberCount} members
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Tier</p>
                      <p className="font-medium capitalize">{org.subscriptionTier}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly</p>
                      <p className="font-mono font-medium">${org.monthlyFee.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Usage</p>
                      <p className="font-mono font-medium">{org.usageGb} GB</p>
                    </div>
                  </div>
                  {sub && (sub.aumUsd ?? 0) > 0 && (
                    <div className="text-xs text-muted-foreground">
                      AUM: ${formatNumber((sub.aumUsd ?? 0) / 1_000_000, 1)}M: Mgmt: {sub.managementFeePct}%: Perf:{" "}
                      {sub.performanceFeePct}%
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Multi-Step Onboarding Modal */}
      <Dialog
        open={onboardOpen}
        onOpenChange={(open) => {
          setOnboardOpen(open);
          if (!open) setOnboardStep(0);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Onboard Client</DialogTitle>
            <DialogDescription>
              Step {onboardStep + 1} of {ONBOARD_STEPS.length}: {ONBOARD_STEPS[onboardStep]}
            </DialogDescription>
          </DialogHeader>
          {/* Step indicators */}
          <div className="flex items-center gap-1 py-2">
            {ONBOARD_STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-1 flex-1">
                <div
                  className={`size-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    i < onboardStep
                      ? "bg-emerald-500/20 text-emerald-400"
                      : i === onboardStep
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < onboardStep ? <Check className="size-3" /> : i + 1}
                </div>
                {i < ONBOARD_STEPS.length - 1 && (
                  <div className={`flex-1 h-px ${i < onboardStep ? "bg-emerald-500/40" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>

          <div className="space-y-4 py-2 min-h-[200px]">
            {/* Step 0: Client Details */}
            {onboardStep === 0 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Organization Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Apex Trading Group"
                    value={onboardData.name}
                    onChange={(e) => setOnboardData((d) => ({ ...d, name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contact Name</label>
                    <Input
                      placeholder="Primary contact"
                      value={onboardData.contactName}
                      onChange={(e) =>
                        setOnboardData((d) => ({
                          ...d,
                          contactName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contact Email</label>
                    <Input
                      type="email"
                      placeholder="contact@example.com"
                      value={onboardData.contactEmail}
                      onChange={(e) =>
                        setOnboardData((d) => ({
                          ...d,
                          contactEmail: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <Select
                      value={onboardData.type}
                      onValueChange={(v) =>
                        setOnboardData((d) => ({
                          ...d,
                          type: v as "internal" | "client",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="internal">Internal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subscription Tier</label>
                    <Select
                      value={onboardData.tier}
                      onValueChange={(v) =>
                        setOnboardData((d) => ({
                          ...d,
                          tier: v as (typeof TIERS)[number],
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIERS.map((t: (typeof TIERS)[number]) => (
                          <SelectItem key={t} value={t} className="capitalize">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* Step 1: Strategy Selection */}
            {onboardStep === 1 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Select strategies to activate for this client:</p>
                <div className="grid grid-cols-2 gap-2">
                  {STRATEGY_OPTIONS.map((s) => (
                    <label
                      key={s}
                      className="flex items-center gap-2 p-2 rounded border border-border hover:bg-muted/50 cursor-pointer text-sm"
                    >
                      <Checkbox
                        checked={onboardData.strategies.includes(s)}
                        onCheckedChange={(checked) =>
                          setOnboardData((d) => ({
                            ...d,
                            strategies: checked ? [...d.strategies, s] : d.strategies.filter((x) => x !== s),
                          }))
                        }
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Risk Config */}
            {onboardStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Configure risk limits for this client:</p>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Drawdown (%)</label>
                  <Input
                    type="number"
                    value={onboardData.maxDrawdown}
                    onChange={(e) =>
                      setOnboardData((d) => ({
                        ...d,
                        maxDrawdown: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Position Size ($)</label>
                  <Input
                    type="number"
                    value={onboardData.maxPositionSize}
                    onChange={(e) =>
                      setOnboardData((d) => ({
                        ...d,
                        maxPositionSize: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Leverage</label>
                  <Input
                    type="number"
                    value={onboardData.maxLeverage}
                    onChange={(e) =>
                      setOnboardData((d) => ({
                        ...d,
                        maxLeverage: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-3 pt-2">
                  <p className="text-sm font-medium">Venue Connections</p>
                  <div className="grid grid-cols-2 gap-2">
                    {VENUE_OPTIONS.map((v) => (
                      <label
                        key={v}
                        className="flex items-center gap-2 p-2 rounded border border-border hover:bg-muted/50 cursor-pointer text-sm"
                      >
                        <Checkbox
                          checked={onboardData.venues.includes(v)}
                          onCheckedChange={(checked) =>
                            setOnboardData((d) => ({
                              ...d,
                              venues: checked ? [...d.venues, v] : d.venues.filter((x) => x !== v),
                            }))
                          }
                        />
                        {v}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {onboardStep === 3 && (
              <div className="space-y-3 text-sm">
                <div className="rounded border p-3 space-y-2">
                  <p className="font-medium">Client Details</p>
                  <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                    <span>Name:</span>
                    <span className="text-foreground">{onboardData.name || "-"}</span>
                    <span>Type:</span>
                    <span className="text-foreground capitalize">{onboardData.type}</span>
                    <span>Tier:</span>
                    <span className="text-foreground capitalize">{onboardData.tier}</span>
                    <span>Contact:</span>
                    <span className="text-foreground">
                      {onboardData.contactName || "-"} ({onboardData.contactEmail || "-"})
                    </span>
                  </div>
                </div>
                <div className="rounded border p-3 space-y-2">
                  <p className="font-medium">Strategies ({onboardData.strategies.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {onboardData.strategies.length > 0 ? (
                      onboardData.strategies.map((s) => (
                        <Badge key={s} variant="outline" className="text-xs">
                          {s}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">None selected</span>
                    )}
                  </div>
                </div>
                <div className="rounded border p-3 space-y-2">
                  <p className="font-medium">Risk Limits</p>
                  <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                    <span>Max Drawdown:</span>
                    <span className="text-foreground font-mono">{onboardData.maxDrawdown}%</span>
                    <span>Max Position:</span>
                    <span className="text-foreground font-mono">
                      ${Number(onboardData.maxPositionSize).toLocaleString()}
                    </span>
                    <span>Max Leverage:</span>
                    <span className="text-foreground font-mono">{onboardData.maxLeverage}x</span>
                  </div>
                </div>
                <div className="rounded border p-3 space-y-2">
                  <p className="font-medium">Venues ({onboardData.venues.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {onboardData.venues.length > 0 ? (
                      onboardData.venues.map((v) => (
                        <Badge key={v} variant="outline" className="text-xs">
                          {v}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">None selected</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {onboardStep > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setOnboardStep((s) => s - 1)}>
                  <ChevronLeft className="mr-1 size-4" /> Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setOnboardOpen(false);
                  setOnboardStep(0);
                }}
              >
                Cancel
              </Button>
              {onboardStep < ONBOARD_STEPS.length - 1 ? (
                <Button onClick={() => setOnboardStep((s) => s + 1)}>
                  Next <ChevronRight className="ml-1 size-4" />
                </Button>
              ) : (
                <Button onClick={handleOnboardComplete}>
                  <Check className="mr-1 size-4" /> Complete Onboarding
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
