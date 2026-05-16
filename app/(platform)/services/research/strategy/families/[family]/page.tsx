import { notFound } from "next/navigation";
import { FamilyDashboard } from "../_components/family-dashboard";
import { FamilyArchetypeAssetGroupBrowser } from "../../../_components/family-archetype-asset-group-browser";
import { FAMILY_METADATA, STRATEGY_FAMILIES_V2 } from "@/lib/architecture-v2";
import { getFamilyAggregate } from "../_components/aggregation";

// Static params so Next pre-renders all 8 family routes at build time.
export function generateStaticParams(): { family: string }[] {
  return STRATEGY_FAMILIES_V2.map((f) => ({ family: FAMILY_METADATA[f].slug }));
}

export const dynamicParams = false;

export default async function FamilyDashboardPage(props: { params: Promise<{ family: string }> }) {
  const { family: slug } = await props.params;
  const aggregate = getFamilyAggregate(slug);
  if (!aggregate) {
    notFound();
  }
  return (
    <div className="space-y-6">
      <FamilyDashboard aggregate={aggregate} />
      {/* 2026-04-28 DART tile-split D.6 page-level: per-family drilldown panel
          using the live strategy_instruments.json hierarchy. scopeFamily
          locks the browser to this family — only its archetype + asset_group
          structure is shown. */}
      <div className="platform-page-width space-y-4 p-6 pt-0">
        <FamilyArchetypeAssetGroupBrowser
          scopeFamily={aggregate.family}
          title={`Live hierarchy · ${aggregate.family} archetypes × asset groups`}
        />
      </div>
    </div>
  );
}
