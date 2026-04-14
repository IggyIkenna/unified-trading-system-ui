"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Link2, Layers } from "lucide-react";
import referenceData from "@/lib/registry/ui-reference-data.json";

const CHAIN_NAMES: Record<string, string> = {
  "1": "Ethereum", "10": "Optimism", "56": "BSC", "100": "Gnosis", "130": "Unichain",
  "137": "Polygon", "300": "zkSync Sepolia", "324": "zkSync Era", "480": "World Chain",
  "1101": "Polygon zkEVM", "2741": "Abstract", "8453": "Base", "34443": "Mode",
  "42161": "Arbitrum", "43113": "Avalanche Fuji", "43114": "Avalanche", "57073": "Ink",
  "59141": "Linea Sepolia", "59144": "Linea", "80002": "Polygon Amoy", "81457": "Blast",
  "84532": "Base Sepolia", "168587773": "Blast Sepolia", "421614": "Arbitrum Sepolia",
  "534351": "Scroll Sepolia", "534352": "Scroll", "7777777": "Zora",
  "11155111": "Ethereum Sepolia", "11155420": "Optimism Sepolia",
};

const DEFI_INSTRUMENT_TYPES = [
  { type: "POOL", desc: "Liquidity pool (AMM DEX)" },
  { type: "LENDING", desc: "Lending/borrowing position" },
  { type: "LST", desc: "Liquid staking token" },
  { type: "YIELD_BEARING", desc: "Yield-bearing wrapper token" },
  { type: "A_TOKEN", desc: "Aave interest-bearing deposit" },
  { type: "DEBT_TOKEN", desc: "Aave variable-rate debt" },
  { type: "STAKING", desc: "Native staking position" },
  { type: "PERPETUAL", desc: "On-chain perpetual contract" },
];

interface VenueProtocol {
  protocol: string;
  chain: string | null;
}

type Registries = {
  defi_venue_to_protocol: Record<string, VenueProtocol>;
  chain_rpc_templates: Record<string, string>;
};

function maskUrl(url: string): string {
  return url.replace(/\{api_key\}/g, "****").replace(/\/v2\/.*$/, "/v2/****");
}

function groupByProtocol(mapping: Record<string, VenueProtocol>) {
  const groups: Record<string, { venues: string[]; chains: string[] }> = {};
  for (const [venue, info] of Object.entries(mapping)) {
    const proto = info.protocol;
    if (!groups[proto]) groups[proto] = { venues: [], chains: [] };
    groups[proto].venues.push(venue);
    if (info.chain && !groups[proto].chains.includes(info.chain)) {
      groups[proto].chains.push(info.chain);
    }
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

export default function DefiProtocolConfigPanel() {
  const registries = (referenceData as { registries: Registries }).registries;
  const venueMap = registries.defi_venue_to_protocol;
  const rpcTemplates = registries.chain_rpc_templates;
  const protocolGroups = groupByProtocol(venueMap);

  const mainnetChains = Object.entries(rpcTemplates).filter(
    ([id]) => !["11155111", "11155420", "84532", "421614", "80002", "43113", "300", "168587773", "534351", "59141"].includes(id)
  );
  const testnetChains = Object.entries(rpcTemplates).filter(
    ([id]) => ["11155111", "11155420", "84532", "421614", "80002", "43113", "300", "168587773", "534351", "59141"].includes(id)
  );

  return (
    <Tabs defaultValue="protocols" className="space-y-4">
      <TabsList>
        <TabsTrigger value="protocols" className="gap-2">
          <Link2 className="size-4" /> Protocols
        </TabsTrigger>
        <TabsTrigger value="chains" className="gap-2">
          <Globe className="size-4" /> Chain RPCs
        </TabsTrigger>
        <TabsTrigger value="instruments" className="gap-2">
          <Layers className="size-4" /> Instrument Types
        </TabsTrigger>
      </TabsList>

      <TabsContent value="protocols">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Protocol to Venue Mapping
              <Badge variant="outline" className="ml-2">{Object.keys(venueMap).length} venues</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Protocol</TableHead>
                  <TableHead>Venues</TableHead>
                  <TableHead className="w-[200px]">Chains</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {protocolGroups.map(([proto, group]) => (
                  <TableRow key={proto}>
                    <TableCell className="font-mono text-sm font-medium">{proto}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {group.venues.map((v) => (
                          <Badge key={v} variant="secondary" className="text-xs font-mono">{v}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {group.chains.length > 0 ? group.chains.map((c) => (
                          <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                        )) : (
                          <span className="text-xs text-muted-foreground">chain-agnostic</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="chains" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Mainnet RPC Endpoints
              <Badge variant="outline" className="ml-2">{mainnetChains.length} chains</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Chain ID</TableHead>
                  <TableHead className="w-[150px]">Network</TableHead>
                  <TableHead>RPC Endpoint (masked)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mainnetChains.sort(([a], [b]) => Number(a) - Number(b)).map(([id, url]) => (
                  <TableRow key={id}>
                    <TableCell className="font-mono text-sm">{id}</TableCell>
                    <TableCell className="font-medium text-sm">{CHAIN_NAMES[id] ?? `Chain ${id}`}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[400px]">
                      {maskUrl(url)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Testnet RPC Endpoints
              <Badge variant="outline" className="ml-2">{testnetChains.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Chain ID</TableHead>
                  <TableHead className="w-[150px]">Network</TableHead>
                  <TableHead>RPC Endpoint (masked)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testnetChains.sort(([a], [b]) => Number(a) - Number(b)).map(([id, url]) => (
                  <TableRow key={id}>
                    <TableCell className="font-mono text-sm">{id}</TableCell>
                    <TableCell className="font-medium text-sm">{CHAIN_NAMES[id] ?? `Chain ${id}`}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[400px]">
                      {maskUrl(url)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="instruments">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              DeFi Instrument Types
              <Badge variant="outline" className="ml-2">{DEFI_INSTRUMENT_TYPES.length} types</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {DEFI_INSTRUMENT_TYPES.map((item) => (
                <div key={item.type} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <Badge className="font-mono text-xs bg-amber-500/10 text-amber-600 border-amber-400" variant="outline">
                    {item.type}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{item.desc}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
