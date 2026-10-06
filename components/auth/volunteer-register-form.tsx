"use client";

import { useEffect, useState } from "react";
import { FormShell, FieldError, SubmitButton } from "@/components/forms/form";
import { volunteerSignUp } from "@/lib/auth-actions";
import { BLOOD_GROUPS, DEPARTMENTS, SESSIONS } from "@/lib/constants";
import {
  Label,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
} from "@/components/ui";
import { MandatoryContactStep } from "@/components/forms/mandatory-contact-step";
import {
  isPushSupported,
  getNotificationPermissionState,
  subscribeUserToPush,
  getCurrentPushSubscriptionData,
} from "@/lib/notifications/client";
import { Bell, CheckCircle2, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";

export function VolunteerRegisterForm() {
  const [formData, setFormData] = useState({
    name: "",
    roll: "",
    registrationNo: "",
    session: "",
    department: "",
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

  const [pushSubData, setPushSubData] = useState<{
    endpoint: string;
    p256dh: string;
    auth: string;
    platform: string;
    browser: string;
    userAgent: string;
  } | null>(null);
  const [pushLoading, setPushLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (!isPushSupported()) return;
    const perm = getNotificationPermissionState();
    setPermission(perm);
    if (perm === "granted") {
      getCurrentPushSubscriptionData().then((data) => {
        if (data) setPushSubData(data);
      });
    }
  }, []);

  const handleEnablePush = async () => {
    setPushLoading(true);
    try {
      const res = await subscribeUserToPush();
      setPermission(res.permission);
      if (res.success) {
        const subData = await getCurrentPushSubscriptionData();
        if (subData) setPushSubData(subData);
        toast.success("পুশ নোটিফিকেশন সফলভাবে চালু হয়েছে!", {
          description: "আবেদন জমা দেওয়ার পর কনফার্মেশন ও অ্যাডমিন অনুমোদনের সাথে সাথে ফোনে পুশ অ্যালার্ট আসবে।",
        });
      } else if (res.permission === "denied") {
        toast.error("নোটিফিকেশন পারমিশন ব্লক করা রয়েছে। ব্রাউজার সেটিংসে গিয়ে পারমিশন Allow করুন।");
      }
    } catch {
      toast.error("পুশ নোটিফিকেশন চালু করা যায়নি।");
    } finally {
      setPushLoading(false);
    }
  };

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

          <MandatoryContactStep className="my-2" />

          {/* Real-time Push Notification Opt-in Card */}
          <div className="rounded-2xl border border-poly/25 bg-poly-soft/40 p-4 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-poly text-white shadow-xs">
                  <Bell className="h-4 w-4 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      অনুমোদন ও কনফার্মেশন পুশ নোটিফিকেশন
                    </p>
                    {permission === "granted" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> সক্রিয়
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    আবেদন সাবমিট হওয়া মাত্র কনফার্মেশন এবং অ্যাডমিন অনুমোদন করার সাথে সাথে আপনার ফোনে ইনস্ট্যান্ট পুশ অ্যালার্ট পান।
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center">
                {permission === "granted" ? (
                  <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                    <Smartphone className="h-3.5 w-3.5" /> এই ডিভাইসে চালু আছে
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleEnablePush}
                    disabled={pushLoading || permission === "denied"}
                    className="border-poly/40 bg-white hover:bg-poly-soft text-poly text-xs font-semibold"
                  >
                    {pushLoading ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        চালু হচ্ছে...
                      </>
                    ) : permission === "denied" ? (
                      "পারমিশন ব্লকড"
                    ) : (
                      "🔔 পুশ অ্যালার্ট চালু করুন"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Hidden inputs to pass subscription data to volunteerSignUp server action */}
          <input type="hidden" name="pushEndpoint" value={pushSubData?.endpoint || ""} />
          <input type="hidden" name="pushP256dh" value={pushSubData?.p256dh || ""} />
          <input type="hidden" name="pushAuth" value={pushSubData?.auth || ""} />
          <input type="hidden" name="pushPlatform" value={pushSubData?.platform || ""} />
          <input type="hidden" name="pushBrowser" value={pushSubData?.browser || ""} />

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
