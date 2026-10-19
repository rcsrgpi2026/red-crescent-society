"use client";

import { useState, useEffect } from "react";
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
  FileUp,
  ClipboardList,
  CalendarDays,
  CalendarCheck,
  BellRing,
  ArrowRight,
  ExternalLink,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  BLOOD_GROUPS,
  SEMESTERS,
  SEMESTER_LABELS,
  DEPARTMENTS,
  normalizeSemester,
} from "@/lib/constants";
import { submitVolunteerApplication } from "@/lib/recruitment-actions";
import { AddToContactsCard } from "@/components/shared/add-to-contacts-card";
import { MandatoryContactStep } from "@/components/forms/mandatory-contact-step";
import {
  getCurrentPushSubscriptionData,
  subscribeUserToPush,
} from "@/lib/notifications/client";
import { uploadImageToStorage } from "@/lib/upload";
import type { RecruitmentCampaign, Student, VolunteerApplication } from "@/types/database";
import { DEFAULT_FORM_CONFIGS, type FormConfig, type FormFieldConfig } from "@/types/form-editor";

/**
 * Normalizes any date string (ISO YYYY-MM-DD or DD/MM/YYYY or DD-MM-YYYY)
 * to HTML5 date input format (YYYY-MM-DD).
 */
function toDateInputValue(val: string | null | undefined): string {
  if (!val) return "";
  const trimmed = String(val).trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.includes("T")) {
    const part = trimmed.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(part)) return part;
  }
  const parts = trimmed.split(/[\/\-\.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY/MM/DD
      const [y, m, d] = parts;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    if (parts[2].length === 4) {
      // DD/MM/YYYY
      const [d, m, y] = parts;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }
  return "";
}

/**
 * Returns formatted Bengali date preview and calculated age for immediate user confirmation.
 */
function formatBengaliDatePreview(isoDate: string): { formatted: string; ageText?: string } | null {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const [y, m, d] = isoDate.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  if (isNaN(dateObj.getTime())) return null;

  const monthsBn = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
  ];
  const digitsToBn = (num: number | string) =>
    String(num).replace(/\d/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);

  const formatted = `${digitsToBn(d)} ${monthsBn[m - 1]} ${digitsToBn(y)}`;

  const today = new Date();
  let age = today.getFullYear() - y;
  const monthDiff = today.getMonth() - (m - 1);
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) {
    age--;
  }

  const ageText = age >= 0 && age < 120 ? `বয়স: ${digitsToBn(age)} বছর` : undefined;

  return { formatted, ageText };
}

interface VolunteerApplicationFormProps {
  campaign: RecruitmentCampaign;
  student: Student;
  previousApplication?: VolunteerApplication | null;
  formConfig?: FormConfig;
}

