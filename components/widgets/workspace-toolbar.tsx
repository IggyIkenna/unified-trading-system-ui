"use client";

import { Spinner } from "@/components/shared/spinner";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SyncStatus } from "@/lib/stores/workspace-store";
import { useActiveWorkspace, useWorkspaceStore } from "@/lib/stores/workspace-store";
import {
  Camera,
  Cloud,
  CloudOff,
  Download,
  History,
  Layers,
  Lock,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Undo2,
  Unlock,
  Upload,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { WidgetCatalogDrawer } from "./widget-catalog-drawer";

const WORKSPACE_CAPTURE_ROOT_ID = "widget-fullscreen-boundary";

async function savePngWithPicker(blob: Blob, suggestedName: string): Promise<"saved" | "cancelled"> {
  type SavePickerWin = typeof globalThis & {
    showSaveFilePicker?: (options: {
      suggestedName?: string;
      types?: Array<{ description: string; accept: Record<string, string[]> }>;
    }) => Promise<{
      createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }>;
    }>;
  };
  const w = globalThis as SavePickerWin;
  if (typeof w.showSaveFilePicker === "function") {
    try {
      const handle = await w.showSaveFilePicker({
        suggestedName,
        types: [{ description: "PNG image", accept: { "image/png": [".png"] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return "saved";
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return "cancelled";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedName;
  a.click();
  URL.revokeObjectURL(url);
  return "saved";
}

interface WorkspaceToolbarProps {
  tab: string;
}

const EMPTY_WORKSPACES: readonly never[] = [];
const EMPTY_ARR: readonly never[] = [];
const EMPTY_PROFILES: readonly never[] = [];

export function WorkspaceToolbar({ tab }: WorkspaceToolbarProps) {
  const ensureTab = useWorkspaceStore((s) => s.ensureTab);
  const ensureProfiles = useWorkspaceStore((s) => s.ensureProfiles);
  React.useEffect(() => {
    ensureTab(tab);
    ensureProfiles();
  }, [ensureTab, ensureProfiles, tab]);

  const profiles = useWorkspaceStore((s) => s.profiles ?? EMPTY_PROFILES);
  const activeProfileId = useWorkspaceStore((s) => s.activeProfileId);
  const setActiveProfile = useWorkspaceStore((s) => s.setActiveProfile);
  const exportProfile = useWorkspaceStore((s) => s.exportProfile);
  const importProfile = useWorkspaceStore((s) => s.importProfile);
  const saveCurrentAsProfile = useWorkspaceStore((s) => s.saveCurrentAsProfile);
  const deleteProfile = useWorkspaceStore((s) => s.deleteProfile);

  const workspaces = useWorkspaceStore((s) => s.workspaces[tab] ?? EMPTY_WORKSPACES);
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId[tab]);
  const editMode = useWorkspaceStore((s) => s.editMode);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);
  const toggleEditMode = useWorkspaceStore((s) => s.toggleEditMode);

  const saveSnapshot = useWorkspaceStore((s) => s.saveSnapshot);
  const restoreSnapshot = useWorkspaceStore((s) => s.restoreSnapshot);
  const undo = useWorkspaceStore((s) => s.undo);
  const pushUndo = useWorkspaceStore((s) => s.pushUndo);
  const undoStack = useWorkspaceStore((s) => s.undoStack[tab] ?? EMPTY_ARR);
  const snapshots = useWorkspaceStore((s) => s.snapshots[tab] ?? EMPTY_ARR);
  const syncStatus = useWorkspaceStore((s) => s.syncStatus);

  const activeWs = useActiveWorkspace(tab);
  const activeProfile = React.useMemo(
    () => profiles.find((p) => p.id === activeProfileId),
    [profiles, activeProfileId],
  );

  const [catalogOpen, setCatalogOpen] = React.useState(false);
  const [saveProfileOpen, setSaveProfileOpen] = React.useState(false);
  const [saveProfileName, setSaveProfileName] = React.useState("");
  const [snapshotOpen, setSnapshotOpen] = React.useState(false);
  const [snapshotName, setSnapshotName] = React.useState("");
  const [capturingScreenshot, setCapturingScreenshot] = React.useState(false);
  const importRef = React.useRef<HTMLInputElement>(null);

  const handleExportProfile = React.useCallback(() => {
    const json = exportProfile(activeProfileId);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workspace-profile-${activeProfile?.name ?? "export"}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeProfileId, activeProfile?.name, exportProfile]);

  const handleImportProfile = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        importProfile(text);
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [importProfile],
  );

  const handleSaveProfileAs = React.useCallback(() => {
    if (!saveProfileName.trim()) return;
    const id = saveCurrentAsProfile(saveProfileName.trim());
    if (id === null) {
      toast.error("A workspace profile with this name already exists (names are case-insensitive).");
      return;
    }
    setSaveProfileOpen(false);
    setSaveProfileName("");
    toast.success("Workspace profile saved.");
  }, [saveProfileName, saveCurrentAsProfile]);

  const handleSaveSnapshot = React.useCallback(() => {
    if (!snapshotName.trim()) return;
    pushUndo(tab);
    const id = saveSnapshot(tab, snapshotName.trim());
    if (id === null) {
      toast.error("A layout snapshot with this name already exists on this tab (names are case-insensitive).");
      return;
    }
    setSnapshotOpen(false);
    setSnapshotName("");
    toast.success("Layout snapshot saved. Restore it from the history menu.");
  }, [snapshotName, saveSnapshot, pushUndo, tab]);

  const handleWorkspaceScreenshot = React.useCallback(async () => {
    const el = document.getElementById(WORKSPACE_CAPTURE_ROOT_ID);
    if (!el || !(el instanceof HTMLElement)) {
      toast.error("Could not find the workspace area to capture.");
      return;
    }
    setCapturingScreenshot(true);
    try {
      // html-to-image uses the browser to paint the node (Tailwind v4’s oklab() breaks html2canvas’s CSS parser).
      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(el, {
        pixelRatio: Math.min(2, window.devicePixelRatio || 1),
        backgroundColor: "#0a0a0a",
        cacheBust: true,
      });
      if (!blob) {
        toast.error("Could not encode the screenshot.");
        return;
      }
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      const suggested = `workspace-${tab}-${stamp}.png`;
      const outcome = await savePngWithPicker(blob, suggested);
      if (outcome === "saved") {
        toast.success("Screenshot saved.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Screenshot capture failed.");
    } finally {
      setCapturingScreenshot(false);
    }
  }, [tab]);

  const handleUndo = React.useCallback(() => {
    undo(tab);
  }, [undo, tab]);

  const syncIcon = React.useMemo(() => {
    const icons: Record<SyncStatus, React.ReactNode> = {
      local: <CloudOff className="size-3 text-muted-foreground" />,
      syncing: <Spinner size="sm" className="size-3 text-blue-400" />,
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
        {/* Profile selector */}
        {profiles.length > 0 && (
          <>
            <Select value={activeProfileId ?? ""} onValueChange={(v) => setActiveProfile(v)}>
              <SelectTrigger className="h-7 w-[150px] text-xs">
                <Layers className="size-3 mr-1 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Profile" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.name}
                    {p.isPreset && <span className="ml-1 text-[10px] text-muted-foreground">(preset)</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="h-4 w-px bg-border" />
          </>
        )}

        {/* Per-tab workspace selector (secondary) */}
        <Select value={activeId ?? ""} onValueChange={(v) => setActiveWorkspace(tab, v)}>
          <SelectTrigger className="h-7 w-[140px] text-xs">
            <SelectValue placeholder="Tab layout" />
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

        {/* Screenshot workspace as PNG (save location via system dialog or download) */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => void handleWorkspaceScreenshot()}
          disabled={capturingScreenshot}
          title="Save workspace screenshot as PNG"
        >
          {capturingScreenshot ? <Spinner size="sm" className="size-3.5" /> : <Camera className="size-3.5" />}
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
            <DropdownMenuContent align="end" className="w-56">
              <WidgetScroll className="max-h-64">
                {snapshots
                  .slice()
                  .reverse()
                  .map((snap) => (
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
              </WidgetScroll>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="flex-1" />

        {/* Sync indicator */}
        {syncIcon}

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-[10px] text-muted-foreground font-normal uppercase tracking-wider">
              Workspace Profile
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                setSaveProfileName("");
                setSaveProfileOpen(true);
              }}
            >
              <Save className="size-3.5 mr-2" />
              <span className="text-xs">Save Profile As...</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportProfile}>
              <Download className="size-3.5 mr-2" />
              <span className="text-xs">Export Profile JSON</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => importRef.current?.click()}>
              <Upload className="size-3.5 mr-2" />
              <span className="text-xs">Import Profile JSON</span>
            </DropdownMenuItem>
            {activeProfile && !activeProfile.isPreset && (
              <DropdownMenuItem
                className="text-rose-400 focus:text-rose-400"
                onClick={() => deleteProfile(activeProfile.id)}
              >
                <Trash2 className="size-3.5 mr-2" />
                <span className="text-xs">Delete Profile</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] text-muted-foreground font-normal uppercase tracking-wider">
              Current Tab
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                setSnapshotName(`Snapshot ${snapshots.length + 1}`);
                setSnapshotOpen(true);
              }}
            >
              <History className="size-3.5 mr-2" />
              <span className="text-xs">Save layout snapshot…</span>
            </DropdownMenuItem>
            {activeWs?.isPreset && (
              <DropdownMenuItem onClick={() => activeId && setActiveWorkspace(tab, activeId)}>
                <RotateCcw className="size-3.5 mr-2" />
                <span className="text-xs">Reset Tab to Default</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImportProfile} />
      </div>

      {/* Widget catalog drawer */}
      <WidgetCatalogDrawer tab={tab} open={catalogOpen} onOpenChange={setCatalogOpen} />

      {/* Layout snapshot (restore from History); image screenshots use the camera button */}
      <Dialog open={snapshotOpen} onOpenChange={setSnapshotOpen}>
        <DialogContent className="sm:max-w-[340px]">
          <DialogHeader>
            <DialogTitle className="text-sm">Save layout snapshot</DialogTitle>
            <DialogDescription className="text-xs">
              Save a named copy of this tab&apos;s widget layout. Restore it from the history menu next to the camera
              button.
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
              <History className="size-3.5 mr-1.5" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Profile As dialog */}
      <Dialog open={saveProfileOpen} onOpenChange={setSaveProfileOpen}>
        <DialogContent className="sm:max-w-[340px]">
          <DialogHeader>
            <DialogTitle className="text-sm">Save Workspace Profile</DialogTitle>
            <DialogDescription className="text-xs">
              Save all current tab layouts as a named workspace profile. Switching profiles applies to all pages at
              once.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={saveProfileName}
            onChange={(e) => setSaveProfileName(e.target.value)}
            placeholder="Profile name"
            className="text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleSaveProfileAs()}
          />
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setSaveProfileOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveProfileAs} disabled={!saveProfileName.trim()}>
              <Save className="size-3.5 mr-1.5" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
