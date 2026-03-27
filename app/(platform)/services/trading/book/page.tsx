"use client";

import { Suspense } from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { BookTradeDataProvider } from "@/components/widgets/book/book-data-context";

import "@/components/widgets/book/register";

function BookPageContent() {
  return (
    <BookTradeDataProvider>
      <div className="h-full flex flex-col overflow-auto p-2">
        <WidgetGrid tab="book" />
      </div>
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
