"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, CheckCircle2, Loader2, Smartphone, AlertTriangle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isPushSupported,
  getNotificationPermissionState,
  subscribeUserToPush,
  syncPushSubscription,
} from "@/lib/notifications/client";
import { adminSendTestPushToMe } from "@/lib/notifications/actions";
import { toast } from "sonner";

export function AdminPushAlertsBanner({ adminId }: { adminId?: string }) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isPushSupported()) return;

    const perm = getNotificationPermissionState();
    setPermission(perm);

    // Auto-sync subscription on mount so this admin's user_id is definitely bound to this device endpoint in DB
    syncPushSubscription().catch(() => {});
  }, [adminId]);

  if (!mounted || !isPushSupported()) {
    return null;
  }

  const handleEnablePush = async () => {
    setLoading(true);
    try {
      const res = await subscribeUserToPush();
      setPermission(res.permission);
      if (res.success) {
        toast.success("অ্যাডমিন পুশ অ্যালার্ট সক্রিয় হয়েছে!", {
          description: "নতুন RCY মেম্বার আবেদন আসলে আপনার এই ডিভাইসে সাথে সাথে পুশ নোটিফিকেশন আসবে।",
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

  const handleSendTestPush = async () => {
    setTestLoading(true);
    try {
      const res = await adminSendTestPushToMe();
      if (res.success) {
        toast.success("টেস্ট পুশ নোটিফিকেশন সফল!", {
          description: res.message,
        });
      } else {
        toast.error("টেস্ট পুশ ব্যর্থ হয়েছে", {
          description: res.message,
        });
      }
    } catch (err: any) {
      toast.error("টেস্ট পুশ পাঠানো যায়নি।");
    } finally {
      setTestLoading(false);
    }
  };

  if (permission === "granted") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-2.5 text-xs text-emerald-900 shadow-xs mb-6">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </span>
          <span className="font-medium">
            অ্যাডমিন পুশ নোটিফিকেশন এই ডিভাইসে সক্রিয় রয়েছে (নতুন আবেদন ও জরুরি অ্যালার্ট সরাসরি আসবে)।
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleSendTestPush}
          disabled={testLoading}
          className="h-7 border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100/60 text-[11px] font-semibold gap-1.5 shadow-none"
        >
          {testLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Send className="h-3 w-3" />
          )}
          {testLoading ? "পাঠানো হচ্ছে..." : "আমার ফোনে টেস্ট অ্যালার্ট পাঠান"}
        </Button>
      </div>
    );
  }

  if (dismissed) return null;

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 via-amber-100/50 to-orange-50 p-4 text-xs shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
            <BellRing className="h-4 w-4 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-amber-950">
                ⚠️ অ্যাডমিন পুশ অ্যালার্ট বন্ধ রয়েছে
              </p>
              <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                জরুরি
              </span>
            </div>
            <p className="mt-0.5 text-xs text-amber-900/90 leading-relaxed">
              নতুন মেম্বার রেজিস্ট্রেশন আবেদন, জরুরি রক্ত সাহায্য বা যোগাযোগের মেসেজ আসলে সাথে সাথে আপনার মোবাইল বা ল্যাপটপে পুশ নোটিফিকেশন পেতে এই ডিভাইসে পারমিশন দিন।
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleEnablePush}
            disabled={loading || permission === "denied"}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold h-8 px-3.5 shadow-xs"
          >
            {loading ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                চালু হচ্ছে...
              </>
            ) : permission === "denied" ? (
              "পারমিশন ব্লকড (সেটিংস থেকে অন করুন)"
            ) : (
              "🔔 পুশ অ্যালার্ট চালু করুন"
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-amber-800 hover:bg-amber-200/50 text-[11px] h-8"
          >
            পরে
          </Button>
        </div>
      </div>
    </div>
  );
}
