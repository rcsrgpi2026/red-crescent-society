"use client";

import { useState } from "react";
import Link from "next/link";
import { Siren, Droplets, HeartPulse, UserCog, MapPin, Clock, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DonorRegisterForm } from "@/components/forms/donor-register-form";
import { DonorSelfService } from "@/components/forms/donor-self-service";
import { ContactRequestRecovery } from "@/components/blood/contact-request-recovery";
import { formatDate } from "@/lib/constants";
import type { PublicBloodRequest } from "@/types/database";

interface BloodMenuButtonsProps {
  activeRequests: PublicBloodRequest[];
  strings?: {
    contactRequest?: any;
  };
}

export function BloodMenuButtons({ activeRequests, strings }: BloodMenuButtonsProps) {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [manageTab, setManageTab] = useState<"donor" | "tracking">("donor");

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {/* 1. Request Blood (Square Button) */}
      <Link
        href="/blood-support/request"
        className="group relative flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-crescent/25 bg-gradient-to-br from-crescent/10 via-white to-rose-50/50 p-3 text-center shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-crescent hover:shadow-md hover:shadow-crescent/15 active:scale-95"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-crescent text-white shadow-md shadow-crescent/30 transition-transform group-hover:scale-110">
          <Siren className="h-6 w-6" aria-hidden />
        </div>
        <span className="mt-3 text-sm font-bold text-foreground group-hover:text-crescent">
          Request Blood
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">
          রক্তের আবেদন
        </span>
      </Link>

      {/* 2. Register as Donor (Square Button) */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="group relative flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-white to-emerald-50/50 p-3 text-center shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-emerald-600 hover:shadow-md hover:shadow-emerald-500/15 active:scale-95 cursor-pointer"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30 transition-transform group-hover:scale-110">
              <Droplets className="h-6 w-6" aria-hidden />
            </div>
            <span className="mt-3 text-sm font-bold text-foreground group-hover:text-emerald-700">
              Register as Donor
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">
              রক্তদাতা নিবন্ধন
            </span>
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 md:p-8">
          <DialogHeader className="border-b border-line pb-3 text-left">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Droplets className="h-5 w-5 text-emerald-600" />
              রক্তদাতা নিবন্ধন (Donor Registration)
            </DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            <DonorRegisterForm />
          </div>
        </DialogContent>
      </Dialog>

      {/* 3. Emergency Requests (Square Button) */}
      <Dialog open={requestsOpen} onOpenChange={setRequestsOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="group relative flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-white to-amber-50/50 p-3 text-center shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-amber-600 hover:shadow-md hover:shadow-amber-500/15 active:scale-95 cursor-pointer"
          >
            {activeRequests.length > 0 && (
              <span className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crescent opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-crescent" />
              </span>
            )}
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-600 to-rose-600 text-white shadow-md shadow-amber-500/30 transition-transform group-hover:scale-110">
              <HeartPulse className="h-6 w-6" aria-hidden />
            </div>
            <span className="mt-3 text-sm font-bold text-foreground group-hover:text-amber-800">
              Emergency Requests
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">
              {activeRequests.length > 0 ? `${activeRequests.length}টি সক্রিয় অনুরোধ` : "জরুরি চাহিদা"}
            </span>
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="border-b border-line pb-3 text-left">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <HeartPulse className="h-5 w-5 text-crescent" />
              জরুরি রক্তের অনুরোধ (Active Blood Requests)
            </DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            {activeRequests.length > 0 ? (
              <div className="space-y-3">
                {activeRequests.map((req) => (
                  <Link
                    key={req.id}
                    href={`/blood-support/request/${req.id}`}
                    onClick={() => setRequestsOpen(false)}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white p-3.5 shadow-2xs transition-all hover:border-crescent hover:bg-rose-50/30 hover:shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-crescent text-white font-black text-sm shadow-xs">
                        {req.blood_group}
                      </span>
                      <div className="text-left">
                        <p className="font-bold text-sm text-foreground">
                          {req.patient_name} ({req.units} ব্যাগ)
                        </p>
                        <p className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          {req.hospital && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-crescent shrink-0" />
                              {req.hospital}
                            </span>
                          )}
                          {req.required_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 shrink-0" />
                              {formatDate(req.required_date, "en-GB")}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-crescent flex items-center gap-1">
                      বিস্তারিত <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <HeartPulse className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
                <p className="font-semibold text-sm">বর্তমানে কোনো সক্রিয় রক্তের অনুরোধ নেই।</p>
                <p className="text-xs mt-1">জরুরি রক্তের প্রয়োজনে &quot;Request Blood&quot; থেকে নতুন অনুরোধ পাঠান।</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 4. Manage Listing (Square Button) */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="group relative flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-slate-500/25 bg-gradient-to-br from-slate-500/10 via-white to-slate-50/50 p-3 text-center shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-slate-700 hover:shadow-md hover:shadow-slate-500/15 active:scale-95 cursor-pointer"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-white shadow-md shadow-slate-800/30 transition-transform group-hover:scale-110">
              <UserCog className="h-6 w-6" aria-hidden />
            </div>
            <span className="mt-3 text-sm font-bold text-foreground group-hover:text-slate-900">
              Manage Listing
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">
              তথ্য পরিবর্তন / ডিলিট
            </span>
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-xl md:max-w-2xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <DialogHeader className="border-b border-line pb-3 text-left">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-foreground">
              <UserCog className="h-5 w-5 text-slate-800" />
              ম্যানেজ লিস্টিং (Manage Listing)
            </DialogTitle>
          </DialogHeader>

          {/* Clean Segmented Tabs */}
          <div className="pt-2">
            {strings?.contactRequest && (
              <div className="flex rounded-xl bg-slate-100 p-1 mb-4">
                <button
                  type="button"
                  onClick={() => setManageTab("donor")}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    manageTab === "donor"
                      ? "bg-white text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  রক্তদাতা তথ্য আপডেট
                </button>
                <button
                  type="button"
                  onClick={() => setManageTab("tracking")}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    manageTab === "tracking"
                      ? "bg-white text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  রিকোয়েস্ট ট্র্যাকিং
                </button>
              </div>
            )}

            {manageTab === "donor" ? (
              <DonorSelfService />
            ) : strings?.contactRequest ? (
              <ContactRequestRecovery strings={strings.contactRequest} />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
