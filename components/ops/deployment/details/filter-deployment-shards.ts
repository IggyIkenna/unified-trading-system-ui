import { CLASSIFICATION_FILTERS, type ShardDetail } from "./deployment-details-types";

export function filterDeploymentShards(
  source: ShardDetail[],
  shardStatusFilter: string,
  shardSearchText: string,
  classifications: Record<string, string> | undefined,
): ShardDetail[] {
  if (source.length === 0) return [];

  let result = source;

  if (shardStatusFilter !== "all") {
    const isClassification = CLASSIFICATION_FILTERS.includes(
      shardStatusFilter as (typeof CLASSIFICATION_FILTERS)[number],
    );

    if (isClassification && classifications) {
      let classFiltered = result.filter((s) => classifications[s.shard_id] === shardStatusFilter);
      if (classFiltered.length === 0 && shardStatusFilter === "STILL_RUNNING") {
        classFiltered = result.filter((s) => s.status === "running");
      }
      result = classFiltered;
    } else {
      result = result.filter((s) => {
        if (shardStatusFilter === "succeeded") {
          return s.status === "succeeded" || s.status === "completed";
        }
        return s.status === shardStatusFilter;
      });
    }
  }

  const query = shardSearchText.trim().toLowerCase();
  if (query) {
    result = result.filter((s) => {
      if (s.shard_id.toLowerCase().includes(query)) return true;
      if (s.status.toLowerCase().includes(query)) return true;
      if (classifications?.[s.shard_id]?.toLowerCase().includes(query)) return true;
      if (s.dimensions) {
        const dimStr = Object.values(s.dimensions)
          .map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v)))
          .join(" ")
          .toLowerCase();
        if (dimStr.includes(query)) return true;
      }
      if (s.job_id && s.job_id.toLowerCase().includes(query)) return true;
      return false;
    });
  }

  return result;
}
