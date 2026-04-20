import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import {
  selectPromoteSelectedStrategy,
  usePromoteLifecycleStore,
} from "@/lib/stores/promote-lifecycle-store";

/**
 * Covers lines 25-26 + 36-37 of promote-lifecycle-store.ts:
 *   25-26: `recordWorkflow` reducer (maps over candidates)
 *   36-37: `selectPromoteSelectedStrategy` selector (null branch + find path)
 *
 * The existing stores.test.ts only hits setSelectedId + reset.
 */
describe("promote-lifecycle-store — selector", () => {
  beforeEach(() => {
    act(() => usePromoteLifecycleStore.getState().reset());
  });

  it("selector returns null when nothing selected", () => {
    expect(selectPromoteSelectedStrategy(usePromoteLifecycleStore.getState())).toBeNull();
  });

  it("selector returns the selected candidate when it exists", () => {
    const first = usePromoteLifecycleStore.getState().candidates[0];
    if (!first) throw new Error("expected at least one candidate fixture");
    act(() => usePromoteLifecycleStore.getState().setSelectedId(first.id));
    const found = selectPromoteSelectedStrategy(usePromoteLifecycleStore.getState());
    expect(found?.id).toBe(first.id);
  });

  it("selector returns null when selectedId does not match any candidate", () => {
    act(() => usePromoteLifecycleStore.getState().setSelectedId("does-not-exist"));
    expect(selectPromoteSelectedStrategy(usePromoteLifecycleStore.getState())).toBeNull();
  });
});

describe("promote-lifecycle-store — recordWorkflow reducer runs without error", () => {
  beforeEach(() => {
    act(() => usePromoteLifecycleStore.getState().reset());
  });

  it("running recordWorkflow with a no-op demote payload does not crash and preserves candidate count", () => {
    const firstId = usePromoteLifecycleStore.getState().candidates[0]?.id ?? "noop";
    const initialLen = usePromoteLifecycleStore.getState().candidates.length;
    act(() =>
      usePromoteLifecycleStore.getState().recordWorkflow(firstId, "model_assessment", {
        // `demote` with no target is an early-return branch — effectively a no-op.
        action: "demote",
        comment: "",
      }),
    );
    expect(usePromoteLifecycleStore.getState().candidates.length).toBe(initialLen);
  });

  it("running recordWorkflow on a non-matching id leaves the other candidates intact", () => {
    const beforeIds = usePromoteLifecycleStore
      .getState()
      .candidates.map((c) => c.id);
    act(() =>
      usePromoteLifecycleStore.getState().recordWorkflow("no-such-id", "model_assessment", {
        action: "approve",
        comment: "ok",
      }),
    );
    const afterIds = usePromoteLifecycleStore
      .getState()
      .candidates.map((c) => c.id);
    expect(afterIds).toEqual(beforeIds);
  });
});
