"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/shared/spinner";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, CheckCircle, CheckCircle2, FileText, Rocket, XCircle } from "lucide-react";
import { useDataStatusTabCtx } from "./data-status-context";
import { formatNumber } from "@/lib/utils/formatters";

export function DataStatusSectionModals() {
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
      {/* Deploy Missing Modal */}
      <Dialog
        open={deployMissingModalOpen}
        onOpenChange={(open) => {
          if (!open) setDeployMissingModalOpen(false);
        }}
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
                    <span className="ml-2 text-[var(--color-accent-cyan)]">(first day of month only)</span>
                  )}
                </div>
                <div className="mt-1 text-xs">
                  <span className="text-[var(--color-text-muted)]">Categories: </span>
                  <span className="text-[var(--color-accent-cyan)] font-medium">
                    {effectiveDeployCategories.length > 0
                      ? effectiveDeployCategories.join(", ")
                      : "All categories with missing data"}
                  </span>
                </div>
                {selectedVenues.length > 0 && (
                  <div className="mt-1 text-xs">
                    <span className="text-[var(--color-text-muted)]">Venues: </span>
                    <span className="text-[var(--color-accent-purple)] font-medium">{selectedVenues.join(", ")}</span>
                  </div>
                )}
                {selectedFolders.length > 0 && (
                  <div className="mt-1 text-xs">
                    <span className="text-[var(--color-text-muted)]">Instrument Types: </span>
                    <span className="text-[var(--color-accent-green)] font-medium">{selectedFolders.join(", ")}</span>
                  </div>
                )}
                {selectedDataTypes.length > 0 && (
                  <div className="mt-1 text-xs">
                    <span className="text-[var(--color-text-muted)]">Data Types: </span>
                    <span className="text-[var(--color-accent-amber)] font-medium">{selectedDataTypes.join(", ")}</span>
                  </div>
                )}
                {selectedCategories.length > 0 && effectiveDeployCategories.length === 0 && (
                  <div className="mt-1 text-xs text-[var(--color-accent-amber)]">
                    ⚠️ Selected categories have no missing data
                  </div>
                )}
              </div>

              {/* Region (with cross-region egress warning) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">Region</Label>
                <Select value={deployMissingRegion} onValueChange={setDeployMissingRegion}>
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
                      {
                        value: "europe-west1",
                        label: "europe-west1 (Belgium)",
                      },
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
                        <p className="font-semibold">Cross-Region Egress Warning</p>
                        <p className="mt-1">
                          Selected region ({deployMissingRegion}) differs from configured storage region (
                          {backendRegion}). This will incur significant egress costs.
                        </p>
                        <p className="mt-1 font-medium">Recommendation: Use {backendRegion} to avoid egress charges.</p>
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
                    onCheckedChange={(checked) => setDeployMissingDryRun(checked === true)}
                  />
                  <Label htmlFor="deploy-missing-dry-run" className="text-sm cursor-pointer">
                    <span className="font-medium">Preview only (dry run)</span>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Show what shards would be deployed without actually deploying
                    </p>
                  </Label>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox
                    id="deploy-missing-force"
                    checked={deployMissingForce}
                    onCheckedChange={(checked) => setDeployMissingForce(checked === true)}
                  />
                  <Label htmlFor="deploy-missing-force" className="text-sm cursor-pointer">
                    <span className="font-medium">Force re-process (--force)</span>
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
                      variant={deployMissingDateGranularity === g ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDeployMissingDateGranularity(g)}
                    >
                      {g === "none" ? "None (Bulk)" : g.charAt(0).toUpperCase() + g.slice(1)}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {deployMissingDateGranularity === "daily" && "One shard per day (most granular, more shards)"}
                  {deployMissingDateGranularity === "weekly" && "One shard per week (balanced)"}
                  {deployMissingDateGranularity === "monthly" && "One shard per month (fewer shards, larger jobs)"}
                  {deployMissingDateGranularity === "none" &&
                    "Single shard, no date range — service fetches all data in bulk"}
                </p>
              </div>

              {/* Preview result - shows updated shard count when granularity changes (stays visible in modal) */}
              {(isDeploying || deploymentResult?.dry_run) && (
                <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
                  {isDeploying ? (
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                      <Spinner className="h-4 w-4 shrink-0" />
                      Calculating shards for {deployMissingDateGranularity} granularity…
                    </div>
                  ) : deploymentResult?.dry_run && deploymentResult.total_shards !== undefined ? (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-[var(--color-accent-green)] shrink-0" />
                      <span>
                        <strong className="font-mono text-[var(--color-accent-cyan)]">
                          {deploymentResult.total_shards.toLocaleString()}
                        </strong>{" "}
                        shards would be deployed
                        {deploymentResult.shards_truncated && (
                          <span className="text-[var(--color-text-muted)]"> (truncated — full list on Deploy tab)</span>
                        )}
                      </span>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDeployMissingModalOpen(false)}>
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
        onOpenChange={(open) => {
          if (!open) setShowFileListing(false);
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              File Listing
              {fileListingData && (
                <span className="text-sm font-normal text-[var(--color-text-muted)] ml-2">
                  {fileListingData.venue} / {fileListingData.folder} / {fileListingData.data_type}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div>
            <div className="max-h-[60vh] overflow-auto">
              {fileListingLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="lg" className="h-8 w-8 text-[var(--color-accent-cyan)]" />
                  <span className="ml-3 text-[var(--color-text-muted)]">Querying GCS for files...</span>
                </div>
              ) : fileListingError ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-8 w-8 text-[var(--color-accent-red)] mx-auto mb-2" />
                  <p className="text-[var(--color-accent-red)]">{fileListingError}</p>
                </div>
              ) : fileListingData ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-[var(--color-text-muted)]">Total Files</div>
                        <div className="font-semibold text-lg">
                          {fileListingData.summary?.total_files.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--color-text-muted)]">Total Size</div>
                        <div className="font-semibold text-lg">{fileListingData.summary?.total_size_formatted}</div>
                      </div>
                      <div>
                        <div className="text-[var(--color-text-muted)]">Days with Data</div>
                        <div className="font-semibold text-lg text-[var(--color-accent-green)]">
                          {fileListingData.summary?.dates_with_data}
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--color-text-muted)]">Days Empty</div>
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
                      <span className="text-sm font-medium">{fileListingData.summary?.completion_pct}%</span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-2">
                      Bucket: {fileListingData.bucket} | {fileListingData.date_range?.start} to{" "}
                      {fileListingData.date_range?.end} ({fileListingData.date_range?.total_days} days)
                    </p>
                  </div>

                  {/* Files by Date */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-2">Files by Date</h3>
                    <div className="max-h-[300px] overflow-auto border border-[var(--color-border-subtle)] rounded">
                      <table className="w-full text-sm">
                        <thead className="bg-[var(--color-bg-tertiary)] sticky top-0">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium">Date</th>
                            <th className="text-right px-3 py-2 font-medium">Files</th>
                            <th className="text-right px-3 py-2 font-medium">Size</th>
                            <th className="text-left px-3 py-2 font-medium">Last modified</th>
                            <th className="text-left px-3 py-2 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fileListingData.by_date?.map((dayResult) => (
                            <tr
                              key={dayResult.date}
                              className={cn(
                                "border-t border-[var(--color-border-subtle)]",
                                dayResult.file_count === 0 && "bg-[var(--color-accent-red)]/5",
                              )}
                            >
                              <td className="px-3 py-2 font-mono">{dayResult.date}</td>
                              <td className="px-3 py-2 text-right font-mono">{dayResult.file_count}</td>
                              <td className="px-3 py-2 text-right font-mono text-[var(--color-text-muted)]">
                                {dayResult.total_size_bytes > 0
                                  ? formatNumber(dayResult.total_size_bytes / (1024 * 1024), 1) + " MB"
                                  : "-"}
                              </td>
                              <td className="px-3 py-2 font-mono text-[var(--color-text-muted)] text-xs">
                                {dayResult.last_modified
                                  ? new Date(dayResult.last_modified).toLocaleString(undefined, {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    })
                                  : "-"}
                              </td>
                              <td className="px-3 py-2">
                                {dayResult.error ? (
                                  <span className="text-[var(--color-accent-red)] text-xs">{dayResult.error}</span>
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
    </>
  );
}
