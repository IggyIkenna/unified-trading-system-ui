"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Wallet,
  ArrowDownRight,
  FileText,
  Building2,
  Scale,
  Shield,
  Calendar,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InvestorRegister {
  name: string;
  type: "LP" | "GP" | "Seed";
  commitment: number;
  drawn: number;
  remaining: number;
  status: "Active" | "Fully Drawn" | "Suspended";
}

interface CapitalAccount {
  label: string;
  value: number;
}

interface DistributionWaterfallStep {
  tier: string;
  description: string;
  amount: number;
  cumulative: number;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_INVESTORS: InvestorRegister[] = [
  { name: "Odum Fund I", type: "GP", commitment: 5000000, drawn: 4800000, remaining: 200000, status: "Active" },
  { name: "Odum Fund II", type: "GP", commitment: 4000000, drawn: 3500000, remaining: 500000, status: "Active" },
  { name: "Seed LP", type: "Seed", commitment: 3000000, drawn: 3000000, remaining: 0, status: "Fully Drawn" },
  { name: "Meridian Fund", type: "LP", commitment: 3500000, drawn: 2800000, remaining: 700000, status: "Active" },
  { name: "Apex Capital", type: "LP", commitment: 2500000, drawn: 2200000, remaining: 300000, status: "Active" },
  { name: "Quantum Strategies", type: "LP", commitment: 2000000, drawn: 1500000, remaining: 500000, status: "Active" },
  { name: "Vertex Partners", type: "LP", commitment: 1500000, drawn: 1200000, remaining: 300000, status: "Active" },
  { name: "Nova Investments", type: "LP", commitment: 1200000, drawn: 1000000, remaining: 200000, status: "Suspended" },
];

const CAPITAL_ACCOUNTS: Record<string, CapitalAccount[]> = {
  "Odum Fund I": [
    { label: "Opening Balance", value: 4520000 },
    { label: "Contributions", value: 280000 },
    { label: "Distributions", value: -180000 },
    { label: "Management Fee Allocation", value: -96200 },
    { label: "Performance Fee Allocation", value: -142000 },
    { label: "Realised P&L Allocation", value: 312000 },
    { label: "Unrealised P&L Allocation", value: 268200 },
    { label: "Ending Balance", value: 4962000 },
  ],
  "Odum Fund II": [
    { label: "Opening Balance", value: 3620000 },
    { label: "Contributions", value: 1000000 },
    { label: "Distributions", value: -120000 },
    { label: "Management Fee Allocation", value: -78400 },
    { label: "Performance Fee Allocation", value: -112000 },
    { label: "Realised P&L Allocation", value: 248000 },
    { label: "Unrealised P&L Allocation", value: -377600 },
    { label: "Ending Balance", value: 4180000 },
  ],
  "Seed LP": [
    { label: "Opening Balance", value: 3180000 },
    { label: "Contributions", value: 150000 },
    { label: "Distributions", value: -90000 },
    { label: "Management Fee Allocation", value: -58800 },
    { label: "Performance Fee Allocation", value: -84000 },
    { label: "Realised P&L Allocation", value: 186000 },
    { label: "Unrealised P&L Allocation", value: 196800 },
    { label: "Ending Balance", value: 3480000 },
  ],
  "Meridian Fund": [
    { label: "Opening Balance", value: 2680000 },
    { label: "Contributions", value: 500000 },
    { label: "Distributions", value: -72000 },
    { label: "Management Fee Allocation", value: -49800 },
    { label: "Performance Fee Allocation", value: -71200 },
    { label: "Realised P&L Allocation", value: 158000 },
    { label: "Unrealised P&L Allocation", value: -25000 },
    { label: "Ending Balance", value: 3120000 },
  ],
};

const DISTRIBUTION_WATERFALL: DistributionWaterfallStep[] = [
  { tier: "Return of Capital", description: "Return of contributed capital to investors", amount: 2500000, cumulative: 2500000 },
  { tier: "Preferred Return (8%)", description: "8% preferred return to LPs before GP catch-up", amount: 1200000, cumulative: 3700000 },
  { tier: "GP Catch-up", description: "100% to GP until 20% of total profits received", amount: 800000, cumulative: 4500000 },
  { tier: "Carried Interest (20%)", description: "80/20 split above hurdle — 20% to GP, 80% to LPs", amount: 500000, cumulative: 5000000 },
];

const FUND_TERMS = {
  fundName: "Odum Capital Digital Assets Fund I, LP",
  structure: "Limited Partnership (Cayman Islands)",
  domicile: "Cayman Islands",
  inception: "September 1, 2024",
  term: "5 years (with 2x 1-year extensions)",
  managementFee: "2.0% of NAV per annum",
  performanceFee: "20% of net new profits",
  hurdleRate: "8% preferred return (compounded annually)",
  highWaterMark: "Yes, perpetual with crystallisation",
  lockUpPeriod: "12 months from subscription date",
  redemptionNotice: "90 days written notice",
  auditFirm: "PricewaterhouseCoopers (PwC)",
  legalCounsel: "Walkers (Cayman)",
  administrator: "Citco Fund Administration",
  custodian: "Fireblocks (digital assets) / Anchorage Digital",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  return `$${v.toFixed(2)}`;
}

function formatFullCurrency(v: number): string {
  return `$${v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function pnlColor(v: number): string {
  if (v > 0) return "text-[var(--pnl-positive)]";
  if (v < 0) return "text-[var(--pnl-negative)]";
  return "text-muted-foreground";
}

function investorTypeBadge(type: InvestorRegister["type"]) {
  const styles: Record<InvestorRegister["type"], string> = {
    GP: "bg-primary/10 text-primary border-primary/20",
    LP: "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border-[var(--accent-blue)]/20",
    Seed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${styles[type]}`}>
      {type}
    </Badge>
  );
}

