"use client";

import { Suspense } from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { AccountsDataProvider, useAccountsData } from "@/components/widgets/accounts/accounts-data-context";

import "@/components/widgets/accounts/register";

function AccountsWorkspaceBody() {
  const { isLoading, error, refetch } = useAccountsData();

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64 gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
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
