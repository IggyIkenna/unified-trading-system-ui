import { apiClient } from "@/lib/admin/api/client";
import type {
  ModifyUserRequest,
  OffboardRequest,
  OnboardRequest,
  Person,
  ProvisioningStep,
  QuotaCheckResult,
  WorkflowExecution,
  WorkflowRun,
  EffectiveAccessResult,
  Microsoft365LicenseItem,
  Microsoft365LicenseKey,
} from "@/lib/admin/api/types";

export async function listUsers() {
  return apiClient.get<{ users: Person[]; total: number }>("/users");
}

export async function getUser(id: string) {
  return apiClient.get<{ user: Person }>(`/users/${id}`);
}

export async function checkOnboardQuota(
  payload: Pick<OnboardRequest, "email" | "role">,
) {
  return apiClient.post<{ quota: QuotaCheckResult }>(
    "/users/quota-check",
    payload,
  );
}

export async function onboardUser(req: OnboardRequest) {
  return apiClient.post<{
    user: Person;
    provisioning_steps: ProvisioningStep[];
  }>("/users/onboard", req);
}

export async function modifyUser(id: string, req: ModifyUserRequest) {
  return apiClient.put<{ user: Person }>(`/users/${id}`, req);
}

export async function offboardUser(id: string, req: OffboardRequest) {
  return apiClient.post<{ user: Person; revocation_steps: ProvisioningStep[] }>(
    `/users/${id}/offboard`,
    req,
  );
}

export async function reprovisionUser(id: string) {
  return apiClient.post<{
    workflow_execution: string;
    workflow_state: string;
    workflow_error?: string | null;
  }>(`/users/${id}/reprovision`);
}

export async function issueWorkEmail(id: string, localPart?: string) {
  return apiClient.post<{
    upn: string;
    created: boolean;
    message: string;
    user: Person;
  }>(`/users/${id}/issue-work-email`, {
    local_part: localPart,
  });
}

export async function getMicrosoft365Licenses(id: string) {
  return apiClient.get<{
    licenses: Microsoft365LicenseItem[];
    user?: {
      id: string;
      userPrincipalName: string;
      accountEnabled: boolean;
    };
  }>(`/users/${id}/microsoft365/licenses`);
}

export async function updateMicrosoft365AccountAction(
  id: string,
  action: "activate" | "deactivate" | "delete",
) {
  return apiClient.post<{
    action: string;
    message: string;
    user: Person;
  }>(`/users/${id}/microsoft365/account-action`, {
    action,
  });
}

export async function assignMicrosoft365Licenses(
  id: string,
  licenses: Microsoft365LicenseKey[],
) {
  return apiClient.post<{
    operation: "assign";
    message: string;
    changed: Array<{
      key: Microsoft365LicenseKey;
      label: string;
      skuPartNumber: string;
      skuId: string;
    }>;
    results: Array<{
      key: string;
      label: string;
      skuPartNumber: string | null;
      status: "success" | "failed";
      reason?: string;
    }>;
    licenses: Microsoft365LicenseItem[];
  }>(`/users/${id}/microsoft365/licenses/assign`, {
    licenses,
  });
}

export async function unassignMicrosoft365Licenses(
  id: string,
  licenses: Microsoft365LicenseKey[],
) {
  return apiClient.post<{
    operation: "unassign";
    message: string;
    changed: Array<{
      key: Microsoft365LicenseKey;
      label: string;
      skuPartNumber: string;
      skuId: string;
    }>;
    results: Array<{
      key: string;
      label: string;
      skuPartNumber: string | null;
      status: "success" | "failed";
      reason?: string;
    }>;
    licenses: Microsoft365LicenseItem[];
  }>(`/users/${id}/microsoft365/licenses/unassign`, {
    licenses,
  });
}

export async function listUserWorkflowRuns(id: string) {
  return apiClient.get<{ runs: WorkflowRun[]; total: number }>(
    `/users/${id}/workflows`,
  );
}

export async function getWorkflowExecutionStatus(executionName: string) {
  return apiClient.get<{ execution: WorkflowExecution }>(
    "/workflows/execution",
    {
      params: { name: executionName },
    },
  );
}

export async function getEffectiveAccess(id: string) {
  return apiClient.get<EffectiveAccessResult>(`/users/${id}/effective-access`);
}
