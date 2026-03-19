import { ErrorBoundary, Button, ConfigLink } from "@unified-trading/ui-kit";
import { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider, RequireAuth } from "@unified-trading/ui-auth";
import type { AuthProviderConfig } from "@unified-trading/ui-auth";
import { MockModeBanner } from "./components/MockModeBanner";
import { Header } from "./components/Header";
import { ServiceList } from "./components/ServiceList";
import { ServiceDetails } from "./components/ServiceDetails";
import { DeployForm } from "./components/DeployForm";
import { DeploymentResult } from "./components/DeploymentResult";
import { DeploymentHistory } from "./components/DeploymentHistory";
import { DeploymentDetails } from "./components/DeploymentDetails";
import { ReadinessTab } from "./components/ReadinessTab";
import { DataStatusTab } from "./components/DataStatusTab";
import { ServiceStatusTab } from "./components/ServiceStatusTab";
import { ServicesOverviewTab } from "./components/ServicesOverviewTab";
import { CloudBuildsTab } from "./components/CloudBuildsTab";
import { EpicReadinessView } from "./components/EpicReadinessView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import {
  Settings,
  Play,
  History,
  AlertCircle,
  ShieldCheck,
  Database,
  Activity,
  Hammer,
  Trophy,
  LayoutGrid,
} from "lucide-react";
import { createDeployment } from "./api/client";
import type { DeploymentRequest, CreateDeploymentResponse } from "./types";

const SKIP_AUTH =
  import.meta.env.VITE_SKIP_AUTH === "true" ||
  import.meta.env.VITE_MOCK_API === "true";

const authConfig: AuthProviderConfig = {
  provider: "google",
  clientId: import.meta.env.VITE_OAUTH_CLIENT_ID ?? "",
  redirectUri: window.location.origin + "/auth/callback",
  scopes: ["openid", "email", "profile"],
  skipAuth: SKIP_AUTH,
  serviceName: "deployment-ui",
};

const INFRASTRUCTURE_SERVICES = ["unified-trading-deployment-v2"];

