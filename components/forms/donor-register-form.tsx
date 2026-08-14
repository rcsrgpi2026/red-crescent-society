"use client";

import { FormShell, FieldError, SubmitButton } from "@/components/forms/form";
import { registerDonor } from "@/lib/actions";
import { BLOOD_GROUPS } from "@/lib/constants";
import { Label, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";

export function DonorRegisterForm() {
  return (
    <FormShell action={registerDonor}>
      {(errors) => (
        <>
          <div>
            <Label htmlFor="d-name">Full name</Label>
            <Input id="d-name" name="name" placeholder="Your name" className="mt-1.5" />
            <FieldError errors={errors} name="name" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="d-bloodGroup">Blood group</Label>
              <Select name="bloodGroup">
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
              <Label htmlFor="d-area">Area</Label>
              <Input id="d-area" name="area" placeholder="e.g. Kazla, Rajshahi" className="mt-1.5" />
              <FieldError errors={errors} name="area" />
            </div>
          </div>
          <div>
            <Label htmlFor="d-phone">Mobile number</Label>
            <Input id="d-phone" name="phone" type="tel" placeholder="017XXXXXXXX" className="mt-1.5" />
            <FieldError errors={errors} name="phone" />
            <p className="mt-1 text-xs text-muted-foreground">
              Kept private — only the society team can see it. The public only sees your name,
              blood group and area.
            </p>
          </div>
          <div>
            <Label htmlFor="d-lastDonation">Last donation date (optional)</Label>
            <Input id="d-lastDonation" name="lastDonationDate" type="date" className="mt-1.5" />
          </div>
          <SubmitButton className="w-full sm:w-auto">Register as Donor</SubmitButton>
        </>
      )}
    </FormShell>
  );
}
