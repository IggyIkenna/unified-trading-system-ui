import { PageEntitlementGate } from "@/components/platform/page-entitlement-gate";
import { SiteNavigationClient } from "./components/site-navigation-client";

export default function SiteNavigationPresentationPage() {
  return (
    <PageEntitlementGate entitlement="investor-board" featureName="Portal & website navigation">
      <SiteNavigationClient />
    </PageEntitlementGate>
  );
}
