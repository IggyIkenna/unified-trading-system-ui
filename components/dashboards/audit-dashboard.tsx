"use client";

import { AuditOverview } from "./audit/audit-overview";
import { TradesPage } from "./audit/audit-trades-page";
import { OrdersPage } from "./audit/audit-orders-page";
import { LoginsPage } from "./audit/audit-logins-page";
import { ChangesPage } from "./audit/audit-changes-page";
import { SearchPage } from "./audit/audit-search-page";

interface AuditDashboardProps {
  currentPage: string;
}

export function AuditDashboard({ currentPage }: AuditDashboardProps) {
  switch (currentPage) {
    case "events":
      return <AuditOverview />;
    case "trades":
      return <TradesPage />;
    case "orders":
      return <OrdersPage />;
    case "logins":
      return <LoginsPage />;
    case "changes":
      return <ChangesPage />;
    case "search":
      return <SearchPage />;
    case "dashboard":
    default:
      return <AuditOverview />;
  }
}
