"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Hash,
  Building2,
  Calendar,
  Mail,
  Phone,
  Droplets,
  HeartHandshake,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Sparkles,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BLOOD_GROUPS, SEMESTERS } from "@/lib/constants";
import { submitVolunteerApplication } from "@/lib/recruitment-actions";
import type { RecruitmentCampaign, Student } from "@/types/database";

interface VolunteerApplicationFormProps {
  campaign: RecruitmentCampaign;
  student: Student;
}


export function VolunteerApplicationForm({
  campaign,
  student,
}: VolunteerApplicationFormProps) {
  const [formData, setFormData] = useState({
    phone: student.phone || "",
    bloodGroup: student.blood_group || "",
    semester: student.semester || "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    previousVolunteerExperience: "",
    motivation: "",
    skills: "",
    agreement: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setMessage(null);

    const fd = new FormData();
    fd.append("campaignId", campaign.id);
    fd.append("phone", formData.phone);
    fd.append("bloodGroup", formData.bloodGroup);
    fd.append("semester", formData.semester || student.semester || "");
    fd.append("emergencyContactName", formData.emergencyContactName);
    fd.append("emergencyContactPhone", formData.emergencyContactPhone);
    fd.append("previousVolunteerExperience", formData.previousVolunteerExperience);
    fd.append("motivation", formData.motivation);
    fd.append("skills", formData.skills);
    fd.append("agreement", formData.agreement ? "true" : "false");

    try {
      const result = await submitVolunteerApplication({ success: false }, fd);
      if (result.success) {
        setSubmittedSuccess(true);
        setMessage({
          type: "success",
          text: result.message || "Application submitted successfully!",
        });
      } else {
        if (result.errors) setErrors(result.errors);
        setMessage({
          type: "error",
          text: result.message || "Please correct the highlighted errors.",
        });
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedSuccess) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-lg sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h2 className="mt-5 text-2xl font-bold text-foreground">
          Application Submitted Successfully!
        </h2>
        <p className="mx-auto mt-2.5 max-w-lg text-sm leading-relaxed text-muted-foreground">
          Thank you, <strong>{student.name}</strong>! Your volunteer application for <strong>{campaign.title}</strong> has been received and is currently under review by the society leadership.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-bold text-amber-800">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          Status: 🟡 Under Review
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg" className="bg-brand hover:bg-brand-dark">
            <Link href="/student">Go to Student Portal</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">Back to Homepage</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Feedback banner */}
      {message && (
        <div
          role="alert"
          className={`flex items-start gap-3 rounded-2xl p-4 text-sm font-medium ${
            message.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-crescent/30 bg-crescent-soft text-crescent"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          <p>{message.text}</p>
        </div>
      )}

      {/* 1. Verified Student Record (Read-only) */}
      <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand" />
            <div>
              <h2 className="text-base font-bold text-foreground sm:text-lg">
                1. Verified Student Profile
              </h2>
              <p className="text-xs text-muted-foreground">
                Loaded automatically from your authenticated RGPI student account.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-dark">
            Verified Account
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-line bg-mist/30 p-3.5">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <User className="h-3.5 w-3.5 text-brand" />
              Full Name
            </span>
            <p className="mt-1 text-sm font-semibold text-foreground">{student.name}</p>
          </div>

          <div className="rounded-2xl border border-line bg-mist/30 p-3.5">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Hash className="h-3.5 w-3.5 text-brand" />
              Student Roll
            </span>
            <p className="mt-1 text-sm font-semibold text-foreground">{student.roll}</p>
          </div>

          <div className="rounded-2xl border border-line bg-mist/30 p-3.5">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 text-brand" />
              Department
            </span>
            <p className="mt-1 text-sm font-semibold text-foreground">{student.department}</p>
          </div>

          <div className="rounded-2xl border border-line bg-mist/30 p-3.5">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Layers className="h-3.5 w-3.5 text-brand" />
              Current Semester
            </span>
            {student.semester ? (
              <p className="mt-1 text-sm font-semibold text-foreground">
                {student.semester} Semester
              </p>
            ) : (
              <div className="mt-1">
                <Select
                  value={formData.semester}
                  onValueChange={(val) => handleChange("semester", val)}
                >
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEMESTERS.map((sem) => (
                      <SelectItem key={sem} value={sem}>
                        {sem} Semester
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>


          <div className="rounded-2xl border border-line bg-mist/30 p-3.5">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-brand" />
              Session
            </span>
            <p className="mt-1 text-sm font-semibold text-foreground">{student.session}</p>
          </div>

          <div className="rounded-2xl border border-line bg-mist/30 p-3.5">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Mail className="h-3.5 w-3.5 text-brand" />
              Email Address
            </span>
            <p className="mt-1 text-sm font-semibold text-foreground truncate">{student.email}</p>
          </div>
        </div>
      </div>

      {/* 2. Contact & Emergency Details */}
      <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8 space-y-6">
        <div className="border-b border-line pb-4">
          <h2 className="text-base font-bold text-foreground sm:text-lg">
            2. Contact & Emergency Information
          </h2>
          <p className="text-xs text-muted-foreground">
            Provide active contact numbers for communication and emergency response.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="va-phone">Your Mobile Number *</Label>
            <Input
              id="va-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="017XXXXXXXX"
              className="mt-1.5"
              required
            />
            {errors.phone && (
              <p className="mt-1 text-xs font-medium text-crescent">{errors.phone[0]}</p>
            )}
          </div>

          <div>
            <Label htmlFor="va-blood">Blood Group</Label>
            <Select
              value={formData.bloodGroup}
              onValueChange={(val) => handleChange("bloodGroup", val)}
            >
              <SelectTrigger id="va-blood" className="mt-1.5">
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
            {errors.bloodGroup && (
              <p className="mt-1 text-xs font-medium text-crescent">{errors.bloodGroup[0]}</p>
            )}
          </div>
        </div>



        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="va-em-name">Emergency Contact Name</Label>
            <Input
              id="va-em-name"
              value={formData.emergencyContactName}
              onChange={(e) => handleChange("emergencyContactName", e.target.value)}
              placeholder="e.g. Father / Mother / Guardian"
              className="mt-1.5"
              required
            />
            {errors.emergencyContactName && (
              <p className="mt-1 text-xs font-medium text-crescent">
                {errors.emergencyContactName[0]}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="va-em-phone">Emergency Contact Mobile Number</Label>
            <Input
              id="va-em-phone"
              type="tel"
              value={formData.emergencyContactPhone}
              onChange={(e) => handleChange("emergencyContactPhone", e.target.value)}
              placeholder="017XXXXXXXX"
              className="mt-1.5"
              required
            />
            {errors.emergencyContactPhone && (
              <p className="mt-1 text-xs font-medium text-crescent">
                {errors.emergencyContactPhone[0]}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Motivation, Experience & Skills */}
      <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8 space-y-6">
        <div className="border-b border-line pb-4">
          <h2 className="text-base font-bold text-foreground sm:text-lg">
            3. Volunteer Background & Motivation
          </h2>
          <p className="text-xs text-muted-foreground">
            Share why you want to serve and any relevant skills or experiences.
          </p>
        </div>

        <div>
          <Label htmlFor="va-motivation">
            Why do you want to join RGPI Red Crescent Youth? <span className="text-crescent">*</span>
          </Label>
          <Textarea
            id="va-motivation"
            rows={4}
            value={formData.motivation}
            onChange={(e) => handleChange("motivation", e.target.value)}
            placeholder="Tell us what inspires you to serve humanity and why you want to become part of the society…"
            className="mt-1.5"
            required
          />
          {errors.motivation && (
            <p className="mt-1 text-xs font-medium text-crescent">{errors.motivation[0]}</p>
          )}
        </div>

        <div>
          <Label htmlFor="va-experience">
            Previous Volunteering Experience (Optional)
          </Label>
          <Textarea
            id="va-experience"
            rows={3}
            value={formData.previousVolunteerExperience}
            onChange={(e) => handleChange("previousVolunteerExperience", e.target.value)}
            placeholder="Have you volunteered or participated in social/humanitarian activities before? Describe briefly…"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="va-skills">
            Skills / Areas of Interest (Comma separated)
          </Label>
          <Input
            id="va-skills"
            value={formData.skills}
            onChange={(e) => handleChange("skills", e.target.value)}
            placeholder="e.g. First Aid, Photography, Graphic Design, Event Coordination, Public Speaking"
            className="mt-1.5"
          />
        </div>
      </div>

      {/* 4. Confirmation & Agreement */}
      <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8 space-y-5">
        <div className="flex items-start gap-3">
          <input
            id="va-agreement"
            type="checkbox"
            checked={formData.agreement}
            onChange={(e) => handleChange("agreement", e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-line text-brand focus:ring-brand"
            required
          />
          <Label htmlFor="va-agreement" className="text-xs sm:text-sm leading-relaxed cursor-pointer font-normal text-foreground">
            I confirm that the information provided is correct and true to the best of my knowledge. I understand that submitting this application does not guarantee membership and that my application will be reviewed by the society leadership.
          </Label>
        </div>
        {errors.agreement && (
          <p className="text-xs font-medium text-crescent">{errors.agreement[0]}</p>
        )}

        <div className="pt-3 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Upon approval, your student role will be upgraded to Volunteer with an official Member ID.
          </p>
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="w-full sm:w-auto gap-2 bg-brand hover:bg-brand-dark text-white font-semibold"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {submitting ? "Submitting Application…" : "Submit Volunteer Application"}
          </Button>
        </div>
      </div>
    </form>
  );
}
