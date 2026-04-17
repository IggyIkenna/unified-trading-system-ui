import { PageEntitlementGate } from "@/components/platform/page-entitlement-gate";

export default function DeFiLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageEntitlementGate entitlement={{ domain: "trading-defi", tier: "basic" }} featureName="DeFi Trading">
      {children}
    </PageEntitlementGate>
  );
}
