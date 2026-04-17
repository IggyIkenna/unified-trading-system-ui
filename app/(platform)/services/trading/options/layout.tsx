import { PageEntitlementGate } from "@/components/platform/page-entitlement-gate";

export default function OptionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageEntitlementGate entitlement={{ domain: "trading-options", tier: "basic" }} featureName="Options Trading">
      {children}
    </PageEntitlementGate>
  );
}
