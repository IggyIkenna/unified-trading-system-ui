"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Layers, X } from "lucide-react";

import { useCreateMLGridConfig, useFeatureGroups, useUpdateMLGridConfig } from "@/hooks/api/use-ml-models";
import type { GridConfigAssetGroup, MLGridConfig } from "@/lib/types/ml";

interface GridConfigEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: MLGridConfig | null;
  onSaved?: () => void;
}

export function GridConfigEditor({ open, onOpenChange, config, onSaved }: GridConfigEditorProps) {
  const [isSaveAs, setIsSaveAs] = React.useState(false);
  const isEdit = !!config && !isSaveAs;

  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState<GridConfigAssetGroup>("CEFI");
  const [description, setDescription] = React.useState("");
  const [selectedGroups, setSelectedGroups] = React.useState<string[]>([]);
  const [excludeFeatures, setExcludeFeatures] = React.useState<string[]>([]);
  const [excludeInput, setExcludeInput] = React.useState("");

  const { data: featureGroupsData } = useFeatureGroups(category);
  const createConfig = useCreateMLGridConfig();
  const updateConfig = useUpdateMLGridConfig();

  const availableGroups = React.useMemo(() => {
    const resp = featureGroupsData?.data;
    return resp?.feature_groups ?? [];
  }, [featureGroupsData]);

  React.useEffect(() => {
    if (config) {
      setName(config.name);
      setCategory(config.asset_group);
      setDescription(config.description ?? "");
      setSelectedGroups(config.feature_groups);
      setExcludeFeatures(config.exclude_features);
    } else {
      setName("");
      setCategory("CEFI");
      setDescription("");
      setSelectedGroups([]);
      setExcludeFeatures([]);
    }
    setExcludeInput("");
    setIsSaveAs(false);
  }, [config, open]);

  function toggleGroup(group: string) {
    setSelectedGroups((prev) => (prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]));
  }

  function selectAllGroups() {
    setSelectedGroups([...availableGroups]);
  }

  function clearAllGroups() {
    setSelectedGroups([]);
  }

  function addExclusion() {
    const trimmed = excludeInput.trim();
    if (trimmed && !excludeFeatures.includes(trimmed)) {
      setExcludeFeatures((prev) => [...prev, trimmed]);
      setExcludeInput("");
    }
  }

  function removeExclusion(feat: string) {
    setExcludeFeatures((prev) => prev.filter((f) => f !== feat));
  }

  function handleSave() {
    const body: Partial<MLGridConfig> = {
      name,
      asset_group: category,
      description: description || undefined,
      feature_groups: selectedGroups,
      exclude_features: excludeFeatures,
    };

    if (isEdit) {
      updateConfig.mutate({ ...body, name } as MLGridConfig, {
        onSuccess: () => {
          onOpenChange(false);
          onSaved?.();
        },
      });
    } else {
      createConfig.mutate(body, {
        onSuccess: () => {
          onOpenChange(false);
          onSaved?.();
        },
      });
    }
  }

  const isPending = createConfig.isPending || updateConfig.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="size-4" />
            {isSaveAs ? "Save Config As" : isEdit ? "Edit Grid Config" : "New Grid Config"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 py-1">
            {/* Name + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="gc-name">Config name</Label>
                <Input
                  id="gc-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isSaveAs ? "New config name" : "e.g. btc-momentum-v2"}
                  disabled={isEdit}
                  autoFocus={isSaveAs}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={category}
                  onValueChange={(v) => {
                    setCategory(v as GridConfigAssetGroup);
                    setSelectedGroups([]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CEFI">CeFi</SelectItem>
                    <SelectItem value="TRADFI">TradFi</SelectItem>
                    <SelectItem value="SPORTS">Sports</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="gc-desc">Description</Label>
              <Input
                id="gc-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>

            {/* Feature Groups */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Feature groups</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs px-2"
                    onClick={selectAllGroups}
                  >
                    Select all
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={clearAllGroups}>
                    Clear
                  </Button>
                </div>
              </div>
              <WidgetScroll className="rounded-md border border-border/50 max-h-48" viewportClassName="p-3">
                {availableGroups.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Loading feature groups...</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {availableGroups.map((group) => (
                      <label
                        key={group}
                        className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground transition-colors"
                      >
                        <Checkbox checked={selectedGroups.includes(group)} onCheckedChange={() => toggleGroup(group)} />
                        <span className="truncate text-xs">{group.replace(/_/g, " ")}</span>
                      </label>
                    ))}
                  </div>
                )}
              </WidgetScroll>
              <p className="text-[11px] text-muted-foreground">
                {selectedGroups.length} of {availableGroups.length} groups selected
              </p>
            </div>

            {/* Exclude Features */}
            <div className="space-y-2">
              <Label>Exclude features</Label>
              <p className="text-[11px] text-muted-foreground">
                Individual features to exclude from selected groups (e.g. RSI, funding_rate)
              </p>
              <div className="flex gap-2">
                <Input
                  value={excludeInput}
                  onChange={(e) => setExcludeInput(e.target.value)}
                  placeholder="Feature name to exclude"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addExclusion();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addExclusion}
                  disabled={!excludeInput.trim()}
                >
                  Add
                </Button>
              </div>
              {excludeFeatures.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {excludeFeatures.map((feat) => (
                    <Badge
                      key={feat}
                      variant="outline"
                      className="gap-1 text-xs border-red-500/30 text-red-400 bg-red-500/10"
                    >
                      {feat}
                      <button type="button" onClick={() => removeExclusion(feat)} className="hover:text-red-300">
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <div>
            {!!config && !isSaveAs && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => {
                  setIsSaveAs(true);
                  setName(`${config.name}-copy`);
                }}
              >
                <Copy className="size-3.5" />
                Save As
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isPending || !name.trim() || selectedGroups.length === 0}
              onClick={handleSave}
            >
              {isPending ? "Saving..." : isSaveAs ? "Save copy" : isEdit ? "Update config" : "Create config"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
