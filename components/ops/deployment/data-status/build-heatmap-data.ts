import type { VenueCheckResponse } from "@/hooks/deployment/_api-stub";
import type { DataStatusResponse } from "@/lib/types/deployment";

export type HeatmapDay = {
  date: string;
  status: "complete" | "partial" | "missing" | "future";
  coverage?: number;
  tooltip?: string;
};

export function buildHeatmapDayEntries(
  startDate: string,
  endDate: string,
  data: DataStatusResponse | null,
  venueCheckData: VenueCheckResponse | null,
): HeatmapDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(startDate);
  const end = new Date(endDate);
  const result: HeatmapDay[] = [];

  try {
    if (venueCheckData) {
      const datesWithIssues = new Set<string>();
      const dateDetails = new Map<string, string[]>();

      Object.entries(venueCheckData.categories ?? {}).forEach(([catName, catData]) => {
        if (!catData.dates_with_missing_venues) return;

        catData.dates_with_missing_venues.forEach((dateInfo) => {
          datesWithIssues.add(dateInfo.date);
          if (!dateDetails.has(dateInfo.date)) {
            dateDetails.set(dateInfo.date, []);
          }
          dateDetails.get(dateInfo.date)!.push(`${catName}: ${dateInfo.missing.length} venues`);
        });
      });

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
            coverage: 50,
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

    if (!data || !data.categories) return [];

    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const isFuture = currentDate > today;

      if (isFuture) {
        result.push({ date: dateStr, status: "future" });
      } else {
        let venuesWithData = 0;
        let totalVenues = 0;
        const missingVenues: string[] = [];

        Object.entries(data.categories).forEach(([catName, catData]) => {
          if (!catData || !catData.venues) return;

          Object.entries(catData.venues).forEach(([venueName, venueData]) => {
            totalVenues++;

            const missing = venueData.missing_dates || [];
            if (missing.includes(dateStr)) {
              missingVenues.push(`${catName}/${venueName}`);
            } else {
              venuesWithData++;
            }
          });
        });

        const coverage = totalVenues > 0 ? Math.round((venuesWithData / totalVenues) * 100) : 0;

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
}
