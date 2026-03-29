"use client";

import { PageHeader } from "@/components/platform/page-header";
import * as React from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Pencil, Check, X, Calculator } from "lucide-react";
import { useOrganizationsList } from "@/hooks/api/use-organizations";
import { useSubscriptions } from "@/hooks/api/use-organizations";
import { ExportDropdown } from "@/components/ui/export-dropdown";
import { formatNumber } from "@/lib/utils/formatters";

interface FeeRow {
  orgId: string;
  orgName: string;
  managementFeePct: number;
  performanceFeePct: number;
  dataFeePct: number;
  aumUsd: number;
}

export default function FeeManagementPage() {
  const { data: orgsData } = useOrganizationsList();
  const { data: subsData } = useSubscriptions();
  const orgs =
    (
      orgsData as {
        organizations?: Array<{ id: string; name: string; type: string }>;
      }
    )?.organizations ?? [];
  const [subscriptions, setSubscriptions] = React.useState([
    {
      orgId: "acme",
      tier: "execution-full",
      managementFeePct: 2.0,
      performanceFeePct: 20,
      dataFeePct: 0,
      aumUsd: 25000000,
      monthlyFee: 25000,
    },
    {
      orgId: "beta",
      tier: "data-basic",
      managementFeePct: 0,
      performanceFeePct: 0,
      dataFeePct: 0.5,
      aumUsd: 5000000,
      monthlyFee: 2500,
    },
    {
      orgId: "vertex",
      tier: "data-pro",
      managementFeePct: 0,
      performanceFeePct: 0,
      dataFeePct: 1.0,
      aumUsd: 8000000,
      monthlyFee: 8000,
    },
  ]);
  const updateSubscription = (orgId: string, updates: Record<string, number>) =>
    setSubscriptions((prev) => prev.map((s) => (s.orgId === orgId ? { ...s, ...updates } : s)));

  const [editingOrgId, setEditingOrgId] = React.useState<string | null>(null);
  const [editValues, setEditValues] = React.useState({
    managementFeePct: 0,
    performanceFeePct: 0,
    dataFeePct: 0,
  });

  // Fee simulation state
  const [simAum, setSimAum] = React.useState("10000000");
  const [simReturn, setSimReturn] = React.useState("15");
  const [simOrgId, setSimOrgId] = React.useState("");

  const feeRows: FeeRow[] = React.useMemo(() => {
    return orgs
      .filter((o) => o.type === "client")
      .map((o) => {
        const sub = subscriptions.find((s) => s.orgId === o.id);
        return {
          orgId: o.id,
          orgName: o.name,
          managementFeePct: sub?.managementFeePct ?? 0,
          performanceFeePct: sub?.performanceFeePct ?? 0,
          dataFeePct: sub?.dataFeePct ?? 0,
          aumUsd: sub?.aumUsd ?? 0,
        };
      });
  }, [orgs, subscriptions]);

  function startEditing(row: FeeRow) {
    setEditingOrgId(row.orgId);
    setEditValues({
      managementFeePct: row.managementFeePct,
      performanceFeePct: row.performanceFeePct,
      dataFeePct: row.dataFeePct,
    });
  }

  function saveEditing() {
    if (!editingOrgId) return;
    updateSubscription(editingOrgId, editValues);
    const org = orgs.find((o) => o.id === editingOrgId);
    toast.success("Fees updated", {
      description: `${org?.name}: Mgmt ${editValues.managementFeePct}%, Perf ${editValues.performanceFeePct}%, Data ${editValues.dataFeePct}%`,
    });
    setEditingOrgId(null);
  }

  function cancelEditing() {
    setEditingOrgId(null);
  }

  // Fee simulation calculation
  const simResult = React.useMemo(() => {
    const aum = parseFloat(simAum) || 0;
    const returnPct = parseFloat(simReturn) || 0;
    const row = feeRows.find((r) => r.orgId === simOrgId) ?? feeRows[0];
    if (!row) return null;

    const mgmtFee = aum * (row.managementFeePct / 100);
    const profit = aum * (returnPct / 100);
    const perfFee = Math.max(0, profit) * (row.performanceFeePct / 100);
    const dataFee = aum * (row.dataFeePct / 100);
    const totalFee = mgmtFee + perfFee + dataFee;

    return {
      orgName: row.orgName,
      mgmtFee,
      perfFee,
      dataFee,
      totalFee,
      managementFeePct: row.managementFeePct,
      performanceFeePct: row.performanceFeePct,
      dataFeePct: row.dataFeePct,
    };
  }, [simAum, simReturn, simOrgId, feeRows]);

  // Default sim org
  React.useEffect(() => {
    if (!simOrgId && feeRows.length > 0) {
      setSimOrgId(feeRows[0].orgId);
    }
  }, [feeRows, simOrgId]);

  const totalMRR = subscriptions.reduce((sum, s) => sum + s.monthlyFee, 0);
  const totalAUM = feeRows.reduce((sum, r) => sum + r.aumUsd, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="container px-4 py-6 md:px-6">
          <div className="flex items-center justify-between">
            <PageHeader
              title="Fee Management"
              description="Manage fee schedules per client and simulate fee projections"
            />
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                <DollarSign className="mr-1 size-3" />
                MRR: ${totalMRR.toLocaleString()}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Total AUM: ${formatNumber(totalAUM / 1_000_000, 1)}M
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 py-8 md:px-6 space-y-8">
        {/* Fee Schedule Table */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-base">Fee Schedule by Client</CardTitle>
              <CardDescription>
                Click Edit to modify fee percentages for each client. Changes take effect immediately.
              </CardDescription>
            </div>
            <ExportDropdown
              data={feeRows.map((r) => ({
                client: r.orgName,
                aum: r.aumUsd,
                managementFee: r.managementFeePct,
                performanceFee: r.performanceFeePct,
                dataFee: r.dataFeePct,
              }))}
              columns={[
                { key: "client", header: "Client" },
                { key: "aum", header: "AUM ($)", format: "currency" },
                { key: "managementFee", header: "Management Fee %" },
                { key: "performanceFee", header: "Performance Fee %" },
                { key: "dataFee", header: "Data Fee %" },
              ]}
              filename="fee-schedules"
            />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">AUM</TableHead>
                  <TableHead className="text-right">Management Fee %</TableHead>
                  <TableHead className="text-right">Performance Fee %</TableHead>
                  <TableHead className="text-right">Data Fee %</TableHead>
                  <TableHead className="text-right">Est. Annual Revenue</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeRows.map((row) => {
                  const isEditing = editingOrgId === row.orgId;
                  const estRevenue =
                    row.aumUsd * (row.managementFeePct / 100) +
                    row.aumUsd * 0.15 * (row.performanceFeePct / 100) +
                    row.aumUsd * (row.dataFeePct / 100);

                  return (
                    <TableRow key={row.orgId}>
                      <TableCell className="font-medium">{row.orgName}</TableCell>
                      <TableCell className="text-right font-mono">
                        ${formatNumber(row.aumUsd / 1_000_000, 1)}M
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={editValues.managementFeePct}
                            onChange={(e) =>
                              setEditValues((v) => ({
                                ...v,
                                managementFeePct: parseFloat(e.target.value) || 0,
                              }))
                            }
                            className="w-20 ml-auto h-7 text-xs text-right"
                          />
                        ) : (
                          <span className="font-mono">{row.managementFeePct}%</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            max="50"
                            value={editValues.performanceFeePct}
                            onChange={(e) =>
                              setEditValues((v) => ({
                                ...v,
                                performanceFeePct: parseFloat(e.target.value) || 0,
                              }))
                            }
                            className="w-20 ml-auto h-7 text-xs text-right"
                          />
                        ) : (
                          <span className="font-mono">{row.performanceFeePct}%</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="5"
                            value={editValues.dataFeePct}
                            onChange={(e) =>
                              setEditValues((v) => ({
                                ...v,
                                dataFeePct: parseFloat(e.target.value) || 0,
                              }))
                            }
                            className="w-20 ml-auto h-7 text-xs text-right"
                          />
                        ) : (
                          <span className="font-mono">{row.dataFeePct}%</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-emerald-400">
                        ${Math.round(estRevenue).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon-sm" onClick={saveEditing}>
                              <Check className="size-4 text-emerald-400" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={cancelEditing}>
                              <X className="size-4 text-red-400" />
                            </Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => startEditing(row)} className="text-xs">
                            <Pencil className="mr-1 size-3" />
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {feeRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No client organizations found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Fee Simulator */}
        <Card className="border-sky-500/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="size-5 text-sky-400" />
              Fee Simulator
            </CardTitle>
            <CardDescription>Estimate fees for a given AUM and return scenario.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Client</label>
                <select
                  value={simOrgId}
                  onChange={(e) => setSimOrgId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {feeRows.map((r) => (
                    <option key={r.orgId} value={r.orgId}>
                      {r.orgName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">AUM ($)</label>
                <Input
                  type="number"
                  value={simAum}
                  onChange={(e) => setSimAum(e.target.value)}
                  placeholder="10000000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Annual Return (%)</label>
                <Input
                  type="number"
                  value={simReturn}
                  onChange={(e) => setSimReturn(e.target.value)}
                  placeholder="15"
                />
              </div>
            </div>

            {simResult && (
              <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="size-4 text-sky-400" />
                  <p className="text-sm font-medium">Fee Breakdown for {simResult.orgName}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Management ({simResult.managementFeePct}%)</p>
                    <p className="text-lg font-bold font-mono">${Math.round(simResult.mgmtFee).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Performance ({simResult.performanceFeePct}%)</p>
                    <p className="text-lg font-bold font-mono">${Math.round(simResult.perfFee).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Data ({simResult.dataFeePct}%)</p>
                    <p className="text-lg font-bold font-mono">${Math.round(simResult.dataFee).toLocaleString()}</p>
                  </div>
                  <div className="border-l border-sky-500/20 pl-4">
                    <p className="text-xs text-muted-foreground">Total Annual Fee</p>
                    <p className="text-lg font-bold font-mono text-sky-400">
                      ${Math.round(simResult.totalFee).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
