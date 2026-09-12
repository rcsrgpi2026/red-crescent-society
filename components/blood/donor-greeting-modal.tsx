"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Heart, Droplets, Sparkles, ShieldCheck, HeartHandshake } from "lucide-react";

export interface DonorGreetingInfo {
  name: string;
  bloodGroup: string;
  area: string;
  phonePublic?: boolean;
}

interface DonorGreetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  donor: DonorGreetingInfo | null;
}

export function DonorGreetingModal({
  open,
  onOpenChange,
  donor,
}: DonorGreetingModalProps) {
  if (!donor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-[450px] max-h-[88vh] overflow-y-auto rounded-3xl p-5 sm:p-7 border border-line bg-white shadow-2xl">
        <DialogHeader className="text-center sm:text-center items-center">
          {/* Animated Celebration Icon */}
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-crescent to-rose-500 text-white shadow-lg shadow-crescent/25">
            <HeartHandshake className="h-9 w-9 animate-pulse" />
            <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-amber-950 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 fill-amber-950" />
            </span>
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-crescent/10 px-3 py-0.5 text-xs font-bold text-crescent">
              <Droplets className="h-3.5 w-3.5 fill-crescent" />
              মানবতার অনন্য সৈনিক
            </span>
          </div>

          <DialogTitle className="mt-2 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl text-balance">
            অভিনন্দন ও বিনম্র শ্রদ্ধা, <span className="text-crescent">{donor.name}</span>!
          </DialogTitle>
        </DialogHeader>

        {/* Heartwarming Greeting Message */}
        <div className="mt-2 space-y-3.5 text-center">
          <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3.5">
            <p className="text-xs sm:text-sm font-semibold italic text-rose-900 leading-snug">
              &ldquo;আপনার এক ফোঁটা রক্ত, বাঁচিয়ে দিতে পারে একটি মুমূর্ষু জীবন।&rdquo;
            </p>
          </div>

          <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground text-pretty">
            বাংলাদেশ রেড ক্রিসেন্ট সোসাইটি, আরজিপিআই ইউনিটের রক্ত সহায়তা পরিবারে আপনাকে আন্তরিক স্বাগতম। 
            বিপদের দিনে কোনো অসহায় মানুষের পাশে দাঁড়ানোর আপনার এই নিঃস্বার্থ সম্মতি এক অনন্য মানবিক দৃষ্টান্ত। 
            আপনার মতো নির্ভীক রক্তদাতাদের কারণেই সংকটের মুহূর্তে মানুষের মুখে হাসি ফোটে এবং একটি পরিবার নতুন করে বেঁচে থাকার সাহস পায়।
          </p>

          <p className="text-xs sm:text-sm font-medium text-foreground">
            রেড ক্রিসেন্ট পরিবারের পক্ষ থেকে আপনাকে জানাই গভীর শ্রদ্ধা, লাল সালাম ও অন্তরের অন্তস্তল থেকে অশেষ কৃতজ্ঞতা। ❤️
          </p>

          {/* Donor Summary Badge Card */}
          <div className="mt-4 rounded-2xl border border-line bg-mist/40 p-4 text-left">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              রক্তদাতা প্রোফাইল সারাংশ
            </p>
            <div className="mt-2.5 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">রক্তের গ্রুপ</span>
                <span className="mt-0.5 inline-flex items-center gap-1 rounded-md bg-crescent px-2.5 py-0.5 font-bold text-white shadow-xs">
                  <Droplets className="h-3 w-3 fill-white" />
                  {donor.bloodGroup}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">এলাকা</span>
                <span className="font-semibold text-foreground truncate block mt-0.5">
                  {donor.area}
                </span>
              </div>
              <div className="col-span-2 pt-1 border-t border-line/60 flex items-center justify-between">
                <span className="text-muted-foreground text-[11px]">বর্তমান স্ট্যাটাস</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  সচল জীবনরক্ষাকারী (Active)
                </span>
              </div>
            </div>
          </div>

          {/* Security Assurance */}
          <div className="flex items-start gap-2 rounded-xl border border-line/70 bg-white p-3 text-left text-xs text-muted-foreground shadow-2xs">
            <ShieldCheck className="h-4 w-4 shrink-0 text-crescent mt-0.5" />
            <p className="leading-snug">
              আপনার পাসকোড ও তথ্য সুরক্ষিত রয়েছে। যেকোনো সময় <strong>&ldquo;Manage your listing&rdquo;</strong> অপশন থেকে স্ট্যাটাস পরিবর্তন করতে পারবেন।
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-crescent px-4 text-sm font-bold text-white shadow-md shadow-crescent/20 transition-all hover:bg-crescent-dark active:scale-[0.98]"
            >
              <Heart className="h-4 w-4 fill-white" />
              ধন্যবাদ, আমি মানুষের পাশে আছি
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
