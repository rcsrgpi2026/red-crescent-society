"use client";

import { FormShell, FieldError, SubmitButton } from "@/components/forms/form";
import { submitContact } from "@/lib/actions";
import { Label, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Checkbox } from "@/components/ui";
import type { FormFieldConfig } from "@/types/form-editor";

export function ContactForm({ fields }: { fields?: FormFieldConfig[] }) {
  const activeFields = fields
    ? [...fields].filter((f) => f.enabled).sort((a, b) => a.order - b.order)
    : null;

  return (
    <FormShell action={submitContact}>
      {(errors) => (
        <>
          {activeFields ? (
            <div className="space-y-4">
              {activeFields.map((field) => {
                if (field.type === "textarea") {
                  return (
                    <div key={field.id}>
                      <Label htmlFor={`cf-${field.id}`} className="text-xs font-semibold">
                        {field.label} {field.required && <span className="text-crescent">*</span>}
                      </Label>
                      <Textarea
                        id={`cf-${field.id}`}
                        name={field.name}
                        rows={field.name === "message" ? 5 : 3}
                        placeholder={field.placeholder}
                        required={field.required}
                        className="mt-1.5 text-xs"
                      />
                      <FieldError errors={errors} name={field.name} />
                    </div>
                  );
                }

                if (field.type === "select") {
                  return (
                    <div key={field.id}>
                      <Label htmlFor={`cf-${field.id}`} className="text-xs font-semibold">
                        {field.label} {field.required && <span className="text-crescent">*</span>}
                      </Label>
                      <Select name={field.name} required={field.required}>
                        <SelectTrigger id={`cf-${field.id}`} className="mt-1.5 text-xs">
                          <SelectValue placeholder={field.placeholder || "Select option"} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((opt) => (
                            <SelectItem key={opt} value={opt} className="text-xs">
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={errors} name={field.name} />
                    </div>
                  );
                }

                if (field.type === "checkbox") {
                  return (
                    <div key={field.id} className="pt-1">
                      <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
                        <Checkbox name={field.name} required={field.required} />
                        <span>
                          {field.placeholder || field.label} {field.required && <span className="text-crescent">*</span>}
                        </span>
                      </label>
                      <FieldError errors={errors} name={field.name} />
                    </div>
                  );
                }

                return (
                  <div key={field.id}>
                    <Label htmlFor={`cf-${field.id}`} className="text-xs font-semibold">
                      {field.label} {field.required && <span className="text-crescent">*</span>}
                    </Label>
                    <Input
                      id={`cf-${field.id}`}
                      name={field.name}
                      type={field.type}
                      placeholder={field.placeholder}
                      required={field.required}
                      className="mt-1.5 h-9 text-xs"
                    />
                    <FieldError errors={errors} name={field.name} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
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
            </div>
          )}

          <div className="pt-2">
            <SubmitButton className="w-full sm:w-auto">Send Message</SubmitButton>
          </div>
        </>
      )}
    </FormShell>
  );
}
