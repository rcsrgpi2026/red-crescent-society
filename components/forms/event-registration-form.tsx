"use client";

import { FormShell, FieldError, SubmitButton } from "@/components/forms/form";
import { registerForEvent } from "@/lib/actions";
import { DEPARTMENTS } from "@/lib/constants";
import {
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

export function EventRegistrationForm({ eventId }: { eventId: string }) {
  return (
    <FormShell action={registerForEvent}>
      {(errors) => (
        <>
          <input type="hidden" name="eventId" value={eventId} />
          <div>
            <Label htmlFor="er-name">Full name</Label>
            <Input id="er-name" name="name" placeholder="Your name" className="mt-1.5" />
            <FieldError errors={errors} name="name" />
          </div>
          <div>
            <Label htmlFor="er-phone">Mobile number</Label>
            <Input id="er-phone" name="phone" type="tel" placeholder="017XXXXXXXX" className="mt-1.5" />
            <FieldError errors={errors} name="phone" />
          </div>
          <div>
            <Label htmlFor="er-department">Department (optional)</Label>
            <Select name="department">
              <SelectTrigger id="er-department" className="mt-1.5">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <SubmitButton className="w-full sm:w-auto">Register for this Event</SubmitButton>
        </>
      )}
    </FormShell>
  );
}
