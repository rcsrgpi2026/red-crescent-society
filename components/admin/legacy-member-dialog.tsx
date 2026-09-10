"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Award, GraduationCap, Sparkles } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { updateTeamMemberLegacyStatus } from "@/lib/admin-actions";
import type { TeamMember } from "@/types/database";

interface LegacyMemberDialogProps {
  member: TeamMember;
  trigger?: React.ReactNode;
}

export function LegacyMemberDialog({ member, trigger }: LegacyMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [isLegacy, setIsLegacy] = useState<boolean>(member.is_legacy ?? false);
  const [legacyDesignation, setLegacyDesignation] = useState(
    member.legacy_designation ?? (member.position ? `Former ${member.position}` : "Former Member")
  );
  const [legacyTenure, setLegacyTenure] = useState(
    member.legacy_tenure ?? (member.session ? `Session ${member.session}` : "")
  );
  const [legacyNote, setLegacyNote] = useState(member.legacy_note ?? "");

  const handleSave = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", member.id);
      formData.set("isLegacy", isLegacy ? "true" : "false");
      formData.set("legacyDesignation", legacyDesignation);
      formData.set("legacyTenure", legacyTenure);
      formData.set("legacyNote", legacyNote);

      const res = await updateTeamMemberLegacyStatus(formData);
      if (res.success) {
        toast.success(res.message);
        setOpen(false);
      } else {
        toast.error(res.message);
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
            className={
              member.is_legacy
                ? "border-amber-400/60 bg-amber-50 text-amber-900 hover:bg-amber-100"
                : "text-muted-foreground hover:text-foreground"
            }
          >
            <GraduationCap className="mr-1.5 h-3.5 w-3.5" />
            {member.is_legacy ? "Legacy Member" : "Mark as Legacy"}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Legacy Member Status
              </DialogTitle>
              <DialogDescription className="text-xs">
                {member.name} ({member.member_id ?? "No ID"})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Toggle status */}
          <div className="flex items-center justify-between rounded-xl border border-line bg-mist/60 p-3.5">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold text-foreground">
                Mark as Legacy Member
              </Label>
              <p className="text-xs text-muted-foreground">
                Outgoing seniors / passed 7th semester members shown in the Hall of Fame.
              </p>
            </div>
            <Switch
              checked={isLegacy}
              onCheckedChange={setIsLegacy}
              aria-label="Toggle legacy status"
            />
          </div>

          {isLegacy && (
            <div className="space-y-3.5 rounded-xl border border-amber-200/80 bg-amber-50/40 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-800">
                <Sparkles className="h-3.5 w-3.5" />
                Legacy Profile Details
              </div>

              <div>
                <Label htmlFor="legacy-designation" className="text-xs font-medium">
                  Former Designation / Title
                </Label>
                <Input
                  id="legacy-designation"
                  value={legacyDesignation}
                  onChange={(e) => setLegacyDesignation(e.target.value)}
                  placeholder="e.g. Former Team Leader, Ex-Deputy Leader"
                  className="mt-1 bg-white text-xs"
                />
              </div>

              <div>
                <Label htmlFor="legacy-tenure" className="text-xs font-medium">
                  Tenure / Service Period
                </Label>
                <Input
                  id="legacy-tenure"
                  value={legacyTenure}
                  onChange={(e) => setLegacyTenure(e.target.value)}
                  placeholder="e.g. 2023 – 2025 or Session 2021-22"
                  className="mt-1 bg-white text-xs"
                />
              </div>

              <div>
                <Label htmlFor="legacy-note" className="text-xs font-medium">
                  Farewell Note / Legacy Quote (Optional)
                </Label>
                <Textarea
                  id="legacy-note"
                  value={legacyNote}
                  onChange={(e) => setLegacyNote(e.target.value)}
                  placeholder="A short inspirational message, memory, or farewell advice for juniors..."
                  rows={3}
                  className="mt-1 bg-white text-xs"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="bg-brand text-white hover:bg-brand-dark"
          >
            {isPending ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
