"use client";

import { use, useState, useRef } from "react";
import Link from "next/link";
import presentationsData from "@/data/presentations.json";

export default function PresentationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const presentation = presentationsData.find((p) => p.id === id);
  const title = presentation?.title ?? id;

  const toggleFullScreen = () => {
    if (!iframeRef.current) return;
    if (!isFullScreen) {
      iframeRef.current.requestFullscreen?.();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullScreen(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <nav className="mb-4 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/portal" className="hover:text-black">
          Portal
        </Link>
        <span>/</span>
        <span className="text-neutral-900">{title}</span>
      </nav>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{title}</h1>
        <button
          onClick={toggleFullScreen}
          className="rounded border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50"
        >
          {isFullScreen ? "Exit full screen" : "Full screen"}
        </button>
      </div>

      {presentation?.description && (
        <p className="mb-4 text-sm text-neutral-600">
          {presentation.description}
        </p>
      )}

      <div className="h-[75vh] overflow-hidden rounded border border-neutral-200">
        <iframe
          ref={iframeRef}
          title={title}
          src={`/api/presentations/${id}`}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
