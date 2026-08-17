"use client";

import { useState } from "react";
import { FormShell, FieldError, SubmitButton } from "@/components/forms/form";
import { studentSignUp } from "@/lib/auth-actions";
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

export function StudentRegisterForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    session: "",
    roll: "",
    phone: "",
    department: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
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
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
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
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
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
                value={formData.session}
                onChange={(e) => handleChange("session", e.target.value)}
                placeholder="e.g. 2024-25"
                className="mt-1.5"
                required
              />
              <FieldError errors={errors} name="session" />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="st-roll">Roll number</Label>
              <Input
                id="st-roll"
                name="roll"
                value={formData.roll}
                onChange={(e) => handleChange("roll", e.target.value)}
                placeholder="e.g. 73014"
                className="mt-1.5"
                required
              />
              <FieldError errors={errors} name="roll" />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="st-phone">Mobile number</Label>
              <Input
                id="st-phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="017XXXXXXXX"
                className="mt-1.5"
                required
              />
              <FieldError errors={errors} name="phone" />
            </div>
            <div>
              <Label htmlFor="st-department">Department</Label>
              <Select
                name="department"
                value={formData.department}
                onValueChange={(val) => handleChange("department", val)}
              >
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
