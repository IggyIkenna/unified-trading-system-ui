"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STEP_LABELS } from "./signup-data";

export function StepIndicator({ current, onNavigate }: { current: number; onNavigate: (s: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-8">
      {STEP_LABELS.map((label, i) => {
        const num = i + 1,
          done = num < current,
          active = num === current;
        return (
          <React.Fragment key={label}>
            {i > 0 && <div className={`h-px w-6 sm:w-10 ${done ? "bg-emerald-500" : "bg-border"}`} />}
            <button
              type="button"
              disabled={!done || current === 5}
              onClick={() => done && onNavigate(num)}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                done
                  ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                  : active
                    ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                    : "text-muted-foreground"
              }`}
            >
              {done ? <Check className="size-3" /> : <span className="text-[10px]">{num}</span>}
              <span className="hidden sm:inline">{label}</span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function OnboardingBackBtn({ to, onStep }: { to: number; onStep: (n: number) => void }) {
  return (
    <Button variant="ghost" onClick={() => onStep(to)}>
      <ArrowLeft className="mr-2 size-4" />
      Back
    </Button>
  );
}

export function OnboardingNextBtn({
  disabled,
  onClick,
  label = "Continue",
  type = "button",
}: {
  disabled?: boolean;
  onClick?: () => void;
  label?: string;
  type?: "button" | "submit";
}) {
  return (
    <Button type={type} disabled={disabled} onClick={type === "submit" ? undefined : onClick}>
      {label} <ArrowRight className="ml-2 size-4" />
    </Button>
  );
}
