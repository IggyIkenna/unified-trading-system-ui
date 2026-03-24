"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  FlaskConical,
  Zap,
  ArrowRight,
  BarChart3,
  GitBranch,
  Target,
  Layers,
  TrendingUp,
  Activity,
  Beaker,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useModelFamilies, useExperiments } from "@/hooks/api/use-ml-models";

const ML_WORKFLOWS = [
  {
    label: "Select",
    desc: "Choose model family, instruments, asset class",
    icon: Target,
    href: "/services/research/ml/overview",
  },
  {
    label: "Features",
    desc: "Select features for the model",
    icon: Layers,
    href: "/services/research/ml/features",
  },
  {
    label: "Train",
    desc: "Configure hyperparameters, launch training",
    icon: Brain,
    href: "/services/research/ml/training",
  },
  {
    label: "Validate",
    desc: "Evaluate model performance, compare runs",
    icon: BarChart3,
    href: "/services/research/ml/validation",
  },
  {
    label: "Deploy",
    desc: "Promote to registry, deploy to production",
    icon: Zap,
    href: "/services/research/ml/deploy",
  },
  {
    label: "Monitor",
    desc: "Track live performance, detect drift",
    icon: Activity,
    href: "/services/research/ml/monitoring",
  },
];

const STRATEGY_WORKFLOWS = [
  {
    label: "Configure",
    desc: "Choose strategy archetype, instruments, venues",
    icon: FlaskConical,
    href: "/services/research/strategy/backtests",
  },
  {
    label: "Backtest",
    desc: "Run parameter grid backtests",
    icon: Beaker,
    href: "/services/research/strategy/heatmap",
  },
  {
    label: "Compare",
    desc: "Compare backtest results side-by-side",
    icon: BarChart3,
    href: "/services/research/strategy/compare",
  },
  {
    label: "Candidates",
    desc: "Review and promote winning strategies",
    icon: Target,
    href: "/services/research/strategy/candidates",
  },
  {
    label: "Handoff",
    desc: "Promote to live trading",
    icon: ArrowRight,
    href: "/services/research/strategy/handoff",
  },
];

const EXECUTION_WORKFLOWS = [
  {
    label: "Algos",
    desc: "Compare execution algorithms",
    icon: GitBranch,
    href: "/services/execution/algos",
  },
  {
    label: "Venues",
    desc: "Venue selection and routing analysis",
    icon: Layers,
    href: "/services/execution/venues",
  },
  {
    label: "TCA",
    desc: "Transaction cost analysis",
    icon: TrendingUp,
    href: "/services/execution/tca",
  },
  {
    label: "Benchmarks",
    desc: "Benchmark comparison across algos",
    icon: BarChart3,
    href: "/services/execution/benchmarks",
  },
];

function WorkflowPipeline({ steps }: { steps: typeof ML_WORKFLOWS }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {steps.map((step, i) => {
        const Icon = step.icon;
        return (
          <Link key={step.label} href={step.href}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary shrink-0">
                    <span className="text-xs font-bold">{i + 1}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 text-primary" />
                      <span className="font-medium text-sm">{step.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

export default function ResearchOverviewPage() {
  const { user, hasEntitlement } = useAuth();
  const { data: modelFamiliesData, isLoading: familiesLoading } =
    useModelFamilies();
  const { data: experimentsData, isLoading: experimentsLoading } =
    useExperiments();
  const modelFamilies: any[] =
    (modelFamiliesData as any)?.data ??
    (modelFamiliesData as any)?.families ??
    [];
  const experiments: any[] =
    (experimentsData as any)?.data ??
    (experimentsData as any)?.experiments ??
    [];
  const hasML = hasEntitlement("ml-full");
  const hasStrategy = hasEntitlement("strategy-full");
  const hasExecution =
    hasEntitlement("execution-basic") || hasEntitlement("execution-full");

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Research & Backtesting
        </h1>
        <p className="text-muted-foreground mt-1">
          ML model training, strategy backtesting, and execution research — from
          signal to trade.
        </p>
      </div>

      <Tabs defaultValue="ml" className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="ml" className="gap-2">
            <Brain className="size-4" />
            ML Models
          </TabsTrigger>
          <TabsTrigger value="strategy" className="gap-2">
            <FlaskConical className="size-4" />
            Strategy
          </TabsTrigger>
          <TabsTrigger value="execution" className="gap-2">
            <Zap className="size-4" />
            Execution
          </TabsTrigger>
        </TabsList>

        {/* ML Models & Training */}
        <TabsContent value="ml" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="size-5 text-violet-400" />
                    ML Models & Training
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Train prediction models on your data. Select → configure
                    features → set targets → generate parameter grid → run
                    training → analyse results.
                  </CardDescription>
                </div>
                {hasML ? (
                  <Badge
                    variant="outline"
                    className="text-emerald-400 border-emerald-400/30"
                  >
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    <Link href="/services/ml">Upgrade to access</Link>
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <WorkflowPipeline steps={ML_WORKFLOWS} />
              <div className="mt-4 flex gap-2">
                <Button asChild size="sm">
                  <Link href="/services/research/ml/overview">
                    Open ML Dashboard <ChevronRight className="size-4 ml-1" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/services/research/ml/experiments">
                    View Experiments
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Model Families",
                value: String(modelFamilies.length || 6),
                desc:
                  modelFamilies.length > 0
                    ? `${modelFamilies.length} families`
                    : "BTC, ETH, Momentum, Funding, NFL, Polymarket",
              },
              {
                label: "Active Experiments",
                value: String(experiments.length || 12),
                desc:
                  experiments.length > 0
                    ? `${experiments.length} experiments`
                    : "Across 3 asset classes",
              },
              {
                label: "Feature Sets",
                value: "8",
                desc: "Technical, volatility, momentum, on-chain",
              },
              { label: "Deployed Models", value: "4", desc: "Live inference" },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm font-medium">{stat.label}</p>
                  <p className="text-xs text-muted-foreground">{stat.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Strategy Research */}
        <TabsContent value="strategy" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FlaskConical className="size-5 text-amber-400" />
                    Strategy Research
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Configure strategy archetypes, run parameter grid backtests,
                    compare results, and promote winners to live trading.
                  </CardDescription>
                </div>
                {hasStrategy ? (
                  <Badge
                    variant="outline"
                    className="text-emerald-400 border-emerald-400/30"
                  >
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    <Link href="/services/research-backtesting">
                      Upgrade to access
                    </Link>
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <WorkflowPipeline steps={STRATEGY_WORKFLOWS} />
              <div className="mt-4 flex gap-2">
                <Button asChild size="sm">
                  <Link href="/services/research/strategy/backtests">
                    Open Backtests <ChevronRight className="size-4 ml-1" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/services/research/strategy/candidates">
                    View Candidates
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Execution Research */}
        <TabsContent value="execution" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="size-5 text-emerald-400" />
                    Execution Research
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Analyse execution algorithms, compare venue performance, and
                    optimise transaction costs.
                  </CardDescription>
                </div>
                {hasExecution ? (
                  <Badge
                    variant="outline"
                    className="text-emerald-400 border-emerald-400/30"
                  >
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    <Link href="/services/execution">Upgrade to access</Link>
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <WorkflowPipeline steps={EXECUTION_WORKFLOWS} />
              <div className="mt-4 flex gap-2">
                <Button asChild size="sm">
                  <Link href="/services/execution/algos">
                    Open Algo Comparison{" "}
                    <ChevronRight className="size-4 ml-1" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/services/execution/tca">View TCA</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
