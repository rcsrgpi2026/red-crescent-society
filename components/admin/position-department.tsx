"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateTeamMemberPosition, updateTeamMemberRcyDepartment } from "@/lib/admin-actions";
import { NON_DEPARTMENT_POSITIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface PositionDepartmentProps {
  memberId: string;
  position: string;
  rcyDepartment: string | null;
  positionOptions: string[];
  departmentOptions: string[];
  /** Width classes for the position trigger (desktop vs mobile). */
  positionTriggerClassName?: string;
  departmentTriggerClassName?: string;
}

/**
 * Position + RCY department for one team member. Leadership positions (Team
 * Leader, Deputy Team Leader) are society-wide — they never carry an RCY
 * department, so the department selector is hidden and cleared when a leader
 * position is chosen.
 */
export function PositionDepartment({
  memberId,
  position,
  rcyDepartment,
  positionOptions,
  departmentOptions,
  positionTriggerClassName = "w-44",
  departmentTriggerClassName = "w-56",
}: PositionDepartmentProps) {
  const [currentPosition, setCurrentPosition] = useState(position);

  const isLeader = (NON_DEPARTMENT_POSITIONS as readonly string[]).includes(currentPosition);

  async function onPositionChange(next: string) {
    setCurrentPosition(next);
    const fd = new FormData();
    fd.set("id", memberId);
    fd.set("position", next);
    const result = await updateTeamMemberPosition(fd);
    if (result.success) {
      toast.success(result.message ?? "Position updated.");
    } else {
      toast.error(result.message ?? "Update failed.");
    }
  }

  async function onDepartmentChange(next: string) {
    const fd = new FormData();
    fd.set("id", memberId);
    fd.set("rcyDepartment", next);
    const result = await updateTeamMemberRcyDepartment(fd);
    if (result.success) {
      toast.success(result.message ?? "RCY department updated.");
    } else {
      toast.error(result.message ?? "Update failed.");
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5 md:flex-row md:items-center">
      <Select value={currentPosition} onValueChange={onPositionChange}>
        <SelectTrigger
          className={cn("h-8 min-w-0 text-xs", positionTriggerClassName)}
          aria-label="Update position"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {positionOptions.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!isLeader && (
        <Select
          value={rcyDepartment || "__none"}
          onValueChange={onDepartmentChange}
        >
          <SelectTrigger
            className={cn("h-8 min-w-0 text-xs", departmentTriggerClassName)}
            aria-label="Update RCY department"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">None</SelectItem>
            {departmentOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
