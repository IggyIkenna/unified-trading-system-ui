import { apiClient } from "@/lib/admin/api/client";
import type { AccessTemplate } from "@/lib/admin/api/types";

export async function listAccessTemplates() {
  return apiClient.get<{ templates: AccessTemplate[] }>("/access-templates");
}

export async function createAccessTemplate(
  data: Omit<
    AccessTemplate,
    "id" | "created_at" | "updated_at" | "assigned_user_count"
  >,
) {
  return apiClient.post<{ template: AccessTemplate }>(
    "/access-templates",
    data,
  );
}

export async function updateAccessTemplate(
  id: string,
  data: Partial<Omit<AccessTemplate, "id" | "created_at" | "updated_at">>,
) {
  return apiClient.put<{ template: AccessTemplate }>(
    `/access-templates/${id}`,
    data,
  );
}

export async function deleteAccessTemplate(id: string) {
  return apiClient.delete<void>(`/access-templates/${id}`);
}
