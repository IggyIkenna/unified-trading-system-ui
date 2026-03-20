"use client"

import { useState, useEffect, useCallback } from "react";
import * as api from "@/hooks/deployment/_api-stub";
import type {
  Service,
  ServiceDimensionsResponse,
  DependenciesResponse,
  ChecklistResponse,
  ChecklistValidateResponse,
  ChecklistSummary,
} from "@/lib/types/deployment";

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true);
        const response = await api.getServices();
        setServices(response.services);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch services",
        );
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, []);

  return { services, loading, error };
}

export function useServiceDimensions(serviceName: string | null) {
  const [dimensions, setDimensions] =
    useState<ServiceDimensionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceName) {
      setDimensions(null);
      return;
    }

    const svcName = serviceName;
    async function fetchDimensions() {
      try {
        setLoading(true);
        setDimensions(null); // Clear old data immediately - prevent stale data display
        setError(null);

        const response = await api.getServiceDimensions(svcName);
        setDimensions(response);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch dimensions",
        );
      } finally {
        setLoading(false);
      }
    }
    fetchDimensions();
  }, [serviceName]);

  return { dimensions, loading, error };
}

export function useServiceDependencies(serviceName: string | null) {
  const [dependencies, setDependencies] = useState<DependenciesResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!serviceName) {
      setDependencies(null);
      return;
    }

    try {
      setLoading(true);
      setDependencies(null); // Clear old data immediately - prevent stale data display
      setError(null);

      const response = await api.getDependencies(serviceName);
      setDependencies(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch dependencies",
      );
    } finally {
      setLoading(false);
    }
  }, [serviceName]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { dependencies, loading, error, refetch };
}

export function useServiceChecklist(serviceName: string | null) {
  const [checklist, setChecklist] = useState<ChecklistResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!serviceName) {
      setChecklist(null);
      return;
    }

    try {
      setLoading(true);
      setChecklist(null); // Clear old data immediately - prevent stale data display
      setError(null);

      const response = await api.getChecklist(serviceName);
      setChecklist(response);
    } catch (err) {
      // Checklist might not exist for all services - that's OK
      const message =
        err instanceof Error ? err.message : "Failed to fetch checklist";
      if (message.includes("404") || message.includes("not found")) {
        setChecklist(null);
        setError(null);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [serviceName]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { checklist, loading, error, refetch };
}

export function useChecklistValidation(serviceName: string | null) {
  const [validation, setValidation] =
    useState<ChecklistValidateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback(async () => {
    if (!serviceName) {
      setValidation(null);
      return null;
    }

    try {
      setLoading(true);
      const response = await api.validateChecklist(serviceName);
      setValidation(response);
      setError(null);
      return response;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to validate checklist";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [serviceName]);

  useEffect(() => {
    validate();
  }, [validate]);

  return { validation, loading, error, validate };
}

export function useAllChecklists() {
  const [checklists, setChecklists] = useState<ChecklistSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.listChecklists();
      setChecklists(response.checklists);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch checklists",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { checklists, loading, error, refetch };
}
