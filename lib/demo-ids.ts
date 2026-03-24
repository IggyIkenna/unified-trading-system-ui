/**
 * Wall-clock IDs allocated outside React component bodies.
 * Lets event handlers use Date.now() without react-hooks/purity flagging the component file.
 */
export function newOnboardingSubmitIds() {
  const t = Date.now();
  const ts = t.toString(36);
  return {
    applicationId: `onb-${ts}`,
    applicantUserId: `uid-${t}`,
    nowIso: new Date(t).toISOString(),
    docId: (key: string) => `doc-${ts}-${key}`,
    accessRequestId: `req-${ts}`,
  };
}

export function newOptimisticBacktestIds() {
  const t = Date.now();
  return {
    id: `bt-new-${t}`,
    configId: `cfg-new-${t}`,
    dataSnapshotId: `snap-${t}`,
    configHash: `cfg-hash-${t}`,
    asOfDate: new Date(t).toISOString().slice(0, 10),
  };
}
