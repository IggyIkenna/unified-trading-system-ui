"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useExecutionMode } from "@/lib/execution-mode-context";
import { Coins, TrendingUp, Award, Clock, ShieldCheck, ArrowUpRight, ArrowDownRight, Download } from "lucide-react";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

interface StakingPosition {
  id: string;
  protocol: string;
  token: string;
  amountStaked: number;
  usdValue: number;
  apy: number;
  rewardsEarned: number;
  lockPeriod: string;
  unlockDate: string;
  status: "Active" | "Cooldown" | "Withdrawable";
}

const STAKING_POSITIONS: StakingPosition[] = [
  {
    id: "sp-1",
    protocol: "Lido",
    token: "ETH",
    amountStaked: 320,
    usdValue: 1_024_000,
    apy: 4.8,
    rewardsEarned: 15.36,
    lockPeriod: "None (liquid)",
    unlockDate: "N/A",
    status: "Active",
  },
  {
    id: "sp-2",
    protocol: "Rocket Pool",
    token: "ETH",
    amountStaked: 96,
    usdValue: 307_200,
    apy: 5.2,
    rewardsEarned: 4.99,
    lockPeriod: "None (liquid)",
    unlockDate: "N/A",
    status: "Active",
  },
  {
    id: "sp-3",
    protocol: "Native Staking",
    token: "MATIC",
    amountStaked: 850_000,
    usdValue: 595_000,
    apy: 5.6,
    rewardsEarned: 47_600,
    lockPeriod: "21 days",
    unlockDate: "2026-04-18",
    status: "Active",
  },
  {
    id: "sp-4",
    protocol: "Marinade",
    token: "SOL",
    amountStaked: 12_400,
    usdValue: 868_000,
    apy: 6.8,
    rewardsEarned: 843.2,
    lockPeriod: "2 epochs",
    unlockDate: "2026-04-02",
    status: "Active",
  },
  {
    id: "sp-5",
    protocol: "Osmosis",
    token: "ATOM",
    amountStaked: 45_000,
    usdValue: 405_000,
    apy: 7.2,
    rewardsEarned: 3_240,
    lockPeriod: "21 days",
    unlockDate: "2026-04-15",
    status: "Active",
  },
  {
    id: "sp-6",
    protocol: "Native Staking",
    token: "DOT",
    amountStaked: 180_000,
    usdValue: 720_000,
    apy: 14.2,
    rewardsEarned: 25_560,
    lockPeriod: "28 days",
    unlockDate: "2026-04-22",
    status: "Cooldown",
  },
  {
    id: "sp-7",
    protocol: "EigenLayer",
    token: "ETH",
    amountStaked: 64,
    usdValue: 204_800,
    apy: 3.9,
    rewardsEarned: 2.5,
    lockPeriod: "7 days",
    unlockDate: "2026-03-31",
    status: "Withdrawable",
  },
  {
    id: "sp-8",
    protocol: "Jito",
    token: "SOL",
    amountStaked: 1_600,
    usdValue: 112_000,
    apy: 7.5,
    rewardsEarned: 120,
    lockPeriod: "1 epoch",
    unlockDate: "2026-04-01",
    status: "Active",
  },
];

interface Validator {
  id: string;
  name: string;
  network: string;
  commission: number;
  uptime: number;
  delegatedAmount: string;
  performanceScore: number;
  slashingEvents: number;
}

