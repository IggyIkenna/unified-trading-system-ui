"use client";

import { ArbitrageGalaxy } from "@/components/marketing/arbitrage-galaxy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowRight, Check, Circle, Play } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { VENUE_LIST } from "./board-presentation-data";
import { StatusBadge } from "./board-presentation-widgets";

export function BoardSlidePartB({ slide }: { slide: Record<string, any> }) {
  return (
    <>
      {/* Competitive Moat Slide */}
      {slide.type === "moat" && (
        <div>
          <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-2">{slide.title}</h2>
          <p className="text-muted-foreground mb-3">{slide.subtitle}</p>
          <div className="overflow-y-auto max-h-[52vh] pr-1 mb-3">
            <div className="grid grid-cols-2 gap-3">
              {slide.gaps?.map(
                (
                  gap: {
                    title: string;
                    desc: string;
                    color?: string;
                    competitor?: string;
                    users?: string;
                    gap?: string;
                  },
                  i: number,
                ) => {
                  const colors = {
                    cyan: "border-cyan-400/30 bg-cyan-400/5",
                    violet: "border-violet-400/30 bg-violet-400/5",
                    amber: "border-amber-400/30 bg-amber-400/5",
                    emerald: "border-emerald-400/30 bg-emerald-400/5",
                    rose: "border-rose-400/30 bg-rose-400/5",
                  };
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className={cn("p-3 rounded-lg border", colors[gap.color as keyof typeof colors])}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{gap.competitor}</span>
                        <Badge variant="outline" className="text-xs">
                          {gap.users}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{gap.gap}</p>
                    </motion.div>
                  );
                },
              )}
            </div>
          </div>
          <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 text-center">
            <p className="text-sm font-medium text-primary">{slide.callout}</p>
          </div>
        </div>
      )}

      {/* Coverage Slide - Animated Arbitrage Galaxy */}
      {slide.type === "coverage" && (
        <div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-1">{slide.title}</h2>
              <p className="text-sm text-muted-foreground">
                Trading 24/7/365 — same instruments, multiple venues, continuous arbitrage
              </p>
            </div>
            <div className="flex gap-6 flex-shrink-0">
              {[
                { v: "128", l: "Venues", c: "text-cyan-400" },
                { v: "1.5M+", l: "Instruments", c: "text-emerald-400" },
                { v: "5", l: "Asset Classes", c: "text-violet-400" },
                { v: "24/7", l: "Trading", c: "text-amber-400" },
              ].map((s) => (
                <div key={s.l} className="flex flex-col items-center">
                  <div className={`text-2xl font-bold tabular-nums ${s.c}`}>{s.v}</div>
                  <div className="text-[10px] text-muted-foreground text-center">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Animated arbitrage galaxy */}
          <div className="mx-auto w-full max-w-lg">
            <ArbitrageGalaxy />
          </div>

          {/* Scrolling venue list */}
          <div className="relative mt-4 overflow-hidden h-8">
            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />
            <motion.div
              className="flex gap-4 whitespace-nowrap"
              animate={{ x: [0, -1200] }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              {[...VENUE_LIST, ...VENUE_LIST].map((venue, i) => {
                const colors: Record<string, string> = {
                  cyan: "text-cyan-400 border-cyan-400/30",
                  green: "text-emerald-400 border-emerald-400/30",
                  violet: "text-violet-400 border-violet-400/30",
                  amber: "text-amber-400 border-amber-400/30",
                  rose: "text-rose-400 border-rose-400/30",
                };
                return (
                  <span
                    key={`${venue.name}-${i}`}
                    className={cn("text-xs px-2 py-1 rounded border bg-background/50", colors[venue.color])}
                  >
                    {venue.name}
                  </span>
                );
              })}
            </motion.div>
          </div>

          <div className="mt-3 p-3 bg-primary/5 border-l-4 border-primary rounded-r-lg">
            <p className="text-xs text-muted-foreground">{slide.differentiator}</p>
          </div>
        </div>
      )}

      {/* Strategies Slide */}
      {slide.type === "strategies" && (
        <div>
          <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-2">{slide.title}</h2>
          <p className="text-muted-foreground mb-6">{slide.subtitle}</p>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-card">
                  <th className="text-left p-3 text-primary font-semibold border-b border-primary">Family</th>
                  <th className="text-left p-3 text-primary font-semibold border-b border-primary">Return Range</th>
                  <th className="text-left p-3 text-primary font-semibold border-b border-primary">Max Drawdown</th>
                  <th className="text-left p-3 text-primary font-semibold border-b border-primary">Capacity</th>
                  <th className="text-left p-3 text-primary font-semibold border-b border-primary">Character</th>
                </tr>
              </thead>
              <tbody>
                {(
                  (slide.families as Array<{
                    name: string;
                    returns: string;
                    drawdown: string;
                    capacity: string;
                    character: string;
                    risk: string;
                  }>) || []
                ).map((family, i) => {
                  const riskBorderColors: Record<string, string> = {
                    low: "border-l-4 border-l-emerald-400",
                    medium: "border-l-4 border-l-amber-400",
                    high: "border-l-4 border-l-rose-400",
                  };
                  return (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className={cn(
                        "border-b border-border hover:bg-muted/50",
                        riskBorderColors[family.risk] || "",
                      )}
                    >
                      <td className="p-3 font-semibold">{family.name}</td>
                      <td className="p-3 text-muted-foreground">{family.returns}</td>
                      <td className="p-3 text-muted-foreground">{family.drawdown}</td>
                      <td className="p-3 text-muted-foreground">{family.capacity}</td>
                      <td className="p-3 text-muted-foreground">{family.character}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {slide.callout && (
            <div className="mt-4 p-4 rounded-lg border border-primary/30 bg-primary/5 text-center">
              <p className="text-sm text-muted-foreground">{slide.callout as string}</p>
            </div>
          )}
        </div>
      )}

      {/* Timeline Matrix Slide — strategies × time periods */}
      {slide.type === "timeline-matrix" && (
        <div>
          <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-2">{slide.title}</h2>
          <p className="text-muted-foreground mb-6">{slide.subtitle}</p>
          <div className="overflow-hidden rounded-lg border border-border">
            {/* Period headers */}
            <div
              className="grid bg-card border-b border-primary"
              style={{ gridTemplateColumns: `200px repeat(${((slide.periods as string[]) || []).length}, 1fr)` }}
            >
              <div className="p-3" />
              {((slide.periods as string[]) || []).map((period: string) => (
                <div key={period} className="p-3 text-center">
                  <span className="text-[10px] text-primary font-semibold uppercase tracking-wider">{period}</span>
                </div>
              ))}
            </div>
            {/* Strategy rows */}
            {(
              (slide.strategies as Array<{ name: string; statuses: string[] }>) || []
            ).map((strategy, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 * i }}
                className={cn(
                  "grid border-b border-border last:border-b-0",
                  i % 2 === 0 ? "bg-card" : "bg-card/50",
                )}
                style={{ gridTemplateColumns: `200px repeat(${((slide.periods as string[]) || []).length}, 1fr)` }}
              >
                <div className="p-3 flex items-center">
                  <span className="text-xs font-semibold">{strategy.name}</span>
                </div>
                {strategy.statuses.map((status: string, j: number) => {
                  const statusStyles: Record<string, string> = {
                    live: "bg-emerald-400/20 text-emerald-400 border-emerald-400/30",
                    testing: "bg-amber-400/20 text-amber-400 border-amber-400/30",
                    available: "bg-primary/20 text-primary border-primary/30",
                  };
                  return (
                    <div key={j} className="p-3 flex items-center justify-center">
                      {status ? (
                        <span
                          className={cn(
                            "px-2 py-0.5 text-[9px] font-semibold rounded border uppercase",
                            statusStyles[status] || "bg-muted/20 text-muted-foreground border-border",
                          )}
                        >
                          {status}
                        </span>
                      ) : (
                        <span className="size-1.5 rounded-full bg-border" />
                      )}
                    </div>
                  );
                })}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ Slide */}
      {slide.type === "faq" && (
        <div>
          <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-2">{slide.title}</h2>
          <p className="text-muted-foreground mb-6">{slide.subtitle}</p>
          <div className="space-y-4">
            {(
              (slide.questions as Array<{ q: string; a: string }>) || []
            ).map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="p-4 rounded-lg border border-border bg-card"
              >
                <div className="text-sm font-semibold text-primary mb-2">{faq.q}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{faq.a}</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Demo Slide — clickable section cards */}
      {slide.type === "demo" && (
        <div>
          <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-2">{slide.title}</h2>
          <p className="text-muted-foreground mb-8 max-w-3xl">{slide.subtitle}</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {slide.sections?.map(
              (section: { name: string; desc: string; link?: string }, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  {section.link ? (
                    <Link
                      href={section.link}
                      target="_blank"
                      className="block p-6 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-semibold text-primary">{section.name}</div>
                        <ArrowRight className="size-4 text-primary/50 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="text-xs text-muted-foreground">{section.desc}</div>
                    </Link>
                  ) : (
                    <div className="p-6 rounded-lg border border-border bg-card">
                      <div className="text-sm font-semibold text-primary mb-1">{section.name}</div>
                      <div className="text-xs text-muted-foreground">{section.desc}</div>
                    </div>
                  )}
                </motion.div>
              ),
            )}
          </div>
          {slide.note && (
            <div className="p-4 rounded-lg border border-border/50 bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground italic">{slide.note}</p>
            </div>
          )}
        </div>
      )}

      {/* Lifecycle Slide */}
      {slide.type === "lifecycle" && (
        <div>
          <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-8">{slide.title}</h2>
          <div className="flex items-center gap-2 mb-8">
            {slide.steps?.map((step: string, i: number) => (
              <React.Fragment key={i}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * i }}
                  className={cn(
                    "flex-1 py-4 px-3 rounded-lg border text-center font-semibold text-sm",
                    slide.highlight?.includes(i)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card",
                  )}
                >
                  {step}
                </motion.div>
                {i < (slide.steps?.length || 0) - 1 && <ArrowRight className="size-5 text-primary/50 flex-shrink-0" />}
              </React.Fragment>
            ))}
          </div>
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b border-border">
              <div className="flex gap-1.5">
                <div className="size-3 rounded-full bg-red-400" />
                <div className="size-3 rounded-full bg-amber-400" />
                <div className="size-3 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 bg-background rounded px-3 py-1 text-xs font-mono text-muted-foreground">
                https://uat.odum-research.com/services/research/strategy/overview
              </div>
            </div>
            <div className="p-8 text-center space-y-6">
              <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">{slide.demo}</p>
              <div className="flex items-center justify-center gap-4">
                <Link href="/login?redirect=/dashboard" target="_blank">
                  <Button variant="outline" size="lg" className="gap-2">
                    <Play className="size-4" />
                    Trader View
                  </Button>
                </Link>
                <Link href="/login?redirect=/services/reports/executive" target="_blank">
                  <Button size="lg" className="gap-2">
                    <Play className="size-4" />
                    Executive View
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-muted-foreground italic mt-4">
                Live demo will be shown during the presentation
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Slide */}
      {slide.type === "revenue" && (
        <div>
          <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-6">{slide.title}</h2>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-card">
                  <th className="text-left p-3 text-primary font-semibold border-b border-primary">Service</th>
                  <th className="text-left p-3 text-primary font-semibold border-b border-primary">Model</th>
                  <th className="text-left p-3 text-primary font-semibold border-b border-primary">Status</th>
                </tr>
              </thead>
              <tbody>
                {slide.services?.map(
                  (
                    service: {
                      name: string;
                      model: string;
                      status: string;
                      note?: string;
                    },
                    i: number,
                  ) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="border-b border-border hover:bg-muted/50"
                    >
                      <td className="p-3 font-semibold">{service.name}</td>
                      <td className="p-3 text-muted-foreground">{service.model}</td>
                      <td className="p-3">
                        <StatusBadge status={service.status} />
                        {service.note && <span className="ml-2 text-xs text-muted-foreground">- {service.note}</span>}
                      </td>
                    </motion.tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-gradient-to-r from-primary/5 to-violet-500/5 border-l-4 border-primary rounded-r-lg">
            <p className="text-sm text-muted-foreground">{slide.disclosure}</p>
          </div>
        </div>
      )}

      {/* Flywheel Slide */}
      {slide.type === "flywheel" && (
        <div>
          <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-4">{slide.title}</h2>
          <p className="text-muted-foreground mb-6">{slide.subtitle}</p>
          <div className="flex items-center gap-2 mb-4">
            {slide.funnel?.map((step: { name: string; sub: string; active?: boolean }, i: number) => (
              <React.Fragment key={i}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * i }}
                  className={cn(
                    "flex-1 py-4 px-3 rounded-lg border text-center",
                    step.active ? "border-primary bg-primary/10" : "border-border bg-card",
                  )}
                >
                  <div className={cn("font-semibold text-sm", step.active && "text-primary")}>{step.name}</div>
                  <div className="text-xs text-muted-foreground">{step.sub}</div>
                </motion.div>
                {i < (slide.funnel?.length || 0) - 1 && <ArrowRight className="size-5 text-primary/50 flex-shrink-0" />}
              </React.Fragment>
            ))}
          </div>
          <div className="text-center text-xs text-muted-foreground mb-6">Regulatory coverage spans all stages</div>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 rounded-lg border border-primary/30 bg-primary/5 text-center">
              <p className="text-sm text-muted-foreground leading-relaxed">
                The critical conversion is research to live.
                <br />
                On most platforms, that transition requires a rewrite.
                <br />
                On ours, it is a configuration change — same data,
                <br />
                same features, same risk controls.
              </p>
              <p className="mt-4 text-primary font-medium">
                That continuity is what makes the platform difficult to leave.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Cross-Sell Examples</h3>
              <ul className="space-y-2">
                {slide.examples?.map((ex: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <ArrowRight className="size-4 text-primary flex-shrink-0 mt-0.5" />
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Operations Slide */}
      {slide.type === "operations" && (
        <div>
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-3xl font-bold text-primary border-b border-border pb-2">{slide.title}</h2>
            <div className="flex gap-4 flex-shrink-0">
              {slide.metrics?.map((m: { value: string; label: string }, i: number) => (
                <div key={i} className="text-center">
                  <div className="text-xl font-bold text-primary">{m.value}</div>
                  <div className="text-[10px] text-muted-foreground">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {slide.columns?.map((col: { title: string; items: string[] }, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="p-4 rounded-lg border border-border bg-card"
              >
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">{col.title}</h3>
                <ul className="space-y-2">
                  {col.items.map((item: string, j: number) => (
                    <li key={j} className="text-xs text-muted-foreground flex items-start gap-2">
                      <ArrowRight className="size-3 text-primary flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
          <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 text-center">
            <p className="text-sm text-muted-foreground">
              {slide.callout?.split("15–20 people").map((part: string, i: number) =>
                i === 0 ? (
                  part
                ) : (
                  <React.Fragment key={i}>
                    <span className="text-primary font-semibold">15–20 people</span>
                    {part}
                  </React.Fragment>
                ),
              )}
            </p>
          </div>
        </div>
      )}

      {/* Traction Slide — supports 2 or 3 columns */}
      {slide.type === "traction" && (
        <div>
          <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-6">{slide.title}</h2>
          <div className={cn("grid gap-6", slide.launchReady ? "grid-cols-3" : "grid-cols-2")}>
            <div>
              <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4">
                {slide.launchReady ? "Live & Revenue-Generating" : "Achieved"}
              </h3>
              <div className="space-y-3">
                {slide.achieved?.map((item: { text: string; detail: string }, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-start gap-3 p-3 border-b border-border"
                  >
                    <Check className="size-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-sm">{item.text}</div>
                      <div className="text-xs text-muted-foreground">{item.detail}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">
                {slide.launchReady ? "In Active Pipeline" : "In Progress"}
              </h3>
              <div className="space-y-3">
                {slide.inProgress?.map((item: { text: string; detail: string }, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-start gap-3 p-3 border-b border-border"
                  >
                    <Circle className="size-5 text-amber-400 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-sm">{item.text}</div>
                      <div className="text-xs text-muted-foreground">{item.detail}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            {slide.launchReady && (
              <div>
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
                  Built & Launch-Ready
                </h3>
                <div className="space-y-3">
                  {(slide.launchReady as Array<{ text: string; detail: string }>).map(
                    (item: { text: string; detail: string }, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="flex items-start gap-3 p-3 border-b border-border"
                      >
                        <ArrowRight className="size-5 text-primary flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-sm">{item.text}</div>
                          <div className="text-xs text-muted-foreground">{item.detail}</div>
                        </div>
                      </motion.div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
          {slide.checkpoint && (
            <div className="mt-6 p-4 rounded-lg border border-primary/30 bg-primary/5 text-center">
              <p className="text-sm text-muted-foreground">{slide.checkpoint as string}</p>
            </div>
          )}
        </div>
      )}

      {/* Demand Evidence Slide */}
      {slide.type === "demand" && (
        <div>
          <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-2">{slide.title}</h2>
          <p className="text-muted-foreground mb-4">{slide.subtitle}</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {slide.signals?.map(
              (signal: { label: string; detail: string; color?: string }, i: number) => {
                const colors = {
                  cyan: "border-cyan-400/30 bg-cyan-400/5",
                  violet: "border-violet-400/30 bg-violet-400/5",
                  amber: "border-amber-400/30 bg-amber-400/5",
                  emerald: "border-emerald-400/30 bg-emerald-400/5",
                  rose: "border-rose-400/30 bg-rose-400/5",
                };
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className={cn("p-3 rounded-lg border", colors[signal.color as keyof typeof colors])}
                  >
                    <div className="font-semibold text-sm mb-1">{signal.label}</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{signal.detail}</p>
                  </motion.div>
                );
              },
            )}
          </div>
          {slide.marketSizes && (
            <div className="overflow-hidden rounded-lg border border-border mb-3">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-card border-b border-border">
                    <th className="text-left p-2 text-primary font-semibold">Comparable</th>
                    <th className="text-left p-2 text-primary font-semibold">Scale</th>
                  </tr>
                </thead>
                <tbody>
                  {(slide.marketSizes as Array<{ name: string; scale: string }>).map((row, i) => (
                    <tr key={i} className={cn("border-b border-border last:border-b-0", i % 2 === 0 ? "bg-card" : "bg-card/50")}>
                      <td className="p-2 font-medium">{row.name}</td>
                      <td className="p-2 text-muted-foreground">{row.scale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 text-center">
            <p className="text-sm font-medium text-primary">{slide.callout}</p>
          </div>
        </div>
      )}

      {/* Ask Slide */}
      {slide.type === "ask" && (
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black tracking-tight bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent"
          >
            {slide.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            {slide.subtitle}
          </motion.p>
          <div className="mt-2 h-1 w-20 mx-auto bg-gradient-to-r from-primary to-violet-500 rounded" />
          <div className="grid grid-cols-3 gap-6 mt-10">
            {slide.asks?.map((ask: { title: string; items: string[] }, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + 0.1 * i }}
                className="p-6 rounded-lg border border-primary/30 bg-primary/5 text-left"
              >
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">{ask.title}</h3>
                <ul className="space-y-2">
                  {ask.items.map((item: string, j: number) => (
                    <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                      <ArrowRight className="size-4 text-primary flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-10 text-sm text-muted-foreground"
          >
            Odum Research Ltd | FCA 975797 | {slide.contact} | odum-research.com
          </motion.p>
        </div>
      )}
    </>
  );
}
