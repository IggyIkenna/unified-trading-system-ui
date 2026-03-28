"use client";

import { DataStatusSectionFilters } from "./data-status-section-filters";
import { DataStatusSectionPreTurbo } from "./data-status-section-pre-turbo";
import { DataStatusSectionTurbo } from "./data-status-section-turbo";
import { DataStatusSectionRegular } from "./data-status-section-regular";
import { DataStatusSectionModals } from "./data-status-section-modals";

export function DataStatusTabPanels() {
  return (
    <div className="space-y-4">
      <DataStatusSectionFilters />
      <DataStatusSectionPreTurbo />
      <DataStatusSectionTurbo />
      <DataStatusSectionRegular />
      <DataStatusSectionModals />
    </div>
  );
}
