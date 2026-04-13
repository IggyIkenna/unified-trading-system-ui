"use client";

import { DevOpsOverview } from "./devops/devops-overview";
import { DeploymentsPage } from "./devops/devops-deployments-page";
import { HealthPage } from "./devops/devops-health-page";
import { JobsPage } from "./devops/devops-jobs-page";
import { LogsPage } from "./devops/devops-logs-page";
import { RollbackPage } from "./devops/devops-rollback-page";
import { ServicesPage } from "./devops/devops-services-page";

interface DevOpsDashboardProps {
  currentPage: string;
}

export function DevOpsDashboard({ currentPage }: DevOpsDashboardProps) {
  switch (currentPage) {
    case "services":
      return <ServicesPage />;
    case "deployments":
      return <DeploymentsPage />;
    case "jobs":
      return <JobsPage />;
    case "health":
      return <HealthPage />;
    case "logs":
      return <LogsPage />;
    case "rollback":
      return <RollbackPage />;
    case "dashboard":
    default:
      return <DevOpsOverview />;
  }
}
