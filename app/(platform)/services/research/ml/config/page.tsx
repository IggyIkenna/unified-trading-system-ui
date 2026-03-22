"use client"

/**
 * ML Config Workflow — Select → Features → Target → Grid → Run → Results
 *
 * Interactive pipeline for configuring and launching ML training runs.
 * Uses real model families and training params from lib/ml-mock-data.ts.
 */

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Target,
  Layers,
  Brain,
  Grid3X3,
  Play,
  BarChart3,
  ChevronRight,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { useModelFamilies, useFeatureProvenance } from "@/hooks/api/use-ml-models"

// Workflow steps
const STEPS = [
  { id: "select", label: "Select", icon: Target, desc: "Model family & instruments" },
  { id: "features", label: "Features", icon: Layers, desc: "Feature set selection" },
  { id: "target", label: "Target", icon: Brain, desc: "Target variable" },
  { id: "grid", label: "Grid", icon: Grid3X3, desc: "Parameter grid config" },
  { id: "run", label: "Run", icon: Play, desc: "Launch training" },
  { id: "results", label: "Results", icon: BarChart3, desc: "View results" },
] as const

type StepId = typeof STEPS[number]["id"]

const TARGET_VARIABLES = [
  { id: "return", label: "Return", desc: "Predict directional return (long/short signal)" },
  { id: "volatility", label: "Volatility", desc: "Predict realised volatility (vol surface)" },
  { id: "direction", label: "Direction", desc: "Binary up/down classification" },
  { id: "regime", label: "Regime", desc: "Market regime detection (trending/mean-reverting/volatile)" },
]

const ASSET_CLASSES = ["CeFi", "DeFi", "TradFi", "Sports", "Prediction"]

const OPTIMIZERS = ["adam", "sgd", "adamw", "adagrad"]
const LOSS_FUNCTIONS = ["mse", "cross_entropy", "huber", "focal"]
const GPU_TYPES = ["T4", "A100", "V100", "L4"]

