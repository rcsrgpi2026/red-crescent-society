"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  HeartPulse,
  Megaphone,
  ShieldAlert,
  Users,
  Calendar,
  Settings,
  CheckCheck,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getMyNotifications,
  getMyUnreadNotificationCount,
  getPublicBloodNotifications,
  markNotificationOpened,
  markAllNotificationsOpened,
} from "@/lib/notifications/actions";
import {
  subscribeUserToPush,
  getNotificationPermissionState,
  isPushSupported,
} from "@/lib/notifications/client";
import { toast } from "sonner";
import type { UserNotificationItem, NotificationType } from "@/lib/notifications/types";
import { cn } from "@/lib/utils";

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "blood_request":
      return <HeartPulse className="h-4 w-4 text-crescent" />;
    case "emergency":
      return <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
    case "notice":
      return <Megaphone className="h-4 w-4 text-poly" />;
    case "volunteer":
      return <Users className="h-4 w-4 text-sky-600 dark:text-sky-400" />;
    case "event":
      return <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
    case "system":
    default:
      return <Settings className="h-4 w-4 text-muted-foreground" />;
  }
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell({ userId }: { userId?: string | null }) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<UserNotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function loadData() {
    try {
      if (isPushSupported()) {
        setPermission(getNotificationPermissionState());
      }
      if (userId) {
        const [count, list] = await Promise.all([
          getMyUnreadNotificationCount(),
          getMyNotifications(15),
        ]);
        setUnreadCount(count);
        setNotifications(list);
      } else {
        // Non-registered guest: show public urgent blood requests only
        const list = await getPublicBloodNotifications(10);
        setNotifications(list);
        setUnreadCount(list.length > 0 ? list.length : 0);
      }
    } catch {
      // Ignored if offline
    }
  }

  useEffect(() => {
    loadData();
    // Poll every 45s for fresh notifications
    const interval = setInterval(loadData, 45000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleEnablePush = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setPushLoading(true);
    try {
      const res = await subscribeUserToPush();
      setPermission(res.permission);
      if (res.success) {
        toast.success("Push notifications enabled on this device!");
      } else if (res.permission === "denied") {
        toast.error("Notifications blocked in browser settings.");
      }
    } catch {
      toast.error("Failed to enable push.");
    } finally {
      setPushLoading(false);
    }
  };

  const handleNotificationClick = async (item: UserNotificationItem) => {
    if (item.status === "sent" || item.status === "pending" || item.status === "delivered") {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, status: "opened" } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await markNotificationOpened(item.id);
    }

    setOpen(false);
    const targetUrl = item.notification?.action_url;
    if (targetUrl) {
      router.push(targetUrl);
    }
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsOpened();
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: "opened" }))
      );
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full text-foreground/80 hover:bg-muted hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-crescent px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-background animate-in zoom-in">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 sm:w-96 p-0 shadow-xl border-poly/20 rounded-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/40">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-foreground">
              {userId ? "Notifications" : "🩸 Urgent Blood Alerts"}
            </h3>
            {unreadCount > 0 && (
              <span className="rounded-full bg-poly/15 px-2 py-0.5 text-xs font-semibold text-poly">
                {unreadCount} active
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isPending}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Mark all as read
            </Button>
          )}
        </div>

        {permission !== "granted" && isPushSupported() && (
          <div className="bg-poly-soft/50 dark:bg-poly/15 px-4 py-2.5 border-b flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium text-foreground">
              Enable push alerts on this device
            </p>
            <Button
              size="sm"
              onClick={handleEnablePush}
              disabled={pushLoading || permission === "denied"}
              className="h-6 text-[10px] bg-poly text-white hover:bg-poly/90 px-2.5"
            >
              {pushLoading ? "Enabling..." : permission === "denied" ? "Blocked" : "Enable"}
            </Button>
          </div>
        )}

        <div className="max-h-[380px] overflow-y-auto divide-y divide-border/50">
          {notifications.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <Bell className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-xs font-medium">No notifications yet</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                We'll notify you when urgent blood requests or notices arrive.
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const isUnread =
                item.status === "pending" ||
                item.status === "sent" ||
                item.status === "delivered";
              const notif = item.notification;
              if (!notif) return null;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={cn(
                    "flex w-full items-start gap-3 p-3.5 text-left transition hover:bg-muted/60",
                    isUnread && "bg-poly-soft/40 dark:bg-poly/10"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                      isUnread
                        ? "border-poly/30 bg-background shadow-xs"
                        : "border-border/50 bg-muted/40"
                    )}
                  >
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={cn(
                          "truncate text-xs font-medium",
                          isUnread ? "text-foreground font-semibold" : "text-muted-foreground"
                        )}
                      >
                        {notif.title}
                      </p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {timeAgo(item.created_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground/90">
                      {notif.body}
                    </p>
                  </div>
                  {isUnread && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-crescent ring-2 ring-background" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
