"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Database,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  ChevronDown,
  ChevronRight,
  Rocket,
  Loader2,
  Filter,
  Eye,
  Table2,
  CalendarDays,
  Building2,
  Trash2,
  FileText,
} from "lucide-react";
import * as api from "@/hooks/deployment/_api-stub";
import type {
  VenueCheckResponse,
  DataTypeCheckResponse,
  TurboDataStatusResponse,
  TurboVenueData,
} from "@/hooks/deployment/_api-stub";
import type { CategoryVenuesResponse } from "@/lib/types/deployment";
import { UPSTREAM_CHECK_SERVICES } from "@/hooks/deployment/_api-stub";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogHeader, DialogTitle, DialogContent } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { HeatmapCalendar } from "@/components/ops/deployment/HeatmapCalendar";
import { ExecutionDataStatus } from "@/components/ops/deployment/ExecutionDataStatus";
import type {
  DataStatusResponse,
  CategoryStatus,
  CreateDeploymentResponse,
} from "@/lib/types/deployment";

interface DataStatusTabProps {
  serviceName: string;
  deploymentResult?: CreateDeploymentResponse | null;
  isDeploying?: boolean;
  onDeployMissing?: (params: {
    service: string;
    start_date: string;
    end_date: string;
    region?: string; // GCP region (default: backend GCS_REGION)
    categories?: string[];
    venues?: string[]; // Filter deployment to specific venues
    folders?: string[]; // Filter by folder/instrument type (spot, perpetuals, etc.)
    data_types?: string[]; // Filter by data type (trades, book_snapshot_5, etc.)
    force?: boolean;
    dry_run?: boolean;
    skip_existing?: boolean;
    exclude_dates?: Record<string, string[] | Record<string, string[]>>; // Dates with existing data: category-level or venue-level
    date_granularity?: "daily" | "weekly" | "monthly" | "none"; // Date batching granularity
    deploy_missing_only?: boolean; // Use backend to calculate missing shards (more accurate)
    first_day_of_month_only?: boolean; // Only deploy first day of each month (TARDIS free tier)
    previewRefreshOnly?: boolean; // When true: refresh preview in-place without closing modal or switching tabs
    mode?: "batch" | "live"; // batch vs live GCS paths
  }) => void;
}

