import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { SEED_NEWS, type NewsItem, type NewsSeverity } from "@/lib/mocks/fixtures/news-seed";

export type { NewsItem, NewsSeverity } from "@/lib/mocks/fixtures/news-seed";

export function useNewsFeed() {
  const { user, token } = useAuth();

  return useQuery<NewsItem[]>({
    queryKey: ["news-feed", user?.id],
    queryFn: async () => {
      const data = await apiFetch("/api/news/feed", token);
      const items = (data as Record<string, unknown>)?.data ?? data;
      if (Array.isArray(items) && items.length > 0) {
        return items as NewsItem[];
      }
      return SEED_NEWS;
    },
    enabled: !!user,
    placeholderData: SEED_NEWS,
    retry: false,
  });
}
