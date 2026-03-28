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
import {
  Plus, Save, RotateCcw, Download, Upload, Lock, Unlock, MoreHorizontal,
  Copy, Trash2, Undo2, Camera, Cloud, CloudOff, Loader2, History,
} from "lucide-react";
import type { WorkspaceSnapshot, SyncStatus } from "@/lib/stores/workspace-store";

interface WorkspaceToolbarProps {
  tab: string;
}

const EMPTY_WORKSPACES: readonly never[] = [];

export function WorkspaceToolbar({ tab }: WorkspaceToolbarProps) {
  const ensureTab = useWorkspaceStore((s) => s.ensureTab);
  React.useEffect(() => ensureTab(tab), [ensureTab, tab]);

  const workspaces = useWorkspaceStore((s) => s.workspaces[tab] ?? EMPTY_WORKSPACES);
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId[tab]);
  const editMode = useWorkspaceStore((s) => s.editMode);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);
  const duplicateWorkspace = useWorkspaceStore((s) => s.duplicateWorkspace);
  const deleteWorkspace = useWorkspaceStore((s) => s.deleteWorkspace);
  const toggleEditMode = useWorkspaceStore((s) => s.toggleEditMode);
  const exportWorkspace = useWorkspaceStore((s) => s.exportWorkspace);
  const importWorkspace = useWorkspaceStore((s) => s.importWorkspace);

  const saveSnapshot = useWorkspaceStore((s) => s.saveSnapshot);
  const restoreSnapshot = useWorkspaceStore((s) => s.restoreSnapshot);
  const deleteSnapshot = useWorkspaceStore((s) => s.deleteSnapshot);
  const undo = useWorkspaceStore((s) => s.undo);
  const pushUndo = useWorkspaceStore((s) => s.pushUndo);
  const undoStack = useWorkspaceStore((s) => s.undoStack[tab] ?? []);
  const snapshots = useWorkspaceStore((s) => s.snapshots[tab] ?? []);
  const syncStatus = useWorkspaceStore((s) => s.syncStatus);

  const activeWs = useActiveWorkspace(tab);
  const [catalogOpen, setCatalogOpen] = React.useState(false);
  const [saveAsOpen, setSaveAsOpen] = React.useState(false);
  const [saveAsName, setSaveAsName] = React.useState("");
  const [snapshotOpen, setSnapshotOpen] = React.useState(false);
  const [snapshotName, setSnapshotName] = React.useState("");
  const [historyOpen, setHistoryOpen] = React.useState(false);
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

  const handleSaveSnapshot = React.useCallback(() => {
    if (!snapshotName.trim()) return;
    pushUndo(tab);
    saveSnapshot(tab, snapshotName.trim());
    setSnapshotOpen(false);
    setSnapshotName("");
  }, [snapshotName, saveSnapshot, pushUndo, tab]);

  const handleUndo = React.useCallback(() => {
    undo(tab);
  }, [undo, tab]);

  const syncIcon = React.useMemo(() => {
    const icons: Record<SyncStatus, React.ReactNode> = {
      local: <CloudOff className="size-3 text-muted-foreground" />,
      syncing: <Loader2 className="size-3 text-blue-400 animate-spin" />,
      synced: <Cloud className="size-3 text-emerald-400" />,
      error: <CloudOff className="size-3 text-rose-400" />,
    };
    const labels: Record<SyncStatus, string> = {
      local: "Local only (not signed in)",
      syncing: "Saving to cloud...",
      synced: "Saved to cloud",
      error: "Cloud sync failed",
    };
    return (
      <span title={labels[syncStatus]} className="flex items-center">
        {icons[syncStatus]}
      </span>
    );
  }, [syncStatus]);

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

        {/* Undo */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={handleUndo}
          disabled={undoStack.length === 0}
          title={`Undo (${undoStack.length} steps)`}
        >
          <Undo2 className="size-3.5" />
        </Button>

        {/* Save snapshot */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => { setSnapshotName(`Snapshot ${snapshots.length + 1}`); setSnapshotOpen(true); }}
          title="Save snapshot"
        >
          <Camera className="size-3.5" />
        </Button>

        {/* Version history */}
        {snapshots.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" title="Version history">
                <History className="size-3.5" />
                <span className="text-[10px] text-muted-foreground">{snapshots.length}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 max-h-64 overflow-y-auto">
              {snapshots.slice().reverse().map((snap) => (
                <DropdownMenuItem
                  key={snap.id}
                  className="flex items-center justify-between text-xs"
                  onClick={() => restoreSnapshot(tab, snap.id)}
                >
                  <span className="truncate">{snap.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                    {new Date(snap.createdAt).toLocaleTimeString()}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="flex-1" />

        {/* Sync indicator */}
        {syncIcon}

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

      {/* Save Snapshot dialog */}
      <Dialog open={snapshotOpen} onOpenChange={setSnapshotOpen}>
        <DialogContent className="sm:max-w-[340px]">
          <DialogHeader>
            <DialogTitle className="text-sm">Save Snapshot</DialogTitle>
            <DialogDescription className="text-xs">
              Save a named version of the current layout. You can restore it later.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={snapshotName}
            onChange={(e) => setSnapshotName(e.target.value)}
            placeholder="Snapshot name"
            className="text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleSaveSnapshot()}
          />
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setSnapshotOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveSnapshot} disabled={!snapshotName.trim()}>
              <Camera className="size-3.5 mr-1.5" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
