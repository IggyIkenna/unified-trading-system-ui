"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

export interface DocsNavSection {
  readonly id: string;
  readonly label: string;
}

/**
 * Sticky left-rail section index for `/docs`. Tracks the section currently in
 * view via IntersectionObserver and highlights the matching entry so readers
 * can see where they are. Mirrors the pattern most API reference sites use.
 *
 * Renders anchor links pointing at `#<section.id>` — the page must put a
 * matching `id` on each section element.
 */
export function DocsNav({ sections }: { sections: readonly DocsNavSection[] }) {
  const [activeId, setActiveId] = React.useState<string>(sections[0]?.id ?? "");

  React.useEffect(() => {
    const targets = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0 && visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        // Trigger when a section's top crosses ~25% from the viewport top.
        rootMargin: "-25% 0px -65% 0px",
        threshold: [0, 1],
      },
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="Documentation sections" className="text-sm">
      <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">On this page</p>
      <ul className="space-y-0.5">
        {sections.map((section) => {
          const active = activeId === section.id;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "block rounded-md border-l-2 px-3 py-1.5 text-sm leading-snug transition-colors",
                  active
                    ? "border-primary bg-muted/60 font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                {section.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
