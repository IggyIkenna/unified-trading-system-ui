"use client";

import { ExecutionNav } from "@/components/execution-platform/execution-nav";
import { ResearchFamilyShell } from "@/components/platform/research-family-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function TcaPage() {
  return (
    <ResearchFamilyShell>
      <ExecutionNav />
      <div className="space-y-6">
        <PageHeader
          title="Transaction Cost Analysis"
          description="Per-order execution quality vs benchmarks — coming soon."
        />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Construction className="size-5 text-muted-foreground" />
              <CardTitle>TCA surface under construction</CardTitle>
            </div>
            <CardDescription>
              TCA (Transaction Cost Analysis) compares every executed order against benchmark prices
              (arrival, VWAP, implementation shortfall) and surfaces execution alpha vs baseline.
              This page will roll up per-order TCA from <code>execution-service</code> matching engine +
              live fills, grouped by algo, venue, and strategy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Tracked in the playbook SSOT roadmap under{" "}
              <strong>Wave 2c — Execution Algo Catalogue</strong>.
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/services/execution/overview">
                  Execution Overview
                  <ArrowRight className="ml-1 size-3" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/services/reports/trades">
                  Trade reports
                  <ArrowRight className="ml-1 size-3" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ResearchFamilyShell>
  );
}
