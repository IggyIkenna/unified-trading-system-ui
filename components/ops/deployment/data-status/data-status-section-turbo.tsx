"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TurboVenueData } from "@/hooks/deployment/_api-stub";
import { cn } from "@/lib/utils";
import { CheckCircle2, Database, Rocket, XCircle } from "lucide-react";
import { getCompletionColor } from "./category-metrics";
import { useDataStatusTabCtx } from "./data-status-context";
import { formatPercent } from "@/lib/utils/formatters";

export function DataStatusSectionTurbo() {
  const {
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
    searchInstrumentsDebounceRef,
    cancelQuery,
    fetchData,
    handleClearDataStatusCache,
    fetchFileListing,
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
  } = useDataStatusTabCtx();

  return (
    <>
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
                    {turboData.date_range?.start} to {turboData.date_range?.end} ({turboData.date_range?.days} days)
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div
                    className="text-3xl font-mono font-bold"
                    style={{
                      color: getCompletionColor(turboData.overall_completion_pct ?? 0),
                    }}
                  >
                    {formatPercent(turboData.overall_completion_pct ?? 0, 1)}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {turboData.overall_dates_found} / {turboData.overall_dates_expected} venue-days
                  </div>
                  {turboData.overall_dates_found_category !== undefined && (
                    <div className="text-xs text-[var(--color-text-muted)] opacity-70">
                      ({turboData.overall_dates_found_category} / {turboData.overall_dates_expected_category} dates)
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
                    backgroundColor: getCompletionColor(turboData.overall_completion_pct ?? 0),
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
                  <span className="text-sm text-[var(--color-accent-green)]">All expected data present</span>
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
                {Object.entries(turboData.categories).map(([catName, catData]) => {
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
                            <span className="text-sm text-[var(--color-accent-red)]">{catData.error}</span>
                          ) : (
                            <>
                              <span className="text-sm text-[var(--color-text-muted)]">
                                {catData.venue_dates_found ?? catData.dates_found} /{" "}
                                {catData.venue_dates_expected ?? catData.dates_expected}{" "}
                                {catData.venue_weighted ? "venue-days" : "dates"}
                              </span>
                              <span
                                className="text-sm font-mono font-medium"
                                style={{
                                  color: getCompletionColor(catData.completion_pct ?? 0),
                                }}
                              >
                                {formatPercent(catData.completion_pct ?? 0, 1)}
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
                              backgroundColor: getCompletionColor(catData.completion_pct ?? 0),
                            }}
                          />
                        </div>
                      )}
                      {(catData.dates_missing ?? 0) > 0 && !catData.error && !catData.bulk_service && (
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {catData.dates_missing} date
                          {catData.dates_missing !== 1 ? "s" : ""} missing
                          {Array.isArray(catData.missing_dates) && catData.missing_dates.length > 0 && (
                            <span className="ml-1">
                              (e.g., {catData.missing_dates.slice(0, 3).join(", ")}
                              {catData.missing_dates.length > 3 ? "..." : ""})
                            </span>
                          )}
                        </p>
                      )}
                      {catData.bulk_service && (
                        <p className="text-xs text-[var(--color-text-muted)] italic">
                          Bulk download service — {catData.dates_found} of {catData.dates_expected} dates have data.
                          {(catData.dates_missing ?? 0) > 0 && " Run the service to populate all dates."}
                        </p>
                      )}

                      {/* Category-level date dropdowns (for services without sub-dimensions) */}
                      {!catData.venues && !catData.data_types && !catData.feature_groups && !catData.error && (
                        <div className="flex gap-4 mt-2">
                          {/* Available dates dropdown (green) */}
                          {catData.dates_found_count && catData.dates_found_count > 0 && (
                            <details className="flex-1">
                              <summary className="text-xs text-[var(--color-accent-green)] cursor-pointer hover:underline">
                                {catData.dates_found_count} available days
                              </summary>
                              <div className="mt-1 pl-2 border-l-2 border-[var(--color-status-success-border-strong)]">
                                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                                  {catData.dates_found_list?.map((date: string) => (
                                    <span
                                      key={date}
                                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-status-success-bg)] text-[var(--color-accent-green)]"
                                    >
                                      {date}
                                    </span>
                                  ))}
                                  {catData.dates_found_truncated && (
                                    <>
                                      <span className="text-[9px] text-[var(--color-text-muted)]">...</span>
                                      {catData.dates_found_list_tail?.map((date: string) => (
                                        <span
                                          key={date}
                                          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-status-success-bg)] text-[var(--color-accent-green)]"
                                        >
                                          {date}
                                        </span>
                                      ))}
                                    </>
                                  )}
                                </div>
                              </div>
                            </details>
                          )}
                          {/* Missing dates dropdown (red) */}
                          {catData.dates_missing_count && catData.dates_missing_count > 0 && (
                            <details className="flex-1">
                              <summary className="text-xs text-[var(--color-accent-red)] cursor-pointer hover:underline">
                                {catData.dates_missing_count} missing days
                              </summary>
                              <div className="mt-1 pl-2 border-l-2 border-[var(--color-status-error-border-strong)]">
                                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                                  {catData.dates_missing_list?.map((date: string) => (
                                    <span
                                      key={date}
                                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-status-error-bg)] text-[var(--color-accent-red)]"
                                    >
                                      {date}
                                    </span>
                                  ))}
                                  {catData.dates_missing_truncated && (
                                    <>
                                      <span className="text-[9px] text-[var(--color-text-muted)]">...</span>
                                      {catData.dates_missing_list_tail?.map((date: string) => (
                                        <span
                                          key={date}
                                          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-status-error-bg)] text-[var(--color-accent-red)]"
                                        >
                                          {date}
                                        </span>
                                      ))}
                                    </>
                                  )}
                                </div>
                              </div>
                            </details>
                          )}
                        </div>
                      )}

                      {/* Sub-dimension breakdown (venues, data_types, feature_groups) */}
                      {(catData.venues || catData.data_types || catData.feature_groups) && (
                        <div className="mt-3 pl-6 space-y-3 border-l-2 border-[var(--color-border)]">
                          {/* Folders/Instrument Types section - own bordered container */}
                          {catData.folders && Object.keys(catData.folders).length > 0 && (
                            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
                              <p className="text-xs text-[var(--color-text-muted)] font-medium uppercase tracking-wide mb-2">
                                Instrument Types (Folders)
                              </p>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {Object.entries(catData.folders).map(([folderName, folderData]) => (
                                  <div key={folderName} className="bg-[var(--color-bg-tertiary)] rounded p-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-mono truncate" title={folderName}>
                                        {folderName}
                                      </span>
                                      <span
                                        className="text-xs font-mono font-medium ml-1"
                                        style={{
                                          color: getCompletionColor(folderData.completion_pct ?? 0),
                                        }}
                                      >
                                        {formatPercent(folderData.completion_pct ?? 0, 0)}
                                      </span>
                                    </div>
                                    <div className="h-1.5 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden mt-1">
                                      <div
                                        className="h-full"
                                        style={{
                                          width: `${folderData.completion_pct ?? 0}%`,
                                          backgroundColor: getCompletionColor(folderData.completion_pct ?? 0),
                                        }}
                                      />
                                    </div>
                                    <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                                      {folderData.dates_found}/{folderData.dates_expected} days
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Venues / Data Types / Feature Groups section - own bordered container */}
                          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs text-[var(--color-text-muted)] font-medium uppercase tracking-wide">
                                {catData.sub_dimension_label ??
                                  (catData.venues
                                    ? "Venues"
                                    : catData.data_types
                                      ? "Data Types"
                                      : "Feature Groups")}
                              </p>
                              {/* Venue Summary Badges */}
                              {catData.venue_summary && (
                                <div className="flex items-center gap-2 text-xs">
                                  {catData.venue_summary.expected_coverage_pct === 100 ? (
                                    <Badge
                                      variant="outline"
                                      className="bg-[var(--color-status-success-bg)] text-[var(--color-accent-green)] border-[var(--color-status-success-border-strong)]"
                                    >
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      All {catData.venue_summary.expected_count} expected
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="bg-[var(--color-status-error-bg)] text-[var(--color-accent-red)] border-[var(--color-status-error-border-strong)] cursor-help"
                                      title={`Missing: ${catData.venue_summary.expected_but_missing?.join(", ")}`}
                                    >
                                      <XCircle className="h-3 w-3 mr-1" />
                                      {catData.venue_summary.expected_but_missing?.length ?? 0} expected missing
                                    </Badge>
                                  )}
                                  {(catData.venue_summary.unexpected_but_found?.length ?? 0) > 0 && (
                                    <Badge
                                      variant="outline"
                                      className="bg-[var(--color-status-warning-bg)] text-[var(--color-accent-amber)] border-[var(--color-status-warning-border)]"
                                    >
                                      +{catData.venue_summary.unexpected_but_found?.length ?? 0} bonus
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            {/* Show missing venues inline */}
                            {catData.venue_summary && (catData.venue_summary.expected_but_missing?.length ?? 0) > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">
                                  Missing:
                                </span>
                                {(catData.venue_summary.expected_but_missing ?? []).map((venue: string) => (
                                  <span
                                    key={venue}
                                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-status-error-bg-alt)] text-[var(--color-accent-red)] border border-[var(--color-status-error-border-strong)]"
                                  >
                                    {venue}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                              {Object.entries(
                                (catData.venues || catData.data_types || catData.feature_groups || {}) as Record<
                                  string,
                                  TurboVenueData
                                >,
                              ).map(([name, subData]) => {
                                // Use dimension-weighted counts when available (accounts for
                                // multiple expected data_types/folders per venue). Falls back
                                // to raw venue dates for services without sub-dimensions.
                                const hasDimWeighting = subData._dim_weighted_found !== undefined;
                                const effectiveFound = hasDimWeighting
                                  ? subData._dim_weighted_found
                                  : subData.dates_found;
                                const effectiveExpected = hasDimWeighting
                                  ? subData._dim_weighted_expected
                                  : subData.dates_expected_venue || subData.dates_expected;
                                const expectedDates = subData.dates_expected_venue || subData.dates_expected;
                                const venueStartDate = subData.venue_start_date;

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
                                        <span className="text-xs font-mono truncate" title={name}>
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
                                          color: getCompletionColor(subData.completion_pct ?? 0),
                                        }}
                                      >
                                        {formatPercent(subData.completion_pct ?? 0, 0)}
                                      </span>
                                    </div>
                                    {/* Progress bar with expected vs actual visualization */}
                                    <div className="h-1.5 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden mt-1 relative">
                                      <div
                                        className="h-full absolute left-0 top-0"
                                        style={{
                                          width: `${subData.completion_pct ?? 0}%`,
                                          backgroundColor: getCompletionColor(subData.completion_pct ?? 0),
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
                                          from {venueStartDate.substring(0, 7)}
                                        </span>
                                      )}
                                    </div>
                                    {/* Data types breakdown if available */}
                                    {subData.data_types && Object.keys(subData.data_types).length > 0 && (
                                      <details className="mt-1">
                                        <summary className="text-[9px] text-[var(--color-accent-cyan)] cursor-pointer hover:underline">
                                          {Object.keys(subData.data_types).length} data types
                                        </summary>
                                        <div className="mt-1 space-y-0.5 pl-1 border-l border-[var(--color-border-subtle)]">
                                          {Object.entries(subData.data_types!).map(
                                            ([dtName, dtData]: [
                                              string,
                                              {
                                                dates_found?: number;
                                                dates_expected?: number;
                                                completion_pct?: number;
                                                status?: string;
                                              },
                                            ]) => (
                                              <div
                                                key={dtName}
                                                className="flex items-center justify-between text-[9px]"
                                              >
                                                <span
                                                  className={cn(
                                                    "truncate",
                                                    dtData.status === "missing" && "text-[var(--color-accent-red)]",
                                                    dtData.status === "partial" && "text-[var(--color-accent-amber)]",
                                                    dtData.status === "complete" && "text-[var(--color-accent-green)]",
                                                  )}
                                                >
                                                  {dtName}
                                                </span>
                                                <span
                                                  className={cn(
                                                    "ml-1 font-mono",
                                                    dtData.status === "missing" && "text-[var(--color-accent-red)]",
                                                    dtData.status === "partial" && "text-[var(--color-accent-amber)]",
                                                    dtData.status === "complete" && "text-[var(--color-accent-green)]",
                                                  )}
                                                >
                                                  {dtData.completion_pct}%
                                                </span>
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      </details>
                                    )}
                                    {/* Available dates breakdown if available (green) */}
                                    {subData.dates_found_count && subData.dates_found_count > 0 && (
                                      <details className="mt-1">
                                        <summary className="text-[9px] text-[var(--color-accent-green)] cursor-pointer hover:underline">
                                          {subData.dates_found_count} available days
                                        </summary>
                                        <div className="mt-1 pl-1 border-l border-[var(--color-status-success-border-strong)]">
                                          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                                            {subData.dates_found_list?.map((date: string) => (
                                              <span
                                                key={date}
                                                className="text-[8px] font-mono px-1 py-0.5 rounded bg-[var(--color-status-success-bg)] text-[var(--color-accent-green)]"
                                              >
                                                {date}
                                              </span>
                                            ))}
                                            {subData.dates_found_truncated && (
                                              <>
                                                <span className="text-[8px] text-[var(--color-text-muted)]">...</span>
                                                {subData.dates_found_list_tail?.map((date: string) => (
                                                  <span
                                                    key={date}
                                                    className="text-[8px] font-mono px-1 py-0.5 rounded bg-[var(--color-status-success-bg)] text-[var(--color-accent-green)]"
                                                  >
                                                    {date}
                                                  </span>
                                                ))}
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </details>
                                    )}
                                    {/* Missing dates breakdown if available (red) */}
                                    {subData.dates_missing_count && subData.dates_missing_count > 0 && (
                                      <details className="mt-1">
                                        <summary className="text-[9px] text-[var(--color-accent-red)] cursor-pointer hover:underline">
                                          {subData.dates_missing_count} missing days
                                        </summary>
                                        <div className="mt-1 pl-1 border-l border-[var(--color-status-error-border-strong)]">
                                          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                                            {subData.dates_missing_list?.map((date: string) => (
                                              <span
                                                key={date}
                                                className="text-[8px] font-mono px-1 py-0.5 rounded bg-[var(--color-status-error-bg)] text-[var(--color-accent-red)]"
                                              >
                                                {date}
                                              </span>
                                            ))}
                                            {subData.dates_missing_truncated && (
                                              <>
                                                <span className="text-[8px] text-[var(--color-text-muted)]">...</span>
                                                {subData.dates_missing_list_tail?.map((date: string) => (
                                                  <span
                                                    key={date}
                                                    className="text-[8px] font-mono px-1 py-0.5 rounded bg-[var(--color-status-error-bg)] text-[var(--color-accent-red)]"
                                                  >
                                                    {date}
                                                  </span>
                                                ))}
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
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
