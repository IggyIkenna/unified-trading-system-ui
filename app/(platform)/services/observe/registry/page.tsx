"use client";

import referenceData from "@/lib/registry/ui-reference-data.json";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import * as React from "react";

type SortDir = "asc" | "desc";

const registries = referenceData.registries;
const uacEnums = referenceData.uac_enums as Record<string, string[]>;

const DEFI_HIGHLIGHT_ENUMS = new Set(["InstrumentType", "InstructionType", "OperationType"]);

const CHAIN_ID_LABELS: Record<string, string> = {
  "1": "Ethereum", "10": "Optimism", "56": "BSC", "100": "Gnosis", "130": "Unichain",
  "137": "Polygon", "300": "zkSync Sepolia", "324": "zkSync", "480": "World Chain",
  "1101": "Polygon zkEVM", "2741": "Abstract", "8453": "Base", "34443": "Mode",
  "42161": "Arbitrum", "43113": "Avax Fuji", "43114": "Avalanche", "57073": "Ink",
  "59141": "Linea Sepolia", "59144": "Linea", "80002": "Polygon Amoy", "81457": "Blast",
  "84532": "Base Sepolia", "168587773": "Blast Sepolia", "421614": "Arb Sepolia",
  "534351": "Scroll Sepolia", "534352": "Scroll", "7777777": "Zora",
  "11155111": "Sepolia", "11155420": "OP Sepolia",
};

