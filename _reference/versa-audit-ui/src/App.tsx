import type { AuthProviderConfig } from "@unified-trading/ui-auth";
import { AuthProvider, RequireAuth } from "@unified-trading/ui-auth";
import { AppShell } from "@unified-trading/ui-kit";
import {
  Briefcase,
  ClipboardCheck,
  LayoutGrid,
  ListFilter,
  Rocket,
  ShieldAlert,
} from "lucide-react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuditTrailPage } from "./pages/AuditTrailPage";
import { BatchJobsPage } from "./pages/BatchJobsPage";
import { CompliancePage } from "./pages/CompliancePage";
import { DataCompletenessPage } from "./pages/DataCompletenessPage";
import { DeploymentsPage } from "./pages/DeploymentsPage";
import { JobDetailPage } from "./pages/JobDetailPage";

const SKIP_AUTH =
  import.meta.env.VITE_SKIP_AUTH === "true" ||
  import.meta.env.VITE_MOCK_API === "true";

const authConfig: AuthProviderConfig = {
  provider: "google",
  clientId: import.meta.env.VITE_OAUTH_CLIENT_ID ?? "",
  redirectUri: window.location.origin + "/auth/callback",
  scopes: ["openid", "email", "profile"],
  skipAuth: SKIP_AUTH,
  serviceName: "batch-audit-ui",
};

const NAV_ITEMS = [
  { id: "jobs", label: "Batch Jobs", icon: <Briefcase size={14} /> },
  { id: "audit/trail", label: "Audit Trail", icon: <ListFilter size={14} /> },
  {
    id: "audit/health",
    label: "Data Completeness",
    icon: <LayoutGrid size={14} />,
  },
  {
    id: "audit/compliance",
    label: "Compliance",
    icon: <ShieldAlert size={14} />,
  },
  { id: "deployments", label: "Deployments", icon: <Rocket size={14} /> },
];

export default function App() {
  return (
    <AppShell
      appName="Batch Audit"
      appDescription="pipeline job monitoring & audit"
      icon={<ClipboardCheck />}
      iconColor="#4ade80"
      version="v0.1.0"
      nav={NAV_ITEMS}
      defaultRoute="/jobs"
      navGroupLabel="Pipeline Ops"
      healthUrl={`${import.meta.env.VITE_BATCH_API_URL ?? "http://localhost:8013"}/health`}
      authWrapper={(children) => (
        <AuthProvider config={authConfig}>
          <RequireAuth>{children}</RequireAuth>
        </AuthProvider>
      )}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/jobs" replace />} />
        <Route path="/jobs" element={<BatchJobsPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />
        <Route path="/audit/trail" element={<AuditTrailPage />} />
        <Route path="/audit/health" element={<DataCompletenessPage />} />
        <Route path="/audit/compliance" element={<CompliancePage />} />
        <Route path="/deployments" element={<DeploymentsPage />} />
        <Route path="*" element={<Navigate to="/jobs" replace />} />
      </Routes>
    </AppShell>
  );
}
