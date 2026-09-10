"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Network, Check, Loader2, Trash2 } from "lucide-react";
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
import { Input, Label } from "@/components/ui";
import {
  COMMUNITY_LEVELS,
  COMMUNITY_POSITIONS,
  getCommunityMappingForPosition,
} from "@/lib/constants";
import {
  addTeamMemberToCommunity,
  removeTeamMemberFromCommunity,
} from "@/lib/admin-actions";
import { cn } from "@/lib/utils";

interface AddToCommunityDialogProps {
  member: {
    id: string;
    name: string;
    position: string;
    rcy_department: string | null;
    photo_url: string | null;
    status: string;
  };
  linkedCommunityMember?: {
    id: string;
    level: number;
    position: string;
    sub_role: string | null;
    display_order: number;
  } | null;
  trigger?: React.ReactNode;
}

export function AddToCommunityDialog({
  member,
  linkedCommunityMember,
  trigger,
}: AddToCommunityDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Auto-calculated mapping based on current executive position
  const defaultMapping = getCommunityMappingForPosition(
    member.position,
    member.rcy_department
  );

  const currentLevel = linkedCommunityMember?.level ?? defaultMapping.level;
  const currentPosition = linkedCommunityMember?.position ?? defaultMapping.position;
  const currentSubRole = linkedCommunityMember
    ? (linkedCommunityMember.sub_role ?? "")
    : (defaultMapping.subRole ?? "");
  const currentOrder = linkedCommunityMember?.display_order ?? 0;

  async function handleAddOrUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);

    const formData = new FormData(e.currentTarget);
    formData.set("teamMemberId", member.id);

    try {
      const result = await addTeamMemberToCommunity(formData);
      if (result.success) {
        toast.success(result.message ?? "Added to Community tree.");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.message ?? "Failed to update community member.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!confirm(`Remove ${member.name} from the Community tree?`)) return;
    setBusy(true);

    const formData = new FormData();
    formData.set("teamMemberId", member.id);

    try {
      const result = await removeTeamMemberFromCommunity(formData);
      if (result.success) {
        toast.success(result.message ?? "Removed from Community tree.");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.message ?? "Failed to remove from community tree.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-7 px-2 text-xs font-semibold transition-colors",
              linkedCommunityMember
                ? "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={
              linkedCommunityMember
                ? `In Community (Level ${linkedCommunityMember.level})`
                : "Add to Community Leadership Tree"
            }
          >
            {linkedCommunityMember ? (
              <>
                <Check className="mr-1 h-3.5 w-3.5 text-teal-600" />
                <span>Tree L{linkedCommunityMember.level}</span>
              </>
            ) : (
              <>
                <Network className="mr-1 h-3.5 w-3.5 text-teal-600" />
                <span>Add to Community</span>
              </>
            )}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Network className="h-5 w-5 text-teal-600" />
            {linkedCommunityMember ? "Community Tree Membership" : "Add to Community Tree"}
          </DialogTitle>
          <DialogDescription>
            Place <strong>{member.name}</strong> into the public Community Leadership Tree
            according to their executive position.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAddOrUpdate} className="space-y-4 pt-1">
          {/* Executive Position Preview */}
          <div className="rounded-xl border border-line bg-mist/60 p-3 text-xs space-y-1">
            <p className="text-muted-foreground">
              Current Roster Position:{" "}
              <strong className="text-foreground">{member.position || "General Member"}</strong>
            </p>
            {member.rcy_department && (
              <p className="text-muted-foreground">
                Wing / Department:{" "}
                <strong className="text-foreground">{member.rcy_department}</strong>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="comm-level" className="text-xs">Tree Level</Label>
              <select
                id="comm-level"
                name="level"
                defaultValue={currentLevel}
                className="mt-1 h-8 w-full rounded-md border border-input bg-white px-2.5 text-xs font-medium"
              >
                {COMMUNITY_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    Level {l.value} — {l.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="comm-pos" className="text-xs">Tree Designation</Label>
              <Input
                id="comm-pos"
                name="position"
                defaultValue={currentPosition}
                list="comm-positions-list"
                className="mt-1 h-8 text-xs font-semibold uppercase"
                placeholder="e.g. GROUP LEADER"
              />
              <datalist id="comm-positions-list">
                {COMMUNITY_POSITIONS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <Label htmlFor="comm-sub" className="text-xs">Sub-role / Wing (Optional)</Label>
            <Input
              id="comm-sub"
              name="subRole"
              defaultValue={currentSubRole}
              placeholder="e.g. ICT Media & Communication"
              className="mt-1 h-8 text-xs"
            />
          </div>

          <div>
            <Label htmlFor="comm-order" className="text-xs">Display Order (within Level)</Label>
            <Input
              id="comm-order"
              name="displayOrder"
              type="number"
              defaultValue={currentOrder}
              className="mt-1 h-8 text-xs tabular-nums"
            />
          </div>

          <DialogFooter className="flex flex-row items-center justify-between gap-2 pt-2 sm:justify-between">
            {linkedCommunityMember ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={busy}
                className="text-crescent hover:bg-crescent-soft text-xs"
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Remove from Tree
              </Button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={busy}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs"
              >
                {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                {linkedCommunityMember ? "Save Changes" : "Confirm & Add"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
