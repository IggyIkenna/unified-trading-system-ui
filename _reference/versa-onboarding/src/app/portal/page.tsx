"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import presentationsData from "@/data/presentations.json";

type Presentation = {
  id: string;
  title: string;
};

type PresentationWithMeta = Presentation & {
  description?: string;
  section: string;
};

const SECTIONS = [
  { key: "overview", label: "Overview", ids: ["00-master"] },
  {
    key: "services",
    label: "Services",
    ids: [
      "01-data-provision",
      "02-backtesting-as-a-service",
      "03-strategy-white-labelling",
      "04-execution-as-a-service",
      "05-investment-management",
      "06-regulatory-umbrella",
    ],
  },
  {
    key: "platform",
    label: "Platform & Technology",
    ids: [
      "07-autonomous-ai-operations",
      "08-system-quality",
      "09-platform-portal",
    ],
  },
];

function enrichPresentation(p: Presentation): PresentationWithMeta {
  const meta = presentationsData.find((d) => d.id === p.id);
  const section = SECTIONS.find((s) => s.ids.includes(p.id))?.label ?? "Other";
  return {
    ...p,
    description: meta?.description,
    section,
  };
}

export default function PortalPage() {
  const [presentations, setPresentations] = useState<PresentationWithMeta[]>(
    [],
  );

  useEffect(() => {
    let cancelled = false;
    const loadPresentations = async () => {
      try {
        const response = await fetch("/api/presentations", {
          credentials: "include",
        });
        if (!response.ok) return;
        const data = (await response.json()) as {
          presentations: Presentation[];
        };
        if (!cancelled) {
          setPresentations((data.presentations || []).map(enrichPresentation));
        }
      } catch (_err) {
        if (!cancelled) setPresentations([]);
      }
    };
    loadPresentations();
    return () => {
      cancelled = true;
    };
  }, []);

  const sections = SECTIONS.map((s) => ({
    ...s,
    items: presentations.filter((p) => p.section === s.label),
  })).filter((s) => s.items.length > 0);

  const other = presentations.filter(
    (p) => !SECTIONS.some((s) => s.label === p.section),
  );

  return (
    <div className="portal-page min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Your presentations
        </h1>
        <p className="mt-2 text-neutral-700">
          Only presentations assigned to you or your groups are visible here.
        </p>

        {presentations.length === 0 && (
          <div className="mt-8 rounded border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-800">
            No presentations assigned yet.
          </div>
        )}

        {sections.map((section) => (
          <div key={section.key} className="mt-10">
            <h2 className="text-lg font-semibold text-neutral-900">
              {section.label}
            </h2>
            <div className="mt-4 grid gap-4">
              {section.items.map((presentation) => (
                <Link
                  key={presentation.id}
                  href={`/presentations/${presentation.id}`}
                  className="group rounded border border-neutral-200 bg-white p-5 text-neutral-900 hover:border-neutral-400 hover:shadow-sm"
                >
                  <h3 className="text-base font-medium text-neutral-900 group-hover:text-black">
                    {presentation.title}
                  </h3>
                  {presentation.description && (
                    <p className="mt-1 text-sm text-neutral-500">
                      {presentation.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}

        {other.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-neutral-900">Other</h2>
            <div className="mt-4 grid gap-4">
              {other.map((presentation) => (
                <Link
                  key={presentation.id}
                  href={`/presentations/${presentation.id}`}
                  className="rounded border border-neutral-200 bg-white p-5 text-neutral-900 hover:border-neutral-400 hover:shadow-sm"
                >
                  <h3 className="text-base font-medium">
                    {presentation.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
