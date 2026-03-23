/**
 * Stateful mock onboarding data — persists in localStorage.
 * Used by mock-handler.ts when NEXT_PUBLIC_MOCK_API=true.
 */

const STORAGE_KEY = "mock-onboarding-state"

export interface OnboardingApplication {
  id: string
  applicant_user_id: string
  applicant_name: string
  applicant_email: string
  org_name: string
  desired_product_slugs: string[]
  subscription_tier: "basic" | "professional" | "institutional" | "enterprise"
  status: "draft" | "submitted" | "in_review" | "approved" | "rejected"
  submitted_at: string | null
  reviewer_id: string | null
  review_note: string
  correlation_id: string
  created_at: string
  updated_at: string
}

export interface DocumentArtifact {
  id: string
  application_id: string
  doc_type: "proof_of_address" | "identity" | "management_agreement" | "invoice_or_tax" | "other"
  file_name: string
  uploaded_at: string
  review_status: "pending" | "accepted" | "rejected"
  review_note: string
}

interface OnboardingState {
  applications: OnboardingApplication[]
  documents: DocumentArtifact[]
}

function defaultState(): OnboardingState {
  return {
    applications: [
      {
        id: "onb-001",
        applicant_user_id: "uid-gamma-fm",
        applicant_name: "New Fund Manager",
        applicant_email: "fm@gammainvestments.com",
        org_name: "Gamma Investments",
        desired_product_slugs: ["data-pro", "execution-full", "strategy-full"],
        subscription_tier: "institutional",
        status: "submitted",
        submitted_at: "2026-03-18T14:00:00Z",
        reviewer_id: null,
        review_note: "",
        correlation_id: "corr-onb-001",
        created_at: "2026-03-17T10:00:00Z",
        updated_at: "2026-03-18T14:00:00Z",
      },
      {
        id: "onb-002",
        applicant_user_id: "uid-delta-lead",
        applicant_name: "DeFi Desk Lead",
        applicant_email: "lead@deltaprotocol.io",
        org_name: "Delta Protocol",
        desired_product_slugs: ["data-pro", "execution-full"],
        subscription_tier: "professional",
        status: "in_review",
        submitted_at: "2026-03-15T09:00:00Z",
        reviewer_id: "admin",
        review_note: "",
        correlation_id: "corr-onb-002",
        created_at: "2026-03-14T11:00:00Z",
        updated_at: "2026-03-20T16:00:00Z",
      },
    ],
    documents: [
      {
        id: "doc-001",
        application_id: "onb-001",
        doc_type: "proof_of_address",
        file_name: "gamma_poa_utility_bill.pdf",
        uploaded_at: "2026-03-17T10:30:00Z",
        review_status: "pending",
        review_note: "",
      },
      {
        id: "doc-002",
        application_id: "onb-001",
        doc_type: "identity",
        file_name: "gamma_fm_passport.pdf",
        uploaded_at: "2026-03-17T10:35:00Z",
        review_status: "pending",
        review_note: "",
      },
      {
        id: "doc-003",
        application_id: "onb-002",
        doc_type: "proof_of_address",
        file_name: "delta_registered_address.pdf",
        uploaded_at: "2026-03-14T11:15:00Z",
        review_status: "accepted",
        review_note: "Verified — matches company registry",
      },
      {
        id: "doc-004",
        application_id: "onb-002",
        doc_type: "identity",
        file_name: "delta_lead_passport.pdf",
        uploaded_at: "2026-03-14T11:20:00Z",
        review_status: "accepted",
        review_note: "Verified",
      },
      {
        id: "doc-005",
        application_id: "onb-002",
        doc_type: "management_agreement",
        file_name: "delta_ima_draft_v2.pdf",
        uploaded_at: "2026-03-15T08:00:00Z",
        review_status: "pending",
        review_note: "",
      },
    ],
  }
}

function loadState(): OnboardingState {
  if (typeof window === "undefined") return defaultState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as OnboardingState
  } catch { /* ignore */ }
  return defaultState()
}

function saveState(state: OnboardingState): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

let _state: OnboardingState | null = null

export function getOnboardingState(): OnboardingState {
  if (!_state) _state = loadState()
  return _state
}

function persist(): void {
  if (_state) saveState(_state)
}

export function addApplication(app: OnboardingApplication): void {
  getOnboardingState().applications.push(app)
  persist()
}

export function updateApplication(id: string, updates: Partial<OnboardingApplication>): OnboardingApplication | null {
  const state = getOnboardingState()
  const idx = state.applications.findIndex(a => a.id === id)
  if (idx === -1) return null
  state.applications[idx] = { ...state.applications[idx], ...updates, updated_at: new Date().toISOString() }
  persist()
  return state.applications[idx]
}

export function addDocument(doc: DocumentArtifact): void {
  getOnboardingState().documents.push(doc)
  persist()
}

export function updateDocument(id: string, updates: Partial<DocumentArtifact>): DocumentArtifact | null {
  const state = getOnboardingState()
  const idx = state.documents.findIndex(d => d.id === id)
  if (idx === -1) return null
  state.documents[idx] = { ...state.documents[idx], ...updates }
  persist()
  return state.documents[idx]
}

export function resetOnboardingState(): void {
  _state = defaultState()
  persist()
}
