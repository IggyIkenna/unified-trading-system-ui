"use client";

import { HeatmapCalendar } from "@/components/ops/deployment/HeatmapCalendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/shared/spinner";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  Eye,
  Rocket,
  Table2,
  XCircle,
} from "lucide-react";
import { getCompletionColor } from "./category-metrics";
import { useDataStatusTabCtx } from "./data-status-context";
import { formatPercent } from "@/lib/utils/formatters";

export function DataStatusSectionPreTurbo() {
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
              <Spinner size="lg" className="h-8 w-8 text-[var(--color-accent-cyan)]" />
              <p className="text-sm text-[var(--color-text-muted)]">
                {checkVenues
                  ? "Deep scanning parquet files for venue coverage..."
                  : checkDataTypes
                    ? "Validating per data_type completion..."
                    : useTurboMode
                      ? `TURBO mode: Scanning ${serviceName} data...`
                      : `Checking ${serviceName} data status...`}
              </p>
              {checkVenues && <p className="text-xs text-[var(--color-text-muted)]">This may take 20-30 seconds</p>}
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
                      const months = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
                      const etaSeconds = months > 6 ? Math.ceil(months * 1.2) : Math.ceil(months * 3);
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
                      {venueCheckData.start_date} to {venueCheckData.end_date} • Deep scan of parquet files
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(venueCheckData.categories ?? {}).map(([catName, catData]) => {
                    const datesWithIssues = catData.dates_with_missing_venues?.length ?? 0;
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
                                {datesWithIssues} / {totalDates} dates have missing venues
                              </Badge>
                            )}
                          </div>
                        </Button>

                        {/* Expanded: Dates with missing venues */}
                        {isExpanded && datesWithIssues > 0 && (
                          <div className="bg-[var(--color-bg-secondary)] px-4 py-3 space-y-2">
                            {catData.dates_with_missing_venues.map((dateInfo) => {
                              const dateKey = `${catName}-${dateInfo.date}`;
                              const isDateExpanded = expandedDates.has(dateKey);

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
                                      <span className="font-mono text-sm">{dateInfo.date}</span>
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
                                      <div className="text-xs text-[var(--color-text-muted)] mb-2">Missing venues:</div>
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
                            })}
                          </div>
                        )}

                        {isExpanded && datesWithIssues === 0 && (
                          <div className="bg-[var(--color-bg-secondary)] px-4 py-6 text-center">
                            <CheckCircle2 className="h-8 w-8 text-[var(--color-accent-green)] mx-auto mb-2" />
                            <p className="text-sm text-[var(--color-text-muted)]">
                              All {totalDates} dates have complete venue coverage
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Deploy Missing from Venue Check */}
                {Object.values(venueCheckData.categories ?? {}).some(
                  (c) => (c.dates_with_missing_venues?.length ?? 0) > 0,
                ) &&
                  onDeployMissing && (
                    <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-[var(--color-status-error-bg)] border border-[var(--color-status-error-border)]">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-[var(--color-accent-red)]" />
                        <span className="text-sm">Re-run dates with missing venues to regenerate parquet files</span>
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
                  <CardDescription>Visual overview of venue coverage by day</CardDescription>
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
                          {new Date(selectedCalendarDate).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
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
                      {heatmapData.find((d) => d.date === selectedCalendarDate)?.tooltip && (
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          {heatmapData.find((d) => d.date === selectedCalendarDate)?.tooltip}
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
                      {dataTypeCheckData.start_date} to {dataTypeCheckData.end_date} • Per data_type validation (TRADFI)
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-3xl font-mono font-bold"
                      style={{
                        color: getCompletionColor(dataTypeCheckData.overall_completion ?? 0),
                      }}
                    >
                      {formatPercent(dataTypeCheckData.overall_completion ?? 0, 1)}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      {dataTypeCheckData.overall_complete} / {dataTypeCheckData.overall_total} data_type × date
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
                      backgroundColor: getCompletionColor(dataTypeCheckData.overall_completion ?? 0),
                    }}
                  />
                </div>

                {/* Venue Breakdown with Data Types */}
                <div className="space-y-3">
                  {dataTypeCheckData.venues &&
                    Object.entries(dataTypeCheckData.venues).map(([venueName, venueData]) => {
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
                                ({Object.keys(venueData.data_types || {}).length} data types)
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
                                    {formatPercent(venueData.completion_percent, 0)}
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="h-3 w-3 mr-1" />{" "}
                                    {formatPercent(venueData.completion_percent, 0)}
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
                                {Object.entries(venueData.data_types).map(([dataType, typeData]) => {
                                  const typeComplete = typeData.completion_percent === 100;
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
                                        <span className="font-mono text-sm">{dataType}</span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span
                                          className="text-sm font-medium"
                                          style={{
                                            color: getCompletionColor(typeData.completion_percent),
                                          }}
                                        >
                                          {formatPercent(typeData.completion_percent, 0)}
                                        </span>
                                        <span className="text-xs text-[var(--color-text-muted)] font-mono">
                                          {typeData.found}/{typeData.expected}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>

                {/* Info about tick windows - TRADFI specific */}
                <div className="mt-4 p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                  <p className="text-xs text-[var(--color-text-muted)]">
                    <strong>Tick Windows (TRADFI only):</strong> May 2023 and July 2024 expect 3 data types (trades,
                    ohlcv_1m, tbbo) for backtesting. Other dates expect only ohlcv_1m for cost optimization. DEFI/CEFI
                    always expect all data types.
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
    </>
  );
}
