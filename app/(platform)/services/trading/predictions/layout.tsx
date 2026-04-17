import { PageEntitlementGate } from "@/components/platform/page-entitlement-gate";

export default function PredictionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageEntitlementGate
      entitlement={{ domain: "trading-predictions", tier: "basic" }}
      featureName="Prediction Markets"
    >
      {children}
    </PageEntitlementGate>
  );
}
