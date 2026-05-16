/**
 * Plan D Phase 4 — Admin "Strategy Version Approvals" queue page tests.
 *
 * Page under test: app/(ops)/approvals/strategy-versions/page.tsx
 *
 * The page polls listPendingApprovalVersions() (mock store) every 30s and
 * renders Approve / Reject / Rollout actions per row. Approval below the
 * backtest_1yr maturity floor surfaces ApprovalBelowFloorError (HTTP 412)
 * server-side; the page catches and renders an error banner.
 *
 * NOTE on coverage relative to plan §p4-ui-tests:
 *   - "Approve disabled when maturity < backtest_1yr" — the actual UI does
 *     not gate the button on maturity client-side; the API enforces with a
 *     412. We assert the SHIPPED behaviour (error banner) and tag this as
 *     a UX follow-up rather than fudging the test.
 *   - "Backtest_series link" — not yet rendered as a column on the page;
 *     `backtest_series_ref` is only constructed inside handleApprove. We
 *     therefore replace this case with explicit assertion of the row's
 *     three actions, which is the load-bearing UX for v0.
 */

import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ApprovalBelowFloorError,
  type StrategyMaturityPhase,
  type VersionRecord,
  type VersionStatus,
} from "@/lib/api/strategy-versions";

// Mocks must be declared BEFORE the page import so vi.mock hoists correctly.
const approveSpy = vi.fn();
const rejectSpy = vi.fn();
const rolloutSpy = vi.fn();

vi.mock("@/lib/api/strategy-versions", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/strategy-versions")>("@/lib/api/strategy-versions");
  return {
    ...actual,
    approveVersion: (...args: unknown[]) => approveSpy(...args),
    rejectVersion: (...args: unknown[]) => rejectSpy(...args),
    rolloutVersion: (...args: unknown[]) => rolloutSpy(...args),
  };
});

// Control the queue contents directly. The page's useVersionsQueue() reads
// from listPendingApprovalVersions on mount + every 30s; we keep a mutable
// list and let the second tick (driven by setInterval) re-render.
let mockQueue: VersionRecord[] = [];
const transitionSpy = vi.fn();
vi.mock("@/lib/api/mocks/strategy-versions.mock", () => ({
  listPendingApprovalVersions: () => mockQueue.slice(),
  mockTransitionStatus: (...args: unknown[]) => transitionSpy(...args),
}));

// next/link → plain <a> so href assertions are trivial.
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import StrategyVersionApprovalsPage from "@/app/(ops)/approvals/strategy-versions/page";

function makeVersion(overrides: Partial<VersionRecord> = {}): VersionRecord {
  return {
    version_id: "v_alpha",
    parent_instance_id: "ML_DIRECTIONAL@binance-btc-usdt-5m-prod",
    parent_version_id: "v_genesis",
    maturity_phase: "backtest_1yr" as StrategyMaturityPhase,
    status: "pending_approval" as VersionStatus,
    authored_by: "client_a",
    ...overrides,
  } as VersionRecord;
}

