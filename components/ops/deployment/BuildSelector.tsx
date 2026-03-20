"use client"

import { useState, useEffect, useCallback } from "react";
import { Loader2, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchBuilds,
  type BuildEntry,
  type BuildEnvironment,
} from "@/hooks/deployment/_api-stub";

interface BuildSelectorProps {
  service: string;
  onSelect: (tag: string) => void;
}

const ENV_OPTIONS: { value: BuildEnvironment; label: string }[] = [
  { value: "dev", label: "Dev" },
  { value: "staging", label: "Staging" },
  { value: "prod", label: "Prod" },
];

export function BuildSelector({ service, onSelect }: BuildSelectorProps) {
  const [env, setEnv] = useState<BuildEnvironment>("dev");
  const [builds, setBuilds] = useState<BuildEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBuilds = useCallback(async () => {
    if (!service) return;
    setLoading(true);
    setError(null);
    try {
      const entries = await fetchBuilds(service, env);
      setBuilds(entries);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch builds");
      setBuilds([]);
    } finally {
      setLoading(false);
    }
  }, [service, env]);

  useEffect(() => {
    void loadBuilds();
  }, [loadBuilds]);

  return (
    <div className="space-y-2 border border-[var(--color-border)] rounded-md p-3 bg-[var(--color-bg-secondary)]">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-[var(--color-text-muted)]" />
        <span className="text-sm font-medium">Browse Available Builds</span>
      </div>

      <div className="flex gap-2">
        {/* Environment picker */}
        <div className="w-28">
          <Label className="text-xs text-[var(--color-text-muted)]">
            From env
          </Label>
          <Select
            value={env}
            onValueChange={(v) => setEnv(v as BuildEnvironment)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENV_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="text-xs"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Build picker */}
        <div className="flex-1">
          <Label className="text-xs text-[var(--color-text-muted)]">
            Select build
          </Label>
          {loading ? (
            <div className="flex items-center gap-2 h-8 text-xs text-[var(--color-text-muted)]">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading builds…
            </div>
          ) : error ? (
            <div className="text-xs text-red-400 h-8 flex items-center">
              {error}
            </div>
          ) : builds.length === 0 ? (
            <div className="text-xs text-[var(--color-text-muted)] h-8 flex items-center">
              No builds found in {env}
            </div>
          ) : (
            <Select onValueChange={onSelect}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Pick a build to pre-fill tag…" />
              </SelectTrigger>
              <SelectContent>
                {builds.map((build) => (
                  <SelectItem
                    key={build.tag}
                    value={build.tag}
                    className="text-xs"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{build.display}</span>
                      {build.is_v1 ? (
                        <Badge
                          variant="outline"
                          className="h-4 px-1 text-[10px] text-green-400 border-green-600"
                        >
                          v1
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="h-4 px-1 text-[10px] text-amber-400 border-amber-600"
                        >
                          pre-v1
                        </Badge>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <p className="text-[10px] text-[var(--color-text-muted)]">
        Selects a build tag from Artifact Registry. Pre-1.0.0 builds are allowed
        for manual deploys. The tag below will be pre-filled — you can still
        edit it manually.
      </p>
    </div>
  );
}
