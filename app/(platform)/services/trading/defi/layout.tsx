import { PageEntitlementGate } from "@/components/platform/page-entitlement-gate";

export default function DeFiLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageEntitlementGate entitlement="defi-trading" featureName="DeFi Trading">
      {children}
    </PageEntitlementGate>
  );
}
