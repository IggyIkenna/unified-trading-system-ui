/**
 * Stateful mock provisioning data — persists in localStorage.
 * Used by mock-handler.ts when NEXT_PUBLIC_MOCK_API=true.
 */

const STORAGE_KEY = "mock-provisioning-state"

export interface MockProvisioningState {
  users: MockUser[]
  requests: MockAccessRequest[]
}

export interface MockUser {
  id: string
  firebase_uid: string
  name: string
  email: string
  role: string
  github_handle?: string
  product_slugs: string[]
  status: "active" | "offboarded" | "pending"
  provisioned_at: string
  last_modified: string
  services: Record<string, string>
  service_messages?: Record<string, string>
  access_template_id?: string
  workflow_failure_reason?: string
}

export interface MockAccessRequest {
  id: string
  requester_email: string
  requester_name: string
  org_id: string
  requested_entitlements: string[]
  requested_role?: string | null
  reason: string
  status: "pending" | "approved" | "denied" | "provisioned"
  admin_note: string
  reviewed_by: string
  created_at: string
  updated_at: string
}

function defaultState(): MockProvisioningState {
  return {
    users: [
      {
        id: "admin", firebase_uid: "admin-uid", name: "Admin", email: "admin@odum.internal",
        role: "admin", github_handle: "odum-admin",
        product_slugs: ["data-pro", "execution-full", "ml-full", "strategy-full", "reporting"],
        status: "active", provisioned_at: "2026-01-10T09:00:00Z", last_modified: "2026-03-20T12:00:00Z",
        services: { github: "provisioned", slack: "provisioned", microsoft365: "provisioned", gcp: "provisioned", aws: "provisioned", portal: "provisioned" },
      },
      {
        id: "internal-trader", firebase_uid: "trader-uid", name: "Internal Trader", email: "trader@odum.internal",
        role: "collaborator", github_handle: "odum-trader",
        product_slugs: ["data-pro", "execution-full", "strategy-full"],
        status: "active", provisioned_at: "2026-01-12T09:00:00Z", last_modified: "2026-03-18T15:00:00Z",
        services: { github: "provisioned", slack: "provisioned", microsoft365: "provisioned", gcp: "provisioned", aws: "provisioned", portal: "provisioned" },
      },
      {
        id: "ops-user", firebase_uid: "ops-uid", name: "Ops Manager", email: "ops@odum.internal",
        role: "operations",
        product_slugs: ["reporting"],
        status: "active", provisioned_at: "2026-02-05T09:00:00Z", last_modified: "2026-03-15T10:00:00Z",
        services: { github: "provisioned", slack: "provisioned", microsoft365: "provisioned", gcp: "provisioned", aws: "provisioned", portal: "provisioned" },
      },
      {
        id: "client-full", firebase_uid: "client-full-uid", name: "Portfolio Manager", email: "pm@alphacapital.com",
        role: "client",
        product_slugs: ["data-pro", "execution-full", "ml-full", "strategy-full", "reporting"],
        status: "active", provisioned_at: "2026-02-20T09:00:00Z", last_modified: "2026-03-10T12:00:00Z",
        services: { github: "not_applicable", slack: "not_applicable", microsoft365: "not_applicable", gcp: "not_applicable", aws: "not_applicable", portal: "provisioned" },
      },
      {
        id: "client-data-only", firebase_uid: "client-basic-uid", name: "Data Analyst", email: "analyst@betafund.com",
        role: "client",
        product_slugs: ["data-basic"],
        status: "active", provisioned_at: "2026-03-01T09:00:00Z", last_modified: "2026-03-01T09:00:00Z",
        services: { github: "not_applicable", slack: "not_applicable", microsoft365: "not_applicable", gcp: "not_applicable", aws: "not_applicable", portal: "provisioned" },
      },
      {
        id: "client-premium", firebase_uid: "client-premium-uid", name: "CIO", email: "cio@vertex.com",
        role: "client",
        product_slugs: ["data-pro", "execution-full", "strategy-full"],
        status: "active", provisioned_at: "2026-02-15T09:00:00Z", last_modified: "2026-03-05T09:00:00Z",
        services: { github: "not_applicable", slack: "not_applicable", microsoft365: "not_applicable", gcp: "not_applicable", aws: "not_applicable", portal: "provisioned" },
      },
    ],
    requests: [
      {
        id: "req-001", requester_email: "newtrader@vertex.com", requester_name: "New Trader",
        org_id: "vertex", requested_entitlements: ["execution-full", "ml-full"],
        reason: "Need execution and ML access for Q2 strategy deployment",
        status: "pending", admin_note: "", reviewed_by: "",
        created_at: "2026-03-22T14:00:00Z", updated_at: "2026-03-22T14:00:00Z",
      },
      {
        id: "req-002", requester_email: "analyst@betafund.com", requester_name: "Beta Researcher",
        org_id: "beta", requested_entitlements: ["data-pro", "strategy-full"],
        reason: "Upgrading from data-basic to run backtests",
        status: "pending", admin_note: "", reviewed_by: "",
        created_at: "2026-03-21T10:00:00Z", updated_at: "2026-03-21T10:00:00Z",
      },
      {
        id: "req-003", requester_email: "ops@alphacapital.com", requester_name: "Alpha Ops Manager",
        org_id: "acme", requested_entitlements: ["reporting"], requested_role: "operations",
        reason: "Need reporting access for compliance audit",
        status: "approved", admin_note: "Approved — compliance requirement", reviewed_by: "admin@odum.internal",
        created_at: "2026-03-19T09:00:00Z", updated_at: "2026-03-20T11:00:00Z",
      },
    ],
  }
}

function loadState(): MockProvisioningState {
  if (typeof window === "undefined") return defaultState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as MockProvisioningState
  } catch { /* ignore */ }
  return defaultState()
}

function saveState(state: MockProvisioningState): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

// Singleton
let _state: MockProvisioningState | null = null

export function getState(): MockProvisioningState {
  if (!_state) _state = loadState()
  return _state
}

function persist(): void {
  if (_state) saveState(_state)
}

// --- Mutations ---

export function addUser(user: MockUser): void {
  getState().users.push(user)
  persist()
}

export function updateUser(uid: string, updates: Partial<MockUser>): MockUser | null {
  const state = getState()
  const idx = state.users.findIndex(u => u.firebase_uid === uid || u.id === uid)
  if (idx === -1) return null
  state.users[idx] = { ...state.users[idx], ...updates, last_modified: new Date().toISOString() }
  persist()
  return state.users[idx]
}

export function addRequest(req: MockAccessRequest): void {
  getState().requests.unshift(req)
  persist()
}

export function updateRequest(id: string, updates: Partial<MockAccessRequest>): MockAccessRequest | null {
  const state = getState()
  const idx = state.requests.findIndex(r => r.id === id)
  if (idx === -1) return null
  state.requests[idx] = { ...state.requests[idx], ...updates, updated_at: new Date().toISOString() }
  persist()
  return state.requests[idx]
}

export function resetState(): void {
  _state = defaultState()
  persist()
}
