import { useState, useEffect, useCallback } from "react";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  assignRole,
  getRoles,
} from "../api/client";
import type {
  UserProfile,
  UserRole,
  RoleDefinition,
  CreateUserRequest,
} from "../types/userTypes";
import { ROLE_LABELS, ROLE_VARIANTS } from "../types/userTypes";
import { Badge } from "./ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogContent } from "./ui/dialog";
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Clock,
  Check,
  X,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { formatDateTime } from "../lib/utils";

export function UserManagementTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, rolesRes] = await Promise.all([getUsers(), getRoles()]);
      setUsers(usersRes.users);
      setRoles(rolesRes.roles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreateUser = async (request: CreateUserRequest) => {
    try {
      await createUser(request);
      setActionMessage(`User ${request.email} created successfully`);
      setShowCreateDialog(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await assignRole(userId, newRole);
      setActionMessage(`Role updated to ${ROLE_LABELS[newRole as UserRole]}`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  const handleToggleActive = async (user: UserProfile) => {
    try {
      if (user.is_active) {
        await deleteUser(user.user_id);
        setActionMessage(`User ${user.email} deactivated`);
      } else {
        await updateUser(user.user_id, { is_active: true });
        setActionMessage(`User ${user.email} reactivated`);
      }
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  const handleUpdateUser = async (
    userId: string,
    updates: { display_name?: string; mfa_enabled?: boolean },
  ) => {
    try {
      await updateUser(userId, updates);
      setActionMessage("User updated successfully");
      setEditingUser(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  // Clear action message after 3 seconds
  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => setActionMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-[var(--color-text-muted)]">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
        Loading users...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[var(--color-accent-cyan)]" />
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            User Management
          </h2>
          <Badge variant="default">{users.length} users</Badge>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void loadData()}
            className="px-3 py-1.5 text-sm rounded-md border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-[var(--color-accent-cyan)] text-black font-medium hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Status messages */}
      {error && (
        <div className="p-3 rounded-lg bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.3)] flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-[var(--color-accent-red)]" />
          <span className="text-sm text-[var(--color-accent-red)]">
            {error}
          </span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {actionMessage && (
        <div className="p-3 rounded-lg bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.3)] flex items-center gap-2">
          <Check className="h-4 w-4 text-[var(--color-accent-green)]" />
          <span className="text-sm text-[var(--color-accent-green)]">
            {actionMessage}
          </span>
        </div>
      )}

      {/* Users table */}
      <div className="border border-[var(--color-border-default)] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                User
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Role
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Last Login
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Provider
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]"
                >
                  No users found. Click &quot;Add User&quot; to create the first
                  user.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.user_id}
                  className={`border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-hover)] ${
                    !user.is_active ? "opacity-50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">
                        {user.display_name}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        void handleRoleChange(user.user_id, e.target.value)
                      }
                      className="text-xs px-2 py-1 rounded border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)]"
                    >
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.is_active ? "success" : "error"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {user.mfa_enabled && (
                      <Badge variant="running" className="ml-1">
                        <Shield className="h-3 w-3 mr-0.5" />
                        MFA
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {user.last_login_at
                        ? formatDateTime(user.last_login_at)
                        : "Never"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{user.provider}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="px-2 py-1 text-xs rounded border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => void handleToggleActive(user)}
                        className={`px-2 py-1 text-xs rounded border ${
                          user.is_active
                            ? "border-[rgba(248,113,113,0.3)] text-[var(--color-accent-red)] hover:bg-[rgba(248,113,113,0.1)]"
                            : "border-[rgba(74,222,128,0.3)] text-[var(--color-accent-green)] hover:bg-[rgba(74,222,128,0.1)]"
                        }`}
                      >
                        {user.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Role reference */}
      {roles.length > 0 && (
        <div className="border border-[var(--color-border-default)] rounded-lg p-4">
          <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3 flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-[var(--color-accent-cyan)]" />
            Role Reference
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {roles.map((role) => (
              <div
                key={role.role}
                className="p-3 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]"
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge variant={ROLE_VARIANTS[role.role]}>
                    {ROLE_LABELS[role.role]}
                  </Badge>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {role.permission_count} perms
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  {role.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create User Dialog */}
      <CreateUserDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateUser}
      />

      {/* Edit User Dialog */}
      {editingUser && (
        <EditUserDialog
          open={true}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={(updates) =>
            void handleUpdateUser(editingUser.user_id, updates)
          }
        />
      )}
    </div>
  );
}

// ── Create User Dialog ──────────────────────────────────────────────────────

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (request: CreateUserRequest) => void;
}

function CreateUserDialog({ open, onClose, onSubmit }: CreateUserDialogProps) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("viewer");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, display_name: displayName, role });
    setEmail("");
    setDisplayName("");
    setRole("viewer");
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader onClose={onClose}>
        <DialogTitle>Add New User</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="user@example.com"
              className="w-full px-3 py-2 rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder="John Doe"
              className="w-full px-3 py-2 rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] text-sm"
            >
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-md bg-[var(--color-accent-cyan)] text-black font-medium hover:opacity-90"
            >
              Create User
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit User Dialog ────────────────────────────────────────────────────────

interface EditUserDialogProps {
  open: boolean;
  user: UserProfile;
  onClose: () => void;
  onSubmit: (updates: { display_name?: string; mfa_enabled?: boolean }) => void;
}

function EditUserDialog({
  open,
  user,
  onClose,
  onSubmit,
}: EditUserDialogProps) {
  const [displayName, setDisplayName] = useState(user.display_name);
  const [mfaEnabled, setMfaEnabled] = useState(user.mfa_enabled);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: { display_name?: string; mfa_enabled?: boolean } = {};
    if (displayName !== user.display_name) updates.display_name = displayName;
    if (mfaEnabled !== user.mfa_enabled) updates.mfa_enabled = mfaEnabled;
    onSubmit(updates);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader onClose={onClose}>
        <DialogTitle>Edit User: {user.email}</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="mfa-enabled"
              checked={mfaEnabled}
              onChange={(e) => setMfaEnabled(e.target.checked)}
              className="rounded border-[var(--color-border-default)]"
            />
            <label
              htmlFor="mfa-enabled"
              className="text-sm text-[var(--color-text-secondary)]"
            >
              MFA Enabled
            </label>
          </div>
          <div className="border-t border-[var(--color-border-subtle)] pt-3">
            <h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase mb-2">
              User Details
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-[var(--color-text-muted)]">
              <div>User ID: {user.user_id}</div>
              <div>Provider: {user.provider}</div>
              <div>Created: {formatDateTime(user.created_at)}</div>
              <div>Permissions: {user.permissions.length}</div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-md bg-[var(--color-accent-cyan)] text-black font-medium hover:opacity-90"
            >
              Save Changes
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
