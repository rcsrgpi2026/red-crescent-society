"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  volunteerSchema,
  bloodRequestSchema,
  bloodDonorSchema,
  eventRegistrationSchema,
  contactSchema,
  donorContactSchema,
} from "@/lib/validation";

export async function adminLogin(email: string, password: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      message:
        "Supabase is not configured yet. Add your credentials (see README) before logging in.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { success: false, message: "Invalid credentials. Check your email and password." };
  }
  return { success: true, message: "Signed in" };
}

export interface ActionResult {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

function zodErrors(error: import("zod").ZodError): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    (result[key] ??= []).push(issue.message);
  }
  return result;
}

export async function joinVolunteer(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = volunteerSchema.safeParse({
    name: formData.get("name"),
    studentId: formData.get("studentId"),
    department: formData.get("department"),
    semester: formData.get("semester"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    bloodGroup: formData.get("bloodGroup"),
    area: formData.get("area"),
    emergencyContactName: formData.get("emergencyContactName"),
    emergencyContactPhone: formData.get("emergencyContactPhone"),
    skills: (formData.get("skills") as string)
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [],
    experience: formData.get("experience"),
    motivation: formData.get("motivation"),
  });

  if (!parsed.success) {
    return { success: false, errors: zodErrors(parsed.error) };
  }

  if (!isSupabaseConfigured) {
    return {
      success: false,
      message:
        "The database is not configured yet. Add your Supabase credentials (see README) and try again.",
    };
  }

  const v = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.from("volunteers").insert({
    name: v.name,
    student_id: v.studentId,
    department: v.department,
    semester: v.semester,
    phone: v.phone,
    email: v.email || null,
    blood_group: v.bloodGroup,
    area: v.area,
    emergency_contact_name: v.emergencyContactName,
    emergency_contact_phone: v.emergencyContactPhone,
    skills: v.skills,
    experience: v.experience || null,
    motivation: v.motivation,
    status: "PENDING",
    position: "Volunteer",
  });

  if (error) {
    console.error("joinVolunteer error:", error);
    return {
      success: false,
      message: "Something went wrong while submitting. Please try again.",
    };
  }

  return {
    success: true,
    message:
      "Application received! The society leadership will review it and approve your membership shortly.",
  };
}

export async function submitBloodRequest(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = bloodRequestSchema.safeParse({
    patientName: formData.get("patientName"),
    bloodGroup: formData.get("bloodGroup"),
    units: formData.get("units"),
    hospital: formData.get("hospital"),
    location: formData.get("location"),
    requiredDate: formData.get("requiredDate"),
    requiredTime: formData.get("requiredTime"),
    requesterName: formData.get("requesterName"),
    contact: formData.get("contact"),
    emergencyLevel: formData.get("emergencyLevel"),
    additionalInfo: formData.get("additionalInfo"),
  });

  if (!parsed.success) {
    return { success: false, errors: zodErrors(parsed.error) };
  }

  if (!isSupabaseConfigured) {
    return {
      success: false,
      message:
        "The database is not configured yet. Add your Supabase credentials (see README) and try again.",
    };
  }

  const v = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.from("blood_requests").insert({
    patient_name: v.patientName,
    blood_group: v.bloodGroup,
    units: v.units,
    hospital: v.hospital || null,
    location: v.location,
    required_date: v.requiredDate || null,
    required_time: v.requiredTime || null,
    requester_name: v.requesterName,
    contact: v.contact,
    emergency_level: v.emergencyLevel,
    additional_info: v.additionalInfo || null,
    status: "PENDING",
  });

  if (error) {
    console.error("submitBloodRequest error:", error);
    return {
      success: false,
      message: "Something went wrong while submitting. Please try again.",
    };
  }

  return {
    success: true,
    message:
      "Request submitted. The society leadership has been notified and will coordinate with donors. In an emergency, also call the nearest blood bank directly.",
  };
}

export async function registerDonor(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = bloodDonorSchema.safeParse({
    name: formData.get("name"),
    bloodGroup: formData.get("bloodGroup"),
    area: formData.get("area"),
    phone: formData.get("phone"),
    lastDonationDate: formData.get("lastDonationDate"),
  });

  if (!parsed.success) {
    return { success: false, errors: zodErrors(parsed.error) };
  }

  if (!isSupabaseConfigured) {
    return {
      success: false,
      message:
        "The database is not configured yet. Add your Supabase credentials (see README) and try again.",
    };
  }

  const v = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.from("blood_donors").insert({
    name: v.name,
    blood_group: v.bloodGroup,
    area: v.area,
    phone: v.phone,
    last_donation_date: v.lastDonationDate || null,
    availability: "AVAILABLE",
    is_active: true,
  });

  if (error) {
    console.error("registerDonor error:", error);
    return {
      success: false,
      message: "Something went wrong while registering. Please try again.",
    };
  }

  return {
    success: true,
    message:
      "You are now registered as a blood donor. Thank you for being a lifesaver! Your number stays private and is only visible to the society team.",
  };
}

export async function registerForEvent(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = eventRegistrationSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    department: formData.get("department"),
  });

  if (!parsed.success) {
    return { success: false, errors: zodErrors(parsed.error) };
  }

  if (!isSupabaseConfigured) {
    return {
      success: false,
      message:
        "The database is not configured yet. Add your Supabase credentials (see README) and try again.",
    };
  }

  const eventId = formData.get("eventId") as string;
  if (!eventId) return { success: false, message: "Missing event." };

  const v = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.from("event_registrations").insert({
    event_id: eventId,
    name: v.name,
    phone: v.phone,
    department: v.department || null,
    status: "REGISTERED",
  });

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        message: "You have already registered for this event with this phone number.",
      };
    }
    console.error("registerForEvent error:", error);
    return {
      success: false,
      message: "Something went wrong while registering. Please try again.",
    };
  }

  return {
    success: true,
    message: "You are registered! See you at the event.",
  };
}

export async function submitContact(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { success: false, errors: zodErrors(parsed.error) };
  }

  if (!isSupabaseConfigured) {
    return {
      success: false,
      message:
        "The database is not configured yet. Add your Supabase credentials (see README) and try again.",
    };
  }

  const v = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.from("contact_messages").insert({
    name: v.name,
    email: v.email || null,
    phone: v.phone || null,
    subject: v.subject,
    message: v.message,
    status: "NEW",
  });

  if (error) {
    console.error("submitContact error:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }

  return {
    success: true,
    message: "Message sent! The society leadership will get back to you.",
  };
}

export async function requestDonorContact(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = donorContactSchema.safeParse({
    donorId: formData.get("donorId"),
    requesterName: formData.get("requesterName"),
    requesterContact: formData.get("requesterContact"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { success: false, errors: zodErrors(parsed.error) };
  }

  if (!isSupabaseConfigured) {
    return {
      success: false,
      message:
        "The database is not configured yet. Add your Supabase credentials (see README) and try again.",
    };
  }

  const v = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.from("blood_contact_requests").insert({
    donor_id: v.donorId,
    requester_name: v.requesterName,
    requester_contact: v.requesterContact,
    message: v.message || null,
    status: "PENDING",
  });

  if (error) {
    console.error("requestDonorContact error:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }

  return {
    success: true,
    message:
      "Contact request sent! Our team will verify it and connect you with the donor. Donor numbers are never shown publicly.",
  };
}
