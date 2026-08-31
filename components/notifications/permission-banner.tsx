"use client";

import { useEffect, useState } from "react";
import { Bell, ShieldAlert, HeartPulse, X, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isPushSupported, getNotificationPermissionState, subscribeUserToPush } from "@/lib/notifications/client";
import { toast } from "sonner";

export function NotificationPermissionCard() {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (!isPushSupported()) return;

    const perm = getNotificationPermissionState();
    setPermission(perm);

    const dismissed = localStorage.getItem("rcy_notif_banner_dismissed");
    if (perm === "default" && !dismissed) {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible || permission !== "default") {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem("rcy_notif_banner_dismissed", "true");
    setIsVisible(false);
  };

  const handleEnable = async () => {
    setLoading(true);
    try {
      const res = await subscribeUserToPush();
      setPermission(res.permission);
      if (res.success) {
        toast.success("Notifications enabled!", {
          description: "You'll now receive urgent blood requests and official notices.",
        });
        setIsVisible(false);
      } else if (res.permission === "denied") {
        toast.error("Notifications blocked", {
          description: "Please unblock notifications in your browser settings to receive alerts.",
        });
        setIsVisible(false);
      }
    } catch {
      toast.error("Could not enable notifications.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-poly/20 bg-gradient-to-br from-poly-soft/80 via-background to-background p-5 shadow-lg backdrop-blur-md transition-all duration-300">
      <button
        onClick={handleDismiss}
        className="absolute right-3.5 top-3.5 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        aria-label="Dismiss notification prompt"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-poly/15 text-poly">
            <Bell className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">
              Stay Connected with Red Crescent Alerts
            </h4>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              Get notified immediately for urgent blood requests, emergency response alerts, and volunteer updates.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-md bg-crescent/10 px-2 py-0.5 text-crescent">
                <HeartPulse className="h-3 w-3" /> Blood Requests
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-amber-700 dark:text-amber-400">
                <ShieldAlert className="h-3 w-3" /> Emergency Alerts
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-poly/10 px-2 py-0.5 text-poly">
                <Check className="h-3 w-3" /> Official Notices
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 pt-2 sm:pt-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-xs text-muted-foreground"
          >
            Not Now
          </Button>
          <Button
            size="sm"
            onClick={handleEnable}
            disabled={loading}
            className="bg-poly text-xs text-white hover:bg-poly/90"
          >
            {loading ? "Enabling..." : "Enable Notifications"}
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