export default function MLConfigPage() {
  const { data: familiesData, isLoading: familiesLoading } = useModelFamilies()
  const { data: featuresData, isLoading: featuresLoading } = useFeatureProvenance()
  const MODEL_FAMILIES: Array<{ id: string; name: string; description: string; archetype: string; totalVersions: number; assetClasses: string[] }> = (familiesData as any)?.data ?? []
  const FEATURE_SET_VERSIONS: Array<{ id: string; name: string; version: string; featureCount: number; coveragePct: number }> = (featuresData as any)?.data ?? []

  const [currentStep, setCurrentStep] = React.useState<StepId>("select")
  const [selectedFamily, setSelectedFamily] = React.useState<string>("")
  const [selectedAssetClass, setSelectedAssetClass] = React.useState<string>("CeFi")
  const [selectedFeatures, setSelectedFeatures] = React.useState<string[]>([])
  const [selectedTarget, setSelectedTarget] = React.useState<string>("return")
  const [isRunning, setIsRunning] = React.useState(false)

  // Training config state
  const [epochs, setEpochs] = React.useState(100)
  const [batchSize, setBatchSize] = React.useState(256)
  const [learningRate, setLearningRate] = React.useState(0.001)
  const [optimizer, setOptimizer] = React.useState("adamw")
  const [lossFunction, setLossFunction] = React.useState("cross_entropy")
  const [gpuType, setGpuType] = React.useState("A100")
  const [earlyStopping, setEarlyStopping] = React.useState(true)
  const [numGpus, setNumGpus] = React.useState(1)

  // Grid config
  const [gridLrMin, setGridLrMin] = React.useState(0.0001)
  const [gridLrMax, setGridLrMax] = React.useState(0.01)
  const [gridEpochsMin, setGridEpochsMin] = React.useState(50)
  const [gridEpochsMax, setGridEpochsMax] = React.useState(300)
  const [gridBatchSizes, setGridBatchSizes] = React.useState([32, 128, 256, 512])

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep)
  const family = MODEL_FAMILIES.find(f => f.id === selectedFamily)

  const gridSize = React.useMemo(() => {
    const lrSteps = 4
    const epochSteps = 3
    const batchSteps = gridBatchSizes.length
    return lrSteps * epochSteps * batchSteps
  }, [gridBatchSizes.length])

  const handleLaunch = () => {
    setIsRunning(true)
    setTimeout(() => {
      setIsRunning(false)
      setCurrentStep("results")
    }, 2000)
  }

  if (familiesLoading || featuresLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>

  return (
    <div className="space-y-6 p-6">
      {/* Step Progress Bar */}
      <div className="flex items-center gap-1">
        {STEPS.map((step, idx) => {
          const Icon = step.icon
          const isComplete = idx < currentStepIndex
          const isCurrent = step.id === currentStep
          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => idx <= currentStepIndex && setCurrentStep(step.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  isCurrent && "bg-primary text-primary-foreground",
                  isComplete && "bg-primary/10 text-primary cursor-pointer",
                  !isCurrent && !isComplete && "text-muted-foreground"
                )}
              >
                {isComplete ? (
                  <Check className="size-4" />
                ) : (
                  <Icon className="size-4" />
                )}
                <span className="hidden md:inline">{step.label}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <ChevronRight className="size-4 text-muted-foreground shrink-0" />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Step Content */}
      {currentStep === "select" && (
        <Card>
          <CardHeader>
            <CardTitle>Select Model Family</CardTitle>
            <CardDescription>Choose a model family and filter by asset class</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label className="mb-2 block">Asset Class</Label>
                <Select value={selectedAssetClass} onValueChange={setSelectedAssetClass}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSET_CLASSES.map(ac => (
                      <SelectItem key={ac} value={ac}>{ac}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {MODEL_FAMILIES.filter(f =>
                f.assetClasses.includes(selectedAssetClass)
              ).map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFamily(f.id)}
                  className={cn(
                    "text-left p-4 rounded-lg border transition-all",
                    selectedFamily === f.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{f.name}</span>
                    {selectedFamily === f.id && <Check className="size-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{f.description}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px]">{f.archetype}</Badge>
                    <Badge variant="outline" className="text-[10px]">{f.totalVersions} versions</Badge>
                  </div>
                </button>
              ))}
            </div>

            <Button
              disabled={!selectedFamily}
              onClick={() => setCurrentStep("features")}
              className="mt-4"
            >
              Continue <ChevronRight className="size-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === "features" && (
        <Card>
          <CardHeader>
            <CardTitle>Select Feature Sets</CardTitle>
            <CardDescription>
              Choose which feature sets to include in training for {family?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {FEATURE_SET_VERSIONS.map(fs => (
              <button
                key={fs.id}
                onClick={() => {
                  setSelectedFeatures(prev =>
                    prev.includes(fs.id)
                      ? prev.filter(id => id !== fs.id)
                      : [...prev, fs.id]
                  )
                }}
                className={cn(
                  "w-full text-left p-4 rounded-lg border transition-all",
                  selectedFeatures.includes(fs.id)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">{fs.name}</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      v{fs.version} · {fs.featureCount} features · {fs.coveragePct}% coverage
                    </p>
                  </div>
                  {selectedFeatures.includes(fs.id) && <Check className="size-4 text-primary" />}
                </div>
              </button>
            ))}

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setCurrentStep("select")}>Back</Button>
              <Button
                disabled={selectedFeatures.length === 0}
                onClick={() => setCurrentStep("target")}
              >
                Continue <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === "target" && (
        <Card>
          <CardHeader>
            <CardTitle>Target Variable</CardTitle>
            <CardDescription>What should the model predict?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TARGET_VARIABLES.map(tv => (
                <button
                  key={tv.id}
                  onClick={() => setSelectedTarget(tv.id)}
                  className={cn(
                    "text-left p-4 rounded-lg border transition-all",
                    selectedTarget === tv.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{tv.label}</span>
                    {selectedTarget === tv.id && <Check className="size-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{tv.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setCurrentStep("features")}>Back</Button>
              <Button onClick={() => setCurrentStep("grid")}>
                Continue <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === "grid" && (
        <Card>
          <CardHeader>
            <CardTitle>Parameter Grid Configuration</CardTitle>
            <CardDescription>
              Configure the hyperparameter search space. {gridSize} configurations will be generated.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Base training config */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Label className="mb-2 block">Optimizer</Label>
                <Select value={optimizer} onValueChange={setOptimizer}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OPTIMIZERS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Loss Function</Label>
                <Select value={lossFunction} onValueChange={setLossFunction}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LOSS_FUNCTIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">GPU Type</Label>
                <Select value={gpuType} onValueChange={setGpuType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GPU_TYPES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sliders for search ranges */}
            <div className="space-y-6 border rounded-lg p-4 bg-muted/30">
              <h4 className="text-sm font-semibold">Hyperparameter Search Ranges</h4>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Learning Rate Range</Label>
                  <span className="text-xs text-muted-foreground font-mono">
                    {gridLrMin.toFixed(4)} — {gridLrMax.toFixed(4)}
                  </span>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label className="text-[10px] text-muted-foreground">Min</Label>
                    <Slider
                      value={[gridLrMin * 10000]}
                      onValueChange={([v]) => setGridLrMin(v / 10000)}
                      min={1}
                      max={100}
                      step={1}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-[10px] text-muted-foreground">Max</Label>
                    <Slider
                      value={[gridLrMax * 10000]}
                      onValueChange={([v]) => setGridLrMax(v / 10000)}
                      min={1}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Epochs Range</Label>
                  <span className="text-xs text-muted-foreground font-mono">
                    {gridEpochsMin} — {gridEpochsMax}
                  </span>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label className="text-[10px] text-muted-foreground">Min</Label>
                    <Slider
                      value={[gridEpochsMin]}
                      onValueChange={([v]) => setGridEpochsMin(v)}
                      min={10}
                      max={500}
                      step={10}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-[10px] text-muted-foreground">Max</Label>
                    <Slider
                      value={[gridEpochsMax]}
                      onValueChange={([v]) => setGridEpochsMax(v)}
                      min={10}
                      max={500}
                      step={10}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Batch Sizes</Label>
                  <span className="text-xs text-muted-foreground font-mono">
                    {gridBatchSizes.join(", ")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[32, 64, 128, 256, 512, 1024].map(bs => (
                    <button
                      key={bs}
                      onClick={() => {
                        setGridBatchSizes(prev =>
                          prev.includes(bs) ? prev.filter(b => b !== bs) : [...prev, bs].sort((a, b) => a - b)
                        )
                      }}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                        gridBatchSizes.includes(bs)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      {bs}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={earlyStopping} onCheckedChange={setEarlyStopping} />
                  <Label>Early Stopping</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label>GPUs</Label>
                  <Select value={String(numGpus)} onValueChange={v => setNumGpus(Number(v))}>
                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 4, 8].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-sm">
                <span className="font-medium">{gridSize}</span>
                <span className="text-muted-foreground"> configurations will be generated</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep("target")}>Back</Button>
                <Button onClick={() => setCurrentStep("run")}>
                  Review & Launch <ChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === "run" && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Launch</CardTitle>
            <CardDescription>Review your configuration before launching training</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 p-4 border rounded-lg">
                <h4 className="text-sm font-semibold">Model Configuration</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Family</span>
                    <span className="font-medium">{family?.name ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Asset Class</span>
                    <span>{selectedAssetClass}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target</span>
                    <span>{TARGET_VARIABLES.find(t => t.id === selectedTarget)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Feature Sets</span>
                    <span>{selectedFeatures.length} selected</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4 border rounded-lg">
                <h4 className="text-sm font-semibold">Training Configuration</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Grid Size</span>
                    <span className="font-medium">{gridSize} configs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Optimizer</span>
                    <span>{optimizer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GPU</span>
                    <span>{numGpus}x {gpuType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Early Stopping</span>
                    <span>{earlyStopping ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setCurrentStep("grid")}>Back</Button>
              <Button onClick={handleLaunch} disabled={isRunning}>
                {isRunning ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Launching...
                  </>
                ) : (
                  <>
                    <Play className="size-4 mr-2" />
                    Launch {gridSize} Training Runs
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === "results" && (
        <Card>
          <CardHeader>
            <CardTitle>Training Results</CardTitle>
            <CardDescription>
              {gridSize} runs completed for {family?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mock results table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Config</th>
                    <th className="text-right p-3 font-medium">LR</th>
                    <th className="text-right p-3 font-medium">Epochs</th>
                    <th className="text-right p-3 font-medium">Batch</th>
                    <th className="text-right p-3 font-medium">Accuracy</th>
                    <th className="text-right p-3 font-medium">Sharpe</th>
                    <th className="text-right p-3 font-medium">Loss</th>
                    <th className="text-center p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: Math.min(gridSize, 12) }, (_, i) => {
                    const lr = (gridLrMin + (gridLrMax - gridLrMin) * (i / gridSize)).toFixed(4)
                    const epoch = gridEpochsMin + Math.floor((gridEpochsMax - gridEpochsMin) * ((i * 3) % 10) / 10)
                    const batch = gridBatchSizes[i % gridBatchSizes.length]
                    const acc = (0.55 + Math.random() * 0.2).toFixed(3)
                    const sharpe = (0.5 + Math.random() * 2.5).toFixed(2)
                    const loss = (0.2 + Math.random() * 0.5).toFixed(3)
                    const best = i === 2
                    return (
                      <tr key={i} className={cn("border-b", best && "bg-emerald-500/5")}>
                        <td className="p-3 font-mono text-xs">
                          run-{String(i + 1).padStart(3, "0")}
                          {best && <Badge className="ml-2 text-[9px]" variant="outline">Best</Badge>}
                        </td>
                        <td className="p-3 text-right font-mono text-xs">{lr}</td>
                        <td className="p-3 text-right">{epoch}</td>
                        <td className="p-3 text-right">{batch}</td>
                        <td className="p-3 text-right font-mono">{acc}</td>
                        <td className="p-3 text-right font-mono">{sharpe}</td>
                        <td className="p-3 text-right font-mono">{loss}</td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-[10px]">
                            Done
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/services/research/ml/experiments">View All Experiments</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/services/research/ml/deploy">Promote Best Model</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
