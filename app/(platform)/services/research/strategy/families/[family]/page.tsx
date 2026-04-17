import { notFound } from "next/navigation";
import { FamilyDashboard } from "../_components/family-dashboard";
import { FAMILY_METADATA, STRATEGY_FAMILIES_V2 } from "@/lib/architecture-v2";
import { getFamilyAggregate } from "../_components/aggregation";

// Static params so Next pre-renders all 8 family routes at build time.
export function generateStaticParams(): { family: string }[] {
  return STRATEGY_FAMILIES_V2.map((f) => ({ family: FAMILY_METADATA[f].slug }));
}

export const dynamicParams = false;

export default async function FamilyDashboardPage(props: { params: Promise<{ family: string }> }) {
  const { family } = await props.params;
  const aggregate = getFamilyAggregate(family);
  if (!aggregate) {
    notFound();
  }
  return <FamilyDashboard aggregate={aggregate} />;
}
