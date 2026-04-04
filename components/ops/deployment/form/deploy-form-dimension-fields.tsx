"use client";

import { CloudConfigBrowser } from "@/components/ops/deployment/CloudConfigBrowser";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelectDimension } from "@/components/ops/deployment/form/multi-select-dimension";
import { useDeployFormContext } from "@/components/ops/deployment/form/deploy-form-context";

export function DeployFormDimensionFields() {
  const {
    serviceName,
    primaryCategory,
    categoryVenues,
    selectedCategories,
    setSelectedCategories,
    selectedVenues,
    setSelectedVenues,
    selectedFeatureGroups,
    setSelectedFeatureGroups,
    selectedTimeframes,
    setSelectedTimeframes,
    selectedInstruments,
    setSelectedInstruments,
    selectedTargetTypes,
    setSelectedTargetTypes,
    selectedDomain,
    setSelectedDomain,
    handleCloudConfigSelected,
    getDimension,
    hasCategory,
    hasVenue,
    hasFeatureGroup,
    hasTimeframe,
    hasInstrument,
    hasTargetType,
    hasDomain,
    hasCloudConfig,
  } = useDeployFormContext();

  return (
    <>
      {hasCategory && (
        <MultiSelectDimension
          dimension={getDimension("category")!}
          selected={selectedCategories}
          onChange={setSelectedCategories}
        />
      )}

      {hasVenue && categoryVenues && (
        <MultiSelectDimension
          dimension={{
            ...getDimension("venue")!,
            values: categoryVenues.venues,
          }}
          selected={selectedVenues}
          onChange={setSelectedVenues}
          disabled={!primaryCategory}
          hint={!primaryCategory ? "Select a category first" : undefined}
        />
      )}

      {hasDomain && (
        <div className="space-y-2">
          <Label>Domain</Label>
          <Select value={selectedDomain} onValueChange={setSelectedDomain}>
            <SelectTrigger>
              <SelectValue placeholder="Select domain..." />
            </SelectTrigger>
            <SelectContent>
              {getDimension("domain")?.values?.map((val) => (
                <SelectItem key={val} value={val}>
                  {val}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {hasCloudConfig && <CloudConfigBrowser serviceName={serviceName} onPathSelected={handleCloudConfigSelected} />}

      {hasFeatureGroup && (
        <MultiSelectDimension
          dimension={getDimension("feature_group")!}
          selected={selectedFeatureGroups}
          onChange={setSelectedFeatureGroups}
        />
      )}

      {hasTimeframe && (
        <MultiSelectDimension
          dimension={getDimension("timeframe")!}
          selected={selectedTimeframes}
          onChange={setSelectedTimeframes}
        />
      )}

      {hasInstrument && (
        <MultiSelectDimension
          dimension={getDimension("instrument")!}
          selected={selectedInstruments}
          onChange={setSelectedInstruments}
        />
      )}

      {hasTargetType && (
        <MultiSelectDimension
          dimension={getDimension("target_type")!}
          selected={selectedTargetTypes}
          onChange={setSelectedTargetTypes}
        />
      )}
    </>
  );
}
