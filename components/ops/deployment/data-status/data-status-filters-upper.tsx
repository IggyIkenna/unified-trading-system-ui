"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Building2, FileText, Filter } from "lucide-react";
import { useDataStatusTabCtx } from "./data-status-context";
import { getTodayAt8am } from "./get-today-at-8am";

export function DataStatusFiltersUpper() {
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
      {useTurboMode && (
        <div className="mb-4">
          <Label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">Mode</Label>
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
          <Label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">Start Date</Label>
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
          <Label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">End Date</Label>
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
          <Label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">Require Freshness</Label>
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
                    = {new Date(freshnessDate).toISOString().replace("T", " ").slice(0, 19)} UTC
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div>
          <Label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">Categories</Label>
          <div className="flex gap-2 flex-wrap">
            {categoriesLoading ? (
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                <Spinner size="sm" className="h-3 w-3" />
                Loading categories...
              </div>
            ) : (
              availableCategories.map((cat) => (
                <Button
                  key={cat}
                  type="button"
                  variant={selectedCategories.includes(cat) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedCategories((prev) =>
                      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
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
                <span className="ml-2 text-[var(--color-accent-cyan)]">({selectedVenues.length} selected)</span>
              )}
            </Label>
            {selectedVenues.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedVenues([])} className="ml-auto">
                Clear
              </Button>
            )}
          </div>
          {venuesLoading ? (
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              <Spinner size="sm" className="h-3 w-3" />
              Loading venues...
            </div>
          ) : availableVenues.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              {availableVenues.map((venue) => (
                <Button
                  key={venue}
                  type="button"
                  variant={selectedVenues.includes(venue) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedVenues((prev) =>
                      prev.includes(venue) ? prev.filter((v) => v !== venue) : [...prev, venue],
                    );
                  }}
                >
                  {venue}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--color-text-muted)]">No venues available for {selectedCategories[0]}</p>
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
              <Spinner size="sm" className="h-3 w-3" />
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
                      <Button variant="ghost" size="sm" onClick={() => setSelectedFolders([])} className="ml-auto">
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {venueAvailableFolders.map((f) => (
                      <Button
                        key={f}
                        type="button"
                        variant={selectedFolders.includes(f) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSelectedFolders((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
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
                      <Button variant="ghost" size="sm" onClick={() => setSelectedDataTypes([])} className="ml-auto">
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {venueAvailableDataTypes.map((dt) => (
                      <Button
                        key={dt}
                        type="button"
                        variant={selectedDataTypes.includes(dt) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSelectedDataTypes((prev) =>
                            prev.includes(dt) ? prev.filter((x) => x !== dt) : [...prev, dt],
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
              {selectedFolders.length === 1 && selectedDataTypes.length === 1 && (
                <div className="mt-4 pt-3 border-t border-[var(--color-border-default)]">
                  {/* Timeframe selector for market-data-processing-service */}
                  {serviceName === "market-data-processing-service" && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Label className="text-xs font-medium text-[var(--color-text-muted)]">Select Timeframe</Label>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {availableTimeframes.map((tf) => (
                          <Button
                            key={tf}
                            type="button"
                            variant={selectedTimeframe === tf ? "default" : "outline"}
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
                        <Spinner className="h-4 w-4" />
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
    </>
  );
}
