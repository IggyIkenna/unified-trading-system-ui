import type { ReactNode } from "react";
import type {
  CategoryVenuesResponse,
  ChecklistValidateResponse,
  DeploymentRequest,
  ServiceDimension,
  ServiceDimensionsResponse,
} from "@/lib/types/deployment";
import type { QuotaInfoResponse } from "@/hooks/deployment/_api-stub";

export interface DeployFormProps {
  serviceName: string;
  onDeploy: (request: DeploymentRequest) => void;
  isDeploying?: boolean;
}

export type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR";

export type DateGranularity = "default" | "daily" | "weekly" | "monthly" | "none";

export interface DeployFormContextValue {
  serviceName: string;
  onDeploy: (request: DeploymentRequest) => void;
  isDeploying?: boolean;

  dimensions: ServiceDimensionsResponse | null;
  loadingDims: boolean;
  validateDate: (
    date: string,
    category: string,
    venue?: string,
  ) => { valid: boolean; message?: string; earliestDate?: string };
  checklistValidation: ChecklistValidateResponse | null;

  compute: "cloud_run" | "vm";
  setCompute: (v: "cloud_run" | "vm") => void;
  mode: "batch" | "live";
  setMode: (v: "batch" | "live") => void;
  region: string;
  setRegion: (v: string) => void;
  vmZone: string;
  setVmZone: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  selectedCategories: string[];
  setSelectedCategories: (v: string[]) => void;
  selectedVenues: string[];
  setSelectedVenues: (v: string[]) => void;
  selectedFeatureGroups: string[];
  setSelectedFeatureGroups: (v: string[]) => void;
  selectedTimeframes: string[];
  setSelectedTimeframes: (v: string[]) => void;
  selectedInstruments: string[];
  setSelectedInstruments: (v: string[]) => void;
  selectedTargetTypes: string[];
  setSelectedTargetTypes: (v: string[]) => void;
  selectedDomain: string;
  setSelectedDomain: (v: string) => void;
  force: boolean;
  setForce: (v: boolean) => void;
  dryRun: boolean;
  setDryRun: (v: boolean) => void;
  logLevel: LogLevel;
  setLogLevel: (v: LogLevel) => void;
  containerMaxWorkers: string;
  setContainerMaxWorkers: (v: string) => void;
  extraArgs: string;
  setExtraArgs: (v: string) => void;
  deploymentTag: string;
  setDeploymentTag: (v: string) => void;
  acknowledgedWarnings: boolean;
  setAcknowledgedWarnings: (v: boolean) => void;
  skipVenueSharding: boolean;
  setSkipVenueSharding: (v: boolean) => void;
  skipFeatureGroupSharding: boolean;
  setSkipFeatureGroupSharding: (v: boolean) => void;
  dateGranularity: DateGranularity;
  setDateGranularity: (v: DateGranularity) => void;
  maxConcurrent: string;
  setMaxConcurrent: (v: string) => void;
  cloudProvider: "gcp" | "aws";
  setCloudProvider: (v: "gcp" | "aws") => void;
  imageTag: string;
  setImageTag: (v: string) => void;
  trafficSplitPct: number;
  setTrafficSplitPct: (v: number) => void;
  healthGateTimeoutS: number;
  setHealthGateTimeoutS: (v: number) => void;
  rollbackOnFail: boolean;
  setRollbackOnFail: (v: boolean) => void;

  quotaOpen: boolean;
  setQuotaOpen: (v: boolean) => void;
  quotaLoading: boolean;
  quotaError: string | null;
  quotaInfo: QuotaInfoResponse | null;
  openQuotaModal: () => Promise<void>;

  cloudConfigPath: string;
  setCloudConfigPath: (v: string) => void;
  discoveredConfigCount: number | null;
  handleCloudConfigSelected: (path: string, configCount: number) => void;

  backendRegion: string;
  showRegionWarning: boolean;

  primaryCategory: string | null;
  categoryVenues: CategoryVenuesResponse | null;
  allCategoriesVenueCount: number;

  dateValidation: { valid: boolean; message?: string; earliestDate?: string };
  getDimension: (name: string) => ServiceDimension | undefined;
  hasCategory: boolean;
  hasVenue: boolean;
  hasFeatureGroup: boolean;
  hasTimeframe: boolean;
  hasInstrument: boolean;
  hasTargetType: boolean;
  hasDomain: boolean;
  hasDate: boolean;
  hasCloudConfig: boolean;

  estimatedShards: number;
  buildRequest: () => DeploymentRequest;
  handleSubmit: () => void;
  cloudConfigReady: boolean;
  datesReady: boolean;
  canCheckQuota: boolean;
  hasChecklistWarnings: boolean;
  needsAcknowledgment: boolean;
  cannotProceed: boolean;
  maxConcurrentExceedsLimit: boolean;
  canSubmit: boolean;
}

export type DeployFormProviderProps = DeployFormProps & {
  children: ReactNode;
};