const CATEGORY_COLORS: Record<string, string> = {
  cefi: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  defi: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  tradfi: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  sports: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

function useSortable<T>(data: T[], key: keyof T, defaultDir: SortDir = "asc") {
  const [sortKey, setSortKey] = React.useState<keyof T>(key);
  const [sortDir, setSortDir] = React.useState<SortDir>(defaultDir);

  const toggle = React.useCallback((k: keyof T) => {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
  }, [sortKey]);

  const sorted = React.useMemo(() => {
    return [...data].sort((a, b) => {
      const av = String(a[sortKey] ?? "");
      const bv = String(b[sortKey] ?? "");
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [data, sortKey, sortDir]);

  return { sorted, sortKey, sortDir, toggle };
}

function SortHeader({ label, field, sortKey, sortDir, onSort }: {
  label: string; field: string; sortKey: string; sortDir: SortDir; onSort: (f: string) => void;
}) {
  const arrow = field === sortKey ? (sortDir === "asc" ? " \u2191" : " \u2193") : "";
  return (
    <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => onSort(field)}>
      {label}{arrow}
    </TableHead>
  );
}

// --- DeFi Protocols Tab ---
function DefiProtocolsTab() {
  const [chainFilter, setChainFilter] = React.useState("");
  const defiMap = registries.defi_venue_to_protocol as Record<string, { protocol: string; chain: string | null }>;
  const categoryMap = registries.venue_category_map as Record<string, string>;

  const rows = React.useMemo(() => {
    return Object.entries(defiMap).map(([venue, info]) => ({
      venue, protocol: info.protocol, chain: info.chain ?? "-", category: categoryMap[venue] ?? "defi",
    })).filter((r) => !chainFilter || r.chain.toLowerCase().includes(chainFilter.toLowerCase()));
  }, [chainFilter, defiMap, categoryMap]);

  const { sorted, sortKey, sortDir, toggle } = useSortable(rows, "venue");
  const onSort = (f: string) => toggle(f as keyof (typeof rows)[0]);

  return (
    <div className="space-y-3">
      <Input placeholder="Filter by chain..." value={chainFilter} onChange={(e) => setChainFilter(e.target.value)}
        className="max-w-xs h-8 text-xs" />
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader label="Venue ID" field="venue" sortKey={String(sortKey)} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Protocol" field="protocol" sortKey={String(sortKey)} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Chain" field="chain" sortKey={String(sortKey)} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Category" field="category" sortKey={String(sortKey)} sortDir={sortDir} onSort={onSort} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((r) => (
              <TableRow key={r.venue}>
                <TableCell className="font-mono text-xs">{r.venue}</TableCell>
                <TableCell className="text-xs">{r.protocol}</TableCell>
                <TableCell className="text-xs"><Badge variant="outline" className="text-[10px]">{r.chain}</Badge></TableCell>
                <TableCell><Badge className={`text-[10px] ${CATEGORY_COLORS[r.category] ?? ""}`}>{r.category}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">{sorted.length} protocols</p>
    </div>
  );
}

// --- Chains Tab ---
function ChainsTab() {
  const chains = registries.chain_rpc_templates as Record<string, string>;
  const rows = Object.entries(chains).map(([id, url]) => ({
    id, label: CHAIN_ID_LABELS[id] ?? `Chain ${id}`,
    url: url.replace(/\{api_key\}/g, "***"),
  }));
  const { sorted, sortKey, sortDir, toggle } = useSortable(rows, "id");
  const onSort = (f: string) => toggle(f as keyof (typeof rows)[0]);

  return (
    <div className="space-y-3">
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader label="Chain ID" field="id" sortKey={String(sortKey)} sortDir={sortDir} onSort={onSort} />
              <TableHead>Name</TableHead>
              <TableHead>RPC URL Template</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.id}</TableCell>
                <TableCell className="text-xs">{r.label}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{r.url}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">{rows.length} chains</p>
    </div>
  );
}

// --- Venues Tab ---
function VenuesTab() {
  const [catFilter, setCatFilter] = React.useState("");
  const categoryMap = registries.venue_category_map as Record<string, string>;
  const instrumentMap = registries.instrument_types_by_venue as Record<string, string[]>;

  const rows = React.useMemo(() => {
    return Object.entries(categoryMap).map(([venue, cat]) => ({
      venue, category: cat, instruments: (instrumentMap[venue] ?? []).join(", ") || "-",
    })).filter((r) => !catFilter || r.category === catFilter);
  }, [catFilter, categoryMap, instrumentMap]);

  const { sorted, sortKey, sortDir, toggle } = useSortable(rows, "venue");
  const onSort = (f: string) => toggle(f as keyof (typeof rows)[0]);
  const categories = [...new Set(Object.values(categoryMap))].sort();

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Badge variant={catFilter === "" ? "default" : "outline"} className="cursor-pointer text-xs"
          onClick={() => setCatFilter("")}>All</Badge>
        {categories.map((c) => (
          <Badge key={c} variant={catFilter === c ? "default" : "outline"}
            className={`cursor-pointer text-xs ${catFilter !== c ? CATEGORY_COLORS[c] ?? "" : ""}`}
            onClick={() => setCatFilter(catFilter === c ? "" : c)}>{c}</Badge>
        ))}
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader label="Venue ID" field="venue" sortKey={String(sortKey)} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Category" field="category" sortKey={String(sortKey)} sortDir={sortDir} onSort={onSort} />
              <TableHead>Instrument Types</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((r) => (
              <TableRow key={r.venue}>
                <TableCell className="font-mono text-xs">{r.venue}</TableCell>
                <TableCell><Badge className={`text-[10px] ${CATEGORY_COLORS[r.category] ?? ""}`}>{r.category}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.instruments}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">{sorted.length} venues</p>
    </div>
  );
}

// --- Enums Tab ---
function EnumsTab() {
  const enumNames = Object.keys(uacEnums).sort();
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground mb-3">{enumNames.length} UAC enums</p>
      {enumNames.map((name) => {
        const values = uacEnums[name] ?? [];
        const highlighted = DEFI_HIGHLIGHT_ENUMS.has(name);
        return (
          <Collapsible key={name}>
            <CollapsibleTrigger className={`flex items-center gap-2 w-full px-3 py-2 text-left text-sm rounded-md
              hover:bg-muted/50 ${highlighted ? "font-semibold text-purple-400" : ""}`}>
              <ChevronRight className="h-3 w-3 transition-transform [[data-state=open]>&]:rotate-90" />
              {name}
              <span className="text-xs text-muted-foreground ml-auto">{values.length}</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 pb-3 pt-1">
              <div className="flex flex-wrap gap-1.5">
                {values.map((v) => (
                  <Badge key={v} variant="outline" className="text-[10px] font-mono">{v}</Badge>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}

// --- Page ---
export default function RegistryBrowserPage() {
  const [tab, setTab] = React.useState("defi");

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Registry Browser</h1>
        <p className="text-sm text-muted-foreground">UAC reference data: venues, protocols, chains, enums</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="defi">DeFi Protocols</TabsTrigger>
          <TabsTrigger value="chains">Chains</TabsTrigger>
          <TabsTrigger value="venues">Venues</TabsTrigger>
          <TabsTrigger value="enums">Enums</TabsTrigger>
        </TabsList>

        <TabsContent value="defi" className="mt-4"><DefiProtocolsTab /></TabsContent>
        <TabsContent value="chains" className="mt-4"><ChainsTab /></TabsContent>
        <TabsContent value="venues" className="mt-4"><VenuesTab /></TabsContent>
        <TabsContent value="enums" className="mt-4"><EnumsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
