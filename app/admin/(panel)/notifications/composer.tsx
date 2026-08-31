"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Send,
  Users,
  AlertTriangle,
  HeartPulse,
  Megaphone,
  ShieldAlert,
  Calendar,
  Sparkles,
  Loader2,
  CheckCircle2,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  adminBroadcastNotification,
  adminEstimateAudienceAction,
} from "@/lib/notifications/actions";
import { BLOOD_GROUPS, RCY_DEPARTMENTS, DEPARTMENTS } from "@/lib/constants";
import type {
  NotificationPriority,
  NotificationType,
  TargetCriteria,
} from "@/lib/notifications/types";

const BANGLADESH_DISTRICTS = [
  "Rajshahi",
  "Dhaka",
  "Chapainawabganj",
  "Naogaon",
  "Natore",
  "Bogura",
  "Pabna",
  "Sirajganj",
  "Joypurhat",
  "Chittagong",
  "Sylhet",
  "Khulna",
  "Barisal",
  "Rangpur",
  "Mymensingh",
  "Comilla",
];

export function NotificationComposer() {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<NotificationType>("notice");
  const [priority, setPriority] = useState<NotificationPriority>("normal");
  const [actionUrl, setActionUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Targeting filters
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedBloodGroups, setSelectedBloodGroups] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [isVolunteerOnly, setIsVolunteerOnly] = useState(false);
  const [isDonorOnly, setIsDonorOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);

  // Audience estimation
  const [estimating, setEstimating] = useState(false);
  const [estimate, setEstimate] = useState<{
    estimatedCount: number;
    totalCandidates: number;
    sampleRecipients: { name: string; role?: string | null; score: number; pushReady: boolean }[];
  } | null>(null);

  // Confirmation modal for Critical alerts
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Auto-estimate audience when criteria change
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setEstimating(true);
      try {
        const criteria: TargetCriteria = {
          roles: selectedRoles.length > 0 ? (selectedRoles as any) : undefined,
          bloodGroups: selectedBloodGroups.length > 0 ? selectedBloodGroups : undefined,
          districts: selectedDistricts.length > 0 ? selectedDistricts : undefined,
          departments: selectedDepartments.length > 0 ? selectedDepartments : undefined,
          isVolunteerOnly: isVolunteerOnly || undefined,
          isDonorOnly: isDonorOnly || undefined,
          availableOnly: availableOnly || undefined,
        };
        const res = await adminEstimateAudienceAction(type, priority, criteria);
        if (active) {
          setEstimate(res);
        }
      } catch (err) {
        console.error("Audience estimation error:", err);
      } finally {
        if (active) setEstimating(false);
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    type,
    priority,
    selectedRoles,
    selectedBloodGroups,
    selectedDistricts,
    selectedDepartments,
    isVolunteerOnly,
    isDonorOnly,
    availableOnly,
  ]);

  const handleSend = () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Please enter both title and message body.");
      return;
    }

    if (priority === "critical") {
      setShowConfirmModal(true);
    } else {
      executeBroadcast();
    }
  };

  const executeBroadcast = () => {
    setShowConfirmModal(false);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("body", body);
      formData.set("type", type);
      formData.set("priority", priority);
      if (actionUrl) formData.set("actionUrl", actionUrl);
      if (imageUrl) formData.set("imageUrl", imageUrl);

      selectedRoles.forEach((r) => formData.append("roles", r));
      selectedBloodGroups.forEach((b) => formData.append("bloodGroups", b));
      selectedDistricts.forEach((d) => formData.append("districts", d));
      selectedDepartments.forEach((dept) => formData.append("departments", dept));
      if (isVolunteerOnly) formData.set("isVolunteerOnly", "on");
      if (isDonorOnly) formData.set("isDonorOnly", "on");
      if (availableOnly) formData.set("availableOnly", "on");

      const res = await adminBroadcastNotification(formData);
      if (res.success) {
        toast.success(res.message);
        setTitle("");
        setBody("");
        setActionUrl("");
        setImageUrl("");
      } else {
        toast.error(res.message || "Failed to broadcast notification.");
      }
    });
  };

  const toggleArrayItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) => {
    setList((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Compose Form */}
      <div className="lg:col-span-7 space-y-5 rounded-2xl border bg-card p-6 shadow-xs">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Create Smart Broadcast
            </h3>
            <p className="text-xs text-muted-foreground">
              Intelligently target users based on location, blood group, role, and availability.
            </p>
          </div>
          <span className="rounded-full bg-poly/15 px-2.5 py-1 text-xs font-semibold text-poly flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> Smart Engine
          </span>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium">Notification Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as NotificationType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="notice">📢 Official Notice</SelectItem>
                  <SelectItem value="blood_request">🩸 Urgent Blood Request</SelectItem>
                  <SelectItem value="emergency">🚨 Emergency Alert</SelectItem>
                  <SelectItem value="volunteer">🤝 Volunteer Update</SelectItem>
                  <SelectItem value="event">📅 Event & Campaign</SelectItem>
                  <SelectItem value="system">⚙️ System Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium">Priority Level</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as NotificationPriority)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (Respects quiet hours & limits)</SelectItem>
                  <SelectItem value="normal">Normal (Standard priority)</SelectItem>
                  <SelectItem value="high">High (Bypasses cooldown)</SelectItem>
                  <SelectItem value="critical">🚨 Critical (Emergency alert)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Notification Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 🩸 Urgent O+ Blood Needed at DMCH"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-medium">Message Body *</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="Write concise and clear details for the notification..."
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium">Action URL (Optional)</Label>
              <Input
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                placeholder="/blood-support or /notices/slug"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Image URL (Optional)</Label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1"
              />
            </div>
          </div>

          {/* Targeting Accordion / Filters */}
          <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Sliders className="h-3.5 w-3.5 text-poly" />
              <span>Smart Targeting Filters (Optional)</span>
            </div>

            {/* Blood Groups */}
            <div>
              <Label className="text-[11px] text-muted-foreground">Target Blood Groups</Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {BLOOD_GROUPS.map((bg) => {
                  const active = selectedBloodGroups.includes(bg);
                  return (
                    <button
                      type="button"
                      key={bg}
                      onClick={() =>
                        toggleArrayItem(selectedBloodGroups, setSelectedBloodGroups, bg)
                      }
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        active
                          ? "bg-crescent text-white shadow-xs"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {bg}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Districts */}
            <div>
              <Label className="text-[11px] text-muted-foreground">Target Districts</Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {BANGLADESH_DISTRICTS.map((d) => {
                  const active = selectedDistricts.includes(d);
                  return (
                    <button
                      type="button"
                      key={d}
                      onClick={() =>
                        toggleArrayItem(selectedDistricts, setSelectedDistricts, d)
                      }
                      className={`rounded-lg px-2 py-0.5 text-xs font-medium transition ${
                        active
                          ? "bg-poly text-white shadow-xs"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-border/50">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs cursor-pointer">Volunteers Only</Label>
                <Switch
                  checked={isVolunteerOnly}
                  onCheckedChange={setIsVolunteerOnly}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs cursor-pointer">Donors Only</Label>
                <Switch checked={isDonorOnly} onCheckedChange={setIsDonorOnly} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs cursor-pointer">Available Only</Label>
                <Switch
                  checked={availableOnly}
                  onCheckedChange={setAvailableOnly}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSend}
            disabled={isPending || !title || !body}
            className={`px-6 text-white font-medium ${
              priority === "critical"
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-poly hover:bg-poly/90"
            }`}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Broadcasting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" /> Send Broadcast
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Live Audience Estimator Card */}
      <div className="lg:col-span-5 space-y-5">
        <div className="rounded-2xl border bg-gradient-to-b from-card to-muted/30 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-poly" /> Estimated Audience
            </h4>
            {estimating && <Loader2 className="h-3.5 w-3.5 animate-spin text-poly" />}
          </div>

          <div className="text-center py-4 bg-muted/30 rounded-xl border border-border/50">
            <span className="text-4xl font-extrabold text-poly">
              {estimate?.estimatedCount ?? 0}
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              eligible recipient(s) out of {estimate?.totalCandidates ?? 0} registered users
            </p>
          </div>

          {/* Sample preview */}
          {estimate && estimate.sampleRecipients.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Top Scored Recipients (Sample)
              </p>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {estimate.sampleRecipients.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-xs"
                  >
                    <div>
                      <p className="font-medium text-foreground">{r.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {r.role || "User"} {r.pushReady ? "• 📱 Push Ready" : "• In-App"}
                      </p>
                    </div>
                    <span className="rounded-full bg-poly/15 px-2 py-0.5 text-[11px] font-bold text-poly">
                      {r.score} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Critical Warning */}
          {priority === "critical" && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Critical Emergency Priority</p>
                <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-400">
                  Critical alerts bypass standard daily limits and quiet hours. Please use only for genuine urgent blood requests or disaster alerts.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Critical Alerts */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" /> Confirm Critical Emergency Broadcast
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed pt-2">
              You are about to dispatch a <strong>CRITICAL PRIORITY</strong> notification to approximately{" "}
              <strong>{estimate?.estimatedCount ?? 0} users</strong>. This alert will trigger loud push notifications and bypass quiet hours.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/30 p-3 text-xs">
            <p className="font-semibold text-foreground">{title}</p>
            <p className="text-muted-foreground mt-1 line-clamp-2">{body}</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={executeBroadcast}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Confirm & Broadcast Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
