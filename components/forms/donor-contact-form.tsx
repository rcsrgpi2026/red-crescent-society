"use client";

import { useRouter } from "next/navigation";
import { FormShell, FieldError, SubmitButton } from "@/components/forms/form";
import { requestDonorContact, type ActionResult } from "@/lib/actions";
import { BLOOD_GROUPS } from "@/lib/constants";
import {
  Label,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

export function DonorContactForm({ donorId, donorName }: { donorId: string; donorName: string }) {
  const router = useRouter();

  async function handleAction(prev: ActionResult, fd: FormData): Promise<ActionResult> {
    const result = await requestDonorContact(prev, fd);
    if (result.success && result.data?.id) {
      router.push(`/blood-support/contact-request/${result.data.id}`);
    }
    return result;
  }

  return (
    <FormShell action={handleAction}>
      {(errors) => (
        <div className="space-y-3 pt-1 text-xs">
          <input type="hidden" name="donorId" value={donorId} />
          
          <div className="rounded-xl border border-crescent/20 bg-crescent-soft/30 p-2.5 text-[11px] leading-snug text-crescent-dark">
            <strong>{donorName}</strong> এর সাথে যোগাযোগের অনুরোধ পাঠানো হচ্ছে। রক্তদানের প্রয়োজনীয়তা উল্লেখ করে ফর্মটি পূরণ করুন।
          </div>

          <div>
            <Label htmlFor="dc-patient" className="text-xs font-semibold">রোগীর নাম (Patient name)</Label>
            <Input id="dc-patient" name="patientName" placeholder="রোগীর নাম লিখুন" className="mt-1 h-9 text-xs" />
            <FieldError errors={errors} name="patientName" />
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <div>
              <Label htmlFor="dc-blood" className="text-xs font-semibold">প্রয়োজনীয় রক্তের গ্রুপ</Label>
              <Select name="bloodGroupNeeded">
                <SelectTrigger id="dc-blood" className="mt-1 h-9 text-xs">
                  <SelectValue placeholder="গ্রুপ বেছে নিন" />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_GROUPS.map((bg) => (
                    <SelectItem key={bg} value={bg}>
                      {bg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={errors} name="bloodGroupNeeded" />
            </div>
            <div>
              <Label htmlFor="dc-hospital" className="text-xs font-semibold">হাসপাতাল / স্থান (ঐচ্ছিক)</Label>
              <Input id="dc-hospital" name="hospital" placeholder="যেমন: রামেক হাসপাতাল" className="mt-1 h-9 text-xs" />
              <FieldError errors={errors} name="hospital" />
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <div>
              <Label htmlFor="dc-name" className="text-xs font-semibold">আপনার নাম (Your name)</Label>
              <Input id="dc-name" name="requesterName" placeholder="আপনার নাম" className="mt-1 h-9 text-xs" />
              <FieldError errors={errors} name="requesterName" />
            </div>
            <div>
              <Label htmlFor="dc-contact" className="text-xs font-semibold">আপনার মোবাইল নম্বর</Label>
              <Input id="dc-contact" name="requesterContact" type="tel" placeholder="017XXXXXXXX" className="mt-1 h-9 text-xs" />
              <FieldError errors={errors} name="requesterContact" />
            </div>
          </div>

          <div>
            <Label htmlFor="dc-email" className="text-xs font-semibold">ইমেইল (ঐচ্ছিক)</Label>
            <Input id="dc-email" name="email" type="email" placeholder="you@example.com" className="mt-1 h-9 text-xs" />
            <FieldError errors={errors} name="email" />
          </div>

          <div>
            <Label htmlFor="dc-message" className="text-xs font-semibold">বার্তা বা বিস্তারিত (ঐচ্ছিক)</Label>
            <Textarea id="dc-message" name="message" rows={2} placeholder="রোগীর অবস্থা বা অতিরিক্ত তথ্য..." className="mt-1 text-xs" />
          </div>

          <div>
            <Label htmlFor="dc-passcode" className="text-xs font-semibold">একটি সিক্রেট পাসকোড সেট করুন (৪–৬ ডিজিট)</Label>
            <Input
              id="dc-passcode"
              name="passcode"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4,6}"
              autoComplete="new-password"
              placeholder="••••"
              className="mt-1 h-9 text-xs font-mono tracking-widest"
            />
            <FieldError errors={errors} name="passcode" />
            <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
              অনুরোধের স্ট্যাটাস ট্র্যাক করতে ও নম্বর দেখতে এই পাসকোডটি মনে রাখুন।
            </p>
          </div>

          <div className="pt-1">
            <SubmitButton className="w-full rounded-xl bg-crescent py-2.5 text-xs font-bold text-white shadow-sm hover:bg-crescent-dark">
              যোগাযোগের অনুরোধ পাঠান
            </SubmitButton>
          </div>
        </div>
      )}
    </FormShell>
  );
}
