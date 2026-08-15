"use client";

import { useState } from "react";
import {
  User,
  BadgeCheck,
  CalendarDays,
  Building2,
  GraduationCap,
  Award,
  Droplets,
  MapPin,
  Phone,
  Mail,
  Shield,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Globe,
  Lock,
} from "lucide-react";
import { PortalAvatarUploader } from "@/components/portal/portal-avatar-uploader";
import { updateTeamMemberProfile, updateTeamMemberPhoto } from "@/lib/portal-actions";
import { TEAM_MEMBER_STATUS_LABELS, formatDate } from "@/lib/constants";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { Label, Input, Textarea, Button } from "@/components/ui";
import type { TeamMember } from "@/types/database";

export function TeamMemberProfileEditor({ teamMember }: { teamMember: TeamMember }) {
  const [activeTab, setActiveTab] = useState<"view" | "edit">("view");
  const [formData, setFormData] = useState({
    name: teamMember.name || "",
    phone: teamMember.phone || "",
    area: teamMember.area || "",
    emergencyContactName: teamMember.emergency_contact_name || "",
    emergencyContactPhone: teamMember.emergency_contact_phone || "",
    skills: (teamMember.skills || []).join(", "),
    experience: teamMember.experience || "",
    motivation: teamMember.motivation || "",
    publicProfile: teamMember.public_profile ?? true,
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setMessage(null);

    const fd = new FormData();
    Object.entries(formData).forEach(([key, val]) => fd.append(key, String(val)));

    try {
      const result = await updateTeamMemberProfile({ success: false }, fd);
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
    { icon: User, label: "Full Name", value: formData.name || teamMember.name },
    { icon: Building2, label: "Department", value: teamMember.department || "—" },
    { icon: GraduationCap, label: "Semester", value: teamMember.semester || "—" },
    { icon: Droplets, label: "Blood Group", value: teamMember.blood_group || "—", note: "Protected (Admin only)" },
    { icon: MapPin, label: "Area / Address", value: formData.area || teamMember.area || "—" },
    { icon: Phone, label: "Mobile Number", value: formData.phone || teamMember.phone || "—" },
    { icon: Mail, label: "Email", value: teamMember.email || "—" },
    {
      icon: Phone,
      label: "Emergency Contact",
      value: formData.emergencyContactName
        ? `${formData.emergencyContactName} (${formData.emergencyContactPhone})`
        : "—",
    },
    { icon: CalendarDays, label: "Joined Date", value: formatDate(teamMember.joined_at) },
    { icon: Award, label: "Points", value: `${teamMember.points} pts` },
  ];

  return (
    <div className="space-y-6">
      {/* Identity & Avatar Hero */}
      <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <PortalAvatarUploader
            initialPhotoUrl={teamMember.photo_url}
            name={formData.name || teamMember.name || "Team Member"}
            folder="volunteers"
            onPhotoSaved={updateTeamMemberPhoto}
          />
          <div className="flex flex-wrap items-center gap-2 sm:self-start">
            {teamMember.member_id && (
              <StatusBadge label={`ID: ${teamMember.member_id}`} tone="brand" />
            )}
            <StatusBadge
              label={TEAM_MEMBER_STATUS_LABELS[teamMember.status] ?? teamMember.status}
              tone={statusTone(teamMember.status)}
            />
          </div>
        </div>
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
          Overview & Membership
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
          Edit Profile
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
        <div className="space-y-6">
          <div className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Team Member Details</h2>
                <p className="text-xs text-muted-foreground">
                  Official membership information and records at RPI Red Crescent Society.
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

            {teamMember.status === "APPROVED" && (
              <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Verified Team Member</p>
                  <p className="mt-0.5 text-xs text-emerald-700">
                    Your membership is active and recognized. You can request participation in upcoming events and activities below.
                  </p>
                </div>
              </div>
            )}

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              {overviewRows.map((row) => (
                <div key={row.label} className="rounded-2xl border border-line bg-mist/40 p-4">
                  <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <row.icon className="h-3.5 w-3.5 text-brand" aria-hidden />
                    {row.label}
                  </dt>
                  <dd className="mt-1 font-semibold text-foreground">
                    {row.value}
                    {row.note && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-normal text-muted-foreground">
                        <Lock className="h-3 w-3" /> {row.note}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            {/* Skills & Bio */}
            {(formData.skills || formData.experience || formData.motivation) && (
              <div className="mt-6 space-y-4 border-t border-line pt-6 text-sm">
                {formData.skills && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Skills & Capabilities
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {formData.skills.split(",").map((s, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-ink"
                        >
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {formData.experience && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Experience
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {formData.experience}
                    </p>
                  </div>
                )}

                {formData.motivation && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Motivation
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {formData.motivation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Edit Tab */}
      {activeTab === "edit" && (
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8 space-y-6"
        >
          <div>
            <h2 className="text-lg font-bold text-foreground">Edit Team Member Profile</h2>
            <p className="text-xs text-muted-foreground">
              Update your personal details, contact information, skills, and privacy preferences.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="vl-name">Full Name</Label>
              <Input
                id="vl-name"
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
              <Label htmlFor="vl-phone">Mobile Number</Label>
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
              {errors.phone && (
                <p className="mt-1 text-xs font-medium text-crescent">{errors.phone[0]}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="vl-area">Area / Address</Label>
            <Input
              id="vl-area"
              name="area"
              value={formData.area}
              onChange={(e) => handleChange("area", e.target.value)}
              placeholder="e.g. Kazla, Rajshahi"
              className="mt-1.5"
              required
            />
            {errors.area && (
              <p className="mt-1 text-xs font-medium text-crescent">{errors.area[0]}</p>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="vl-emg-name">Emergency Contact Name</Label>
              <Input
                id="vl-emg-name"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={(e) => handleChange("emergencyContactName", e.target.value)}
                placeholder="e.g. Father / Guardian"
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
              <Label htmlFor="vl-emg-phone">Emergency Contact Number</Label>
              <Input
                id="vl-emg-phone"
                name="emergencyContactPhone"
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

          <div>
            <Label htmlFor="vl-skills">Skills & Capabilities (comma separated)</Label>
            <Input
              id="vl-skills"
              name="skills"
              value={formData.skills}
              onChange={(e) => handleChange("skills", e.target.value)}
              placeholder="e.g. First Aid, Photography, Public Speaking"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="vl-experience">Experience</Label>
            <Textarea
              id="vl-experience"
              name="experience"
              rows={3}
              value={formData.experience}
              onChange={(e) => handleChange("experience", e.target.value)}
              placeholder="Any past volunteering background..."
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="vl-motivation">Motivation / Statement</Label>
            <Textarea
              id="vl-motivation"
              name="motivation"
              rows={3}
              value={formData.motivation}
              onChange={(e) => handleChange("motivation", e.target.value)}
              placeholder="What drives you to volunteer..."
              className="mt-1.5"
            />
          </div>

          {/* Public Profile Visibility Toggle */}
          <div className="flex items-center justify-between rounded-2xl border border-line bg-mist/40 p-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Globe className="h-4 w-4 text-brand" />
                Public Team Member Profile
              </div>
              <p className="text-xs text-muted-foreground">
                Show your name, department, points, and verified team member badge on the public team member directory. (Your blood group and phone number are always protected and private).
              </p>
            </div>
            <input
              type="checkbox"
              id="publicProfile"
              name="publicProfile"
              checked={formData.publicProfile}
              onChange={(e) => handleChange("publicProfile", e.target.checked)}
              className="h-5 w-5 rounded border-line text-brand focus:ring-brand"
            />
          </div>

          {/* Admin Managed Notice */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-2.5">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <p>
              Your Membership ID, Team Rank/Position, Department/Semester records, and Points are officially verified and managed by society administrators.
            </p>
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
