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
import { CheckCircle2, AlertCircle, Loader2, HeartHandshake } from "lucide-react";

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
            className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-sm ${
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
          <Label htmlFor="d-name">Full name / পূর্ণ নাম</Label>
          <Input id="d-name" name="name" placeholder="Your name" className="mt-1.5" required />
          <FieldError errors={errors} name="name" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="d-bloodGroup">Blood group / রক্তের গ্রুপ</Label>
            <Select
              name="bloodGroup"
              value={selectedBloodGroup}
              onValueChange={setSelectedBloodGroup}
            >
              <SelectTrigger id="d-bloodGroup" className="mt-1.5">
                <SelectValue placeholder="Select blood group" />
              </SelectTrigger>
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
            <Label htmlFor="d-area">Area / বর্তমান এলাকা</Label>
            <Input id="d-area" name="area" placeholder="e.g. Kazla, Rajshahi" className="mt-1.5" required />
            <FieldError errors={errors} name="area" />
          </div>
        </div>

        <div>
          <Label htmlFor="d-phone">Mobile number / মোবাইল নম্বর</Label>
          <Input id="d-phone" name="phone" type="tel" placeholder="017XXXXXXXX" className="mt-1.5" required />
          <FieldError errors={errors} name="phone" />
          <p className="mt-1 text-xs text-muted-foreground">
            আপনার নম্বরটি ডিফল্টভাবে সুরক্ষিত রাখা হয়। দর্শকরা সরাসরি নম্বর দেখতে পায় না, রিকোয়েস্ট পাঠালে আপনি বা টিম যোগাযোগ করিয়ে দেয়।
          </p>
        </div>

        <div>
          <Label htmlFor="d-lastDonation">Last donation date / সর্বশেষ রক্তদানের তারিখ (ঐচ্ছিক)</Label>
          <Input id="d-lastDonation" name="lastDonationDate" type="date" className="mt-1.5" />
        </div>

        <div>
          <Label htmlFor="d-passcode">Set a passcode (4–6 digits) / গোপন পাসকোড</Label>
          <Input
            id="d-passcode"
            name="passcode"
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4,6}"
            autoComplete="new-password"
            placeholder="••••"
            className="mt-1.5"
            required
          />
          <FieldError errors={errors} name="passcode" />
          <p className="mt-1 text-xs text-muted-foreground">
            ভবিষ্যতে নিজের তথ্য বা স্ট্যাটাস নিজে আপডেট করার জন্য এই ৪-৬ সংখ্যার কোডটি সংরক্ষণ করুন।
          </p>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-line bg-mist/40 p-3.5">
          <Checkbox
            id="d-phonePublic"
            checked={phonePublic}
            onCheckedChange={(v) => setPhonePublic(v === true)}
            className="mt-0.5"
          />
          <div>
            <Label htmlFor="d-phonePublic" className="font-semibold text-foreground cursor-pointer">
              Show my number publicly / নম্বর সরাসরি পাবলিক রাখুন
            </Label>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              ঐচ্ছিক — এটি চালু রাখলে ডোনার তালিকায় আপনার নম্বর সরাসরি দেখা যাবে এবং জরুরি প্রয়োজনে যে কেউ আপনাকে সরাসরি কল করতে পারবে।
            </p>
          </div>
          <input type="hidden" name="phonePublic" value={phonePublic ? "on" : ""} />
        </div>

        <Button
          type="submit"
          disabled={busy}
          className="w-full sm:w-auto bg-crescent hover:bg-crescent-dark text-white font-bold h-10 px-6 rounded-xl shadow-md shadow-crescent/20 transition-all active:scale-[0.98]"
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
