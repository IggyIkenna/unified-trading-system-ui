import { describe, expect, it } from "vitest";

import {
  hasCefiAccountsForVenues,
  hasDefiWalletsForProtocols,
  type AccountConnectivityConfig,
  type CefiVenueAccount,
  type DefiWallet,
} from "@/lib/architecture-v2/account-connectivity-config";

function makeCefiAccount(overrides: Partial<CefiVenueAccount> = {}): CefiVenueAccount {
  return {
    accountId: "acc-1",
    venueId: "binance",
    apiKeyRef: "sm://binance-key",
    apiSecretRef: "sm://binance-secret",
    permissions: ["read", "trade"],
    status: "connected",
    ...overrides,
  };
}

function makeDefiWallet(overrides: Partial<DefiWallet> = {}): DefiWallet {
  return {
    walletId: "wallet-1",
    address: "0x1234",
    chainId: 1,
    signerRef: "sm://signer-1",
    signerKind: "hot_eoa",
    approvedProtocols: ["aave", "uniswap"],
    status: "connected",
    ...overrides,
  };
}

describe("hasCefiAccountsForVenues — Promote validation gate", () => {
  it("returns true when every required venue is connected", () => {
    const config: Pick<AccountConnectivityConfig, "cefiAccounts"> = {
      cefiAccounts: [makeCefiAccount({ venueId: "binance" }), makeCefiAccount({ venueId: "okx" })],
    };
    expect(hasCefiAccountsForVenues(config, ["binance", "okx"])).toBe(true);
  });

  it("returns false when a required venue is missing", () => {
    const config: Pick<AccountConnectivityConfig, "cefiAccounts"> = {
      cefiAccounts: [makeCefiAccount({ venueId: "binance" })],
    };
    expect(hasCefiAccountsForVenues(config, ["binance", "okx"])).toBe(false);
  });

  it("returns false when a required venue is disconnected (must be CONNECTED)", () => {
    const config: Pick<AccountConnectivityConfig, "cefiAccounts"> = {
      cefiAccounts: [makeCefiAccount({ venueId: "binance", status: "disconnected" })],
    };
    expect(hasCefiAccountsForVenues(config, ["binance"])).toBe(false);
  });

  it("returns false when a required venue is degraded (degraded ≠ connected)", () => {
    const config: Pick<AccountConnectivityConfig, "cefiAccounts"> = {
      cefiAccounts: [makeCefiAccount({ venueId: "binance", status: "degraded" })],
    };
    expect(hasCefiAccountsForVenues(config, ["binance"])).toBe(false);
  });

  it("returns true with no required venues (vacuous)", () => {
    const config: Pick<AccountConnectivityConfig, "cefiAccounts"> = { cefiAccounts: [] };
    expect(hasCefiAccountsForVenues(config, [])).toBe(true);
  });
});

describe("hasDefiWalletsForProtocols — Promote validation gate", () => {
  it("returns true when at least one connected wallet covers each protocol", () => {
    const config: Pick<AccountConnectivityConfig, "defiWallets"> = {
      defiWallets: [makeDefiWallet({ approvedProtocols: ["aave", "uniswap"] })],
    };
    expect(hasDefiWalletsForProtocols(config, ["aave", "uniswap"])).toBe(true);
  });

  it("returns true when wallets are spread across protocols (each protocol covered by some wallet)", () => {
    const config: Pick<AccountConnectivityConfig, "defiWallets"> = {
      defiWallets: [
        makeDefiWallet({ walletId: "w-aave", approvedProtocols: ["aave"] }),
        makeDefiWallet({ walletId: "w-uniswap", approvedProtocols: ["uniswap"] }),
      ],
    };
    expect(hasDefiWalletsForProtocols(config, ["aave", "uniswap"])).toBe(true);
  });

  it("returns false when a required protocol has no approved wallet", () => {
    const config: Pick<AccountConnectivityConfig, "defiWallets"> = {
      defiWallets: [makeDefiWallet({ approvedProtocols: ["aave"] })],
    };
    expect(hasDefiWalletsForProtocols(config, ["aave", "uniswap"])).toBe(false);
  });

  it("returns false when the only wallet covering a protocol is disconnected", () => {
    const config: Pick<AccountConnectivityConfig, "defiWallets"> = {
      defiWallets: [
        makeDefiWallet({
          approvedProtocols: ["aave"],
          status: "disconnected",
        }),
      ],
    };
    expect(hasDefiWalletsForProtocols(config, ["aave"])).toBe(false);
  });
});

describe("AccountConnectivityConfig — type-shape spot check", () => {
  it("constructs a minimal compliant config", () => {
    const config: AccountConnectivityConfig = {
      connectivityConfigId: "ac-2026.04.29",
      cefiAccounts: [makeCefiAccount()],
      defiWallets: [makeDefiWallet()],
      signerProfiles: [
        {
          signerProfileId: "sp-aws",
          provider: "aws_kms",
          providerRef: "arn:aws:kms:...",
          status: "connected",
        },
      ],
      outboundEndpoints: [],
      lastUpdatedBy: "ops-admin",
      lastUpdatedAt: "2026-04-29T12:00:00Z",
      lastAuditEventId: "evt-001",
    };
    expect(config.cefiAccounts).toHaveLength(1);
    expect(config.signerProfiles[0].provider).toBe("aws_kms");
  });
});
