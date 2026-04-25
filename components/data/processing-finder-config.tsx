"use client";

/**
 * FinderBrowser column configuration for /services/data/processing
 *
 * Hierarchy: Category → Venue → Instrument Type (folder) → Instrument → Timeframe
 * Source: sharding_config dimensions: [category, venue, instrument_type, instrument, date, timeframe]
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
  type InstrumentEntry,
  type Timeframe,
} from "@/lib/types/data-service";
import {
  MOCK_INSTRUMENTS,
  MOCK_INSTRUMENT_COUNTS,
  MOCK_PIPELINE_STAGES,
  MOCK_TIMEFRAME_STATUS,
} from "@/lib/mocks/fixtures/data-service";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

const ALL_TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "1h", "4h", "1d"];

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  "1m": "1 min",
  "5m": "5 min",
  "15m": "15 min",
  "1h": "1 hour",
  "4h": "4 hour",
  "1d": "Daily",
};

function getTimeframeCompletion(venue: string, folder: string, timeframe: Timeframe, instrumentKey?: string): number {
  const match = MOCK_TIMEFRAME_STATUS.find((t) => t.timeframe === timeframe);
  let base = match
    ? match.completionPct
    : ((
        {
          "1m": 12,
          "5m": 8,
          "15m": 5,
          "1h": 3,
          "4h": 2,
          "1d": 1,
        } as Record<Timeframe, number>
      )[timeframe] ?? 0);
  if (instrumentKey) {
    const tweak = instrumentKey.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 21;
    base = Math.max(0, Math.min(100, base + tweak - 10));
  }
  return base;
}

const CATEGORY_BADGE: Record<DataCategory, string> = {
  cefi: "border-blue-400/30 text-blue-400",
  tradfi: "border-amber-400/30 text-amber-400",
  defi: "border-violet-400/30 text-violet-400",
  onchain_perps: "border-cyan-400/30 text-cyan-400",
  prediction_market: "border-pink-400/30 text-pink-400",
  sports: "border-emerald-400/30 text-emerald-400",
};

export const PROCESSING_COLUMNS: FinderColumnDef[] = [
  {
    id: "category",
    label: "Category",
    width: "w-[220px]",
    defaultWidthPx: 220,
    minWidthPx: 168,
    getItems: (): FinderItem[] => {
      const stage = MOCK_PIPELINE_STAGES.find((s) => s.stage === "processing");
      return (Object.keys(DATA_CATEGORY_LABELS) as DataCategory[]).map((cat) => {
        const stageData = stage?.byCategory?.find((b) => b.category === cat);
        return {
          id: cat,
          label: DATA_CATEGORY_LABELS[cat],
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
                  completionPct >= 50 ? "bg-emerald-400" : completionPct >= 20 ? "bg-yellow-400" : "bg-red-400",
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
      return (VENUES_BY_ASSET_GROUP[cat] ?? []).map((venue) => ({
        id: venue,
        label: venue.replace(/_/g, " "),
        count: MOCK_INSTRUMENT_COUNTS[venue]?.total ?? 0,
        data: { venue, cat },
      }));
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
      return (FOLDERS_BY_ASSET_GROUP[cat] ?? []).map((folder) => ({
        id: folder,
        label: folder.replace(/_/g, " "),
        data: { folder, venue, cat },
      }));
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
    getCount: () => null,
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
    id: "timeframe",
    label: "Timeframes",
    width: "flex-1",
    visibleWhen: (sel) => sel["instrument"] !== null,
    getItems: (sel): FinderItem[] => {
      const inst = sel["instrument"]?.data as InstrumentEntry | undefined;
      if (!inst?.venue || !inst.folder) return [];
      const { venue, folder, instrumentKey, symbol } = inst;
      return ALL_TIMEFRAMES.map((tf) => {
        const pct = getTimeframeCompletion(venue, folder, tf, instrumentKey);
        return {
          id: tf,
          label: TIMEFRAME_LABELS[tf],
          data: { tf, venue, folder, symbol, instrumentKey, completionPct: pct },
        };
      });
    },
    renderLabel: (item) => {
      const { tf, completionPct } = item.data as {
        tf: Timeframe;
        completionPct: number;
      };
      const color = completionPct >= 50 ? "text-emerald-400" : completionPct >= 20 ? "text-yellow-400" : "text-red-400";
      return (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={cn("flex-1 font-medium font-mono", finderText.body)}>{tf}</span>
          <span className={cn(finderText.body, "text-muted-foreground shrink-0")}>{TIMEFRAME_LABELS[tf]}</span>
          <span className={cn(finderText.body, "font-mono shrink-0 w-11 text-right", color)}>{completionPct}%</span>
        </div>
      );
    },
    renderIcon: () => null,
    getCount: () => null,
  },
];

export function getProcessingContextStats(selections: FinderSelections): FinderContextStats {
  const catData = selections["category"]?.data as { cat: DataCategory; completionPct: number } | undefined;
  const venueData = selections["venue"]?.data as { venue: string; cat: DataCategory } | undefined;
  const folderData = selections["folder"]?.data as { folder: DataFolder; venue: string; cat: DataCategory } | undefined;
  const instSelected = selections["instrument"]?.data as InstrumentEntry | undefined;
  const tfData = selections["timeframe"]?.data as
    | {
        tf: Timeframe;
        venue: string;
        folder: string;
        symbol?: string;
        instrumentKey?: string;
        completionPct: number;
      }
    | undefined;

  if (tfData) {
    const pct = tfData.completionPct;
    const color = pct >= 50 ? "bg-emerald-400" : pct >= 20 ? "bg-yellow-400" : "bg-red-400";
    const sym = tfData.symbol ? `${tfData.symbol} · ` : "";
    return {
      name: `${sym}${tfData.venue.replace(/_/g, " ")} · ${TIMEFRAME_LABELS[tfData.tf]}`,
      metrics: [
        { label: "timeframe", value: tfData.tf },
        { label: "completion", value: pct, format: "percent" },
      ],
      progressBar: { value: pct, color },
    };
  }

  if (instSelected) {
    const avgPct = Math.round(
      ALL_TIMEFRAMES.reduce(
        (s, tf) => s + getTimeframeCompletion(instSelected.venue, instSelected.folder, tf, instSelected.instrumentKey),
        0,
      ) / ALL_TIMEFRAMES.length,
    );
    const color = avgPct >= 50 ? "bg-emerald-400" : avgPct >= 20 ? "bg-yellow-400" : "bg-red-400";
    return {
      name: instSelected.symbol,
      metrics: [
        { label: "timeframes", value: ALL_TIMEFRAMES.length },
        { label: "avg completion", value: avgPct, format: "percent" },
      ],
      progressBar: { value: avgPct, color },
    };
  }

  if (folderData) {
    const avgPct = Math.round(
      ALL_TIMEFRAMES.reduce((s, tf) => s + getTimeframeCompletion(folderData.venue, folderData.folder, tf), 0) /
        ALL_TIMEFRAMES.length,
    );
    const color = avgPct >= 50 ? "bg-emerald-400" : avgPct >= 20 ? "bg-yellow-400" : "bg-red-400";
    return {
      name: `${folderData.venue.replace(/_/g, " ")} / ${folderData.folder.replace(/_/g, " ")}`,
      metrics: [
        { label: "timeframes", value: ALL_TIMEFRAMES.length },
        { label: "avg completion", value: avgPct, format: "percent" },
      ],
      progressBar: { value: avgPct, color },
    };
  }

  if (venueData) {
    const folders = FOLDERS_BY_ASSET_GROUP[venueData.cat] ?? [];
    const avgPct = Math.round(
      ALL_TIMEFRAMES.reduce(
        (s, tf) =>
          s + folders.reduce((fs, f) => fs + getTimeframeCompletion(venueData.venue, f, tf), 0) / folders.length,
        0,
      ) / ALL_TIMEFRAMES.length,
    );
    const color = avgPct >= 50 ? "bg-emerald-400" : avgPct >= 20 ? "bg-yellow-400" : "bg-red-400";
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
          catData.completionPct >= 50 ? "bg-emerald-400" : catData.completionPct >= 20 ? "bg-yellow-400" : "bg-red-400",
      },
    };
  }

  const stage = MOCK_PIPELINE_STAGES.find((s) => s.stage === "processing");
  const tfAgg = ALL_TIMEFRAMES.map((tf) => {
    const entries = MOCK_TIMEFRAME_STATUS.filter((t) => t.timeframe === tf);
    const avg = entries.length > 0 ? entries.reduce((s, e) => s + e.completionPct, 0) / entries.length : 0;
    return { tf, pct: Math.round(avg * 10) / 10 };
  });
  const overallAvg = Math.round(tfAgg.reduce((s, { pct }) => s + pct, 0) / tfAgg.length);

  return {
    name: "Processing",
    metrics: [
      {
        label: "overall",
        value: stage?.completionPct != null ? formatNumber(stage.completionPct, 1) : "—",
      },
      {
        label: "shards complete",
        value: stage?.completedShards?.toLocaleString() ?? "—",
      },
      { label: "failed", value: stage?.failedShards ?? 0 },
    ],
    progressBar: {
      value: stage?.completionPct ?? 0,
      color: "bg-violet-400",
    },
  };
}
