export type ProvisioningRole =
  | "admin"
  | "collaborator"
  | "board"
  | "client"
  | "shareholder"
  | "accounting"
  | "operations"
  | "investor"

export type ProvisioningStatus = "provisioned" | "not_applicable" | "pending" | "failed"
export type OffboardAction = "deactivate" | "delete"

export interface UserServices {
  github: ProvisioningStatus
  slack: ProvisioningStatus
  microsoft365: ProvisioningStatus
  gcp: ProvisioningStatus
  aws: ProvisioningStatus
  portal: ProvisioningStatus
}

export interface AccessTemplate {
  id: string
  name: string
  description: string
  aws_permission_sets: string[]
  slack_channels: string[]
  github_teams: string[]
  assigned_user_count?: number
  created_at: string
  updated_at: string
}

export interface ProvisionedPerson {
  id: string
  firebase_uid: string
  name: string
  email: string
  role: ProvisioningRole
  github_handle?: string
  microsoft_upn?: string
  slack_handle?: string
  gcp_email?: string
  aws_iam_arn?: string
  product_slugs: string[]
  access_template_id?: string
  access_template?: AccessTemplate | null
  service_messages?: Partial<Record<keyof UserServices, string>>
  workflow_failure_reason?: string
  status: "active" | "offboarded" | "pending"
  provisioned_at: string
  last_modified: string
  services: UserServices
}

export interface OnboardRequest {
  name: string
  email: string
  role: ProvisioningRole
  github_handle?: string
  product_slugs: string[]
  access_template_id?: string
}

export interface ModifyUserRequest {
  role?: ProvisioningRole
  github_handle?: string
  product_slugs?: string[]
  access_template_id?: string
}

export interface OffboardRequest {
  actions: Record<string, OffboardAction>
}

export interface ProvisioningStep {
  service: string
  label: string
  status: "pending" | "running" | "success" | "failed"
  message?: string
}

export interface ServiceQuota {
  service: "slack" | "microsoft365"
  used: number
  limit: number
  available: number
}

export interface QuotaCheckResult {
  ok: boolean
  checks: ServiceQuota[]
  message?: string
}

export interface WorkflowRun {
  id: string
  firebase_uid: string
  run_type: string
  workflow_name: string
  execution_name: string
  status: string
  created_at: string
  updated_at: string
}

export interface WorkflowExecution {
  name: string
  state: string
  argument?: string
  result?: string
  error?: string
  start_time?: string
  end_time?: string
}

export interface HealthCheckItem {
  provider: string
  ok: boolean
  message: string
  details?: Record<string, string>
  checked_at: string
}

export interface HealthCheckResult {
  ok: boolean
  checked_at: string
  checks: HealthCheckItem[]
}

export interface HealthCheckHistoryEntry {
  id: string
  ok: boolean
  checked_at: string
  checks: HealthCheckItem[]
}

export type AccessRequestStatus = "pending" | "approved" | "denied" | "provisioned"

export interface AccessRequest {
  id: string
  requester_email: string
  requester_name: string
  org_id: string
  requested_entitlements: string[]
  requested_role?: ProvisioningRole | null
  reason: string
  status: AccessRequestStatus
  admin_note: string
  reviewed_by: string
  created_at: string
  updated_at: string
}

export interface Permission {
  key: string
  label: string
  description: string
  internal_only: boolean
}

export interface PermissionCategory {
  key: string
  label: string
  description: string
  permissions: Permission[]
}

export interface PermissionDomain {
  key: string
  label: string
  description: string
  icon: string
  categories: PermissionCategory[]
}
