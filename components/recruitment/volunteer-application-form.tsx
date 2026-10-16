"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
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
  Camera,
  FileCheck,
  FileText,
  UploadCloud,
  Trash2,
  Eye,
  ExternalLink,
  FileUp,
  FolderOpen,
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
import { AddToContactsCard } from "@/components/shared/add-to-contacts-card";
import { MandatoryContactStep } from "@/components/forms/mandatory-contact-step";
import { getCurrentPushSubscriptionData } from "@/lib/notifications/client";
import { uploadImageToStorage } from "@/lib/upload";
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
    photoUrl: student.photo_url || "",
    nidOrBirthCertUrl: "",
    fatherNidUrl: "",
    motherNidUrl: "",
    collegeRegCardUrl: "",
    agreement: false,
  });

  const [uploadingDocs, setUploadingDocs] = useState<Record<string, boolean>>({});
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

  const handleDocumentUpload = async (
    field: "photoUrl" | "nidOrBirthCertUrl" | "fatherNidUrl" | "motherNidUrl" | "collegeRegCardUrl",
    file: File
  ) => {
    if (!file) return;
    setUploadingDocs((prev) => ({ ...prev, [field]: true }));
    try {
      const url = await uploadImageToStorage(file, "recruitment_docs", {
        maxDimension: field === "photoUrl" ? 1000 : 2000,
      });
      setFormData((prev) => ({ ...prev, [field]: url }));
      // Clear error for this field if any
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      toast.success("Document uploaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload document");
    } finally {
      setUploadingDocs((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleDocumentRemove = (
    field: "photoUrl" | "nidOrBirthCertUrl" | "fatherNidUrl" | "motherNidUrl" | "collegeRegCardUrl"
  ) => {
    setFormData((prev) => ({ ...prev, [field]: "" }));
    toast.info("Document removed.");
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setMessage(null);

    // Validate mandatory verification documents
    const validationErrors: Record<string, string[]> = {};
    if (!formData.photoUrl) {
      validationErrors.photoUrl = ["Passport size photo is required for your official membership card."];
    }
    if (!formData.nidOrBirthCertUrl) {
      validationErrors.nidOrBirthCertUrl = ["Applicant's NID or Birth Certificate is required."];
    }
    if (!formData.collegeRegCardUrl) {
      validationErrors.collegeRegCardUrl = ["College registration card or student ID is required."];
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setMessage({
        type: "error",
        text: "Please upload the required verification documents (Passport Photo, NID/Birth Certificate, and College Registration Card).",
      });
      setSubmitting(false);
      return;
    }

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
    fd.append("photoUrl", formData.photoUrl);
    fd.append("nidOrBirthCertUrl", formData.nidOrBirthCertUrl);
    fd.append("fatherNidUrl", formData.fatherNidUrl);
    fd.append("motherNidUrl", formData.motherNidUrl);
    fd.append("collegeRegCardUrl", formData.collegeRegCardUrl);
    fd.append("agreement", formData.agreement ? "true" : "false");

    try {
      const pushData = await getCurrentPushSubscriptionData();
      if (pushData) {
        fd.append("pushEndpoint", pushData.endpoint);
        fd.append("pushP256dh", pushData.p256dh);
        fd.append("pushAuth", pushData.auth);
        fd.append("pushPlatform", pushData.platform);
        fd.append("pushBrowser", pushData.browser);
      }
    } catch {
      // non-blocking
    }

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

        {/* 1-Click Add to Contacts reminder to ensure future notification emails reach inbox */}
        <AddToContactsCard className="mt-7" />

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

      {/* 3. Identity Verification Documents */}
      <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8 space-y-6">
        <div className="border-b border-line pb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-brand" />
              <h2 className="text-base font-bold text-foreground sm:text-lg">
                3. Identity Verification Documents
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              প্রয়োজনীয় প্রমাণীকরণ কাগজপত্র ও পাসপোর্ট ছবি আপলোড করুন (Upload clear scans or photos in PNG, JPG, WebP, or PDF up to 10MB).
            </p>
          </div>
          <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-dark">
            Physical Form Equivalent
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* 1. Passport Size Photo */}
          <DocumentUploadCard
            id="va-doc-photo"
            title="Passport Size Photo"
            banglaTitle="পাসপোর্ট সাইজ ছবি"
            description="Clear recent portrait photo on neutral background. This photo will be officially printed on your digital volunteer ID card."
            accept="image/png,image/jpeg,image/webp"
            required
            isPhoto
            value={formData.photoUrl}
            isUploading={Boolean(uploadingDocs.photoUrl)}
            error={errors.photoUrl?.[0]}
            onUpload={(file) => handleDocumentUpload("photoUrl", file)}
            onRemove={() => handleDocumentRemove("photoUrl")}
          />

          {/* 2. Applicant's NID or Birth Certificate */}
          <DocumentUploadCard
            id="va-doc-nid"
            title="Applicant's NID or Birth Certificate"
            banglaTitle="আবেদনকারীর জাতীয় পরিচয়পত্র বা জন্ম নিবন্ধন সনদ"
            description="Clear photo or PDF copy of your Smart National ID card or verified Online Birth Certificate."
            accept="image/png,image/jpeg,image/webp,application/pdf"
            required
            value={formData.nidOrBirthCertUrl}
            isUploading={Boolean(uploadingDocs.nidOrBirthCertUrl)}
            error={errors.nidOrBirthCertUrl?.[0]}
            onUpload={(file) => handleDocumentUpload("nidOrBirthCertUrl", file)}
            onRemove={() => handleDocumentRemove("nidOrBirthCertUrl")}
          />

          {/* 3. College Registration Card / Student ID */}
          <DocumentUploadCard
            id="va-doc-college-card"
            title="College Registration Card / Student ID"
            banglaTitle="কলেজ রেজিস্ট্রেশন কার্ড বা স্টুডেন্ট আইডি"
            description="Clear photo or PDF scan of your Polytechnic Registration Card or current semester Student ID card."
            accept="image/png,image/jpeg,image/webp,application/pdf"
            required
            value={formData.collegeRegCardUrl}
            isUploading={Boolean(uploadingDocs.collegeRegCardUrl)}
            error={errors.collegeRegCardUrl?.[0]}
            onUpload={(file) => handleDocumentUpload("collegeRegCardUrl", file)}
            onRemove={() => handleDocumentRemove("collegeRegCardUrl")}
          />

          {/* 4. Father's NID */}
          <DocumentUploadCard
            id="va-doc-father-nid"
            title="Father's NID"
            banglaTitle="পিতার জাতীয় পরিচয়পত্র"
            description="Photo or PDF copy of Father's National ID card (recommended for physical verification records)."
            accept="image/png,image/jpeg,image/webp,application/pdf"
            value={formData.fatherNidUrl}
            isUploading={Boolean(uploadingDocs.fatherNidUrl)}
            error={errors.fatherNidUrl?.[0]}
            onUpload={(file) => handleDocumentUpload("fatherNidUrl", file)}
            onRemove={() => handleDocumentRemove("fatherNidUrl")}
          />

          {/* 5. Mother's NID */}
          <div className="md:col-span-2">
            <DocumentUploadCard
              id="va-doc-mother-nid"
              title="Mother's NID"
              banglaTitle="মাতার জাতীয় পরিচয়পত্র"
              description="Photo or PDF copy of Mother's National ID card (recommended for physical verification records)."
              accept="image/png,image/jpeg,image/webp,application/pdf"
              value={formData.motherNidUrl}
              isUploading={Boolean(uploadingDocs.motherNidUrl)}
              error={errors.motherNidUrl?.[0]}
              onUpload={(file) => handleDocumentUpload("motherNidUrl", file)}
              onRemove={() => handleDocumentRemove("motherNidUrl")}
            />
          </div>
        </div>
      </div>

      {/* 4. Motivation, Experience & Skills */}
      <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8 space-y-6">
        <div className="border-b border-line pb-4">
          <h2 className="text-base font-bold text-foreground sm:text-lg">
            4. Volunteer Background & Motivation
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

      {/* 5. Confirmation & Agreement */}
      <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8 space-y-5">
        <MandatoryContactStep />

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
            disabled={submitting}
            className="w-full sm:w-auto gap-2 rounded-full h-11 px-8 bg-crescent hover:bg-crescent-dark text-white font-bold shadow-md shadow-crescent/20 active:scale-[0.98] transition-all"
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

interface DocumentUploadCardProps {
  id: string;
  title: string;
  banglaTitle: string;
  description: string;
  accept: string;
  required?: boolean;
  value: string;
  isUploading: boolean;
  error?: string;
  isPhoto?: boolean;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
}

function DocumentUploadCard({
  id,
  title,
  banglaTitle,
  description,
  accept,
  required,
  value,
  isUploading,
  error,
  isPhoto,
  onUpload,
  onRemove,
}: DocumentUploadCardProps) {
  const isPdf = Boolean(
    value &&
      (value.toLowerCase().includes(".pdf") ||
        value.toLowerCase().includes("/raw/") ||
        value.toLowerCase().endsWith(".pdf"))
  );

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all ${
        value
          ? "border-emerald-200 bg-emerald-50/20"
          : error
          ? "border-crescent/40 bg-crescent-soft/30"
          : "border-line bg-mist/20 hover:border-brand/40 hover:bg-mist/40"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">
              {title}
            </h3>
            {required ? (
              <span className="rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                Required / আবশ্যক
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                Optional / ঐচ্ছিক
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-brand-dark/80 mt-0.5">
            {banglaTitle}
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3.5 leading-relaxed">
        {description}
      </p>

      {/* Content */}
      {isUploading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-brand/50 bg-brand-soft/20 py-8 px-4 text-center">
          <Loader2 className="h-7 w-7 animate-spin text-brand" />
          <p className="mt-2.5 text-xs font-semibold text-brand-dark">
            Uploading & optimizing document…
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Please wait a moment
          </p>
        </div>
      ) : value ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white p-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            {isPdf ? (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-50 border border-red-200 text-red-600 font-bold text-xs shadow-xs">
                <FileText className="h-6 w-6 text-red-500" />
              </div>
            ) : (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-line bg-mist shadow-xs">
                <Image
                  src={value}
                  alt={title}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Attached
              </div>
              <p className="text-[11px] text-muted-foreground truncate max-w-[200px] sm:max-w-[240px]">
                {isPdf ? "PDF Document Scan" : isPhoto ? "Passport Photo" : "Document Image"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-mist transition-colors shadow-2xs"
            >
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              View
            </a>

            <label
              htmlFor={id}
              className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-mist cursor-pointer transition-colors shadow-2xs"
            >
              <UploadCloud className="h-3.5 w-3.5 text-muted-foreground" />
              Change
            </label>
            <input
              id={id}
              type="file"
              accept={accept}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = "";
              }}
              className="sr-only"
            />

            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 p-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
              title="Remove document"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div>
          <label
            htmlFor={id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) onUpload(f);
            }}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-white/80 py-6 px-4 text-center cursor-pointer transition-all hover:border-brand hover:bg-brand-soft/10 active:scale-[0.99]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand-dark mb-2">
              {isPhoto ? <Camera className="h-5 w-5" /> : <FileUp className="h-5 w-5" />}
            </div>
            <p className="text-xs font-bold text-foreground">
              Click to select or drag & drop file
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isPhoto
                ? "Passport size photo · JPG, PNG, WebP · Max 10MB"
                : "Official document · JPG, PNG, WebP, PDF · Max 10MB"}
            </p>
            <input
              id={id}
              type="file"
              accept={accept}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = "";
              }}
              className="sr-only"
            />
          </label>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs font-medium text-crescent flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
