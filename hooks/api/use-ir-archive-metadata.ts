"use client";

import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { withMode } from "@/lib/api/with-mode";
import type { IrArchiveMetadataResponse } from "@/lib/investor-relations/merge-deck-metadata";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { useQuery } from "@tanstack/react-query";

export function useIrArchiveMetadata() {
  const { user, token } = useAuth();
  const { scope } = useGlobalScope();

  return useQuery<IrArchiveMetadataResponse>({
    queryKey: ["ir-archive-metadata", user?.id, scope.mode],
    queryFn: async () => {
      const url = withMode(
        "/api/reporting/investor-relations/archive-metadata",
        scope.mode,
        scope.asOfDatetime,
      );
      return apiFetch(url, token) as Promise<IrArchiveMetadataResponse>;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