describe("StrategyVersionApprovalsPage (Plan D Phase 4)", () => {
  beforeEach(() => {
    mockQueue = [];
    approveSpy.mockReset();
    rejectSpy.mockReset();
    rolloutSpy.mockReset();
    transitionSpy.mockReset();
  });

  afterEach(() => {
    // Restore prompt if a test stubbed it.
    vi.restoreAllMocks();
  });

  it("Case 1 — empty queue renders the empty-queue copy", async () => {
    mockQueue = [];
    render(<StrategyVersionApprovalsPage />);
    await waitFor(() => {
      expect(screen.getByTestId("empty-queue")).toBeInTheDocument();
    });
    expect(screen.getByTestId("empty-queue")).toHaveTextContent(/No pending strategy-version approvals/i);
  });

  it("Case 2 — queue render: row shows version_id, parent_instance, maturity badge, all 3 actions", async () => {
    mockQueue = [
      makeVersion({ version_id: "v_a", parent_instance_id: "instance_a", maturity_phase: "backtest_1yr" }),
      makeVersion({ version_id: "v_b", parent_instance_id: "instance_b", maturity_phase: "paper_14d" }),
    ];
    render(<StrategyVersionApprovalsPage />);

    const rowA = await screen.findByTestId("row-v_a");
    expect(rowA).toHaveTextContent("v_a");
    expect(rowA).toHaveTextContent("instance_a");
    expect(rowA).toHaveTextContent("backtest_1yr");

    expect(screen.getByTestId("approve-v_a")).toBeInTheDocument();
    expect(screen.getByTestId("reject-v_a")).toBeInTheDocument();
    expect(screen.getByTestId("rollout-v_a")).toBeInTheDocument();
    // Second row also renders with its own action triplet.
    expect(screen.getByTestId("row-v_b")).toBeInTheDocument();
    expect(screen.getByTestId("approve-v_b")).toBeInTheDocument();
  });

  it("Case 3 — Reject with empty prompt is a no-op (no API call, no transition)", async () => {
    mockQueue = [makeVersion({ version_id: "v_reject_skip" })];
    render(<StrategyVersionApprovalsPage />);
    const rejectBtn = await screen.findByTestId("reject-v_reject_skip");

    // happy-dom does not implement window.prompt by default — define + spy.
    const promptSpy = vi.fn().mockReturnValue(null);
    Object.defineProperty(window, "prompt", { value: promptSpy, writable: true, configurable: true });

    await act(async () => {
      fireEvent.click(rejectBtn);
    });

    expect(promptSpy).toHaveBeenCalled();
    expect(rejectSpy).not.toHaveBeenCalled();
    expect(transitionSpy).not.toHaveBeenCalled();
  });

  it("Case 4 — Reject with non-empty reason invokes rejectVersion + transitions to rejected", async () => {
    mockQueue = [makeVersion({ version_id: "v_reject_ok" })];
    rejectSpy.mockResolvedValue({ ...makeVersion({ version_id: "v_reject_ok", status: "rejected" }) });
    render(<StrategyVersionApprovalsPage />);
    const rejectBtn = await screen.findByTestId("reject-v_reject_ok");

    Object.defineProperty(window, "prompt", {
      value: vi.fn().mockReturnValue("Backtest fails the volatility gate."),
      writable: true,
      configurable: true,
    });

    await act(async () => {
      fireEvent.click(rejectBtn);
    });

    await waitFor(() => {
      expect(rejectSpy).toHaveBeenCalledWith({
        versionId: "v_reject_ok",
        rejectedBy: "admin_session",
        rejectionReason: "Backtest fails the volatility gate.",
      });
    });
    expect(transitionSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        versionId: "v_reject_ok",
        status: "rejected",
        rejectionReason: "Backtest fails the volatility gate.",
      }),
    );
  });

  it("Case 5 — Approve below backtest_1yr floor surfaces error banner from server-side 412", async () => {
    // Use a maturity that is LEGITIMATELY below the floor; the page does not
    // gate this client-side, so the server-side 412 path is the one that
    // protects the rollout. We mock approveVersion to throw the structured
    // error and assert the banner copy.
    mockQueue = [makeVersion({ version_id: "v_below", maturity_phase: "smoke" })];
    approveSpy.mockRejectedValue(new ApprovalBelowFloorError("below BACKTEST_1YR floor"));
    render(<StrategyVersionApprovalsPage />);

    const approveBtn = await screen.findByTestId("approve-v_below");
    await act(async () => {
      fireEvent.click(approveBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId("approvals-error")).toBeInTheDocument();
    });
    expect(screen.getByTestId("approvals-error")).toHaveTextContent(/v=v_below/);
    expect(screen.getByTestId("approvals-error")).toHaveTextContent(/below BACKTEST_1YR floor/);
    // No status transition recorded on a failed approve.
    expect(transitionSpy).not.toHaveBeenCalled();
  });
});
