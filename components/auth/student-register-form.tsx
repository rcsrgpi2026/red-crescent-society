"use client";

import { FormShell, FieldError, SubmitButton } from "@/components/forms/form";
import { studentSignUp } from "@/lib/auth-actions";
import { DEPARTMENTS, SEMESTERS } from "@/lib/constants";
import {
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

export function StudentRegisterForm() {
  return (
    <FormShell action={studentSignUp}>
      {(errors) => (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="st-name">Full name</Label>
              <Input
                id="st-name"
                name="name"
                autoComplete="name"
                placeholder="e.g. Rakib Hasan"
                className="mt-1.5"
                required
              />
              <FieldError errors={errors} name="name" />
            </div>
            <div>
              <Label htmlFor="st-email">Email</Label>
              <Input
                id="st-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="mt-1.5"
                required
              />
              <FieldError errors={errors} name="email" />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="st-password">Password</Label>
              <Input
                id="st-password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 6 characters"
                className="mt-1.5"
                required
              />
              <FieldError errors={errors} name="password" />
            </div>
            <div>
              <Label htmlFor="st-session">Session</Label>
              <Input
                id="st-session"
                name="session"
                placeholder="e.g. 2024-25"
                className="mt-1.5"
                required
              />
              <FieldError errors={errors} name="session" />
            </div>
            <div>
              <Label htmlFor="st-semester">Semester</Label>
              <Select name="semester">
                <SelectTrigger id="st-semester" className="mt-1.5">
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {SEMESTERS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={errors} name="semester" />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="st-roll">Roll number</Label>
              <Input
                id="st-roll"
                name="roll"
                placeholder="e.g. 73014"
                className="mt-1.5"
                required
              />
              <FieldError errors={errors} name="roll" />
            </div>
            <div>
              <Label htmlFor="st-phone">Mobile number</Label>
              <Input
                id="st-phone"
                name="phone"
                type="tel"
                placeholder="017XXXXXXXX"
                className="mt-1.5"
                required
              />
              <FieldError errors={errors} name="phone" />
            </div>
          </div>

          <div>
            <Label htmlFor="st-department">Department</Label>
            <Select name="department">
              <SelectTrigger id="st-department" className="mt-1.5">
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
            <FieldError errors={errors} name="department" />
          </div>

          <SubmitButton className="w-full">Create Student Account</SubmitButton>
          <p className="text-xs text-muted-foreground">
            Every field is required. Student accounts are activated immediately —
            no approval needed.
          </p>
        </>
      )}
    </FormShell>
  );
}