function investorStatusBadge(status: InvestorRegister["status"]) {
  const styles: Record<InvestorRegister["status"], string> = {
    Active: "bg-[var(--status-live)]/10 text-[var(--status-live)] border-[var(--status-live)]/20",
    "Fully Drawn": "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border-[var(--accent-blue)]/20",
    Suspended: "bg-[var(--pnl-negative)]/10 text-[var(--pnl-negative)] border-[var(--pnl-negative)]/20",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${styles[status]}`}>
      {status}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function FundAdminPage() {
  const [selectedInvestor, setSelectedInvestor] = React.useState("Odum Fund I");
  const capitalAccount = CAPITAL_ACCOUNTS[selectedInvestor] ?? [];
  const totalDistribution = DISTRIBUTION_WATERFALL[DISTRIBUTION_WATERFALL.length - 1]?.cumulative ?? 0;

  return (
    <main className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Fund Administration</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Investor register, capital accounts, distributions, and fund terms
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="register">
        <TabsList>
          <TabsTrigger value="register">Investor Register</TabsTrigger>
          <TabsTrigger value="capital-accounts">Capital Accounts</TabsTrigger>
          <TabsTrigger value="distributions">Distributions</TabsTrigger>
          <TabsTrigger value="fund-terms">Fund Terms</TabsTrigger>
        </TabsList>

        {/* Investor Register Tab */}
        <TabsContent value="register">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  Investor Register
                </CardTitle>
                <Badge variant="outline" className="text-xs font-mono">
                  {MOCK_INVESTORS.length} investors
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Commitment</TableHead>
                    <TableHead className="text-right">Drawn</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_INVESTORS.map((inv) => (
                    <TableRow key={inv.name}>
                      <TableCell className="text-sm font-medium">{inv.name}</TableCell>
                      <TableCell>{investorTypeBadge(inv.type)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(inv.commitment)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(inv.drawn)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {inv.remaining > 0 ? formatCurrency(inv.remaining) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell>{investorStatusBadge(inv.status)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2">
                    <TableCell className="text-sm font-semibold">Total</TableCell>
                    <TableCell />
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      {formatCurrency(MOCK_INVESTORS.reduce((acc, i) => acc + i.commitment, 0))}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      {formatCurrency(MOCK_INVESTORS.reduce((acc, i) => acc + i.drawn, 0))}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      {formatCurrency(MOCK_INVESTORS.reduce((acc, i) => acc + i.remaining, 0))}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Capital Accounts Tab */}
        <TabsContent value="capital-accounts">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wallet className="size-4 text-muted-foreground" />
                  Capital Account Statement
                </CardTitle>
                <Select value={selectedInvestor} onValueChange={setSelectedInvestor}>
                  <SelectTrigger className="w-[220px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(CAPITAL_ACCOUNTS).map((name) => (
                      <SelectItem key={name} value={name} className="text-xs">
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {capitalAccount.map((item, i) => {
                    const isTotal = item.label === "Ending Balance" || item.label === "Opening Balance";
                    return (
                      <TableRow key={i} className={isTotal ? "border-t-2 font-semibold" : ""}>
                        <TableCell className="text-sm">
                          {isTotal ? (
                            <span className="font-semibold">{item.label}</span>
                          ) : (
                            item.label
                          )}
                        </TableCell>
                        <TableCell className={`text-right font-mono text-sm ${isTotal ? "font-semibold" : pnlColor(item.value)}`}>
                          {item.value >= 0 ? "" : ""}{formatFullCurrency(item.value)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distributions Tab */}
        <TabsContent value="distributions">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ArrowDownRight className="size-4 text-muted-foreground" />
                  Distribution Waterfall
                </CardTitle>
                <Badge variant="outline" className="text-xs font-mono">
                  Total: {formatCurrency(totalDistribution)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Visual waterfall */}
              <div className="space-y-3">
                {DISTRIBUTION_WATERFALL.map((step) => {
                  const widthPct = (step.amount / totalDistribution) * 100;
                  const colors = [
                    "bg-[var(--accent-blue)]/60",
                    "bg-[var(--pnl-positive)]/60",
                    "bg-purple-500/60",
                    "bg-primary/60",
                  ];
                  const idx = DISTRIBUTION_WATERFALL.indexOf(step);
                  return (
                    <div key={step.tier} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">{step.tier}</span>
                          <span className="text-xs text-muted-foreground ml-2">{step.description}</span>
                        </div>
                        <span className="font-mono">{formatCurrency(step.amount)}</span>
                      </div>
                      <div className="h-6 rounded bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded transition-all ${colors[idx % colors.length]}`}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detail table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Cumulative</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DISTRIBUTION_WATERFALL.map((step) => (
                    <TableRow key={step.tier}>
                      <TableCell className="text-sm font-medium">{step.tier}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{step.description}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(step.amount)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(step.cumulative)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fund Terms Tab */}
        <TabsContent value="fund-terms">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                Fund Terms Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Building2, label: "Fund Name", value: FUND_TERMS.fundName },
                  { icon: Scale, label: "Structure", value: FUND_TERMS.structure },
                  { icon: Building2, label: "Domicile", value: FUND_TERMS.domicile },
                  { icon: Calendar, label: "Inception", value: FUND_TERMS.inception },
                  { icon: Calendar, label: "Term", value: FUND_TERMS.term },
                  { icon: Wallet, label: "Management Fee", value: FUND_TERMS.managementFee },
                  { icon: Wallet, label: "Performance Fee", value: FUND_TERMS.performanceFee },
                  { icon: Scale, label: "Hurdle Rate", value: FUND_TERMS.hurdleRate },
                  { icon: Shield, label: "High-Water Mark", value: FUND_TERMS.highWaterMark },
                  { icon: Calendar, label: "Lock-up Period", value: FUND_TERMS.lockUpPeriod },
                  { icon: Calendar, label: "Redemption Notice", value: FUND_TERMS.redemptionNotice },
                  { icon: Shield, label: "Audit Firm", value: FUND_TERMS.auditFirm },
                  { icon: Building2, label: "Legal Counsel", value: FUND_TERMS.legalCounsel },
                  { icon: Building2, label: "Administrator", value: FUND_TERMS.administrator },
                  { icon: Shield, label: "Custodian", value: FUND_TERMS.custodian },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-start gap-3 rounded-lg border border-border p-3">
                      <div className="p-1.5 rounded bg-muted shrink-0">
                        <Icon className="size-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="text-sm font-medium mt-0.5">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
