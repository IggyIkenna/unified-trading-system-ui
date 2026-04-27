import { PageEntitlementGate } from "@/components/platform/page-entitlement-gate";

export default function DeFiLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageEntitlementGate
      entitlement={{ domain: "trading-defi", tier: "basic" }}
      // Family-axis fallback: Carry & Yield clients enter the DeFi page so
      // they can reach Carry-tagged widgets (lending, staking, rates,
      // funding-matrix, staking-rewards). Inner widget gates handle which
      // widgets actually unlock per-user.
      acceptFamilies={["CARRY_AND_YIELD"]}
      featureName="DeFi Trading"
    >
      {children}
    </PageEntitlementGate>
  );
}
