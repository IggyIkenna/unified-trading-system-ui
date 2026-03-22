"use client"

import * as React from "react"
import { Check, ChevronRight, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useStrategyTemplates, useCreateBacktest } from "@/hooks/api/use-strategies"
import {
  STRATEGY_ARCHETYPES,
  ASSET_CLASSES,
  type StrategyArchetype,
  type AssetClass,
  type StrategyTemplate,
} from "@/lib/strategy-platform-types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StrategyWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface WizardFormState {
  // Step 1: Basic Config
  name: string
  description: string
  assetClass: AssetClass | ""
  // Step 2: Strategy Selection
  templateId: string
  // Step 3: Parameters
  instrument: string
  venue: string
  dateStart: string
  dateEnd: string
  entryThreshold: string
  exitThreshold: string
  maxLeverage: string
  initialCapital: string
  // Step 4 is review only
}

const INITIAL_FORM: WizardFormState = {
  name: "",
  description: "",
  assetClass: "",
  templateId: "",
  instrument: "",
  venue: "",
  dateStart: "2024-01-01",
  dateEnd: "2024-12-31",
  entryThreshold: "0.05",
  exitThreshold: "0.02",
  maxLeverage: "3.0",
  initialCapital: "100000",
}

const STEPS = [
  { id: "basic", title: "Basic Config", description: "Name and asset class" },
  { id: "strategy", title: "Strategy Selection", description: "Choose archetype" },
  { id: "parameters", title: "Parameters", description: "Trading parameters" },
  { id: "review", title: "Review", description: "Confirm and submit" },
] as const

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

