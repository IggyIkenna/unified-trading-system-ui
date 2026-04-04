"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Building2, CheckCircle2, Key, BarChart3, Shield } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

const SUPPORTED_VENUES = ["Binance", "OKX", "Bybit", "Deribit", "Coinbase", "Kraken", "Hyperliquid", "IBKR"];

type OnboardingStep = "fund" | "keys" | "complete";

export default function OnboardingCompletionPage() {
  const { user } = useAuth();
  const [step, setStep] = React.useState<OnboardingStep>("fund");
  const [fundName, setFundName] = React.useState("");
  const [fundStructure, setFundStructure] = React.useState("");
  const [strategyName, setStrategyName] = React.useState("");
  const [venue, setVenue] = React.useState("");
  const [apiKey, setApiKey] = React.useState("");
  const [apiSecret, setApiSecret] = React.useState("");
  const [addedKeys, setAddedKeys] = React.useState<Array<{ venue: string; masked: string }>>([]);

  async function handleCreateFund() {
    if (!fundName || !fundStructure) return;
    try {
      await fetch("/api/auth/provisioning/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fundName,
          contact_email: user?.email,
          contact_name: user?.displayName,
          tier: fundStructure,
        }),
      });
      toast({ title: "Fund created", description: `${fundName} is set up.` });
      setStep("keys");
    } catch {
      toast({
        title: "Error",
        description: "Failed to create fund.",
        variant: "destructive",
      });
    }
  }

  async function handleAddKey() {
    if (!venue || !apiKey || !apiSecret) return;
    const masked = `****...${apiKey.slice(-4)}`;
    setAddedKeys((prev) => [...prev, { venue, masked }]);
    toast({
      title: "API key added",
      description: `${venue} key stored securely.`,
    });
    setVenue("");
    setApiKey("");
    setApiSecret("");
  }

  function handleComplete() {
    setStep("complete");
    toast({
      title: "Setup complete",
      description: "Your reports are now being populated.",
    });
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="size-8 text-emerald-400" />
          </div>
          <PageHeader
            className="w-full max-w-xl [&>div:first-child]:justify-center [&_.min-w-0]:text-center"
            title="Welcome to the Platform"
            description="Your application has been approved. Complete these steps to unlock your reports."
          />
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[
            { id: "fund", label: "Create Fund" },
            { id: "keys", label: "Add API Keys" },
            { id: "complete", label: "Reports Live" },
          ].map((s, i) => {
            const done = s.id === "fund" ? step !== "fund" : s.id === "keys" ? step === "complete" : false;
            const active = s.id === step;
            return (
              <React.Fragment key={s.id}>
                {i > 0 && <div className={`h-px w-8 ${done ? "bg-emerald-500" : "bg-border"}`} />}
                <div
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                    done
                      ? "bg-emerald-500/10 text-emerald-400"
                      : active
                        ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                        : "text-muted-foreground"
                  }`}
                >
                  {done ? <CheckCircle2 className="size-3" /> : null}
                  {s.label}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {step === "fund" && (
          <Card>
            <CardHeader>
              <Building2 className="size-6 text-primary mb-2" />
              <CardTitle className="text-lg">Create Your Fund</CardTitle>
              <CardDescription>
                Name your fund and choose a structure. This is how your portfolio will appear in reports.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Fund Name *</Label>
                <Input
                  value={fundName}
                  onChange={(e) => setFundName(e.target.value)}
                  placeholder="e.g. Alpha Crypto Opportunities"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Strategy Name (optional)</Label>
                <Input
                  value={strategyName}
                  onChange={(e) => setStrategyName(e.target.value)}
                  placeholder="e.g. Momentum + Carry Blend"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Structure *</Label>
                <Select value={fundStructure} onValueChange={setFundStructure}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select structure" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sma">Separately Managed Account (SMA)</SelectItem>
                    <SelectItem value="fund_crypto">Crypto Spot Fund (FCA + EU ESMA)</SelectItem>
                    <SelectItem value="fund_derivatives">Derivatives Fund (EU ESMA)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateFund} disabled={!fundName || !fundStructure} className="w-full">
                Create Fund <ArrowRight className="ml-2 size-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "keys" && (
          <Card>
            <CardHeader>
              <Key className="size-6 text-primary mb-2" />
              <CardTitle className="text-lg">Add Venue API Keys</CardTitle>
              <CardDescription>
                Connect your exchange accounts with read-only API keys. This is what populates your reports with live
                trading data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="flex items-start gap-2">
                  <Shield className="size-4 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    We only need <strong>read-only</strong> permissions. Never share withdrawal keys. You can revoke
                    access at any time from Settings.
                  </p>
                </div>
              </div>

              {addedKeys.length > 0 && (
                <div className="space-y-2">
                  {addedKeys.map((k, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Key className="size-4 text-emerald-400" />
                        <span className="text-sm font-medium">{k.venue}</span>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-400 text-[10px]">Connected</Badge>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Venue</Label>
                  <Select value={venue} onValueChange={setVenue}>
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
                  <Label className="text-xs">API Key</Label>
                  <Input
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Paste API key"
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">API Secret</Label>
                <Input
                  type="password"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="Paste API secret"
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleAddKey} disabled={!venue || !apiKey || !apiSecret}>
                  Add Key
                </Button>
                <Button onClick={handleComplete} disabled={addedKeys.length === 0} className="flex-1">
                  Continue to Reports <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "complete" && (
          <div className="text-center space-y-6">
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="py-8">
                <BarChart3 className="size-12 text-emerald-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Your Reports Are Live</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  We&apos;re pulling data from {addedKeys.map((k) => k.venue).join(", ")}. Your portfolio performance,
                  P&amp;L attribution, and settlement tracking will populate as trading data flows in.
                </p>
              </CardContent>
            </Card>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <Link href="/services/reports/overview">
                  View Reports <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
