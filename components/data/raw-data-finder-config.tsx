"use client";

/**
 * FinderBrowser column configuration for /services/data/raw
 *
 * Hierarchy: Category → Venue → Instrument Type (folder) → Instrument → Data Type
 * Source: sharding_config dimensions: [category, venue, instrument_type, instrument, data_type, date]
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { finderText } from "@/components/shared/finder/finder-text-sizes";
import type {
  FinderColumnDef,
  FinderContextStats,
  FinderItem,
  FinderSelections,
} from "@/components/shared/finder/types";
import {
  DATA_CATEGORY_LABELS,
  VENUES_BY_ASSET_GROUP,
  FOLDERS_BY_ASSET_GROUP,
  type DataCategory,
  type DataFolder,
  type DataType,
  type InstrumentEntry,
} from "@/lib/types/data-service";
import { MOCK_INSTRUMENTS, MOCK_INSTRUMENT_COUNTS, MOCK_PIPELINE_STAGES } from "@/lib/mocks/fixtures/data-service";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

// Data types available per folder (derived from instrument data types)
function getDataTypesForFolderVenue(venue: string, folder: DataFolder, cat: DataCategory): DataType[] {
  const instruments = MOCK_INSTRUMENTS.filter((i) => i.venue === venue && i.folder === folder);
  if (instruments.length === 0) {
    // Fallback based on folder type
    const defaults: Record<string, DataType[]> = {
      spot: ["ohlcv", "trades", "book_snapshot_5"],
      perpetuals: ["ohlcv", "trades", "book_snapshot_5", "funding_rates", "open_interest"],
      options: ["ohlcv", "trades", "greeks", "iv_surface"],
      futures: ["ohlcv", "trades", "book_snapshot_5"],
      equity: ["ohlcv", "trades"],
      rates: ["ohlcv"],
      pool_state: ["pool_state", "swap_events", "price_feeds"],
      lending: ["lending_rates", "price_feeds"],
      staking: ["staking_yields", "price_feeds"],
      swaps: ["swap_events"],
      odds: ["odds", "settlement_prices"],
      predictions: ["odds", "settlement_prices"],
      fixtures: ["odds", "game_events"],
      game_events: ["game_events"],
    };
    return defaults[folder] ?? ["ohlcv"];
  }
  const all = new Set<DataType>();
  for (const inst of instruments) {
    for (const dt of inst.dataTypes) all.add(dt);
  }
  return [...all];
}

// Mock completion percentages by data type (seeded deterministically; optional instrument for per-symbol variance)
function getDataTypeCompletion(venue: string, folder: string, dataType: string, instrumentKey?: string): number {
  const seed = (venue.length + folder.length + dataType.length + (instrumentKey?.length ?? 0)) % 100;
  const vals: Record<string, number> = {
    ohlcv: 95,
    trades: 88,
    book_snapshot_5: 72,
    book_snapshot_25: 45,
    funding_rates: 91,
    open_interest: 84,
    greeks: 67,
    iv_surface: 58,
    pool_state: 79,
    swap_events: 82,
    price_feeds: 93,
    lending_rates: 88,
    staking_yields: 95,
    odds: 76,
    game_events: 83,
    settlement_prices: 91,
    liquidations: 69,
    tick: 45,
  };
  const base = vals[dataType] ?? 70;
  return Math.max(0, Math.min(100, base + (seed % 15) - 7));
}

const CATEGORY_BADGE: Record<DataCategory, string> = {
  cefi: "border-blue-400/30 text-blue-400",
  tradfi: "border-amber-400/30 text-amber-400",
  defi: "border-violet-400/30 text-violet-400",
  onchain_perps: "border-cyan-400/30 text-cyan-400",
  prediction_market: "border-pink-400/30 text-pink-400",
  sports: "border-emerald-400/30 text-emerald-400",
};

export const RAW_DATA_COLUMNS: FinderColumnDef[] = [
  {
    id: "category",
    label: "Category",
    width: "w-[220px]",
    defaultWidthPx: 220,
    minWidthPx: 168,
    getItems: (): FinderItem[] => {
      const rawStage = MOCK_PIPELINE_STAGES.find((s) => s.stage === "raw");
      return (Object.keys(DATA_CATEGORY_LABELS) as DataCategory[]).map((cat) => {
        const stageData = rawStage?.byCategory?.find((b) => b.category === cat);
        return {
          id: cat,
          label: DATA_CATEGORY_LABELS[cat],
          count: stageData?.completedShards ?? 0,
          data: { cat, completionPct: stageData?.completionPct ?? 0 },
        };
      });
    },
    renderLabel: (item) => {
      const { cat, completionPct } = item.data as {
        cat: DataCategory;
        completionPct: number;
      };
      return (
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <div className="flex items-start gap-1.5 min-w-0">
            <Badge variant="outline" className={cn(finderText.micro, "px-1 py-0 shrink-0", CATEGORY_BADGE[cat])}>
              {cat.toUpperCase().slice(0, 4)}
            </Badge>
            <span className={cn("flex-1 min-w-0 font-medium break-words leading-snug text-left", finderText.body)}>
              {DATA_CATEGORY_LABELS[cat]}
            </span>
          </div>
          <div className="flex items-center gap-1 ml-0.5">
            <div className="flex-1 h-0.5 rounded-full bg-muted/60 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full",
                  completionPct >= 90 ? "bg-emerald-400" : completionPct >= 70 ? "bg-yellow-400" : "bg-red-400",
                )}
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <span className={cn(finderText.micro, "text-muted-foreground w-8 text-right")}>
              {formatPercent(completionPct, 0)}
            </span>
          </div>
        </div>
      );
    },
    renderIcon: () => null,
    getCount: () => null,
  },
  {
    id: "venue",
    label: "Venue",
    width: "w-[165px]",
    visibleWhen: (sel) => sel["category"] !== null,
    getItems: (sel): FinderItem[] => {
      const { cat } = (sel["category"]?.data ?? {}) as {
        cat: DataCategory;
        completionPct: number;
      };
      if (!cat) return [];
      const venues = VENUES_BY_ASSET_GROUP[cat] ?? [];
      return venues.map((venue) => {
        const counts = MOCK_INSTRUMENT_COUNTS[venue];
        return {
          id: venue,
          label: venue.replace(/_/g, " "),
          count: counts?.total ?? 0,
          data: { venue, cat },
        };
      });
    },
  },
  {
    id: "folder",
    label: "Instrument Type",
    width: "w-[170px]",
    visibleWhen: (sel) => sel["venue"] !== null,
    getItems: (sel): FinderItem[] => {
      const { venue, cat } = (sel["venue"]?.data ?? {}) as {
        venue: string;
        cat: DataCategory;
      };
      if (!venue || !cat) return [];
      const folders = FOLDERS_BY_ASSET_GROUP[cat] ?? [];
      return folders.map((folder) => {
        const instruments = MOCK_INSTRUMENTS.filter((i) => i.venue === venue && i.folder === folder);
        return {
          id: folder,
          label: folder.replace(/_/g, " "),
          count: instruments.length,
          data: { folder, venue, cat },
        };
      });
    },
    renderLabel: (item) => {
      const { folder } = item.data as { folder: DataFolder };
      return (
        <span
          className={cn("flex-1 min-w-0 font-medium capitalize break-words leading-snug text-left", finderText.body)}
        >
          {folder.replace(/_/g, " ")}
        </span>
      );
    },
    renderIcon: () => null,
  },
  {
    id: "instrument",
    label: "Instrument",
    width: "w-[200px]",
    defaultWidthPx: 200,
    minWidthPx: 140,
    visibleWhen: (sel) => sel["folder"] !== null,
    paginate: true,
    showSearch: true,
    searchPlaceholder: "Filter instruments…",
    getItems: (sel): FinderItem[] => {
      const { venue, folder } = (sel["folder"]?.data ?? {}) as {
        folder: DataFolder;
        venue: string;
        cat: DataCategory;
      };
      if (!venue || !folder) return [];
      return MOCK_INSTRUMENTS.filter((i) => i.venue === venue && i.folder === folder).map((inst) => ({
        id: inst.instrumentKey,
        label: inst.symbol,
        data: inst,
      }));
    },
    renderLabel: (item) => {
      const inst = item.data as InstrumentEntry;
      return (
        <span
          className={cn("flex-1 min-w-0 font-medium font-mono break-words leading-snug text-left", finderText.body)}
        >
          {inst.symbol}
        </span>
      );
    },
    renderIcon: () => null,
    getCount: () => null,
  },
  {
    id: "datatype",
    label: "Data Types",
    width: "flex-1",
    visibleWhen: (sel) => sel["instrument"] !== null,
    getItems: (sel): FinderItem[] => {
      const inst = sel["instrument"]?.data as InstrumentEntry | undefined;
      if (!inst?.venue || !inst.folder) return [];
      const dataTypes =
        inst.dataTypes.length > 0 ? inst.dataTypes : getDataTypesForFolderVenue(inst.venue, inst.folder, inst.category);
      return dataTypes.map((dt) => {
        const pct = getDataTypeCompletion(inst.venue, inst.folder, dt, inst.instrumentKey);
        return {
          id: dt,
          label: dt.replace(/_/g, " "),
          data: {
            dt,
            venue: inst.venue,
            folder: inst.folder,
            symbol: inst.symbol,
            instrumentKey: inst.instrumentKey,
            completionPct: pct,
          },
        };
      });
    },
    renderLabel: (item) => {
      const { dt, completionPct } = item.data as {
        dt: string;
        completionPct: number;
      };
      const color = completionPct >= 90 ? "text-emerald-400" : completionPct >= 70 ? "text-yellow-400" : "text-red-400";
      return (
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <span
            className={cn("flex-1 min-w-0 font-medium capitalize break-words leading-snug text-left", finderText.body)}
          >
            {dt.replace(/_/g, " ")}
          </span>
          <span className={cn(finderText.body, "font-mono shrink-0", color)}>{completionPct}%</span>
        </div>
      );
    },
    renderIcon: () => null,
    getCount: () => null,
  },
];

export function getRawDataContextStats(selections: FinderSelections): FinderContextStats {
  const catData = selections["category"]?.data as { cat: DataCategory; completionPct: number } | undefined;
  const venueData = selections["venue"]?.data as { venue: string; cat: DataCategory } | undefined;
  const folderData = selections["folder"]?.data as { folder: DataFolder; venue: string; cat: DataCategory } | undefined;
  const instSelected = selections["instrument"]?.data as InstrumentEntry | undefined;
  const dtData = selections["datatype"]?.data as
    | {
        dt: string;
        venue: string;
        folder: string;
        symbol?: string;
        instrumentKey?: string;
        completionPct: number;
      }
    | undefined;

  if (dtData) {
    const pct = dtData.completionPct;
    const color = pct >= 90 ? "bg-emerald-400" : pct >= 70 ? "bg-yellow-400" : "bg-red-400";
    const sym = dtData.symbol ? `${dtData.symbol} · ` : "";
    return {
      name: `${sym}${dtData.venue.replace(/_/g, " ")} · ${dtData.dt.replace(/_/g, " ")}`,
      metrics: [{ label: "completion", value: pct, format: "percent" }],
      progressBar: { value: pct, color },
    };
  }

  if (instSelected) {
    const dts =
      instSelected.dataTypes.length > 0
        ? instSelected.dataTypes
        : getDataTypesForFolderVenue(instSelected.venue, instSelected.folder, instSelected.category);
    const avgPct = Math.round(
      dts.reduce(
        (s, dt) => s + getDataTypeCompletion(instSelected.venue, instSelected.folder, dt, instSelected.instrumentKey),
        0,
      ) / Math.max(1, dts.length),
    );
    const color = avgPct >= 90 ? "bg-emerald-400" : avgPct >= 70 ? "bg-yellow-400" : "bg-red-400";
    return {
      name: instSelected.symbol,
      metrics: [
        { label: "data types", value: dts.length },
        { label: "avg completion", value: avgPct, format: "percent" },
      ],
      progressBar: { value: avgPct, color },
    };
  }

  if (folderData) {
    const dataTypes = getDataTypesForFolderVenue(folderData.venue, folderData.folder, folderData.cat);
    const avgPct = Math.round(
      dataTypes.reduce((s, dt) => s + getDataTypeCompletion(folderData.venue, folderData.folder, dt), 0) /
        dataTypes.length,
    );
    const color = avgPct >= 90 ? "bg-emerald-400" : avgPct >= 70 ? "bg-yellow-400" : "bg-red-400";
    return {
      name: `${folderData.venue.replace(/_/g, " ")} / ${folderData.folder.replace(/_/g, " ")}`,
      metrics: [
        { label: "data types", value: dataTypes.length },
        { label: "avg completion", value: avgPct, format: "percent" },
      ],
      progressBar: { value: avgPct, color },
    };
  }

  if (venueData) {
    const folders = FOLDERS_BY_ASSET_GROUP[venueData.cat] ?? [];
    const avgPct = Math.round(
      folders.reduce((s, f) => {
        const dts = getDataTypesForFolderVenue(venueData.venue, f, venueData.cat);
        return s + dts.reduce((ss, dt) => ss + getDataTypeCompletion(venueData.venue, f, dt), 0) / dts.length;
      }, 0) / folders.length,
    );
    const color = avgPct >= 90 ? "bg-emerald-400" : avgPct >= 70 ? "bg-yellow-400" : "bg-red-400";
    return {
      name: venueData.venue.replace(/_/g, " "),
      metrics: [
        { label: "folders", value: folders.length },
        { label: "avg completion", value: avgPct, format: "percent" },
      ],
      progressBar: { value: avgPct, color },
    };
  }

  if (catData) {
    return {
      name: DATA_CATEGORY_LABELS[catData.cat],
      metrics: [
        {
          label: "completion",
          value: catData.completionPct,
          format: "percent",
        },
        {
          label: "venues",
          value: (VENUES_BY_ASSET_GROUP[catData.cat] ?? []).length,
        },
      ],
      progressBar: {
        value: catData.completionPct,
        color:
          catData.completionPct >= 90 ? "bg-emerald-400" : catData.completionPct >= 70 ? "bg-yellow-400" : "bg-red-400",
      },
    };
  }

  const rawStage = MOCK_PIPELINE_STAGES.find((s) => s.stage === "raw");
  return {
    name: "Raw Data",
    metrics: [
      {
        label: "overall completion",
        value: rawStage?.completionPct != null ? formatNumber(rawStage.completionPct, 1) : "—",
      },
      {
        label: "shards complete",
        value: rawStage?.completedShards?.toLocaleString() ?? "—",
      },
      { label: "failed", value: rawStage?.failedShards ?? 0 },
    ],
    progressBar: {
      value: rawStage?.completionPct ?? 0,
      color: "bg-sky-400",
    },
  };
}
