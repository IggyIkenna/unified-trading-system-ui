"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowRight, Check, Shield } from "lucide-react";
import * as React from "react";

export function BoardSlidePartA({ slide }: { slide: Record<string, any> }) {
  return (
    <>
      {slide.type === "cover" && (
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-black tracking-tight leading-tight bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent pb-2"
          >
            {slide.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-xl text-muted-foreground max-w-3xl mx-auto"
          >
            {slide.subtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 h-1 w-20 mx-auto bg-gradient-to-r from-primary to-violet-500 rounded"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 text-sm text-primary font-medium uppercase tracking-widest"
          >
            {slide.tagline} | FCA Authorised | Ref 975797
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6"
          >
            {slide.stats?.map((stat: { value: string; label: string }, i: number) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Doctrine Slide - Why One Platform */}
      {slide.type === "doctrine" && (
        <div>
          <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-2">{slide.title}</h2>
          <p className="text-muted-foreground mb-6 max-w-3xl">{slide.subtitle}</p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {slide.points?.map((point: { problem: string; solution: string }, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                className="flex gap-4 p-4 rounded-lg border border-border bg-card"
              >
                <div className="flex-1">
                  <div className="text-xs text-destructive uppercase tracking-wider mb-1">Problem</div>
                  <div className="text-sm text-muted-foreground">{point.problem}</div>
                </div>
                <ArrowRight className="size-4 text-primary mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-xs text-primary uppercase tracking-wider mb-1">Solution</div>
                  <div className="text-sm font-medium">{point.solution}</div>
                </div>
              </motion.div>
            ))}
          </div>
          {slide.differentiators && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {(slide.differentiators as string[]).map((diff: string, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + 0.1 * i }}
                  className="p-3 rounded-lg border border-border bg-card/50 text-xs text-muted-foreground flex items-start gap-2"
                >
                  <Check className="size-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                  {diff}
                </motion.div>
              ))}
            </div>
          )}
          <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 text-center">
            <p className="text-sm font-medium text-primary">{slide.conclusion}</p>
          </div>
        </div>
      )}

      {/* Entry Points Slide */}
      {slide.type === "entrypoints" && (
        <div>
          <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-2">{slide.title}</h2>
          <p className="text-muted-foreground mb-8">{slide.subtitle}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {slide.entries?.map(
              (
                entry: {
                  name: string;
                  stages: string[];
                  alpha: boolean;
                  desc: string;
                },
                i: number,
              ) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="p-4 rounded-lg border border-border bg-card"
                >
                  <div className="font-semibold text-sm mb-2">{entry.name}</div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {entry.stages.map((s: string) => (
                      <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">{entry.desc}</div>
                  {!entry.alpha && (
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <Shield className="size-3" />
                      Connects at execution boundary
                    </div>
                  )}
                </motion.div>
              ),
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-6 text-center">{slide.note}</p>
        </div>
      )}

      {/* Lifecycle Stages Slide */}
      {slide.type === "lifecycle-new" && (
        <div>
          <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-2">{slide.title}</h2>
          <p className="text-muted-foreground mb-10">{slide.subtitle}</p>
          <div className="flex items-center gap-2">
            {slide.stages?.map((stage: { name: string; desc: string }, i: number) => (
              <React.Fragment key={i}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * i }}
                  className="flex-1 py-6 px-3 rounded-lg border border-primary/30 bg-primary/5 text-center"
                >
                  <div className="text-2xl font-bold text-primary mb-1">{i + 1}</div>
                  <div className="font-semibold text-sm mb-1">{stage.name}</div>
                  <div className="text-[10px] text-muted-foreground">{stage.desc}</div>
                </motion.div>
                {i < (slide.stages?.length || 0) - 1 && <ArrowRight className="size-4 text-primary/50 flex-shrink-0" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Domain Lanes Slide (legacy) */}
      {slide.type === "lanes" && (
        <div>
          <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-2">{slide.title}</h2>
          <p className="text-muted-foreground mb-8">{slide.subtitle}</p>
          <div className="space-y-3">
            {slide.lanes?.map((lane: { name: string; desc: string; color: string }, i: number) => {
              const colorClasses: Record<string, string> = {
                sky: "border-sky-400/30 bg-sky-400/5 text-sky-400",
                violet: "border-violet-400/30 bg-violet-400/5 text-violet-400",
                amber: "border-amber-400/30 bg-amber-400/5 text-amber-400",
                emerald: "border-emerald-400/30 bg-emerald-400/5 text-emerald-400",
                rose: "border-rose-400/30 bg-rose-400/5 text-rose-400",
                slate: "border-slate-400/30 bg-slate-400/5 text-slate-400",
              };
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className={cn("flex items-center gap-4 p-3 rounded-lg border", colorClasses[lane.color])}
                >
                  <div className="w-24 font-semibold text-sm">{lane.name}</div>
                  <div className="flex-1 h-1.5 rounded-full bg-current opacity-20" />
                  <div className="text-xs text-muted-foreground w-64 text-right">{lane.desc}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lanes Visual Slide - with stage nodes */}
      {slide.type === "lanes-visual" && (
        <div>
          <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-2">{slide.title}</h2>
          <p className="text-muted-foreground mb-6">{slide.subtitle}</p>

          {/* Stage headers */}
          <div className="grid grid-cols-8 gap-2 mb-4">
            <div /> {/* Lane label column */}
            {((slide.stages as string[]) || []).map((stage: string) => (
              <div key={stage} className="text-center">
                <span className="text-[10px] text-muted-foreground font-medium">{stage}</span>
              </div>
            ))}
          </div>

          {/* Lane rows with stage nodes */}
          <div className="space-y-3">
            {(
              (slide.lanes as Array<{
                name: string;
                desc: string;
                color: string;
                emphasis: number[];
              }>) || []
            ).map((lane, i) => {
              const colorMap: Record<string, { node: string; nodeDim: string; glow: string }> = {
                sky: {
                  node: "bg-sky-400",
                  nodeDim: "bg-sky-400/30",
                  glow: "shadow-[0_0_8px_rgba(56,189,248,0.5)]",
                },
                violet: {
                  node: "bg-violet-400",
                  nodeDim: "bg-violet-400/30",
                  glow: "shadow-[0_0_8px_rgba(167,139,250,0.5)]",
                },
                amber: {
                  node: "bg-amber-400",
                  nodeDim: "bg-amber-400/30",
                  glow: "shadow-[0_0_8px_rgba(251,191,36,0.5)]",
                },
                emerald: {
                  node: "bg-emerald-400",
                  nodeDim: "bg-emerald-400/30",
                  glow: "shadow-[0_0_8px_rgba(52,211,153,0.5)]",
                },
                rose: {
                  node: "bg-rose-400",
                  nodeDim: "bg-rose-400/30",
                  glow: "shadow-[0_0_8px_rgba(251,113,133,0.5)]",
                },
                slate: {
                  node: "bg-slate-400",
                  nodeDim: "bg-slate-400/30",
                  glow: "shadow-[0_0_8px_rgba(148,163,184,0.5)]",
                },
              };
              const textColorMap: Record<string, string> = {
                sky: "text-sky-400",
                violet: "text-violet-400",
                amber: "text-amber-400",
                emerald: "text-emerald-400",
                rose: "text-rose-400",
                slate: "text-slate-400",
              };
              const colors = colorMap[lane.color] || colorMap.slate;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 * i }}
                  className="grid grid-cols-8 gap-2 items-center"
                >
                  <div className="flex flex-col">
                    <span className={cn("text-xs font-semibold", textColorMap[lane.color])}>{lane.name}</span>
                    <span className="text-[9px] text-muted-foreground">{lane.desc}</span>
                  </div>
                  {[0, 1, 2, 3, 4, 5, 6].map((stageIdx) => {
                    const isEmphasized = lane.emphasis.includes(stageIdx);
                    return (
                      <div key={stageIdx} className="flex items-center justify-center">
                        <div
                          className={cn(
                            "rounded-full transition-all",
                            isEmphasized ? cn("size-3", colors.node, colors.glow) : cn("size-1.5", colors.nodeDim),
                          )}
                        />
                      </div>
                    );
                  })}
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-8 mt-6 text-[10px] text-muted-foreground border-t border-border/50 pt-4">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
              <span>Primary</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-emerald-400/30" />
              <span>Supporting</span>
            </div>
          </div>
        </div>
      )}

      {/* Commercial Packaging Slide */}
      {slide.type === "packaging" && (
        <div>
          <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-2">{slide.title}</h2>
          <p className="text-muted-foreground mb-6">{slide.subtitle}</p>
          <div className="grid grid-cols-3 gap-4">
            {(
              (slide.services as Array<{
                name: string;
                stages: string[];
                model: string;
                desc: string;
              }>) || []
            ).map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="p-4 rounded-lg border border-border bg-card"
              >
                <div className="font-semibold text-sm mb-2">{service.name}</div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {service.stages.map((s: string) => (
                    <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mb-2">{service.desc}</div>
                <div className="text-xs font-medium text-primary">{service.model}</div>
              </motion.div>
            ))}
          </div>
          {slide.note && <p className="text-xs text-muted-foreground mt-6 text-center">{slide.note}</p>}
        </div>
      )}

      {/* Problem Slide */}
      {slide.type === "problem" && (
        <div>
          <h2 className="text-3xl font-bold text-primary border-b border-border pb-2 mb-2">{slide.title}</h2>
          <p className="text-muted-foreground mb-6">{slide.subtitle}</p>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {slide.costs?.map(
              (
                cost: {
                  label?: string;
                  value?: string;
                  icon?: string;
                  asset?: string;
                  vendor?: string;
                  cost?: string;
                  period?: string;
                },
                i: number,
              ) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-center"
                >
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{cost.asset}</div>
                  <div className="font-semibold text-sm mb-1">{cost.vendor}</div>
                  <div className="text-xl font-bold text-destructive">{cost.cost}</div>
                  <div className="text-xs text-muted-foreground">{cost.period}</div>
                </motion.div>
              ),
            )}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 rounded-lg border border-border bg-card">
              <h3 className="text-sm font-semibold text-destructive uppercase tracking-wider mb-3">The Pain</h3>
              <ul className="space-y-2">
                {slide.pain?.map((item: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-destructive">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Our Solution</h3>
              <p className="text-lg font-semibold text-primary">{slide.solution}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
