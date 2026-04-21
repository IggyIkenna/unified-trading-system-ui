"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  getAppCapabilities,
  updateAppCapabilities,
  seedCapabilities,
} from "@/lib/admin/api/app-capabilities";
import type {
  AppCapability,
  AppCapabilityDefinition,
  AppRole,
  CapabilityCategory,
} from "@/lib/admin/api/types";

const ROLES: AppRole[] = ["viewer", "editor", "admin", "owner"];

interface Props {
  appId: string;
}

export function CapabilitiesTab({ appId }: Props) {
  const [definition, setDefinition] =
    React.useState<AppCapabilityDefinition | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const [newKey, setNewKey] = React.useState("");
  const [newLabel, setNewLabel] = React.useState("");
  const [newCategory, setNewCategory] =
    React.useState<CapabilityCategory>("view");
  const [seeding, setSeeding] = React.useState(false);

  const fetchCapabilities = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAppCapabilities(appId);
      setDefinition(res.data.definition);
    } catch {
      setError("Failed to load capabilities");
    } finally {
      setLoading(false);
    }
  }, [appId]);

  React.useEffect(() => {
    fetchCapabilities();
  }, [fetchCapabilities]);

  function addCapability() {
    if (!newKey.trim() || !newLabel.trim() || !definition) return;
    if (definition.capabilities.some((c) => c.key === newKey.trim())) {
      setError(`Capability "${newKey}" already exists.`);
      return;
    }
    setDefinition({
      ...definition,
      capabilities: [
        ...definition.capabilities,
        { key: newKey.trim(), label: newLabel.trim(), category: newCategory },
      ],
    });
    setNewKey("");
    setNewLabel("");
    setError("");
  }

  function removeCapability(key: string) {
    if (!definition) return;
    setDefinition({
      ...definition,
      capabilities: definition.capabilities.filter((c) => c.key !== key),
      role_presets: Object.fromEntries(
        Object.entries(definition.role_presets).map(([role, caps]) => [
          role,
          (caps as string[]).filter((c) => c !== key),
        ]),
      ) as Record<AppRole, string[]>,
    });
  }

  function togglePreset(role: AppRole, capKey: string) {
    if (!definition) return;
    const current = definition.role_presets[role] || [];
    const next = current.includes(capKey)
      ? current.filter((c) => c !== capKey)
      : [...current, capKey];
    setDefinition({
      ...definition,
      role_presets: { ...definition.role_presets, [role]: next },
    });
  }

  function isPresetChecked(role: AppRole, capKey: string): boolean {
    if (!definition) return false;
    const caps = definition.role_presets[role] || [];
    return caps.includes("*") || caps.includes(capKey);
  }

  async function importFromSeed() {
    setSeeding(true);
    setError("");
    setSuccess("");
    try {
      await seedCapabilities();
      await fetchCapabilities();
      setSuccess(
        "Imported capability definitions from server seed file for all applications.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Seed import failed");
    } finally {
      setSeeding(false);
    }
  }

  async function save() {
    if (!definition) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await updateAppCapabilities(appId, {
        capabilities: definition.capabilities,
        role_presets: definition.role_presets,
      });
      setDefinition(res.data.definition);
      setSuccess("Capabilities saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Loading capabilities...
      </p>
    );
  }

  if (!definition) {
    return (
      <p className="text-sm text-destructive">
        Failed to load capability definition.
      </p>
    );
  }

  const viewCaps = definition.capabilities.filter((c) => c.category === "view");
  const controlCaps = definition.capabilities.filter(
    (c) => c.category === "control",
  );

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-emerald-400 bg-emerald-600/10 rounded-md px-3 py-2">
          {success}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Defined Capabilities</CardTitle>
          <CardDescription>
            Feature keys returned by{" "}
            <code className="text-xs">/api/v1/authorize</code> for this app.
            Grouped as view (read) vs control (actions). The Applications list
            only shows app metadata; open this tab on an app to see roles and
            capabilities.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {definition.capabilities.length === 0 ? (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Nothing is stored in Firestore for this app yet, so the grant
                dialog cannot offer capability overrides. Import the bundled
                seed (updates <strong className="text-foreground">all</strong>{" "}
                apps) or add keys manually below.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={importFromSeed}
                disabled={seeding}
              >
                {seeding ? "Importing…" : "Import defaults from seed file"}
              </Button>
            </div>
          ) : (
            <>
              {viewCaps.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    View (what users can see)
                  </h4>
                  <div className="space-y-1">
                    {viewCaps.map((cap) => (
                      <CapRow
                        key={cap.key}
                        cap={cap}
                        onRemove={removeCapability}
                      />
                    ))}
                  </div>
                </div>
              )}
              {controlCaps.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Control (what users can do)
                  </h4>
                  <div className="space-y-1">
                    {controlCaps.map((cap) => (
                      <CapRow
                        key={cap.key}
                        cap={cap}
                        onRemove={removeCapability}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <Separator />

          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Key</Label>
              <Input
                placeholder="e.g. deployments.trigger"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Label</Label>
              <Input
                placeholder="e.g. Trigger deployments"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="w-28 space-y-1">
              <Label className="text-xs">Category</Label>
              <Select
                value={newCategory}
                onValueChange={(v) => setNewCategory(v as CapabilityCategory)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="control">Control</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={addCapability}
              disabled={!newKey.trim() || !newLabel.trim()}
            >
              <Plus className="size-3.5 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {definition.capabilities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Role Presets</CardTitle>
            <CardDescription>
              Which capabilities does each role include by default? When
              granting access with a role, these capabilities are applied unless
              explicitly overridden.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-48">Capability</TableHead>
                    {ROLES.map((role) => (
                      <TableHead key={role} className="text-center w-24">
                        {role}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {definition.capabilities.map((cap) => (
                    <TableRow key={cap.key}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              cap.category === "view"
                                ? "border-blue-600/30 text-blue-400"
                                : "border-amber-600/30 text-amber-400"
                            }
                          >
                            {cap.category}
                          </Badge>
                          <span className="text-sm">{cap.label}</span>
                        </div>
                      </TableCell>
                      {ROLES.map((role) => (
                        <TableCell key={role} className="text-center">
                          {role === "admin" || role === "owner" ? (
                            <Badge variant="secondary" className="text-[10px]">
                              all
                            </Badge>
                          ) : (
                            <Checkbox
                              checked={isPresetChecked(role, cap.key)}
                              onCheckedChange={() =>
                                togglePreset(role, cap.key)
                              }
                            />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Capabilities"}
        </Button>
      </div>
    </div>
  );
}

function CapRow({
  cap,
  onRemove,
}: {
  cap: AppCapability;
  onRemove: (key: string) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-1.5">
      <div className="flex items-center gap-2">
        <code className="text-xs font-mono text-muted-foreground">
          {cap.key}
        </code>
        <span className="text-sm">{cap.label}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 text-destructive hover:text-destructive"
        onClick={() => onRemove(cap.key)}
      >
        <Trash2 className="size-3" />
      </Button>
    </div>
  );
}
