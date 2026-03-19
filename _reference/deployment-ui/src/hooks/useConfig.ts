import { useState, useEffect, useCallback } from "react";
import * as api from "../api/client";
import type { CategoryVenuesResponse, StartDatesResponse } from "../types";

export function useVenuesByCategory(category: string | null) {
  const [venues, setVenues] = useState<CategoryVenuesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!category) {
      setVenues(null);
      return;
    }

    const categoryName = category;
    async function fetchVenues() {
      try {
        setLoading(true);
        const response = await api.getVenuesByCategory(categoryName);
        setVenues(response);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch venues");
      } finally {
        setLoading(false);
      }
    }
    fetchVenues();
  }, [category]);

  return { venues, loading, error };
}

/**
 * Fetch venues for multiple categories and return the total count across all.
 * Used for accurate shard estimation when multiple categories are selected.
 */
export function useVenueCountByCategories(categories: string[]) {
  const [totalVenueCount, setTotalVenueCount] = useState(0);
  const [venuesByCategory, setVenuesByCategory] = useState<
    Record<string, string[]>
  >({});
  const [loading, setLoading] = useState(false);

  // Stable key to avoid re-fetching when array reference changes but content is same
  const categoriesKey = categories.slice().sort().join(",");

  useEffect(() => {
    if (!categoriesKey) {
      setTotalVenueCount(0);
      setVenuesByCategory({});
      return;
    }

    const cats = categoriesKey.split(",").filter(Boolean);
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      try {
        const results = await Promise.all(
          cats.map((cat) => api.getVenuesByCategory(cat).catch(() => null)),
        );
        if (cancelled) return;

        let total = 0;
        const byCategory: Record<string, string[]> = {};
        for (let i = 0; i < cats.length; i++) {
          const venueList = results[i]?.venues ?? [];
          byCategory[cats[i]] = venueList;
          total += venueList.length;
        }
        setTotalVenueCount(total);
        setVenuesByCategory(byCategory);
      } catch {
        // Fallback: don't crash estimation
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [categoriesKey]);

  return { totalVenueCount, venuesByCategory, loading };
}

export function useStartDates(serviceName: string | null) {
  const [startDates, setStartDates] = useState<StartDatesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceName) {
      setStartDates(null);
      return;
    }

    const svcName = serviceName;
    async function fetchStartDates() {
      try {
        setLoading(true);
        const response = await api.getStartDates(svcName);
        setStartDates(response);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch start dates",
        );
      } finally {
        setLoading(false);
      }
    }
    fetchStartDates();
  }, [serviceName]);

  // Helper to get earliest valid date for a venue
  const getVenueStartDate = useCallback(
    (category: string, venue?: string): string | null => {
      if (!startDates) return null;

      const categoryDates = startDates.start_dates[category];
      if (!categoryDates) return null;

      // If venue specified, try to get venue-specific date
      if (venue && categoryDates.venues?.[venue]) {
        return categoryDates.venues[venue];
      }

      // Fall back to category start date
      return categoryDates.category_start || null;
    },
    [startDates],
  );

  // Validate a date against venue constraints
  const validateDate = useCallback(
    (
      date: string,
      category: string,
      venue?: string,
    ): { valid: boolean; message?: string; earliestDate?: string } => {
      const earliestDate = getVenueStartDate(category, venue);

      if (!earliestDate) {
        return { valid: true }; // No constraint found
      }

      if (date < earliestDate) {
        return {
          valid: false,
          message: venue
            ? `${venue} data only available from ${earliestDate}`
            : `${category} data only available from ${earliestDate}`,
          earliestDate,
        };
      }

      return { valid: true };
    },
    [getVenueStartDate],
  );

  return { startDates, loading, error, getVenueStartDate, validateDate };
}
