"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Droplets,
  Search,
  PhoneCall,
  Siren,
  HeartHandshake,
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

const STORAGE_KEY = "rcy_blood_guide_seen_v2";

export function BloodGuideModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show on first visit after a brief pause so page settles
    try {
      const hasSeen = localStorage.getItem(STORAGE_KEY);
      if (!hasSeen) {
        const timer = setTimeout(() => {
          setOpen(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage may be disabled in private mode
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
        className="inline-flex items-center gap-1.5 rounded-full border border-crescent/30 bg-crescent-soft/70 px-4 py-2 text-xs font-semibold text-crescent shadow-sm transition-all hover:bg-crescent hover:text-white"
        aria-label="How it works guide"
      >
        <HelpCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>How it works?</span>
      </button>

      {/* Tutorial Dialog */}
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
        else setOpen(true);
      }}>
        <DialogContent
          showCloseButton={false}
          className="max-w-lg overflow-hidden rounded-3xl border border-line bg-white p-0 shadow-2xl sm:max-w-xl"
        >
          {/* Header Banner */}
          <div className="relative bg-gradient-to-br from-crescent via-crescent to-brand-dark px-6 py-6 text-white">
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-full bg-black/20 p-1.5 text-white/80 transition-colors hover:bg-black/40 hover:text-white"
              aria-label="Close tutorial"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden />
              <span>জরুরি রক্ত সহায়তা টিউটোরিয়াল</span>
            </div>

            <DialogHeader className="mt-3 text-left">
              <DialogTitle className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                সহজে রক্তদাতা খুঁজুন ও রক্ত সংগ্রহ করুন
              </DialogTitle>
              <p className="mt-1 text-xs leading-relaxed text-white/90 sm:text-sm">
                জরুরি মুহূর্তে প্রয়োজনীয় রক্ত পাওয়ার সহজ ৩টি ধাপ জেনে নিন:
              </p>
            </DialogHeader>
          </div>

          {/* Body Steps */}
          <div className="space-y-3.5 p-5 sm:p-6">
            {/* Step 1 */}
            <div className="flex items-start gap-3.5 rounded-2xl border border-line/70 bg-mist/30 p-3.5 transition-colors hover:border-crescent/30 hover:bg-crescent-soft/20">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-crescent font-bold text-white shadow-sm shadow-crescent/20">
                ১
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Search className="h-4 w-4 text-crescent" />
                  <h4 className="text-sm font-bold text-foreground">রক্তদাতা খুঁজুন</h4>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  তালিকা থেকে আপনার প্রয়োজনীয় <strong>রক্তের গ্রুপ</strong> ও <strong>এলাকা</strong> সিলেক্ট করে সার্চ করুন। উপলব্ধ ডোনারদের কার্ড দেখতে পাবেন।
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3.5 rounded-2xl border border-line/70 bg-mist/30 p-3.5 transition-colors hover:border-crescent/30 hover:bg-crescent-soft/20">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-crescent font-bold text-white shadow-sm shadow-crescent/20">
                ২
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <PhoneCall className="h-4 w-4 text-crescent" />
                  <h4 className="text-sm font-bold text-foreground">যোগাযোগের অনুরোধ পাঠান</h4>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  পছন্দের ডোনারের কার্ডে <strong>&ldquo;যোগাযোগের অনুরোধ&rdquo;</strong> বাটনে ক্লিক করে তথ্য দিন। পাসকোড দিয়ে যেকোনো সময় ভেরিফাইড নম্বরটি সংগ্রহ করতে পারবেন।
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3.5 rounded-2xl border border-line/70 bg-mist/30 p-3.5 transition-colors hover:border-crescent/30 hover:bg-crescent-soft/20">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-crescent font-bold text-white shadow-sm shadow-crescent/20">
                ৩
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Siren className="h-4 w-4 text-crescent" />
                  <h4 className="text-sm font-bold text-foreground">ডোনার না পেলে সরাসরি আবেদন করুন</h4>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  তাৎক্ষণিক ডোনার না পেলে <strong>&ldquo;জরুরি রক্তের আবেদন&rdquo;</strong> করুন। আমাদের রেড ক্রিসেন্ট যুব সদস্যরা তাৎক্ষণিক ডোনার ম্যানেজ করার চেষ্টা করবে।
                </p>
              </div>
            </div>

            {/* Hotline Call Banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-950">
              <div className="flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 shrink-0 text-amber-700" />
                <span>তাৎক্ষণিক জরুরি প্রয়োজনে হটলাইনে কল করুন:</span>
              </div>
              <a
                href="tel:01614424259"
                className="inline-flex items-center gap-1.5 rounded-full bg-crescent px-3.5 py-1 text-xs font-bold text-white shadow-xs transition-colors hover:bg-crescent-dark"
              >
                <Phone className="h-3 w-3" />
                ০১৬১৪-৪২৪২৫৯
              </a>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 pt-2 sm:flex-row">
              <Link
                href="/blood-support/request"
                onClick={handleClose}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-crescent px-4 py-2.5 text-center text-xs font-bold text-white shadow-sm transition-all hover:bg-crescent-dark"
              >
                <Siren className="h-4 w-4 shrink-0" />
                জরুরি রক্তের আবেদন করুন
              </Link>
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-line bg-mist/50 px-4 py-2.5 text-center text-xs font-semibold text-foreground transition-colors hover:bg-mist hover:text-foreground"
              >
                বুঝেছি, রক্তদাতা খুঁজব
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
