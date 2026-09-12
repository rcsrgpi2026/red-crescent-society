"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  PhoneCall,
  Siren,
  HelpCircle,
  X,
  Sparkles,
  Phone,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STORAGE_KEY = "rcy_blood_guide_seen_v3";

export function BloodGuideModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const hasSeen = localStorage.getItem(STORAGE_KEY);
      if (!hasSeen) {
        const timer = setTimeout(() => {
          setOpen(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  function handleClose() {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
  }

  return (
    <>
      {/* Trigger button on page so users can reopen tutorial anytime */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-crescent/30 bg-crescent-soft/70 px-3.5 py-1.5 text-xs font-semibold text-crescent shadow-xs transition-all hover:bg-crescent hover:text-white"
        aria-label="How it works guide"
      >
        <HelpCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>কীভাবে কাজ করে?</span>
      </button>

      {/* Tutorial Dialog - Compact Mobile-Friendly Popup */}
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleClose();
          else setOpen(true);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="w-[92vw] max-w-[390px] sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col rounded-2xl sm:rounded-3xl border border-line bg-white p-0 shadow-2xl"
        >
          {/* Header Banner - Compact & Clean */}
          <div className="relative bg-gradient-to-r from-crescent via-crescent to-brand-dark px-4 py-3.5 sm:px-5 sm:py-4 text-white shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-3 top-3 rounded-full bg-black/20 p-1.5 text-white/90 transition-colors hover:bg-black/40 hover:text-white"
              aria-label="Close tutorial"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium backdrop-blur-xs">
              <Sparkles className="h-3 w-3 text-amber-300" aria-hidden />
              <span>রক্ত সহায়তা গাইড</span>
            </div>

            <DialogHeader className="mt-2 text-left">
              <DialogTitle className="text-base font-bold tracking-tight text-white sm:text-lg">
                রক্তদাতা খোঁজার সহজ ৩টি ধাপ
              </DialogTitle>
            </DialogHeader>
          </div>

          {/* Body Steps - Compact & Readable */}
          <div className="overflow-y-auto p-3.5 sm:p-4 space-y-2 text-xs">
            {/* Step 1 */}
            <div className="flex items-start gap-2.5 rounded-xl border border-line/70 bg-mist/40 p-2.5 transition-colors hover:border-crescent/30 hover:bg-crescent-soft/20">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-crescent text-xs font-bold text-white shadow-xs">
                ১
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <Search className="h-3.5 w-3.5 text-crescent shrink-0" />
                  <h4 className="font-bold text-foreground text-xs">গ্রুপ ও এলাকা দিয়ে খুঁজুন</h4>
                </div>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                  তালিকা থেকে প্রয়োজনীয় রক্তের গ্রুপ ও এলাকা সিলেক্ট করে সার্চ করুন।
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-2.5 rounded-xl border border-line/70 bg-mist/40 p-2.5 transition-colors hover:border-crescent/30 hover:bg-crescent-soft/20">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-crescent text-xs font-bold text-white shadow-xs">
                ২
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <PhoneCall className="h-3.5 w-3.5 text-crescent shrink-0" />
                  <h4 className="font-bold text-foreground text-xs">যোগাযোগের অনুরোধ পাঠান</h4>
                </div>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                  ডোনার কার্ডে অনুরোধ পাঠিয়ে পাসকোড দিয়ে নম্বর সংগ্রহ করুন।
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-2.5 rounded-xl border border-line/70 bg-mist/40 p-2.5 transition-colors hover:border-crescent/30 hover:bg-crescent-soft/20">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-crescent text-xs font-bold text-white shadow-xs">
                ৩
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <Siren className="h-3.5 w-3.5 text-crescent shrink-0" />
                  <h4 className="font-bold text-foreground text-xs">সরাসরি রক্তের আবেদন</h4>
                </div>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                  ডোনার না পেলে জরুরি রিকোয়েস্ট দিন, ভলান্টিয়াররা যোগাযোগ করবে।
                </p>
              </div>
            </div>

            {/* Hotline Call Banner */}
            <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2 text-[11px] text-amber-950">
              <span className="font-medium">জরুরি প্রয়োজনে হটলাইন:</span>
              <a
                href="tel:01614424259"
                className="inline-flex items-center gap-1 rounded-full bg-crescent px-2.5 py-0.5 font-bold text-white shadow-xs hover:bg-crescent-dark"
              >
                <Phone className="h-2.5 w-2.5" />
                ০১৬১৪-৪২৪২৫৯
              </a>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <Link
                href="/blood-support/request"
                onClick={handleClose}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-crescent px-3 py-2 text-center text-xs font-bold text-white shadow-xs transition-all hover:bg-crescent-dark"
              >
                <Siren className="h-3.5 w-3.5 shrink-0" />
                জরুরি আবেদন
              </Link>
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-line bg-mist/60 px-3 py-2 text-center text-xs font-semibold text-foreground transition-colors hover:bg-mist"
              >
                বুঝেছি
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
