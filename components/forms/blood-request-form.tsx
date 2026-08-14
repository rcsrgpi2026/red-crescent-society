"use client";

import { FormShell, FieldError, SubmitButton } from "@/components/forms/form";
import { submitBloodRequest } from "@/lib/actions";
import { BLOOD_GROUPS } from "@/lib/constants";
import {
  Label,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui";

export function BloodRequestForm() {
  return (
    <FormShell action={submitBloodRequest}>
      {(errors) => (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="patientName">Patient name</Label>
              <Input id="patientName" name="patientName" placeholder="Name of the patient" className="mt-1.5" />
              <FieldError errors={errors} name="patientName" />
            </div>
            <div>
              <Label htmlFor="bloodGroup">Blood group needed</Label>
              <Select name="bloodGroup">
                <SelectTrigger id="bloodGroup" className="mt-1.5">
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
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="units">Required units (bags)</Label>
              <Input id="units" name="units" type="number" min={1} max={20} defaultValue={1} className="mt-1.5" />
              <FieldError errors={errors} name="units" />
            </div>
            <div>
              <Label htmlFor="hospital">Hospital (optional)</Label>
              <Input id="hospital" name="hospital" placeholder="e.g. Rajshahi Medical College Hospital" className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location / ward</Label>
            <Input id="location" name="location" placeholder="e.g. ICU, Ward 4 — RMCH" className="mt-1.5" />
            <FieldError errors={errors} name="location" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="requiredDate">Required date (optional)</Label>
              <Input id="requiredDate" name="requiredDate" type="date" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="requiredTime">Required time (optional)</Label>
              <Input id="requiredTime" name="requiredTime" placeholder="e.g. 10:00 AM" className="mt-1.5" />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="requesterName">Requester name</Label>
              <Input id="requesterName" name="requesterName" placeholder="Your name" className="mt-1.5" />
              <FieldError errors={errors} name="requesterName" />
            </div>
            <div>
              <Label htmlFor="contact">Your contact number</Label>
              <Input id="contact" name="contact" type="tel" placeholder="017XXXXXXXX" className="mt-1.5" />
              <FieldError errors={errors} name="contact" />
            </div>
          </div>

          <div>
            <Label>Emergency level</Label>
            <RadioGroup name="emergencyLevel" defaultValue="NORMAL" className="mt-1.5 flex gap-4">
              {[
                { value: "NORMAL", label: "Normal" },
                { value: "URGENT", label: "Urgent" },
                { value: "EMERGENCY", label: "Emergency" },
              ].map((level) => (
                <div key={level.value} className="flex items-center gap-2">
                  <RadioGroupItem value={level.value} id={`el-${level.value}`} />
                  <Label htmlFor={`el-${level.value}`} className="text-sm font-normal">
                    {level.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="additionalInfo">Additional information</Label>
            <Textarea
              id="additionalInfo"
              name="additionalInfo"
              rows={3}
              placeholder="Anything the society should know (optional)"
              className="mt-1.5"
            />
          </div>

          <SubmitButton variant="destructive" className="w-full sm:w-auto">
            Submit Blood Request
          </SubmitButton>
          <p className="text-xs text-muted-foreground">
            In a life-threatening emergency, always call the nearest blood bank or ambulance
            service first — this form is monitored by the society team but may not be instant.
          </p>
        </>
      )}
    </FormShell>
  );
}
