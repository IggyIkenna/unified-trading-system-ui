"use client";

import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useWorkspaceStore, useActiveWorkspace } from "@/lib/stores/workspace-store";
import { WidgetCatalogDrawer } from "./widget-catalog-drawer";
import { Plus, Save, RotateCcw, Download, Upload, Lock, Unlock, MoreHorizontal, Copy, Trash2 } from "lucide-react";

interface WorkspaceToolbarProps {
  tab: string;
}

export function WorkspaceToolbar({ tab }: WorkspaceToolbarProps) {
  const ensureTab = useWorkspaceStore((s) => s.ensureTab);
  React.useEffect(() => ensureTab(tab), [ensureTab, tab]);

  const workspaces = useWorkspaceStore((s) => s.workspaces[tab] ?? []);
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId[tab]);
  const editMode = useWorkspaceStore((s) => s.editMode);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);
  const duplicateWorkspace = useWorkspaceStore((s) => s.duplicateWorkspace);
  const deleteWorkspace = useWorkspaceStore((s) => s.deleteWorkspace);
  const toggleEditMode = useWorkspaceStore((s) => s.toggleEditMode);
  const exportWorkspace = useWorkspaceStore((s) => s.exportWorkspace);
  const importWorkspace = useWorkspaceStore((s) => s.importWorkspace);

  const activeWs = useActiveWorkspace(tab);
  const [catalogOpen, setCatalogOpen] = React.useState(false);
  const [saveAsOpen, setSaveAsOpen] = React.useState(false);
  const [saveAsName, setSaveAsName] = React.useState("");
  const importRef = React.useRef<HTMLInputElement>(null);

  const handleExport = React.useCallback(() => {
    if (!activeId) return;
    const json = exportWorkspace(tab, activeId);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workspace-${activeWs?.name ?? tab}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeId, activeWs?.name, exportWorkspace, tab]);

  const handleImport = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        importWorkspace(tab, text);
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [importWorkspace, tab],
  );

  const handleSaveAs = React.useCallback(() => {
    if (!activeId || !saveAsName.trim()) return;
    duplicateWorkspace(tab, activeId, saveAsName.trim());
    setSaveAsOpen(false);
    setSaveAsName("");
  }, [activeId, saveAsName, duplicateWorkspace, tab]);

  const handleReset = React.useCallback(() => {
    if (!activeWs?.isPreset || !activeId) return;
    setActiveWorkspace(tab, activeId);
  }, [activeWs, activeId, setActiveWorkspace, tab]);

  return (
    <>
      <div className="flex items-center gap-2 px-2 py-0.5 border-b border-border bg-card/50 shrink-0">
        {/* Workspace selector */}
        <Select value={activeId ?? ""} onValueChange={(v) => setActiveWorkspace(tab, v)}>
          <SelectTrigger className="h-7 w-[160px] text-xs">
            <SelectValue placeholder="Select workspace" />
          </SelectTrigger>
          <SelectContent>
            {workspaces.map((ws) => (
              <SelectItem key={ws.id} value={ws.id} className="text-xs">
                {ws.name}
                {ws.isPreset && <span className="ml-1 text-[10px] text-muted-foreground">(preset)</span>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="h-4 w-px bg-border" />

        {/* Add widget */}
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setCatalogOpen(true)}>
          <Plus className="size-3.5" />
          Add Widget
        </Button>

        {/* Edit mode toggle */}
        <Button
          variant={editMode ? "secondary" : "ghost"}
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={toggleEditMode}
          title={editMode ? "Lock layout" : "Unlock layout for editing"}
        >
          {editMode ? <Unlock className="size-3.5" /> : <Lock className="size-3.5" />}
          {editMode ? "Editing" : "Locked"}
        </Button>

        <div className="flex-1" />

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => {
                setSaveAsName("");
                setSaveAsOpen(true);
              }}
            >
              <Copy className="size-3.5 mr-2" />
              <span className="text-xs">Save As...</span>
            </DropdownMenuItem>
            {activeWs?.isPreset && (
              <DropdownMenuItem onClick={handleReset}>
                <RotateCcw className="size-3.5 mr-2" />
                <span className="text-xs">Reset to Default</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExport}>
              <Download className="size-3.5 mr-2" />
              <span className="text-xs">Export JSON</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => importRef.current?.click()}>
              <Upload className="size-3.5 mr-2" />
              <span className="text-xs">Import JSON</span>
            </DropdownMenuItem>
            {activeWs && !activeWs.isPreset && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-rose-400 focus:text-rose-400"
                  onClick={() => deleteWorkspace(tab, activeWs.id)}
                >
                  <Trash2 className="size-3.5 mr-2" />
                  <span className="text-xs">Delete Workspace</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </div>

      {/* Widget catalog drawer */}
      <WidgetCatalogDrawer tab={tab} open={catalogOpen} onOpenChange={setCatalogOpen} />

      {/* Save As dialog */}
      <Dialog open={saveAsOpen} onOpenChange={setSaveAsOpen}>
        <DialogContent className="sm:max-w-[340px]">
          <DialogHeader>
            <DialogTitle className="text-sm">Save Workspace As</DialogTitle>
            <DialogDescription className="text-xs">
              Create a copy of the current workspace with a new name.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={saveAsName}
            onChange={(e) => setSaveAsName(e.target.value)}
            placeholder="Workspace name"
            className="text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleSaveAs()}
          />
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setSaveAsOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveAs} disabled={!saveAsName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
