/**
 * Execution Analytics UI - TCA, alpha, fill analysis, execution quality
 */

import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Play,
  BarChart2,
  Grid,
  TrendingUp,
  Search,
  GitCompare,
  Settings,
  Wand2,
  BookOpen,
  Calendar,
  Activity,
  Gauge,
  Rocket,
} from "lucide-react";
import { AppShell } from "@unified-trading/ui-kit";
import RunBacktest from "./pages/RunBacktest";
import LoadResults from "./pages/LoadResults";
import { GridResults } from "./pages/GridResults";
import Analysis from "./pages/Analysis";
import DeepDive from "./pages/DeepDive";
import AlgorithmComparison from "./pages/AlgorithmComparison";
import ConfigBrowser from "./pages/ConfigBrowser";
import ConfigGenerator from "./pages/ConfigGenerator";
import InstrumentDefinitions from "./pages/InstrumentDefinitions";
import InstructionAvailability from "./pages/InstructionAvailability";
import MarketTickData from "./pages/MarketTickData";
import { DeploymentsPage } from "./pages/DeploymentsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const NAV_SECTIONS = [
  {
    id: "backtest",
    label: "Backtesting",
    items: [
      { id: "run", label: "Run Backtest", icon: <Play size={14} /> },
      { id: "results", label: "Load Results", icon: <BarChart2 size={14} /> },
      { id: "grid", label: "Grid Results", icon: <Grid size={14} /> },
      { id: "analysis", label: "Analysis", icon: <TrendingUp size={14} /> },
      { id: "deep-dive", label: "Deep Dive", icon: <Search size={14} /> },
      { id: "compare", label: "Compare", icon: <GitCompare size={14} /> },
    ],
  },
  {
    id: "config",
    label: "Configuration",
    items: [
      { id: "configs", label: "Config Browser", icon: <Settings size={14} /> },
      { id: "generate", label: "Config Generator", icon: <Wand2 size={14} /> },
    ],
  },
  {
    id: "data",
    label: "Data",
    items: [
      { id: "instruments", label: "Instruments", icon: <BookOpen size={14} /> },
      {
        id: "availability",
        label: "Availability",
        icon: <Calendar size={14} />,
      },
      {
        id: "tick-data",
        label: "Market Tick Data",
        icon: <Activity size={14} />,
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      { id: "deployments", label: "Deployments", icon: <Rocket size={14} /> },
    ],
  },
];

export default function App() {
  return (
    <AppShell
      appName="Execution Analytics"
      appDescription="backtest & strategy analysis"
      icon={<Gauge />}
      iconColor="#22d3ee"
      version="v0.1.0"
      nav={NAV_SECTIONS}
      defaultRoute="/run"
      navGroupLabel="Analytics Platform"
      sidebarWidth="w-72"
      healthUrl={`${import.meta.env.VITE_API_URL ?? "http://localhost:8006"}/health`}
      extraProviders={(children) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )}
    >
      <Routes>
        <Route path="/run" element={<RunBacktest />} />
        <Route path="/results" element={<LoadResults />} />
        <Route path="/load" element={<LoadResults />} />
        <Route path="/grid" element={<GridResults />} />
        <Route path="/grid-results" element={<GridResults />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/deep-dive" element={<DeepDive />} />
        <Route path="/deep-dive/:configId" element={<DeepDive />} />
        <Route path="/compare" element={<AlgorithmComparison />} />
        <Route path="/configs" element={<ConfigBrowser />} />
        <Route path="/generate" element={<ConfigGenerator />} />
        <Route path="/instruments" element={<InstrumentDefinitions />} />
        <Route path="/availability" element={<InstructionAvailability />} />
        <Route path="/instructions" element={<InstructionAvailability />} />
        <Route path="/tick-data" element={<MarketTickData />} />
        <Route path="/deployments" element={<DeploymentsPage />} />
        <Route path="*" element={<Navigate to="/run" replace />} />
      </Routes>
    </AppShell>
  );
}
