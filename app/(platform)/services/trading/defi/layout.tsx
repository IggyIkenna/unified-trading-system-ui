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
      // Slot-label fallback: real DeFi clients (Patrick) carry a closed list
      // of slot labels under the Carry & Yield family. Accept any of them so
      // the page renders even when the broader trading-defi domain entitlement
      // isn't held — widget gates filter further.
      acceptArchetypes={[
        "CARRY_BASIS_PERP",
        "CARRY_STAKED_BASIS",
        "CARRY_RECURSIVE_STAKED",
        "YIELD_ROTATION_LENDING",
        "YIELD_STAKING_SIMPLE",
      ]}
      featureName="DeFi Trading"
    >
      {children}
    </PageEntitlementGate>
  );
}
