"use client";

import { useState } from "react";
import { FormShell, FieldError, SubmitButton } from "@/components/forms/form";
import { volunteerSignUp } from "@/lib/auth-actions";
import { BLOOD_GROUPS, DEPARTMENTS, SEMESTERS, SESSIONS } from "@/lib/constants";
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

export function VolunteerRegisterForm() {
  const [formData, setFormData] = useState({
    name: "",
    roll: "",
    registrationNo: "",
    session: "",
    department: "",
    semester: "",
    phone: "",
    email: "",
    password: "",
    bloodGroup: "",
    area: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    skills: "",
    experience: "",
    motivation: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <FormShell action={volunteerSignUp}>
      {(errors) => (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="vl-name">Full name</Label>
              <Input
                id="vl-name"
                name="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g. Rakib Hasan"
                className="mt-1.5"
                required
              />
              <FieldError errors={errors} name="name" />
            </div>
            <div>
              <Label htmlFor="vl-roll">Roll</Label>
              <Input
                id="vl-roll"
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
              <Label htmlFor="vl-registrationNo">College registration number</Label>
              <Input
                id="vl-registrationNo"
                name="registrationNo"
                value={formData.registrationNo}
                onChange={(e) => handleChange("registrationNo", e.target.value)}
                placeholder="e.g. 2110000123"
                className="mt-1.5"
                required
              />
              <FieldError errors={errors} name="registrationNo" />
            </div>
            <div>
              <Label htmlFor="vl-session">Session</Label>
              <Select
                name="session"
                value={formData.session}
                onValueChange={(val) => handleChange("session", val)}
              >
                <SelectTrigger id="vl-session" className="mt-1.5">
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {SESSIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={errors} name="session" />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="vl-department">Department</Label>
              <Select
                name="department"
                value={formData.department}
                onValueChange={(val) => handleChange("department", val)}
              >
                <SelectTrigger id="vl-department" className="mt-1.5">
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
              <Label htmlFor="vl-semester">Semester</Label>
              <Select
                name="semester"
                value={formData.semester}
                onValueChange={(val) => handleChange("semester", val)}
              >
                <SelectTrigger id="vl-semester" className="mt-1.5">
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
              <Label htmlFor="vl-phone">Mobile number</Label>
              <Input
                id="vl-phone"
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
              <Label htmlFor="vl-email">Email</Label>
              <Input
                id="vl-email"
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

          <div>
            <Label htmlFor="vl-password">Password</Label>
            <Input
              id="vl-password"
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

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="vl-bloodGroup">Blood group</Label>
              <Select
                name="bloodGroup"
                value={formData.bloodGroup}
                onValueChange={(val) => handleChange("bloodGroup", val)}
              >
                <SelectTrigger id="vl-bloodGroup" className="mt-1.5">
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
              <Label htmlFor="vl-area">Area / address</Label>
              <Input
                id="vl-area"
                name="area"
                value={formData.area}
                onChange={(e) => handleChange("area", e.target.value)}
                placeholder="e.g. Kazla, Rajshahi"
                className="mt-1.5"
                required
              />
              <FieldError errors={errors} name="area" />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="vl-emergencyName">Emergency contact name</Label>
              <Input
                id="vl-emergencyName"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={(e) => handleChange("emergencyContactName", e.target.value)}
                placeholder="e.g. Father / Guardian"
                className="mt-1.5"
                required
              />
              <FieldError errors={errors} name="emergencyContactName" />
            </div>
            <div>
              <Label htmlFor="vl-emergencyPhone">Emergency contact number</Label>
              <Input
                id="vl-emergencyPhone"
                name="emergencyContactPhone"
                type="tel"
                value={formData.emergencyContactPhone}
                onChange={(e) => handleChange("emergencyContactPhone", e.target.value)}
                placeholder="017XXXXXXXX"
                className="mt-1.5"
                required
              />
              <FieldError errors={errors} name="emergencyContactPhone" />
            </div>
          </div>

          <div>
            <Label htmlFor="vl-skills">Skills (comma separated)</Label>
            <Input
              id="vl-skills"
              name="skills"
              value={formData.skills}
              onChange={(e) => handleChange("skills", e.target.value)}
              placeholder="e.g. First Aid, Photography, Public Speaking"
              className="mt-1.5"
              required
            />
            <FieldError errors={errors} name="skills" />
          </div>

          <div>
            <Label htmlFor="vl-experience">Previous volunteering experience</Label>
            <Textarea
              id="vl-experience"
              name="experience"
              rows={3}
              value={formData.experience}
              onChange={(e) => handleChange("experience", e.target.value)}
              required
              placeholder="Have you volunteered before? Where and what did you do?"
              className="mt-1.5"
            />
            <FieldError errors={errors} name="experience" />
          </div>

          <div>
            <Label htmlFor="vl-motivation">Why do you want to join?</Label>
            <Textarea
              id="vl-motivation"
              name="motivation"
              rows={4}
              value={formData.motivation}
              onChange={(e) => handleChange("motivation", e.target.value)}
              required
              placeholder="Tell us what drives you to serve…"
              className="mt-1.5"
            />
            <FieldError errors={errors} name="motivation" />
          </div>

          <SubmitButton className="w-full">Submit Volunteer Application</SubmitButton>
          <p className="text-xs text-muted-foreground">
            Every field is required. Your application is reviewed by the society
            leadership before your membership is approved.
          </p>
        </>
      )}
    </FormShell>
  );
}
