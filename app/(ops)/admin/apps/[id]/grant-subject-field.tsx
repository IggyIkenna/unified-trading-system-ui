"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { listUsers } from "@/lib/admin/api/users";
import { listGroups } from "@/lib/admin/api/groups";
import type { Person, UserGroup } from "@/lib/admin/api/types";

interface Props {
  subjectType: "user" | "group";
  subjectId: string;
  subjectLabel: string;
  onSubjectChange: (id: string, label: string) => void;
}

export function GrantSubjectField({
  subjectType,
  subjectId,
  subjectLabel,
  onSubjectChange,
}: Props) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [manualMode, setManualMode] = React.useState(false);
  const [users, setUsers] = React.useState<Person[]>([]);
  const [groups, setGroups] = React.useState<UserGroup[]>([]);
  const [loadError, setLoadError] = React.useState("");

  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  React.useEffect(() => {
    if (manualMode) return;
    let cancelled = false;
    setLoadError("");
    (async () => {
      try {
        if (subjectType === "user") {
          const res = await listUsers();
          if (!cancelled) setUsers(res.data.users ?? []);
        } else {
          const res = await listGroups();
          if (!cancelled) setGroups(res.data.groups ?? []);
        }
      } catch {
        if (!cancelled)
          setLoadError("Could not load directory. Use manual ID entry below.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subjectType, manualMode]);

  const filteredUsers = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users.slice(0, 40);
    return users
      .filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          u.name.toLowerCase().includes(q) ||
          u.firebase_uid.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q),
      )
      .slice(0, 40);
  }, [users, query]);

  const filteredGroups = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups.slice(0, 40);
    return groups
      .filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.group_id.toLowerCase().includes(q) ||
          g.id.toLowerCase().includes(q),
      )
      .slice(0, 40);
  }, [groups, query]);

  function pickUser(u: Person) {
    const label = u.name ? `${u.name} (${u.email})` : u.email || u.firebase_uid;
    onSubjectChange(u.firebase_uid, label);
    setQuery("");
    setOpen(false);
  }

  function pickGroup(g: UserGroup) {
    onSubjectChange(g.group_id, g.name || g.group_id);
    setQuery("");
    setOpen(false);
  }

  function clearSelection() {
    onSubjectChange("", "");
    setQuery("");
  }

  if (manualMode) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Firebase UID or group ID</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              setManualMode(false);
              setLoadError("");
            }}
          >
            Use search instead
          </Button>
        </div>
        <Input
          placeholder={subjectType === "user" ? "Firebase UID" : "Group ID"}
          value={subjectId}
          onChange={(e) => onSubjectChange(e.target.value, subjectLabel)}
          required
        />
        <div className="space-y-1.5">
          <Label className="text-muted-foreground">Label (optional)</Label>
          <Input
            placeholder="Display name in entitlements table"
            value={subjectLabel}
            onChange={(e) => onSubjectChange(subjectId, e.target.value)}
          />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{subjectType === "user" ? "User" : "Group"}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setManualMode(true)}
        >
          Enter ID manually
        </Button>
      </div>

      {subjectId ? (
        <div className="flex items-center gap-2 rounded-md border px-3 py-2">
          <Badge
            variant="secondary"
            className="font-normal truncate max-w-[220px]"
          >
            {subjectLabel || subjectId}
          </Badge>
          <span className="text-xs text-muted-foreground font-mono truncate">
            {subjectId}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 ml-auto"
            onClick={clearSelection}
            aria-label="Clear selection"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : (
        <>
          <Input
            placeholder={
              subjectType === "user"
                ? "Search name, email, or UID…"
                : "Search group name or ID…"
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            autoComplete="off"
          />
          {loadError && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {loadError}
            </p>
          )}
          {open && !loadError && (
            <div className="rounded-md border bg-popover shadow-md z-50">
              <ScrollArea className="h-48">
                <div className="p-1">
                  {subjectType === "user" ? (
                    filteredUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground px-2 py-4 text-center">
                        No users match.
                      </p>
                    ) : (
                      filteredUsers.map((u) => (
                        <button
                          key={u.firebase_uid}
                          type="button"
                          className="w-full text-left rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                          onClick={() => pickUser(u)}
                        >
                          <div className="font-medium truncate">
                            {u.name || u.email}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {u.email}
                          </div>
                        </button>
                      ))
                    )
                  ) : filteredGroups.length === 0 ? (
                    <p className="text-sm text-muted-foreground px-2 py-4 text-center">
                      No groups match.
                    </p>
                  ) : (
                    filteredGroups.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        className="w-full text-left rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                        onClick={() => pickGroup(g)}
                      >
                        <div className="font-medium truncate">{g.name}</div>
                        <div className="text-xs text-muted-foreground font-mono truncate">
                          {g.group_id}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </>
      )}
    </div>
  );
}
