import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { SEED_NEWS, type NewsItem, type NewsSeverity } from "@/lib/mocks/fixtures/news-seed";
import { isMockDataMode } from "@/lib/runtime/data-mode";

export type { NewsItem, NewsSeverity } from "@/lib/mocks/fixtures/news-seed";

export function useNewsFeed() {
  const { user, token } = useAuth();
  const isMock = isMockDataMode();

  return useQuery<NewsItem[]>({
    queryKey: ["news-feed", user?.id],
    queryFn: async () => {
      const data = await apiFetch("/api/news/feed", token);
      const items = (data as Record<string, unknown>)?.data ?? data;
      if (Array.isArray(items) && items.length > 0) {
        return items as NewsItem[];
      }
      // Only fall back to seed data in mock mode; in live mode return empty
      return isMock ? SEED_NEWS : [];
    },
    enabled: !!user,
    placeholderData: isMock ? SEED_NEWS : undefined,
    retry: false,
  });
}
