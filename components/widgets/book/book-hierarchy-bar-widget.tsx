"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/shared/spinner";
import { useOrganizationsList } from "@/hooks/api/use-organizations";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useBookTradeData } from "./book-data-context";

export function BookHierarchyBarWidget(_props: WidgetComponentProps) {
  const { orgId, setOrgId, clientId, setClientId, strategyId, setStrategyId, organizations, registryStrategies } =
    useBookTradeData();

  const { isLoading: orgsLoading, isError: orgsError } = useOrganizationsList();

  if (orgsLoading) {
    return (
      <div className="px-2 py-2 flex items-center gap-2 text-muted-foreground">
        <Spinner size="sm" />
        <span className="text-xs">Loading organizations…</span>
      </div>
    );
  }

  if (orgsError) {
    return (
      <div className="px-2 py-2 text-xs text-rose-500">
        Failed to load organizations. Check your connection and refresh.
      </div>
    );
  }

  return (
    <div className="px-2 py-2 flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground whitespace-nowrap">Org</label>
        <Select
          value={orgId}
          onValueChange={(v) => {
            setOrgId(v);
            setClientId("");
          }}
        >
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue placeholder="Select org" />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
            {organizations.length === 0 && (
              <SelectItem value="default" disabled>
                No organizations
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground whitespace-nowrap">Client</label>
        <Input
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="Client ID"
          className="w-[160px] h-8 text-xs"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground whitespace-nowrap">Strategy</label>
        <Select value={strategyId} onValueChange={setStrategyId}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="manual">Manual (unlinked)</SelectItem>
            {registryStrategies
              .filter((s) => s.status === "live" || s.status === "paper")
              .map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <div className="flex items-center gap-2">
                    <span>{s.name}</span>
                    <span className="text-caption text-muted-foreground">{s.assetClass}</span>
                  </div>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
