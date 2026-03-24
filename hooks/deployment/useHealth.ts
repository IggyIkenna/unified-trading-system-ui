"use client";

import { useState, useEffect } from "react";
import * as api from "@/hooks/deployment/_api-stub";
import type { HealthResponse } from "@/lib/types/deployment";

export function useHealth() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkHealth() {
      try {
        setLoading(true);
        const response = await api.getHealth();
        setHealth(response);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "API not reachable");
        setHealth(null);
      } finally {
        setLoading(false);
      }
    }

    checkHealth();

    // Poll health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return { health, loading, error, isHealthy: health?.status === "healthy" };
}
