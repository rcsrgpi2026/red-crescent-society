"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormShell, FieldError, SubmitButton } from "@/components/forms/form";
import { submitBloodRequest, type ActionResult } from "@/lib/actions";
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
import type { FormFieldConfig } from "@/types/form-editor";

export function BloodRequestForm({ fields }: { fields?: FormFieldConfig[] }) {
  const router = useRouter();

  const isEnabled = (name: string) => fields?.find((f) => f.name === name)?.enabled ?? true;
  const getLabel = (name: string, fallback: string) => fields?.find((f) => f.name === name)?.label || fallback;
  const getPlaceholder = (name: string, fallback: string) => fields?.find((f) => f.name === name)?.placeholder || fallback;
  const isRequired = (name: string, fallback: boolean) => fields?.find((f) => f.name === name)?.required ?? fallback;
  const customFields = fields?.filter((f) => !f.isCore && f.enabled) ?? [];

  const [formData, setFormData] = useState({
    patientName: "",
    bloodGroup: "",
    units: "1",
    hospital: "",
    location: "",
    requiredDate: "",
    requiredTime: "",
    requesterName: "",
    contact: "",
    emergencyLevel: "NORMAL",
    additionalInfo: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  async function handleAction(prev: ActionResult, fd: FormData): Promise<ActionResult> {
    const result = await submitBloodRequest(prev, fd);
    if (result.success && result.data?.id) {
      router.push(`/blood-support/request/${result.data.id}`);
    }
    return result;
  }

  return (
    <FormShell action={handleAction}>
      {(errors) => (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            {isEnabled("patientName") && (
              <div>
                <Label htmlFor="patientName">
                  {getLabel("patientName", "Patient name")}{" "}
                  {isRequired("patientName", true) && <span className="text-crescent">*</span>}
                </Label>
                <Input
                  id="patientName"
                  name="patientName"
                  value={formData.patientName}
                  onChange={(e) => handleChange("patientName", e.target.value)}
                  placeholder={getPlaceholder("patientName", "Name of the patient")}
                  className="mt-1.5"
                  required={isRequired("patientName", true)}
                />
                <FieldError errors={errors} name="patientName" />
              </div>
            )}
            {isEnabled("bloodGroup") && (
              <div>
                <Label htmlFor="bloodGroup">
                  {getLabel("bloodGroup", "Blood group needed")}{" "}
                  {isRequired("bloodGroup", true) && <span className="text-crescent">*</span>}
                </Label>
                <Select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onValueChange={(val) => handleChange("bloodGroup", val)}
                  required={isRequired("bloodGroup", true)}
                >
                  <SelectTrigger id="bloodGroup" className="mt-1.5">
                    <SelectValue placeholder={getPlaceholder("bloodGroup", "Select blood group")} />
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
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {isEnabled("units") && (
              <div>
                <Label htmlFor="units">
                  {getLabel("units", "Required units (bags)")}{" "}
                  {isRequired("units", true) && <span className="text-crescent">*</span>}
                </Label>
                <Input
                  id="units"
                  name="units"
                  type="number"
                  min={1}
                  max={20}
                  value={formData.units}
                  onChange={(e) => handleChange("units", e.target.value)}
                  className="mt-1.5"
                  required={isRequired("units", true)}
                />
                <FieldError errors={errors} name="units" />
              </div>
            )}
            {isEnabled("hospital") && (
              <div>
                <Label htmlFor="hospital">
                  {getLabel("hospital", "Hospital (optional)")}{" "}
                  {isRequired("hospital", false) && <span className="text-crescent">*</span>}
                </Label>
                <Input
                  id="hospital"
                  name="hospital"
                  value={formData.hospital}
                  onChange={(e) => handleChange("hospital", e.target.value)}
                  placeholder={getPlaceholder("hospital", "e.g. Rajshahi Medical College Hospital")}
                  className="mt-1.5"
                  required={isRequired("hospital", false)}
                />
              </div>
            )}
          </div>

          {isEnabled("location") && (
            <div>
              <Label htmlFor="location">
                {getLabel("location", "Location / ward")}{" "}
                {isRequired("location", true) && <span className="text-crescent">*</span>}
              </Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder={getPlaceholder("location", "e.g. ICU, Ward 4 — RMCH")}
                className="mt-1.5"
                required={isRequired("location", true)}
              />
              <FieldError errors={errors} name="location" />
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            {isEnabled("requiredDate") && (
              <div>
                <Label htmlFor="requiredDate">
                  {getLabel("requiredDate", "Required date (optional)")}{" "}
                  {isRequired("requiredDate", false) && <span className="text-crescent">*</span>}
                </Label>
                <Input
                  id="requiredDate"
                  name="requiredDate"
                  type="date"
                  value={formData.requiredDate}
                  onChange={(e) => handleChange("requiredDate", e.target.value)}
                  className="mt-1.5"
                  required={isRequired("requiredDate", false)}
                />
              </div>
            )}
            {isEnabled("requiredTime") && (
              <div>
                <Label htmlFor="requiredTime">
                  {getLabel("requiredTime", "Required time (optional)")}{" "}
                  {isRequired("requiredTime", false) && <span className="text-crescent">*</span>}
                </Label>
                <Input
                  id="requiredTime"
                  name="requiredTime"
                  value={formData.requiredTime}
                  onChange={(e) => handleChange("requiredTime", e.target.value)}
                  placeholder={getPlaceholder("requiredTime", "e.g. 10:00 AM")}
                  className="mt-1.5"
                  required={isRequired("requiredTime", false)}
                />
              </div>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {isEnabled("requesterName") && (
              <div>
                <Label htmlFor="requesterName">
                  {getLabel("requesterName", "Requester name")}{" "}
                  {isRequired("requesterName", true) && <span className="text-crescent">*</span>}
                </Label>
                <Input
                  id="requesterName"
                  name="requesterName"
                  value={formData.requesterName}
                  onChange={(e) => handleChange("requesterName", e.target.value)}
                  placeholder={getPlaceholder("requesterName", "Your name")}
                  className="mt-1.5"
                  required={isRequired("requesterName", true)}
                />
                <FieldError errors={errors} name="requesterName" />
              </div>
            )}
            {isEnabled("contact") && (
              <div>
                <Label htmlFor="contact">
                  {getLabel("contact", "Your contact number")}{" "}
                  {isRequired("contact", true) && <span className="text-crescent">*</span>}
                </Label>
                <Input
                  id="contact"
                  name="contact"
                  type="tel"
                  value={formData.contact}
                  onChange={(e) => handleChange("contact", e.target.value)}
                  placeholder={getPlaceholder("contact", "017XXXXXXXX")}
                  className="mt-1.5"
                  required={isRequired("contact", true)}
                />
                <FieldError errors={errors} name="contact" />
              </div>
            )}
          </div>

          {isEnabled("emergencyLevel") && (
            <div>
              <Label>{getLabel("emergencyLevel", "Emergency level")}</Label>
              <RadioGroup
                name="emergencyLevel"
                value={formData.emergencyLevel}
                onValueChange={(val) => handleChange("emergencyLevel", val)}
                className="mt-1.5 flex gap-4"
              >
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
          )}

          {isEnabled("additionalInfo") && (
            <div>
              <Label htmlFor="additionalInfo">
                {getLabel("additionalInfo", "Additional information")}{" "}
                {isRequired("additionalInfo", false) && <span className="text-crescent">*</span>}
              </Label>
              <Textarea
                id="additionalInfo"
                name="additionalInfo"
                rows={3}
                value={formData.additionalInfo}
                onChange={(e) => handleChange("additionalInfo", e.target.value)}
                placeholder={getPlaceholder("additionalInfo", "Anything the society should know (optional)")}
                className="mt-1.5"
                required={isRequired("additionalInfo", false)}
              />
            </div>
          )}

          {/* Dynamic Custom Fields */}
          {customFields.map((cf) => (
            <div key={cf.id}>
              <Label htmlFor={`cf-${cf.id}`}>
                {cf.label} {cf.required && <span className="text-crescent">*</span>}
              </Label>
              {cf.type === "textarea" ? (
                <Textarea
                  id={`cf-${cf.id}`}
                  name={cf.name}
                  placeholder={cf.placeholder}
                  required={cf.required}
                  rows={3}
                  className="mt-1.5 text-xs"
                />
              ) : (
                <Input
                  id={`cf-${cf.id}`}
                  name={cf.name}
                  type={cf.type}
                  placeholder={cf.placeholder}
                  required={cf.required}
                  className="mt-1.5"
                />
              )}
            </div>
          ))}

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
