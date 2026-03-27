"use client";

import { CollapsibleSection } from "@/components/widgets/shared";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/reference-data";
import { usePositionsData } from "./positions-data-context";

export function AccountBalancesWidget(_props: WidgetComponentProps) {
  const { balances, balancesLoading } = usePositionsData();

  const totalBalance = balances.reduce((sum, b) => sum + b.total, 0);

  return (
    <CollapsibleSection
      title="Account Balances"
      defaultOpen={false}
      count={balances.length}
      trailing={
        !balancesLoading && totalBalance > 0 ? (
          <Badge variant="outline" className="font-mono text-[10px]">
            ${formatCurrency(totalBalance)} total
          </Badge>
        ) : undefined
      }
    >
      {balancesLoading ? (
        <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          <span className="text-[11px]">Loading balances...</span>
        </div>
      ) : balances.length === 0 ? (
        <p className="text-[11px] text-muted-foreground text-center py-4">No balance data available</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="px-2 py-1 text-[11px]">Venue</TableHead>
              <TableHead className="px-2 py-1 text-[11px] text-right">Free</TableHead>
              <TableHead className="px-2 py-1 text-[11px] text-right">Locked</TableHead>
              <TableHead className="px-2 py-1 text-[11px] text-right">Total</TableHead>
              <TableHead className="px-2 py-1 text-[11px] w-[140px]">Utilization</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {balances.map((balance) => {
              const utilization = balance.total > 0 ? (balance.locked / balance.total) * 100 : 0;
              return (
                <TableRow key={balance.venue} className="border-border/30">
                  <TableCell className="px-2 py-1 text-[11px] font-medium">{balance.venue}</TableCell>
                  <TableCell className="px-2 py-1 text-[11px] text-right font-mono">
                    ${formatCurrency(balance.free)}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-[11px] text-right font-mono">
                    ${formatCurrency(balance.locked)}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-[11px] text-right font-mono font-medium">
                    ${formatCurrency(balance.total)}
                  </TableCell>
                  <TableCell className="px-2 py-1">
                    <div className="flex items-center gap-1.5">
                      <Progress value={utilization} className="h-1.5 flex-1" />
                      <span className="text-[10px] font-mono w-8 text-right">{utilization.toFixed(0)}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </CollapsibleSection>
  );
}
