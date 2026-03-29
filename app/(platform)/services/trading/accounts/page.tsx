"use client";

import { ApiError } from "@/components/shared/api-error";
import { Spinner } from "@/components/shared/spinner";
import { AccountsDataProvider, useAccountsData } from "@/components/widgets/accounts/accounts-data-context";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { Suspense } from "react";

import "@/components/widgets/accounts/register";

function AccountsWorkspaceBody() {
  const { isLoading, error, refetch } = useAccountsData();

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64 gap-2 text-muted-foreground">
        <Spinner className="size-5" />
        <span>Loading accounts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ApiError error={error as Error} onRetry={() => void refetch()} title="Failed to load account data" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-auto p-2">
      <WidgetGrid tab="accounts" />
    </div>
  );
}

function AccountsPageContent() {
  return (
    <AccountsDataProvider>
      <AccountsWorkspaceBody />
    </AccountsDataProvider>
  );
}

export default function AccountsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 flex items-center justify-center h-64 text-muted-foreground text-sm">Loading accounts…</div>
      }
    >
      <AccountsPageContent />
    </Suspense>
  );
}
