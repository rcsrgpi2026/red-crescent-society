"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  UserPlus,
  Search,
  GraduationCap,
  HeartHandshake,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Bell,
  ArrowRight,
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
import type { Student, TeamMember } from "@/types/database";

interface AddStudentToTeamDialogProps {
  students: Student[];
  teamMembers?: TeamMember[];
  trigger?: React.ReactNode;
}

export function AddStudentToTeamDialog({
  students,
  teamMembers = [],
  trigger,
}: AddStudentToTeamDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [position, setPosition] = useState<string>("General Member");
  const [rcyDepartment, setRcyDepartment] = useState<string>("none");
  const [memberId, setMemberId] = useState<string>("");
  const [sendNotification, setSendNotification] = useState<boolean>(true);

  // Set of student IDs / user IDs / emails that are already approved team members
  const approvedIdentifiers = useMemo(() => {
    const ids = new Set<string>();
    for (const m of teamMembers) {
      if (m.status === "APPROVED") {
        if (m.student_id) ids.add(m.student_id);
        if (m.user_id) ids.add(m.user_id);
        if (m.email?.trim()) ids.add(m.email.trim().toLowerCase());
      }
    }
    return ids;
  }, [teamMembers]);

  // Filter students who are not yet approved team members
  const availableStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students
      .filter((s) => {
        const isAlreadyMember =
          approvedIdentifiers.has(s.id) ||
          (s.user_id && approvedIdentifiers.has(s.user_id)) ||
          (s.email && approvedIdentifiers.has(s.email.trim().toLowerCase()));
        if (isAlreadyMember) return false;
        if (!query) return true;
        return (
          s.name.toLowerCase().includes(query) ||
          s.roll.toLowerCase().includes(query) ||
          s.department.toLowerCase().includes(query) ||
          s.session.toLowerCase().includes(query) ||
          s.phone.includes(query)
        );
      })
      .slice(0, 20);
  }, [students, approvedIdentifiers, search]);

  const isNonDeptPosition = (NON_DEPARTMENT_POSITIONS as readonly string[]).includes(position);
  const currentYear = new Date().getFullYear();

  const handleReset = () => {
    setSelectedStudent(null);
    setSearch("");
    setPosition("General Member");
    setRcyDepartment("none");
    setMemberId("");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) handleReset();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedStudent) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("studentId", selectedStudent.id);
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
          handleReset();
          router.refresh();
        } else {
          toast.error(res.message);
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "An unexpected error occurred.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            size="sm"
            className="gap-1.5 bg-brand text-white hover:bg-brand-dark font-medium shadow-xs"
          >
            <UserPlus className="h-4 w-4" aria-hidden />
            Add from Students
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-dark">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Add RCY Member from Students
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Search registered students and enroll them into the RCY Team Directory.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!selectedStudent ? (
          <div className="mt-4 flex flex-col flex-1 min-h-0 space-y-3">
            {/* Search Input */}
            <div className="relative shrink-0">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                placeholder="Search by student name, roll, department, or session…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
                autoFocus
              />
            </div>

            {/* List of candidates */}
            <div className="flex-1 overflow-y-auto rounded-xl border border-line divide-y divide-line max-h-72">
              {availableStudents.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  {students.length === 0
                    ? "No registered students found in the system."
                    : search
                      ? "No non-member students match your search."
                      : "All registered students are already active RCY team members!"}
                </div>
              ) : (
                availableStudents.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedStudent(s)}
                    className="w-full text-left p-3 flex items-center justify-between hover:bg-mist/70 transition-colors group"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground group-hover:text-brand-dark">
                          {s.name}
                        </span>
                        {s.blood_group && (
                          <span className="rounded bg-crescent-soft px-1.5 py-0.2 text-[10px] font-bold text-crescent">
                            {s.blood_group}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Roll: <span className="font-mono font-medium text-foreground">{s.roll}</span> · {s.department} · {s.session}
                        {s.semester ? ` (${s.semester} Sem)` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 flex items-center gap-1 text-xs font-semibold text-brand opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                      Select
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </button>
                ))
              )}
            </div>

            <p className="text-[11px] text-muted-foreground shrink-0 text-center">
              Showing students registered via the Student Portal who are not yet RCY members.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col flex-1 overflow-y-auto space-y-4">
            {/* Selected Student Banner */}
            <div className="rounded-2xl border border-line bg-mist/60 p-3.5 text-xs relative">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="absolute top-3 right-3 text-xs font-semibold text-brand hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Change Student
              </button>

              <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-brand-dark" />
                {selectedStudent.name}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Roll:</span> {selectedStudent.roll}
                </p>
                <p>
                  <span className="font-medium text-foreground">Dept:</span> {selectedStudent.department}
                </p>
                <p>
                  <span className="font-medium text-foreground">Session:</span> {selectedStudent.session}
                </p>
                <p>
                  <span className="font-medium text-foreground">Phone:</span> {selectedStudent.phone}
                </p>
              </div>
            </div>

            {/* Position Selection */}
            <div className="space-y-1.5">
              <Label htmlFor="add-team-pos" className="text-xs font-semibold">
                Member Position / পদবী
              </Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger id="add-team-pos" className="h-9 text-xs">
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
            </div>

            {/* RCY Department */}
            <div className="space-y-1.5">
              <Label htmlFor="add-team-dept" className="text-xs font-semibold">
                RCY Department / উইং
              </Label>
              <Select
                value={isNonDeptPosition ? "none" : rcyDepartment}
                onValueChange={setRcyDepartment}
                disabled={isNonDeptPosition}
              >
                <SelectTrigger id="add-team-dept" className="h-9 text-xs">
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
            </div>

            {/* Custom Member ID (Optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="add-team-id" className="text-xs font-semibold">
                Member ID (Optional)
              </Label>
              <Input
                id="add-team-id"
                placeholder={`Auto-generate (e.g. RCR-${currentYear}-XXXX)`}
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            {/* Notifications Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-line bg-mist/30 p-3">
              <div className="space-y-0.5">
                <Label htmlFor="add-team-notify" className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                  <Bell className="h-3.5 w-3.5 text-brand" />
                  Send Notification Alert
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Sends in-app alert & email notification about their enrollment.
                </p>
              </div>
              <Switch
                id="add-team-notify"
                checked={sendNotification}
                onCheckedChange={setSendNotification}
              />
            </div>

            <DialogFooter className="pt-2 flex-row justify-end gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedStudent(null)}
                disabled={isPending}
              >
                Back
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
                    Confirm & Enroll
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
