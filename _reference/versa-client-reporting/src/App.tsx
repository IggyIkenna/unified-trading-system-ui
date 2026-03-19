import { Routes, Route, Navigate } from "react-router-dom";
import {
  BarChart3,
  FileText,
  TrendingUp,
  FilePlus,
  Rocket,
} from "lucide-react";
import { AppShell } from "@unified-trading/ui-kit";
import { AuthProvider, RequireAuth } from "@unified-trading/ui-auth";
import type { AuthProviderConfig } from "@unified-trading/ui-auth";
import { ReportsPage } from "./pages/ReportsPage";
import { PerformancePage } from "./pages/PerformancePage";
import { GenerateReportPage } from "./pages/GenerateReportPage";
import { DeploymentsPage } from "./pages/DeploymentsPage";

const authConfig: AuthProviderConfig = {
  provider: "google",
  clientId: import.meta.env.VITE_OAUTH_CLIENT_ID ?? "",
  redirectUri: window.location.origin + "/auth/callback",
  scopes: ["openid", "email", "profile"],
  skipAuth: import.meta.env.VITE_MOCK_API === "true",
  serviceName: "client-reporting-ui",
};

const NAV_ITEMS = [
  { id: "reports", label: "Reports", icon: <FileText size={14} /> },
  { id: "performance", label: "Performance", icon: <TrendingUp size={14} /> },
  { id: "generate", label: "Generate Report", icon: <FilePlus size={14} /> },
  { id: "deployments", label: "Deployments", icon: <Rocket size={14} /> },
];

export default function App() {
  return (
    <AppShell
      appName="Client Reporting"
      appDescription="performance reports & analytics"
      icon={<BarChart3 />}
      iconColor="#60a5fa"
      version="v0.1.0"
      nav={NAV_ITEMS}
      defaultRoute="/reports"
      navGroupLabel="Reporting"
      healthUrl={`${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8014"}/health`}
      authWrapper={(children) => (
        <AuthProvider config={authConfig}>
          <RequireAuth>{children}</RequireAuth>
        </AuthProvider>
      )}
    >
      <Routes>
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/performance" element={<PerformancePage />} />
        <Route path="/generate" element={<GenerateReportPage />} />
        <Route path="/deployments" element={<DeploymentsPage />} />
        <Route path="*" element={<Navigate to="/reports" replace />} />
      </Routes>
    </AppShell>
  );
}
