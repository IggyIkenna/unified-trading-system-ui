"use client";

import { WidgetGrid } from "@/components/widgets/widget-grid";
import { OrdersDataProvider, useOrdersData } from "@/components/widgets/orders/orders-data-context";
import { TradingFamilyFilterBanner } from "@/components/architecture-v2/trading-family-filter-banner";
import { WidgetScroll } from "@/components/shared/widget-scroll";

/**
 * Orders page. Wraps the widget grid with a FamilyArchetypePicker banner
 * (Phase 3 p3-wire-picker-orders-positions) that writes to `useGlobalScope`
 * — the data-context post-filters orders by the selected (family, archetype).
 */
function OrdersFilterBanner() {
  const { orders, filteredOrders } = useOrdersData();
  return (
    <TradingFamilyFilterBanner
      testIdPrefix="orders"
      counts={{ total: orders.length, filtered: filteredOrders.length }}
    />
  );
}

export default function OrdersPage() {
  return (
    <WidgetScroll viewportClassName="p-2">
      <OrdersDataProvider>
        <div className="px-2 pb-2">
          <OrdersFilterBanner />
        </div>
        <WidgetGrid tab="orders" />
      </OrdersDataProvider>
    </WidgetScroll>
  );
}