const VALIDATORS: Validator[] = [
  {
    id: "v-1",
    name: "Chorus One",
    network: "Ethereum",
    commission: 5.0,
    uptime: 99.98,
    delegatedAmount: "12,400 ETH",
    performanceScore: 98,
    slashingEvents: 0,
  },
  {
    id: "v-2",
    name: "Figment",
    network: "Ethereum",
    commission: 8.0,
    uptime: 99.95,
    delegatedAmount: "8,200 ETH",
    performanceScore: 96,
    slashingEvents: 0,
  },
  {
    id: "v-3",
    name: "P2P Validator",
    network: "Ethereum",
    commission: 5.5,
    uptime: 99.92,
    delegatedAmount: "6,100 ETH",
    performanceScore: 95,
    slashingEvents: 0,
  },
  {
    id: "v-4",
    name: "Everstake",
    network: "Solana",
    commission: 7.0,
    uptime: 99.88,
    delegatedAmount: "340K SOL",
    performanceScore: 93,
    slashingEvents: 0,
  },
  {
    id: "v-5",
    name: "Marinade Native",
    network: "Solana",
    commission: 0.0,
    uptime: 99.97,
    delegatedAmount: "1.2M SOL",
    performanceScore: 99,
    slashingEvents: 0,
  },
  {
    id: "v-6",
    name: "Jito Labs",
    network: "Solana",
    commission: 6.0,
    uptime: 99.9,
    delegatedAmount: "890K SOL",
    performanceScore: 94,
    slashingEvents: 0,
  },
  {
    id: "v-7",
    name: "SG-1",
    network: "Cosmos",
    commission: 3.0,
    uptime: 99.99,
    delegatedAmount: "2.1M ATOM",
    performanceScore: 99,
    slashingEvents: 0,
  },
  {
    id: "v-8",
    name: "Cosmostation",
    network: "Cosmos",
    commission: 5.0,
    uptime: 99.94,
    delegatedAmount: "1.5M ATOM",
    performanceScore: 96,
    slashingEvents: 0,
  },
  {
    id: "v-9",
    name: "Allnodes",
    network: "Ethereum",
    commission: 4.0,
    uptime: 99.91,
    delegatedAmount: "5,400 ETH",
    performanceScore: 94,
    slashingEvents: 0,
  },
  {
    id: "v-10",
    name: "Lido DAO",
    network: "Ethereum",
    commission: 10.0,
    uptime: 99.96,
    delegatedAmount: "9.6M ETH",
    performanceScore: 97,
    slashingEvents: 0,
  },
  {
    id: "v-11",
    name: "Coinbase Cloud",
    network: "Solana",
    commission: 8.0,
    uptime: 99.85,
    delegatedAmount: "560K SOL",
    performanceScore: 90,
    slashingEvents: 1,
  },
  {
    id: "v-12",
    name: "Stakely",
    network: "Cosmos",
    commission: 2.0,
    uptime: 99.7,
    delegatedAmount: "420K ATOM",
    performanceScore: 82,
    slashingEvents: 0,
  },
];

interface RewardEntry {
  id: string;
  date: string;
  protocol: string;
  rewardAmount: string;
  usdValue: number;
  autoCompound: boolean;
}

const REWARDS_ENTRIES: RewardEntry[] = [
  { id: "r-1", date: "2026-03-28", protocol: "Lido", rewardAmount: "0.82 ETH", usdValue: 2_624, autoCompound: true },
  {
    id: "r-2",
    date: "2026-03-27",
    protocol: "Marinade",
    rewardAmount: "42.5 SOL",
    usdValue: 2_975,
    autoCompound: true,
  },
  {
    id: "r-3",
    date: "2026-03-27",
    protocol: "Osmosis",
    rewardAmount: "185 ATOM",
    usdValue: 1_665,
    autoCompound: false,
  },
  { id: "r-4", date: "2026-03-26", protocol: "Lido", rewardAmount: "0.81 ETH", usdValue: 2_592, autoCompound: true },
  {
    id: "r-5",
    date: "2026-03-26",
    protocol: "Native Staking",
    rewardAmount: "4,200 MATIC",
    usdValue: 2_940,
    autoCompound: false,
  },
  {
    id: "r-6",
    date: "2026-03-25",
    protocol: "Rocket Pool",
    rewardAmount: "0.28 ETH",
    usdValue: 896,
    autoCompound: true,
  },
  { id: "r-7", date: "2026-03-25", protocol: "Jito", rewardAmount: "6.8 SOL", usdValue: 476, autoCompound: true },
  { id: "r-8", date: "2026-03-24", protocol: "Lido", rewardAmount: "0.80 ETH", usdValue: 2_560, autoCompound: true },
  {
    id: "r-9",
    date: "2026-03-24",
    protocol: "Native Staking",
    rewardAmount: "1,100 DOT",
    usdValue: 4_400,
    autoCompound: false,
  },
  {
    id: "r-10",
    date: "2026-03-23",
    protocol: "Marinade",
    rewardAmount: "41.2 SOL",
    usdValue: 2_884,
    autoCompound: true,
  },
  {
    id: "r-11",
    date: "2026-03-23",
    protocol: "EigenLayer",
    rewardAmount: "0.14 ETH",
    usdValue: 448,
    autoCompound: false,
  },
  { id: "r-12", date: "2026-03-22", protocol: "Lido", rewardAmount: "0.80 ETH", usdValue: 2_560, autoCompound: true },
  {
    id: "r-13",
    date: "2026-03-22",
    protocol: "Osmosis",
    rewardAmount: "178 ATOM",
    usdValue: 1_602,
    autoCompound: false,
  },
  {
    id: "r-14",
    date: "2026-03-21",
    protocol: "Rocket Pool",
    rewardAmount: "0.27 ETH",
    usdValue: 864,
    autoCompound: true,
  },
  {
    id: "r-15",
    date: "2026-03-21",
    protocol: "Native Staking",
    rewardAmount: "4,050 MATIC",
    usdValue: 2_835,
    autoCompound: false,
  },
  { id: "r-16", date: "2026-03-20", protocol: "Lido", rewardAmount: "0.79 ETH", usdValue: 2_528, autoCompound: true },
  { id: "r-17", date: "2026-03-20", protocol: "Jito", rewardAmount: "6.5 SOL", usdValue: 455, autoCompound: true },
  {
    id: "r-18",
    date: "2026-03-19",
    protocol: "Marinade",
    rewardAmount: "40.8 SOL",
    usdValue: 2_856,
    autoCompound: true,
  },
  {
    id: "r-19",
    date: "2026-03-19",
    protocol: "Native Staking",
    rewardAmount: "1,080 DOT",
    usdValue: 4_320,
    autoCompound: false,
  },
  { id: "r-20", date: "2026-03-18", protocol: "Lido", rewardAmount: "0.78 ETH", usdValue: 2_496, autoCompound: true },
];

