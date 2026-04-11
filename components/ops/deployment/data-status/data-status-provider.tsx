"use client";
import { useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from "react";
import * as api from "@/hooks/deployment/_api-stub";
import type { VenueCheckResponse, DataTypeCheckResponse, TurboDataStatusResponse } from "@/hooks/deployment/_api-stub";
import type { CategoryVenuesResponse } from "@/lib/types/deployment";
import { UPSTREAM_CHECK_SERVICES } from "@/hooks/deployment/_api-stub";
import type { DataStatusResponse, CategoryStatus } from "@/lib/types/deployment";
import type { DataStatusTabProps } from "./types";
import { buildHeatmapDayEntries } from "./build-heatmap-data";
import { getCategoryCompletion, getMissingCount } from "./category-metrics";
import { DataStatusTabCtx, type DataStatusTabContextValue } from "./data-status-context";

const DEFAULT_CATEGORY_FALLBACK: Record<string, string[]> = {
  "features-sports-service": ["SPORTS"],
  "features-onchain-service": ["DEFI"],
  "features-delta-one-service": ["TRADFI", "CEFI"],
  "market-tick-data-service": ["CEFI", "TRADFI", "DEFI", "SPORTS", "PREDICTION"],
  "market-data-processing-service": ["CEFI", "TRADFI", "DEFI", "SPORTS", "PREDICTION"],
};

export function DataStatusProvider({ children, ...props }: DataStatusTabProps & { children: ReactNode }) {
  const { serviceName, deploymentResult, isDeploying, onDeployMissing } = props;
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
  const [dataStatusMode, setDataStatusMode] = useState<"batch" | "live">("batch");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([]);
  const [availableVenues, setAvailableVenues] = useState<string[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>(["CEFI", "DEFI", "TRADFI"]); // Default to all
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [venueAvailableFolders, setVenueAvailableFolders] = useState<string[]>([]);
  const [venueAvailableDataTypes, setVenueAvailableDataTypes] = useState<string[]>([]);
  const [venueFiltersLoading, setVenueFiltersLoading] = useState(false);
  const [fileListingData, setFileListingData] = useState<api.ListFilesResponse | null>(null);
  const [fileListingLoading, setFileListingLoading] = useState(false);
  const [fileListingError, setFileListingError] = useState<string | null>(null);
  const [showFileListing, setShowFileListing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("1m");
  const availableTimeframes = ["15s", "1m", "5m", "15m", "1h", "4h", "24h"];
  const [data, setData] = useState<DataStatusResponse | null>(null);
  const [turboData, setTurboData] = useState<TurboDataStatusResponse | null>(null);
  const [venueCheckData, setVenueCheckData] = useState<VenueCheckResponse | null>(null);
  const [dataTypeCheckData, setDataTypeCheckData] = useState<DataTypeCheckResponse | null>(null);
  const checkVenues = false; // Removed toggle, turbo mode always gives venue breakdown
  const checkDataTypes = false;
  const useTurboMode = api.TURBO_MODE_SERVICES.includes(serviceName) && !checkVenues && !checkDataTypes;
  const turboSubDimension = api.TURBO_SUB_DIMENSION_SERVICES[serviceName];
  const [loading, setLoading] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [expandedVenues, setExpandedVenues] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [deployMissingModalOpen, setDeployMissingModalOpen] = useState(false);
  const [deployMissingForce, setDeployMissingForce] = useState(true);
  const [deployMissingDryRun, setDeployMissingDryRun] = useState(true); // Default to preview mode
  const [deployMissingDateGranularity, setDeployMissingDateGranularity] = useState<
    "daily" | "weekly" | "monthly" | "none"
  >("daily");
  const [deployMissingRegion, setDeployMissingRegion] = useState<string>("asia-northeast1");
  const [backendRegion, setBackendRegion] = useState<string>("asia-northeast1");
  const [showDeployMissingRegionWarning, setShowDeployMissingRegionWarning] = useState<boolean>(false);
  useEffect(() => {
    fetch("/api/config/region")
      .then((r) => r.json())
      .then((data) => {
        const region = data.storage_region ?? data.gcs_region ?? "asia-northeast1";
        setBackendRegion(region);
        setDeployMissingRegion(region);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    setShowDeployMissingRegionWarning(deployMissingRegion !== backendRegion);
  }, [deployMissingRegion, backendRegion]);
  const [firstDayOfMonthOnly, setFirstDayOfMonthOnly] = useState(false);
  const [requireFreshness, setRequireFreshness] = useState(false);
  const [freshnessDate, setFreshnessDate] = useState("");
  const [instrumentSearchMode, setInstrumentSearchMode] = useState(false);
  const [instrumentSearchQuery, setInstrumentSearchQuery] = useState("");
  const [instrumentSearchResults, setInstrumentSearchResults] = useState<api.InstrumentSearchResult[]>([]);
  const [instrumentSearchLoading, setInstrumentSearchLoading] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<api.InstrumentSearchResult | null>(null);
  const [instrumentAvailability, setInstrumentAvailability] = useState<api.InstrumentAvailabilityResponse | null>(null);
  const [instrumentAvailabilityLoading, setInstrumentAvailabilityLoading] = useState(false);
  const [instrumentAvailabilityError, setInstrumentAvailabilityError] = useState<string | null>(null);
  const [showInstrumentDropdown, setShowInstrumentDropdown] = useState(false);
  const supportsVenueCheck = false;
  const supportsDataTypeCheck = false;
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cancelQuery = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setError(null);
  }, []);
  const fetchData = useCallback(
    async (fetchStart: string, fetchEnd: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      const thisRequestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);
      setData(null);
      setTurboData(null);
      setVenueCheckData(null);
      setDataTypeCheckData(null);
      try {
        if (checkVenues && supportsVenueCheck) {
          const result = (await api.getDataStatus({
            service: serviceName,
            start_date: fetchStart,
            end_date: fetchEnd,
            category: selectedCategories.length > 0 ? selectedCategories : undefined,
            check_venues: true,
            force_refresh: false, // Use cache for speed
          })) as unknown as VenueCheckResponse;
          if (thisRequestId !== requestIdRef.current) return;
          if (result.start_date !== fetchStart || result.end_date !== fetchEnd) {
            setError(
              `Backend returned wrong dates! Requested ${fetchStart}-${fetchEnd}, got ${result.start_date}-${result.end_date}`,
            );
            return;
          }
          setVenueCheckData(result);
        } else if (checkDataTypes && supportsDataTypeCheck) {
          const result = (await api.getDataStatus({
            service: serviceName,
            start_date: fetchStart,
            end_date: fetchEnd,
            category: selectedCategories.length > 0 ? selectedCategories : ["TRADFI"], // Default to TRADFI for data type check
            check_data_types: true,
            force_refresh: false, // Use cache for speed
          })) as unknown as DataTypeCheckResponse;
          if (thisRequestId !== requestIdRef.current) return;
          setDataTypeCheckData(result);
        } else if (useTurboMode) {
          const includeSubDims = !!turboSubDimension;
          const checkUpstream = UPSTREAM_CHECK_SERVICES.includes(serviceName);
          const venueFilter = selectedVenues.length > 0 ? selectedVenues : undefined;
          const folderFilter = selectedFolders.length > 0 ? selectedFolders : undefined;
          const dataTypeFilter = selectedDataTypes.length > 0 ? selectedDataTypes : undefined;
          const result = await api.getDataStatusTurbo({
            service: serviceName,
            start_date: fetchStart,
            end_date: fetchEnd,
            mode: dataStatusMode,
            category: selectedCategories.length > 0 ? selectedCategories : undefined,
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
          if (thisRequestId !== requestIdRef.current) return;
          if (result.date_range?.start !== fetchStart || result.date_range?.end !== fetchEnd) {
            setError(
              `Date mismatch: requested ${fetchStart} to ${fetchEnd}, but received ${result.date_range?.start} to ${result.date_range?.end}. This may indicate a bug - please report this.`,
            );
            return;
          }
          setTurboData(result);
        } else {
          const result = (await api.getDataStatus({
            service: serviceName,
            start_date: fetchStart,
            end_date: fetchEnd,
            category: selectedCategories.length > 0 ? selectedCategories : undefined,
            force_refresh: false, // Use cache (5-min TTL) for speed
          })) as DataStatusResponse;
          if (thisRequestId !== requestIdRef.current) return;
          if (result.start_date !== fetchStart || result.end_date !== fetchEnd) {
          }
          setData(result);
        }
      } catch (err) {
        if (thisRequestId === requestIdRef.current) {
          if (err instanceof Error && (err.name === "AbortError" || err.message === "Request was cancelled")) {
            return;
          }
          setError(err instanceof Error ? err.message : "Failed to fetch data status");
        }
      } finally {
        if (thisRequestId === requestIdRef.current) {
          setLoading(false);
        }
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
  const handleClearDataStatusCache = useCallback(async () => {
    setClearingCache(true);
    try {
      await api.clearDataStatusCache();
      await fetchData(startDate, endDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear cache");
    } finally {
      setClearingCache(false);
    }
  }, [startDate, endDate, fetchData]);
  const fetchFileListing = useCallback(async () => {
    if (
      selectedCategories.length !== 1 ||
      selectedVenues.length !== 1 ||
      selectedFolders.length !== 1 ||
      selectedDataTypes.length !== 1
    ) {
      setFileListingError("Please select exactly one category, venue, folder, and data type");
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
        timeframe: serviceName === "market-data-processing-service" ? selectedTimeframe : undefined,
      });
      if (result.error) {
        setFileListingError(result.error);
        setFileListingData(null);
      } else {
        setFileListingData(result);
      }
    } catch (err) {
      setFileListingError(err instanceof Error ? err.message : "Failed to fetch file listing");
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
  const searchInstrumentsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const instrumentSearchCacheRef = useRef<Map<string, api.InstrumentSearchResult[]>>(new Map());
  const fetchInstruments = useCallback(
    async (searchQuery: string) => {
      if (selectedCategories.length !== 1) {
        setInstrumentSearchResults([]);
        return;
      }
      const normalizedQuery = searchQuery.trim().toLowerCase();
      const category = selectedCategories[0];
      const venue = selectedVenues.length === 1 ? selectedVenues[0] : undefined;
      const instrumentType = selectedFolders.length === 1 ? selectedFolders[0] : undefined;
      const cacheKey = `${category}|${venue ?? "*"}|${instrumentType ?? "*"}|${normalizedQuery}`;

      const cached = instrumentSearchCacheRef.current.get(cacheKey);
      if (cached) {
        setInstrumentSearchResults(cached);
        if (!selectedInstrument) {
          setShowInstrumentDropdown(cached.length > 0);
        }
        return;
      }

      if (searchInstrumentsDebounceRef.current) {
        clearTimeout(searchInstrumentsDebounceRef.current);
      }
      searchInstrumentsDebounceRef.current = setTimeout(async () => {
        setInstrumentSearchLoading(true);
        try {
          const result = await api.getInstrumentsList({
            category,
            venue,
            instrument_type: instrumentType,
            search: searchQuery || undefined,
            limit: 500,
          });
          if (result.error) {
            setInstrumentSearchResults([]);
          } else {
            setInstrumentSearchResults(result.instruments);
            instrumentSearchCacheRef.current.set(cacheKey, result.instruments);
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
    [selectedCategories, selectedVenues, selectedFolders, selectedInstrument],
  );
  const fetchInstrumentAvailability = useCallback(async () => {
    if (!selectedInstrument) return;
    if (!selectedInstrument.venue || !selectedInstrument.instrument_type) {
      setInstrumentAvailabilityError("Selected instrument is missing venue or instrument type");
      setInstrumentAvailability(null);
      return;
    }
    setInstrumentAvailabilityLoading(true);
    setInstrumentAvailabilityError(null);
    try {
      const result = await api.getInstrumentAvailability({
        venue: selectedInstrument.venue,
        instrument_type: selectedInstrument.instrument_type,
        instrument: selectedInstrument.instrument_key || selectedInstrument.symbol,
        start_date: startDate,
        end_date: endDate,
        data_type: selectedDataTypes.length === 1 ? selectedDataTypes[0] : undefined,
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
      setInstrumentAvailabilityError(err instanceof Error ? err.message : "Failed to check availability");
      setInstrumentAvailability(null);
    } finally {
      setInstrumentAvailabilityLoading(false);
    }
  }, [selectedInstrument, startDate, endDate, selectedDataTypes, firstDayOfMonthOnly, serviceName, selectedTimeframe]);
  useEffect(() => {
    if (!instrumentSearchMode) {
      setInstrumentSearchQuery("");
      setInstrumentSearchResults([]);
      setSelectedInstrument(null);
      setInstrumentAvailability(null);
      setInstrumentAvailabilityError(null);
      instrumentSearchCacheRef.current.clear();
    }
  }, [instrumentSearchMode, selectedCategories]);
  useEffect(() => {
    setCategoriesLoading(true);
    api
      .getServiceCategories(serviceName)
      .then((response) => {
        if (response.categories && response.categories.length > 0) {
          setAvailableCategories(response.categories);
          setSelectedCategories((prev) => prev.filter((cat) => response.categories.includes(cat)));
        } else {
          setAvailableCategories(DEFAULT_CATEGORY_FALLBACK[serviceName] ?? ["CEFI", "DEFI", "TRADFI"]);
        }
      })
      .catch(() => {
        setAvailableCategories(DEFAULT_CATEGORY_FALLBACK[serviceName] ?? ["CEFI", "DEFI", "TRADFI"]);
      })
      .finally(() => {
        setCategoriesLoading(false);
      });
  }, [serviceName]);
  useEffect(() => {
    setData(null);
    setTurboData(null);
    setVenueCheckData(null);
    setDataTypeCheckData(null);
    setError(null);
    setSelectedCategories([]);
    setSelectedVenues([]);
    setAvailableVenues([]);
    setSelectedFolders([]);
    setSelectedDataTypes([]);
    setVenueAvailableFolders([]);
    setVenueAvailableDataTypes([]);
  }, [serviceName]);
  useEffect(() => {
    setSelectedVenues([]);
    setAvailableVenues([]);
    setSelectedFolders([]);
    setSelectedDataTypes([]);
    setVenueAvailableFolders([]);
    setVenueAvailableDataTypes([]);
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
  useEffect(() => {
    setSelectedFolders([]);
    setSelectedDataTypes([]);
    setVenueAvailableFolders([]);
    setVenueAvailableDataTypes([]);
    if (selectedVenues.length !== 1 || selectedCategories.length !== 1) {
      return;
    }
    const category = selectedCategories[0];
    const venue = selectedVenues[0];
    setVenueFiltersLoading(true);
    api
      .getVenueFilters({ service: serviceName, category, venue })
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

  useEffect(() => {
    if (!instrumentSearchMode || selectedCategories.length !== 1 || selectedVenues.length !== 1) {
      return;
    }
    if (instrumentSearchQuery.trim().length > 0) {
      return;
    }
    void fetchInstruments("");
  }, [instrumentSearchMode, selectedCategories, selectedVenues, instrumentSearchQuery, fetchInstruments]);
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
  const totalMissing = useMemo(() => {
    if (turboData) {
      return turboData.total_missing || 0;
    }
    if (data) {
      return Object.values(data.categories).reduce((sum, cat) => sum + getMissingCount(cat), 0);
    }
    return 0;
  }, [data, turboData]);
  const categoriesWithMissing = useMemo(() => {
    if (turboData) {
      return Object.entries(turboData.categories)
        .filter(([_, catData]) => {
          if ((catData.dates_missing || 0) > 0) return true;
          const expectedButMissing = catData.venue_summary?.expected_but_missing || [];
          if (expectedButMissing.length > 0) return true;
          if (catData.venues) {
            for (const [_, venueData] of Object.entries(catData.venues)) {
              const venueExpected =
                venueData._dim_weighted_expected ?? venueData.dates_expected_venue ?? venueData.dates_expected ?? 0;
              const venueFound = venueData._dim_weighted_found ?? venueData.dates_found ?? 0;
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
  const handleOpenDeployMissingModal = () => {
    if (!onDeployMissing || totalMissing === 0) return;
    setDeployMissingModalOpen(true);
  };
  const effectiveDeployCategories = useMemo(() => {
    if (selectedCategories.length > 0) {
      return selectedCategories.filter((cat) => categoriesWithMissing.includes(cat));
    }
    return categoriesWithMissing;
  }, [selectedCategories, categoriesWithMissing]);
  const handleConfirmDeployMissing = useCallback(
    (previewRefreshOnly = false) => {
      if (!onDeployMissing) return;
      if (effectiveDeployCategories.length === 0) {
        if (!previewRefreshOnly) setDeployMissingModalOpen(false);
        return;
      }
      onDeployMissing({
        service: serviceName,
        start_date: startDate,
        end_date: endDate,
        mode: dataStatusMode,
        region: deployMissingRegion,
        categories: effectiveDeployCategories, // ALWAYS pass explicit categories, never undefined
        venues: selectedVenues.length > 0 ? selectedVenues : undefined, // Pass venue filter if selected
        folders: selectedFolders.length > 0 ? selectedFolders : undefined, // Pass folder/instrument type filter
        data_types: selectedDataTypes.length > 0 ? selectedDataTypes : undefined, // Pass data type filter
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
  useEffect(() => {
    if (deployMissingModalOpen && deployMissingDryRun && effectiveDeployCategories.length > 0) {
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
  const handleInstrumentDeployMissing = useCallback(() => {
    if (!onDeployMissing || !selectedInstrument || !instrumentAvailability) return;
    const dataTypesWithMissing = Object.entries(instrumentAvailability.by_data_type ?? {})
      .filter(([, stats]) => stats.dates_missing > 0)
      .map(([dataType]) => dataType);
    if (dataTypesWithMissing.length === 0) return;
    const venue = selectedInstrument.venue ?? "";
    const folder = selectedInstrument.instrument_type ?? "";
    const effectiveStart = instrumentAvailability.availability_window?.effective_start || startDate;
    const effectiveEnd = instrumentAvailability.availability_window?.effective_end || endDate;
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
  const heatmapData = useMemo(
    () => buildHeatmapDayEntries(startDate, endDate, data, venueCheckData),
    [data, venueCheckData, startDate, endDate],
  );
  const value: DataStatusTabContextValue = {
    serviceName,
    deploymentResult,
    isDeploying,
    onDeployMissing,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    dataStatusMode,
    setDataStatusMode,
    selectedCategories,
    setSelectedCategories,
    selectedVenues,
    setSelectedVenues,
    selectedFolders,
    setSelectedFolders,
    selectedDataTypes,
    setSelectedDataTypes,
    availableVenues,
    setAvailableVenues,
    venuesLoading,
    setVenuesLoading,
    availableCategories,
    setAvailableCategories,
    categoriesLoading,
    setCategoriesLoading,
    venueAvailableFolders,
    setVenueAvailableFolders,
    venueAvailableDataTypes,
    setVenueAvailableDataTypes,
    venueFiltersLoading,
    setVenueFiltersLoading,
    fileListingData,
    setFileListingData,
    fileListingLoading,
    setFileListingLoading,
    fileListingError,
    setFileListingError,
    showFileListing,
    setShowFileListing,
    selectedTimeframe,
    setSelectedTimeframe,
    availableTimeframes,
    data,
    setData,
    turboData,
    setTurboData,
    venueCheckData,
    setVenueCheckData,
    dataTypeCheckData,
    setDataTypeCheckData,
    checkVenues,
    checkDataTypes,
    useTurboMode,
    turboSubDimension,
    loading,
    setLoading,
    clearingCache,
    setClearingCache,
    error,
    setError,
    expandedCategories,
    setExpandedCategories,
    expandedDates,
    setExpandedDates,
    expandedVenues,
    setExpandedVenues,
    viewMode,
    setViewMode,
    selectedCalendarDate,
    setSelectedCalendarDate,
    deployMissingModalOpen,
    setDeployMissingModalOpen,
    deployMissingForce,
    setDeployMissingForce,
    deployMissingDryRun,
    setDeployMissingDryRun,
    deployMissingDateGranularity,
    setDeployMissingDateGranularity,
    deployMissingRegion,
    setDeployMissingRegion,
    backendRegion,
    setBackendRegion,
    showDeployMissingRegionWarning,
    setShowDeployMissingRegionWarning,
    firstDayOfMonthOnly,
    setFirstDayOfMonthOnly,
    requireFreshness,
    setRequireFreshness,
    freshnessDate,
    setFreshnessDate,
    instrumentSearchMode,
    setInstrumentSearchMode,
    instrumentSearchQuery,
    setInstrumentSearchQuery,
    instrumentSearchResults,
    setInstrumentSearchResults,
    instrumentSearchLoading,
    setInstrumentSearchLoading,
    selectedInstrument,
    setSelectedInstrument,
    instrumentAvailability,
    setInstrumentAvailability,
    instrumentAvailabilityLoading,
    setInstrumentAvailabilityLoading,
    instrumentAvailabilityError,
    setInstrumentAvailabilityError,
    showInstrumentDropdown,
    setShowInstrumentDropdown,
    supportsVenueCheck,
    supportsDataTypeCheck,
    requestIdRef,
    abortControllerRef,
    cancelQuery,
    fetchData,
    handleClearDataStatusCache,
    fetchFileListing,
    searchInstrumentsDebounceRef,
    fetchInstruments,
    fetchInstrumentAvailability,
    toggleVenue,
    toggleDate,
    toggleCategory,
    totalMissing,
    categoriesWithMissing,
    handleOpenDeployMissingModal,
    effectiveDeployCategories,
    handleConfirmDeployMissing,
    handleInstrumentDeployMissing,
    heatmapData,
    getCategoryCompletion,
    getMissingCount,
  };
  return <DataStatusTabCtx.Provider value={value}>{children}</DataStatusTabCtx.Provider>;
}
