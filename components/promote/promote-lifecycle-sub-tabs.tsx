"use client";

import * as React from "react";
import { ServiceTabs, type ServiceTab } from "@/components/shell/service-tabs";
import { useAuth } from "@/hooks/use-auth";
import { PROMOTE_LIFECYCLE_NAV } from "@/lib/config/services/promote.config";
import {
  selectPromoteSelectedStrategy,
  usePromoteLifecycleStore,
} from "@/lib/stores/promote-lifecycle-store";
import { isPromoteStageLocked } from "@/components/promote/promote-stage-access";

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
        navDisabledTitle = "Select a strategy in Pipeline first";
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
      };
    });
  }, [selected]);

  return (
    <ServiceTabs
      tabs={tabs}
      entitlements={user?.entitlements}
      className="bg-muted/20 border-b-0"
    />
  );
}
