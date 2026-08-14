"use client";

import { FormShell, FieldError, SubmitButton } from "@/components/forms/form";
import { joinVolunteer } from "@/lib/actions";
import { BLOOD_GROUPS, DEPARTMENTS, SEMESTERS } from "@/lib/constants";
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

export function JoinForm() {
  return (
    <FormShell action={joinVolunteer}>
      {(errors) => (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" placeholder="e.g. Rakib Hasan" className="mt-1.5" />
              <FieldError errors={errors} name="name" />
            </div>
            <div>
              <Label htmlFor="studentId">Student ID</Label>
              <Input id="studentId" name="studentId" placeholder="e.g. CST-23001" className="mt-1.5" />
              <FieldError errors={errors} name="studentId" />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="department">Department</Label>
              <Select name="department">
                <SelectTrigger id="department" className="mt-1.5">
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
            <div>
              <Label htmlFor="semester">Semester</Label>
              <Select name="semester">
                <SelectTrigger id="semester" className="mt-1.5">
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
              <Label htmlFor="phone">Mobile number</Label>
              <Input id="phone" name="phone" type="tel" placeholder="017XXXXXXXX" className="mt-1.5" />
              <FieldError errors={errors} name="phone" />
            </div>
            <div>
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" className="mt-1.5" />
              <FieldError errors={errors} name="email" />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="bloodGroup">Blood group</Label>
              <Select name="bloodGroup">
                <SelectTrigger id="bloodGroup" className="mt-1.5">
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
              <Label htmlFor="area">Area / address</Label>
              <Input id="area" name="area" placeholder="e.g. Kazla, Rajshahi" className="mt-1.5" />
              <FieldError errors={errors} name="area" />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="emergencyContactName">Emergency contact name</Label>
              <Input id="emergencyContactName" name="emergencyContactName" placeholder="e.g. Father / Guardian" className="mt-1.5" />
              <FieldError errors={errors} name="emergencyContactName" />
            </div>
            <div>
              <Label htmlFor="emergencyContactPhone">Emergency contact number</Label>
              <Input id="emergencyContactPhone" name="emergencyContactPhone" type="tel" placeholder="017XXXXXXXX" className="mt-1.5" />
              <FieldError errors={errors} name="emergencyContactPhone" />
            </div>
          </div>

          <div>
            <Label htmlFor="skills">Skills (comma separated)</Label>
            <Input id="skills" name="skills" placeholder="e.g. First Aid, Photography, Public Speaking" className="mt-1.5" />
            <p className="mt-1 text-xs text-muted-foreground">Optional — things you can contribute.</p>
          </div>

          <div>
            <Label htmlFor="experience">Previous volunteering experience</Label>
            <Textarea id="experience" name="experience" rows={3} placeholder="Have you volunteered before? Where and what did you do?" className="mt-1.5" />
          </div>

          <div>
            <Label htmlFor="motivation">Why do you want to join?</Label>
            <Textarea
              id="motivation"
              name="motivation"
              rows={4}
              required
              placeholder="Tell us what drives you to serve…"
              className="mt-1.5"
            />
            <FieldError errors={errors} name="motivation" />
          </div>

          <SubmitButton className="w-full sm:w-auto">Submit Application</SubmitButton>
          <p className="text-xs text-muted-foreground">
            Your contact details are kept private and are only visible to the society
            leadership. Your public profile never shows your phone number or address.
          </p>
        </>
      )}
    </FormShell>
  );
}
