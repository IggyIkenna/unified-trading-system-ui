"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/shared/spinner";
import { cn } from "@/lib/utils";
import { AlertCircle, Calendar, Database, Eye, Rocket } from "lucide-react";
import { getCompletionBadgeClass, getCompletionColor } from "./category-metrics";
import { useDataStatusTabCtx } from "./data-status-context";
import { formatPercent } from "@/lib/utils/formatters";

export function DataStatusFiltersLower() {
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
      {/* First Day of Month Filter - for TARDIS free tier (no API key needed) */}
      {serviceName === "market-tick-data-handler" && (
        <div className="mt-4 pt-4 border-t border-[var(--color-border-default)]">
          <div className="flex items-center gap-3">
            <Checkbox
              id="first-day-of-month"
              checked={firstDayOfMonthOnly}
              onCheckedChange={(checked) => setFirstDayOfMonthOnly(checked === true)}
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
            TARDIS free tier: no API key required for first-day-of-month data. Check and deploy only 1st of each month
            dates.
          </p>
        </div>
      )}

      {/* Instrument-Level Search - check availability for specific instruments */}
      {selectedCategories.length === 1 &&
        ["market-tick-data-handler", "market-data-processing-service"].includes(serviceName) && (
          <div className="mt-4 pt-4 border-t border-[var(--color-border-default)]">
            <div className="flex items-center gap-3 mb-3">
              <Checkbox
                id="instrument-search-mode"
                checked={instrumentSearchMode}
                onCheckedChange={(checked) => setInstrumentSearchMode(checked === true)}
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
                      if (selectedInstrument && newValue !== selectedInstrument.instrument_key) {
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
                      if (!selectedInstrument && instrumentSearchResults.length > 0) {
                        setShowInstrumentDropdown(true);
                      }
                    }}
                    className="w-full"
                  />
                  {instrumentSearchLoading && (
                    <Spinner className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                  )}

                  {/* Dropdown Results */}
                  {showInstrumentDropdown && instrumentSearchResults.length > 0 && !selectedInstrument && (
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
                              clearTimeout(searchInstrumentsDebounceRef.current);
                              searchInstrumentsDebounceRef.current = null;
                            }
                            setSelectedInstrument(instrument);
                            setInstrumentSearchQuery(instrument.instrument_key ?? "");
                            setShowInstrumentDropdown(false);
                            setInstrumentSearchResults([]); // Clear results to prevent dropdown flash
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-bg-secondary)] transition-colors h-auto"
                        >
                          <div className="font-medium">{instrument.instrument_key}</div>
                          <div className="text-xs text-[var(--color-text-muted)]">
                            {instrument.venue} • {instrument.instrument_type}
                            {instrument.symbol && ` • ${instrument.symbol}`}
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
                        <div className="font-medium text-sm">{selectedInstrument.instrument_key}</div>
                        <div className="text-xs text-[var(--color-text-muted)] mt-1">
                          <span className="text-[var(--color-accent-purple)]">{selectedInstrument.venue}</span>
                          {" • "}
                          <span className="text-[var(--color-accent-cyan)]">{selectedInstrument.instrument_type}</span>
                          {selectedInstrument.data_types && (
                            <>
                              {" • "}
                              <span>
                                {Array.isArray(selectedInstrument.data_types)
                                  ? selectedInstrument.data_types.join(", ")
                                  : String(selectedInstrument.data_types)}
                              </span>
                            </>
                          )}
                        </div>
                        {/* Instrument Availability Window */}
                        {(selectedInstrument.available_from_datetime || selectedInstrument.available_to_datetime) && (
                          <div className="text-xs text-[var(--color-text-muted)] mt-1">
                            <span className="text-[var(--color-accent-amber)]">Available: </span>
                            {selectedInstrument.available_from_datetime
                              ? selectedInstrument.available_from_datetime.split("T")[0]
                              : "..."}
                            {" → "}
                            {selectedInstrument.available_to_datetime
                              ? selectedInstrument.available_to_datetime.split("T")[0]
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
                            <Spinner className="h-4 w-4 mr-2" />
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
                        <span className="text-sm font-medium">Overall Availability</span>
                        <Badge className={getCompletionBadgeClass(instrumentAvailability.overall?.completion_pct ?? 0)}>
                          {formatPercent(instrumentAvailability.overall?.completion_pct ?? 0, 1)}
                        </Badge>
                      </div>
                      <div className="w-full bg-[var(--color-bg-secondary)] rounded-full h-2 mb-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(instrumentAvailability.overall?.completion_pct ?? 0, 100)}%`,
                            backgroundColor: getCompletionColor(instrumentAvailability.overall?.completion_pct ?? 0),
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
                        <span>Expected: {instrumentAvailability.overall?.expected}</span>
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)] mt-2">
                        {/* Show effective date range (intersection of user range and instrument availability) */}
                        {instrumentAvailability.availability_window ? (
                          <>
                            <span className="text-[var(--color-accent-amber)]">Effective: </span>
                            {instrumentAvailability.availability_window.effective_start} to{" "}
                            {instrumentAvailability.availability_window.effective_end}
                            {" • "}
                            {instrumentAvailability.availability_window.dates_in_window} dates
                            {instrumentAvailability.availability_window.instrument_from && (
                              <span className="block mt-1">
                                <span className="text-[var(--color-text-muted)]">Instrument available: </span>
                                {instrumentAvailability.availability_window.instrument_from.split("T")[0]}
                                {" → "}
                                {instrumentAvailability.availability_window.instrument_to
                                  ? instrumentAvailability.availability_window.instrument_to.split("T")[0]
                                  : "ongoing"}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            {instrumentAvailability.date_range?.start} to {instrumentAvailability.date_range?.end}
                            {" • "}
                            {instrumentAvailability.date_range?.total_dates} dates
                          </>
                        )}
                        {instrumentAvailability.date_range?.first_day_of_month_only && (
                          <span className="text-[var(--color-accent-cyan)]"> (first day of month only)</span>
                        )}
                      </div>
                    </div>

                    {/* Deploy Missing for Instrument */}
                    {(instrumentAvailability.overall?.missing ?? 0) > 0 && onDeployMissing && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-status-error-bg)] border border-[var(--color-status-error-border)]">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-[var(--color-accent-red)]" />
                          <span className="text-sm">
                            {instrumentAvailability.overall?.missing} missing across{" "}
                            {
                              Object.entries(instrumentAvailability.by_data_type ?? {}).filter(
                                ([, s]) => s.dates_missing > 0,
                              ).length
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
                      <div className="text-xs font-medium text-[var(--color-text-muted)]">By Data Type</div>
                      {Object.entries(instrumentAvailability.by_data_type ?? {}).map(([dataType, stats]) => (
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
                              {formatPercent(stats.completion_pct, 1)} ({stats.dates_found}/
                              {stats.dates_found + stats.dates_missing})
                            </span>
                          </div>
                          <div className="w-full bg-[var(--color-bg-tertiary)] rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full transition-all"
                              style={{
                                width: `${Math.min(stats.completion_pct, 100)}%`,
                                backgroundColor: getCompletionColor(stats.completion_pct),
                              }}
                            />
                          </div>
                          {/* Expandable date lists */}
                          <div className="mt-2 space-y-2">
                            {/* Found dates dropdown (green) */}
                            {stats.dates_found > 0 && stats.dates_found_list && stats.dates_found_list.length > 0 && (
                              <details className="w-full">
                                <summary className="text-[10px] text-[var(--color-accent-green)] cursor-pointer hover:underline font-medium">
                                  ▸ {stats.dates_found} available days (click to expand)
                                </summary>
                                <div className="mt-1 pl-2 border-l-2 border-[var(--color-status-success-border-strong)]">
                                  <div className="flex flex-wrap gap-1 max-h-64 overflow-y-auto">
                                    {stats.dates_found_list.map((date: string) => (
                                      <span
                                        key={date}
                                        className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-status-success-bg)] text-[var(--color-accent-green)]"
                                      >
                                        {date}
                                      </span>
                                    ))}
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
                                    ▸ {stats.dates_missing} missing days (click to expand)
                                  </summary>
                                  <div className="mt-1 pl-2 border-l-2 border-[var(--color-status-error-border-strong)]">
                                    <div className="flex flex-wrap gap-1 max-h-64 overflow-y-auto">
                                      {stats.dates_missing_list.map((date: string) => (
                                        <span
                                          key={date}
                                          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-status-error-bg)] text-[var(--color-accent-red)]"
                                        >
                                          {date}
                                        </span>
                                      ))}
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
                      Parsed: {instrumentAvailability.parsed?.category} / {instrumentAvailability.parsed?.venue} /
                      {instrumentAvailability.parsed?.folder} / {instrumentAvailability.parsed?.instrument_type}
                    </div>
                  </div>
                )}

                <p className="text-xs text-[var(--color-text-muted)]">
                  Search for a specific instrument to check its data availability across all data types and dates. This
                  uses the aggregated instruments file for {selectedCategories[0]}.
                </p>
              </div>
            )}
          </div>
        )}

      {/* Check Data Types Toggle - DISABLED: turbo mode shows data_types by default in breakdown */}
      {/* Feature removed - checkDataTypes is hardcoded to false, turbo mode handles this automatically */}
    </>
  );
}
