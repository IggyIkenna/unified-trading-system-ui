import { PageEntitlementGate } from "@/components/platform/page-entitlement-gate";

export default function OptionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageEntitlementGate entitlement="options-trading" featureName="Options Trading">
      {children}
    </PageEntitlementGate>
  );
}
