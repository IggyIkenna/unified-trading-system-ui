"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, FileText, Download } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import type { ExecutiveSelectedStrategyData } from "./executive-dashboard-types";
import { clientSummary, monthlyPnL, navHistory, recentDocuments } from "./executive-dashboard-data";

interface ExecutiveDashboardTabsProps {
  selectedStrategyData: ExecutiveSelectedStrategyData;
}

export function ExecutiveDashboardTabs({ selectedStrategyData }: ExecutiveDashboardTabsProps) {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="clients">Client Reports</TabsTrigger>
        <TabsTrigger value="allocation">Allocation</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Card className="col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">NAV Performance vs Benchmark</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={navHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" domain={[20, 26]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="nav"
                      name="NAV ($M)"
                      stroke="var(--surface-trading)"
                      fill="var(--surface-trading)"
                      fillOpacity={0.2}
                    />
                    <Area
                      type="monotone"
                      dataKey="benchmark"
                      name="Benchmark"
                      stroke="var(--muted-foreground)"
                      fill="var(--muted-foreground)"
                      fillOpacity={0.1}
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Strategy Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                {selectedStrategyData.strategyAllocation.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={selectedStrategyData.strategyAllocation}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {selectedStrategyData.strategyAllocation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    Select strategies to view allocation
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {selectedStrategyData.strategyAllocation.map((s) => (
                  <div key={s.name} className="flex items-center gap-2 text-xs">
                    <div className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-muted-foreground truncate">{s.name}</span>
                    <span className="ml-auto font-medium">{s.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly P&L vs Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyPnL}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`$${value}K`, ""]}
                  />
                  <Legend />
                  <Bar dataKey="pnl" name="P&L ($K)" fill="var(--surface-trading)" radius={[4, 4, 0, 0]} />
                  <Bar
                    dataKey="target"
                    name="Target"
                    fill="var(--muted-foreground)"
                    radius={[4, 4, 0, 0]}
                    fillOpacity={0.3}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="clients" className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Client Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clientSummary.map((client) => (
                <div
                  key={client.name}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-[var(--surface-strategy)]/10 flex items-center justify-center">
                      <Briefcase className="size-5 text-[var(--surface-strategy)]" />
                    </div>
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-xs text-muted-foreground">AUM: ${client.aum}M</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={
                        client.pnl >= 0
                          ? "text-[var(--pnl-positive)] font-medium"
                          : "text-[var(--pnl-negative)] font-medium"
                      }
                    >
                      {client.pnl >= 0 ? "+" : ""}${Math.abs(client.pnl)}K
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {client.pnlPct >= 0 ? "+" : ""}
                      {client.pnlPct}% YTD
                    </p>
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
                  <Button variant="ghost" size="sm">
                    <FileText className="size-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="allocation">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-12">
              Detailed allocation breakdown and rebalancing tools
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="documents">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Recent Documents</CardTitle>
              <Button variant="outline" size="sm">
                <FileText className="size-4 mr-2" />
                New Document
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentDocuments.map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="size-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{doc.type}</Badge>
                    <Button variant="ghost" size="icon">
                      <Download className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
