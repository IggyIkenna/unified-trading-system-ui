"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Layers, Pencil, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { useDeleteMLGridConfig, useMLGridConfigs } from "@/hooks/api/use-ml-models";
import type { MLGridConfig } from "@/lib/types/ml";
import { GridConfigEditor } from "../training/components/grid-config-editor";

export default function GridConfigPage() {
  const { data: configsData, isLoading, refetch } = useMLGridConfigs();
  const deleteConfig = useDeleteMLGridConfig();
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingConfig, setEditingConfig] = React.useState<MLGridConfig | null>(null);

  const configs = React.useMemo(() => {
    const raw = (configsData as { data?: MLGridConfig[] })?.data ?? [];
    return raw as MLGridConfig[];
  }, [configsData]);

  if (isLoading) {
    return (
      <div className="platform-page-width space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="platform-page-width space-y-6 p-6">
      <PageHeader title="Feature Grid Configs" description="Manage feature group subscriptions for ML training runs">
        <Button
          onClick={() => {
            setEditingConfig(null);
            setEditorOpen(true);
          }}
        >
          <Plus className="size-4 mr-1.5" />
          New Config
        </Button>
      </PageHeader>

      <GridConfigEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        config={editingConfig}
        onSaved={() => void refetch()}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4">
        <Card className="border-border/50">
          <CardContent className="pt-0 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Configs</p>
                <p className="text-2xl font-bold mt-0.5">{configs.length}</p>
              </div>
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Layers className="size-4 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-0 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">CeFi</p>
                <p className="text-2xl font-bold mt-0.5">{configs.filter((c) => c.category === "CEFI").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-0 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Sports</p>
                <p className="text-2xl font-bold mt-0.5">{configs.filter((c) => c.category === "SPORTS").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {configs.length > 0 ? (
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Feature Groups</TableHead>
                  <TableHead>Exclusions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((cfg) => (
                  <TableRow key={cfg.name}>
                    <TableCell className="font-mono text-xs font-medium">{cfg.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {cfg.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{cfg.feature_groups.length} groups</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {cfg.exclude_features.length > 0 ? `${cfg.exclude_features.length} excluded` : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {cfg.created_at ? new Date(cfg.created_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => {
                            setEditingConfig(cfg);
                            setEditorOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-red-400 hover:text-red-300"
                          onClick={() => {
                            deleteConfig.mutate(cfg.name, {
                              onSuccess: () => {
                                toast.success(`Deleted ${cfg.name}`);
                                void refetch();
                              },
                            });
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Layers}
          title="No grid configs"
          description="Create a feature grid config to customize which feature groups are used in training runs."
        />
      )}
    </div>
  );
}