function StepIndicator({
  steps,
  currentStep,
}: {
  steps: typeof STEPS
  currentStep: number
}) {
  return (
    <div className="flex items-center justify-center gap-0 py-4">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`
                  flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-all
                  ${
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                        ? "border-2 border-primary bg-primary/10 text-primary"
                        : "border border-border bg-muted text-muted-foreground"
                  }
                `}
              >
                {isCompleted ? <Check className="size-3.5" /> : index + 1}
              </div>
              <span
                className={`text-[10px] font-medium leading-tight ${
                  isCurrent || isCompleted
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mx-2 mb-5 h-px w-8 transition-colors ${
                  isCompleted ? "bg-emerald-500" : "bg-border"
                }`}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 1: Basic Config
// ---------------------------------------------------------------------------

function BasicConfigStep({
  form,
  onChange,
}: {
  form: WizardFormState
  onChange: (updates: Partial<WizardFormState>) => void
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="wizard-name">
          Strategy Name <span className="text-red-400">*</span>
        </Label>
        <Input
          id="wizard-name"
          placeholder="e.g. BTC Momentum Alpha v2"
          value={form.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="wizard-description">Description</Label>
        <Textarea
          id="wizard-description"
          placeholder="Brief description of the strategy approach..."
          value={form.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="wizard-asset-class">
          Asset Class <span className="text-red-400">*</span>
        </Label>
        <Select
          value={form.assetClass}
          onValueChange={(v) => onChange({ assetClass: v as AssetClass, templateId: "", instrument: "", venue: "" })}
        >
          <SelectTrigger id="wizard-asset-class" className="w-full">
            <SelectValue placeholder="Select asset class..." />
          </SelectTrigger>
          <SelectContent>
            {ASSET_CLASSES.map((ac) => (
              <SelectItem key={ac} value={ac}>
                {ac.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 2: Strategy Selection
// ---------------------------------------------------------------------------

function StrategySelectionStep({
  form,
  onChange,
  templates,
  isLoading,
}: {
  form: WizardFormState
  onChange: (updates: Partial<WizardFormState>) => void
  templates: StrategyTemplate[]
  isLoading: boolean
}) {
  // Filter templates by selected asset class if set
  const filtered = form.assetClass
    ? templates.filter((t) =>
        t.assetClasses.some((ac) => ac === form.assetClass),
      )
    : templates

  // Group by archetype for display
  const byArchetype = React.useMemo(() => {
    const map = new Map<StrategyArchetype, StrategyTemplate[]>()
    for (const tpl of filtered) {
      const existing = map.get(tpl.archetype) ?? []
      existing.push(tpl)
      map.set(tpl.archetype, existing)
    }
    return map
  }, [filtered])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Loading strategy templates...
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No strategy templates found
        {form.assetClass ? ` for ${form.assetClass.replace(/_/g, " ")}` : ""}.
      </div>
    )
  }

  return (
    <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
      {Array.from(byArchetype.entries()).map(([archetype, tpls]) => (
        <div key={archetype}>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {archetype.replace(/_/g, " ")}
          </p>
          <div className="space-y-2">
            {tpls.map((tpl) => {
              const isSelected = form.templateId === tpl.id
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() =>
                    onChange({
                      templateId: tpl.id,
                      instrument: "",
                      venue: "",
                    })
                  }
                  className={`w-full rounded-lg border p-3 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:border-border/80 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{tpl.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {tpl.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="ml-2 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary">
                        <Check className="size-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-[10px]">
                      {tpl.archetype.replace(/_/g, " ")}
                    </Badge>
                    {tpl.venues.slice(0, 2).map((v) => (
                      <Badge key={v} variant="secondary" className="text-[10px]">
                        {v}
                      </Badge>
                    ))}
                    {tpl.venues.length > 2 && (
                      <Badge variant="secondary" className="text-[10px]">
                        +{tpl.venues.length - 2}
                      </Badge>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 3: Parameters
// ---------------------------------------------------------------------------

function ParametersStep({
  form,
  onChange,
  selectedTemplate,
}: {
  form: WizardFormState
  onChange: (updates: Partial<WizardFormState>) => void
  selectedTemplate: StrategyTemplate | undefined
}) {
  return (
    <div className="space-y-4">
      {selectedTemplate && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Instrument</Label>
            <Select
              value={form.instrument}
              onValueChange={(v) => onChange({ instrument: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {selectedTemplate.instruments.map((inst) => (
                  <SelectItem key={inst} value={inst}>
                    {inst}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Venue</Label>
            <Select
              value={form.venue}
              onValueChange={(v) => onChange({ venue: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {selectedTemplate.venues.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input
            type="date"
            value={form.dateStart}
            onChange={(e) => onChange({ dateStart: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>End Date</Label>
          <Input
            type="date"
            value={form.dateEnd}
            onChange={(e) => onChange({ dateEnd: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Initial Capital (USD)</Label>
        <Input
          type="number"
          min="1000"
          max="10000000"
          step="1000"
          value={form.initialCapital}
          onChange={(e) => onChange({ initialCapital: e.target.value })}
        />
        <p className="text-[10px] text-muted-foreground">
          Min: 1,000 | Max: 10,000,000
        </p>
      </div>

      <Separator />

      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Trading Parameters
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Entry Threshold</Label>
            <Input
              type="number"
              step="0.01"
              value={form.entryThreshold}
              onChange={(e) => onChange({ entryThreshold: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Exit Threshold</Label>
            <Input
              type="number"
              step="0.01"
              value={form.exitThreshold}
              onChange={(e) => onChange({ exitThreshold: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Max Leverage</Label>
            <Input
              type="number"
              step="0.5"
              value={form.maxLeverage}
              onChange={(e) => onChange({ maxLeverage: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 4: Review
// ---------------------------------------------------------------------------

function ReviewStep({
  form,
  selectedTemplate,
}: {
  form: WizardFormState
  selectedTemplate: StrategyTemplate | undefined
}) {
  const duration = React.useMemo(() => {
    if (!form.dateStart || !form.dateEnd) return 0
    const start = new Date(form.dateStart + "T00:00:00")
    const end = new Date(form.dateEnd + "T00:00:00")
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }, [form.dateStart, form.dateEnd])

  const rows: { label: string; value: string }[] = [
    { label: "Strategy Name", value: form.name },
    { label: "Description", value: form.description || "--" },
    { label: "Asset Class", value: form.assetClass ? form.assetClass.replace(/_/g, " ") : "--" },
    { label: "Template", value: selectedTemplate?.name ?? form.templateId },
    { label: "Archetype", value: selectedTemplate?.archetype.replace(/_/g, " ") ?? "--" },
    { label: "Instrument", value: form.instrument || selectedTemplate?.instruments[0] || "--" },
    { label: "Venue", value: form.venue || selectedTemplate?.venues[0] || "--" },
    { label: "Date Window", value: `${form.dateStart}  ->  ${form.dateEnd}  (${duration} days)` },
    { label: "Initial Capital", value: `$${Number(form.initialCapital).toLocaleString()}` },
    { label: "Entry / Exit", value: `${form.entryThreshold} / ${form.exitThreshold}` },
    { label: "Max Leverage", value: `${form.maxLeverage}x` },
  ]

  return (
    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
        >
          <span className="text-xs text-muted-foreground">{row.label}</span>
          <span className="text-sm font-medium">{row.value}</span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Wizard Component
// ---------------------------------------------------------------------------

export function StrategyWizard({ open, onOpenChange }: StrategyWizardProps) {
  const [currentStep, setCurrentStep] = React.useState(0)
  const [form, setForm] = React.useState<WizardFormState>(INITIAL_FORM)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const { data: templatesData, isLoading: templatesLoading } = useStrategyTemplates()
  const createBacktest = useCreateBacktest()

  const templates: StrategyTemplate[] = React.useMemo(() => {
    const raw = templatesData as Record<string, unknown> | undefined
    return (raw?.data ?? raw?.templates ?? []) as StrategyTemplate[]
  }, [templatesData])

  const selectedTemplate = templates.find((t) => t.id === form.templateId)

  // Reset when dialog closes
  React.useEffect(() => {
    if (!open) {
      setCurrentStep(0)
      setForm(INITIAL_FORM)
      setIsSubmitting(false)
    }
  }, [open])

  const updateForm = React.useCallback((updates: Partial<WizardFormState>) => {
    setForm((prev) => ({ ...prev, ...updates }))
  }, [])

  // ---------------------------------------------------------------------------
  // Validation per step
  // ---------------------------------------------------------------------------

  function canProceed(): boolean {
    switch (currentStep) {
      case 0:
        return form.name.trim().length > 0 && form.assetClass !== ""
      case 1:
        return form.templateId !== ""
      case 2: {
        const capital = Number(form.initialCapital)
        if (isNaN(capital) || capital < 1000 || capital > 10_000_000) return false
        if (!form.dateStart || !form.dateEnd) return false
        const start = new Date(form.dateStart + "T00:00:00")
        const end = new Date(form.dateEnd + "T00:00:00")
        const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        return days >= 7
      }
      case 3:
        return true
      default:
        return false
    }
  }

  function handleNext() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1)
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
    }
  }

  async function handleSubmit() {
    if (!selectedTemplate) return
    setIsSubmitting(true)
    try {
      createBacktest.mutate({
        name: form.name,
        description: form.description,
        assetClass: form.assetClass,
        templateId: form.templateId,
        instrument: form.instrument || selectedTemplate.instruments[0],
        venue: form.venue || selectedTemplate.venues[0],
        dateStart: form.dateStart,
        dateEnd: form.dateEnd,
        initialCapital: parseFloat(form.initialCapital),
        entryThreshold: parseFloat(form.entryThreshold),
        exitThreshold: parseFloat(form.exitThreshold),
        maxLeverage: parseFloat(form.maxLeverage),
      })
      onOpenChange(false)
    } catch {
      setIsSubmitting(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Strategy</DialogTitle>
          <DialogDescription>
            Step {currentStep + 1} of {STEPS.length} &mdash;{" "}
            {STEPS[currentStep].description}
          </DialogDescription>
        </DialogHeader>

        <StepIndicator steps={STEPS} currentStep={currentStep} />

        <div className="min-h-[280px]">
          {currentStep === 0 && (
            <BasicConfigStep form={form} onChange={updateForm} />
          )}
          {currentStep === 1 && (
            <StrategySelectionStep
              form={form}
              onChange={updateForm}
              templates={templates}
              isLoading={templatesLoading}
            />
          )}
          {currentStep === 2 && (
            <ParametersStep
              form={form}
              onChange={updateForm}
              selectedTemplate={selectedTemplate}
            />
          )}
          {currentStep === 3 && (
            <ReviewStep form={form} selectedTemplate={selectedTemplate} />
          )}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={currentStep === 0 ? () => onOpenChange(false) : handleBack}
          >
            {currentStep === 0 ? "Cancel" : "Back"}
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Continue
              <ChevronRight className="ml-1 size-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create Strategy
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
