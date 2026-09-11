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
  Textarea,
  Checkbox,
} from "@/components/ui";
import type { FormFieldConfig } from "@/types/form-editor";

interface EventRegistrationFormProps {
  eventId: string;
  fields?: FormFieldConfig[];
}

export function EventRegistrationForm({ eventId, fields }: EventRegistrationFormProps) {
  // If no dynamic fields passed, fallback to standard defaults
  const activeFields = fields
    ? [...fields].filter((f) => f.enabled).sort((a, b) => a.order - b.order)
    : null;

  return (
    <FormShell action={registerForEvent}>
      {(errors) => (
        <>
          <input type="hidden" name="eventId" value={eventId} />

          {activeFields ? (
            <div className="space-y-3.5">
              {activeFields.map((field) => {
                const isRollOrEmail = field.id === "roll" || field.id === "email";

                if (field.type === "textarea") {
                  return (
                    <div key={field.id}>
                      <Label htmlFor={`er-${field.id}`} className="text-xs font-semibold">
                        {field.label} {field.required && <span className="text-crescent">*</span>}
                      </Label>
                      <Textarea
                        id={`er-${field.id}`}
                        name={field.name}
                        placeholder={field.placeholder}
                        rows={3}
                        required={field.required}
                        className="mt-1.5 text-xs"
                      />
                      <FieldError errors={errors} name={field.name} />
                    </div>
                  );
                }

                if (field.type === "select") {
                  const options = field.options && field.options.length > 0 ? field.options : DEPARTMENTS;
                  return (
                    <div key={field.id}>
                      <Label htmlFor={`er-${field.id}`} className="text-xs font-semibold">
                        {field.label} {field.required && <span className="text-crescent">*</span>}
                      </Label>
                      <Select name={field.name} required={field.required}>
                        <SelectTrigger id={`er-${field.id}`} className="mt-1.5 text-xs">
                          <SelectValue placeholder={field.placeholder || "Select option"} />
                        </SelectTrigger>
                        <SelectContent>
                          {options.map((opt) => (
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
                    <Label htmlFor={`er-${field.id}`} className="text-xs font-semibold">
                      {field.label} {field.required && <span className="text-crescent">*</span>}
                    </Label>
                    <Input
                      id={`er-${field.id}`}
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
            // Default static layout fallback
            <div className="space-y-3.5">
              <div>
                <Label htmlFor="er-name" className="text-xs font-semibold">Full name *</Label>
                <Input id="er-name" name="name" placeholder="Your name" className="mt-1.5 h-9 text-xs" required />
                <FieldError errors={errors} name="name" />
              </div>
              <div>
                <Label htmlFor="er-phone" className="text-xs font-semibold">Mobile number *</Label>
                <Input id="er-phone" name="phone" type="tel" placeholder="017XXXXXXXX" className="mt-1.5 h-9 text-xs" required />
                <FieldError errors={errors} name="phone" />
              </div>
              <div>
                <Label htmlFor="er-department" className="text-xs font-semibold">Department (optional)</Label>
                <Select name="department">
                  <SelectTrigger id="er-department" className="mt-1.5 text-xs">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d} className="text-xs">
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="er-roll" className="text-xs font-semibold">Roll / Student ID (optional)</Label>
                  <Input id="er-roll" name="roll" placeholder="e.g. 201942" className="mt-1.5 h-9 text-xs" />
                  <FieldError errors={errors} name="roll" />
                </div>
                <div>
                  <Label htmlFor="er-email" className="text-xs font-semibold">Email (optional)</Label>
                  <Input id="er-email" name="email" type="email" placeholder="you@example.com" className="mt-1.5 h-9 text-xs" />
                  <FieldError errors={errors} name="email" />
                </div>
              </div>
              <div>
                <Label htmlFor="er-note" className="text-xs font-semibold">Notes / TrxID / Comments (optional)</Label>
                <Input id="er-note" name="note" placeholder="অতিরিক্ত তথ্য, ট্রানজেকশন নম্বর বা মন্তব্য" className="mt-1.5 h-9 text-xs" />
                <FieldError errors={errors} name="note" />
              </div>
            </div>
          )}

          <div className="pt-2">
            <SubmitButton className="w-full">Register for this Event</SubmitButton>
          </div>
        </>
      )}
    </FormShell>
  );
}
