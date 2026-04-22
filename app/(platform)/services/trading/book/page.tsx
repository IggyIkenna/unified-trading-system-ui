"use client";

import { Suspense } from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { BookTradeDataProvider } from "@/components/widgets/book/book-data-context";
import { WidgetScroll } from "@/components/shared/widget-scroll";

function BookPageContent() {
  return (
    <BookTradeDataProvider>
      <WidgetScroll viewportClassName="p-2">
        <WidgetGrid tab="book" />
      </WidgetScroll>
    </BookTradeDataProvider>
  );
}

export default function BookTradePage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center h-64">Loading book…</div>}>
      <BookPageContent />
    </Suspense>
  );
}
