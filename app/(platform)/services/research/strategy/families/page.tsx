import { FamilyGridClient } from "./_components/family-grid";
import { STRATEGY_CATALOG } from "@/lib/mocks/fixtures/strategy-catalog-data";

export const dynamic = "force-static";

export default function FamilyOverviewPage() {
  // Aggregation lives client-side in FamilyGridClient so the page stays
  // statically rendered without bundling the whole catalog as server props.
  const count = STRATEGY_CATALOG.length;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="platform-page-width space-y-6 p-6">
        <div className="space-y-2">
          <h1 className="text-page-title font-semibold tracking-tight text-foreground">
            Strategy families
          </h1>
          <p className="text-body text-muted-foreground max-w-2xl">
            8 orthogonal alpha families per the v2 architecture. Each strategy belongs to exactly
            one family and exactly one of 18 archetype code paths. {count} strategies currently
            catalogued.
          </p>
        </div>
        <FamilyGridClient />
      </div>
    </div>
  );
}
