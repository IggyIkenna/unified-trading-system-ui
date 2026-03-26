"use client";

/**
 * FinderBrowser column configuration for /services/data/instruments
 *
 * Hierarchy: Category → Venue → Instrument
 * Source: VENUES_BY_CATEGORY, MOCK_INSTRUMENTS, MOCK_INSTRUMENT_COUNTS
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  FinderColumnDef,
  FinderContextStats,
  FinderItem,
  FinderSelections,
} from "@/components/shared/finder/types";
import {
  DATA_CATEGORY_LABELS,
  VENUES_BY_CATEGORY,
  FOLDERS_BY_CATEGORY,
  type DataCategory,
  type DataFolder,
  type InstrumentEntry,
} from "@/lib/data-service-types";
import {
  MOCK_INSTRUMENTS,
  MOCK_INSTRUMENT_COUNTS,
} from "@/lib/data-service-mock-data";

const CATEGORY_COLORS: Record<DataCategory, string> = {
  cefi: "border-blue-400/30 text-blue-400",
  tradfi: "border-amber-400/30 text-amber-400",
  defi: "border-violet-400/30 text-violet-400",
  onchain_perps: "border-cyan-400/30 text-cyan-400",
  prediction_market: "border-pink-400/30 text-pink-400",
  sports: "border-emerald-400/30 text-emerald-400",
};

const FOLDER_COLORS: Record<string, string> = {
  spot: "border-sky-400/30 text-sky-400",
  perpetuals: "border-blue-400/30 text-blue-400",
  options: "border-violet-400/30 text-violet-400",
  futures: "border-amber-400/30 text-amber-400",
  equity: "border-emerald-400/30 text-emerald-400",
  rates: "border-yellow-400/30 text-yellow-400",
  pool_state: "border-purple-400/30 text-purple-400",
  lending: "border-orange-400/30 text-orange-400",
  swaps: "border-rose-400/30 text-rose-400",
  staking: "border-teal-400/30 text-teal-400",
  odds: "border-pink-400/30 text-pink-400",
  predictions: "border-fuchsia-400/30 text-fuchsia-400",
  game_events: "border-lime-400/30 text-lime-400",
  fixtures: "border-green-400/30 text-green-400",
};

export const INSTRUMENTS_COLUMNS: FinderColumnDef[] = [
  {
    id: "category",
    label: "Category",
    width: "w-[160px]",
    getItems: (): FinderItem[] =>
      (Object.keys(DATA_CATEGORY_LABELS) as DataCategory[]).map((cat) => {
        const venues = VENUES_BY_CATEGORY[cat] ?? [];
        const total = venues.reduce(
          (s, v) => s + (MOCK_INSTRUMENT_COUNTS[v]?.total ?? 0),
          0,
        );
        return {
          id: cat,
          label: DATA_CATEGORY_LABELS[cat],
          count: total,
          data: cat,
        };
      }),
    renderLabel: (item) => {
      const cat = item.data as DataCategory;
      return (
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1 py-0 shrink-0",
              CATEGORY_COLORS[cat],
            )}
          >
            {cat.toUpperCase().slice(0, 4)}
          </Badge>
          <span className="flex-1 font-medium truncate text-xs">
            {DATA_CATEGORY_LABELS[cat]}
          </span>
        </div>
      );
    },
    renderIcon: () => null,
  },
  {
    id: "venue",
    label: "Venue",
    width: "w-[180px]",
    visibleWhen: (sel) => sel["category"] !== null,
    getItems: (sel): FinderItem[] => {
      const cat = sel["category"]?.data as DataCategory | undefined;
      if (!cat) return [];
      const venues = VENUES_BY_CATEGORY[cat] ?? [];
      return venues.map((venue) => ({
        id: venue,
        label: venue.replace(/_/g, " "),
        count: MOCK_INSTRUMENT_COUNTS[venue]?.total ?? 0,
        data: { venue, cat },
      }));
    },
    renderLabel: (item) => {
      const { venue, cat } = item.data as { venue: string; cat: DataCategory };
      const counts = MOCK_INSTRUMENT_COUNTS[venue];
      const folders = FOLDERS_BY_CATEGORY[cat] ?? [];
      return (
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <span className="font-medium truncate text-xs capitalize">
            {venue.replace(/_/g, " ")}
          </span>
          <div className="flex flex-wrap gap-0.5">
            {folders.slice(0, 2).map((f) => (
              <span
                key={f}
                className="text-[9px] text-muted-foreground leading-tight"
              >
                {f}
              </span>
            ))}
            {folders.length > 2 && (
              <span className="text-[9px] text-muted-foreground">
                +{folders.length - 2}
              </span>
            )}
          </div>
        </div>
      );
    },
    renderIcon: () => null,
  },
  {
    id: "folder",
    label: "Type",
    width: "w-[160px]",
    visibleWhen: (sel) => sel["venue"] !== null,
    getItems: (sel): FinderItem[] => {
      const { cat } = (sel["venue"]?.data ?? {}) as {
        venue: string;
        cat: DataCategory;
      };
      if (!cat) return [];
      const folders = FOLDERS_BY_CATEGORY[cat] ?? [];
      return folders.map((folder) => {
        const instruments = MOCK_INSTRUMENTS.filter(
          (i) =>
            i.category === cat &&
            i.folder === folder &&
            i.venue === (sel["venue"]?.data as { venue: string })?.venue,
        );
        return {
          id: folder,
          label: folder.replace(/_/g, " "),
          count: instruments.length,
          data: { folder, cat },
        };
      });
    },
    renderLabel: (item) => {
      const { folder } = item.data as { folder: DataFolder; cat: DataCategory };
      return (
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] px-1 py-0 shrink-0",
              FOLDER_COLORS[folder] ?? "border-border/50 text-muted-foreground",
            )}
          >
            {folder.replace(/_/g, " ").toUpperCase().slice(0, 4)}
          </Badge>
          <span className="flex-1 font-medium truncate text-xs capitalize">
            {folder.replace(/_/g, " ")}
          </span>
        </div>
      );
    },
    renderIcon: () => null,
  },
  {
    id: "instrument",
    label: "Instruments",
    width: "flex-1",
    visibleWhen: (sel) => sel["folder"] !== null,
    paginate: true,
    showSearch: true,
    searchPlaceholder: "Filter instruments…",
    getItems: (sel): FinderItem[] => {
      const { venue } = (sel["venue"]?.data ?? {}) as { venue: string };
      const { folder } = (sel["folder"]?.data ?? {}) as { folder: DataFolder };
      if (!venue || !folder) return [];
      const instruments = MOCK_INSTRUMENTS.filter(
        (i) => i.venue === venue && i.folder === folder,
      );
      // If none found in mock, generate placeholders from counts
      if (instruments.length === 0) {
        const count = MOCK_INSTRUMENT_COUNTS[venue]?.total ?? 0;
        return Array.from({ length: Math.min(count, 50) }, (_, i) => ({
          id: `${venue}_${folder}_${i}`,
          label: `${folder.toUpperCase()}_INSTRUMENT_${i + 1}`,
          data: { symbol: `INST_${i + 1}`, venue, folder },
        }));
      }
      return instruments.map((inst) => ({
        id: inst.instrumentKey,
        label: inst.symbol,
        data: inst,
      }));
    },
  },
];

export function getInstrumentsContextStats(
  selections: FinderSelections,
): FinderContextStats {
  const cat = selections["category"]?.data as DataCategory | undefined;
  const venueData = selections["venue"]?.data as
    | { venue: string; cat: DataCategory }
    | undefined;
  const folderData = selections["folder"]?.data as
    | { folder: DataFolder; cat: DataCategory }
    | undefined;
  const instItem = selections["instrument"];

  if (instItem) {
    const inst = instItem.data as InstrumentEntry;
    return {
      name: inst?.symbol ?? instItem.label,
      metrics: [
        { label: "data types", value: inst?.dataTypes?.length ?? 0 },
        { label: "available from", value: inst?.availableFrom ?? "—" },
      ],
    };
  }

  if (folderData) {
    const { venue, cat: c } = venueData ?? {
      venue: "",
      cat: "cefi" as DataCategory,
    };
    const instruments = MOCK_INSTRUMENTS.filter(
      (i) => i.venue === venue && i.folder === folderData.folder,
    );
    const count =
      instruments.length || MOCK_INSTRUMENT_COUNTS[venue]?.total || 0;
    return {
      name: `${venue.replace(/_/g, " ")} / ${folderData.folder.replace(/_/g, " ")}`,
      metrics: [{ label: "instruments", value: count }],
    };
  }

  if (venueData) {
    const counts = MOCK_INSTRUMENT_COUNTS[venueData.venue];
    return {
      name: venueData.venue.replace(/_/g, " "),
      metrics: [
        { label: "total", value: counts?.total ?? 0 },
        { label: "active", value: counts?.active ?? 0 },
      ],
    };
  }

  if (cat) {
    const venues = VENUES_BY_CATEGORY[cat] ?? [];
    const total = venues.reduce(
      (s, v) => s + (MOCK_INSTRUMENT_COUNTS[v]?.total ?? 0),
      0,
    );
    const active = venues.reduce(
      (s, v) => s + (MOCK_INSTRUMENT_COUNTS[v]?.active ?? 0),
      0,
    );
    return {
      name: DATA_CATEGORY_LABELS[cat],
      metrics: [
        { label: "instruments", value: total },
        { label: "active", value: active },
        { label: "venues", value: venues.length },
      ],
    };
  }

  const allTotal = Object.values(MOCK_INSTRUMENT_COUNTS).reduce(
    (s, v) => s + v.total,
    0,
  );
  const allActive = Object.values(MOCK_INSTRUMENT_COUNTS).reduce(
    (s, v) => s + v.active,
    0,
  );
  const allVenues = Object.keys(MOCK_INSTRUMENT_COUNTS).length;

  return {
    name: "All Instruments",
    metrics: [
      { label: "instruments", value: allTotal },
      { label: "active", value: allActive },
      { label: "venues", value: allVenues },
    ],
  };
}
