"use client";

import { useState, useRef } from "react";
import { registerDonor } from "@/lib/actions";
import { BLOOD_GROUPS } from "@/lib/constants";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { FieldError } from "@/components/forms/form";
import {
  DonorGreetingModal,
  type DonorGreetingInfo,
} from "@/components/blood/donor-greeting-modal";
import { MandatoryContactStep } from "@/components/forms/mandatory-contact-step";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  HeartHandshake,
  User,
  Droplets,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Lock,
} from "lucide-react";

export function DonorRegisterForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [phonePublic, setPhonePublic] = useState(false);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Greeting popup state
  const [greetingDonor, setGreetingDonor] = useState<DonorGreetingInfo | null>(null);
  const [showGreeting, setShowGreeting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    setBusy(true);
    setErrors({});
    setMessage(null);

    const res = await registerDonor({ success: false }, formData);
    setBusy(false);

    if (res.success) {
      const name = String(formData.get("name") || "").trim();
      const bloodGroup = String(formData.get("bloodGroup") || "").trim();
      const area = String(formData.get("area") || "").trim();
      const isPublic = formData.get("phonePublic") === "on";

      setGreetingDonor({
        name,
        bloodGroup: bloodGroup || selectedBloodGroup,
        area,
        phonePublic: isPublic,
      });
      setShowGreeting(true);

      // Reset form
      formRef.current.reset();
      setSelectedBloodGroup("");
      setPhonePublic(false);
      setMessage({
        type: "success",
        text: "রক্তদাতা হিসেবে সফলভাবে তালিকাভুক্ত হয়েছেন! অভিনন্দন ও আন্তরিক কৃতজ্ঞতা।",
      });
    } else {
      if (res.errors) {
        setErrors(res.errors);
      }
      setMessage({
        type: "error",
        text: res.message || "নিবন্ধনে সমস্যা হয়েছে। অনুগ্রহ করে তথ্যগুলো যাচাই করে আবার চেষ্টা করুন।",
      });
    }
  }

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Anti-spam trap */}
        <input
          type="text"
          name="website_url"
          tabIndex={-1}
          autoComplete="off"
          style={{ display: "none" }}
          aria-hidden="true"
        />

        {message && (
          <div
            role={message.type === "error" ? "alert" : "status"}
            className={`flex items-start gap-2.5 rounded-2xl border p-3.5 text-sm ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-crescent/30 bg-crescent-soft text-crescent"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            )}
            <p>{message.text}</p>
          </div>
        )}

        <div>
          <Label htmlFor="d-name" className="font-medium text-foreground text-sm">
            Full name / পূর্ণ নাম
          </Label>
          <div className="relative mt-1.5">
            <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              id="d-name"
              name="name"
              placeholder="Your name"
              className="h-11 rounded-full pl-10 pr-4 bg-slate-50/60 border-slate-200 focus:bg-white focus:border-crescent focus:ring-4 focus:ring-crescent/15 transition-all text-sm"
              required
            />
          </div>
          <FieldError errors={errors} name="name" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="d-bloodGroup" className="font-medium text-foreground text-sm">
              Blood group / রক্তের গ্রুপ
            </Label>
            <Select
              name="bloodGroup"
              value={selectedBloodGroup}
              onValueChange={setSelectedBloodGroup}
            >
              <div className="relative mt-1.5">
                <Droplets className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 z-10" />
                <SelectTrigger
                  id="d-bloodGroup"
                  className="h-11 rounded-full pl-10 pr-4 bg-slate-50/60 border-slate-200 focus:bg-white focus:border-crescent focus:ring-4 focus:ring-crescent/15 transition-all text-sm"
                >
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
              </div>
              <SelectContent>
                {BLOOD_GROUPS.map((bg) => (
                  <SelectItem key={bg} value={bg}>
                    {bg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={errors} name="bloodGroup" />
          </div>

          <div>
            <Label htmlFor="d-area" className="font-medium text-foreground text-sm">
              Area / বর্তমান এলাকা
            </Label>
            <div className="relative mt-1.5">
              <MapPin className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                id="d-area"
                name="area"
                placeholder="e.g. Kazla, Rajshahi"
                className="h-11 rounded-full pl-10 pr-4 bg-slate-50/60 border-slate-200 focus:bg-white focus:border-crescent focus:ring-4 focus:ring-crescent/15 transition-all text-sm"
                required
              />
            </div>
            <FieldError errors={errors} name="area" />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="d-phone" className="font-medium text-foreground text-sm">
              Mobile number / মোবাইল নম্বর <span className="text-crescent">*</span>
            </Label>
            <div className="relative mt-1.5">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                id="d-phone"
                name="phone"
                type="tel"
                placeholder="017XXXXXXXX"
                className="h-11 rounded-full pl-10 pr-4 bg-slate-50/60 border-slate-200 focus:bg-white focus:border-crescent focus:ring-4 focus:ring-crescent/15 transition-all text-sm"
                required
              />
            </div>
            <FieldError errors={errors} name="phone" />
          </div>

          <div>
            <Label htmlFor="d-email" className="font-medium text-foreground text-sm">
              Email address / ইমেইল ঠিকানা <span className="text-crescent">*</span>
            </Label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                id="d-email"
                name="email"
                type="email"
                placeholder="your.email@example.com"
                className="h-11 rounded-full pl-10 pr-4 bg-slate-50/60 border-slate-200 focus:bg-white focus:border-crescent focus:ring-4 focus:ring-crescent/15 transition-all text-sm"
                required
              />
            </div>
            <FieldError errors={errors} name="email" />
          </div>
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">
          আপনার মোবাইল ও ইমেইল নম্বর সুরক্ষিত রাখা হয় — জরুরি ক্যাম্পেইন ও প্রয়োজনীয় তথ্যে যোগাযোগ করা হবে।
        </p>

        <div>
          <Label htmlFor="d-lastDonation" className="font-medium text-foreground text-sm">
            Last donation date / সর্বশেষ রক্তদানের তারিখ (ঐচ্ছিক)
          </Label>
          <div className="relative mt-1.5">
            <Calendar className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              id="d-lastDonation"
              name="lastDonationDate"
              type="date"
              className="h-11 rounded-full pl-10 pr-4 bg-slate-50/60 border-slate-200 focus:bg-white focus:border-crescent focus:ring-4 focus:ring-crescent/15 transition-all text-sm"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="d-passcode" className="font-medium text-foreground text-sm">
            Set a passcode (4–6 digits) / গোপন পাসকোড
          </Label>
          <div className="relative mt-1.5">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              id="d-passcode"
              name="passcode"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4,6}"
              autoComplete="new-password"
              placeholder="••••"
              className="h-11 rounded-full pl-10 pr-4 bg-slate-50/60 border-slate-200 focus:bg-white focus:border-crescent focus:ring-4 focus:ring-crescent/15 transition-all text-sm tracking-widest"
              required
            />
          </div>
          <FieldError errors={errors} name="passcode" />
          <p className="mt-1.5 text-xs text-muted-foreground">
            ভবিষ্যতে নিজের তথ্য বা স্ট্যাটাস নিজে আপডেট করার জন্য এই ৪-৬ সংখ্যার কোডটি সংরক্ষণ করুন।
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-line bg-slate-50/60 p-4 transition-all hover:bg-slate-50">
          <Checkbox
            id="d-phonePublic"
            checked={phonePublic}
            onCheckedChange={(v) => setPhonePublic(v === true)}
            className="mt-0.5 rounded-md"
          />
          <div>
            <Label htmlFor="d-phonePublic" className="font-semibold text-foreground cursor-pointer text-sm">
              Show my number publicly / নম্বর সরাসরি পাবলিক রাখুন
            </Label>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              ঐচ্ছিক — এটি চালু রাখলে ডোনার তালিকায় আপনার নম্বর সরাসরি দেখা যাবে এবং জরুরি প্রয়োজনে যে কেউ আপনাকে সরাসরি কল করতে পারবে।
            </p>
          </div>
          <input type="hidden" name="phonePublic" value={phonePublic ? "on" : ""} />
        </div>

        {/* Mandatory Contact Save Step */}
        <MandatoryContactStep className="my-2" />

        <Button
          type="submit"
          disabled={busy}
          className="w-full sm:w-auto bg-crescent hover:bg-crescent-dark text-white font-bold h-11 px-8 rounded-full shadow-md shadow-crescent/20 transition-all active:scale-[0.98]"
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              তালিকাভুক্ত করা হচ্ছে…
            </>
          ) : (
            <>
              <HeartHandshake className="mr-2 h-4 w-4" />
              Register as Donor
            </>
          )}
        </Button>
      </form>

      {/* Heartwarming Greeting Popup Modal */}
      <DonorGreetingModal
        open={showGreeting}
        onOpenChange={setShowGreeting}
        donor={greetingDonor}
      />
    </>
  );
}
