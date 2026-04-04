"use client";

import Link from "next/link";
import { PnLWaterfall } from "@/components/trading/pnl-waterfall";
import { LimitBar } from "@/components/trading/limit-bar";
import { StrategyAuditTrail } from "@/components/trading/strategy-audit-trail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  TrendingUp,
  Layers,
  Database,
  Shield,
  Settings,
  BarChart2,
  History,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PnLBreakdownData, Strategy } from "@/lib/strategy-registry";

export type StrategyDetailRiskLimit = {
  label: string;
  value: number;
  limit: number;
  unit: string;
};

export type StrategyDetailTabPanelsProps = {
  strategy: Strategy;
  id: string;
  isLive: boolean;
  pnlBreakdown: PnLBreakdownData;
  riskLimits: StrategyDetailRiskLimit[];
};

export function StrategyDetailTabPanels({
  strategy,
  id,
  isLive,
  pnlBreakdown,
  riskLimits,
}: StrategyDetailTabPanelsProps) {
  return (
    <>
      <TabsContent value="pnl" className="space-y-6">
        <div className="grid grid-cols-12 gap-6">
          <Card className="col-span-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">P&L Waterfall (MTD)</CardTitle>
                  <CardDescription>Breakdown by settlement type</CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  {isLive ? "Live" : "Reconstructed"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <PnLWaterfall data={pnlBreakdown} />
            </CardContent>
          </Card>

          <div className="col-span-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Settlement Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {strategy.pnlAttribution.components.map((comp) => (
                  <div key={comp.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    <div className="size-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: comp.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{comp.label}</div>
                      <div className="text-xs text-muted-foreground">{comp.settlementType}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{comp.description}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {strategy.pnlAttribution.formula && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">P&L Formula</CardTitle>
                </CardHeader>
                <CardContent>
                  <code className="text-xs bg-muted/50 px-2 py-1 rounded block">{strategy.pnlAttribution.formula}</code>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </TabsContent>

      {/* Instruments Tab */}
      <TabsContent value="instruments">
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Instrument Positions</CardTitle>
              <CardDescription>Active positions by instrument</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instrument</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {strategy.instruments.map((inst, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-xs">{inst.key}</TableCell>
                      <TableCell>{inst.venue}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {inst.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{inst.role}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Smart Order Routing</CardTitle>
              <CardDescription>SOR configuration per leg</CardDescription>
            </CardHeader>
            <CardContent>
              {strategy.sorEnabled && strategy.sorConfig ? (
                <div className="space-y-4">
                  {strategy.sorConfig.legs.map((leg, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{leg.name}</span>
                        <Badge variant={leg.sorEnabled ? "default" : "outline"} className="text-[10px]">
                          {leg.sorEnabled ? "SOR ON" : "SOR OFF"}
                        </Badge>
                      </div>
                      {leg.allowedVenues && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {leg.allowedVenues.map((v) => (
                            <Badge key={v} variant="secondary" className="text-[10px]">
                              {v}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">SOR not enabled for this strategy</div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Data & Features Tab */}
      <TabsContent value="data">
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Data Architecture</CardTitle>
              <CardDescription>Data flow configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Raw Data Source</div>
                  <div className="text-sm font-medium">{strategy.dataArchitecture.rawDataSource}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Interval</div>
                  <div className="text-sm font-medium">{strategy.dataArchitecture.interval}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Lowest Granularity</div>
                  <div className="text-sm font-medium">{strategy.dataArchitecture.lowestGranularity}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Execution Mode</div>
                  <Badge variant="outline">{strategy.dataArchitecture.executionMode}</Badge>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-2">Processed Data</div>
                <div className="flex items-center gap-1 flex-wrap">
                  {strategy.dataArchitecture.processedData.map((d) => (
                    <Badge key={d} variant="secondary" className="text-[10px] font-mono">
                      {d}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Features Consumed</CardTitle>
              <CardDescription>Input features from feature services</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Used For</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {strategy.featuresConsumed.map((feat, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-xs">{feat.name}</TableCell>
                      <TableCell className="text-xs">{feat.source}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {feat.sla}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{feat.usedFor}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Risk Tab */}
      <TabsContent value="risk">
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Risk Profile</CardTitle>
              <CardDescription>Target risk metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">Target Return</div>
                  <div className="text-lg font-semibold font-mono">{strategy.riskProfile.targetReturn}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">Target Sharpe</div>
                  <div className="text-lg font-semibold font-mono">{strategy.riskProfile.targetSharpe}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">Max Drawdown</div>
                  <div className="text-lg font-semibold font-mono">{strategy.riskProfile.maxDrawdown}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">Max Leverage</div>
                  <div className="text-lg font-semibold font-mono">{strategy.riskProfile.maxLeverage}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Capital Scalability</div>
                <div className="text-sm font-medium">{strategy.riskProfile.capitalScalability}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Risk Subscriptions</CardTitle>
              <CardDescription>Risk types monitored by this strategy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {strategy.riskSubscriptions.map((risk, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      {risk.subscribed ? (
                        <CheckCircle className="size-4 text-[var(--status-live)]" />
                      ) : (
                        <XCircle className="size-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-sm">{risk.riskType}</span>
                    </div>
                    <div className="text-right">
                      {risk.threshold && <div className="text-xs text-muted-foreground">{risk.threshold}</div>}
                      {risk.action && (
                        <Badge variant="outline" className="text-[10px]">
                          {risk.action}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Latency Profile</CardTitle>
              <CardDescription>End-to-end latency targets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm">Data to Signal</span>
                <span className="font-mono text-sm">{strategy.latencyProfile.dataToSignal}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm">Signal to Instruction</span>
                <span className="font-mono text-sm">{strategy.latencyProfile.signalToInstruction}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm">Instruction to Fill</span>
                <span className="font-mono text-sm">{strategy.latencyProfile.instructionToFill}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm font-semibold">End-to-End</span>
                <span className="font-mono text-sm font-semibold">{strategy.latencyProfile.endToEnd}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">Co-location Needed?</span>
                <Badge variant={strategy.latencyProfile.coLocationNeeded ? "destructive" : "secondary"}>
                  {strategy.latencyProfile.coLocationNeeded ? "Yes" : "No"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Risk Limits</CardTitle>
              <CardDescription>Current utilization vs limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {riskLimits.map((limit) => (
                <LimitBar
                  key={limit.label}
                  label={limit.label}
                  value={limit.value}
                  limit={limit.limit}
                  unit={limit.unit}
                  showStatus={true}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Configuration Tab */}
      <TabsContent value="config">
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Strategy Configuration</CardTitle>
                  <CardDescription>Version {strategy.version}</CardDescription>
                </div>
                <Link href={`/config/strategies/${id}`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="size-4" />
                    Edit
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parameter</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {strategy.configParams.map((param) => (
                    <TableRow key={param.key}>
                      <TableCell className="font-mono text-xs">{param.key}</TableCell>
                      <TableCell className="font-mono font-medium">{param.value}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{param.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Venues</CardTitle>
              <CardDescription>Connected execution venues</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {strategy.venues.map((venue) => (
                <div
                  key={venue}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <span className="font-medium">{venue}</span>
                  <Badge variant="outline" className="text-[var(--status-live)]">
                    Connected
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {strategy.references && (
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Code References</CardTitle>
                <CardDescription>Implementation locations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {strategy.references.implementation && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1">Implementation</div>
                      <code className="text-xs">{strategy.references.implementation}</code>
                    </div>
                  )}
                  {strategy.references.configSchema && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1">Config Schema</div>
                      <code className="text-xs">{strategy.references.configSchema}</code>
                    </div>
                  )}
                  {strategy.references.executionAdapter && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1">Execution Adapter</div>
                      <code className="text-xs">{strategy.references.executionAdapter}</code>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      {/* Testing Status Tab */}
      <TabsContent value="testing">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Testing Pipeline Status</CardTitle>
            <CardDescription>Progress through testing stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-4">
              {strategy.testingStatus.map((stage, idx) => (
                <div
                  key={stage.stage}
                  className={cn(
                    "p-4 rounded-lg border text-center relative",
                    stage.status === "done" && "border-[var(--status-live)] bg-[var(--status-live)]/5",
                    stage.status === "pending" && "border-[var(--status-warning)] bg-[var(--status-warning)]/5",
                    stage.status === "blocked" && "border-[var(--status-error)] bg-[var(--status-error)]/5",
                  )}
                >
                  <div className="flex items-center justify-center mb-2">
                    {stage.status === "done" && <CheckCircle className="size-5 text-[var(--status-live)]" />}
                    {stage.status === "pending" && <Clock className="size-5 text-[var(--status-warning)]" />}
                    {stage.status === "blocked" && <AlertTriangle className="size-5 text-[var(--status-error)]" />}
                  </div>
                  <div className="font-medium text-xs">{stage.stage}</div>
                  <div className="text-[10px] text-muted-foreground uppercase mt-1">{stage.status}</div>
                  {stage.notes && (
                    <div className="text-[10px] text-muted-foreground mt-2 line-clamp-2">{stage.notes}</div>
                  )}
                  {idx < strategy.testingStatus.length - 1 && (
                    <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 size-4 text-muted-foreground z-10" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Decisions Tab - Strategy Audit Trail */}
      <TabsContent value="decisions">
        <StrategyAuditTrail strategyId={strategy.id} />
      </TabsContent>
    </>
  );
}
