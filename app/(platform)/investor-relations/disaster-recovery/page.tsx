"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRef } from "react";

export default function DisasterRecoveryPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const toggleFullscreen = () => {
    if (iframeRef.current) {
      iframeRef.current.requestFullscreen();
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card/50 px-6 py-3">
        <div className="flex items-center gap-4">
          <Link href="/investor-relations">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="size-4 mr-1" />
              Back
            </Button>
          </Link>
          <div className="h-5 w-px bg-border" />
          <span className="font-semibold text-sm">
            Disaster Recovery &amp; Business Continuity
          </span>
          <Badge variant="outline" className="text-xs">
            <Shield className="size-3 mr-1" />
            FCA 975797
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
          <Maximize2 className="size-4 mr-1" />
          Fullscreen
        </Button>
      </header>

      {/* Presentation iframe */}
      <iframe
        ref={iframeRef}
        src="/presentations/disaster-recovery.html"
        className="flex-1 w-full border-0"
        title="Disaster Recovery & Business Continuity"
        allow="fullscreen"
      />
    </div>
  );
}