/** Today at 08:00 local, formatted for datetime-local input. */
function getTodayAt8am(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}T08:00:00`;
}

// Internal component for non-execution-services
function DataStatusTabInternal({
  serviceName,
  deploymentResult,
  isDeploying,
  onDeployMissing,
}: DataStatusTabProps) {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  });
  const [dataStatusMode, setDataStatusMode] = useState<"batch" | "live">(
    "batch",
  );

  // NOTE: Removed debounced dates - no longer auto-fetching on date change
  // Users must click "Check Status" button to fetch data

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([]);
  const [availableVenues, setAvailableVenues] = useState<string[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([
    "CEFI",
    "DEFI",
    "TRADFI",
  ]); // Default to all
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Venue-specific available filters (from venue_data_types.yaml)
  const [venueAvailableFolders, setVenueAvailableFolders] = useState<string[]>(
    [],
  );
  const [venueAvailableDataTypes, setVenueAvailableDataTypes] = useState<
    string[]
  >([]);
  const [venueFiltersLoading, setVenueFiltersLoading] = useState(false);

  // File listing state
  const [fileListingData, setFileListingData] =
    useState<api.ListFilesResponse | null>(null);
  const [fileListingLoading, setFileListingLoading] = useState(false);
  const [fileListingError, setFileListingError] = useState<string | null>(null);
  const [showFileListing, setShowFileListing] = useState(false);

  // Timeframe selection for market-data-processing-service file listing
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("1m");
  const availableTimeframes = ["15s", "1m", "5m", "15m", "1h", "4h", "24h"];
  const [data, setData] = useState<DataStatusResponse | null>(null);
  const [turboData, setTurboData] = useState<TurboDataStatusResponse | null>(
    null,
  );
  const [venueCheckData, setVenueCheckData] =
    useState<VenueCheckResponse | null>(null);
  const [dataTypeCheckData, setDataTypeCheckData] =
    useState<DataTypeCheckResponse | null>(null);

  // Check venues disabled - turbo mode handles venue breakdown automatically
  const checkVenues = false; // Removed toggle, turbo mode always gives venue breakdown
  // Check data types disabled - turbo mode shows data_types by default in breakdown
  const checkDataTypes = false;

  // Use turbo mode for all supported services (much faster)
  // Turbo mode now supports venue/data_type breakdown via directory structure
  const useTurboMode =
    api.TURBO_MODE_SERVICES.includes(serviceName) &&
    !checkVenues &&
    !checkDataTypes;
  const turboSubDimension = api.TURBO_SUB_DIMENSION_SERVICES[serviceName];
  const [loading, setLoading] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [expandedVenues, setExpandedVenues] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<
    string | null
  >(null);

  // Deploy Missing modal state
  const [deployMissingModalOpen, setDeployMissingModalOpen] = useState(false);
  const [deployMissingForce, setDeployMissingForce] = useState(true);
  const [deployMissingDryRun, setDeployMissingDryRun] = useState(true); // Default to preview mode
  const [deployMissingDateGranularity, setDeployMissingDateGranularity] =
    useState<"daily" | "weekly" | "monthly" | "none">("daily");
  const [deployMissingRegion, setDeployMissingRegion] =
    useState<string>("asia-northeast1");

  // Region validation (backend GCS_REGION for cross-region egress warning)
  const [backendRegion, setBackendRegion] = useState<string>("asia-northeast1");
  const [showDeployMissingRegionWarning, setShowDeployMissingRegionWarning] =
    useState<boolean>(false);

  useEffect(() => {
    fetch("/api/config/region")
      .then((r) => r.json())
      .then((data) => {
        const region =
          data.storage_region ?? data.gcs_region ?? "asia-northeast1";
        setBackendRegion(region);
        setDeployMissingRegion(region);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setShowDeployMissingRegionWarning(deployMissingRegion !== backendRegion);
  }, [deployMissingRegion, backendRegion]);

  // First day of month filter - useful for TARDIS free tier (no API key needed)
  const [firstDayOfMonthOnly, setFirstDayOfMonthOnly] = useState(false);

  // Freshness mode - only count data as "found" if updated on/after this date
  const [requireFreshness, setRequireFreshness] = useState(false);
  const [freshnessDate, setFreshnessDate] = useState("");

  // Instrument search state
  const [instrumentSearchMode, setInstrumentSearchMode] = useState(false);
  const [instrumentSearchQuery, setInstrumentSearchQuery] = useState("");
  const [instrumentSearchResults, setInstrumentSearchResults] = useState<
    api.InstrumentSearchResult[]
  >([]);
  const [instrumentSearchLoading, setInstrumentSearchLoading] = useState(false);
  const [selectedInstrument, setSelectedInstrument] =
    useState<api.InstrumentSearchResult | null>(null);
  const [instrumentAvailability, setInstrumentAvailability] =
    useState<api.InstrumentAvailabilityResponse | null>(null);
  const [instrumentAvailabilityLoading, setInstrumentAvailabilityLoading] =
    useState(false);
  const [instrumentAvailabilityError, setInstrumentAvailabilityError] =
    useState<string | null>(null);
  const [showInstrumentDropdown, setShowInstrumentDropdown] = useState(false);

  // Venue toggle removed - turbo mode handles venue breakdown automatically
  // instruments-service uses sub_dimension: "venue" which gives venue breakdown in turbo mode
  const supportsVenueCheck = false;
  // Removed: data type toggle no longer needed - turbo mode shows data_types by default
  const supportsDataTypeCheck = false;

  // Track request ID to prevent race conditions (stale responses overwriting fresh data)
  const requestIdRef = useRef(0);
  // AbortController for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cancel any pending query
  const cancelQuery = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setError(null);
  }, []);

  // Fetch data - accepts dates as parameters to avoid stale closure issues
  const fetchData = useCallback(
    async (fetchStart: string, fetchEnd: string) => {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Create new abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Increment request ID - only the latest request should update state
      const thisRequestId = ++requestIdRef.current;

      setLoading(true);
      setError(null);
      // Clear old data immediately when starting new fetch
      setData(null);
      setTurboData(null);
      setVenueCheckData(null);
      setDataTypeCheckData(null);

      try {
        if (checkVenues && supportsVenueCheck) {
          // Venue check mode - returns different response shape
          const result = (await api.getDataStatus({
            service: serviceName,
            start_date: fetchStart,
            end_date: fetchEnd,
            category:
              selectedCategories.length > 0 ? selectedCategories : undefined,
            check_venues: true,
            force_refresh: false, // Use cache for speed
          })) as unknown as VenueCheckResponse;

          // Skip if a newer request has started
          if (thisRequestId !== requestIdRef.current) return;

          // CRITICAL: Validate response matches request
          if (
            result.start_date !== fetchStart ||
            result.end_date !== fetchEnd
          ) {
            setError(
              `Backend returned wrong dates! Requested ${fetchStart}-${fetchEnd}, got ${result.start_date}-${result.end_date}`,
            );
            return;
          }

          setVenueCheckData(result);
        } else if (checkDataTypes && supportsDataTypeCheck) {
          // Data type check mode - returns per-data-type breakdown
          const result = (await api.getDataStatus({
            service: serviceName,
            start_date: fetchStart,
            end_date: fetchEnd,
            category:
              selectedCategories.length > 0 ? selectedCategories : ["TRADFI"], // Default to TRADFI for data type check
            check_data_types: true,
            force_refresh: false, // Use cache for speed
          })) as unknown as DataTypeCheckResponse;

          // Skip if a newer request has started
          if (thisRequestId !== requestIdRef.current) return;
          setDataTypeCheckData(result);
        } else if (useTurboMode) {
          // TURBO MODE: Uses month-prefix queries (5s instead of 60s+)
          const includeSubDims = !!turboSubDimension;
          // Enable upstream availability check for dependent services
          // This ensures "missing" only counts dates where upstream data exists
          const checkUpstream = UPSTREAM_CHECK_SERVICES.includes(serviceName);
          const venueFilter =
            selectedVenues.length > 0 ? selectedVenues : undefined;
          const folderFilter =
            selectedFolders.length > 0 ? selectedFolders : undefined;
          const dataTypeFilter =
            selectedDataTypes.length > 0 ? selectedDataTypes : undefined;
          const result = await api.getDataStatusTurbo({
            service: serviceName,
            start_date: fetchStart,
            end_date: fetchEnd,
            mode: dataStatusMode,
            category:
              selectedCategories.length > 0 ? selectedCategories : undefined,
            venue: venueFilter, // Filter by venue to reduce GCS scan scope
            folder: folderFilter, // Filter by folder/instrument type
            data_type: dataTypeFilter, // Filter by data type
            include_sub_dimensions: includeSubDims,
            include_dates_list: true, // Include dates for deploy missing filtering
            full_dates_list: true, // Get complete lists (cached anyway, no extra cost)
            check_upstream_availability: checkUpstream, // Check upstream data for dependent services
            first_day_of_month_only: firstDayOfMonthOnly, // Only check first day of each month (TARDIS free tier)
            freshness_date:
              requireFreshness && freshnessDate
                ? `${freshnessDate.replace(" ", "T")}Z`.slice(0, 20) // Force UTC interpretation (append Z, no local timezone conversion)
                : undefined,
            signal: abortController.signal, // Allow cancellation
          });

          // Skip if a newer request has started
          if (thisRequestId !== requestIdRef.current) return;

          // Validate response matches requested dates (detect stale data/bugs)
          if (
            result.date_range?.start !== fetchStart ||
            result.date_range?.end !== fetchEnd
          ) {
            setError(
              `Date mismatch: requested ${fetchStart} to ${fetchEnd}, but received ${result.date_range?.start} to ${result.date_range?.end}. This may indicate a bug - please report this.`,
            );
            return;
          }

          setTurboData(result);
        } else {
          // Standard mode
          const result = (await api.getDataStatus({
            service: serviceName,
            start_date: fetchStart,
            end_date: fetchEnd,
            category:
              selectedCategories.length > 0 ? selectedCategories : undefined,
            force_refresh: false, // Use cache (5-min TTL) for speed
          })) as DataStatusResponse;

          // Skip if a newer request has started
          if (thisRequestId !== requestIdRef.current) return;

          // Validate response matches requested dates (detect cache issues)
          if (
            result.start_date !== fetchStart ||
            result.end_date !== fetchEnd
          ) {
            // Date mismatch - use data anyway but could indicate cache issues
          }

          setData(result);
        }
      } catch (err) {
        // Only set error if this is still the latest request
        if (thisRequestId === requestIdRef.current) {
          // Don't show error for cancelled requests
          if (
            err instanceof Error &&
            (err.name === "AbortError" ||
              err.message === "Request was cancelled")
          ) {
            return;
          }
          setError(
            err instanceof Error ? err.message : "Failed to fetch data status",
          );
        }
      } finally {
        // Only clear loading if this is still the latest request
        if (thisRequestId === requestIdRef.current) {
          setLoading(false);
        }
        // Clear abort controller reference when done
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }
    },
    [
      serviceName,
      selectedCategories,
      selectedVenues,
      selectedFolders,
      selectedDataTypes,
      checkVenues,
      supportsVenueCheck,
      checkDataTypes,
      supportsDataTypeCheck,
      useTurboMode,
      turboSubDimension,
      firstDayOfMonthOnly,
      requireFreshness,
      freshnessDate,
      dataStatusMode,
    ],
  );

  // Clear data status cache only (doesn't affect deployment state cache)
  const handleClearDataStatusCache = useCallback(async () => {
    setClearingCache(true);
    try {
      await api.clearDataStatusCache();
      // Re-fetch with fresh data
      await fetchData(startDate, endDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear cache");
    } finally {
      setClearingCache(false);
    }
  }, [startDate, endDate, fetchData]);

  // Fetch file listing for fully specified path
  const fetchFileListing = useCallback(async () => {
    if (
      selectedCategories.length !== 1 ||
      selectedVenues.length !== 1 ||
      selectedFolders.length !== 1 ||
      selectedDataTypes.length !== 1
    ) {
      setFileListingError(
        "Please select exactly one category, venue, folder, and data type",
      );
      return;
    }

    setFileListingLoading(true);
    setFileListingError(null);
    setShowFileListing(true);

    try {
      const result = await api.listFiles({
        service: serviceName,
        category: selectedCategories[0],
        venue: selectedVenues[0],
        folder: selectedFolders[0],
        data_type: selectedDataTypes[0],
        start_date: startDate,
        end_date: endDate,
        // Include timeframe for market-data-processing-service
        timeframe:
          serviceName === "market-data-processing-service"
            ? selectedTimeframe
            : undefined,
      });

      if (result.error) {
        setFileListingError(result.error);
        setFileListingData(null);
      } else {
        setFileListingData(result);
      }
    } catch (err) {
      setFileListingError(
        err instanceof Error ? err.message : "Failed to fetch file listing",
      );
      setFileListingData(null);
    } finally {
      setFileListingLoading(false);
    }
  }, [
    serviceName,
    selectedCategories,
    selectedVenues,
    selectedFolders,
    selectedDataTypes,
    startDate,
    endDate,
    selectedTimeframe,
  ]);

  // Instrument search - debounced search as user types
  const searchInstrumentsDebounceRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const fetchInstruments = useCallback(
    async (searchQuery: string) => {
      if (selectedCategories.length !== 1) {
        setInstrumentSearchResults([]);
        return;
      }

      // Clear previous timer
      if (searchInstrumentsDebounceRef.current) {
        clearTimeout(searchInstrumentsDebounceRef.current);
      }

      // Debounce the search
      searchInstrumentsDebounceRef.current = setTimeout(async () => {
        setInstrumentSearchLoading(true);
        try {
          const result = await api.getInstrumentsList({
            category: selectedCategories[0],
            search: searchQuery || undefined,
            limit: 50, // Show top 50 matches
          });
          if (result.error) {
            setInstrumentSearchResults([]);
          } else {
            setInstrumentSearchResults(result.instruments);
            // Only show dropdown if no instrument is currently selected
            // (prevents dropdown from reopening after selection)
            if (!selectedInstrument) {
              setShowInstrumentDropdown(result.instruments.length > 0);
            }
          }
        } catch {
          setInstrumentSearchResults([]);
        } finally {
          setInstrumentSearchLoading(false);
        }
      }, 300); // 300ms debounce
    },
    [selectedCategories, selectedInstrument],
  );

  // Fetch instrument availability when an instrument is selected
  const fetchInstrumentAvailability = useCallback(async () => {
    if (!selectedInstrument) return;

    setInstrumentAvailabilityLoading(true);
    setInstrumentAvailabilityError(null);

    try {
      const result = await api.getInstrumentAvailability({
        instrument_key: selectedInstrument.instrument_key,
        start_date: startDate,
        end_date: endDate,
        data_type:
          selectedDataTypes.length === 1 ? selectedDataTypes[0] : undefined,
        first_day_of_month_only: firstDayOfMonthOnly,
        service: serviceName,
        timeframe:
          serviceName === "market-data-processing-service"
            ? selectedTimeframe
            : undefined,
        // Pass instrument availability window from definition
        available_from: selectedInstrument.available_from_datetime || undefined,
        available_to: selectedInstrument.available_to_datetime || undefined,
      });

      if (result.error) {
        setInstrumentAvailabilityError(result.error);
        setInstrumentAvailability(null);
      } else {
        setInstrumentAvailability(result);
      }
    } catch (err) {
      setInstrumentAvailabilityError(
        err instanceof Error ? err.message : "Failed to check availability",
      );
      setInstrumentAvailability(null);
    } finally {
      setInstrumentAvailabilityLoading(false);
    }
  }, [
    selectedInstrument,
    startDate,
    endDate,
    selectedDataTypes,
    firstDayOfMonthOnly,
    serviceName,
    selectedTimeframe,
  ]);

  // Clear instrument search state when mode changes or category changes
  useEffect(() => {
    if (!instrumentSearchMode) {
      setInstrumentSearchQuery("");
      setInstrumentSearchResults([]);
      setSelectedInstrument(null);
      setInstrumentAvailability(null);
      setInstrumentAvailabilityError(null);
    }
  }, [instrumentSearchMode, selectedCategories]);

  // NOTE: Removed auto-fetch on mount for faster startup
  // The turbo endpoint can take 30+ seconds depending on GCS load
  // Users must click "Check Status" to load data
  // This provides a much faster initial page load experience

  // Fetch available categories for this service from sharding config
  useEffect(() => {
    setCategoriesLoading(true);
    api
      .getServiceCategories(serviceName)
      .then((response) => {
        if (response.categories && response.categories.length > 0) {
          setAvailableCategories(response.categories);
          // Clear selected categories that are no longer available
          setSelectedCategories((prev) =>
            prev.filter((cat) => response.categories.includes(cat)),
          );
        } else {
          // Service has no category dimension (e.g., features-calendar-service)
          // Default to all categories for backward compatibility
          setAvailableCategories(["CEFI", "DEFI", "TRADFI"]);
        }
      })
      .catch(() => {
        // On error, default to all categories
        setAvailableCategories(["CEFI", "DEFI", "TRADFI"]);
      })
      .finally(() => {
        setCategoriesLoading(false);
      });
  }, [serviceName]);

  // Clear data when switching services
  useEffect(() => {
    setData(null);
    setTurboData(null);
    setVenueCheckData(null);
    setDataTypeCheckData(null);
    setError(null);
    setSelectedCategories([]);
    setSelectedVenues([]);
    setAvailableVenues([]);
    // Clear venue-specific filters
    setSelectedFolders([]);
    setSelectedDataTypes([]);
    setVenueAvailableFolders([]);
    setVenueAvailableDataTypes([]);
  }, [serviceName]);

  // Fetch available venues when category changes
  useEffect(() => {
    // Clear venues when category changes
    setSelectedVenues([]);
    setAvailableVenues([]);
    // Also clear venue-specific filters
    setSelectedFolders([]);
    setSelectedDataTypes([]);
    setVenueAvailableFolders([]);
    setVenueAvailableDataTypes([]);

    // Only fetch if exactly one category is selected (venues are hierarchical)
    if (selectedCategories.length !== 1) {
      return;
    }

    const category = selectedCategories[0];
    setVenuesLoading(true);

    api
      .getVenuesByCategory(category)
      .then((response: CategoryVenuesResponse) => {
        setAvailableVenues(response.venues || []);
      })
      .catch(() => {
        setAvailableVenues([]);
      })
      .finally(() => {
        setVenuesLoading(false);
      });
  }, [selectedCategories]);

  // Fetch venue-specific filters when exactly one venue is selected
  useEffect(() => {
    // Clear venue-specific filters when venue selection changes
    setSelectedFolders([]);
    setSelectedDataTypes([]);
    setVenueAvailableFolders([]);
    setVenueAvailableDataTypes([]);

    // Only fetch if exactly one venue and one category is selected
    if (selectedVenues.length !== 1 || selectedCategories.length !== 1) {
      return;
    }

    const category = selectedCategories[0];
    const venue = selectedVenues[0];
    setVenueFiltersLoading(true);

    api
      .getVenueFilters({ category, venue })
      .then((response) => {
        setVenueAvailableFolders(response.folders || []);
        setVenueAvailableDataTypes(response.data_types || []);
      })
      .catch(() => {
        setVenueAvailableFolders([]);
        setVenueAvailableDataTypes([]);
      })
      .finally(() => {
        setVenueFiltersLoading(false);
      });
  }, [selectedVenues, selectedCategories]);

  // Toggle venue expansion for data type view
  const toggleVenue = (venueKey: string) => {
    setExpandedVenues((prev) => {
      const next = new Set(prev);
      if (next.has(venueKey)) {
        next.delete(venueKey);
      } else {
        next.add(venueKey);
      }
      return next;
    });
  };

  const toggleDate = (dateKey: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) {
        next.delete(dateKey);
      } else {
        next.add(dateKey);
      }
      return next;
    });
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const getCompletionColor = (percent: number) => {
    if (percent >= 100) return "var(--color-accent-green)";
    if (percent >= 80) return "var(--color-accent-cyan)";
    if (percent >= 50) return "var(--color-accent-amber)";
    return "var(--color-accent-red)";
  };

  const getCompletionBadgeClass = (percent: number) => {
    if (percent >= 100)
      return "bg-[var(--color-status-success-bg)] text-[var(--color-accent-green)] border-[var(--color-status-success-border-strong)]";
    if (percent >= 80)
      return "bg-[var(--color-status-running-bg)] text-[var(--color-accent-cyan)] border-[var(--color-status-running-border)]";
    if (percent >= 50)
      return "bg-[var(--color-status-warning-bg)] text-[var(--color-accent-amber)] border-[var(--color-status-warning-border)]";
    return "bg-[var(--color-status-error-bg)] text-[var(--color-accent-red)] border-[var(--color-status-error-border-strong)]";
  };

  const getCategoryCompletion = (catData: CategoryStatus) => {
    let complete = 0;
    let total = 0;
    Object.values(catData.venues).forEach((v) => {
      complete += v.complete;
      total += v.total;
    });
    return total > 0 ? (complete / total) * 100 : 0;
  };

  const getMissingCount = (catData: CategoryStatus) => {
    let missing = 0;
    Object.values(catData.venues).forEach((v) => {
      missing += v.total - v.complete;
    });
    return missing;
  };

  // Calculate total missing from either turbo data or standard data
  // For turbo mode, use total_missing which is venue-weighted (consistent with overall_completion_pct)
  const totalMissing = useMemo(() => {
    if (turboData) {
      // Use venue-weighted total_missing for consistency with overall_completion_pct
      // This ensures "All expected data present" only shows when completion is truly 100%
      return turboData.total_missing || 0;
    }
    if (data) {
      return Object.values(data.categories).reduce(
        (sum, cat) => sum + getMissingCount(cat),
        0,
      );
    }
    return 0;
  }, [data, turboData]);

  // Get categories with missing data for deploy missing
  // IMPORTANT: Check both category-level AND venue-level missing data
  const categoriesWithMissing = useMemo(() => {
    if (turboData) {
      return Object.entries(turboData.categories)
        .filter(([_, catData]) => {
          // Check category-level missing
          if ((catData.dates_missing || 0) > 0) return true;

          // Check if there are entirely missing venues (expected but no data at all)
          // These are in venue_summary.expected_but_missing, NOT in catData.venues
          const expectedButMissing =
            catData.venue_summary?.expected_but_missing || [];
          if (expectedButMissing.length > 0) return true;

          // Also check if any venues within this category have missing data
          // Use dimension-weighted values when available for accurate detection
          if (catData.venues) {
            for (const [_, venueData] of Object.entries(catData.venues)) {
              const venueExpected =
                venueData._dim_weighted_expected ??
                venueData.dates_expected_venue ??
                venueData.dates_expected ??
                0;
              const venueFound =
                venueData._dim_weighted_found ?? venueData.dates_found ?? 0;
              if (venueFound < venueExpected) return true;
            }
          }

          return false;
        })
        .map(([cat]) => cat);
    }
    if (data) {
      return Object.entries(data.categories)
        .filter(([_, catData]) => getMissingCount(catData) > 0)
        .map(([cat]) => cat);
    }
    return [];
  }, [data, turboData]);

  // Open the deploy missing modal
  const handleOpenDeployMissingModal = () => {
    if (!onDeployMissing || totalMissing === 0) return;
    setDeployMissingModalOpen(true);
  };

  // NOTE: existingDatesPerCategory removed - we now use deploy_missing_only=true
  // which lets the backend calculate missing shards with full (non-truncated) date lists
  // This fixes the bug where truncated dates_found_list caused incorrect shard counts

  // Get the effective categories for deploy missing
  // IMPORTANT: Respect user's filter selection - only deploy for categories they selected
  const effectiveDeployCategories = useMemo(() => {
    // If user selected specific categories, use those (intersected with categories that have missing data)
    if (selectedCategories.length > 0) {
      return selectedCategories.filter((cat) =>
        categoriesWithMissing.includes(cat),
      );
    }
    // Otherwise use all categories with missing data
    return categoriesWithMissing;
  }, [selectedCategories, categoriesWithMissing]);

  // Execute deploy missing with selected options
  // When previewRefreshOnly is true: refresh preview in-place without closing modal or switching tabs
  const handleConfirmDeployMissing = useCallback(
    (previewRefreshOnly = false) => {
      if (!onDeployMissing) return;

      // IMPORTANT: If no categories have missing data, don't deploy
      // This prevents accidentally deploying all categories when user's filter has no missing data
      if (effectiveDeployCategories.length === 0) {
        if (!previewRefreshOnly) setDeployMissingModalOpen(false);
        return;
      }

      // Use deploy_missing_only=true for accurate missing data calculation
      // The backend will fetch full date lists (not truncated) and filter properly
      // This fixes the bug where exclude_dates was built from truncated UI data
      onDeployMissing({
        service: serviceName,
        start_date: startDate,
        end_date: endDate,
        mode: dataStatusMode,
        region: deployMissingRegion,
        categories: effectiveDeployCategories, // ALWAYS pass explicit categories, never undefined
        venues: selectedVenues.length > 0 ? selectedVenues : undefined, // Pass venue filter if selected
        folders: selectedFolders.length > 0 ? selectedFolders : undefined, // Pass folder/instrument type filter
        data_types:
          selectedDataTypes.length > 0 ? selectedDataTypes : undefined, // Pass data type filter
        force: deployMissingForce,
        dry_run: deployMissingDryRun,
        skip_existing: true, // Always skip existing for deploy missing
        deploy_missing_only: true, // Use backend for accurate missing shard calculation
        date_granularity: deployMissingDateGranularity,
        first_day_of_month_only: firstDayOfMonthOnly, // Pass first day of month filter
        previewRefreshOnly, // When true: stay in modal, don't switch tabs
      });

      if (!previewRefreshOnly) setDeployMissingModalOpen(false);
    },
    [
      onDeployMissing,
      effectiveDeployCategories,
      serviceName,
      startDate,
      endDate,
      selectedVenues,
      selectedFolders,
      selectedDataTypes,
      deployMissingForce,
      deployMissingDryRun,
      deployMissingDateGranularity,
      firstDayOfMonthOnly,
      deployMissingRegion,
      dataStatusMode,
    ],
  );

  // Auto-refresh preview when date granularity changes
  // Keeps modal open and user on data-status tab - only updates the preview overlay
  // This allows users to tweak granularity/options and see updated shard counts in-place
  useEffect(() => {
    // Only auto-refresh if:
    // 1. Modal is open (user is viewing the deploy missing dialog)
    // 2. In preview mode (dry run = true)
    // 3. Has categories to deploy (prevent empty deploys)
    if (
      deployMissingModalOpen &&
      deployMissingDryRun &&
      effectiveDeployCategories.length > 0
    ) {
      const timeoutId = setTimeout(() => {
        handleConfirmDeployMissing(true); // previewRefreshOnly: stay in modal, don't switch tabs
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [
    deployMissingDateGranularity,
    deployMissingModalOpen,
    deployMissingDryRun,
    effectiveDeployCategories.length,
    handleConfirmDeployMissing,
  ]);

  // Handle instrument-level deploy missing
  const handleInstrumentDeployMissing = useCallback(() => {
    if (!onDeployMissing || !selectedInstrument || !instrumentAvailability)
      return;

    // Get data types that have missing data
    const dataTypesWithMissing = Object.entries(
      instrumentAvailability.by_data_type ?? {},
    )
      .filter(([, stats]) => stats.dates_missing > 0)
      .map(([dataType]) => dataType);

    if (dataTypesWithMissing.length === 0) return;

    // Parse instrument key to get venue and folder/instrument_type
    const venue = selectedInstrument.venue ?? "";
    const folder = selectedInstrument.instrument_type ?? "";

    // Use the effective date range from availability window if available
    const effectiveStart =
      instrumentAvailability.availability_window?.effective_start || startDate;
    const effectiveEnd =
      instrumentAvailability.availability_window?.effective_end || endDate;

    // Deploy with instrument-specific filters
    onDeployMissing({
      service: serviceName,
      start_date: effectiveStart,
      end_date: effectiveEnd,
      mode: dataStatusMode,
      region: deployMissingRegion,
      categories: selectedCategories, // Use current category filter
      venues: [venue], // Single venue from instrument
      folders: [folder], // Single folder/instrument_type from instrument
      data_types: dataTypesWithMissing, // Only data types with missing data
      force: false,
      dry_run: true, // Default to preview mode for safety
      skip_existing: true,
      deploy_missing_only: true,
      date_granularity: deployMissingDateGranularity,
      first_day_of_month_only: firstDayOfMonthOnly,
    });
  }, [
    onDeployMissing,
    selectedInstrument,
    instrumentAvailability,
    startDate,
    endDate,
    selectedCategories,
    deployMissingDateGranularity,
    firstDayOfMonthOnly,
    serviceName,
    deployMissingRegion,
    dataStatusMode,
  ]);

  // Convert data to heatmap format for calendar view
  // Uses actual missing_dates from API for accurate per-day status
  // Works with both standard data and venueCheckData
  const heatmapData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const result: {
      date: string;
      status: "complete" | "partial" | "missing" | "future";
      coverage?: number;
      tooltip?: string;
    }[] = [];

    try {
      // DIFFERENT LOGIC FOR VENUE CHECK MODE vs STANDARD MODE
      if (venueCheckData) {
        // VENUE CHECK MODE: Use dates_with_missing_venues structure
        // Build set of dates that have missing venues
        const datesWithIssues = new Set<string>();
        const dateDetails = new Map<string, string[]>(); // date -> [category: X venues missing]

        Object.entries(venueCheckData.categories ?? {}).forEach(
          ([catName, catData]) => {
            if (!catData.dates_with_missing_venues) return;

            catData.dates_with_missing_venues.forEach((dateInfo) => {
              datesWithIssues.add(dateInfo.date);
              if (!dateDetails.has(dateInfo.date)) {
                dateDetails.set(dateInfo.date, []);
              }
              dateDetails
                .get(dateInfo.date)!
                .push(`${catName}: ${dateInfo.missing.length} venues`);
            });
          },
        );

        // Generate day entries
        const currentDate = new Date(start);
        while (currentDate <= end) {
          const dateStr = currentDate.toISOString().split("T")[0];
          const isFuture = currentDate > today;

          if (isFuture) {
            result.push({ date: dateStr, status: "future" });
          } else if (datesWithIssues.has(dateStr)) {
            const details = dateDetails.get(dateStr) || [];
            result.push({
              date: dateStr,
              status: "partial",
              coverage: 50, // Approximate
              tooltip: `${dateStr}: Missing venues (${details.join(", ")})`,
            });
          } else {
            result.push({
              date: dateStr,
              status: "complete",
              coverage: 100,
              tooltip: `${dateStr}: All venues present`,
            });
          }

          currentDate.setDate(currentDate.getDate() + 1);
        }

        return result;
      }

      // STANDARD MODE: Calculate per-day coverage properly
      if (!data || !data.categories) return [];

      // For each date, calculate how many venue-days have data
      const currentDate = new Date(start);
      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const isFuture = currentDate > today;

        if (isFuture) {
          result.push({ date: dateStr, status: "future" });
        } else {
          // Count venues with data for this specific date
          let venuesWithData = 0;
          let totalVenues = 0;
          const missingVenues: string[] = [];

          Object.entries(data.categories).forEach(([catName, catData]) => {
            if (!catData || !catData.venues) return;

            Object.entries(catData.venues).forEach(([venueName, venueData]) => {
              totalVenues++;

              // Check if this date is in missing_dates
              const missing = venueData.missing_dates || [];
              if (missing.includes(dateStr)) {
                // Date is missing for this venue
                missingVenues.push(`${catName}/${venueName}`);
              } else {
                // Date has data for this venue
                venuesWithData++;
              }
            });
          });

          const coverage =
            totalVenues > 0
              ? Math.round((venuesWithData / totalVenues) * 100)
              : 0;

          if (coverage === 100) {
            result.push({
              date: dateStr,
              status: "complete",
              coverage: 100,
              tooltip: `${dateStr}: All ${totalVenues} venues complete`,
            });
          } else if (coverage === 0) {
            result.push({
              date: dateStr,
              status: "missing",
              coverage: 0,
              tooltip: `${dateStr}: No data (${missingVenues.length} venues missing)`,
            });
          } else {
            result.push({
              date: dateStr,
              status: "partial",
              coverage,
              tooltip: `${dateStr}: ${coverage}% coverage (${venuesWithData}/${totalVenues} venues, ${missingVenues.length} missing)`,
            });
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return result;
    } catch {
      return [];
    }
  }, [data, venueCheckData, startDate, endDate]);

  return (
    <div className="space-y-4">
      {/* Filters Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[var(--color-text-muted)]" />
              <CardTitle className="text-base">Filters</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearDataStatusCache}
                disabled={loading || clearingCache}
                title="Clear data status cache and re-fetch (does not affect deployment state)"
              >
                {clearingCache ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Clear Cache
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchData(startDate, endDate)}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Check Status
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {useTurboMode && (
            <div className="mb-4">
              <Label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">
                Mode
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={dataStatusMode === "batch" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDataStatusMode("batch")}
                >
                  Batch
                </Button>
                <Button
                  type="button"
                  variant={dataStatusMode === "live" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDataStatusMode("live")}
                >
                  Live
                </Button>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Batch: historical GCS paths. Live: real-time GCS paths.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">
                Start Date
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                }}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">
                End Date
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                }}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">
                Require Freshness
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={requireFreshness ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const turningOn = !requireFreshness;
                    setRequireFreshness(turningOn);
                    if (turningOn) setFreshnessDate(getTodayAt8am());
                  }}
                >
                  {requireFreshness ? "On" : "Off"}
                </Button>
                {requireFreshness && (
                  <>
                    <Input
                      type="datetime-local"
                      step="1"
                      value={freshnessDate}
                      onChange={(e) => setFreshnessDate(e.target.value)}
                      className="h-9 flex-1"
                      placeholder="Updated since..."
                      title="Enter your local time — it will be converted to UTC for comparison against GCS blob timestamps"
                    />
                    {freshnessDate && (
                      <span
                        className="text-[10px] text-[var(--color-text-muted)] whitespace-nowrap"
                        title="GCS blob timestamps are always UTC regardless of bucket region"
                      >
                        ={" "}
                        {new Date(freshnessDate)
                          .toISOString()
                          .replace("T", " ")
                          .slice(0, 19)}{" "}
                        UTC
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <Label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">
                Categories
              </Label>
              <div className="flex gap-2 flex-wrap">
                {categoriesLoading ? (
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading categories...
                  </div>
                ) : (
                  availableCategories.map((cat) => (
                    <Button
                      key={cat}
                      type="button"
                      variant={
                        selectedCategories.includes(cat) ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        setSelectedCategories((prev) =>
                          prev.includes(cat)
                            ? prev.filter((c) => c !== cat)
                            : [...prev, cat],
                        );
                      }}
                    >
                      {cat}
                    </Button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Venue Filter - appears when exactly one category is selected */}
          {selectedCategories.length === 1 && (
            <div className="mt-4 pt-4 border-t border-[var(--color-border-default)]">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-[var(--color-text-muted)]" />
                <Label className="text-xs font-medium text-[var(--color-text-muted)]">
                  Filter by Venue
                  {selectedVenues.length > 0 && (
                    <span className="ml-2 text-[var(--color-accent-cyan)]">
                      ({selectedVenues.length} selected)
                    </span>
                  )}
                </Label>
                {selectedVenues.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedVenues([])}
                    className="ml-auto"
                  >
                    Clear
                  </Button>
                )}
              </div>
              {venuesLoading ? (
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading venues...
                </div>
              ) : availableVenues.length > 0 ? (
                <div className="flex gap-2 flex-wrap">
                  {availableVenues.map((venue) => (
                    <Button
                      key={venue}
                      type="button"
                      variant={
                        selectedVenues.includes(venue) ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        setSelectedVenues((prev) =>
                          prev.includes(venue)
                            ? prev.filter((v) => v !== venue)
                            : [...prev, venue],
                        );
                      }}
                    >
                      {venue}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--color-text-muted)]">
                  No venues available for {selectedCategories[0]}
                </p>
              )}
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                Filtering by venue reduces GCS scan scope for faster results
              </p>
            </div>
          )}

          {/* Venue-specific Filters - appear when exactly one venue is selected */}
          {selectedVenues.length === 1 && selectedCategories.length === 1 && (
            <div className="mt-4 pt-4 border-t border-[var(--color-border-default)]">
              {venueFiltersLoading ? (
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading filters for {selectedVenues[0]}...
                </div>
              ) : (
                <>
                  {/* Instrument Type (Folder) Filter */}
                  {venueAvailableFolders.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Filter className="h-4 w-4 text-[var(--color-text-muted)]" />
                        <Label className="text-xs font-medium text-[var(--color-text-muted)]">
                          Filter by Instrument Type
                          {selectedFolders.length > 0 && (
                            <span className="ml-2 text-[var(--color-accent-green)]">
                              ({selectedFolders.length} selected)
                            </span>
                          )}
                        </Label>
                        {selectedFolders.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedFolders([])}
                            className="ml-auto"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {venueAvailableFolders.map((f) => (
                          <Button
                            key={f}
                            type="button"
                            variant={
                              selectedFolders.includes(f)
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => {
                              setSelectedFolders((prev) =>
                                prev.includes(f)
                                  ? prev.filter((x) => x !== f)
                                  : [...prev, f],
                              );
                            }}
                          >
                            {f}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Data Type Filter */}
                  {venueAvailableDataTypes.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Filter className="h-4 w-4 text-[var(--color-text-muted)]" />
                        <Label className="text-xs font-medium text-[var(--color-text-muted)]">
                          Filter by Data Type
                          {selectedDataTypes.length > 0 && (
                            <span className="ml-2 text-[var(--color-accent-orange)]">
                              ({selectedDataTypes.length} selected)
                            </span>
                          )}
                        </Label>
                        {selectedDataTypes.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDataTypes([])}
                            className="ml-auto"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {venueAvailableDataTypes.map((dt) => (
                          <Button
                            key={dt}
                            type="button"
                            variant={
                              selectedDataTypes.includes(dt)
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => {
                              setSelectedDataTypes((prev) =>
                                prev.includes(dt)
                                  ? prev.filter((x) => x !== dt)
                                  : [...prev, dt],
                              );
                            }}
                          >
                            {dt}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-[var(--color-text-muted)] mt-3">
                    Filters for {selectedVenues[0]} ({selectedCategories[0]})
                  </p>

                  {/* List Files Button - appears when all filters are specified */}
                  {selectedFolders.length === 1 &&
                    selectedDataTypes.length === 1 && (
                      <div className="mt-4 pt-3 border-t border-[var(--color-border-default)]">
                        {/* Timeframe selector for market-data-processing-service */}
                        {serviceName === "market-data-processing-service" && (
                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Label className="text-xs font-medium text-[var(--color-text-muted)]">
                                Select Timeframe
                              </Label>
                            </div>
                            <div className="flex gap-1.5 flex-wrap">
                              {availableTimeframes.map((tf) => (
                                <Button
                                  key={tf}
                                  type="button"
                                  variant={
                                    selectedTimeframe === tf
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() => setSelectedTimeframe(tf)}
                                >
                                  {tf}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        <Button
                          variant="default"
                          onClick={fetchFileListing}
                          disabled={fileListingLoading}
                          className="w-full justify-center"
                        >
                          {fileListingLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Listing files...
                            </>
                          ) : (
                            <>
                              <FileText className="h-4 w-4" />
                              List Files in GCS
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-[var(--color-text-muted)] mt-2 text-center">
                          Query GCS to see actual parquet files for this path
                        </p>
                      </div>
                    )}
                </>
              )}
            </div>
          )}

          {/* First Day of Month Filter - for TARDIS free tier (no API key needed) */}
          {serviceName === "market-tick-data-handler" && (
            <div className="mt-4 pt-4 border-t border-[var(--color-border-default)]">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="first-day-of-month"
                  checked={firstDayOfMonthOnly}
                  onCheckedChange={(checked) =>
                    setFirstDayOfMonthOnly(checked === true)
                  }
                />
                <Label
                  htmlFor="first-day-of-month"
                  className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4 text-[var(--color-accent-cyan)]" />
                  First day of each month only
                </Label>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-2 ml-7">
                TARDIS free tier: no API key required for first-day-of-month
                data. Check and deploy only 1st of each month dates.
              </p>
            </div>
          )}

          {/* Instrument-Level Search - check availability for specific instruments */}
          {selectedCategories.length === 1 &&
            [
              "market-tick-data-handler",
              "market-data-processing-service",
            ].includes(serviceName) && (
              <div className="mt-4 pt-4 border-t border-[var(--color-border-default)]">
                <div className="flex items-center gap-3 mb-3">
                  <Checkbox
                    id="instrument-search-mode"
                    checked={instrumentSearchMode}
                    onCheckedChange={(checked) =>
                      setInstrumentSearchMode(checked === true)
                    }
                  />
                  <Label
                    htmlFor="instrument-search-mode"
                    className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                  >
                    <Database className="h-4 w-4 text-[var(--color-accent-purple)]" />
                    Instrument-Level Search
                  </Label>
                </div>

                {instrumentSearchMode && (
                  <div className="ml-7 space-y-3">
                    {/* Instrument Search Input */}
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search instrument by ID (e.g., BTC-USDT, AAPL)"
                        value={instrumentSearchQuery}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setInstrumentSearchQuery(newValue);
                          // Clear selection if user is typing (searching for new instrument)
                          if (
                            selectedInstrument &&
                            newValue !== selectedInstrument.instrument_key
                          ) {
                            setSelectedInstrument(null);
                            setInstrumentAvailability(null);
                            setInstrumentSearchResults([]);
                            fetchInstruments(newValue);
                          } else if (!selectedInstrument) {
                            // Only fetch if no instrument is selected
                            fetchInstruments(newValue);
                          }
                        }}
                        onFocus={() => {
                          // Only show dropdown if no instrument selected and we have results
                          if (
                            !selectedInstrument &&
                            instrumentSearchResults.length > 0
                          ) {
                            setShowInstrumentDropdown(true);
                          }
                        }}
                        className="w-full"
                      />
                      {instrumentSearchLoading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[var(--color-text-muted)]" />
                      )}

                      {/* Dropdown Results */}
                      {showInstrumentDropdown &&
                        instrumentSearchResults.length > 0 &&
                        !selectedInstrument && (
                          <div className="absolute z-50 w-full mt-1 max-h-64 overflow-auto bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-lg shadow-lg">
                            {instrumentSearchResults.map((instrument) => (
                              <Button
                                key={instrument.instrument_key}
                                variant="ghost"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  // Cancel any pending searches
                                  if (searchInstrumentsDebounceRef.current) {
                                    clearTimeout(
                                      searchInstrumentsDebounceRef.current,
                                    );
                                    searchInstrumentsDebounceRef.current = null;
                                  }
                                  setSelectedInstrument(instrument);
                                  setInstrumentSearchQuery(
                                    instrument.instrument_key ?? "",
                                  );
                                  setShowInstrumentDropdown(false);
                                  setInstrumentSearchResults([]); // Clear results to prevent dropdown flash
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-bg-secondary)] transition-colors h-auto"
                              >
                                <div className="font-medium">
                                  {instrument.instrument_key}
                                </div>
                                <div className="text-xs text-[var(--color-text-muted)]">
                                  {instrument.venue} •{" "}
                                  {instrument.instrument_type}
                                  {instrument.symbol &&
                                    ` • ${instrument.symbol}`}
                                </div>
                              </Button>
                            ))}
                          </div>
                        )}
                    </div>

                    {/* Selected Instrument Info */}
                    {selectedInstrument && (
                      <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">
                              {selectedInstrument.instrument_key}
                            </div>
                            <div className="text-xs text-[var(--color-text-muted)] mt-1">
                              <span className="text-[var(--color-accent-purple)]">
                                {selectedInstrument.venue}
                              </span>
                              {" • "}
                              <span className="text-[var(--color-accent-cyan)]">
                                {selectedInstrument.instrument_type}
                              </span>
                              {selectedInstrument.data_types && (
                                <>
                                  {" • "}
                                  <span>
                                    {Array.isArray(
                                      selectedInstrument.data_types,
                                    )
                                      ? selectedInstrument.data_types.join(", ")
                                      : String(selectedInstrument.data_types)}
                                  </span>
                                </>
                              )}
                            </div>
                            {/* Instrument Availability Window */}
                            {(selectedInstrument.available_from_datetime ||
                              selectedInstrument.available_to_datetime) && (
                              <div className="text-xs text-[var(--color-text-muted)] mt-1">
                                <span className="text-[var(--color-accent-amber)]">
                                  Available:{" "}
                                </span>
                                {selectedInstrument.available_from_datetime
                                  ? selectedInstrument.available_from_datetime.split(
                                      "T",
                                    )[0]
                                  : "..."}
                                {" → "}
                                {selectedInstrument.available_to_datetime
                                  ? selectedInstrument.available_to_datetime.split(
                                      "T",
                                    )[0]
                                  : "ongoing"}
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={fetchInstrumentAvailability}
                            disabled={instrumentAvailabilityLoading}
                            className="bg-[var(--color-accent-purple)] hover:bg-[var(--color-accent-purple)]/80"
                          >
                            {instrumentAvailabilityLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Checking...
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Check Availability
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Availability Results */}
                    {instrumentAvailabilityError && (
                      <div className="flex items-center gap-2 text-sm text-[var(--color-accent-red)]">
                        <AlertCircle className="h-4 w-4" />
                        {instrumentAvailabilityError}
                      </div>
                    )}

                    {instrumentAvailability && (
                      <div className="space-y-3">
                        {/* Overall Summary */}
                        <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              Overall Availability
                            </span>
                            <Badge
                              className={getCompletionBadgeClass(
                                instrumentAvailability.overall?.completion_pct ?? 0,
                              )}
                            >
                              {(instrumentAvailability.overall?.completion_pct ?? 0).toFixed(
                                1,
                              )}
                              %
                            </Badge>
                          </div>
                          <div className="w-full bg-[var(--color-bg-secondary)] rounded-full h-2 mb-2">
                            <div
                              className="h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(instrumentAvailability.overall?.completion_pct ?? 0, 100)}%`,
                                backgroundColor: getCompletionColor(
                                  instrumentAvailability.overall?.completion_pct ?? 0,
                                ),
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                            <span>
                              Found:{" "}
                              <span className="text-[var(--color-accent-green)]">
                                {instrumentAvailability.overall?.found}
                              </span>
                            </span>
                            <span>
                              Missing:{" "}
                              <span className="text-[var(--color-accent-red)]">
                                {instrumentAvailability.overall?.missing}
                              </span>
                            </span>
                            <span>
                              Expected:{" "}
                              {instrumentAvailability.overall?.expected}
                            </span>
                          </div>
                          <div className="text-xs text-[var(--color-text-muted)] mt-2">
                            {/* Show effective date range (intersection of user range and instrument availability) */}
                            {instrumentAvailability.availability_window ? (
                              <>
                                <span className="text-[var(--color-accent-amber)]">
                                  Effective:{" "}
                                </span>
                                {
                                  instrumentAvailability.availability_window
                                    .effective_start
                                }{" "}
                                to{" "}
                                {
                                  instrumentAvailability.availability_window
                                    .effective_end
                                }
                                {" • "}
                                {
                                  instrumentAvailability.availability_window
                                    .dates_in_window
                                }{" "}
                                dates
                                {instrumentAvailability.availability_window
                                  .instrument_from && (
                                  <span className="block mt-1">
                                    <span className="text-[var(--color-text-muted)]">
                                      Instrument available:{" "}
                                    </span>
                                    {
                                      instrumentAvailability.availability_window.instrument_from.split(
                                        "T",
                                      )[0]
                                    }
                                    {" → "}
                                    {instrumentAvailability.availability_window
                                      .instrument_to
                                      ? instrumentAvailability.availability_window.instrument_to.split(
                                          "T",
                                        )[0]
                                      : "ongoing"}
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                {instrumentAvailability.date_range?.start} to{" "}
                                {instrumentAvailability.date_range?.end}
                                {" • "}
                                {
                                  instrumentAvailability.date_range?.total_dates
                                }{" "}
                                dates
                              </>
                            )}
                            {instrumentAvailability.date_range
                              ?.first_day_of_month_only && (
                              <span className="text-[var(--color-accent-cyan)]">
                                {" "}
                                (first day of month only)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Deploy Missing for Instrument */}
                        {(instrumentAvailability.overall?.missing ?? 0) > 0 &&
                          onDeployMissing && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-status-error-bg)] border border-[var(--color-status-error-border)]">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-[var(--color-accent-red)]" />
                                <span className="text-sm">
                                  {instrumentAvailability.overall?.missing}{" "}
                                  missing across{" "}
                                  {
                                    Object.entries(
                                      instrumentAvailability.by_data_type ?? {},
                                    ).filter(([, s]) => s.dates_missing > 0)
                                      .length
                                  }{" "}
                                  data type(s)
                                </span>
                              </div>
                              <Button
                                size="sm"
                                onClick={handleInstrumentDeployMissing}
                                className="bg-[var(--color-accent-red)] hover:bg-[var(--color-accent-red)]/80"
                              >
                                <Rocket className="h-4 w-4 mr-2" />
                                Deploy Missing
                              </Button>
                            </div>
                          )}

                        {/* Per Data Type Breakdown */}
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-[var(--color-text-muted)]">
                            By Data Type
                          </div>
                          {Object.entries(
                            instrumentAvailability.by_data_type ?? {},
                          ).map(([dataType, stats]) => (
                            <div
                              key={dataType}
                              className="p-2 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm">{dataType}</span>
                                <span
                                  className={cn(
                                    "text-xs font-medium",
                                    stats.completion_pct >= 100
                                      ? "text-[var(--color-accent-green)]"
                                      : stats.completion_pct >= 50
                                        ? "text-[var(--color-accent-amber)]"
                                        : "text-[var(--color-accent-red)]",
                                  )}
                                >
                                  {stats.completion_pct.toFixed(1)}% (
                                  {stats.dates_found}/
                                  {stats.dates_found + stats.dates_missing})
                                </span>
                              </div>
                              <div className="w-full bg-[var(--color-bg-tertiary)] rounded-full h-1.5">
                                <div
                                  className="h-1.5 rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(stats.completion_pct, 100)}%`,
                                    backgroundColor: getCompletionColor(
                                      stats.completion_pct,
                                    ),
                                  }}
                                />
                              </div>
                              {/* Expandable date lists */}
                              <div className="mt-2 space-y-2">
                                {/* Found dates dropdown (green) */}
                                {stats.dates_found > 0 &&
                                  stats.dates_found_list &&
                                  stats.dates_found_list.length > 0 && (
                                    <details className="w-full">
                                      <summary className="text-[10px] text-[var(--color-accent-green)] cursor-pointer hover:underline font-medium">
                                        ▸ {stats.dates_found} available days
                                        (click to expand)
                                      </summary>
                                      <div className="mt-1 pl-2 border-l-2 border-[var(--color-status-success-border-strong)]">
                                        <div className="flex flex-wrap gap-1 max-h-64 overflow-y-auto">
                                          {stats.dates_found_list.map(
                                            (date: string) => (
                                              <span
                                                key={date}
                                                className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-status-success-bg)] text-[var(--color-accent-green)]"
                                              >
                                                {date}
                                              </span>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    </details>
                                  )}
                                {/* Missing dates dropdown (red) */}
                                {stats.dates_missing > 0 &&
                                  stats.dates_missing_list &&
                                  stats.dates_missing_list.length > 0 && (
                                    <details className="w-full">
                                      <summary className="text-[10px] text-[var(--color-accent-red)] cursor-pointer hover:underline font-medium">
                                        ▸ {stats.dates_missing} missing days
                                        (click to expand)
                                      </summary>
                                      <div className="mt-1 pl-2 border-l-2 border-[var(--color-status-error-border-strong)]">
                                        <div className="flex flex-wrap gap-1 max-h-64 overflow-y-auto">
                                          {stats.dates_missing_list.map(
                                            (date: string) => (
                                              <span
                                                key={date}
                                                className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-status-error-bg)] text-[var(--color-accent-red)]"
                                              >
                                                {date}
                                              </span>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    </details>
                                  )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Parsed Instrument Info */}
                        <div className="text-xs text-[var(--color-text-muted)]">
                          Parsed: {instrumentAvailability.parsed?.category} /{" "}
                          {instrumentAvailability.parsed?.venue} /
                          {instrumentAvailability.parsed?.folder} /{" "}
                          {instrumentAvailability.parsed?.instrument_type}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-[var(--color-text-muted)]">
                      Search for a specific instrument to check its data
                      availability across all data types and dates. This uses
                      the aggregated instruments file for{" "}
                      {selectedCategories[0]}.
                    </p>
                  </div>
                )}
              </div>
            )}

          {/* Check Data Types Toggle - DISABLED: turbo mode shows data_types by default in breakdown */}
          {/* Feature removed - checkDataTypes is hardcoded to false, turbo mode handles this automatically */}
        </CardContent>
      </Card>

      {/* View Toggle - available for all modes (except turbo which has its own simpler view) */}
      {(data || venueCheckData) && !turboData && !loading && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">View:</span>
          <div className="flex items-center bg-[var(--color-bg-tertiary)] rounded-lg p-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors",
                viewMode === "table"
                  ? "bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]",
              )}
            >
              <Table2 className="h-3.5 w-3.5" />
              Table
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("calendar")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors",
                viewMode === "calendar"
                  ? "bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]",
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Calendar
            </Button>
          </div>
        </div>
      )}

      {/* Status/Error */}
      {loading && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent-cyan)]" />
              <p className="text-sm text-[var(--color-text-muted)]">
                {checkVenues
                  ? "Deep scanning parquet files for venue coverage..."
                  : checkDataTypes
                    ? "Validating per data_type completion..."
                    : useTurboMode
                      ? `TURBO mode: Scanning ${serviceName} data...`
                      : `Checking ${serviceName} data status...`}
              </p>
              {checkVenues && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  This may take 20-30 seconds
                </p>
              )}
              {checkDataTypes && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  This may take 60-90 seconds for detailed validation
                </p>
              )}
              {!checkVenues && !checkDataTypes && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  {startDate} to {endDate}
                  {useTurboMode &&
                    (() => {
                      // Calculate months for ETA estimate
                      // Local: ~1.2s per month, Cloud Run: ~0.5s per month
                      const start = new Date(startDate);
                      const end = new Date(endDate);
                      const months = Math.ceil(
                        (end.getTime() - start.getTime()) /
                          (1000 * 60 * 60 * 24 * 30),
                      );
                      const etaSeconds =
                        months > 6
                          ? Math.ceil(months * 1.2)
                          : Math.ceil(months * 3);
                      return ` • Optimized scan (~${etaSeconds}s for ${months} months)`;
                    })()}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={cancelQuery}
                className="mt-4 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Query
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-3 text-[var(--color-accent-red)]">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Venue Check Results */}
      {venueCheckData &&
        checkVenues &&
        venueCheckData.start_date === startDate &&
        venueCheckData.end_date === endDate && (
          <>
            {/* Venue Check Summary */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl font-mono flex items-center gap-2">
                      <Eye className="h-5 w-5 text-[var(--color-accent-purple)]" />
                      Venue Coverage Check
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {venueCheckData.start_date} to {venueCheckData.end_date} •
                      Deep scan of parquet files
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(venueCheckData.categories ?? {}).map(
                    ([catName, catData]) => {
                      const datesWithIssues =
                        catData.dates_with_missing_venues?.length ?? 0;
                      const totalDates = catData.total_dates;
                      const isClean = datesWithIssues === 0;
                      const isExpanded = expandedCategories.has(catName);

                      return (
                        <div
                          key={catName}
                          className="border border-[var(--color-border-subtle)] rounded-lg overflow-hidden"
                        >
                          {/* Category Header */}
                          <Button
                            variant="ghost"
                            onClick={() => toggleCategory(catName)}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--color-bg-secondary)] transition-colors h-auto"
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                              )}
                              <span className="font-medium">{catName}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {isClean ? (
                                <Badge
                                  variant="outline"
                                  className="bg-[var(--color-status-success-bg)] text-[var(--color-accent-green)] border-[var(--color-status-success-border-strong)]"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  All venues present
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-[var(--color-status-error-bg)] text-[var(--color-accent-red)] border-[var(--color-status-error-border-strong)]"
                                >
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  {datesWithIssues} / {totalDates} dates have
                                  missing venues
                                </Badge>
                              )}
                            </div>
                          </Button>

                          {/* Expanded: Dates with missing venues */}
                          {isExpanded && datesWithIssues > 0 && (
                            <div className="bg-[var(--color-bg-secondary)] px-4 py-3 space-y-2">
                              {catData.dates_with_missing_venues.map(
                                (dateInfo) => {
                                  const dateKey = `${catName}-${dateInfo.date}`;
                                  const isDateExpanded =
                                    expandedDates.has(dateKey);

                                  return (
                                    <div
                                      key={dateInfo.date}
                                      className="border border-[var(--color-border-subtle)] rounded bg-[var(--color-bg-primary)]"
                                    >
                                      <Button
                                        variant="ghost"
                                        onClick={() => toggleDate(dateKey)}
                                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-[var(--color-bg-tertiary)] transition-colors h-auto"
                                      >
                                        <div className="flex items-center gap-2">
                                          {isDateExpanded ? (
                                            <ChevronDown className="h-3 w-3 text-[var(--color-text-muted)]" />
                                          ) : (
                                            <ChevronRight className="h-3 w-3 text-[var(--color-text-muted)]" />
                                          )}
                                          <Calendar className="h-3 w-3 text-[var(--color-text-muted)]" />
                                          <span className="font-mono text-sm">
                                            {dateInfo.date}
                                          </span>
                                        </div>
                                        <Badge
                                          variant="outline"
                                          className="text-xs bg-[var(--color-status-error-bg)] text-[var(--color-accent-red)] border-[var(--color-status-error-border-strong)]"
                                        >
                                          {dateInfo.missing.length} missing
                                        </Badge>
                                      </Button>

                                      {isDateExpanded && (
                                        <div className="px-3 py-2 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-tertiary)]">
                                          <div className="text-xs text-[var(--color-text-muted)] mb-2">
                                            Missing venues:
                                          </div>
                                          <div className="flex flex-wrap gap-1.5">
                                            {dateInfo.missing.map((venue) => (
                                              <Badge
                                                key={venue}
                                                variant="outline"
                                                className="text-xs font-mono bg-[var(--color-status-error-bg-subtle)] text-[var(--color-accent-red)] border-[var(--color-status-error-border)]"
                                              >
                                                {venue}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                },
                              )}
                            </div>
                          )}

                          {isExpanded && datesWithIssues === 0 && (
                            <div className="bg-[var(--color-bg-secondary)] px-4 py-6 text-center">
                              <CheckCircle2 className="h-8 w-8 text-[var(--color-accent-green)] mx-auto mb-2" />
                              <p className="text-sm text-[var(--color-text-muted)]">
                                All {totalDates} dates have complete venue
                                coverage
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>

                {/* Deploy Missing from Venue Check */}
                {Object.values(venueCheckData.categories ?? {}).some(
                  (c) => (c.dates_with_missing_venues?.length ?? 0) > 0,
                ) &&
                  onDeployMissing && (
                    <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-[var(--color-status-error-bg)] border border-[var(--color-status-error-border)]">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-[var(--color-accent-red)]" />
                        <span className="text-sm">
                          Re-run dates with missing venues to regenerate parquet
                          files
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleOpenDeployMissingModal}
                        className="bg-[var(--color-accent-red)] hover:bg-[var(--color-accent-red)]/80"
                      >
                        <Rocket className="h-4 w-4 mr-2" />
                        Re-deploy Affected Dates
                      </Button>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Calendar View for Venue Check Mode */}
            {viewMode === "calendar" && heatmapData.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Coverage Calendar</CardTitle>
                  <CardDescription>
                    Visual overview of venue coverage by day
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <HeatmapCalendar
                    data={heatmapData}
                    startDate={startDate}
                    endDate={endDate}
                    onDateClick={(date) => setSelectedCalendarDate(date)}
                    selectedDate={selectedCalendarDate || undefined}
                  />

                  {/* Selected Date Details */}
                  {selectedCalendarDate && (
                    <div className="mt-4 p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-default)]">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">
                          {new Date(selectedCalendarDate).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCalendarDate(null)}
                          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] h-auto p-0"
                        >
                          ✕ Close
                        </Button>
                      </div>
                      {heatmapData.find((d) => d.date === selectedCalendarDate)
                        ?.tooltip && (
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          {
                            heatmapData.find(
                              (d) => d.date === selectedCalendarDate,
                            )?.tooltip
                          }
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

      {/* Data Type Check Results */}
      {dataTypeCheckData &&
        checkDataTypes &&
        dataTypeCheckData.start_date === startDate &&
        dataTypeCheckData.end_date === endDate && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl font-mono flex items-center gap-2">
                      <Database className="h-5 w-5 text-[var(--color-accent-green)]" />
                      Data Type Validation
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {dataTypeCheckData.start_date} to{" "}
                      {dataTypeCheckData.end_date} • Per data_type validation
                      (TRADFI)
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-3xl font-mono font-bold"
                      style={{
                        color: getCompletionColor(
                          dataTypeCheckData.overall_completion ?? 0,
                        ),
                      }}
                    >
                      {(dataTypeCheckData.overall_completion ?? 0).toFixed(1)}%
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      {dataTypeCheckData.overall_complete} /{" "}
                      {dataTypeCheckData.overall_total} data_type × date
                      combinations
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Progress bar */}
                <div className="h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden mb-6">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${dataTypeCheckData.overall_completion ?? 0}%`,
                      backgroundColor: getCompletionColor(
                        dataTypeCheckData.overall_completion ?? 0,
                      ),
                    }}
                  />
                </div>

                {/* Venue Breakdown with Data Types */}
                <div className="space-y-3">
                  {dataTypeCheckData.venues &&
                    Object.entries(dataTypeCheckData.venues).map(
                      ([venueName, venueData]) => {
                        const isExpanded = expandedVenues.has(venueName);
                        const isComplete = venueData.completion_percent === 100;

                        return (
                          <div
                            key={venueName}
                            className="border border-[var(--color-border-subtle)] rounded-lg overflow-hidden"
                          >
                            <Button
                              variant="ghost"
                              onClick={() => toggleVenue(venueName)}
                              className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--color-bg-secondary)] transition-colors h-auto"
                            >
                              <div className="flex items-center gap-3">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                                )}
                                <span className="font-medium">{venueName}</span>
                                <span className="text-xs text-[var(--color-text-muted)]">
                                  (
                                  {
                                    Object.keys(venueData.data_types || {})
                                      .length
                                  }{" "}
                                  data types)
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    isComplete
                                      ? "bg-[var(--color-status-success-bg)] text-[var(--color-accent-green)] border-[var(--color-status-success-border-strong)]"
                                      : "bg-[var(--color-status-error-bg)] text-[var(--color-accent-red)] border-[var(--color-status-error-border-strong)]",
                                  )}
                                >
                                  {isComplete ? (
                                    <>
                                      <CheckCircle2 className="h-3 w-3 mr-1" />{" "}
                                      {venueData.completion_percent.toFixed(0)}%
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle className="h-3 w-3 mr-1" />{" "}
                                      {venueData.completion_percent.toFixed(0)}%
                                    </>
                                  )}
                                </Badge>
                                <span className="text-xs text-[var(--color-text-muted)] font-mono">
                                  {venueData.complete}/{venueData.total}
                                </span>
                              </div>
                            </Button>

                            {/* Expanded: Data type breakdown */}
                            {isExpanded && venueData.data_types && (
                              <div className="bg-[var(--color-bg-secondary)] px-4 py-3">
                                <div className="grid gap-2">
                                  {Object.entries(venueData.data_types).map(
                                    ([dataType, typeData]) => {
                                      const typeComplete =
                                        typeData.completion_percent === 100;
                                      return (
                                        <div
                                          key={dataType}
                                          className="flex items-center justify-between px-3 py-2 bg-[var(--color-bg-primary)] rounded border border-[var(--color-border-subtle)]"
                                        >
                                          <div className="flex items-center gap-2">
                                            {typeComplete ? (
                                              <CheckCircle2 className="h-4 w-4 text-[var(--color-accent-green)]" />
                                            ) : (
                                              <XCircle className="h-4 w-4 text-[var(--color-accent-red)]" />
                                            )}
                                            <span className="font-mono text-sm">
                                              {dataType}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <span
                                              className="text-sm font-medium"
                                              style={{
                                                color: getCompletionColor(
                                                  typeData.completion_percent,
                                                ),
                                              }}
                                            >
                                              {typeData.completion_percent.toFixed(
                                                0,
                                              )}
                                              %
                                            </span>
                                            <span className="text-xs text-[var(--color-text-muted)] font-mono">
                                              {typeData.found}/
                                              {typeData.expected}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    },
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      },
                    )}
                </div>

                {/* Info about tick windows - TRADFI specific */}
                <div className="mt-4 p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                  <p className="text-xs text-[var(--color-text-muted)]">
                    <strong>Tick Windows (TRADFI only):</strong> May 2023 and
                    July 2024 expect 3 data types (trades, ohlcv_1m, tbbo) for
                    backtesting. Other dates expect only ohlcv_1m for cost
                    optimization. DEFI/CEFI always expect all data types.
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}

      {/* TURBO Mode Results (fast mode for market-tick-data-handler) */}
      {turboData && !checkVenues && !checkDataTypes && (
        <>
          {/* Summary Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl font-mono flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Data Coverage
                    <Badge
                      variant="outline"
                      className="ml-2 bg-[var(--color-status-success-bg)] text-[var(--color-accent-green)] border-[var(--color-status-success-border-strong)]"
                    >
                      TURBO
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {turboData.date_range?.start} to {turboData.date_range?.end} (
                    {turboData.date_range?.days} days)
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div
                    className="text-3xl font-mono font-bold"
                    style={{
                      color: getCompletionColor(
                        turboData.overall_completion_pct ?? 0,
                      ),
                    }}
                  >
                    {(turboData.overall_completion_pct ?? 0).toFixed(1)}%
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {turboData.overall_dates_found} /{" "}
                    {turboData.overall_dates_expected} venue-days
                  </div>
                  {turboData.overall_dates_found_category !== undefined && (
                    <div className="text-xs text-[var(--color-text-muted)] opacity-70">
                      ({turboData.overall_dates_found_category} /{" "}
                      {turboData.overall_dates_expected_category} dates)
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Progress bar */}
              <div className="h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${turboData.overall_completion_pct ?? 0}%`,
                    backgroundColor: getCompletionColor(
                      turboData.overall_completion_pct ?? 0,
                    ),
                  }}
                />
              </div>

              {/* Deploy Missing Button - shows only expected missing (dates >= venue start) */}
              {totalMissing > 0 && onDeployMissing && (
                <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-[var(--color-status-error-bg)] border border-[var(--color-status-error-border)]">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-[var(--color-accent-red)]" />
                    <span className="text-sm">
                      <strong>{totalMissing}</strong> missing venue-days
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleOpenDeployMissingModal}
                    className="bg-[var(--color-accent-red)] hover:bg-[var(--color-accent-red)]/80"
                  >
                    <Rocket className="h-4 w-4 mr-2" />
                    Deploy Missing
                  </Button>
                </div>
              )}

              {/* All data complete message */}
              {totalMissing === 0 && (
                <div className="mt-4 flex items-center justify-center p-3 rounded-lg bg-[var(--color-status-success-bg)] border border-[var(--color-status-success-border)]">
                  <CheckCircle2 className="h-4 w-4 text-[var(--color-accent-green)] mr-2" />
                  <span className="text-sm text-[var(--color-accent-green)]">
                    All expected data present
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categories Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(turboData.categories).map(
                  ([catName, catData]) => {
                    const isComplete = (catData.completion_pct ?? 0) >= 100;

                    return (
                      <div key={catName} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isComplete ? (
                              <CheckCircle2 className="h-4 w-4 text-[var(--color-accent-green)]" />
                            ) : catData.error ? (
                              <XCircle className="h-4 w-4 text-[var(--color-accent-red)]" />
                            ) : (
                              <Database className="h-4 w-4 text-[var(--color-accent-cyan)]" />
                            )}
                            <span className="font-medium">{catName}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {catData.error ? (
                              <span className="text-sm text-[var(--color-accent-red)]">
                                {catData.error}
                              </span>
                            ) : (
                              <>
                                <span className="text-sm text-[var(--color-text-muted)]">
                                  {catData.venue_dates_found ??
                                    catData.dates_found}{" "}
                                  /{" "}
                                  {catData.venue_dates_expected ??
                                    catData.dates_expected}{" "}
                                  {catData.venue_weighted
                                    ? "venue-days"
                                    : "dates"}
                                </span>
                                <span
                                  className="text-sm font-mono font-medium"
                                  style={{
                                    color: getCompletionColor(
                                      catData.completion_pct ?? 0,
                                    ),
                                  }}
                                >
                                  {(catData.completion_pct ?? 0).toFixed(1)}%
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {!catData.error && (
                          <div className="h-1.5 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all duration-500"
                              style={{
                                width: `${catData.completion_pct ?? 0}%`,
                                backgroundColor: getCompletionColor(
                                  catData.completion_pct ?? 0,
                                ),
                              }}
                            />
                          </div>
                        )}
                        {(catData.dates_missing ?? 0) > 0 &&
                          !catData.error &&
                          !catData.bulk_service && (
                            <p className="text-xs text-[var(--color-text-muted)]">
                              {catData.dates_missing} date
                              {catData.dates_missing !== 1 ? "s" : ""} missing
                              {Array.isArray(catData.missing_dates) &&
                                catData.missing_dates.length > 0 && (
                                  <span className="ml-1">
                                    (e.g.,{" "}
                                    {catData.missing_dates
                                      .slice(0, 3)
                                      .join(", ")}
                                    {catData.missing_dates.length > 3
                                      ? "..."
                                      : ""}
                                    )
                                  </span>
                                )}
                            </p>
                          )}
                        {catData.bulk_service && (
                          <p className="text-xs text-[var(--color-text-muted)] italic">
                            Bulk download service — {catData.dates_found} of{" "}
                            {catData.dates_expected} dates have data.
                            {(catData.dates_missing ?? 0) > 0 &&
                              " Run the service to populate all dates."}
                          </p>
                        )}

                        {/* Category-level date dropdowns (for services without sub-dimensions) */}
                        {!catData.venues &&
                          !catData.data_types &&
                          !catData.feature_groups &&
                          !catData.error && (
                            <div className="flex gap-4 mt-2">
                              {/* Available dates dropdown (green) */}
                              {catData.dates_found_count &&
                                catData.dates_found_count > 0 && (
                                  <details className="flex-1">
                                    <summary className="text-xs text-[var(--color-accent-green)] cursor-pointer hover:underline">
                                      {catData.dates_found_count} available days
                                    </summary>
                                    <div className="mt-1 pl-2 border-l-2 border-[var(--color-status-success-border-strong)]">
                                      <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                                        {catData.dates_found_list?.map(
                                          (date: string) => (
                                            <span
                                              key={date}
                                              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-status-success-bg)] text-[var(--color-accent-green)]"
                                            >
                                              {date}
                                            </span>
                                          ),
                                        )}
                                        {catData.dates_found_truncated && (
                                          <>
                                            <span className="text-[9px] text-[var(--color-text-muted)]">
                                              ...
                                            </span>
                                            {catData.dates_found_list_tail?.map(
                                              (date: string) => (
                                                <span
                                                  key={date}
                                                  className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-status-success-bg)] text-[var(--color-accent-green)]"
                                                >
                                                  {date}
                                                </span>
                                              ),
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </details>
                                )}
                              {/* Missing dates dropdown (red) */}
                              {catData.dates_missing_count &&
                                catData.dates_missing_count > 0 && (
                                  <details className="flex-1">
                                    <summary className="text-xs text-[var(--color-accent-red)] cursor-pointer hover:underline">
                                      {catData.dates_missing_count} missing days
                                    </summary>
                                    <div className="mt-1 pl-2 border-l-2 border-[var(--color-status-error-border-strong)]">
                                      <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                                        {catData.dates_missing_list?.map(
                                          (date: string) => (
                                            <span
                                              key={date}
                                              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-status-error-bg)] text-[var(--color-accent-red)]"
                                            >
                                              {date}
                                            </span>
                                          ),
                                        )}
                                        {catData.dates_missing_truncated && (
                                          <>
                                            <span className="text-[9px] text-[var(--color-text-muted)]">
                                              ...
                                            </span>
                                            {catData.dates_missing_list_tail?.map(
                                              (date: string) => (
                                                <span
                                                  key={date}
                                                  className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-status-error-bg)] text-[var(--color-accent-red)]"
                                                >
                                                  {date}
                                                </span>
                                              ),
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </details>
                                )}
                            </div>
                          )}

                        {/* Sub-dimension breakdown (venues, data_types, feature_groups) */}
                        {(catData.venues ||
                          catData.data_types ||
                          catData.feature_groups) && (
                          <div className="mt-3 pl-6 space-y-3 border-l-2 border-[var(--color-border)]">
                            {/* Folders/Instrument Types section - own bordered container */}
                            {catData.folders &&
                              Object.keys(catData.folders).length > 0 && (
                                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
                                  <p className="text-xs text-[var(--color-text-muted)] font-medium uppercase tracking-wide mb-2">
                                    Instrument Types (Folders)
                                  </p>
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                    {Object.entries(catData.folders).map(
                                      ([folderName, folderData]) => (
                                        <div
                                          key={folderName}
                                          className="bg-[var(--color-bg-tertiary)] rounded p-2"
                                        >
                                          <div className="flex items-center justify-between">
                                            <span
                                              className="text-xs font-mono truncate"
                                              title={folderName}
                                            >
                                              {folderName}
                                            </span>
                                            <span
                                              className="text-xs font-mono font-medium ml-1"
                                              style={{
                                                color: getCompletionColor(
                                                  folderData.completion_pct ?? 0,
                                                ),
                                              }}
                                            >
                                              {(folderData.completion_pct ?? 0).toFixed(
                                                0,
                                              )}
                                              %
                                            </span>
                                          </div>
                                          <div className="h-1.5 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden mt-1">
                                            <div
                                              className="h-full"
                                              style={{
                                                width: `${folderData.completion_pct ?? 0}%`,
                                                backgroundColor:
                                                  getCompletionColor(
                                                    folderData.completion_pct ?? 0,
                                                  ),
                                              }}
                                            />
                                          </div>
                                          <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                                            {folderData.dates_found}/
                                            {folderData.dates_expected} days
                                          </div>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Venues / Data Types / Feature Groups section - own bordered container */}
                            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-[var(--color-text-muted)] font-medium uppercase tracking-wide">
                                  {catData.venues
                                    ? catData.folders
                                      ? "Venues"
                                      : "Venues"
                                    : catData.data_types
                                      ? "Data Types"
                                      : "Feature Groups"}
                                </p>
                                {/* Venue Summary Badges */}
                                {catData.venue_summary && (
                                  <div className="flex items-center gap-2 text-xs">
                                    {catData.venue_summary
                                      .expected_coverage_pct === 100 ? (
                                      <Badge
                                        variant="outline"
                                        className="bg-[var(--color-status-success-bg)] text-[var(--color-accent-green)] border-[var(--color-status-success-border-strong)]"
                                      >
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        All{" "}
                                        {catData.venue_summary.expected_count}{" "}
                                        expected
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="bg-[var(--color-status-error-bg)] text-[var(--color-accent-red)] border-[var(--color-status-error-border-strong)] cursor-help"
                                        title={`Missing: ${catData.venue_summary.expected_but_missing?.join(", ")}`}
                                      >
                                        <XCircle className="h-3 w-3 mr-1" />
                                        {
                                          catData.venue_summary
                                            .expected_but_missing?.length ?? 0
                                        }{" "}
                                        expected missing
                                      </Badge>
                                    )}
                                    {(catData.venue_summary.unexpected_but_found
                                      ?.length ?? 0) > 0 && (
                                      <Badge
                                        variant="outline"
                                        className="bg-[var(--color-status-warning-bg)] text-[var(--color-accent-amber)] border-[var(--color-status-warning-border)]"
                                      >
                                        +
                                        {
                                          catData.venue_summary
                                            .unexpected_but_found?.length ?? 0
                                        }{" "}
                                        bonus
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                              {/* Show missing venues inline */}
                              {catData.venue_summary &&
                                (catData.venue_summary.expected_but_missing
                                  ?.length ?? 0) > 0 && (
                                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                    <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">
                                      Missing:
                                    </span>
                                    {(catData.venue_summary.expected_but_missing ?? []).map(
                                      (venue: string) => (
                                        <span
                                          key={venue}
                                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-status-error-bg-alt)] text-[var(--color-accent-red)] border border-[var(--color-status-error-border-strong)]"
                                        >
                                          {venue}
                                        </span>
                                      ),
                                    )}
                                  </div>
                                )}

                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {Object.entries(
                                  (catData.venues ||
                                    catData.data_types ||
                                    catData.feature_groups ||
                                    {}) as Record<string, TurboVenueData>,
                                ).map(([name, subData]) => {
                                  // Use dimension-weighted counts when available (accounts for
                                  // multiple expected data_types/folders per venue). Falls back
                                  // to raw venue dates for services without sub-dimensions.
                                  const hasDimWeighting =
                                    subData._dim_weighted_found !== undefined;
                                  const effectiveFound = hasDimWeighting
                                    ? subData._dim_weighted_found
                                    : subData.dates_found;
                                  const effectiveExpected = hasDimWeighting
                                    ? subData._dim_weighted_expected
                                    : subData.dates_expected_venue ||
                                      subData.dates_expected;
                                  const expectedDates =
                                    subData.dates_expected_venue ||
                                    subData.dates_expected;
                                  const venueStartDate =
                                    subData.venue_start_date;

                                  return (
                                    <div
                                      key={name}
                                      className={cn(
                                        "bg-[var(--color-bg-tertiary)] rounded p-2",
                                        subData.status === "bonus" &&
                                          "opacity-60 border border-dashed border-[var(--color-border)]",
                                      )}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1 min-w-0">
                                          <span
                                            className="text-xs font-mono truncate"
                                            title={name}
                                          >
                                            {name}
                                          </span>
                                          {subData.status === "bonus" && (
                                            <span className="text-[9px] text-[var(--color-accent-amber)] font-medium shrink-0">
                                              +
                                            </span>
                                          )}
                                        </div>
                                        <span
                                          className="text-xs font-mono font-medium ml-1"
                                          style={{
                                            color: getCompletionColor(
                                              subData.completion_pct ?? 0,
                                            ),
                                          }}
                                        >
                                          {(subData.completion_pct ?? 0).toFixed(0)}%
                                        </span>
                                      </div>
                                      {/* Progress bar with expected vs actual visualization */}
                                      <div className="h-1.5 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden mt-1 relative">
                                        <div
                                          className="h-full absolute left-0 top-0"
                                          style={{
                                            width: `${subData.completion_pct ?? 0}%`,
                                            backgroundColor: getCompletionColor(
                                              subData.completion_pct ?? 0,
                                            ),
                                          }}
                                        />
                                      </div>
                                      {/* Show found vs expected counts */}
                                      <div className="flex justify-between items-center mt-0.5">
                                        <span className="text-[10px] text-[var(--color-text-muted)]">
                                          {hasDimWeighting
                                            ? `${effectiveFound}/${effectiveExpected} across ${Math.round((effectiveExpected || 0) / (expectedDates || 1))} types`
                                            : `${subData.dates_found}/${expectedDates} days`}
                                        </span>
                                        {venueStartDate && (
                                          <span
                                            className="text-[9px] text-[var(--color-text-muted)] opacity-70"
                                            title={`Data starts: ${venueStartDate}`}
                                          >
                                            from{" "}
                                            {venueStartDate.substring(0, 7)}
                                          </span>
                                        )}
                                      </div>
                                      {/* Data types breakdown if available */}
                                      {subData.data_types &&
                                        Object.keys(subData.data_types).length >
                                          0 && (
                                          <details className="mt-1">
                                            <summary className="text-[9px] text-[var(--color-accent-cyan)] cursor-pointer hover:underline">
                                              {
                                                Object.keys(subData.data_types)
                                                  .length
                                              }{" "}
                                              data types
                                            </summary>
                                            <div className="mt-1 space-y-0.5 pl-1 border-l border-[var(--color-border-subtle)]">
                                              {Object.entries(
                                                subData.data_types!,
                                              ).map(([dtName, dtData]: [string, { dates_found?: number; dates_expected?: number; completion_pct?: number; status?: string }]) => (
                                                <div
                                                  key={dtName}
                                                  className="flex items-center justify-between text-[9px]"
                                                >
                                                  <span
                                                    className={cn(
                                                      "truncate",
                                                      dtData.status ===
                                                        "missing" &&
                                                        "text-[var(--color-accent-red)]",
                                                      dtData.status ===
                                                        "partial" &&
                                                        "text-[var(--color-accent-amber)]",
                                                      dtData.status ===
                                                        "complete" &&
                                                        "text-[var(--color-accent-green)]",
                                                    )}
                                                  >
                                                    {dtName}
                                                  </span>
                                                  <span
                                                    className={cn(
                                                      "ml-1 font-mono",
                                                      dtData.status ===
                                                        "missing" &&
                                                        "text-[var(--color-accent-red)]",
                                                      dtData.status ===
                                                        "partial" &&
                                                        "text-[var(--color-accent-amber)]",
                                                      dtData.status ===
                                                        "complete" &&
                                                        "text-[var(--color-accent-green)]",
                                                    )}
                                                  >
                                                    {dtData.completion_pct}%
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          </details>
                                        )}
                                      {/* Available dates breakdown if available (green) */}
                                      {subData.dates_found_count &&
                                        subData.dates_found_count > 0 && (
                                          <details className="mt-1">
                                            <summary className="text-[9px] text-[var(--color-accent-green)] cursor-pointer hover:underline">
                                              {subData.dates_found_count}{" "}
                                              available days
                                            </summary>
                                            <div className="mt-1 pl-1 border-l border-[var(--color-status-success-border-strong)]">
                                              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                                                {subData.dates_found_list?.map(
                                                  (date: string) => (
                                                    <span
                                                      key={date}
                                                      className="text-[8px] font-mono px-1 py-0.5 rounded bg-[var(--color-status-success-bg)] text-[var(--color-accent-green)]"
                                                    >
                                                      {date}
                                                    </span>
                                                  ),
                                                )}
                                                {subData.dates_found_truncated && (
                                                  <>
                                                    <span className="text-[8px] text-[var(--color-text-muted)]">
                                                      ...
                                                    </span>
                                                    {subData.dates_found_list_tail?.map(
                                                      (date: string) => (
                                                        <span
                                                          key={date}
                                                          className="text-[8px] font-mono px-1 py-0.5 rounded bg-[var(--color-status-success-bg)] text-[var(--color-accent-green)]"
                                                        >
                                                          {date}
                                                        </span>
                                                      ),
                                                    )}
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          </details>
                                        )}
                                      {/* Missing dates breakdown if available (red) */}
                                      {subData.dates_missing_count &&
                                        subData.dates_missing_count > 0 && (
                                          <details className="mt-1">
                                            <summary className="text-[9px] text-[var(--color-accent-red)] cursor-pointer hover:underline">
                                              {subData.dates_missing_count}{" "}
                                              missing days
                                            </summary>
                                            <div className="mt-1 pl-1 border-l border-[var(--color-status-error-border-strong)]">
                                              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                                                {subData.dates_missing_list?.map(
                                                  (date: string) => (
                                                    <span
                                                      key={date}
                                                      className="text-[8px] font-mono px-1 py-0.5 rounded bg-[var(--color-status-error-bg)] text-[var(--color-accent-red)]"
                                                    >
                                                      {date}
                                                    </span>
                                                  ),
                                                )}
                                                {subData.dates_missing_truncated && (
                                                  <>
                                                    <span className="text-[8px] text-[var(--color-text-muted)]">
                                                      ...
                                                    </span>
                                                    {subData.dates_missing_list_tail?.map(
                                                      (date: string) => (
                                                        <span
                                                          key={date}
                                                          className="text-[8px] font-mono px-1 py-0.5 rounded bg-[var(--color-status-error-bg)] text-[var(--color-accent-red)]"
                                                        >
                                                          {date}
                                                        </span>
                                                      ),
                                                    )}
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          </details>
                                        )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            {/* Close venues/data_types/feature_groups bordered container */}
                          </div>
                        )}
                      </div>
                    );
                  },
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Regular Data Status Results */}
      {data && !checkVenues && !checkDataTypes && (
        <>
          {/* Summary Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl font-mono flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Data Coverage
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {startDate} to {endDate}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div
                    className="text-3xl font-mono font-bold"
                    style={{
                      color: getCompletionColor(data.overall_completion),
                    }}
                  >
                    {data.overall_completion.toFixed(1)}%
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {data.overall_complete} / {data.overall_total} files
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Progress bar */}
              <div className="h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${data.overall_completion}%`,
                    backgroundColor: getCompletionColor(
                      data.overall_completion,
                    ),
                  }}
                />
              </div>

              {/* Deploy Missing Button */}
              {totalMissing > 0 && onDeployMissing && (
                <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-[var(--color-status-error-bg)] border border-[var(--color-status-error-border)]">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-[var(--color-accent-red)]" />
                    <span className="text-sm">
                      <strong>{totalMissing}</strong> missing data points
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleOpenDeployMissingModal}
                    className="bg-[var(--color-accent-red)] hover:bg-[var(--color-accent-red)]/80"
                  >
                    <Rocket className="h-4 w-4 mr-2" />
                    Deploy Missing
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calendar View */}
          {viewMode === "calendar" && heatmapData.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Coverage Calendar</CardTitle>
                <CardDescription>
                  Visual overview of data coverage by day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HeatmapCalendar
                  data={heatmapData}
                  startDate={startDate}
                  endDate={endDate}
                  onDateClick={(date) => setSelectedCalendarDate(date)}
                  selectedDate={selectedCalendarDate || undefined}
                />

                {/* Selected Date Details */}
                {selectedCalendarDate && (
                  <div className="mt-4 p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-default)]">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">
                        {new Date(selectedCalendarDate).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCalendarDate(null)}
                        className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] h-auto p-0"
                      >
                        ✕ Close
                      </Button>
                    </div>
                    {heatmapData.find((d) => d.date === selectedCalendarDate)
                      ?.tooltip && (
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {
                          heatmapData.find(
                            (d) => d.date === selectedCalendarDate,
                          )?.tooltip
                        }
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Category Breakdown Table */}
          {viewMode === "table" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-[var(--color-border-subtle)]">
                  {Object.entries(data.categories).map(([catName, catData]) => {
                    const completion = getCategoryCompletion(catData);
                    const missing = getMissingCount(catData);
                    const isExpanded = expandedCategories.has(catName);

                    return (
                      <div key={catName}>
                        {/* Category Row */}
                        <Button
                          variant="ghost"
                          onClick={() => toggleCategory(catName)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--color-bg-secondary)] transition-colors h-auto"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                            )}
                            <span className="font-medium">{catName}</span>
                            <span className="text-xs text-[var(--color-text-muted)]">
                              ({Object.keys(catData.venues).length} venues)
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            {missing > 0 && (
                              <Badge
                                variant="outline"
                                className="bg-[var(--color-status-error-bg)] text-[var(--color-accent-red)] border-[var(--color-status-error-border-strong)]"
                              >
                                {missing} missing
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={getCompletionBadgeClass(completion)}
                            >
                              {completion.toFixed(1)}%
                            </Badge>
                            <div className="w-24 h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                              <div
                                className="h-full transition-all"
                                style={{
                                  width: `${completion}%`,
                                  backgroundColor:
                                    getCompletionColor(completion),
                                }}
                              />
                            </div>
                          </div>
                        </Button>

                        {/* Expanded Venue Table */}
                        {isExpanded && (
                          <div className="bg-[var(--color-bg-secondary)] px-4 py-2">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-xs text-[var(--color-text-muted)]">
                                  <th className="text-left py-2 font-medium">
                                    Venue
                                  </th>
                                  <th className="text-right py-2 font-medium">
                                    Complete
                                  </th>
                                  <th className="text-right py-2 font-medium">
                                    Total
                                  </th>
                                  <th className="text-right py-2 font-medium">
                                    Coverage
                                  </th>
                                  <th className="text-right py-2 font-medium">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                                {Object.entries(catData.venues).map(
                                  ([venueName, venueData]) => {
                                    const venuePct =
                                      venueData.completion_percent;
                                    const venueMissing =
                                      venueData.total - venueData.complete;

                                    return (
                                      <tr
                                        key={venueName}
                                        className="hover:bg-[var(--color-bg-tertiary)]"
                                      >
                                        <td className="py-2 font-mono text-xs">
                                          {venueName}
                                        </td>
                                        <td className="py-2 text-right font-mono">
                                          {venueData.complete}
                                        </td>
                                        <td className="py-2 text-right font-mono text-[var(--color-text-muted)]">
                                          {venueData.total}
                                        </td>
                                        <td className="py-2 text-right">
                                          <span
                                            className="font-mono"
                                            style={{
                                              color:
                                                getCompletionColor(venuePct),
                                            }}
                                          >
                                            {venuePct.toFixed(1)}%
                                          </span>
                                        </td>
                                        <td className="py-2 text-right">
                                          {venueMissing === 0 ? (
                                            <CheckCircle2 className="h-4 w-4 text-[var(--color-accent-green)] inline" />
                                          ) : (
                                            <span className="text-xs text-[var(--color-accent-red)]">
                                              {venueMissing} missing
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  },
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Deploy Missing Modal */}
      <Dialog
        open={deployMissingModalOpen}
        onOpenChange={(open) => { if (!open) setDeployMissingModalOpen(false); }}
      >
        <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Deploy Missing Data</DialogTitle>
        </DialogHeader>
        <div>
          <div className="space-y-4">
            {/* Summary */}
            <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-[var(--color-accent-yellow)]" />
                <span>
                  <strong>{totalMissing}</strong> missing data points
                </span>
              </div>
              <div className="mt-2 text-xs text-[var(--color-text-muted)]">
                Date range: {startDate} to {endDate}
                {firstDayOfMonthOnly && (
                  <span className="ml-2 text-[var(--color-accent-cyan)]">
                    (first day of month only)
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs">
                <span className="text-[var(--color-text-muted)]">
                  Categories:{" "}
                </span>
                <span className="text-[var(--color-accent-cyan)] font-medium">
                  {effectiveDeployCategories.length > 0
                    ? effectiveDeployCategories.join(", ")
                    : "All categories with missing data"}
                </span>
              </div>
              {selectedVenues.length > 0 && (
                <div className="mt-1 text-xs">
                  <span className="text-[var(--color-text-muted)]">
                    Venues:{" "}
                  </span>
                  <span className="text-[var(--color-accent-purple)] font-medium">
                    {selectedVenues.join(", ")}
                  </span>
                </div>
              )}
              {selectedFolders.length > 0 && (
                <div className="mt-1 text-xs">
                  <span className="text-[var(--color-text-muted)]">
                    Instrument Types:{" "}
                  </span>
                  <span className="text-[var(--color-accent-green)] font-medium">
                    {selectedFolders.join(", ")}
                  </span>
                </div>
              )}
              {selectedDataTypes.length > 0 && (
                <div className="mt-1 text-xs">
                  <span className="text-[var(--color-text-muted)]">
                    Data Types:{" "}
                  </span>
                  <span className="text-[var(--color-accent-amber)] font-medium">
                    {selectedDataTypes.join(", ")}
                  </span>
                </div>
              )}
              {selectedCategories.length > 0 &&
                effectiveDeployCategories.length === 0 && (
                  <div className="mt-1 text-xs text-[var(--color-accent-amber)]">
                    ⚠️ Selected categories have no missing data
                  </div>
                )}
            </div>

            {/* Region (with cross-region egress warning) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">Region</Label>
              <Select
                value={deployMissingRegion}
                onValueChange={setDeployMissingRegion}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region..." />
                </SelectTrigger>
                <SelectContent>
                  {[
                    {
                      value: "asia-northeast1",
                      label: "asia-northeast1 (Tokyo)",
                    },
                    {
                      value: "asia-northeast2",
                      label: "asia-northeast2 (Osaka)",
                    },
                    {
                      value: "asia-southeast1",
                      label: "asia-southeast1 (Singapore)",
                    },
                    { value: "us-central1", label: "us-central1 (Iowa)" },
                    { value: "us-east1", label: "us-east1 (South Carolina)" },
                    { value: "us-west1", label: "us-west1 (Oregon)" },
                    { value: "europe-west1", label: "europe-west1 (Belgium)" },
                    { value: "europe-west2", label: "europe-west2 (London)" },
                  ].map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showDeployMissingRegionWarning && (
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-semibold">
                        Cross-Region Egress Warning
                      </p>
                      <p className="mt-1">
                        Selected region ({deployMissingRegion}) differs from
                        configured storage region ({backendRegion}). This will
                        incur significant egress costs.
                      </p>
                      <p className="mt-1 font-medium">
                        Recommendation: Use {backendRegion} to avoid egress
                        charges.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Deployment Mode */}
            <div className="space-y-3">
              <div className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                Deployment Mode
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="deploy-missing-dry-run"
                  checked={deployMissingDryRun}
                  onCheckedChange={(checked) =>
                    setDeployMissingDryRun(checked === true)
                  }
                />
                <Label
                  htmlFor="deploy-missing-dry-run"
                  className="text-sm cursor-pointer"
                >
                  <span className="font-medium">Preview only (dry run)</span>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Show what shards would be deployed without actually
                    deploying
                  </p>
                </Label>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="deploy-missing-force"
                  checked={deployMissingForce}
                  onCheckedChange={(checked) =>
                    setDeployMissingForce(checked === true)
                  }
                />
                <Label
                  htmlFor="deploy-missing-force"
                  className="text-sm cursor-pointer"
                >
                  <span className="font-medium">
                    Force re-process (--force)
                  </span>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Regenerate even if data already exists for the venue/date
                  </p>
                </Label>
              </div>
            </div>

            {/* Date Granularity */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                Date Granularity
              </div>
              <div className="flex gap-2">
                {(["daily", "weekly", "monthly", "none"] as const).map((g) => (
                  <Button
                    key={g}
                    type="button"
                    variant={
                      deployMissingDateGranularity === g ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setDeployMissingDateGranularity(g)}
                  >
                    {g === "none"
                      ? "None (Bulk)"
                      : g.charAt(0).toUpperCase() + g.slice(1)}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                {deployMissingDateGranularity === "daily" &&
                  "One shard per day (most granular, more shards)"}
                {deployMissingDateGranularity === "weekly" &&
                  "One shard per week (balanced)"}
                {deployMissingDateGranularity === "monthly" &&
                  "One shard per month (fewer shards, larger jobs)"}
                {deployMissingDateGranularity === "none" &&
                  "Single shard, no date range — service fetches all data in bulk"}
              </p>
            </div>

            {/* Preview result - shows updated shard count when granularity changes (stays visible in modal) */}
            {(isDeploying || deploymentResult?.dry_run) && (
              <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
                {isDeploying ? (
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    Calculating shards for {deployMissingDateGranularity}{" "}
                    granularity…
                  </div>
                ) : deploymentResult?.dry_run &&
                  deploymentResult.total_shards !== undefined ? (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-[var(--color-accent-green)] shrink-0" />
                    <span>
                      <strong className="font-mono text-[var(--color-accent-cyan)]">
                        {deploymentResult.total_shards.toLocaleString()}
                      </strong>{" "}
                      shards would be deployed
                      {deploymentResult.shards_truncated && (
                        <span className="text-[var(--color-text-muted)]">
                          {" "}
                          (truncated — full list on Deploy tab)
                        </span>
                      )}
                    </span>
                  </div>
                ) : null}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeployMissingModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleConfirmDeployMissing(false)}
                disabled={effectiveDeployCategories.length === 0}
                className={
                  deployMissingDryRun
                    ? "bg-[var(--color-accent-cyan)] hover:bg-[var(--color-accent-cyan)]/80"
                    : "bg-[var(--color-accent-red)] hover:bg-[var(--color-accent-red)]/80"
                }
              >
                <Rocket className="h-4 w-4 mr-2" />
                {deployMissingDryRun ? "Preview Shards" : "Deploy Now"}
              </Button>
            </div>
          </div>
        </div>
        </DialogContent>
      </Dialog>

      {/* File Listing Modal */}
      <Dialog
        open={showFileListing}
        onOpenChange={(open) => { if (!open) setShowFileListing(false); }}
      >
        <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            File Listing
            {fileListingData && (
              <span className="text-sm font-normal text-[var(--color-text-muted)] ml-2">
                {fileListingData.venue} / {fileListingData.folder} /{" "}
                {fileListingData.data_type}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div>
          <div className="max-h-[60vh] overflow-auto">
            {fileListingLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent-cyan)]" />
                <span className="ml-3 text-[var(--color-text-muted)]">
                  Querying GCS for files...
                </span>
              </div>
            ) : fileListingError ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-8 w-8 text-[var(--color-accent-red)] mx-auto mb-2" />
                <p className="text-[var(--color-accent-red)]">
                  {fileListingError}
                </p>
              </div>
            ) : fileListingData ? (
              <div className="space-y-4">
                {/* Summary */}
                <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-[var(--color-text-muted)]">
                        Total Files
                      </div>
                      <div className="font-semibold text-lg">
                        {fileListingData.summary?.total_files.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--color-text-muted)]">
                        Total Size
                      </div>
                      <div className="font-semibold text-lg">
                        {fileListingData.summary?.total_size_formatted}
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--color-text-muted)]">
                        Days with Data
                      </div>
                      <div className="font-semibold text-lg text-[var(--color-accent-green)]">
                        {fileListingData.summary?.dates_with_data}
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--color-text-muted)]">
                        Days Empty
                      </div>
                      <div
                        className={cn(
                          "font-semibold text-lg",
                          (fileListingData.summary?.dates_empty ?? 0) > 0
                            ? "text-[var(--color-accent-orange)]"
                            : "text-[var(--color-text-muted)]",
                        )}
                      >
                        {fileListingData.summary?.dates_empty}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 bg-[var(--color-bg-secondary)] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[var(--color-accent-green)] h-full transition-all"
                        style={{
                          width: `${fileListingData.summary?.completion_pct}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {fileListingData.summary?.completion_pct}%
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">
                    Bucket: {fileListingData.bucket} |{" "}
                    {fileListingData.date_range?.start} to{" "}
                    {fileListingData.date_range?.end} (
                    {fileListingData.date_range?.total_days} days)
                  </p>
                </div>

                {/* Files by Date */}
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-2">
                    Files by Date
                  </h3>
                  <div className="max-h-[300px] overflow-auto border border-[var(--color-border-subtle)] rounded">
                    <table className="w-full text-sm">
                      <thead className="bg-[var(--color-bg-tertiary)] sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">
                            Date
                          </th>
                          <th className="text-right px-3 py-2 font-medium">
                            Files
                          </th>
                          <th className="text-right px-3 py-2 font-medium">
                            Size
                          </th>
                          <th className="text-left px-3 py-2 font-medium">
                            Last modified
                          </th>
                          <th className="text-left px-3 py-2 font-medium">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {fileListingData.by_date?.map((dayResult) => (
                          <tr
                            key={dayResult.date}
                            className={cn(
                              "border-t border-[var(--color-border-subtle)]",
                              dayResult.file_count === 0 &&
                                "bg-[var(--color-accent-red)]/5",
                            )}
                          >
                            <td className="px-3 py-2 font-mono">
                              {dayResult.date}
                            </td>
                            <td className="px-3 py-2 text-right font-mono">
                              {dayResult.file_count}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-[var(--color-text-muted)]">
                              {dayResult.total_size_bytes > 0
                                ? (
                                    dayResult.total_size_bytes /
                                    (1024 * 1024)
                                  ).toFixed(1) + " MB"
                                : "-"}
                            </td>
                            <td className="px-3 py-2 font-mono text-[var(--color-text-muted)] text-xs">
                              {dayResult.last_modified
                                ? new Date(
                                    dayResult.last_modified,
                                  ).toLocaleString(undefined, {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  })
                                : "-"}
                            </td>
                            <td className="px-3 py-2">
                              {dayResult.error ? (
                                <span className="text-[var(--color-accent-red)] text-xs">
                                  {dayResult.error}
                                </span>
                              ) : dayResult.file_count > 0 ? (
                                <span className="text-[var(--color-accent-green)] text-xs flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" /> OK
                                </span>
                              ) : (
                                <span className="text-[var(--color-accent-orange)] text-xs flex items-center gap-1">
                                  <XCircle className="h-3 w-3" /> Empty
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex justify-end pt-4 mt-4 border-t border-[var(--color-border-default)]">
            <Button variant="outline" onClick={() => setShowFileListing(false)}>
              Close
            </Button>
          </div>
        </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Exported wrapper component that delegates to specialized components
export function DataStatusTab({
  serviceName,
  deploymentResult,
  isDeploying,
  onDeployMissing,
}: DataStatusTabProps) {
  // Use specialized component for execution-services (different data model)
  if (serviceName === "execution-services") {
    return <ExecutionDataStatus serviceName={serviceName} />;
  }

  // Use standard data status for all other services
  return (
    <DataStatusTabInternal
      serviceName={serviceName}
      deploymentResult={deploymentResult}
      isDeploying={isDeploying}
      onDeployMissing={onDeployMissing}
    />
  );
}
