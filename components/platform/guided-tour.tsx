"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import type { Step, CallBackProps } from "react-joyride"

const Joyride = dynamic(() => import("react-joyride").then(mod => mod.Joyride), { ssr: false })

const TOUR_STEPS: Step[] = [
  {
    target: '[data-slot="global-scope-filters"], .global-scope-filters',
    content: "Use these filters to scope all data by Organisation, Client, and Strategy. Changes apply across every page.",
    title: "Global Scope Filters",
    disableBeacon: true,
  },
  {
    target: "nav .flex.items-center > div:first-child",
    content: "Navigate the platform lifecycle: Acquire data → Build strategies → Promote winners → Run live → Execute orders → Observe risk → Manage clients → Report results.",
    title: "Lifecycle Navigation",
  },
  {
    target: '[href="/services/trading/overview"]',
    content: "The Trading Overview shows your P&L, strategy performance, alerts, and service health. Click into the Terminal tab to trade.",
    title: "Trading Overview",
  },
  {
    target: '[data-slot="debug-footer"]',
    content: "In demo mode, use Reset Demo to restore all data to its initial state. Switch personas to see the platform from different user perspectives.",
    title: "Demo Controls",
  },
]

const STORAGE_KEY = "unified-tour-completed"

interface GuidedTourProps {
  forceRun?: boolean
}

export function GuidedTour({ forceRun = false }: GuidedTourProps) {
  const [run, setRun] = React.useState(false)

  React.useEffect(() => {
    if (forceRun) {
      setRun(true)
      return
    }
    const completed = localStorage.getItem(STORAGE_KEY)
    if (!completed) {
      // Delay slightly to let the shell render
      const timer = setTimeout(() => setRun(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [forceRun])

  const handleCallback = (data: CallBackProps) => {
    const finishedStatuses: string[] = ["finished", "skipped"]
    if (finishedStatuses.includes(data.status)) {
      setRun(false)
      localStorage.setItem(STORAGE_KEY, "true")
    }
  }

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleCallback}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: "hsl(var(--primary))",
          backgroundColor: "hsl(var(--card))",
          textColor: "hsl(var(--foreground))",
          arrowColor: "hsl(var(--card))",
        },
        tooltip: {
          borderRadius: 8,
          fontSize: 14,
        },
        buttonNext: {
          borderRadius: 6,
          fontSize: 13,
        },
        buttonBack: {
          color: "hsl(var(--muted-foreground))",
          fontSize: 13,
        },
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Done",
        next: "Next",
        skip: "Skip Tour",
      }}
    />
  )
}
