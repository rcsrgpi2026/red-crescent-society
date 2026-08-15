"use client";

import { useState } from "react";
import {
  User,
  GraduationCap,
  CalendarDays,
  Hash,
  Building2,
  Phone,
  Mail,
  MapPin,
  Droplets,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
} from "lucide-react";
import { PortalAvatarUploader } from "@/components/portal/portal-avatar-uploader";
import { updateStudentProfile, updateStudentPhoto } from "@/lib/portal-actions";
import { DEPARTMENTS, SEMESTERS, BLOOD_GROUPS } from "@/lib/constants";
import {
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
} from "@/components/ui";
import type { Student } from "@/types/database";

export function StudentProfileEditor({ student }: { student: Student }) {
  const [activeTab, setActiveTab] = useState<"view" | "edit">("view");
  const [formData, setFormData] = useState({
    name: student.name || "",
    session: student.session || "",
    semester: student.semester || "",
    roll: student.roll || "",
    department: student.department || "",
    phone: student.phone || "",
    bloodGroup: student.blood_group || "",
    address: student.address || "",
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setMessage(null);

    const fd = new FormData();
    Object.entries(formData).forEach(([key, val]) => fd.append(key, val));

    try {
      const result = await updateStudentProfile({ success: false }, fd);
      if (result.success) {
        setMessage({ type: "success", text: result.message || "Profile updated successfully!" });
        setActiveTab("view");
      } else {
        if (result.errors) setErrors(result.errors);
        setMessage({
          type: "error",
          text: result.message || "Please correct the highlighted fields.",
        });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Something went wrong." });
    } finally {
      setSaving(false);
    }
  }

  const overviewRows = [
    { icon: User, label: "Full Name", value: formData.name || student.name },
    { icon: CalendarDays, label: "Session", value: formData.session || student.session },
    { icon: GraduationCap, label: "Semester", value: formData.semester || student.semester },
    { icon: Hash, label: "Roll Number", value: formData.roll || student.roll },
    { icon: Building2, label: "Department", value: formData.department || student.department },
    { icon: Phone, label: "Mobile Number", value: formData.phone || student.phone },
    { icon: Mail, label: "Email Address", value: student.email },
    { icon: Droplets, label: "Blood Group", value: formData.bloodGroup || student.blood_group || "Not specified" },
    { icon: MapPin, label: "Address", value: formData.address || student.address || "Not specified" },
  ];

  return (
    <div className="space-y-6">
      {/* Photo & Identity Hero Card */}
      <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <PortalAvatarUploader
          initialPhotoUrl={student.photo_url}
          name={formData.name || student.name || "Student"}
          folder="students"
          onPhotoSaved={updateStudentPhoto}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-line pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("view")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "view"
              ? "bg-brand text-white shadow-sm"
              : "bg-white text-muted-foreground hover:bg-mist hover:text-foreground"
          }`}
        >
          <User className="h-4 w-4" />
          Overview & Record
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("edit")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "edit"
              ? "bg-brand text-white shadow-sm"
              : "bg-white text-muted-foreground hover:bg-mist hover:text-foreground"
          }`}
        >
          <Edit3 className="h-4 w-4" />
          Edit Details
        </button>
      </div>

      {/* Status Feedback banner */}
      {message && (
        <div
          role="alert"
          className={`flex items-start gap-2.5 rounded-2xl p-4 text-sm font-medium ${
            message.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-crescent/30 bg-crescent-soft text-crescent"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <p>{message.text}</p>
        </div>
      )}

      {/* 1. Overview Tab */}
      {activeTab === "view" && (
        <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Student Record Details</h2>
              <p className="text-xs text-muted-foreground">
                Your registered student profile details with Rajshahi Polytechnic Institute Red Crescent Society.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("edit")}
              className="gap-1.5"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit Profile
            </Button>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {overviewRows.map((row) => (
              <div key={row.label} className="rounded-2xl border border-line bg-mist/40 p-4">
                <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <row.icon className="h-3.5 w-3.5 text-brand" aria-hidden />
                  {row.label}
                </dt>
                <dd className="mt-1 font-semibold text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* 2. Edit Profile Details Tab */}
      {activeTab === "edit" && (
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8 space-y-6"
        >
          <div>
            <h2 className="text-lg font-bold text-foreground">Update Profile Details</h2>
            <p className="text-xs text-muted-foreground">
              Keep your academic and contact details up to date.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="st-name">Full Name</Label>
              <Input
                id="st-name"
                name="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g. Rakib Hasan"
                className="mt-1.5"
                required
              />
              {errors.name && (
                <p className="mt-1 text-xs font-medium text-crescent">{errors.name[0]}</p>
              )}
            </div>

            <div>
              <Label htmlFor="st-email">Email Address (Read-only)</Label>
              <Input
                id="st-email"
                type="email"
                value={student.email}
                disabled
                className="mt-1.5 bg-mist text-muted-foreground cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
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
              {errors.department && (
                <p className="mt-1 text-xs font-medium text-crescent">{errors.department[0]}</p>
              )}
            </div>

            <div>
              <Label htmlFor="st-semester">Semester</Label>
              <Select
                name="semester"
                value={formData.semester}
                onValueChange={(val) => handleChange("semester", val)}
              >
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
              {errors.semester && (
                <p className="mt-1 text-xs font-medium text-crescent">{errors.semester[0]}</p>
              )}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="st-roll">Roll Number</Label>
              <Input
                id="st-roll"
                name="roll"
                value={formData.roll}
                onChange={(e) => handleChange("roll", e.target.value)}
                placeholder="e.g. 73014"
                className="mt-1.5"
                required
              />
              {errors.roll && (
                <p className="mt-1 text-xs font-medium text-crescent">{errors.roll[0]}</p>
              )}
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
              {errors.session && (
                <p className="mt-1 text-xs font-medium text-crescent">{errors.session[0]}</p>
              )}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="st-phone">Mobile Number</Label>
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
              {errors.phone && (
                <p className="mt-1 text-xs font-medium text-crescent">{errors.phone[0]}</p>
              )}
            </div>

            <div>
              <Label htmlFor="st-bloodGroup">Blood Group (Optional)</Label>
              <Select
                name="bloodGroup"
                value={formData.bloodGroup}
                onValueChange={(val) => handleChange("bloodGroup", val)}
              >
                <SelectTrigger id="st-bloodGroup" className="mt-1.5">
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
            </div>
          </div>

          <div>
            <Label htmlFor="st-address">Address / Location</Label>
            <Input
              id="st-address"
              name="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="e.g. Kazla, Rajshahi"
              className="mt-1.5"
            />
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-line">
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving Changes…" : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab("view")}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
