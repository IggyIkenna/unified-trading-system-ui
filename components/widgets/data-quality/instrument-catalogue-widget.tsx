"use client";

/**
 * Instrument Catalogue widget (catalogue plan P3.2).
 *
 * Renders the cross-asset-group availability matrix joined from
 * DataTypeCapability registry × manifest. Cells show coverage band emoji
 * + live/batch readiness badges + retry-needed warning. Drilldown link
 * cross-references the existing `/api/data-status/*` routes.
 *
 * Source data: `/api/catalogue/instrument?file=instrument-catalogue.json`
 * (5-min server cache, regenerated nightly at 02:00 UTC).
 */

import * as React from "react";
import { useEffect, useMemo, useState } from "react";

import {
  type AssetGroupToken,
  type CatalogueEntry,
  type InstrumentCatalogue,
  coverageBand,
  fetchInstrumentCatalogue,
} from "@/lib/api/instrument-catalogue-client";
import { cn } from "@/lib/utils";

const ASSET_GROUP_ORDER: AssetGroupToken[] = ["cefi", "defi", "tradfi", "sports", "prediction"];

const BAND_CLASS: Record<ReturnType<typeof coverageBand>, string> = {
  full: "bg-emerald-500/15 text-emerald-300",
  high: "bg-emerald-500/15 text-emerald-300",
  medium: "bg-amber-500/15 text-amber-300",
  low: "bg-rose-500/15 text-rose-300",
  none: "bg-slate-500/10 text-slate-400",
};

const BAND_EMOJI: Record<ReturnType<typeof coverageBand>, string> = {
  full: "🟢",
  high: "🟢",
  medium: "🟡",
  low: "🔴",
  none: "⚪",
};

export interface InstrumentCatalogueWidgetProps {
  instanceId?: string;
  config?: Record<string, unknown>;
}

export function InstrumentCatalogueWidget(_props: InstrumentCatalogueWidgetProps): React.ReactElement {
  const [catalogue, setCatalogue] = useState<InstrumentCatalogue | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchInstrumentCatalogue()
      .then((value) => {
        if (!cancelled) setCatalogue(value);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = useMemo(() => {
    const out: Record<AssetGroupToken, CatalogueEntry[]> = {
      cefi: [],
      defi: [],
      tradfi: [],
      sports: [],
      prediction: [],
    };
    if (!catalogue) return out;
    for (const entry of catalogue.entries) {
      const ag = entry.asset_group;
      if (ag in out) out[ag].push(entry);
    }
    for (const ag of ASSET_GROUP_ORDER) {
      out[ag].sort((a, b) => {
        const dt = a.data_type.localeCompare(b.data_type);
        if (dt !== 0) return dt;
        return a.venue.localeCompare(b.venue);
      });
    }
    return out;
  }, [catalogue]);

  if (error) {
    return (
      <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-300">
        Failed to load instrument catalogue: {error}
      </div>
    );
  }

  if (!catalogue) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-slate-700/40 bg-slate-900/40 text-sm text-slate-400">
        Loading instrument catalogue…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between border-b border-slate-700/40 pb-2">
        <h2 className="text-lg font-semibold text-slate-100">Instrument Catalogue</h2>
        <span className="text-xs text-slate-400">
          {catalogue.entries.length} tuples · refreshed {formatGenerated(catalogue.generated_at)}
        </span>
      </header>

      <Legend />

      {ASSET_GROUP_ORDER.map((ag) => {
        const entries = grouped[ag];
        if (entries.length === 0) return null;
        return (
          <section key={ag} className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">{ag}</h3>
            <div className="overflow-x-auto rounded-md border border-slate-700/40">
              <table className="w-full min-w-[800px] text-left text-xs">
                <thead className="bg-slate-800/40 text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Data type</th>
                    <th className="px-3 py-2">Venue</th>
                    <th className="px-3 py-2">Inst. type</th>
                    <th className="px-3 py-2">Coverage</th>
                    <th className="px-3 py-2">Captured / Expected</th>
                    <th className="px-3 py-2">Latest</th>
                    <th className="px-3 py-2">Live</th>
                    <th className="px-3 py-2">Batch</th>
                    <th className="px-3 py-2">Retry</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => (
                    <CatalogueRow
                      key={`${entry.data_type}-${entry.venue}-${entry.instrument_type ?? "_"}-${i}`}
                      entry={entry}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

interface CatalogueRowProps {
  entry: CatalogueEntry;
}

function CatalogueRow({ entry }: CatalogueRowProps): React.ReactElement {
  const band = coverageBand(entry.coverage_pct, entry.expected_days);
  const drilldownHref = useMemo(() => {
    const params = new URLSearchParams({
      asset_group: entry.asset_group,
      venue: entry.venue,
      data_type: entry.data_type,
    });
    if (entry.instrument_type) params.set("instrument_type", entry.instrument_type);
    return `/admin/data?${params.toString()}`;
  }, [entry.asset_group, entry.venue, entry.data_type, entry.instrument_type]);

  return (
    <tr className="border-t border-slate-700/30 hover:bg-slate-800/20">
      <td className="px-3 py-2 font-mono text-slate-300">{entry.data_type}</td>
      <td className="px-3 py-2 font-mono text-slate-300">{entry.venue}</td>
      <td className="px-3 py-2 font-mono text-slate-400">{entry.instrument_type ?? "—"}</td>
      <td className={cn("px-3 py-2", BAND_CLASS[band])}>
        {BAND_EMOJI[band]} {(entry.coverage_pct * 100).toFixed(1)}%
      </td>
      <td className="px-3 py-2 text-slate-400">
        {entry.captured_days} / {entry.expected_days}
      </td>
      <td className="px-3 py-2 text-slate-400">{entry.latest_captured_day ?? "—"}</td>
      <td className="px-3 py-2">
        {entry.live_ready ? <Badge tone="emerald">LIVE</Badge> : <span className="text-slate-600">—</span>}
      </td>
      <td className="px-3 py-2">
        {entry.batch_ready ? <Badge tone="emerald">BATCH</Badge> : <span className="text-slate-600">—</span>}
      </td>
      <td className="px-3 py-2">
        {entry.retry_needed ? <Badge tone="amber">⚠</Badge> : null}{" "}
        <a href={drilldownHref} className="ml-2 text-xs text-sky-400 hover:underline">
          drill →
        </a>
      </td>
    </tr>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "emerald" | "amber" }): React.ReactElement {
  const className =
    tone === "emerald"
      ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-300"
      : "rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-300";
  return <span className={className}>{children}</span>;
}

function Legend(): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">
      <span>🟢 ≥90%</span>
      <span>🟡 50-90%</span>
      <span>🔴 &lt;50%</span>
      <span>⚪ no data</span>
      <span className="text-emerald-300">LIVE = streaming + latest within 1 day</span>
      <span className="text-emerald-300">BATCH = batch-capable + ≥90% coverage</span>
      <span className="text-amber-300">⚠ = retry needed</span>
    </div>
  );
}

function formatGenerated(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