export function VolunteerApplicationForm({
  campaign,
  student,
  previousApplication,
  formConfig,
}: VolunteerApplicationFormProps) {
  const activeConfig = formConfig || DEFAULT_FORM_CONFIGS.volunteer_application;
  const activeFields: FormFieldConfig[] = (activeConfig?.fields || [])
    .filter((f) => f.enabled)
    .sort((a, b) => a.order - b.order);

  const activeGeneralFields = activeFields.filter((f) => f.type !== "file");
  const activeFileFields = activeFields.filter((f) => f.type === "file");

  const prevFormData = (previousApplication as any)?.form_data || {};

  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const rawSemester =
      previousApplication?.semester ||
      prevFormData.semester ||
      student.semester ||
      "";
    const sem = normalizeSemester(rawSemester) || rawSemester;

    const rollVal =
      previousApplication?.roll ||
      prevFormData.studentId ||
      prevFormData.roll ||
      student.roll ||
      "";

    const sessionVal =
      previousApplication?.session ||
      prevFormData.session ||
      student.session ||
      "";

    const deptVal =
      previousApplication?.department ||
      prevFormData.department ||
      student.department ||
      "";

    const nameVal =
      previousApplication?.name ||
      prevFormData.name ||
      student.name ||
      "";

    const phoneVal =
      previousApplication?.phone ||
      prevFormData.phone ||
      student.phone ||
      "";

    const emailVal =
      previousApplication?.email ||
      prevFormData.email ||
      student.email ||
      "";

    const bloodVal =
      previousApplication?.blood_group ||
      prevFormData.bloodGroup ||
      student.blood_group ||
      "";

    return {
      nameBn: previousApplication?.name_bn || prevFormData.nameBn || "",
      name: nameVal,
      fatherName: previousApplication?.father_name || prevFormData.fatherName || "",
      motherName: previousApplication?.mother_name || prevFormData.motherName || "",
      dob: previousApplication?.dob || prevFormData.dob || "",
      bloodGroup: bloodVal,
      nationality: previousApplication?.nationality || prevFormData.nationality || "বাংলাদেশী",
      registrationNo: previousApplication?.registration_no || (student as any).registration_no || "",
      department: deptVal,
      semester: sem,
      studentId: rollVal,
      roll: rollVal,
      session: sessionVal,
      shift: previousApplication?.shift || prevFormData.shift || "১ম শিফট (1st Shift)",
      group: previousApplication?.group_name || prevFormData.group || "",
      maritalStatus: previousApplication?.marital_status || prevFormData.maritalStatus || "অবিবাহিত (Single)",
      permanentAddress: previousApplication?.permanent_address || prevFormData.permanentAddress || student.address || "",
      presentAddress: previousApplication?.present_address || prevFormData.presentAddress || student.address || "",
      latestGpa: previousApplication?.latest_gpa || prevFormData.latestGpa || "",
      phone: phoneVal,
      email: emailVal,
      skills: Array.isArray(previousApplication?.skills)
        ? previousApplication.skills.join(", ")
        : typeof previousApplication?.skills === "string"
        ? (previousApplication.skills as string)
        : "",
      previousExperience:
        previousApplication?.previous_volunteer_experience || prevFormData.previousExperience || "না (No)",
      emergencyContactName: previousApplication?.emergency_contact_name || prevFormData.emergencyContactName || "",
      emergencyContactPhone: previousApplication?.emergency_contact_phone || prevFormData.emergencyContactPhone || "",
      motivation: previousApplication?.motivation || prevFormData.motivation || "",
      photoUrl: previousApplication?.photo_url || prevFormData.photoUrl || student.photo_url || "",
      nidOrBirthCertUrl: previousApplication?.nid_or_birth_cert_url || prevFormData.nidOrBirthCertUrl || "",
      fatherNidUrl: previousApplication?.father_nid_url || prevFormData.fatherNidUrl || "",
      motherNidUrl: previousApplication?.mother_nid_url || prevFormData.motherNidUrl || "",
      collegeRegCardUrl: previousApplication?.college_reg_card_url || prevFormData.collegeRegCardUrl || "",
      agreement: false,
      ...prevFormData,
      // Verified student profile details take precedence over any empty prevFormData values
      ...(nameVal ? { name: nameVal } : {}),
      ...(rollVal ? { roll: rollVal, studentId: rollVal } : {}),
      ...(sessionVal ? { session: sessionVal } : {}),
      ...(deptVal ? { department: deptVal } : {}),
      ...(sem ? { semester: sem } : {}),
      ...(phoneVal ? { phone: phoneVal } : {}),
      ...(emailVal ? { email: emailVal } : {}),
      ...(bloodVal ? { bloodGroup: bloodVal } : {}),
    };
  });

  const [uploadingDocs, setUploadingDocs] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pushState, setPushState] = useState<NotificationPermission | "unsupported">("default");
  const [enablingPush, setEnablingPush] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushState(Notification.permission);
    } else {
      setPushState("unsupported");
    }
  }, []);

  const handleEnablePush = async () => {
    setEnablingPush(true);
    try {
      const res = await subscribeUserToPush();
      setPushState(res.permission);
      if (res.success || res.permission === "granted") {
        toast.success("নোটিফিকেশন সফলভাবে চালু করা হয়েছে!");
      } else if (res.permission === "denied") {
        toast.error("ব্রাউজার থেকে নোটিফিকেশন পারমিশন ব্লক করা আছে। সাইট সেটিংস থেকে Allow করুন।");
      }
    } catch (err) {
      console.warn("Push enabling error:", err);
    } finally {
      setEnablingPush(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "roll") next.studentId = value;
      if (field === "studentId") next.roll = value;
      return next;
    });
  };

  const getFieldValue = (key: string) => {
    if (
      key === "semester" ||
      key === "currentSemester" ||
      key.toLowerCase().includes("semester") ||
      key.includes("পর্ব")
    ) {
      const s =
        formData[key] ||
        formData.semester ||
        formData.currentSemester ||
        previousApplication?.semester ||
        student.semester ||
        "";
      return normalizeSemester(s) || s;
    }
    if (formData[key] !== undefined && formData[key] !== "") return formData[key];
    if (key === "session") return student.session || "";
    if (key === "roll" || key === "studentId") return student.roll || "";
    if (key === "department") return student.department || "";
    if (key === "phone") return student.phone || "";
    if (key === "email") return student.email || "";
    if (key === "name") return student.name || "";
    if (key === "bloodGroup") return student.blood_group || "";
    if (key === "photoUrl") return student.photo_url || "";
    return formData[key] ?? "";
  };

  const handleDocumentUpload = async (
    field: string,
    file: File
  ) => {
    if (!file) return;
    setUploadingDocs((prev) => ({ ...prev, [field]: true }));
    try {
      const isPhoto = field === "photoUrl" || field.toLowerCase().includes("photo");
      const url = await uploadImageToStorage(file, "recruitment_docs", {
        maxDimension: isPhoto ? 1000 : 2000,
      });
      setFormData((prev) => ({ ...prev, [field]: url }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      toast.success("Document uploaded successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload document.");
    } finally {
      setUploadingDocs((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleDocumentRemove = (field: string) => {
    setFormData((prev) => ({ ...prev, [field]: "" }));
    toast.info("Document removed.");
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setMessage(null);

    // Validate mandatory verification documents dynamically based on Form Editor configuration
    const validationErrors: Record<string, string[]> = {};
    activeFileFields.forEach((field) => {
      const fieldKey = field.name || field.id;
      if (field.required && !formData[fieldKey]) {
        validationErrors[fieldKey] = [`${field.label} আপলোড করা আবশ্যক।`];
      }
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setMessage({
        type: "error",
        text: "অনুগ্রহ করে আবশ্যক প্রমাণীকরণ কাগজপত্র আপলোড করুন।",
      });
      setSubmitting(false);
      return;
    }

    const finalFormData: Record<string, any> = { ...formData };
    activeGeneralFields.forEach((field) => {
      const fieldKey = field.name || field.id;
      if (finalFormData[fieldKey] === undefined || finalFormData[fieldKey] === "") {
        const val = getFieldValue(fieldKey);
        if (val) finalFormData[fieldKey] = val;
      }
    });

    const fd = new FormData();
    fd.append("campaignId", campaign.id);

    // Pass all formData entries
    Object.entries(finalFormData).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        fd.append(k, typeof v === "boolean" ? (v ? "true" : "false") : String(v));
      }
    });

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
        setShowSuccessModal(true);
        toast.success("ভর্তি আবেদন সফলভাবে সম্পন্ন হয়েছে!");
        setMessage({
          type: "success",
          text: result.message || "ভর্তি আবেদন সফলভাবে সম্পন্ন হয়েছে!",
        });
      } else {
        const errs = { ...(result.errors || {}) };
        if (errs.previousVolunteerExperience && !errs.previousExperience) {
          errs.previousExperience = errs.previousVolunteerExperience;
        }
        setErrors(errs);
        setMessage({
          type: "error",
          text: result.message || "অনুগ্রহ করে ফর্মের ভুলগুলো সংশোধন করুন।",
        });
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "আবেদন দাখিলের সময় কোনো সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const renderSuccessModal = () => (
    <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-3xl border-slate-200/80 shadow-2xl [&>[data-slot=dialog-close]]:text-white/80 [&>[data-slot=dialog-close]]:hover:text-white [&>[data-slot=dialog-close]]:top-4 [&>[data-slot=dialog-close]]:right-4 [&>[data-slot=dialog-close]]:bg-black/20 [&>[data-slot=dialog-close]]:hover:bg-black/40 [&>[data-slot=dialog-close]]:rounded-full [&>[data-slot=dialog-close]]:h-8 [&>[data-slot=dialog-close]]:w-8">
        <DialogHeader className="sr-only">
          <DialogTitle>ভর্তি আবেদন সফলভাবে দাখিল হয়েছে</DialogTitle>
          <DialogDescription>
            আপনার ভর্তি আবেদন সফলভাবে জমা হয়েছে। পরবর্তী করণীয় ও নির্দেশনাবলী জেনে নিন।
          </DialogDescription>
        </DialogHeader>

        {/* Top celebratory banner */}
        <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-brand via-brand-dark to-slate-900 px-6 py-7 text-white text-center">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-red-400/20 blur-xl pointer-events-none" />

          <div className="relative z-10">
            <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-white/95 border border-white/20 mb-3 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>আবেদন সফলভাবে গৃহীত হয়েছে</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              স্বেচ্ছাসেবক ভর্তি আবেদন সফল!
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-white/85 max-w-md mx-auto leading-relaxed">
              ধন্যবাদ, <strong className="text-white font-semibold">{student.name}</strong>! আপনার ভর্তি আবেদনটি নেতৃত্বের পর্যালোচনা ও অনুমোদনের জন্য জমা হয়েছে।
            </p>
          </div>
        </div>

        {/* Modal Body: Steps & Guidelines */}
        <div className="p-5 sm:p-7 space-y-4 bg-slate-50/50">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-brand" />
              পরবর্তী ধাপ ও গুরুত্বপূর্ণ তথ্যাবলী:
            </h3>
            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              🟡 যাচাই-বাছাই চলছে
            </span>
          </div>

          <div className="grid gap-3">
            {/* Step 1: Admin review */}
            <div className="flex items-start gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all hover:border-slate-300">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/80 text-amber-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    ১. অ্যাডমিন কর্তৃক যাচাই ও অনুমোদন
                  </h4>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                    Review Pending
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  আপনার জমা দেওয়া তথ্য ও ভেরিফিকেশন ডকুমেন্টসমূহ যুব রেড ক্রিসেন্ট পরিষদ যাচাই-বাছাই করবে। সবকিছু সঠিক থাকলে আবেদনটি দ্রুত <strong>অনুমোদন (Approve)</strong> করা হবে।
                </p>
              </div>
            </div>

            {/* Step 2: Turn on notification */}
            <div className="flex items-start gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all hover:border-slate-300">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100/80 text-blue-700">
                <BellRing className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    ২. ডিভাইসে নোটিফিকেশন অন রাখুন
                  </h4>
                  {pushState === "granted" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="h-3 w-3" /> সক্রিয়
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  আবেদন অনুমোদিত হওয়ার সাথে সাথে এবং গুরুত্বপূর্ণ আপডেট তাৎক্ষণিক পেতে ব্রাউজারে নোটিফিকেশন অন রাখার অনুরোধ করা হচ্ছে।
                </p>
                {pushState !== "granted" && pushState !== "unsupported" && (
                  <div className="mt-2.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={enablingPush}
                      onClick={handleEnablePush}
                      className="h-8 gap-1.5 text-xs border-blue-200 bg-blue-50/60 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                    >
                      {enablingPush ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <BellRing className="h-3.5 w-3.5" />
                      )}
                      <span>ডিভাইস নোটিফিকেশন চালু করুন</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Notification and Mail on Approval */}
            <div className="flex items-start gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all hover:border-slate-300">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100/80 text-purple-700">
                <Mail className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900">
                  ৩. অনুমোদন হলে নোটিফিকেশন ও ইমেইল বার্তা
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  আবেদন অনুমোদিত হওয়া মাত্র আপনার <strong>স্টুডেন্ট পোর্টালে সরাসরি ইন-অ্যাপ নোটিফিকেশন</strong> এবং আবেদনপত্রে দেওয়া <strong>ইমেইলে অফিসিয়াল কনফার্মেশন বার্তা</strong> চলে যাবে।
                </p>
              </div>
            </div>

            {/* Step 4: Admit Card download */}
            <div className="flex items-start gap-3.5 rounded-2xl border border-emerald-200/90 bg-emerald-50/40 p-4 shadow-2xs">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Ticket className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    ৪. প্রবেশপত্র (Admit Card) সংগ্রহ ও ট্রেনিং
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    প্রবেশপত্র বাধ্যতামূলক
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  অনুমোদনের পর স্টুডেন্ট পোর্টাল থেকে রোল নম্বর সম্বলিত <strong>প্রবেশপত্র (Admit Card)</strong> ডাউনলোড করতে পারবেন। আসন্ন <strong>ওরিয়েন্টেশন ও ফার্স্ট এইড (First Aid) ট্রেনিং কর্মশালায়</strong> অংশগ্রহণের সময় প্রবেশপত্রটি প্রিন্ট করে সঙ্গে আনতে হবে।
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 border-t border-slate-200/80 bg-white px-6 py-4 rounded-b-3xl">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowSuccessModal(false)}
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            ঠিক আছে, বুঝেছি
          </Button>
          <Button
            asChild
            className="w-full sm:w-auto bg-brand hover:bg-brand-dark text-white font-semibold text-xs sm:text-sm gap-2"
          >
            <Link href="/student">
              <User className="h-4 w-4" />
              <span>স্টুডেন্ট পোর্টালে যান</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (submittedSuccess) {
    return (
      <>
        {renderSuccessModal()}
        <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-lg sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h2 className="mt-5 text-2xl font-bold text-foreground">
            ভর্তি আবেদন সফলভাবে দাখিল হয়েছে!
          </h2>
          <p className="mx-auto mt-2.5 max-w-lg text-sm leading-relaxed text-muted-foreground">
            ধন্যবাদ, <strong>{student.name}</strong>! আপনার ভর্তি আবেদনটি নেতৃত্বের যাচাই-বাছাইয়ের জন্য জমা হয়েছে। আবেদন অনুমোদিত হলে আপনি আপনার ডিজিটাল সদস্যপদ ও প্রবেশপত্র পাবেন।
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-bold text-amber-800">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            স্ট্যাটাস: 🟡 যাচাই-বাছাই চলছে (Under Review)
          </div>

          <div className="mt-6 flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSuccessModal(true)}
              className="gap-2 text-xs font-semibold text-brand border-brand/20 bg-brand-soft hover:bg-brand hover:text-white"
            >
              <ClipboardList className="h-4 w-4" />
              <span>পরবর্তী নির্দেশনাবলী ও ধাপসমূহ দেখুন</span>
            </Button>
          </div>

          <AddToContactsCard className="mt-7" />

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-brand hover:bg-brand-dark">
              <Link href="/student">স্টুডেন্ট পোর্টালে যান</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/">মূল পাতায় ফিরে যান</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {renderSuccessModal()}
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

      {/* Official Admission Form Header Card */}
      <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-line pb-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4 text-center sm:text-left w-full sm:w-auto">
            <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-soft border border-brand/20 p-2 shadow-2xs">
              <Image
                src="/icon-192.png"
                alt="BDRCS Logo"
                width={56}
                height={56}
                className="object-contain"
              />
            </div>
            <div className="space-y-1 w-full sm:w-auto text-center sm:text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-crescent">
                যুব রেড ক্রিসেন্ট (Youth Red Crescent)
              </p>
              <h2 className="text-lg sm:text-xl font-extrabold text-foreground leading-snug">
                রাজশাহী সরকারি পলিটেকনিক ইনস্টিটিউট শাখা
              </h2>
              <p className="text-xs text-muted-foreground">
                সপুরা, রাজশাহী - ৬২০৩ • {activeConfig.title || "ভর্তি আবেদন ফর্ম"}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-bold text-emerald-800">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>ভেরিফাইড স্টুডেন্ট অ্যাকাউন্ট</span>
          </div>
        </div>

        {/* Dynamic Form Editor Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeGeneralFields.map((field) => {
            const fieldKey = field.name || field.id;
            const isFullWidth =
              field.type === "textarea" ||
              fieldKey.toLowerCase().includes("address") ||
              fieldKey.toLowerCase().includes("motivation");

            const isStudentPreFilled = Boolean(
              (fieldKey === "name" && student.name) ||
              ((fieldKey === "studentId" || fieldKey === "roll") && student.roll) ||
              (fieldKey === "session" && student.session) ||
              (fieldKey === "department" && student.department) ||
              ((fieldKey === "semester" ||
                fieldKey === "currentSemester" ||
                fieldKey.toLowerCase().includes("semester") ||
                field.id === "semester" ||
                field.name === "semester" ||
                field.label?.toLowerCase().includes("semester") ||
                field.label?.includes("পর্ব")) &&
                student.semester) ||
              (fieldKey === "phone" && student.phone) ||
              (fieldKey === "email" && student.email) ||
              (fieldKey === "bloodGroup" && student.blood_group)
            );

            const fieldValue = getFieldValue(fieldKey);

            return (
              <div
                key={field.id}
                className={`space-y-1.5 ${isFullWidth ? "md:col-span-2" : "col-span-1"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor={`va-${field.id}`} className="text-xs font-bold text-foreground">
                    {field.label} {field.required && <span className="text-crescent">*</span>}
                  </Label>
                  {isStudentPreFilled ? (
                    <span className="text-[10px] font-medium text-brand bg-brand-soft/60 px-2 py-0.5 rounded-md">
                      প্রোফাইল থেকে যুক্ত
                    </span>
                  ) : !field.required ? (
                    <span className="text-[10px] text-muted-foreground font-normal">
                      ঐচ্ছিক
                    </span>
                  ) : null}
                </div>

                {field.type === "textarea" ? (
                  <Textarea
                    id={`va-${field.id}`}
                    name={fieldKey}
                    rows={fieldKey.toLowerCase().includes("address") ? 3 : 4}
                    value={fieldValue ?? ""}
                    onChange={(e) => handleChange(fieldKey, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="text-xs sm:text-sm bg-white"
                  />
                ) : field.type === "select" ? (
                  (() => {
                    const isSemesterField =
                      fieldKey === "semester" ||
                      fieldKey === "currentSemester" ||
                      field.id === "semester" ||
                      field.name === "semester" ||
                      field.label?.toLowerCase().includes("semester") ||
                      field.label?.includes("পর্ব");

                    const isBloodField =
                      fieldKey === "bloodGroup" ||
                      field.id === "bloodGroup" ||
                      field.name === "bloodGroup" ||
                      field.label?.toLowerCase().includes("blood") ||
                      field.label?.includes("রক্ত");

                    const isDeptField =
                      fieldKey === "department" ||
                      field.id === "department" ||
                      field.name === "department" ||
                      field.label?.toLowerCase().includes("department") ||
                      field.label?.includes("ডিপার্টমেন্ট");

                    let optionsList: readonly string[] = [];
                    if (isSemesterField) {
                      optionsList = SEMESTERS;
                    } else if (isBloodField) {
                      optionsList = BLOOD_GROUPS;
                    } else if (isDeptField) {
                      optionsList = DEPARTMENTS;
                    } else if (field.options && field.options.length > 0) {
                      optionsList = field.options;
                    }

                    const rawVal = fieldValue || (isSemesterField ? student.semester : "");
                    const selectValue = isSemesterField
                      ? normalizeSemester(rawVal) || rawVal
                      : rawVal;

                    return (
                      <Select
                        value={selectValue ? String(selectValue) : undefined}
                        onValueChange={(val) => {
                          handleChange(fieldKey, val);
                          if (isSemesterField) {
                            handleChange("semester", val);
                            handleChange("currentSemester", val);
                          }
                        }}
                        required={field.required}
                      >
                        <SelectTrigger id={`va-${field.id}`} className="h-10 text-xs sm:text-sm bg-white">
                          <SelectValue placeholder={field.placeholder || "নির্বাচন করুন..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {optionsList.map((opt) => {
                            const itemVal = isSemesterField ? normalizeSemester(opt) || opt : opt;
                            const label = isSemesterField
                              ? SEMESTER_LABELS[itemVal] || `${itemVal} Semester`
                              : opt;
                            return (
                              <SelectItem key={opt} value={itemVal} className="text-xs sm:text-sm">
                                {label}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    );
                  })()
                ) : field.type === "checkbox" ? (
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer pt-1">
                    <Checkbox
                      id={`va-${field.id}`}
                      checked={Boolean(formData[fieldKey])}
                      onCheckedChange={(checked) => handleChange(fieldKey, Boolean(checked))}
                    />
                    <span>{field.placeholder || field.label}</span>
                  </label>
                ) : field.type === "date" || fieldKey === "dob" || field.id === "dob" ? (
                  (() => {
                    const isoDateVal = toDateInputValue(fieldValue);
                    const datePreview = formatBengaliDatePreview(isoDateVal);
                    const todayStr = new Date().toISOString().split("T")[0];

                    return (
                      <div className="space-y-1.5">
                        <div className="relative flex items-center group">
                          <Input
                            id={`va-${field.id}`}
                            name={fieldKey}
                            type="date"
                            max={todayStr}
                            min="1960-01-01"
                            value={isoDateVal}
                            onChange={(e) => handleChange(fieldKey, e.target.value)}
                            required={field.required}
                            className="h-10 text-xs sm:text-sm bg-white pl-10 pr-10 cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-75 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                            onClick={(e) => {
                              try {
                                (e.currentTarget as any).showPicker?.();
                              } catch {}
                            }}
                          />
                          <Calendar className="absolute left-3.5 h-4 w-4 text-emerald-600 pointer-events-none group-focus-within:text-brand transition-colors" />
                          <button
                            type="button"
                            onClick={() => {
                              const el = document.getElementById(`va-${field.id}`) as HTMLInputElement | null;
                              try {
                                (el as any)?.showPicker?.();
                              } catch {
                                el?.focus();
                              }
                            }}
                            className="absolute right-2.5 p-1 rounded-full text-slate-400 hover:text-brand hover:bg-slate-100 transition-colors"
                            title="ক্যালেন্ডার খুলুন"
                          >
                            <CalendarDays className="h-4 w-4" />
                          </button>
                        </div>

                        {datePreview ? (
                          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-poly font-medium bg-poly/5 px-2.5 py-1 rounded-lg border border-poly/15 w-fit">
                            <CalendarCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>নির্বাচিত তারিখ: <strong>{datePreview.formatted}</strong></span>
                            {datePreview.ageText && (
                              <span className="text-muted-foreground font-normal">({datePreview.ageText})</span>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <span>ক্যালেন্ডার আইকন বা বক্সে ক্লিক করে জন্ম তারিখ নির্বাচন করুন</span>
                          </p>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <Input
                    id={`va-${field.id}`}
                    name={fieldKey}
                    type={field.type}
                    value={fieldValue ?? ""}
                    onChange={(e) => handleChange(fieldKey, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="h-10 text-xs sm:text-sm bg-white"
                  />
                )}

                {field.helpText && (
                  <p className="text-[11px] text-muted-foreground">{field.helpText}</p>
                )}

                {errors[fieldKey] && (
                  <p className="text-[11px] font-semibold text-crescent">{errors[fieldKey][0]}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Official Identity Verification Documents & Passport Photo */}
      {activeFileFields.length > 0 && (
        <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8 space-y-6">
          <div className="border-b border-line pb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-brand" />
                <h2 className="text-base font-bold text-foreground sm:text-lg">
                  প্রয়োজনীয় প্রমাণীকরণ কাগজপত্র ও পাসপোর্ট ছবি
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                ভর্তি আবেদন ফর্মের সাথে মিল রেখে পাসপোর্ট সাইজ ছবি ও অফিসিয়াল ডকুমেন্ট আপলোড করুন (JPG, PNG, WebP বা PDF, সর্বোচ্চ 10MB)।
              </p>
            </div>
            <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-dark">
              {activeFileFields.length} Documents Configured
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {activeFileFields.map((field, idx) => {
              const fieldKey = field.name || field.id;
              const isPhoto = fieldKey === "photoUrl" || fieldKey.toLowerCase().includes("photo");
              const isLastOdd = activeFileFields.length % 2 !== 0 && idx === activeFileFields.length - 1;
              const isFullWidth = fieldKey === "motherNidUrl" || isLastOdd;

              return (
                <div key={field.id} className={isFullWidth ? "md:col-span-2" : "col-span-1"}>
                  <DocumentUploadCard
                    id={`va-doc-${field.id}`}
                    title={field.label}
                    banglaTitle={field.placeholder || "Document Upload"}
                    description={field.helpText || field.placeholder || "পরিষ্কার ছবি বা পিডিএফ স্ক্যান আপলোড করুন (JPG, PNG, WebP বা PDF, সর্বোচ্চ 10MB)।"}
                    accept={isPhoto ? "image/png,image/jpeg,image/webp" : "image/png,image/jpeg,image/webp,application/pdf"}
                    required={field.required}
                    isPhoto={isPhoto}
                    value={formData[fieldKey] || ""}
                    isUploading={Boolean(uploadingDocs[fieldKey])}
                    error={errors[fieldKey]?.[0]}
                    onUpload={(file) => handleDocumentUpload(fieldKey, file)}
                    onRemove={() => handleDocumentRemove(fieldKey)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Official Declaration & Pledge (প্রত্যয়ন ও অঙ্গীকারনামা) */}
      <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8 space-y-6">
        <MandatoryContactStep />

        <div className="rounded-2xl border border-brand/20 bg-brand-soft/20 p-5 space-y-3">
          <p className="text-xs font-bold text-brand-dark uppercase tracking-wider">
            আবেদনকারীর প্রত্যয়ন ও অঙ্গীকারনামা:
          </p>
          <p className="text-xs sm:text-sm leading-relaxed text-foreground font-medium">
            &ldquo;আমি এই মর্মে প্রত্যয়ন করছি যে, আবেদন পত্রে প্রদত্ত সকল তথ্য নির্ভুল ও সত্য। আমাকে রাজশাহী সরকারি পলিটেকনিক ইনস্টিটিউট এর যুব রেড ক্রিসেন্টে ভর্তি সুযোগ দিলে, আমি যুব রেড ক্রিসেন্টের সকল বিধি-বিধান মেনে চলবো। নিয়ম বহির্ভূত কোনো কিছু করলে কর্তৃপক্ষের দেয়া সিদ্ধান্ত আমি মেনে নিতে বাধ্য থাকিব।&rdquo;
          </p>

          <div className="flex items-start gap-3 pt-2">
            <Checkbox
              id="va-agreement"
              checked={formData.agreement}
              onCheckedChange={(val) => handleChange("agreement", Boolean(val))}
              className="mt-0.5"
              required
            />
            <Label htmlFor="va-agreement" className="text-xs sm:text-sm font-bold text-foreground cursor-pointer">
              আমি উপরের শর্ত ও নিয়মাবলী সম্পূর্ণরূপে পড়েছি এবং সম্মতি প্রদান করছি।
            </Label>
          </div>
          {errors.agreement && (
            <p className="text-xs font-medium text-crescent">{errors.agreement[0]}</p>
          )}
        </div>

        <div className="pt-2 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-xs font-bold text-foreground">
              মানবিকতা • সেবা • ঐক্য
            </p>
            <p className="text-[11px] text-muted-foreground">
              আবেদন অনুমোদিত হলে আপনার প্রবেশপত্র ও ডিজিটাল সদস্যপদ আইডি প্রদান করা হবে।
            </p>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto gap-2 rounded-full h-11 px-9 bg-crescent hover:bg-crescent-dark text-white font-bold shadow-md shadow-crescent/20 active:scale-[0.98] transition-all"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {submitting ? "দাখিল করা হচ্ছে…" : "ভর্তি আবেদন দাখিল করুন"}
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

      {isUploading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-brand/50 bg-brand-soft/20 py-8 px-4 text-center">
          <Loader2 className="h-7 w-7 animate-spin text-brand" />
          <p className="mt-2.5 text-xs font-semibold text-brand-dark">
            ডকুমেন্ট আপলোড ও অপটিমাইজ করা হচ্ছে…
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন
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
                সংযুক্ত হয়েছে
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
              দেখুন
            </a>

            <label
              htmlFor={id}
              className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-mist cursor-pointer transition-colors shadow-2xs"
            >
              <UploadCloud className="h-3.5 w-3.5 text-muted-foreground" />
              পরিবর্তন
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
              ক্লিক করে ফাইল নির্বাচন করুন বা টেনে এনে ড্রপ করুন
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isPhoto
                ? "পাসপোর্ট সাইজ ছবি · JPG, PNG, WebP · সর্বোচ্চ 10MB"
                : "অফিসিয়াল ডকুমেন্ট · JPG, PNG, WebP, PDF · সর্বোচ্চ 10MB"}
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
