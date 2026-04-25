"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ProvisionedPerson,
  OnboardRequest,
  ModifyUserRequest,
  OffboardRequest,
  ProvisioningStep,
  QuotaCheckResult,
  WorkflowRun,
  WorkflowExecution,
  AccessTemplate,
  HealthCheckResult,
  HealthCheckHistoryEntry,
  AccessRequest,
  PermissionDomain,
} from "@/lib/types/user-management";

// Unified path-shape for the user-management surface — all routes serve from
// the portal's native /api/v1/* Admin SDK routes. Replaces the never-deployed
// /api/auth/provisioning/* path that pre-dated the user-management-api fold-in.
const BASE = "/api/v1";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!resp.ok) throw new Error(`${resp.status}: ${resp.statusText}`);
  return resp.json() as Promise<T>;
}

export function useProvisionedUsers() {
  return useQuery({
    queryKey: ["provisioning", "users"],
    queryFn: () =>
      fetchJson<{ users: ProvisionedPerson[]; total: number }>(`${BASE}/users`),
  });
}

export function useProvisionedUser(id: string) {
  return useQuery({
    queryKey: ["provisioning", "users", id],
    queryFn: () =>
      fetchJson<{ user: ProvisionedPerson }>(`${BASE}/users/${id}`),
    enabled: !!id,
  });
}

export function useQuotaCheck() {
  return useMutation({
    mutationFn: (payload: { email: string; role: string }) =>
      fetchJson<{ quota: QuotaCheckResult }>(`${BASE}/users/quota-check`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

export function useOnboardUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: OnboardRequest) =>
      fetchJson<{
        user: ProvisionedPerson;
        provisioning_steps: ProvisioningStep[];
      }>(`${BASE}/users/onboard`, {
        method: "POST",
        body: JSON.stringify(req),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["provisioning", "users"] }),
  });
}

export function useModifyUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...req }: ModifyUserRequest & { id: string }) =>
      fetchJson<{ user: ProvisionedPerson }>(`${BASE}/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(req),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["provisioning", "users"] }),
  });
}

export function useOffboardUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...req }: OffboardRequest & { id: string }) =>
      fetchJson<{
        user: ProvisionedPerson;
        revocation_steps: ProvisioningStep[];
      }>(`${BASE}/users/${id}/offboard`, {
        method: "POST",
        body: JSON.stringify(req),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["provisioning", "users"] }),
  });
}

export function useReprovisionUser() {
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ workflow_execution: string }>(
        `${BASE}/users/${id}/reprovision`,
        {
          method: "POST",
        },
      ),
  });
}

export function useUserWorkflows(id: string) {
  return useQuery({
    queryKey: ["provisioning", "workflows", id],
    queryFn: () =>
      fetchJson<{ runs: WorkflowRun[]; total: number }>(
        `${BASE}/users/${id}/workflows`,
      ),
    enabled: !!id,
  });
}

export function useAccessTemplates() {
  return useQuery({
    queryKey: ["provisioning", "templates"],
    queryFn: () =>
      fetchJson<{ templates: AccessTemplate[]; total: number }>(
        `${BASE}/access-templates`,
      ),
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      description?: string;
      github_teams?: string[];
      slack_channels?: string[];
      aws_permission_sets?: string[];
    }) =>
      fetchJson<{ template: AccessTemplate }>(`${BASE}/access-templates`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["provisioning", "templates"] }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      name?: string;
      description?: string;
      github_teams?: string[];
      slack_channels?: string[];
      aws_permission_sets?: string[];
    }) =>
      fetchJson<{ template: AccessTemplate }>(
        `${BASE}/access-templates/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(body),
        },
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["provisioning", "templates"] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ status: string }>(`${BASE}/access-templates/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["provisioning", "templates"] }),
  });
}

export function useRunHealthChecks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchJson<{ result: HealthCheckResult }>(`${BASE}/admin/health-checks`, {
        method: "POST",
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["provisioning", "health-history"] }),
  });
}

export function useHealthCheckHistory() {
  return useQuery({
    queryKey: ["provisioning", "health-history"],
    queryFn: () =>
      fetchJson<{ history: HealthCheckHistoryEntry[]; total: number }>(
        `${BASE}/admin/health-checks/history`,
      ),
  });
}

export function useAccessRequests(status?: string) {
  return useQuery({
    queryKey: ["provisioning", "access-requests", status],
    queryFn: () => {
      const qs = status ? `?status=${status}` : "";
      return fetchJson<{ requests: AccessRequest[]; total: number }>(
        `${BASE}/access-requests${qs}`,
      );
    },
  });
}

export function useSubmitAccessRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      requested_entitlements: string[];
      requested_role?: string;
      reason: string;
    }) =>
      fetchJson<{ request: AccessRequest }>(`${BASE}/access-requests`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["provisioning", "access-requests"] }),
  });
}

export function useReviewRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
      admin_note,
    }: {
      id: string;
      action: "approve" | "deny";
      admin_note?: string;
    }) =>
      fetchJson<{ request: AccessRequest }>(
        `${BASE}/access-requests/${id}/review`,
        {
          method: "PUT",
          body: JSON.stringify({ action, admin_note: admin_note ?? "" }),
        },
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["provisioning", "access-requests"] }),
  });
}

export function usePermissionCatalogue() {
  return useQuery({
    queryKey: ["catalogue"],
    queryFn: () =>
      fetchJson<{ domains: PermissionDomain[] }>(`${BASE}/catalogue`),
    staleTime: Infinity, // Catalogue is static
  });
}

export function useSearchPermissions(query: string) {
  return useQuery({
    queryKey: ["catalogue", "search", query],
    queryFn: () =>
      fetchJson<{
        results: Array<{
          domain: string;
          domain_label: string;
          category: string;
          category_label: string;
          key: string;
          label: string;
          description: string;
          internal_only: string;
        }>;
        total: number;
      }>(`${BASE}/catalogue/search/${encodeURIComponent(query)}`),
    enabled: query.length >= 2,
  });
}
