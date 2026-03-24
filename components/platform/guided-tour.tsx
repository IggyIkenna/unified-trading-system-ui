"use client";

import * as React from "react";
import dynamic from "next/dynamic";

const Joyride = dynamic(
  () => import("react-joyride").then((mod) => mod.Joyride),
  { ssr: false },
);

const TOUR_STEPS = [
  {
    target: '[data-slot="global-scope-filters"], .global-scope-filters',
    content:
      "Use these filters to scope all data by Organisation, Client, and Strategy. Changes apply across every page.",
    title: "Global Scope Filters",
  },
  {
    target: '[href="/services/trading/overview"]',
    content:
      "The Trading Overview shows your P&L, strategy performance, alerts, and service health. Click into the Terminal tab to trade.",
    title: "Trading Overview",
  },
  {
    target: '[data-slot="debug-footer"]',
    content:
      "In demo mode, use Reset Demo to clear all state, or Switch Persona to test different access levels.",
    title: "Demo Controls",
  },
];

const STORAGE_KEY = "guided-tour-completed";

export function GuidedTour() {
  const [run, setRun] = React.useState(false);

  React.useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setRun(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEvent = React.useCallback(
    (event: { type: string; status?: string }) => {
      if (event.status === "finished" || event.status === "skipped") {
        localStorage.setItem(STORAGE_KEY, "true");
        setRun(false);
      }
    },
    [],
  );

  return (
    <Joyride steps={TOUR_STEPS} run={run} continuous onEvent={handleEvent} />
  );
}
