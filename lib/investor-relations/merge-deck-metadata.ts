import type { Entitlement } from "@/lib/config/auth";
import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  Landmark,
  LayoutGrid,
  Map as MapIcon,
  Presentation,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

export type PillarId = 1 | 2 | 3 | 4;
export type DeckStatus = "current" | "archive";

export interface IrDeckPresentation {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
  border: string;
  iconColor: string;
  tags: readonly string[];
  entitlement: Entitlement;
  pillar: PillarId | "standalone";
  status: DeckStatus;
  year: number;
  audienceTags: readonly string[];
}

export interface IrArchiveMetadataResponse {
  version: number;
  updated_at: string;
  presentations: IrDeckMetadataRecord[];
}

export interface IrDeckMetadataRecord {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  href: string;
  tags?: readonly string[];
  entitlement: Entitlement;
  pillar: PillarId | "standalone";
  status: DeckStatus;
  year: number;
  audienceTags?: readonly string[];
  /** Maps to Lucide preset in `visualForIconKey`. */
  iconKey?: string;
}

type DeckVisual = Pick<
  IrDeckPresentation,
  "icon" | "color" | "border" | "iconColor"
>;

const DEFAULT_VISUAL: DeckVisual = {
  icon: Presentation,
  color: "from-zinc-500/15 to-zinc-600/5",
  border: "border-zinc-500/25 hover:border-zinc-500/50",
  iconColor: "text-zinc-400",
};

function visualForIconKey(iconKey: string | undefined): DeckVisual {
  switch (iconKey) {
    case "calendar-clock":
      return {
        icon: CalendarClock,
        color: "from-violet-500/20 to-violet-600/5",
        border: "border-violet-500/30 hover:border-violet-500/60",
        iconColor: "text-violet-500",
      };
    case "map":
      return {
        icon: MapIcon,
        color: "from-sky-500/20 to-sky-600/5",
        border: "border-sky-500/30 hover:border-sky-500/60",
        iconColor: "text-sky-500",
      };
    case "layout-grid":
      return {
        icon: LayoutGrid,
        color: "from-emerald-500/20 to-emerald-600/5",
        border: "border-emerald-500/30 hover:border-emerald-500/60",
        iconColor: "text-emerald-500",
      };
    case "trending-up":
      return {
        icon: TrendingUp,
        color: "from-cyan-500/20 to-cyan-600/5",
        border: "border-cyan-500/30 hover:border-cyan-500/60",
        iconColor: "text-cyan-500",
      };
    case "landmark":
      return {
        icon: Landmark,
        color: "from-rose-500/20 to-rose-600/5",
        border: "border-rose-500/30 hover:border-rose-500/60",
        iconColor: "text-rose-500",
      };
    case "shield-alert":
      return {
        icon: ShieldAlert,
        color: "from-slate-500/20 to-slate-600/5",
        border: "border-slate-500/30 hover:border-slate-500/60",
        iconColor: "text-slate-500",
      };
    case "presentation":
    default:
      return {
        icon: Presentation,
        color: "from-amber-500/20 to-amber-600/5",
        border: "border-amber-500/30 hover:border-amber-500/60",
        iconColor: "text-amber-500",
      };
  }
}

function recordToPresentation(
  rec: IrDeckMetadataRecord,
  visual: DeckVisual,
): IrDeckPresentation {
  return {
    id: rec.id,
    title: rec.title,
    subtitle: rec.subtitle ?? "",
    description: rec.description ?? "",
    href: rec.href,
    icon: visual.icon,
    color: visual.color,
    border: visual.border,
    iconColor: visual.iconColor,
    tags: rec.tags ?? [],
    entitlement: rec.entitlement,
    pillar: rec.pillar,
    status: rec.status,
    year: rec.year,
    audienceTags: rec.audienceTags ?? [],
  };
}

/**
 * Merge static IR decks with optional metadata from client-reporting-api.
 * API rows override matching `id` text fields; unknown ids append with iconKey visuals.
 */
export function mergeIrDeckMetadata(
  staticDecks: readonly IrDeckPresentation[],
  api: IrArchiveMetadataResponse | undefined,
): IrDeckPresentation[] {
  const base = staticDecks.map((d) => ({ ...d }));
  if (!api?.presentations?.length) return base;

  const indexById = new Map(base.map((d, i) => [d.id, i] as const));

  for (const rec of api.presentations) {
    const existingIdx = indexById.get(rec.id);
    if (existingIdx !== undefined) {
      const cur = base[existingIdx]!;
      const visual = rec.iconKey
        ? visualForIconKey(rec.iconKey)
        : {
          icon: cur.icon,
          color: cur.color,
          border: cur.border,
          iconColor: cur.iconColor,
        };
      base[existingIdx] = {
        ...cur,
        title: rec.title,
        subtitle: rec.subtitle ?? cur.subtitle,
        description: rec.description ?? cur.description,
        href: rec.href,
        tags: rec.tags ?? cur.tags,
        entitlement: rec.entitlement,
        pillar: rec.pillar,
        status: rec.status,
        year: rec.year,
        audienceTags: rec.audienceTags ?? cur.audienceTags,
        icon: visual.icon,
        color: visual.color,
        border: visual.border,
        iconColor: visual.iconColor,
      };
      continue;
    }

    const visual = rec.iconKey
      ? visualForIconKey(rec.iconKey)
      : visualForIconKey(undefined);
    const row = recordToPresentation(rec, visual);
    indexById.set(rec.id, base.length);
    base.push(row);
  }

  return base;
}