interface UnstakingEntry {
  id: string;
  protocol: string;
  amount: string;
  initiated: string;
  expectedCompletion: string;
  status: "Cooling Down" | "Ready to Withdraw";
}

const UNSTAKING_QUEUE: UnstakingEntry[] = [
  {
    id: "u-1",
    protocol: "Native Staking (DOT)",
    amount: "15,000 DOT ($60,000)",
    initiated: "2026-03-14",
    expectedCompletion: "2026-04-11",
    status: "Cooling Down",
  },
  {
    id: "u-2",
    protocol: "Osmosis (ATOM)",
    amount: "3,200 ATOM ($28,800)",
    initiated: "2026-03-21",
    expectedCompletion: "2026-04-11",
    status: "Cooling Down",
  },
  {
    id: "u-3",
    protocol: "EigenLayer (ETH)",
    amount: "16 ETH ($51,200)",
    initiated: "2026-03-21",
    expectedCompletion: "2026-03-28",
    status: "Ready to Withdraw",
  },
];

const MONTHLY_REWARDS = [
  { month: "Oct 2025", amount: 12_400 },
  { month: "Nov 2025", amount: 14_200 },
  { month: "Dec 2025", amount: 15_800 },
  { month: "Jan 2026", amount: 16_900 },
  { month: "Feb 2026", amount: 17_600 },
  { month: "Mar 2026", amount: 18_400 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusBadgeVariant(status: string): "success" | "warning" | "running" {
  if (status === "Active") return "success";
  if (status === "Cooldown" || status === "Cooling Down") return "warning";
  return "running";
}

function performanceColor(score: number): string {
  if (score >= 95) return "text-emerald-400";
  if (score >= 85) return "text-amber-400";
  return "text-rose-400";
}

function performanceLabel(score: number): string {
  if (score >= 95) return "Excellent";
  if (score >= 85) return "Good";
  return "Poor";
}

function performanceBadgeVariant(score: number): "success" | "warning" | "error" {
  if (score >= 95) return "success";
  if (score >= 85) return "warning";
  return "error";
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date("2026-03-28");
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StakingDashboardPage() {
  const { mode } = useExecutionMode();

  const totalStaked = STAKING_POSITIONS.reduce((sum, p) => sum + p.usdValue, 0);
  const weightedApy = STAKING_POSITIONS.reduce((sum, p) => sum + p.apy * p.usdValue, 0) / totalStaked;
  const totalRewardsUsd = REWARDS_ENTRIES.reduce((sum, r) => sum + r.usdValue, 0);
  const activeValidators = VALIDATORS.filter((v) => v.uptime >= 99.0).length;

  return (
    <div className="h-full bg-background overflow-auto" data-testid="staking-dashboard">
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        <PageHeader
          title={
            <span className="flex flex-wrap items-center gap-3">
              Staking Dashboard
              <Badge
                variant={mode === "live" ? "success" : mode === "paper" ? "warning" : "secondary"}
                className="text-xs"
              >
                {mode.toUpperCase()}
              </Badge>
            </span>
          }
        >
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="size-4" />
            Export
          </Button>
        </PageHeader>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="staking-kpi-strip">
          <Card className="py-4" data-testid="staking-kpi-total-staked">
            <CardContent className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Coins className="size-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Staked</p>
                <p className="text-lg font-bold font-mono">${formatNumber(totalStaked / 1_000_000, 1)}M</p>
              </div>
            </CardContent>
          </Card>
          <Card className="py-4" data-testid="staking-kpi-annual-yield">
            <CardContent className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="size-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Annual Yield</p>
                <p className="text-lg font-bold font-mono text-emerald-400">{formatPercent(weightedApy, 1)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="py-4" data-testid="staking-kpi-rewards-accrued">
            <CardContent className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Award className="size-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rewards Accrued</p>
                <p className="text-lg font-bold font-mono">${formatNumber(totalRewardsUsd / 1_000, 1)}K</p>
              </div>
            </CardContent>
          </Card>
          <Card className="py-4" data-testid="staking-kpi-active-validators">
            <CardContent className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <ShieldCheck className="size-5 text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Validators</p>
                <p className="text-lg font-bold font-mono">{activeValidators}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="positions">
          <TabsList data-testid="staking-tabs-list">
            <TabsTrigger value="positions" data-testid="staking-tab-positions">
              Positions
            </TabsTrigger>
            <TabsTrigger value="validators" data-testid="staking-tab-validators">
              Validators
            </TabsTrigger>
            <TabsTrigger value="rewards" data-testid="staking-tab-rewards">
              Rewards
            </TabsTrigger>
            <TabsTrigger value="unstaking" data-testid="staking-tab-unstaking">
              Unstaking Queue
            </TabsTrigger>
          </TabsList>

          {/* Positions Tab */}
          <TabsContent value="positions">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Staking Positions ({STAKING_POSITIONS.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table data-testid="staking-positions-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Protocol</TableHead>
                      <TableHead className="text-xs">Token</TableHead>
                      <TableHead className="text-xs text-right">Amount Staked</TableHead>
                      <TableHead className="text-xs text-right">USD Value</TableHead>
                      <TableHead className="text-xs text-right">APY</TableHead>
                      <TableHead className="text-xs text-right">Rewards Earned</TableHead>
                      <TableHead className="text-xs">Lock Period</TableHead>
                      <TableHead className="text-xs">Unlock Date</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {STAKING_POSITIONS.map((pos) => (
                      <TableRow key={pos.id} data-testid="staking-positions-row">
                        <TableCell className="text-xs font-medium">{pos.protocol}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {pos.token}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono">
                          {pos.amountStaked.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono">${pos.usdValue.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right font-mono text-emerald-400">
                          {formatPercent(pos.apy, 1)}
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono">
                          {typeof pos.rewardsEarned === "number" && pos.rewardsEarned < 100
                            ? `${formatNumber(pos.rewardsEarned, 2)} ${pos.token}`
                            : `${pos.rewardsEarned.toLocaleString()} ${pos.token}`}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{pos.lockPeriod}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{pos.unlockDate}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(pos.status)} className="text-[10px]">
                            {pos.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] text-emerald-400">
                              <ArrowUpRight className="size-3 mr-0.5" />
                              Stake More
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] text-rose-400">
                              <ArrowDownRight className="size-3 mr-0.5" />
                              Unstake
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Validators Tab */}
          <TabsContent value="validators">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Validators ({VALIDATORS.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table data-testid="staking-validators-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Validator Name</TableHead>
                      <TableHead className="text-xs">Network</TableHead>
                      <TableHead className="text-xs text-right">Commission</TableHead>
                      <TableHead className="text-xs text-right">Uptime %</TableHead>
                      <TableHead className="text-xs text-right">Delegated Amount</TableHead>
                      <TableHead className="text-xs text-right">Performance</TableHead>
                      <TableHead className="text-xs text-right">Slashing Events</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {VALIDATORS.map((v) => (
                      <TableRow key={v.id} data-testid="staking-validators-row">
                        <TableCell className="text-xs font-medium">{v.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {v.network}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono">{formatPercent(v.commission, 1)}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{formatPercent(v.uptime, 2)}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{v.delegatedAmount}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className={cn("text-xs font-mono font-bold", performanceColor(v.performanceScore))}>
                              {v.performanceScore}
                            </span>
                            <Badge variant={performanceBadgeVariant(v.performanceScore)} className="text-[10px]">
                              {performanceLabel(v.performanceScore)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono">
                          <span className={v.slashingEvents > 0 ? "text-rose-400 font-bold" : "text-muted-foreground"}>
                            {v.slashingEvents}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards">
            <div className="space-y-6">
              {/* Monthly rewards chart */}
              <Card data-testid="staking-monthly-rewards-chart">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Monthly Staking Rewards</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-3 h-48">
                    {MONTHLY_REWARDS.map((m) => {
                      const maxAmount = Math.max(...MONTHLY_REWARDS.map((mr) => mr.amount));
                      const heightPct = (m.amount / maxAmount) * 100;
                      return (
                        <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                          <span className="text-[10px] font-mono text-emerald-400">
                            ${formatNumber(m.amount / 1_000, 1)}K
                          </span>
                          <div className="w-full relative flex-1 flex items-end">
                            <div
                              className="w-full rounded-t-md bg-emerald-500/20 border border-emerald-500/30 transition-all"
                              style={{ height: `${heightPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{m.month.split(" ")[0]}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Rewards Table */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Reward History ({REWARDS_ENTRIES.length} entries)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table data-testid="staking-rewards-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Protocol</TableHead>
                        <TableHead className="text-xs text-right">Reward Amount</TableHead>
                        <TableHead className="text-xs text-right">USD Value</TableHead>
                        <TableHead className="text-xs text-center">Auto-compound</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {REWARDS_ENTRIES.map((r) => (
                        <TableRow key={r.id} data-testid="staking-rewards-row">
                          <TableCell className="text-xs text-muted-foreground font-mono">{r.date}</TableCell>
                          <TableCell className="text-xs font-medium">{r.protocol}</TableCell>
                          <TableCell className="text-xs text-right font-mono">{r.rewardAmount}</TableCell>
                          <TableCell className="text-xs text-right font-mono text-emerald-400">
                            ${r.usdValue.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={r.autoCompound ? "success" : "secondary"} className="text-[10px]">
                              {r.autoCompound ? "Yes" : "No"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Unstaking Queue Tab */}
          <TabsContent value="unstaking">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="size-4" />
                  Unstaking Queue ({UNSTAKING_QUEUE.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table data-testid="staking-unstaking-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Protocol</TableHead>
                      <TableHead className="text-xs">Amount</TableHead>
                      <TableHead className="text-xs">Initiated</TableHead>
                      <TableHead className="text-xs">Expected Completion</TableHead>
                      <TableHead className="text-xs text-right">Countdown</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {UNSTAKING_QUEUE.map((u) => {
                      const remaining = daysUntil(u.expectedCompletion);
                      return (
                        <TableRow key={u.id} data-testid="staking-unstaking-row" data-unstaking-status={u.status}>
                          <TableCell className="text-xs font-medium">{u.protocol}</TableCell>
                          <TableCell className="text-xs font-mono">{u.amount}</TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">{u.initiated}</TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {u.expectedCompletion}
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono">
                            {u.status === "Ready to Withdraw" ? (
                              <span className="text-emerald-400 font-bold">Ready</span>
                            ) : (
                              <span className="text-amber-400">{remaining}d remaining</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadgeVariant(u.status)} className="text-[10px]">
                              {u.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant={u.status === "Ready to Withdraw" ? "default" : "ghost"}
                              size="sm"
                              className={cn(
                                "h-7 px-3 text-[10px]",
                                u.status === "Ready to Withdraw" && "bg-emerald-600 hover:bg-emerald-700",
                              )}
                              disabled={u.status !== "Ready to Withdraw"}
                              data-testid="staking-unstaking-withdraw-button"
                            >
                              Withdraw
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
