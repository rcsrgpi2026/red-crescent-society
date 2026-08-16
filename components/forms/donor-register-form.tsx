"use client";

import { useState } from "react";
import { FormShell, FieldError, SubmitButton } from "@/components/forms/form";
import { registerDonor } from "@/lib/actions";
import { BLOOD_GROUPS } from "@/lib/constants";
import { Checkbox } from "@/components/ui/checkbox";
import { Label, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";

export function DonorRegisterForm() {
  const [phonePublic, setPhonePublic] = useState(false);

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
              blood group and area. You can mark yourself unavailable or remove your listing
              anytime using this name and number.
            </p>
          </div>
          <div>
            <Label htmlFor="d-lastDonation">Last donation date (optional)</Label>
            <Input id="d-lastDonation" name="lastDonationDate" type="date" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="d-passcode">Set a passcode (4–6 digits)</Label>
            <Input
              id="d-passcode"
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
              Your secret code to manage this listing later. Keep it safe — you&apos;ll need it,
              together with your name and number, to mark yourself unavailable or remove your listing.
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
              <Label htmlFor="d-phonePublic" className="font-semibold text-foreground">
                Show my number publicly
              </Label>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Optional — your number will be visible to anyone browsing the donor list, so they
                can call you directly without a contact request. You can hide it anytime from
                “Manage your listing”.
              </p>
            </div>
            <input type="hidden" name="phonePublic" value={phonePublic ? "on" : ""} />
          </div>
          <SubmitButton className="w-full sm:w-auto">Register as Donor</SubmitButton>
        </>
      )}
    </FormShell>
  );
}
