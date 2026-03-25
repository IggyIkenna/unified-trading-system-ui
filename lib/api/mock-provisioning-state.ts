/**
 * Stateful mock provisioning data — persists in localStorage.
 * Used by mock-handler.ts when NEXT_PUBLIC_MOCK_API=true.
 */

const STORAGE_KEY = "mock-provisioning-state";

export interface MockOrganization {
  id: string;
  name: string;
  slug: string;
  type: "external";
  contact_email: string;
  contact_name: string;
  status: "onboarding" | "active" | "suspended";
  tier: string;
  api_keys: MockVenueApiKey[];
  created_at: string;
  updated_at: string;
}

export interface MockVenueApiKey {
  id: string;
  venue: string;
  label: string;
  api_key_masked: string;
  status: "active" | "revoked" | "expired";
  added_at: string;
}

export interface MockProvisioningState {
  users: MockUser[];
  requests: MockAccessRequest[];
  organizations: MockOrganization[];
}

export interface MockUser {
  id: string;
  firebase_uid: string;
  name: string;
  email: string;
  role: string;
  org_id?: string;
  github_handle?: string;
  product_slugs: string[];
  status: "active" | "offboarded" | "pending";
  provisioned_at: string;
  last_modified: string;
  services: Record<string, string>;
  service_messages?: Record<string, string>;
  access_template_id?: string;
  workflow_failure_reason?: string;
}

export interface MockAccessRequest {
  id: string;
  requester_email: string;
  requester_name: string;
  org_id: string;
  requested_entitlements: string[];
  requested_role?: string | null;
  reason: string;
  status: "pending" | "approved" | "denied" | "provisioned";
  admin_note: string;
  reviewed_by: string;
  created_at: string;
  updated_at: string;
}

function defaultState(): MockProvisioningState {
  return {
    users: [
      {
        id: "admin",
        firebase_uid: "admin-uid",
        name: "Admin",
        email: "admin@odum.internal",
        role: "admin",
        github_handle: "odum-admin",
        product_slugs: [
          "data-pro",
          "execution-full",
          "ml-full",
          "strategy-full",
          "reporting",
        ],
        status: "active",
        provisioned_at: "2026-01-10T09:00:00Z",
        last_modified: "2026-03-20T12:00:00Z",
        services: {
          github: "provisioned",
          slack: "provisioned",
          microsoft365: "provisioned",
          gcp: "provisioned",
          aws: "provisioned",
          portal: "provisioned",
        },
      },
      {
        id: "internal-trader",
        firebase_uid: "trader-uid",
        name: "Internal Trader",
        email: "trader@odum.internal",
        role: "collaborator",
        github_handle: "odum-trader",
        product_slugs: ["data-pro", "execution-full", "strategy-full"],
        status: "active",
        provisioned_at: "2026-01-12T09:00:00Z",
        last_modified: "2026-03-18T15:00:00Z",
        services: {
          github: "provisioned",
          slack: "provisioned",
          microsoft365: "provisioned",
          gcp: "provisioned",
          aws: "provisioned",
          portal: "provisioned",
        },
      },
      {
        id: "ops-user",
        firebase_uid: "ops-uid",
        name: "Ops Manager",
        email: "ops@odum.internal",
        role: "operations",
        product_slugs: ["reporting"],
        status: "active",
        provisioned_at: "2026-02-05T09:00:00Z",
        last_modified: "2026-03-15T10:00:00Z",
        services: {
          github: "provisioned",
          slack: "provisioned",
          microsoft365: "provisioned",
          gcp: "provisioned",
          aws: "provisioned",
          portal: "provisioned",
        },
      },
      {
        id: "client-full",
        firebase_uid: "client-full-uid",
        name: "Portfolio Manager",
        email: "pm@alphacapital.com",
        role: "client",
        org_id: "org-alpha",
        product_slugs: [
          "data-pro",
          "execution-full",
          "ml-full",
          "strategy-full",
          "reporting",
        ],
        status: "active",
        provisioned_at: "2026-02-20T09:00:00Z",
        last_modified: "2026-03-10T12:00:00Z",
        services: {
          github: "not_applicable",
          slack: "not_applicable",
          microsoft365: "not_applicable",
          gcp: "not_applicable",
          aws: "not_applicable",
          portal: "provisioned",
        },
      },
      {
        id: "client-data-only",
        firebase_uid: "client-basic-uid",
        name: "Data Analyst",
        email: "analyst@betafund.com",
        role: "client",
        product_slugs: ["data-basic"],
        status: "active",
        provisioned_at: "2026-03-01T09:00:00Z",
        last_modified: "2026-03-01T09:00:00Z",
        services: {
          github: "not_applicable",
          slack: "not_applicable",
          microsoft365: "not_applicable",
          gcp: "not_applicable",
          aws: "not_applicable",
          portal: "provisioned",
        },
      },
      {
        id: "client-premium",
        firebase_uid: "client-premium-uid",
        name: "CIO",
        email: "cio@vertex.com",
        role: "client",
        org_id: "org-vertex",
        product_slugs: ["data-pro", "execution-full", "strategy-full"],
        status: "active",
        provisioned_at: "2026-02-15T09:00:00Z",
        last_modified: "2026-03-05T09:00:00Z",
        services: {
          github: "not_applicable",
          slack: "not_applicable",
          microsoft365: "not_applicable",
          gcp: "not_applicable",
          aws: "not_applicable",
          portal: "provisioned",
        },
      },
    ],
    organizations: [
      {
        id: "org-alpha",
        name: "Alpha Capital",
        slug: "alpha-capital",
        type: "external",
        contact_email: "pm@alphacapital.com",
        contact_name: "Portfolio Manager",
        status: "active",
        tier: "Full Platform",
        api_keys: [
          {
            id: "key-1",
            venue: "Binance",
            label: "Main Trading",
            api_key_masked: "****...a3f2",
            status: "active",
            added_at: "2026-02-25T10:00:00Z",
          },
          {
            id: "key-2",
            venue: "OKX",
            label: "Secondary",
            api_key_masked: "****...b7e1",
            status: "active",
            added_at: "2026-03-01T14:00:00Z",
          },
        ],
        created_at: "2026-02-20T09:00:00Z",
        updated_at: "2026-03-10T12:00:00Z",
      },
      {
        id: "org-vertex",
        name: "Vertex Partners",
        slug: "vertex-partners",
        type: "external",
        contact_email: "cio@vertex.com",
        contact_name: "CIO",
        status: "active",
        tier: "Execution + Strategy",
        api_keys: [
          {
            id: "key-3",
            venue: "Deribit",
            label: "Options Desk",
            api_key_masked: "****...c9d4",
            status: "active",
            added_at: "2026-02-18T11:00:00Z",
          },
        ],
        created_at: "2026-02-15T09:00:00Z",
        updated_at: "2026-03-05T09:00:00Z",
      },
    ],
    requests: [
      {
        id: "req-001",
        requester_email: "newtrader@vertex.com",
        requester_name: "New Trader",
        org_id: "vertex",
        requested_entitlements: ["execution-full", "ml-full"],
        reason: "Need execution and ML access for Q2 strategy deployment",
        status: "pending",
        admin_note: "",
        reviewed_by: "",
        created_at: "2026-03-22T14:00:00Z",
        updated_at: "2026-03-22T14:00:00Z",
      },
      {
        id: "req-002",
        requester_email: "analyst@betafund.com",
        requester_name: "Beta Researcher",
        org_id: "beta",
        requested_entitlements: ["data-pro", "strategy-full"],
        reason: "Upgrading from data-basic to run backtests",
        status: "pending",
        admin_note: "",
        reviewed_by: "",
        created_at: "2026-03-21T10:00:00Z",
        updated_at: "2026-03-21T10:00:00Z",
      },
      {
        id: "req-003",
        requester_email: "ops@alphacapital.com",
        requester_name: "Alpha Ops Manager",
        org_id: "acme",
        requested_entitlements: ["reporting"],
        requested_role: "operations",
        reason: "Need reporting access for compliance audit",
        status: "approved",
        admin_note: "Approved — compliance requirement",
        reviewed_by: "admin@odum.internal",
        created_at: "2026-03-19T09:00:00Z",
        updated_at: "2026-03-20T11:00:00Z",
      },
    ],
  };
}

