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
        <>
          <input type="hidden" name="donorId" value={donorId} />
          <p className="rounded-lg bg-mist p-3 text-xs text-muted-foreground">
            Requesting contact with <span className="font-semibold text-foreground">{donorName}</span>.
            Tell the society team who the blood is for — they&apos;ll review it and approve sharing the
            donor&apos;s number on your tracking page.
          </p>

          <div>
            <Label htmlFor="dc-patient">Patient name</Label>
            <Input id="dc-patient" name="patientName" placeholder="Name of the patient" className="mt-1.5" />
            <FieldError errors={errors} name="patientName" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="dc-blood">Blood group needed</Label>
              <Select name="bloodGroupNeeded">
                <SelectTrigger id="dc-blood" className="mt-1.5">
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
              <FieldError errors={errors} name="bloodGroupNeeded" />
            </div>
            <div>
              <Label htmlFor="dc-hospital">Hospital / location (optional)</Label>
              <Input id="dc-hospital" name="hospital" placeholder="e.g. RMCH, Rajshahi" className="mt-1.5" />
              <FieldError errors={errors} name="hospital" />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="dc-name">Your name</Label>
              <Input id="dc-name" name="requesterName" placeholder="Your name" className="mt-1.5" />
              <FieldError errors={errors} name="requesterName" />
            </div>
            <div>
              <Label htmlFor="dc-contact">Your contact number</Label>
              <Input id="dc-contact" name="requesterContact" type="tel" placeholder="017XXXXXXXX" className="mt-1.5" />
              <FieldError errors={errors} name="requesterContact" />
            </div>
          </div>
          <div>
            <Label htmlFor="dc-email">Your email (optional)</Label>
            <Input id="dc-email" name="email" type="email" placeholder="you@example.com" className="mt-1.5" />
            <FieldError errors={errors} name="email" />
          </div>
          <div>
            <Label htmlFor="dc-message">Message (optional)</Label>
            <Textarea id="dc-message" name="message" rows={3} placeholder="e.g. Need it urgently, patient admitted at RMCH" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="dc-passcode">Set a passcode (4–6 digits)</Label>
            <Input
              id="dc-passcode"
              name="passcode"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4,6}"
              autoComplete="new-password"
              placeholder="••••"
              className="mt-1.5"
            />
            <FieldError errors={errors} name="passcode" />
            <p className="mt-1 text-xs text-muted-foreground">
              Your secret code to view this request on the tracking page. Keep it safe — you&apos;ll
              need it together with your contact number.
            </p>
          </div>
          <SubmitButton className="w-full">Request Contact</SubmitButton>
        </>
      )}
    </FormShell>
  );
}
