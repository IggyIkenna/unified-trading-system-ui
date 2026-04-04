"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, Pause, Play, Shield } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { slides } from "./board-presentation-data";
import { BoardSlidePartA } from "./board-presentation-slide-part-a";
import { BoardSlidePartB } from "./board-presentation-slide-part-b";

export function BoardPresentationPageClient() {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isAutoPlay, setIsAutoPlay] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const nextSlide = () => setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
  const prevSlide = () => setCurrentSlide((prev) => Math.max(prev - 1, 0));

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "Escape") setIsFullscreen(false);
      if (e.key === "f") toggleFullscreen();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  React.useEffect(() => {
    if (isAutoPlay) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlay]);

  // Each slide has a different shape based on `type`. Cast to a permissive record
  // to allow type-specific property access in render branches.

  const slide = slides[currentSlide] as Record<string, any>;

  return (
    <div ref={containerRef} className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/50">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <img src="/images/odum-logo.png" alt="Odum Research" className="size-7" />
            <span className="font-bold text-lg tracking-tight">
              ODUM<span className="text-primary">.</span>
            </span>
          </Link>
          <Badge variant="outline" className="text-xs">
            <Shield className="size-3 mr-1" />
            FCA 975797
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsAutoPlay(!isAutoPlay)}>
            {isAutoPlay ? <Pause className="size-4" /> : <Play className="size-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
            <Maximize2 className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground font-mono">
            {currentSlide + 1} / {slides.length}
          </span>
        </div>
      </header>

      {/* Slide Content */}
      <main className="flex-1 flex items-center justify-center p-8 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="w-full platform-page-width"
          >
            <BoardSlidePartA slide={slide} />
            <BoardSlidePartB slide={slide} />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <footer className="flex items-center justify-between px-6 py-4 border-t border-border bg-card/50">
        <Button variant="ghost" size="sm" onClick={prevSlide} disabled={currentSlide === 0}>
          <ChevronLeft className="size-4 mr-1" />
          Previous
        </Button>
        <div className="flex gap-1">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={cn(
                "size-2 rounded-full transition-all",
                currentSlide === i ? "bg-primary w-6" : "bg-muted-foreground/30 hover:bg-muted-foreground/50",
              )}
            />
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={nextSlide} disabled={currentSlide === slides.length - 1}>
          Next
          <ChevronRight className="size-4 ml-1" />
        </Button>
      </footer>
    </div>
  );
}
