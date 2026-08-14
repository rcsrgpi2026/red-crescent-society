"use client";

import { FormShell, FieldError, SubmitButton } from "@/components/forms/form";
import { requestDonorContact } from "@/lib/actions";
import { Label, Input, Textarea } from "@/components/ui";

export function DonorContactForm({ donorId, donorName }: { donorId: string; donorName: string }) {
  return (
    <FormShell action={requestDonorContact}>
      {(errors) => (
        <>
          <input type="hidden" name="donorId" value={donorId} />
          <p className="rounded-lg bg-mist p-3 text-xs text-muted-foreground">
            Requesting contact with <span className="font-semibold text-foreground">{donorName}</span>.
            Your details go to the society team, who will connect you. The donor&apos;s number is
            never shown publicly.
          </p>
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
          <div>
            <Label htmlFor="dc-message">Message (optional)</Label>
            <Textarea id="dc-message" name="message" rows={3} placeholder="e.g. Need O+ blood at RMCH, urgent" className="mt-1.5" />
          </div>
          <SubmitButton className="w-full">Request Contact</SubmitButton>
        </>
      )}
    </FormShell>
  );
}
