"use client";

import * as React from "react";
import {
  Database,
  FlaskConical,
  LayoutDashboard,
  Shield,
  ShieldCheck,
  TestTube,
  Trophy,
  Wallet,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ServiceTabs, type ServiceTab } from "@/components/shell/service-tabs";
import { useAuth } from "@/hooks/use-auth";
import {
  PROMOTE_LIFECYCLE_NAV,
  type PromoteLifecycleNavKey,
} from "@/lib/config/services/promote.config";
import {
  selectPromoteSelectedStrategy,
  usePromoteLifecycleStore,
} from "@/lib/stores/promote-lifecycle-store";
import { isPromoteStageLocked } from "@/components/promote/promote-stage-access";

const PROMOTE_TAB_ICONS: Record<PromoteLifecycleNavKey, LucideIcon> = {
  pipeline: LayoutDashboard,
  data_validation: Database,
  model_assessment: FlaskConical,
  risk_stress: Shield,
  execution_readiness: Zap,
  champion: Trophy,
  paper_trading: TestTube,
  capital_allocation: Wallet,
  governance: ShieldCheck,
};

export function PromoteLifecycleSubTabs() {
  const { user } = useAuth();
  const selected = usePromoteLifecycleStore(selectPromoteSelectedStrategy);

  const tabs: ServiceTab[] = React.useMemo(() => {
    return PROMOTE_LIFECYCLE_NAV.map((def) => {
      let navDisabled = false;
      let navDisabledTitle: string | undefined;

      if (def.key === "pipeline") {
        navDisabled = false;
      } else if (!selected) {
        navDisabled = true;
        navDisabledTitle = "Select a strategy from the list first";
      } else if (
        def.key === "execution_readiness" ||
        def.key === "paper_trading" ||
        def.key === "governance"
      ) {
        if (isPromoteStageLocked(selected, def.key)) {
          navDisabled = true;
          navDisabledTitle = `${def.label} is locked until earlier stages progress`;
        }
      }

      return {
        label: def.label,
        href: def.href,
        matchPrefix: def.href,
        exact: def.key === "pipeline",
        navDisabled,
        navDisabledTitle,
        icon: PROMOTE_TAB_ICONS[def.key],
      };
    });
  }, [selected]);

  return (
    <ServiceTabs
      tabs={tabs}
      entitlements={user?.entitlements}
      tabsSpread
      className="border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    />
  );
}
