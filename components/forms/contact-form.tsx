"use client";

import { FormShell, FieldError, SubmitButton } from "@/components/forms/form";
import { submitContact } from "@/lib/actions";
import { Label, Input, Textarea } from "@/components/ui";

export function ContactForm() {
  return (
    <FormShell action={submitContact}>
      {(errors) => (
        <>
          <div>
            <Label htmlFor="cf-name">Your name</Label>
            <Input id="cf-name" name="name" placeholder="Your name" className="mt-1.5" />
            <FieldError errors={errors} name="name" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="cf-email">Email (optional)</Label>
              <Input id="cf-email" name="email" type="email" placeholder="you@example.com" className="mt-1.5" />
              <FieldError errors={errors} name="email" />
            </div>
            <div>
              <Label htmlFor="cf-phone">Phone (optional)</Label>
              <Input id="cf-phone" name="phone" type="tel" placeholder="017XXXXXXXX" className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label htmlFor="cf-subject">Subject</Label>
            <Input id="cf-subject" name="subject" placeholder="What is this about?" className="mt-1.5" />
            <FieldError errors={errors} name="subject" />
          </div>
          <div>
            <Label htmlFor="cf-message">Message</Label>
            <Textarea id="cf-message" name="message" rows={5} placeholder="Write your message…" className="mt-1.5" />
            <FieldError errors={errors} name="message" />
          </div>
          <SubmitButton className="w-full sm:w-auto">Send Message</SubmitButton>
        </>
      )}
    </FormShell>
  );
}
