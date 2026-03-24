"use client";

import * as React from "react";

/** Wall-clock ms updated on an interval; avoids Date.now() during render. */
export function useTickingNowMs(intervalMs = 1000): number {
  const [t, setT] = React.useState(() => Date.now());
  React.useEffect(() => {
    const tick = () => {
      setT(Date.now());
    };
    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return t;
}
