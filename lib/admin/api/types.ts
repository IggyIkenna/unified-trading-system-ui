export type UserRole =
  | "admin"
  | "internal"
  | "collaborator"
  | "board"
  | "client"
  | "shareholder"
  | "accounting"
  | "operations"
  | "investor";

export const ENTITLEMENTS = [
  "data-basic",
  "data-pro",
  "execution-basic",
  "execution-full",
  "ml-full",
  "strategy-full",
  "reporting",
] as const;

export type Entitlement = (typeof ENTITLEMENTS)[number];
export type EntitlementOrWildcard = Entitlement | "*";

export interface AuthUser {
  id: string;
  firebase_uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  entitlements: readonly EntitlementOrWildcard[];
}

export type UserStatus = "active" | "offboarded" | "pending";
export type ProvisioningStatus =
  | "provisioned"
  | "not_applicable"
  | "pending"
  | "failed";
export type OffboardAction = "deactivate" | "delete";

export interface UserServices {
  github: ProvisioningStatus;
  slack: ProvisioningStatus;
  microsoft365: ProvisioningStatus;
  gcp: ProvisioningStatus;
  aws: ProvisioningStatus;
  portal: ProvisioningStatus;
}

export interface Person {
  id: string;
  firebase_uid: string;
  name: string;
  email: string;
  role: UserRole;
  github_handle?: string;
  microsoft_upn?: string;
  slack_handle?: string;
  gcp_email?: string;
  aws_iam_arn?: string;
  product_slugs: string[];
  access_template_id?: string;
  access_template?: AccessTemplate | null;
  service_messages?: Partial<Record<keyof UserServices, string>>;
  service_synced_at?: Partial<Record<keyof UserServices, string>>;
  workflow_failure_reason?: string;
  status: UserStatus;
  provisioned_at: string;
  last_modified: string;
  services: UserServices;
}

export interface OnboardRequest {
  name: string;
  email: string;
  role: UserRole;
  github_handle?: string;
  product_slugs: string[];
  access_template_id?: string;
}

export interface ProvisioningStep {
  service: keyof UserServices | "firebase";
  label: string;
  status: "pending" | "running" | "success" | "failed";
  message?: string;
}

export interface ModifyUserRequest {
  role?: UserRole;
  github_handle?: string;
  product_slugs?: string[];
  access_template_id?: string;
}

export interface OffboardRequest {
  actions: Record<keyof UserServices | "firebase", OffboardAction>;
}

export interface FirebaseAuthUser {
  uid: string;
  email: string;
  display_name: string;
  disabled: boolean;
  custom_claims?: Record<string, string | boolean | number>;
}

export interface ServiceQuota {
  service: "slack" | "microsoft365";
  used: number;
  limit: number;
  available: number;
}

export interface QuotaCheckResult {
  ok: boolean;
  checks: ServiceQuota[];
  message?: string;
}

