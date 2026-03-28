"use client";

import { EntityLink } from "@/components/trading/entity-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Globe,
  History,
  Key,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Shield,
  Users,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { clients, riskLimits, strategyConfigs, strategySchemas, venues } from "./config-page-schema";

export default function ConfigPageClient() {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("clients");
  const [showNewModal, setShowNewModal] = React.useState(false);
  const [reloading, setReloading] = React.useState(false);

  // Config editor state
  const [editingStrategy, setEditingStrategy] = React.useState<string | null>(null);
  const [editedParams, setEditedParams] = React.useState<Record<string, number | string | boolean | string[]>>({});

  // Hot-reload config trigger
  const handleConfigReload = async () => {
    setReloading(true);
    try {
      await apiFetch("/api/config/reload", token, { method: "POST" });
      toast.success("Configuration reloaded successfully");
    } catch {
      toast.error("Failed to reload configuration");
    } finally {
      setReloading(false);
    }
  };

  // Initialize edited params when opening editor
  const openConfigEditor = (strategyId: string) => {
    const config = strategySchemas[strategyId];
    if (config) {
      const initialParams: Record<string, number | string | boolean | string[]> = {};
      config.params.forEach((p) => {
        initialParams[p.key] = p.value;
      });
      setEditedParams(initialParams);
    }
    setEditingStrategy(strategyId);
  };

  // Get changed parameters
  const getChangedParams = () => {
    if (!editingStrategy) return [];
    const config = strategySchemas[editingStrategy];
    if (!config) return [];
    return config.params.filter((p) => {
      const original = p.value;
      const edited = editedParams[p.key];
      if (Array.isArray(original) && Array.isArray(edited)) {
        return JSON.stringify(original) !== JSON.stringify(edited);
      }
      return original !== edited;
    });
  };

  // Dynamic "New" button label based on active tab
  const getNewButtonLabel = () => {
    switch (activeTab) {
      case "clients":
        return "New Client";
      case "strategies":
        return "New Strategy";
      case "venues":
        return "New Venue";
      case "risk":
        return "New Risk Config";
      case "credentials":
        return "New Credential";
      default:
        return "New";
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Config & Onboarding</h1>
            <p className="text-sm text-muted-foreground">Manage clients, strategies, venues, and risk configuration</p>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" className="gap-2" disabled={reloading} onClick={handleConfigReload}>
              <RefreshCw className={`size-4 ${reloading ? "animate-spin" : ""}`} />
              {reloading ? "Reloading..." : "Hot Reload"}
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search configs..."
                className="pl-9 w-[240px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              className="gap-2"
              style={{ backgroundColor: "var(--surface-config)" }}
              onClick={() => setShowNewModal(true)}
            >
              <Plus className="size-4" />
              {getNewButtonLabel()}
            </Button>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="clients" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="clients" className="gap-2">
              <Users className="size-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="strategies" className="gap-2">
              <BarChart3 className="size-4" />
              Strategies
            </TabsTrigger>
            <TabsTrigger value="venues" className="gap-2">
              <Globe className="size-4" />
              Venues
            </TabsTrigger>
            <TabsTrigger value="risk" className="gap-2">
              <Shield className="size-4" />
              Risk Config
            </TabsTrigger>
            <TabsTrigger value="credentials" className="gap-2">
              <Key className="size-4" />
              Credentials
            </TabsTrigger>
          </TabsList>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {clients.map((client) => (
                <Card key={client.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="size-5 text-primary" />
                        </div>
                        <div>
                          <EntityLink
                            type="client"
                            id={client.id}
                            label={client.name}
                            className="text-lg font-semibold"
                          />
                          <p className="text-xs text-muted-foreground">
                            {client.strategies} strategies &bull; Risk: {client.riskProfile}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={client.status === "active" ? "default" : "secondary"}
                        className={
                          client.status === "active"
                            ? "bg-[var(--status-live)]/10 text-[var(--status-live)]"
                            : "bg-[var(--status-warning)]/10 text-[var(--status-warning)]"
                        }
                      >
                        {client.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">AUM</p>
                        <p className="text-lg font-semibold font-mono">${(client.aum / 1000000).toFixed(1)}m</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Venues</p>
                        <p className="text-sm">{client.venues.join(", ")}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-2">
                        <Settings className="size-4" />
                        Configure
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-2">
                        View Live
                        <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Strategies Tab */}
          <TabsContent value="strategies" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Strategy Configurations</CardTitle>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Plus className="size-4" />
                    New Strategy
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {strategyConfigs.map((strategy) => (
                  <div
                    key={strategy.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <EntityLink
                            type="strategy"
                            id={strategy.id}
                            label={strategy.name}
                            className="font-semibold"
                          />
                          <Badge variant="outline" className="font-mono text-xs">
                            v{strategy.version}
                          </Badge>
                          <Badge
                            variant={strategy.status === "live" ? "default" : "secondary"}
                            className={
                              strategy.status === "live"
                                ? "bg-[var(--status-live)]/10 text-[var(--status-live)]"
                                : "bg-[var(--status-warning)]/10 text-[var(--status-warning)]"
                            }
                          >
                            {strategy.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Clients: {strategy.clients.join(", ")} &bull; Published {strategy.lastPublished}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openConfigEditor(strategy.id)}
                        disabled={!strategySchemas[strategy.id]}
                      >
                        <Settings className="size-4 mr-1.5" />
                        Edit Config
                      </Button>
                      <Button variant="ghost" size="sm">
                        Backtest
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Venues Tab */}
          <TabsContent value="venues" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Venue Connections</CardTitle>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Plus className="size-4" />
                    Add Venue
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {venues.map((venue) => (
                  <div
                    key={venue.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {venue.status === "connected" ? (
                        <Wifi className="size-5 text-[var(--status-live)]" />
                      ) : (
                        <WifiOff className="size-5 text-[var(--status-warning)]" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{venue.name}</span>
                          <Badge variant="outline">{venue.type}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Latency: {venue.latency}ms &bull; Rate Limit: {venue.rateLimit}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={venue.status === "connected" ? "default" : "secondary"}
                        className={
                          venue.status === "connected"
                            ? "bg-[var(--status-live)]/10 text-[var(--status-live)]"
                            : "bg-[var(--status-warning)]/10 text-[var(--status-warning)]"
                        }
                      >
                        {venue.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Risk Config Tab */}
          <TabsContent value="risk" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Firm-Level Limits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {riskLimits.map((limit) => (
                    <div key={limit.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{limit.name}</span>
                        <span className="text-sm">
                          <span className="font-mono">{limit.value}</span>
                          <span className="text-muted-foreground"> / {limit.limit}</span>
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            limit.utilization < 70
                              ? "bg-[var(--status-live)]"
                              : limit.utilization < 90
                                ? "bg-[var(--status-warning)]"
                                : "bg-[var(--status-critical)]"
                          }`}
                          style={{ width: `${limit.utilization}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-right">{limit.utilization}% utilized</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Risk Hierarchy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="font-medium">Firm Limits</p>
                      <p className="text-xs text-muted-foreground">Global caps apply to all activity</p>
                    </div>
                    <div className="ml-4 border-l-2 border-border pl-4 space-y-3">
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="font-medium">Client Limits</p>
                        <p className="text-xs text-muted-foreground">Per-mandate risk appetites</p>
                      </div>
                      <div className="ml-4 border-l-2 border-border pl-4 space-y-3">
                        <div className="p-3 rounded-lg bg-muted/30">
                          <p className="font-medium">Strategy Limits</p>
                          <p className="text-xs text-muted-foreground">Per-strategy risk profiles</p>
                        </div>
                        <div className="ml-4 border-l-2 border-border pl-4">
                          <div className="p-3 rounded-lg bg-muted/30">
                            <p className="font-medium">Venue Limits</p>
                            <p className="text-xs text-muted-foreground">Venue-imposed margin rules</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Credentials Tab */}
          <TabsContent value="credentials" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">API Keys & Credentials</CardTitle>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Plus className="size-4" />
                    Add Credential
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Key className="size-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Secure Credential Management</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    API keys, wallet addresses, and authentication credentials for all connected venues and data
                    sources. Encrypted at rest with audit logging.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Config Editor Sheet */}
      <Sheet open={!!editingStrategy} onOpenChange={(open) => !open && setEditingStrategy(null)}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Settings className="size-5" />
              Edit Configuration
            </SheetTitle>
            <SheetDescription>{editingStrategy} - Modify parameters below</SheetDescription>
          </SheetHeader>

          {editingStrategy && strategySchemas[editingStrategy] && (
            <div className="space-y-6 py-6">
              {/* Schema Editor - Typed Controls */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground">Parameters</h4>
                {strategySchemas[editingStrategy].params.map((param) => (
                  <div key={param.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={param.key} className="text-sm font-medium">
                        {param.label}
                      </Label>
                      {param.type === "slider" && (
                        <span className="text-sm font-mono text-muted-foreground">
                          {(() => {
                            const val = editedParams[param.key];
                            return typeof val === "number" ? val.toFixed(param.step && param.step < 0.01 ? 4 : 2) : val;
                          })()}
                        </span>
                      )}
                    </div>

                    {param.type === "slider" && (
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-12">{param.min}</span>
                        <Slider
                          id={param.key}
                          min={param.min}
                          max={param.max}
                          step={param.step}
                          value={[
                            (() => {
                              const v = editedParams[param.key];
                              return typeof v === "number" ? v : 0;
                            })(),
                          ]}
                          onValueChange={(v) =>
                            setEditedParams((prev) => ({
                              ...prev,
                              [param.key]: v[0],
                            }))
                          }
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-12 text-right">{param.max}</span>
                      </div>
                    )}

                    {param.type === "select" && param.options && (
                      <Select
                        value={String(editedParams[param.key])}
                        onValueChange={(v) =>
                          setEditedParams((prev) => ({
                            ...prev,
                            [param.key]: v,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {param.options.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {param.type === "multiselect" && param.options && (
                      <div className="flex flex-wrap gap-2">
                        {param.options.map((opt) => {
                          const selected =
                            Array.isArray(editedParams[param.key]) &&
                            (editedParams[param.key] as string[]).includes(opt);
                          return (
                            <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer">
                              <Checkbox
                                checked={selected}
                                onCheckedChange={(checked) => {
                                  const current = Array.isArray(editedParams[param.key])
                                    ? [...(editedParams[param.key] as string[])]
                                    : [];
                                  if (checked) {
                                    setEditedParams((prev) => ({
                                      ...prev,
                                      [param.key]: [...current, opt],
                                    }));
                                  } else {
                                    setEditedParams((prev) => ({
                                      ...prev,
                                      [param.key]: current.filter((v) => v !== opt),
                                    }));
                                  }
                                }}
                              />
                              {opt}
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {param.type === "number" && (
                      <Input
                        id={param.key}
                        type="number"
                        value={editedParams[param.key] as number}
                        onChange={(e) =>
                          setEditedParams((prev) => ({
                            ...prev,
                            [param.key]: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="font-mono"
                      />
                    )}

                    {param.type === "switch" && (
                      <Switch
                        id={param.key}
                        checked={!!editedParams[param.key]}
                        onCheckedChange={(checked) =>
                          setEditedParams((prev) => ({
                            ...prev,
                            [param.key]: checked,
                          }))
                        }
                      />
                    )}

                    {param.description && <p className="text-xs text-muted-foreground">{param.description}</p>}
                  </div>
                ))}
              </div>

              <Separator />

              {/* Config Diff */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">Changes</h4>
                {getChangedParams().length > 0 ? (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                    <p className="text-sm font-medium">
                      Changed parameters ({getChangedParams().length} of{" "}
                      {strategySchemas[editingStrategy].params.length}):
                    </p>
                    {getChangedParams().map((param) => (
                      <div key={param.key} className="flex items-center gap-2 text-sm font-mono">
                        <span className="text-muted-foreground">{param.key}:</span>
                        <span className="text-destructive line-through">{JSON.stringify(param.value)}</span>
                        <ArrowRight className="size-3" />
                        <span className="text-[var(--status-warning)]">{JSON.stringify(editedParams[param.key])}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No changes made</p>
                )}
              </div>

              <Separator />

              {/* Version History */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <History className="size-4" />
                  Version History
                </h4>
                <div className="space-y-2">
                  {strategySchemas[editingStrategy].versions.map((v) => (
                    <div key={v.version} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Badge variant={v.status === "Active" ? "default" : "secondary"} className="text-xs">
                          {v.version}
                        </Badge>
                        <div>
                          <p className="text-sm">{v.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {v.date} by {v.author}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {v.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <SheetFooter className="pt-4">
            <Button variant="outline" onClick={() => setEditingStrategy(null)}>
              <X className="size-4 mr-2" />
              Cancel
            </Button>
            <Button
              disabled={getChangedParams().length === 0}
              onClick={async () => {
                try {
                  await apiFetch("/api/config/strategies", token, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      strategyId: editingStrategy,
                      params: editedParams,
                    }),
                  });
                  toast.success(`Config saved for ${editingStrategy}`);
                } catch {
                  toast.error("Failed to save config");
                }
                setEditingStrategy(null);
              }}
            >
              <Save className="size-4 mr-2" />
              Save Changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
