/** User role hierarchy for the trading system. */
export type UserRole = "viewer" | "operator" | "admin" | "super_admin";

/** User profile from the user management API. */
export interface UserProfile {
  user_id: string;
  email: string;
  display_name: string;
  role: UserRole;
  permissions: string[];
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
  mfa_enabled: boolean;
  provider: string;
}

/** Role definition with permission listing. */
export interface RoleDefinition {
  role: UserRole;
  description: string;
  permissions: string[];
  permission_count: number;
}

/** Permission definition. */
export interface PermissionDefinition {
  permission: string;
  domain: string;
}

/** Request to create a new user. */
export interface CreateUserRequest {
  email: string;
  display_name: string;
  role: UserRole;
  provider?: string;
}

/** Request to update user fields. */
export interface UpdateUserRequest {
  display_name?: string;
  role?: UserRole;
  is_active?: boolean;
  mfa_enabled?: boolean;
}

/** Request to assign a role. */
export interface AssignRoleRequest {
  role: UserRole;
}

/** Role display metadata. */
export const ROLE_LABELS: Record<UserRole, string> = {
  viewer: "Viewer",
  operator: "Operator",
  admin: "Admin",
  super_admin: "Super Admin",
};

/** Role badge variant mapping. */
export const ROLE_VARIANTS: Record<
  UserRole,
  "default" | "running" | "success" | "warning"
> = {
  viewer: "default",
  operator: "running",
  admin: "warning",
  super_admin: "success",
};
