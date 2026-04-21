"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/admin/api/client";
import {
  Bell,
  Plus,
  Trash2,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface NotificationPreference {
  id: string;
  event_type: string;
  recipient_uid: string | null;
  recipient_email: string;
  recipient_name: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

const EVENT_TYPES = [
  { value: "signup_submitted", label: "New signup submitted" },
  { value: "signup_approved", label: "Signup approved" },
  { value: "signup_rejected", label: "Signup rejected" },
];

export default function NotificationsPage() {
  const [prefs, setPrefs] = React.useState<NotificationPreference[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAdd, setShowAdd] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState("");
  const [newName, setNewName] = React.useState("");
  const [newEvent, setNewEvent] = React.useState("signup_submitted");
  const [saving, setSaving] = React.useState(false);

  const loadPrefs = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{
        preferences: NotificationPreference[];
      }>("/notification-preferences");
      setPrefs(res.data.preferences || []);
    } catch {
      setPrefs([]);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  const toggleEnabled = async (id: string, enabled: boolean) => {
    try {
      await apiClient.put(`/notification-preferences/${id}`, { enabled });
      setPrefs((prev) =>
        prev.map((p) => (p.id === id ? { ...p, enabled } : p)),
      );
    } catch {
      /* silent */
    }
  };

  const deletePref = async (id: string) => {
    try {
      await apiClient.delete(`/notification-preferences/${id}`);
      setPrefs((prev) => prev.filter((p) => p.id !== id));
    } catch {
      /* silent */
    }
  };

  const addPref = async () => {
    if (!newEmail.trim()) return;
    setSaving(true);
    try {
      const res = await apiClient.post<{ preference: NotificationPreference }>(
        "/notification-preferences",
        {
          event_type: newEvent,
          recipient_email: newEmail.trim(),
          recipient_name: newName.trim(),
          enabled: true,
        },
      );
      setPrefs((prev) => [res.data.preference, ...prev]);
      setShowAdd(false);
      setNewEmail("");
      setNewName("");
      setNewEvent("signup_submitted");
    } catch {
      /* silent */
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Notification Preferences
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure who receives email notifications for onboarding events.
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="size-4 mr-2" />
          Add Recipient
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : prefs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Bell className="size-10 mx-auto mb-3 opacity-30" />
            <p>No notification preferences configured.</p>
            <p className="text-xs mt-1">
              Add recipients to get email alerts when users sign up or are
              approved.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {prefs.map((pref) => {
            const eventInfo = EVENT_TYPES.find(
              (e) => e.value === pref.event_type,
            );
            return (
              <Card key={pref.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">
                        {pref.recipient_name || pref.recipient_email}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {pref.recipient_email}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {eventInfo?.label || pref.event_type}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => toggleEnabled(pref.id, !pref.enabled)}
                        title={pref.enabled ? "Disable" : "Enable"}
                      >
                        {pref.enabled ? (
                          <ToggleRight className="size-5 text-primary" />
                        ) : (
                          <ToggleLeft className="size-5 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => deletePref(pref.id)}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Notification Recipient</DialogTitle>
            <DialogDescription>
              This person will receive email alerts for the selected event type.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="admin@company.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Name (optional)</Label>
              <Input
                placeholder="John Doe"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select value={newEvent} onValueChange={setNewEvent}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((et) => (
                    <SelectItem key={et.value} value={et.value}>
                      {et.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button onClick={addPref} disabled={!newEmail.trim() || saving}>
              {saving && <Loader2 className="size-4 animate-spin mr-2" />}
              Add Recipient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
