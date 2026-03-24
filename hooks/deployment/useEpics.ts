"use client";

import { useState, useEffect, useCallback } from "react";
import * as api from "@/hooks/deployment/_api-stub";
import type { EpicSummary, EpicDetail } from "@/lib/types/deployment";

export function useEpics() {
  const [epics, setEpics] = useState<EpicSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getEpics();
      setEpics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch epics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { epics, loading, error, refetch };
}

export function useEpicDetail(epicId: string | null) {
  const [epic, setEpic] = useState<EpicDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!epicId) {
      setEpic(null);
      return;
    }

    const id = epicId;

    async function fetchDetail() {
      try {
        setLoading(true);
        setEpic(null);
        setError(null);
        const data = await api.getEpicDetail(id);
        setEpic(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch epic detail",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
  }, [epicId]);

  return { epic, loading, error };
}
