import type { CreateDeploymentResponse } from "@/lib/types/deployment";

export interface DataStatusTabProps {
  serviceName: string;
  deploymentResult?: CreateDeploymentResponse | null;
  isDeploying?: boolean;
  onDeployMissing?: (params: {
    service: string;
    start_date: string;
    end_date: string;
    region?: string;
    categories?: string[];
    venues?: string[];
    folders?: string[];
    data_types?: string[];
    force?: boolean;
    dry_run?: boolean;
    skip_existing?: boolean;
    exclude_dates?: Record<string, string[] | Record<string, string[]>>;
    date_granularity?: "daily" | "weekly" | "monthly" | "none";
    deploy_missing_only?: boolean;
    first_day_of_month_only?: boolean;
    previewRefreshOnly?: boolean;
    mode?: "batch" | "live";
  }) => void;
}
