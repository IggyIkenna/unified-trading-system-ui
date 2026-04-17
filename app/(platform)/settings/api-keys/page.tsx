"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, Key, Plus, Shield, Trash2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

const SUPPORTED_VENUES = ["Binance", "OKX", "Bybit", "Deribit", "Coinbase", "Hyperliquid", "IBKR"];

interface VenueApiKey {
  id: string;
  venue: string;
  label: string;
  api_key_masked: string;
  status: "active" | "revoked" | "expired";
  added_at: string;
}

interface OrgData {
  id: string;
  name: string;
  api_keys: VenueApiKey[];
}

export default function ApiKeysSettingsPage() {
  const { user, token } = useAuth();
  const [org, setOrg] = React.useState<OrgData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [adding, setAdding] = React.useState(false);
  const [newVenue, setNewVenue] = React.useState("");
  const [newLabel, setNewLabel] = React.useState("");
  const [newApiKey, setNewApiKey] = React.useState("");
  const [newApiSecret, setNewApiSecret] = React.useState("");
  const [showSecret, setShowSecret] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/auth/provisioning/my-org", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setOrg(data.organization);
        }
      } catch {
        /* mock mode may not have this */
      }
      setLoading(false);
    }
    load();
  }, [token]);

  async function handleAddKey() {
    if (!newVenue || !newApiKey || !org) return;
    try {
      const res = await fetch(`/api/auth/provisioning/organizations/${org.id}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venue: newVenue,
          label: newLabel || `${newVenue} Key`,
          api_key: newApiKey,
          api_secret: newApiSecret,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrg(data.organization);
        setAdding(false);
        setNewVenue("");
        setNewLabel("");
        setNewApiKey("");
        setNewApiSecret("");
        toast({
          title: "API key added",
          description: `${newVenue} key has been securely stored.`,
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to add API key.",
        variant: "destructive",
      });
    }
  }

  async function handleRevokeKey(keyId: string) {
    if (!org) return;
    try {
      const res = await fetch(`/api/auth/provisioning/organizations/${org.id}/api-keys/${keyId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const data = await res.json();
        setOrg(data.organization);
        toast({ title: "API key revoked" });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to revoke key.",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-8">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <Key className="size-6" /> Venue API Keys
            </span>
          }
        />
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <AlertTriangle className="size-10 text-amber-400 mx-auto" />
            <h2 className="text-lg font-medium">No organisation linked</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Your account hasn&apos;t been linked to an organisation yet. Once your application is approved and an
              admin sets up your organisation, you&apos;ll be able to add venue API keys here.
            </p>
            <p className="text-xs text-muted-foreground">
              Contact <span className="text-foreground">support@odum.io</span> if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeKeys = org.api_keys.filter((k) => k.status === "active");
  const revokedKeys = org.api_keys.filter((k) => k.status !== "active");

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Key className="size-6" /> Venue API Keys
          </span>
        }
        description={`${org.name} — manage your exchange and venue API credentials`}
      >
        <Button size="sm" onClick={() => setAdding(true)} disabled={adding}>
          <Plus className="mr-1 size-4" /> Add Key
        </Button>
      </PageHeader>

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Shield className="size-5 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-400">Security Notice</p>
              <p className="text-muted-foreground">
                API keys are encrypted at rest and never displayed in full after submission. We only require{" "}
                <strong>read-only</strong> and <strong>trade</strong> permissions &mdash; never withdrawal permissions.
                You can revoke access at any time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {adding && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Venue API Key</CardTitle>
            <CardDescription>
              Connect a new exchange or venue. Keys are stored securely in Secret Manager.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Venue *</Label>
                <Select value={newVenue} onValueChange={setNewVenue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_VENUES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Label (optional)</Label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Main Trading Account"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">API Key *</Label>
              <Input
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="Paste your API key"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">API Secret *</Label>
              <div className="relative">
                <Input
                  type={showSecret ? "text" : "password"}
                  value={newApiSecret}
                  onChange={(e) => setNewApiSecret(e.target.value)}
                  placeholder="Paste your API secret"
                  className="font-mono text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleAddKey} disabled={!newVenue || !newApiKey || !newApiSecret}>
                <CheckCircle2 className="size-4 mr-1" /> Save Key
              </Button>
              <Button variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeKeys.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Active Keys ({activeKeys.length})
          </h2>
          {activeKeys.map((key) => (
            <Card key={key.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <Key className="size-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{key.venue}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {key.label}
                        </Badge>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                          Active
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Key: <code className="bg-muted px-1 rounded">{key.api_key_masked}</code> &mdash; Added{" "}
                        {new Date(key.added_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => handleRevokeKey(key.id)}
                  >
                    <Trash2 className="size-4 mr-1" /> Revoke
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !adding ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Key className="size-10 text-muted-foreground mx-auto" />
            <h2 className="text-lg font-medium">No API keys yet</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Add your first venue API key to start receiving reports and analytics. We support{" "}
              {SUPPORTED_VENUES.length} venues.
            </p>
            <Button onClick={() => setAdding(true)}>
              <Plus className="size-4 mr-1" /> Add Your First Key
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {revokedKeys.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Revoked / Expired ({revokedKeys.length})
          </h2>
          {revokedKeys.map((key) => (
            <Card key={key.id} className="opacity-50">
              <CardContent className="py-3">
                <div className="flex items-center gap-4">
                  <Key className="size-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm">{key.venue}</span>
                    <span className="text-xs text-muted-foreground ml-2">{key.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] ml-auto">
                    {key.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
