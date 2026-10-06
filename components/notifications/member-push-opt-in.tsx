"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle2, Loader2, Smartphone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isPushSupported,
  getNotificationPermissionState,
  subscribeUserToPush,
  syncPushSubscription,
} from "@/lib/notifications/client";
import { toast } from "sonner";

export function MemberPushOptInCard({
  applicantName,
  userId,
}: {
  applicantName?: string;
  userId?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isPushSupported()) return;

    const perm = getNotificationPermissionState();
    setPermission(perm);

    // If already granted, sync the subscription to ensure this user owns it in DB
    if (perm === "granted") {
      syncPushSubscription().catch(() => {});
    }
  }, [userId]);

  if (!mounted || !isPushSupported()) {
    return null;
  }

  const handleEnablePush = async () => {
    setLoading(true);
    try {
      const res = await subscribeUserToPush();
      setPermission(res.permission);
      if (res.success) {
        toast.success("পুশ নোটিফিকেশন সক্রিয় হয়েছে!", {
          description: "অ্যাডমিন অনুমোদন দেওয়ার সাথে সাথে এই ডিভাইসে পুশ নোটিফিকেশন পাবেন।",
        });
      } else if (res.permission === "denied") {
        toast.error("নোটিফিকেশন পারমিশন ব্লকড রয়েছে। ব্রাউজার সেটিংসে গিয়ে Allow করুন।");
      }
    } catch {
      toast.error("পুশ নোটিফিকেশন চালু করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-poly/25 bg-white p-4 text-left shadow-xs transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-poly/15 text-poly">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-foreground">
                অনুমোদনের সাথে সাথে ফোনে পুশ নোটিফিকেশন পান
              </h4>
              {permission === "granted" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> সক্রিয়
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
              {permission === "granted"
                ? `ধন্যবাদ ${applicantName || ""}! এই ডিভাইসে পুশ নোটিফিকেশন সফলভাবে চালু রয়েছে। অ্যাডমিন অনুমোদন দেওয়ামাত্র নোটিফিকেশন চলে আসবে।`
                : "আপনার ফোনে নোটিফিকেশন চালু রাখুন যাতে আবেদনটি রিভিউ হওয়ার সাথে সাথে আপনার স্ক্রিনে পুশ নোটিফিকেশন চলে আসে।"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center">
          {permission === "granted" ? (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <Smartphone className="h-4 w-4" /> পুশ অ্যালার্ট চালু আছে
            </span>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleEnablePush}
              disabled={loading || permission === "denied"}
              className="bg-poly text-white hover:bg-poly/90 text-xs font-semibold px-4 h-9 shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  চালু হচ্ছে...
                </>
              ) : permission === "denied" ? (
                "পারমিশন ব্লকড"
              ) : (
                "🔔 পুশ নোটিফিকেশন চালু করুন"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