function loadState(): MockProvisioningState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MockProvisioningState;
  } catch {
    /* ignore */
  }
  return defaultState();
}

function saveState(state: MockProvisioningState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Singleton
let _state: MockProvisioningState | null = null;

export function getState(): MockProvisioningState {
  if (!_state) _state = loadState();
  return _state;
}

function persist(): void {
  if (_state) saveState(_state);
}

// --- Mutations ---

export function addUser(user: MockUser): void {
  getState().users.push(user);
  persist();
}

export function updateUser(
  uid: string,
  updates: Partial<MockUser>,
): MockUser | null {
  const state = getState();
  const idx = state.users.findIndex(
    (u) => u.firebase_uid === uid || u.id === uid,
  );
  if (idx === -1) return null;
  state.users[idx] = {
    ...state.users[idx],
    ...updates,
    last_modified: new Date().toISOString(),
  };
  persist();
  return state.users[idx];
}

export function addRequest(req: MockAccessRequest): void {
  getState().requests.unshift(req);
  persist();
}

export function updateRequest(
  id: string,
  updates: Partial<MockAccessRequest>,
): MockAccessRequest | null {
  const state = getState();
  const idx = state.requests.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  state.requests[idx] = {
    ...state.requests[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  persist();
  return state.requests[idx];
}

// --- Organization mutations ---

export function addOrganization(org: MockOrganization): void {
  getState().organizations.push(org);
  persist();
}

export function updateOrganization(
  id: string,
  updates: Partial<MockOrganization>,
): MockOrganization | null {
  const state = getState();
  const idx = state.organizations.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  state.organizations[idx] = {
    ...state.organizations[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  persist();
  return state.organizations[idx];
}

export function addApiKey(
  orgId: string,
  key: MockVenueApiKey,
): MockOrganization | null {
  const state = getState();
  const org = state.organizations.find((o) => o.id === orgId);
  if (!org) return null;
  org.api_keys.push(key);
  org.updated_at = new Date().toISOString();
  persist();
  return org;
}

export function removeApiKey(
  orgId: string,
  keyId: string,
): MockOrganization | null {
  const state = getState();
  const org = state.organizations.find((o) => o.id === orgId);
  if (!org) return null;
  const keyIdx = org.api_keys.findIndex((k) => k.id === keyId);
  if (keyIdx !== -1) {
    org.api_keys[keyIdx].status = "revoked";
    org.updated_at = new Date().toISOString();
    persist();
  }
  return org;
}

export function resetState(): void {
  _state = defaultState();
  persist();
}
