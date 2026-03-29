"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { MessageSquare, Sparkles, Send } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { ExecutiveNaturalLanguageCardProps } from "./executive-dashboard-types";

export function ExecutiveNaturalLanguageCard({
  nlQuery,
  onNlQueryChange,
  onPickDemoQuestion,
  nlResponse,
  nlLoading,
  onSubmitNl,
  nlDemoQuestions,
}: ExecutiveNaturalLanguageCardProps) {
  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="size-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-medium">Ask Your Portfolio</CardTitle>
            <p className="text-xs text-muted-foreground">Natural language queries across all your data</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={nlQuery}
            onChange={(e) => onNlQueryChange(e.target.value)}
            placeholder="Ask anything about your portfolio performance..."
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && onSubmitNl()}
          />
          <Button onClick={onSubmitNl} disabled={nlLoading}>
            {nlLoading ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" className="text-current" />
                Analyzing...
              </span>
            ) : (
              <>
                <Send className="size-4 mr-2" />
                Ask
              </>
            )}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {nlDemoQuestions.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                onPickDemoQuestion(q);
              }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                nlQuery === q
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {q.length > 60 ? q.slice(0, 60) + "..." : q}
            </button>
          ))}
        </div>

        {nlResponse && (
          <div className="mt-4 p-4 rounded-lg border border-border bg-card">
            <div className="flex items-start gap-3">
              <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <MessageSquare className="size-3 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="prose prose-sm prose-invert max-w-none">
                  {nlResponse.answer.split("\n").map((line, i) => {
                    if (line.startsWith("**") && line.endsWith("**")) {
                      return (
                        <h4 key={i} className="text-sm font-semibold text-foreground mt-3 mb-1">
                          {line.replace(/\*\*/g, "")}
                        </h4>
                      );
                    }
                    if (line.startsWith("- ")) {
                      return (
                        <p key={i} className="text-sm text-muted-foreground ml-4">
                          {line}
                        </p>
                      );
                    }
                    if (line.includes("**")) {
                      const parts = line.split(/\*\*/);
                      return (
                        <p key={i} className="text-sm text-muted-foreground">
                          {parts.map((part, j) =>
                            j % 2 === 1 ? (
                              <strong key={j} className="text-primary font-semibold">
                                {part}
                              </strong>
                            ) : (
                              part
                            ),
                          )}
                        </p>
                      );
                    }
                    return line.trim() ? (
                      <p key={i} className="text-sm text-muted-foreground">
                        {line}
                      </p>
                    ) : null;
                  })}
                </div>

                <div className="mt-4 p-3 rounded-lg border border-border bg-muted/30">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Q4 Monthly Sharpe vs Funding Rate
                  </p>
                  <div className="h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={nlResponse.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                        <YAxis
                          yAxisId="left"
                          tick={{ fontSize: 10 }}
                          stroke="var(--muted-foreground)"
                          domain={[0, 4]}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 10 }}
                          stroke="var(--muted-foreground)"
                          domain={[0, 6]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--popover)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="sharpe"
                          name="Sharpe Ratio"
                          fill="var(--surface-trading)"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          yAxisId="right"
                          dataKey="funding"
                          name="Funding Rate %"
                          fill="var(--surface-strategy)"
                          radius={[4, 4, 0, 0]}
                          fillOpacity={0.5}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
