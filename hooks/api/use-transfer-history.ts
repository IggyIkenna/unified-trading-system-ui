import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import type { TransferHistoryEntry } from "@/lib/types/accounts";

interface TransferHistoryResponse {
  transfers: TransferHistoryEntry[];
}

export function useTransferHistory() {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["transfer-history", user?.id],
    queryFn: async () => {
      const data = (await apiFetch("/api/accounts/transfer-history", token)) as TransferHistoryResponse;
      return Array.isArray(data?.transfers) ? data.transfers : [];
    },
    enabled: !!user,
  });
}
