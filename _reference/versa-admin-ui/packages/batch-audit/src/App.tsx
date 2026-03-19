import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Briefcase, ListFilter, LayoutGrid, ShieldAlert } from "lucide-react";
import {
  PageLayout,
  AppHeader,
  SidebarNav,
  MockModeBanner,
} from "@unified-trading/ui-kit";
import { BatchJobsPage } from "./pages/BatchJobsPage";
import { JobDetailPage } from "./pages/JobDetailPage";
import { AuditTrailPage } from "./pages/AuditTrailPage";
import { DataCompletenessPage } from "./pages/DataCompletenessPage";
import { CompliancePage } from "./pages/CompliancePage";

const MOCK_MODE = import.meta.env.VITE_MOCK_API === "true";

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
];

function AppShell(): React.JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const activeId = location.pathname.replace("/", "").split("/")[0] || "jobs";

  return (
    <PageLayout
      header={
        <AppHeader
          appName="Batch Audit"
          appDescription="pipeline job monitoring & audit"
          version="v0.1.0"
          badges={[{ label: "Connected", variant: "success" }]}
        />
      }
      sidebar={
        <SidebarNav
          items={NAV_ITEMS}
          activeId={activeId}
          onSelect={(id) => navigate(`/${id}`)}
          header={
            <div className="px-4 pt-4 pb-2">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                Pipeline Ops
              </div>
            </div>
          }
        />
      }
    >
      <Routes>
        <Route path="/" element={<Navigate to="/jobs" replace />} />
        <Route path="/jobs" element={<BatchJobsPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />
        <Route path="/audit/trail" element={<AuditTrailPage />} />
        <Route path="/audit/health" element={<DataCompletenessPage />} />
        <Route path="/audit/compliance" element={<CompliancePage />} />
      </Routes>
    </PageLayout>
  );
}

export default function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      {MOCK_MODE && <MockModeBanner />}
      <AppShell />
    </BrowserRouter>
  );
}
