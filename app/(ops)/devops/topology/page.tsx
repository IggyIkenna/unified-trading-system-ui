"use client";

import { useMemo, useState } from "react";
import { useTabParam } from "@/hooks/use-tab-param";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import topology from "@/lib/registry/system-topology.json";

const MATURITY_COLORS: Record<string, string> = {
  C4: "bg-green-600 text-white",
  C3: "bg-amber-500 text-white",
  C2: "bg-orange-500 text-white",
  C1: "bg-red-600 text-white",
  C0: "bg-red-800 text-white",
  D0: "bg-zinc-500 text-white",
  D1: "bg-amber-500 text-white",
  D2: "bg-orange-500 text-white",
  D3: "bg-green-500 text-white",
  D4: "bg-green-600 text-white",
  D5: "bg-green-700 text-white",
};

const CATEGORIES = ["ALL", "CEFI", "DEFI", "TRADFI", "SPORTS", "PREDICTION"] as const;

type Strategy = (typeof topology.strategies)[number];
type DataFlow = (typeof topology.data_flows)[number];

function MaturityBadge({ status }: { status: string }) {
  return (
    <Badge className={`text-xs font-mono ${MATURITY_COLORS[status] ?? "bg-zinc-400 text-white"}`}>
      {status}
    </Badge>
  );
}

/* ── Strategies Tab ─────────────────────────────────────────────── */

function StrategiesTab() {
  const [filter, setFilter] = useState<string>("ALL");

  const filtered = useMemo(() => {
    const list = topology.strategies as Strategy[];
    return filter === "ALL" ? list : list.filter((s) => s.category === filter);
  }, [filter]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <Badge
            key={cat}
            variant={filter === cat ? "default" : "outline"}
            className="cursor-pointer select-none"
            onClick={() => setFilter(cat)}
          >
            {cat}
          </Badge>
        ))}
        <span className="text-xs text-muted-foreground self-center ml-2">
          {filtered.length} strategies
        </span>
      </div>

      <div className="border rounded-md overflow-auto max-h-[70vh]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[220px]">Strategy ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead className="text-center">Venues</TableHead>
              <TableHead className="text-center">Code</TableHead>
              <TableHead className="text-center">Deploy</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.strategy_id}>
                <TableCell className="font-mono text-xs">{s.strategy_id}</TableCell>
                <TableCell className="text-sm">{s.display_name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{s.category}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{s.domain}</TableCell>
                <TableCell className="text-center" title={s.venues.join(", ")}>
                  <span className="text-xs tabular-nums">{s.venues.length}</span>
                </TableCell>
                <TableCell className="text-center">
                  <MaturityBadge status={s.maturity.code.status} />
                </TableCell>
                <TableCell className="text-center">
                  <MaturityBadge status={s.maturity.deployment.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ── Data Flows Tab ─────────────────────────────────────────────── */

function DataFlowsTab() {
  const flows = topology.data_flows as DataFlow[];

  return (
    <div className="border rounded-md overflow-auto max-h-[70vh]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">ID</TableHead>
            <TableHead>Domain</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>Pipeline</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flows.map((f) => (
            <TableRow key={f.id}>
              <TableCell className="font-mono text-xs">{f.id}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">{f.domain}</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={f.mode === "live" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {f.mode}
                </Badge>
              </TableCell>
              <TableCell className="text-xs">
                <span className="font-mono">{f.service}</span>
                <span className="text-muted-foreground mx-2">{"-->"}</span>
                <span className="font-mono">{f.api}</span>
                <span className="text-muted-foreground mx-2">{"-->"}</span>
                <span className="font-mono">{f.ui}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ── UI/API Stacks Tab ──────────────────────────────────────────── */

function UiApiStacksTab() {
  const mapping = topology.ui_api_mapping as Record<
    string,
    { ui: string | null; ui_port: number | null; api: string; api_port: number; api_module: string }
  >;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Object.entries(mapping).map(([key, stack]) => (
        <Card key={key}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono">{key}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">API</span>
              <span className="font-mono">
                {stack.api}
                <Badge variant="outline" className="ml-2 text-[10px]">:{stack.api_port}</Badge>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">UI</span>
              <span className="font-mono">
                {stack.ui ?? "none"}
                {stack.ui_port != null && (
                  <Badge variant="outline" className="ml-2 text-[10px]">:{stack.ui_port}</Badge>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Module</span>
              <span className="font-mono">{stack.api_module}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────── */

export default function TopologyPage() {
  const [tab, setTab] = useTabParam("strategies");

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <PageHeader
            title="System Topology"
            description="Strategy manifest, data flow pipelines, and UI/API stack mappings."
          />
          <Badge variant="outline" className="text-xs tabular-nums">
            {topology.strategies.length} strategies / {topology.data_flows.length} flows
          </Badge>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="strategies">Strategies</TabsTrigger>
            <TabsTrigger value="data-flows">Data Flows</TabsTrigger>
            <TabsTrigger value="stacks">UI/API Stacks</TabsTrigger>
          </TabsList>

          <TabsContent value="strategies">
            <StrategiesTab />
          </TabsContent>
          <TabsContent value="data-flows">
            <DataFlowsTab />
          </TabsContent>
          <TabsContent value="stacks">
            <UiApiStacksTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
