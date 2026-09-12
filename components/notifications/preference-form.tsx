"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Bell,
  HeartPulse,
  Megaphone,
  ShieldAlert,
  Users,
  Calendar,
  Settings,
  Moon,
  Smartphone,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { updateMyNotificationPreferences } from "@/lib/notifications/actions";
import { subscribeUserToPush, getNotificationPermissionState, isPushSupported } from "@/lib/notifications/client";
import type { NotificationPreferences } from "@/lib/notifications/types";

export function NotificationPreferencesForm({
  initialPreferences,
}: {
  initialPreferences: NotificationPreferences | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [pushLoading, setPushLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    setMounted(true);
    setPermission(getNotificationPermissionState());
  }, []);

  const [form, setForm] = useState({
    general_notice: initialPreferences?.general_notice ?? true,
    blood_request: initialPreferences?.blood_request ?? true,
    emergency_alert: initialPreferences?.emergency_alert ?? true,
    volunteer_notification: initialPreferences?.volunteer_notification ?? true,
    event_notification: initialPreferences?.event_notification ?? true,
    system_notification: initialPreferences?.system_notification ?? true,
    quiet_hours_enabled: initialPreferences?.quiet_hours_enabled ?? false,
    quiet_hours_start: initialPreferences?.quiet_hours_start ?? "22:00",
    quiet_hours_end: initialPreferences?.quiet_hours_end ?? "07:00",
  });

  const handleToggle = (key: keyof typeof form, value: boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateMyNotificationPreferences(form);
      if (res.success) {
        toast.success("Preferences saved successfully!");
      } else {
        toast.error(res.message || "Failed to save preferences.");
      }
    });
  };

  const handleEnablePush = async () => {
    setPushLoading(true);
    try {
      const res = await subscribeUserToPush();
      setPermission(res.permission);
      if (res.success) {
        toast.success("Push notifications enabled on this device!");
      } else {
        toast.error(res.message || "Could not enable push notifications.");
      }
    } catch {
      toast.error("Failed to enable push.");
    } finally {
      setPushLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Device Push Status */}
      <div className="rounded-2xl border border-poly/20 bg-muted/30 p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-poly/15 text-poly">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Device Push Notifications</h4>
              <p className="text-xs text-muted-foreground">
                {mounted && permission === "granted"
                  ? "Push alerts are active on this browser/device."
                  : mounted && permission === "denied"
                  ? "Push alerts are blocked in browser settings."
                  : "Enable push notifications to receive real-time alerts even when the tab is closed."}
              </p>
            </div>
          </div>
          {permission !== "granted" && isPushSupported() && (
            <Button
              size="sm"
              onClick={handleEnablePush}
              disabled={pushLoading || permission === "denied"}
              className="bg-poly text-xs text-white hover:bg-poly/90"
            >
              {pushLoading ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Bell className="mr-1 h-3.5 w-3.5" />
              )}
              {permission === "denied" ? "Blocked in Browser" : "Enable Push"}
            </Button>
          )}
          {permission === "granted" && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4" /> Active
            </span>
          )}
        </div>
      </div>

      {/* Notification Categories */}
      <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-foreground border-b pb-2">
          Notification Categories
        </h3>

        <div className="divide-y divide-border/50">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-start gap-3">
              <Megaphone className="mt-0.5 h-4 w-4 text-poly" />
              <div>
                <Label className="text-sm font-medium text-foreground cursor-pointer">
                  Official Notices & Announcements
                </Label>
                <p className="text-xs text-muted-foreground">
                  Important organizational notices, circulars, and schedules.
                </p>
              </div>
            </div>
            <Switch
              checked={form.general_notice}
              onCheckedChange={(v) => handleToggle("general_notice", v)}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-start gap-3">
              <HeartPulse className="mt-0.5 h-4 w-4 text-crescent" />
              <div>
                <Label className="text-sm font-medium text-foreground cursor-pointer">
                  Urgent Blood Requests
                </Label>
                <p className="text-xs text-muted-foreground">
                  Matching patient requests in your district or compatible blood group.
                </p>
              </div>
            </div>
            <Switch
              checked={form.blood_request}
              onCheckedChange={(v) => handleToggle("blood_request", v)}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-400" />
              <div>
                <Label className="text-sm font-medium text-foreground cursor-pointer">
                  Emergency Alerts & Disaster Response
                </Label>
                <p className="text-xs text-muted-foreground">
                  High-priority disaster management and emergency volunteer mobilizations.
                </p>
              </div>
            </div>
            <Switch
              checked={form.emergency_alert}
              onCheckedChange={(v) => handleToggle("emergency_alert", v)}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 h-4 w-4 text-sky-600 dark:text-sky-400" />
              <div>
                <Label className="text-sm font-medium text-foreground cursor-pointer">
                  Volunteer Updates & Trainings
                </Label>
                <p className="text-xs text-muted-foreground">
                  Orientation sessions, skill workshops, and wing assignments.
                </p>
              </div>
            </div>
            <Switch
              checked={form.volunteer_notification}
              onCheckedChange={(v) => handleToggle("volunteer_notification", v)}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <div>
                <Label className="text-sm font-medium text-foreground cursor-pointer">
                  Events & Campaigns
                </Label>
                <p className="text-xs text-muted-foreground">
                  Blood donation drives, health awareness camps, and social activities.
                </p>
              </div>
            </div>
            <Switch
              checked={form.event_notification}
              onCheckedChange={(v) => handleToggle("event_notification", v)}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-start gap-3">
              <Settings className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium text-foreground cursor-pointer">
                  Account & System Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Application approval statuses, certificate releases, and security alerts.
                </p>
              </div>
            </div>
            <Switch
              checked={form.system_notification}
              onCheckedChange={(v) => handleToggle("system_notification", v)}
            />
          </div>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="rounded-2xl border bg-card p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <Moon className="mt-0.5 h-4 w-4 text-poly" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Quiet Hours</h3>
              <p className="text-xs text-muted-foreground">
                Mute non-urgent notifications during your sleep hours (Critical emergency alerts still pass through).
              </p>
            </div>
          </div>
          <Switch
            checked={form.quiet_hours_enabled}
            onCheckedChange={(v) => handleToggle("quiet_hours_enabled", v)}
          />
        </div>

        {form.quiet_hours_enabled && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <Label className="text-xs text-muted-foreground">Start Time</Label>
              <Input
                type="time"
                value={form.quiet_hours_start}
                onChange={(e) => setForm((prev) => ({ ...prev, quiet_hours_start: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">End Time</Label>
              <Input
                type="time"
                value={form.quiet_hours_end}
                onChange={(e) => setForm((prev) => ({ ...prev, quiet_hours_end: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-poly text-white hover:bg-poly/90 px-6"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </div>
    </div>
  );
}
