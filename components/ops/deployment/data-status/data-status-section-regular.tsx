"use client";

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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogHeader, DialogTitle, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { HeatmapCalendar } from "@/components/ops/deployment/HeatmapCalendar";
import { useDataStatusTabCtx } from "./data-status-context";
import { getCompletionColor, getCompletionBadgeClass } from "./category-metrics";

export function DataStatusSectionRegular() {
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
                    backgroundColor: getCompletionColor(data.overall_completion),
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
                <CardDescription>Visual overview of data coverage by day</CardDescription>
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
                            <Badge variant="outline" className={getCompletionBadgeClass(completion)}>
                              {completion.toFixed(1)}%
                            </Badge>
                            <div className="w-24 h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                              <div
                                className="h-full transition-all"
                                style={{
                                  width: `${completion}%`,
                                  backgroundColor: getCompletionColor(completion),
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
                                  <th className="text-left py-2 font-medium">Venue</th>
                                  <th className="text-right py-2 font-medium">Complete</th>
                                  <th className="text-right py-2 font-medium">Total</th>
                                  <th className="text-right py-2 font-medium">Coverage</th>
                                  <th className="text-right py-2 font-medium">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                                {Object.entries(catData.venues).map(([venueName, venueData]) => {
                                  const venuePct = venueData.completion_percent;
                                  const venueMissing = venueData.total - venueData.complete;

                                  return (
                                    <tr key={venueName} className="hover:bg-[var(--color-bg-tertiary)]">
                                      <td className="py-2 font-mono text-xs">{venueName}</td>
                                      <td className="py-2 text-right font-mono">{venueData.complete}</td>
                                      <td className="py-2 text-right font-mono text-[var(--color-text-muted)]">
                                        {venueData.total}
                                      </td>
                                      <td className="py-2 text-right">
                                        <span
                                          className="font-mono"
                                          style={{
                                            color: getCompletionColor(venuePct),
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
                                })}
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
    </>
  );
}
