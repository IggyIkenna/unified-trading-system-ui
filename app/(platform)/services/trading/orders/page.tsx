"use client";

import { WidgetGrid } from "@/components/widgets/widget-grid";
import { OrdersDataProvider } from "@/components/widgets/orders/orders-data-context";

export default function OrdersPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-2">
        <OrdersDataProvider>
          <WidgetGrid tab="orders" />
        </OrdersDataProvider>
      </div>
    </div>
  );
}
