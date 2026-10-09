"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  HeartHandshake,
  Loader2,
  GraduationCap,
  CheckCircle2,
  Bell,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TEAM_POSITIONS, RCY_DEPARTMENTS, NON_DEPARTMENT_POSITIONS } from "@/lib/constants";
import { makeStudentRcyMember } from "@/lib/admin-actions";
import type { Student } from "@/types/database";

interface MakeRcyMemberDialogProps {
  student: Student;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function MakeRcyMemberDialog({
  student,
  trigger,
  onSuccess,
}: MakeRcyMemberDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [position, setPosition] = useState<string>("General Member");
  const [rcyDepartment, setRcyDepartment] = useState<string>("none");
  const [memberId, setMemberId] = useState<string>("");
  const [sendNotification, setSendNotification] = useState<boolean>(true);

  const isNonDeptPosition = (NON_DEPARTMENT_POSITIONS as readonly string[]).includes(position);
  const currentYear = new Date().getFullYear();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("studentId", student.id);
        formData.set("position", position);
        if (!isNonDeptPosition && rcyDepartment && rcyDepartment !== "none") {
          formData.set("rcyDepartment", rcyDepartment);
        }
        if (memberId.trim()) {
          formData.set("memberId", memberId.trim());
        }
        formData.set("sendNotification", sendNotification ? "true" : "false");

        const res = await makeStudentRcyMember(formData);
        if (res.success) {
          toast.success(res.message);
          setOpen(false);
          router.refresh();
          onSuccess?.();
        } else {
          toast.error(res.message);
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "An unexpected error occurred.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-emerald-600/40 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-500/40 dark:text-emerald-400 dark:hover:bg-emerald-950/40 font-semibold text-xs shadow-xs"
            title="Make this student an official RCY member"
          >
            <HeartHandshake className="h-3.5 w-3.5" />
            Make RCY Member
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Make Student RCY Member
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Enroll this student into Rajshahi Govt. Polytechnic Institute Red Crescent Youth.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {/* Student Overview Box */}
            <div className="rounded-2xl border border-line bg-mist/60 p-3.5 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-brand-dark" />
                  {student.name}
                </div>
                {student.blood_group && (
                  <span className="rounded bg-crescent-soft px-1.5 py-0.5 text-[10px] font-bold text-crescent">
                    {student.blood_group}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Roll:</span> {student.roll}
                </p>
                <p>
                  <span className="font-medium text-foreground">Dept:</span> {student.department}
                </p>
                <p>
                  <span className="font-medium text-foreground">Session:</span> {student.session}
                </p>
                <p>
                  <span className="font-medium text-foreground">Semester:</span>{" "}
                  {student.semester ? `${student.semester} Sem` : "—"}
                </p>
                <p className="col-span-2 truncate">
                  <span className="font-medium text-foreground">Contact:</span> {student.phone} ·{" "}
                  {student.email}
                </p>
              </div>
            </div>

            {/* Position Selection */}
            <div className="space-y-1.5">
              <Label htmlFor="rcy-pos" className="text-xs font-semibold">
                Member Position / পদবী
              </Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger id="rcy-pos" className="h-9 text-xs">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_POSITIONS.map((pos) => (
                    <SelectItem key={pos} value={pos} className="text-xs font-medium">
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Default is <strong>General Member</strong>. Leadership titles appear on their digital ID card.
              </p>
            </div>

            {/* RCY Department */}
            <div className="space-y-1.5">
              <Label htmlFor="rcy-dept" className="text-xs font-semibold">
                RCY Department / উইং
              </Label>
              <Select
                value={isNonDeptPosition ? "none" : rcyDepartment}
                onValueChange={setRcyDepartment}
                disabled={isNonDeptPosition}
              >
                <SelectTrigger id="rcy-dept" className="h-9 text-xs">
                  <SelectValue placeholder="Select wing / department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">
                    (None / General Unit)
                  </SelectItem>
                  {RCY_DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept} className="text-xs font-medium">
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                {isNonDeptPosition
                  ? "Team Leader & Deputy Leaders oversee all wings (no specific department needed)."
                  : "Assign an internal RCY department or keep as General Unit."}
              </p>
            </div>

            {/* Custom Member ID (Optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="rcy-member-id" className="text-xs font-semibold">
                Member ID (Optional / কাস্টম আইডি)
              </Label>
              <Input
                id="rcy-member-id"
                placeholder={`Auto-generate (e.g. RCR-${currentYear}-XXXX)`}
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="h-9 text-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Leave blank to automatically assign the next sequential Member ID.
              </p>
            </div>

            {/* Notifications Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-line bg-mist/30 p-3">
              <div className="space-y-0.5">
                <Label htmlFor="rcy-notify" className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                  <Bell className="h-3.5 w-3.5 text-brand" />
                  Send Congratulations Alert
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Sends in-app alert & email notification about their official RCY membership.
                </p>
              </div>
              <Switch
                id="rcy-notify"
                checked={sendNotification}
                onCheckedChange={setSendNotification}
              />
            </div>
          </div>

          <DialogFooter className="mt-6 flex-row justify-end gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enrolling…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm & Make Member
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
