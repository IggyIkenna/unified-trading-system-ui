import { StrategyDetailPageClient } from "./strategy-detail-page-client";

export default function StrategyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <StrategyDetailPageClient params={params} />;
}