function App() {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] =
    useState<CreateDeploymentResponse | null>(null);
  const [deploymentError, setDeploymentError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<DeploymentRequest | null>(
    null,
  );
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<
    string | null
  >(null);
  const [activeTab, setActiveTab] = useState("deploy");

  const handleDeploy = async (request: DeploymentRequest) => {
    setIsDeploying(true);
    setDeploymentError(null);
    setLastRequest(request);
    try {
      const result = await createDeployment(request);
      setDeploymentResult(result);
      if (!result.dry_run && result.deployment_id) {
        setActiveTab("history");
        setSelectedDeploymentId(result.deployment_id);
      }
    } catch (err) {
      setDeploymentError(
        err instanceof Error ? err.message : "Deployment failed",
      );
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDeployLive = async () => {
    if (!lastRequest) return;
    await handleDeploy({ ...lastRequest, dry_run: false });
  };

  const handleLoadAllShards = async () => {
    if (!lastRequest) return [];
    const result = await createDeployment({
      ...lastRequest,
      dry_run: true,
      include_all_shards: true,
    });
    return result.shards || [];
  };

  const handleCloseResult = () => {
    setDeploymentResult(null);
    setDeploymentError(null);
  };

  const handleViewDeploymentDetails = (deploymentId: string) => {
    setSelectedDeploymentId(deploymentId);
    requestAnimationFrame(() => {
      document
        .getElementById("deployment-details-panel")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleCloseDeploymentDetails = () => setSelectedDeploymentId(null);

  return (
    <ErrorBoundary>
      <AuthProvider config={authConfig}>
        <BrowserRouter>
          <RequireAuth>
            <div className="min-h-screen bg-[var(--color-bg-primary)]">
              <MockModeBanner />
              <Header />
              <div className="container mx-auto px-6 pt-2 max-w-[1600px] flex justify-end">
                <ConfigLink
                  label="Venue Connections"
                  path="/venue-connections"
                  onboardingBaseUrl={
                    import.meta.env.VITE_ONBOARDING_URL ??
                    "http://localhost:5173"
                  }
                />
              </div>
              <main className="container mx-auto px-6 py-6 max-w-[1600px]">
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 lg:col-span-4 xl:col-span-3">
                    <ServiceList
                      selectedService={selectedService}
                      onSelectService={(service) => {
                        setSelectedService(service);
                        if (
                          INFRASTRUCTURE_SERVICES.includes(service) &&
                          !["builds", "service-status", "config"].includes(
                            activeTab,
                          )
                        ) {
                          setActiveTab("builds");
                        }
                        setDeploymentResult(null);
                        setDeploymentError(null);
                        setSelectedDeploymentId(null);
                      }}
                    />
                  </div>
                  <div className="col-span-12 lg:col-span-8 xl:col-span-9">
                    {selectedService ? (
                      (() => {
                        const isInfra =
                          INFRASTRUCTURE_SERVICES.includes(selectedService);
                        return (
                          <>
                            {!isInfra &&
                              (deploymentResult || deploymentError) &&
                              !selectedDeploymentId && (
                                <div className="mb-6">
                                  {deploymentError ? (
                                    <div className="p-4 rounded-lg status-error">
                                      <div className="flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-[var(--color-accent-red)] shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                          <h3 className="text-sm font-medium text-[var(--color-accent-red)]">
                                            Deployment Failed
                                          </h3>
                                          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                            {deploymentError}
                                          </p>
                                          <Button
                                            onClick={handleCloseResult}
                                            variant="ghost"
                                            size="sm"
                                            className="mt-2 text-xs"
                                          >
                                            Dismiss
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : deploymentResult ? (
                                    <DeploymentResult
                                      result={deploymentResult}
                                      onClose={handleCloseResult}
                                      onDeployLive={
                                        deploymentResult.dry_run
                                          ? handleDeployLive
                                          : undefined
                                      }
                                      onLoadAllShards={
                                        deploymentResult.dry_run &&
                                        deploymentResult.shards_truncated
                                          ? handleLoadAllShards
                                          : undefined
                                      }
                                    />
                                  ) : null}
                                </div>
                              )}
                            {!isInfra && selectedDeploymentId && (
                              <div
                                id="deployment-details-panel"
                                className="mb-6"
                              >
                                <DeploymentDetails
                                  deploymentId={selectedDeploymentId}
                                  onClose={handleCloseDeploymentDetails}
                                />
                              </div>
                            )}
                            <Tabs
                              value={activeTab}
                              onValueChange={(tab: string) => {
                                setActiveTab(tab);
                                if (
                                  [
                                    "deploy",
                                    "config",
                                    "readiness",
                                    "data-status",
                                    "service-status",
                                    "builds",
                                  ].includes(tab)
                                )
                                  setSelectedDeploymentId(null);
                              }}
                              className="w-full"
                            >
                              <TabsList
                                variant="pill"
                                className={`grid w-full ${isInfra ? "grid-cols-3" : "grid-cols-7"} mb-6`}
                              >
                                {!isInfra && (
                                  <TabsTrigger value="deploy" className="gap-2">
                                    <Play className="h-4 w-4" />
                                    Deploy
                                  </TabsTrigger>
                                )}
                                <TabsTrigger
                                  value="service-status"
                                  className="gap-2"
                                >
                                  <Activity className="h-4 w-4" />
                                  Status
                                </TabsTrigger>
                                {!isInfra && (
                                  <TabsTrigger
                                    value="history"
                                    className="gap-2"
                                  >
                                    <History className="h-4 w-4" />
                                    History
                                  </TabsTrigger>
                                )}
                                <TabsTrigger value="builds" className="gap-2">
                                  <Hammer className="h-4 w-4" />
                                  Builds
                                </TabsTrigger>
                                {!isInfra && (
                                  <TabsTrigger
                                    value="data-status"
                                    className="gap-2"
                                  >
                                    <Database className="h-4 w-4" />
                                    Data Status
                                  </TabsTrigger>
                                )}
                                {!isInfra && (
                                  <TabsTrigger
                                    value="readiness"
                                    className="gap-2"
                                  >
                                    <ShieldCheck className="h-4 w-4" />
                                    Readiness
                                  </TabsTrigger>
                                )}
                                <TabsTrigger value="config" className="gap-2">
                                  <Settings className="h-4 w-4" />
                                  Config
                                </TabsTrigger>
                              </TabsList>
                              {!isInfra && (
                                <TabsContent value="deploy">
                                  <DeployForm
                                    serviceName={selectedService}
                                    onDeploy={handleDeploy}
                                    isDeploying={isDeploying}
                                  />
                                </TabsContent>
                              )}
                              <TabsContent value="service-status">
                                <ServiceStatusTab
                                  serviceName={selectedService}
                                />
                              </TabsContent>
                              {!isInfra && (
                                <TabsContent value="history">
                                  <DeploymentHistory
                                    serviceName={selectedService}
                                    onViewDetails={handleViewDeploymentDetails}
                                  />
                                </TabsContent>
                              )}
                              <TabsContent value="builds">
                                <CloudBuildsTab serviceName={selectedService} />
                              </TabsContent>
                              {!isInfra && (
                                <TabsContent value="data-status">
                                  <DataStatusTab
                                    serviceName={selectedService}
                                    deploymentResult={deploymentResult}
                                    isDeploying={isDeploying}
                                    onDeployMissing={(params) => {
                                      if (!params.previewRefreshOnly)
                                        setActiveTab("deploy");
                                      handleDeploy({
                                        service: params.service,
                                        compute: "vm",
                                        region: params.region,
                                        start_date: params.start_date,
                                        end_date: params.end_date,
                                        category: params.categories,
                                        venue: params.venues,
                                        folder: params.folders,
                                        data_type: params.data_types,
                                        force: params.force ?? false,
                                        dry_run: params.dry_run ?? true,
                                        skip_existing:
                                          params.skip_existing ?? true,
                                        deploy_missing_only:
                                          params.deploy_missing_only ?? true,
                                        date_granularity:
                                          params.date_granularity,
                                        first_day_of_month_only:
                                          params.first_day_of_month_only ??
                                          false,
                                      });
                                    }}
                                  />
                                </TabsContent>
                              )}
                              {!isInfra && (
                                <TabsContent value="readiness">
                                  <ReadinessTab serviceName={selectedService} />
                                </TabsContent>
                              )}
                              <TabsContent value="config">
                                <ServiceDetails serviceName={selectedService} />
                              </TabsContent>
                            </Tabs>
                          </>
                        );
                      })()
                    ) : (
                      <Tabs defaultValue="overview" className="w-full">
                        <TabsList
                          variant="pill"
                          className="grid w-full grid-cols-2 mb-6"
                        >
                          <TabsTrigger value="overview" className="gap-2">
                            <LayoutGrid className="h-4 w-4" />
                            Overview
                          </TabsTrigger>
                          <TabsTrigger value="epics" className="gap-2">
                            <Trophy className="h-4 w-4" />
                            Epics
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="overview">
                          <ServicesOverviewTab
                            onSelectService={setSelectedService}
                          />
                        </TabsContent>
                        <TabsContent value="epics">
                          <EpicReadinessView />
                        </TabsContent>
                      </Tabs>
                    )}
                  </div>
                </div>
              </main>
            </div>
          </RequireAuth>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
