"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AccountsDataProvider, useAccountsData } from "@/components/widgets/accounts/accounts-data-context";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { AlertCircle, RefreshCw } from "lucide-react";
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
      <div className="p-6 flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <AlertCircle className="size-8 text-destructive" />
        <p>Failed to load account data</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="size-3.5 mr-1.5" />
          Retry
        </Button>
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