export interface AccessTemplate {
  id: string;
  name: string;
  description: string;
  aws_permission_sets: string[];
  slack_channels: string[];
  github_teams: string[];
  assigned_user_count?: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowRun {
  id: string;
  firebase_uid: string;
  run_type: "onboard" | "modify" | "offboard" | "reprovision" | string;
  workflow_name: string;
  execution_name: string;
  status: string;
  execution_error?: string | null;
  execution_result?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowExecution {
  name: string;
  state: string;
  argument?: string;
  result?: string;
  error?: string;
  startTime?: string;
  endTime?: string;
}

export interface HealthCheckItem {
  provider: string;
  ok: boolean;
  message: string;
  details?: unknown;
  checked_at: string;
}

export interface HealthCheckResult {
  ok: boolean;
  checked_at: string;
  checks: HealthCheckItem[];
}

export interface HealthCheckHistoryEntry {
  id: string;
  ok: boolean;
  checked_at: string;
  checks: HealthCheckItem[];
}

export type AppCategory = "ui" | "api" | "service" | "control_plane";
export type AppStatus = "active" | "pending" | "archived";

export interface Application {
  id: string;
  app_id: string;
  name: string;
  repo: string;
  category: AppCategory;
  auth_mode: string;
  environments: string[];
  owner_team: string;
  default_template_id?: string;
  status: AppStatus;
  created_at: string;
  updated_at: string;
}

export interface ApplicationSyncResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  synced_at: string;
}

export interface ApplicationSyncHistoryEntry {
  id: string;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  synced_at: string;
}

export type AppRole = "viewer" | "editor" | "admin" | "owner";

export interface AppEntitlement {
  id: string;
  app_id: string;
  subject_type: "user" | "group";
  subject_id: string;
  subject_label: string;
  role: AppRole;
  capabilities?: string[];
  environments: string[];
  granted_by: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface GrantEntitlementRequest {
  app_id: string;
  subject_type: "user" | "group";
  subject_id: string;
  subject_label: string;
  role: AppRole;
  capabilities?: string[];
  environments: string[];
  granted_by?: string;
  expires_at?: string;
}

export interface RevokeEntitlementRequest {
  entitlement_id: string;
}

export interface UserGroup {
  id: string;
  group_id: string;
  name: string;
  description: string;
  members: GroupMember[];
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  firebase_uid: string;
  name: string;
  email: string;
  added_at: string;
}

export interface EffectiveAccessEntry {
  app_id: string;
  app_name: string;
  app_category: string;
  effective_role: AppRole;
  capabilities: string[];
  direct_grants: AppEntitlement[];
  group_grants: AppEntitlement[];
}

export interface EffectiveAccessResult {
  firebase_uid: string;
  groups: string[];
  effective_access: EffectiveAccessEntry[];
  total_apps: number;
}

export type Microsoft365LicenseKey =
  | "power_automate"
  | "exchange_online"
  | "microsoft_365_business_premium";

export interface Microsoft365LicenseItem {
  key: Microsoft365LicenseKey;
  label: string;
  available: boolean;
  assigned: boolean;
  skuPartNumber: string | null;
  skuId: string | null;
  totalSeats: number | null;
  consumedSeats: number | null;
  remainingSeats: number | null;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  app_id?: string;
  group_id?: string;
  subject_type?: string;
  subject_id?: string;
  firebase_uid?: string;
  role?: string;
  actor: string;
  timestamp: string;
}

export interface BulkAssignResult {
  created: number;
  updated: number;
  errors: string[];
  total_apps: number;
}

export type CapabilityCategory = "view" | "control";

export interface AppCapability {
  key: string;
  label: string;
  category: CapabilityCategory;
}

export interface AppCapabilityDefinition {
  app_id: string;
  capabilities: AppCapability[];
  role_presets: Record<AppRole, string[]>;
  updated_at: string;
}

export interface AuthorizeResult {
  authorized: boolean;
  role: AppRole | null;
  capabilities: string[];
  source: "direct" | "group" | "none";
  environments: string[];
}

export type GitHubRepoRole = "pull" | "triage" | "push" | "maintain" | "admin";

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  default_branch: string;
  language: string | null;
  archived: boolean;
  updated_at: string;
}

export interface GitHubRepoAssignment {
  id: string;
  firebase_uid: string;
  github_handle: string;
  repo_full_name: string;
  role: GitHubRepoRole;
  granted_by: string;
  created_at: string;
  updated_at: string;
}

export interface GitHubDiscoveryResult {
  repos: GitHubRepo[];
  total: number;
  org: string;
  discovered_at: string;
}

export interface GitHubAccessScanRepo {
  repo_full_name: string;
  permission: string;
}

export interface GitHubAccessScanResult {
  github_handle: string;
  scanned_total: number;
  accessible_total: number;
  accessible_repos: GitHubAccessScanRepo[];
  errors: string[];
}
