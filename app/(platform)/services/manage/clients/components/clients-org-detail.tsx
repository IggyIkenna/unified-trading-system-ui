"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Users, Key, Database, CreditCard, BarChart3, Check } from "lucide-react";
import type { Organization, Subscription } from "./clients-types";
import { TIERS } from "./clients-types";
import { formatNumber } from "@/lib/utils/formatters";

export function ClientsOrgDetail({
  selectedOrg,
  selectedSub,
  onBack,
  onTierChange,
}: {
  selectedOrg: Organization;
  selectedSub: Subscription | undefined;
  onBack: () => void;
  onTierChange: (orgId: string, tier: (typeof TIERS)[number]) => void;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="container px-4 py-6 md:px-6">
          <Button variant="ghost" size="sm" onClick={() => onBack()} className="mb-2">
            <ArrowLeft className="mr-2 size-4" />
            Back to Clients
          </Button>
          <PageHeader
            title={selectedOrg.name}
            description={`${selectedOrg.type === "internal" ? "Internal Team" : "Client Organization"} — Created ${selectedOrg.createdAt}`}
          >
            <Badge
              className={
                selectedOrg.status === "active"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : selectedOrg.status === "onboarding"
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-red-500/20 text-red-400"
              }
            >
              {selectedOrg.status}
            </Badge>
          </PageHeader>
        </div>
      </div>

      <div className="container px-4 py-8 md:px-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="usage">API & Keys</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-sky-500/10 p-2.5">
                      <Users className="size-5 text-sky-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Members</p>
                      <p className="text-xl font-bold font-mono">{selectedOrg.memberCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-500/10 p-2.5">
                      <CreditCard className="size-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tier</p>
                      <p className="text-xl font-bold capitalize">{selectedOrg.subscriptionTier}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-500/10 p-2.5">
                      <Key className="size-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">API Keys</p>
                      <p className="text-xl font-bold font-mono">{selectedOrg.apiKeys}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-violet-500/10 p-2.5">
                      <Database className="size-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Usage</p>
                      <p className="text-xl font-bold font-mono">{selectedOrg.usageGb} GB</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Organization Members</CardTitle>
                <CardDescription>
                  {selectedOrg.memberCount} member
                  {selectedOrg.memberCount !== 1 ? "s" : ""} in {selectedOrg.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedOrg.memberCount === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No members yet. Invite users from the User Management page.
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Visit User Management to manage members for this organization.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Subscription Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Current Tier</p>
                    <Select
                      value={selectedOrg.subscriptionTier}
                      onValueChange={(val) => onTierChange(selectedOrg.id, val as (typeof TIERS)[number])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIERS.map((t) => (
                          <SelectItem key={t} value={t} className="capitalize">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Monthly Fee</p>
                    <p className="text-lg font-bold font-mono">${selectedOrg.monthlyFee.toLocaleString()}</p>
                  </div>
                  {selectedSub && (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Management Fee</p>
                        <p className="text-lg font-bold font-mono">{selectedSub.managementFeePct}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">AUM</p>
                        <p className="text-lg font-bold font-mono">
                          ${formatNumber((selectedSub?.aumUsd ?? 0) / 1_000_000, 1)}M
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">API Keys & Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="size-4 text-amber-400" />
                      <p className="text-sm font-medium">Active API Keys</p>
                    </div>
                    <p className="text-2xl font-bold font-mono">{selectedOrg.apiKeys}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="size-4 text-sky-400" />
                      <p className="text-sm font-medium">Data Usage (this month)</p>
                    </div>
                    <p className="text-2xl font-bold font-mono">{selectedOrg.usageGb} GB</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab — upload, DocuSign, approval */}
          <TabsContent value="documents">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Client Documents</h3>
                <Button size="sm" className="gap-1.5">
                  <Plus className="size-3.5" /> Upload Document
                </Button>
              </div>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="text-xs">
                        <TableHead>Document</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>DocuSign</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        {
                          name: "Investment Management Agreement",
                          type: "IMA",
                          status: "signed",
                          uploaded: "2026-01-15",
                          docusign: "completed",
                        },
                        {
                          name: "KYC/AML Documentation",
                          type: "KYC",
                          status: "approved",
                          uploaded: "2026-01-10",
                          docusign: "n/a",
                        },
                        {
                          name: "Risk Disclosure",
                          type: "Disclosure",
                          status: "signed",
                          uploaded: "2026-01-15",
                          docusign: "completed",
                        },
                        {
                          name: "Fee Schedule Agreement",
                          type: "Fees",
                          status: "pending",
                          uploaded: "2026-03-01",
                          docusign: "sent",
                        },
                        {
                          name: "API Access Terms",
                          type: "API",
                          status: "pending",
                          uploaded: "2026-03-18",
                          docusign: "awaiting",
                        },
                        {
                          name: "MiFID II Suitability Assessment",
                          type: "Regulatory",
                          status: "draft",
                          uploaded: "—",
                          docusign: "not sent",
                        },
                      ].map((doc, i) => (
                        <TableRow key={i} className="text-xs">
                          <TableCell className="font-medium">{doc.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[9px]">
                              {doc.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                doc.status === "signed" || doc.status === "approved"
                                  ? "text-emerald-400 border-emerald-400/30 text-[9px]"
                                  : doc.status === "pending"
                                    ? "text-amber-400 border-amber-400/30 text-[9px]"
                                    : "text-muted-foreground text-[9px]"
                              }
                            >
                              {doc.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{doc.uploaded}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                doc.docusign === "completed"
                                  ? "text-emerald-400 border-emerald-400/30 text-[9px]"
                                  : doc.docusign === "sent" || doc.docusign === "awaiting"
                                    ? "text-sky-400 border-sky-400/30 text-[9px]"
                                    : "text-muted-foreground text-[9px]"
                              }
                            >
                              {doc.docusign}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {doc.status === "draft" && (
                              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]">
                                Send for Signing
                              </Button>
                            )}
                            {doc.docusign === "awaiting" && (
                              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]">
                                Resend
                              </Button>
                            )}
                            {doc.status === "signed" && (
                              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]">
                                Download
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Read-Only API Keys</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">
                    Client-submitted read-only API keys for performance tracking across their venues.
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow className="text-xs">
                        <TableHead>Venue</TableHead>
                        <TableHead>Key ID</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Added</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        {
                          venue: "Binance",
                          keyId: "BN-****7f2a",
                          perms: "read-only",
                          status: "active",
                          added: "2026-02-01",
                        },
                        {
                          venue: "OKX",
                          keyId: "OK-****3e1c",
                          perms: "read-only",
                          status: "active",
                          added: "2026-02-01",
                        },
                        {
                          venue: "Deribit",
                          keyId: "DB-****9a4b",
                          perms: "read-only",
                          status: "pending",
                          added: "2026-03-15",
                        },
                      ].map((key, i) => (
                        <TableRow key={i} className="text-xs">
                          <TableCell className="font-medium">{key.venue}</TableCell>
                          <TableCell className="font-mono text-muted-foreground">{key.keyId}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[9px]">
                              {key.perms}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                key.status === "active"
                                  ? "text-emerald-400 border-emerald-400/30 text-[9px]"
                                  : "text-amber-400 border-amber-400/30 text-[9px]"
                              }
                            >
                              {key.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{key.added}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button variant="outline" size="sm" className="mt-3 gap-1.5">
                    <Key className="size-3.5" /> Add API Key
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Onboarding Tab — service config, terms, fees */}
          <TabsContent value="onboarding">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Onboarding Progress</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Service Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      {
                        service: "Data",
                        tier: "Pro",
                        status: "active",
                        entitlements: ["data-basic", "data-pro"],
                      },
                      {
                        service: "Execution",
                        tier: "Full",
                        status: "active",
                        entitlements: ["execution-basic", "execution-full"],
                      },
                      {
                        service: "Strategy",
                        tier: "Full",
                        status: "active",
                        entitlements: ["strategy-full", "ml-full"],
                      },
                      {
                        service: "Reporting",
                        tier: "Standard",
                        status: "pending",
                        entitlements: ["reporting"],
                      },
                      {
                        service: "Investment Mgmt",
                        tier: "—",
                        status: "not subscribed",
                        entitlements: [],
                      },
                    ].map((svc, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                      >
                        <div>
                          <span className="text-sm font-medium">{svc.service}</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            {svc.entitlements.map((e) => (
                              <Badge key={e} variant="outline" className="text-[8px] h-4 px-1">
                                {e}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px]">
                            {svc.tier}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={
                              svc.status === "active"
                                ? "text-emerald-400 border-emerald-400/30 text-[9px]"
                                : svc.status === "pending"
                                  ? "text-amber-400 border-amber-400/30 text-[9px]"
                                  : "text-muted-foreground text-[9px]"
                            }
                          >
                            {svc.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Fee Schedule</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      {
                        item: "Management Fee",
                        value: "1.5% AUM/yr",
                        applies: "Investment Mgmt",
                      },
                      {
                        item: "Performance Fee",
                        value: "20% above HWM",
                        applies: "Investment Mgmt",
                      },
                      {
                        item: "Data Subscription",
                        value: "$2,500/mo",
                        applies: "Data Pro",
                      },
                      {
                        item: "Execution Fee",
                        value: "0.5 bps/trade",
                        applies: "Execution",
                      },
                      {
                        item: "Platform Fee",
                        value: "$5,000/mo",
                        applies: "Full Platform",
                      },
                      {
                        item: "Regulatory Reporting",
                        value: "$1,000/mo",
                        applies: "Reporting",
                      },
                    ].map((fee, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 text-xs">
                        <div>
                          <span className="font-medium">{fee.item}</span>
                          <span className="text-muted-foreground ml-2">({fee.applies})</span>
                        </div>
                        <span className="font-mono">{fee.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Onboarding Checklist</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { step: "KYC/AML verification", done: true },
                      {
                        step: "Investment Management Agreement signed",
                        done: true,
                      },
                      { step: "Risk Disclosure acknowledged", done: true },
                      { step: "Fee Schedule agreed", done: false },
                      { step: "API keys submitted (read-only)", done: false },
                      { step: "MiFID suitability assessment", done: false },
                      {
                        step: "Initial capital allocation confirmed",
                        done: false,
                      },
                      { step: "Strategy mandate approved", done: false },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div
                          className={`size-4 rounded border flex items-center justify-center ${item.done ? "bg-emerald-500 border-emerald-500" : "border-border"}`}
                        >
                          {item.done && <Check className="size-3 text-white" />}
                        </div>
                        <span className={item.done ? "text-muted-foreground line-through" : ""}>{item.step}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
