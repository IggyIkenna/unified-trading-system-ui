/**
 * AccountConnectivityConfig — API keys, wallets, signers, and venue accounts.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan.md §4.8.6.
 *
 * Connectivity is its OWN config layer — distinct from execution config,
 * risk config, or treasury config. The reason: rotating an API key shouldn't
 * version-bump the strategy. Adding a wallet to a whitelist shouldn't
 * trigger a re-promotion.
 *
 * Ownership table (§4.8.6):
 *   Admin / Ops               — owner
 *   Research                  — reads (eligibility only — "can this strategy
 *                                use Binance? Aave?")
 *   Promote                   — validates (verifies bundle's required venues
 *                                are all connected before approving)
 *   Terminal                  — uses (live order routing reads the active
 *                                config; rotation is transparent)
 *   Reports                   — audit only
 *
 * Phase 1B SCOPE: typed object only — no UI, no registry. The Admin / Ops
 * surface wires editing in Phase 9.
 *
 * Security note: this file ONLY models the typed shape. Actual secrets
 * (API key bytes, private key bytes) NEVER live in cockpit state — they sit
 * in Secret Manager / hardware-signing. The cockpit references them by
 * `*Ref` opaque ids that resolve in the execution-service layer.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Connectivity status per leg (read by Promote validation + Terminal routing)
// ─────────────────────────────────────────────────────────────────────────────

export type ConnectivityStatus = "connected" | "degraded" | "disconnected" | "unknown";

// ─────────────────────────────────────────────────────────────────────────────
// CeFi API account
// ─────────────────────────────────────────────────────────────────────────────

export interface CefiVenueAccount {
  readonly accountId: string;
  /** Venue id from the venue registry (e.g. "binance", "okx", "coinbase"). */
  readonly venueId: string;
  /** Opaque reference into Secret Manager — NEVER the raw key. */
  readonly apiKeyRef: string;
  readonly apiSecretRef: string;
  /** Optional sub-account label for venues that support sub-accounts. */
  readonly subaccount?: string;
  /** Permissions granted to the key (read-only, trade, withdraw, etc.). */
  readonly permissions: readonly ("read" | "trade" | "withdraw" | "transfer")[];
  readonly status: ConnectivityStatus;
  /** Mandate / share class this account is bound to. */
  readonly accountOrMandateId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DeFi wallet
// ─────────────────────────────────────────────────────────────────────────────

export type WalletSignerKind = "hot_eoa" | "hardware_eoa" | "smart_account" | "multisig";

export interface DefiWallet {
  readonly walletId: string;
  /** EVM address or chain-equivalent. */
  readonly address: string;
  /** Chain id from the chain registry (e.g. 1 mainnet, 8453 base, 42161 arb). */
  readonly chainId: number;
  /**
   * Opaque reference to the signing material. Hot-EOA → Secret Manager;
   * hardware-EOA → device serial; smart-account → factory-deployed address;
   * multisig → safe id.
   */
  readonly signerRef: string;
  readonly signerKind: WalletSignerKind;
  /** Approved protocols this wallet may transact with (whitelist). */
  readonly approvedProtocols: readonly string[];
  readonly status: ConnectivityStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// External signer (HSM / hardware / cloud KMS) — referenced by signerRef
// ─────────────────────────────────────────────────────────────────────────────

export type SignerProvider = "aws_kms" | "gcp_kms" | "ledger" | "trezor" | "fireblocks" | "secret_manager";

export interface SignerProfile {
  readonly signerProfileId: string;
  readonly provider: SignerProvider;
  /** Provider-specific reference (KMS key id, device serial, vault account). */
  readonly providerRef: string;
  readonly status: ConnectivityStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// Outbound webhook / signal-receiver endpoint (Signals-Out)
// ─────────────────────────────────────────────────────────────────────────────

export interface OutboundEndpoint {
  readonly endpointId: string;
  readonly counterpartyId: string;
  /** Endpoint URL. Stored in plain text — auth is via header signing. */
  readonly url: string;
  /** Opaque reference to the HMAC / API token used to sign / authorise. */
  readonly authTokenRef: string;
  readonly status: ConnectivityStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// AccountConnectivityConfig
// ─────────────────────────────────────────────────────────────────────────────

export interface AccountConnectivityConfig {
  readonly connectivityConfigId: string;

  /** All CeFi venue accounts available to this org/mandate. */
  readonly cefiAccounts: readonly CefiVenueAccount[];
  /** All DeFi wallets available. */
  readonly defiWallets: readonly DefiWallet[];
  /** Signer profiles referenced by `cefiAccounts.apiKeyRef` / `defiWallets.signerRef`. */
  readonly signerProfiles: readonly SignerProfile[];
  /** Outbound endpoints (Signals-Out counterparty receivers). */
  readonly outboundEndpoints: readonly OutboundEndpoint[];

  // Audit.
  readonly lastUpdatedBy: string;
  readonly lastUpdatedAt: string;
  readonly lastAuditEventId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Eligibility helpers (read by Research / Promote validation)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * True iff the connectivity config has a CONNECTED CeFi account for every
 * venue in `requiredVenueIds`. Promote's validation gate uses this to refuse
 * approval when a bundle references venues that aren't reachable.
 */
export function hasCefiAccountsForVenues(
  config: Pick<AccountConnectivityConfig, "cefiAccounts">,
  requiredVenueIds: readonly string[],
): boolean {
  if (requiredVenueIds.length === 0) return true;
  const connected = new Set(
    config.cefiAccounts.filter((a) => a.status === "connected").map((a) => a.venueId),
  );
  return requiredVenueIds.every((v) => connected.has(v));
}

/**
 * True iff the connectivity config has at least one CONNECTED DeFi wallet
 * approved for every protocol in `requiredProtocolIds`.
 */
export function hasDefiWalletsForProtocols(
  config: Pick<AccountConnectivityConfig, "defiWallets">,
  requiredProtocolIds: readonly string[],
): boolean {
  if (requiredProtocolIds.length === 0) return true;
  const connected = config.defiWallets.filter((w) => w.status === "connected");
  return requiredProtocolIds.every((p) => connected.some((w) => w.approvedProtocols.includes(p)));
}
