"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStrategyCatalog, type StrategyCatalogEntry } from "@/hooks/api/use-strategies";
import { Spinner } from "@/components/shared/spinner";

const DOMAIN_COLORS: Record<string, string> = {
  defi: "bg-emerald-500/10 text-emerald-600",
  cefi: "bg-blue-500/10 text-blue-600",
  tradfi: "bg-amber-500/10 text-amber-600",
  sports: "bg-purple-500/10 text-purple-600",
};

const DOMAINS = ["all", "defi", "cefi", "tradfi", "sports"] as const;

export function StrategyFamilyBrowserWidget() {
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const domain = selectedDomain === "all" ? undefined : selectedDomain;
  const { data, isLoading } = useStrategyCatalog(domain);

  const strategies: StrategyCatalogEntry[] = data?.strategies ?? [];
  const families = data?.families ?? {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Spinner />
      </div>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Strategy Family Browser</CardTitle>
          <Badge variant="outline">{strategies.length} strategies</Badge>
        </div>
        <div className="flex gap-1 pt-2">
          {DOMAINS.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDomain(d)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                selectedDomain === d
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {d === "all" ? "All" : d.toUpperCase()}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="max-h-[500px] overflow-y-auto">
        {Object.entries(families).map(([family, entries]) => (
          <div key={family} className="mb-4">
            <h3 className="text-sm font-semibold mb-2 capitalize">{family.replace(/-/g, " ")}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">ID</TableHead>
                  <TableHead>Strategy</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Parameters</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(entries as StrategyCatalogEntry[]).map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-xs">{entry.id}</TableCell>
                    <TableCell className="font-medium text-sm">{entry.label}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={DOMAIN_COLORS[entry.domain] ?? ""}>
                        {entry.domain}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {entry.params.map((p) => (
                          <Badge key={p} variant="secondary" className="text-[10px] py-0">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
