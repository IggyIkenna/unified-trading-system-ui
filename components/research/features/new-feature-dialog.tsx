"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Plus, Save, Settings2, Trash2 } from "lucide-react";
import type { FeatureCatalogueEntry, IndividualFeature } from "@/lib/build-mock-data";
import { FEATURE_SERVICES } from "@/lib/build-mock-data";
import {
  categoryIdToShard,
  serviceIdToFeatureType,
  makeNewFeatureIds,
  CATALOGUE_FEATURE_GROUP_OPTIONS,
  type EditableFeature,
  type ParamRow,
} from "./feature-helpers";
export function NewFeatureDialog({
  open,
  onOpenChange,
  onCreate,
  existingNames,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (payload: { individual: IndividualFeature; catalogue: FeatureCatalogueEntry }) => void;
  existingNames: Set<string>;
}) {
  const [svcId, setSvcId] = React.useState(FEATURE_SERVICES[0]?.id ?? "delta-one");
  const [catId, setCatId] = React.useState(FEATURE_SERVICES[0]?.categories[0]?.id ?? "CEFI");
  const [grpId, setGrpId] = React.useState(FEATURE_SERVICES[0]?.categories[0]?.groups[0]?.id ?? "technical_indicators");
  const [name, setName] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [currentVersion, setCurrentVersion] = React.useState("v1.0.0");
  const [catalogueGroup, setCatalogueGroup] = React.useState<FeatureCatalogueEntry["feature_group"]>("Technical");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState("not_computed");
  const [schedule, setSchedule] = React.useState("0 * * * *");
  const [symbolsRaw, setSymbolsRaw] = React.useState("");
  const [tagsRaw, setTagsRaw] = React.useState("");
  const [depsRaw, setDepsRaw] = React.useState("");
  const [modelsRaw, setModelsRaw] = React.useState("");
  const [createdBy, setCreatedBy] = React.useState("quant_team");
  const [params, setParams] = React.useState<ParamRow[]>([]);
  const [activeTab, setActiveTab] = React.useState<"placement" | "general" | "parameters" | "compute" | "dependencies">(
    "placement",
  );
  const [nameError, setNameError] = React.useState("");

  const svc = FEATURE_SERVICES.find((s) => s.id === svcId) ?? FEATURE_SERVICES[0];
  const cat = svc.categories.find((c) => c.id === catId) ?? svc.categories[0];

  React.useEffect(() => {
    if (!open) return;
    setSvcId(FEATURE_SERVICES[0]?.id ?? "delta-one");
    const s0 = FEATURE_SERVICES[0];
    setCatId(s0?.categories[0]?.id ?? "CEFI");
    setGrpId(s0?.categories[0]?.groups[0]?.id ?? "technical_indicators");
    setName("");
    setDisplayName("");
    setCurrentVersion("v1.0.0");
    setCatalogueGroup("Technical");
    setDescription("");
    setStatus("not_computed");
    setSchedule("0 * * * *");
    setSymbolsRaw("");
    setTagsRaw("");
    setDepsRaw("");
    setModelsRaw("");
    setCreatedBy("quant_team");
    setParams([]);
    setActiveTab("placement");
    setNameError("");
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const s = FEATURE_SERVICES.find((x) => x.id === svcId);
    const firstCat = s?.categories[0];
    const firstGrp = firstCat?.groups[0];
    if (!firstCat || !firstGrp) return;
    setCatId(firstCat.id);
    setGrpId(firstGrp.id);
  }, [svcId, open]);

  React.useEffect(() => {
    if (!open) return;
    const s = FEATURE_SERVICES.find((x) => x.id === svcId);
    const c = s?.categories.find((x) => x.id === catId);
    if (!c?.groups[0]) return;
    setGrpId(c.groups[0].id);
  }, [catId, svcId, open]);

  function addParam() {
    setParams((p) => [...p, { key: "", value: "" }]);
  }
  function removeParam(i: number) {
    setParams((p) => p.filter((_, idx) => idx !== i));
  }
  function updateParam(i: number, field: "key" | "value", val: string) {
    setParams((p) => p.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));
  }

  function handleCreate() {
    const raw = name.trim().toLowerCase().replace(/\s+/g, "_");
    const nameClean = raw.replace(/[^a-z0-9_]/g, "");
    if (!nameClean) {
      setNameError("Enter a feature code (letters, numbers, underscores).");
      return;
    }
    if (existingNames.has(nameClean)) {
      setNameError("A feature with this code already exists.");
      return;
    }
    setNameError("");
    const newParams: Record<string, unknown> = {};
    for (const { key, value } of params) {
      if (!key.trim()) continue;
      const num = Number(value);
      newParams[key.trim()] = !isNaN(num) && value.trim() !== "" ? num : value.trim();
    }
    const symbols = symbolsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const tags = tagsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const dependencies = depsRaw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const consumedBy = modelsRaw
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const { individualId, catalogueId, nowIso } = makeNewFeatureIds(nameClean);
    const st = status as IndividualFeature["status"];
    const group = cat.groups.find((g) => g.id === grpId) ?? cat.groups[0];
    const individual: IndividualFeature = {
      id: individualId,
      name: nameClean,
      display_name: displayName.trim() || nameClean,
      service_id: svc.id,
      category_id: catId,
      group_id: group.id,
      current_version: currentVersion.trim() || "v1.0.0",
      status: st,
      last_computed: st === "not_computed" ? null : nowIso,
      description: description.trim() || `Feature ${nameClean}`,
      parameters: newParams,
      symbols,
      dependencies,
      consumed_by_models: consumedBy,
      tags,
    };
    const catalogue: FeatureCatalogueEntry = {
      id: catalogueId,
      name: nameClean,
      display_name: displayName.trim() || nameClean,
      shard: categoryIdToShard(svc.id, catId),
      feature_type: serviceIdToFeatureType(svc.id),
      feature_group: catalogueGroup,
      source_service: svc.name,
      current_version: individual.current_version,
      status: st,
      symbols,
      last_computed: individual.last_computed,
      description: individual.description,
      parameters: newParams,
      dependencies,
      consumed_by_models: consumedBy,
      tags,
      created_by: createdBy.trim() || "user",
      created_at: nowIso,
      updated_at: nowIso,
    };
    onCreate({ individual, catalogue });
    onOpenChange(false);
  }

  const TABS = [
    { id: "placement" as const, label: "Placement" },
    { id: "general" as const, label: "General" },
    { id: "parameters" as const, label: "Parameters" },
    { id: "compute" as const, label: "Compute" },
    { id: "dependencies" as const, label: "Dependencies" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/50 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Plus className="size-4 text-muted-foreground" />
            New Feature
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Define a feature in the hierarchy: service, category, group, then identifiers, parameters, and compute
            settings (mock — local session only).
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-end border-b border-border/50 shrink-0 px-6 overflow-x-auto overflow-y-hidden">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0",
                activeTab === t.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="h-[min(52rem,calc(90vh-10rem))] shrink-0 overflow-y-auto overflow-x-hidden px-6 py-5">
          {activeTab === "placement" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Service</Label>
                  <Select value={svcId} onValueChange={setSvcId}>
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FEATURE_SERVICES.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Category</Label>
                  <Select value={catId} onValueChange={setCatId}>
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {svc.categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Feature group</Label>
                  <Select value={grpId} onValueChange={setGrpId}>
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cat.groups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="rounded-lg border border-border/50 p-3 space-y-2 bg-muted/15 text-xs">
                <p>
                  <span className="text-muted-foreground">Shard: </span>
                  <span className="font-mono">{categoryIdToShard(svc.id, catId)}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Feature type: </span>
                  <span className="font-mono">{serviceIdToFeatureType(svc.id)}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Source service: </span>
                  <span className="font-mono">{svc.name}</span>
                </p>
              </div>
            </div>
          )}

          {activeTab === "general" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Code (name)</Label>
                  <Input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setNameError("");
                    }}
                    className="text-xs h-8 font-mono"
                    placeholder="my_custom_rsi"
                    autoComplete="off"
                  />
                  {nameError && <p className="text-[10px] text-red-400">{nameError}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Display name</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="text-xs h-8"
                    placeholder="My Custom RSI"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Version</Label>
                  <Input
                    value={currentVersion}
                    onChange={(e) => setCurrentVersion(e.target.value)}
                    className="text-xs h-8 font-mono"
                    placeholder="v1.0.0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Catalogue group</Label>
                  <Select
                    value={catalogueGroup}
                    onValueChange={(v) => setCatalogueGroup(v as FeatureCatalogueEntry["feature_group"])}
                  >
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATALOGUE_FEATURE_GROUP_OPTIONS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="text-xs resize-none"
                  placeholder="What this feature computes…"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="stale">Stale</SelectItem>
                    <SelectItem value="not_computed">Not Computed</SelectItem>
                    <SelectItem value="deprecated">Deprecated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Symbols (comma-separated)</Label>
                <Textarea
                  value={symbolsRaw}
                  onChange={(e) => setSymbolsRaw(e.target.value)}
                  rows={2}
                  className="text-xs resize-none font-mono"
                  placeholder="BTC-USDT, ETH-USDT"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tags (comma-separated)</Label>
                <Input
                  value={tagsRaw}
                  onChange={(e) => setTagsRaw(e.target.value)}
                  className="text-xs h-8"
                  placeholder="momentum, custom"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Consumed by models</Label>
                  <Textarea
                    value={modelsRaw}
                    onChange={(e) => setModelsRaw(e.target.value)}
                    rows={2}
                    className="text-xs resize-none font-mono"
                    placeholder="mf-btc-direction (one per line or comma)"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Created by</Label>
                  <Input
                    value={createdBy}
                    onChange={(e) => setCreatedBy(e.target.value)}
                    className="text-xs h-8"
                    placeholder="quant_team"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "parameters" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Key/value pairs passed to the feature computation function.
              </p>
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <div className="grid grid-cols-[1fr_1fr_auto] gap-3 px-3 py-2 bg-muted/30 border-b border-border/50">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Parameter
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Value
                  </span>
                  <span className="w-6" />
                </div>
                {params.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    No parameters. Click &ldquo;Add parameter&rdquo; to add one.
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {params.map((row, i) => (
                      <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 px-3 py-2 items-center">
                        <Input
                          value={row.key}
                          onChange={(e) => updateParam(i, "key", e.target.value)}
                          className="h-7 text-xs font-mono"
                          placeholder="param_name"
                        />
                        <Input
                          value={row.value}
                          onChange={(e) => updateParam(i, "value", e.target.value)}
                          className="h-7 text-xs font-mono"
                          placeholder="14"
                        />
                        <button
                          type="button"
                          onClick={() => removeParam(i)}
                          className="text-muted-foreground hover:text-red-400 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={addParam} className="gap-1.5 text-xs" type="button">
                <Plus className="size-3" /> Add parameter
              </Button>
            </div>
          )}

          {activeTab === "compute" && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Cron Schedule</Label>
                <Input
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="text-xs h-8 font-mono"
                  placeholder="0 * * * *"
                />
                <p className="text-[10px] text-muted-foreground">Standard cron expression (UTC).</p>
              </div>
              <div className="rounded-lg border border-border/50 p-3 space-y-2 bg-muted/20">
                <p className="text-xs font-medium">Schedule Preview</p>
                {[
                  {
                    label: "Next run",
                    value: "in ~" + (60 - new Date().getMinutes()) + " minutes",
                  },
                  {
                    label: "Frequency",
                    value: schedule.startsWith("0 * ")
                      ? "Every hour"
                      : schedule.startsWith("0 0 ")
                        ? "Daily at midnight"
                        : "Custom",
                  },
                  { label: "Timezone", value: "UTC" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono">{value}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Retry Policy</Label>
                <Select defaultValue="3">
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No retries</SelectItem>
                    <SelectItem value="1">1 retry</SelectItem>
                    <SelectItem value="3">3 retries (default)</SelectItem>
                    <SelectItem value="5">5 retries</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Timeout (minutes)</Label>
                <Input type="number" defaultValue={60} min={1} max={480} className="text-xs h-8 font-mono w-32" />
              </div>
            </div>
          )}

          {activeTab === "dependencies" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Feature Dependencies (one per line)</Label>
                <Textarea
                  value={depsRaw}
                  onChange={(e) => setDepsRaw(e.target.value)}
                  rows={8}
                  className="text-xs resize-none font-mono"
                  placeholder={"rsi_14_1h\nmacd_12_26_9"}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/50 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleCreate} className="gap-1.5">
            <Save className="size-3" /> Create feature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
