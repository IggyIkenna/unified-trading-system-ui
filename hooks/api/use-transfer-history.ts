import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import type { TransferHistoryEntry } from "@/lib/types/accounts";

interface TransferHistoryResponse {
  data?: TransferHistoryEntry[];
  /** @deprecated use `data` — kept for backward compat */
  transfers?: TransferHistoryEntry[];
}

export function useTransferHistory() {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["transfer-history", user?.id],
    queryFn: async () => {
      const resp = (await apiFetch("/api/accounts/transfer-history", token)) as TransferHistoryResponse;
      const arr = resp?.data ?? resp?.transfers;
      return Array.isArray(arr) ? arr : [];
    },
    enabled: !!user,
  });
}
