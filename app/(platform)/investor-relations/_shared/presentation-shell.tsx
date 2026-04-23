"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, Pause, Play, Shield } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { BoardSlidePartA } from "../board-presentation/components/board-presentation-slide-part-a";
import { BoardSlidePartB } from "../board-presentation/components/board-presentation-slide-part-b";
import { WidgetScroll } from "@/components/shared/widget-scroll";

interface PresentationShellProps {
  slides: Array<Record<string, unknown>>;
  footerLabel?: string;
}

export function PresentationShell({ slides, footerLabel }: PresentationShellProps) {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isAutoPlay, setIsAutoPlay] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

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
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [currentSlide]);

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
  }, [isAutoPlay, slides.length]);

  const slide = slides[currentSlide] as Record<string, any>;

  return (
    <div ref={containerRef} className="h-[calc(100vh-7rem)] bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-2 border-b border-border bg-card/50 shrink-0">
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
      <WidgetScroll className="flex-1 min-h-0" viewportClassName="flex items-start justify-center p-6 pt-8" viewportRef={scrollRef}>
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id as number}
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
      </WidgetScroll>

      {/* Navigation */}
      <footer className="flex items-center justify-between px-6 py-2 border-t border-border bg-card/50 shrink-0">
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
