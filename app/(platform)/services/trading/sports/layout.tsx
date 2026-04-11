import { PageEntitlementGate } from "@/components/platform/page-entitlement-gate";

export default function SportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageEntitlementGate entitlement="sports-trading" featureName="Sports Trading">
      {children}
    </PageEntitlementGate>
  );
}
