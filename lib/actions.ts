"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  teamMemberSchema,
  bloodRequestSchema,
  bloodDonorSchema,
  eventRegistrationSchema,
  contactSchema,
  donorContactSchema,
} from "@/lib/validation";

/**
 * Team members request to join a training. The request starts PENDING and
 * the admin approves it from the admin training panel.
 */
export async function joinTraining(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  if (!isSupabaseConfigured) {
    return { success: false, message: "The database is not configured yet." };
  }

  const trainingId = String(formData.get("trainingId") ?? "");
  if (!trainingId) return { success: false, message: "Training is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: "Sign in as a team member to join training." };
  }

  const { data: member } = await supabase
    .from("team_members")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member) {
    return { success: false, message: "Team member profile not found." };
  }
  if (member.status !== "APPROVED") {
    return {
      success: false,
      message: "Your membership must be approved before you can join training.",
    };
  }

  const { data: training } = await supabase
    .from("training")
    .select("status")
    .eq("id", trainingId)
    .maybeSingle();
  if (!training) {
    return { success: false, message: "Training not found." };
  }
  if (training.status !== "UPCOMING" && training.status !== "ONGOING") {
    return { success: false, message: "This training is not open for joining." };
  }

  const { data: existing } = await supabase
    .from("training_participants")
    .select("id, status")
    .eq("training_id", trainingId)
    .eq("volunteer_id", member.id)
    .maybeSingle();

  if (existing) {
    if (existing.status === "PENDING") {
      return { success: false, message: "You already requested to join this training." };
    }
    if (existing.status === "APPROVED" || existing.status === "COMPLETED") {
      return { success: false, message: "You are already enrolled in this training." };
    }
    // REJECTED or DROPPED → request again.
    const { error } = await supabase
      .from("training_participants")
      .update({ status: "PENDING" })
      .eq("id", existing.id);
    if (error) {
      console.error("joinTraining resubmit error:", error);
      return { success: false, message: "Something went wrong. Please try again." };
    }
    revalidatePath("/training");
    revalidatePath("/volunteer");
    return { success: true, message: "Request resubmitted — awaiting approval." };
  }

  const { error } = await supabase.from("training_participants").insert({
    training_id: trainingId,
    volunteer_id: member.id,
    status: "PENDING",
  });
  if (error) {
    console.error("joinTraining insert error:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
  revalidatePath("/training");
  revalidatePath("/volunteer");
  return { success: true, message: "Joining request sent — awaiting approval." };
}

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

export interface ActionResult<T = any> {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: T;
}

function zodErrors(error: import("zod").ZodError): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    (result[key] ??= []).push(issue.message);
  }
  return result;
}

export async function joinTeamMember(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = teamMemberSchema.safeParse({
    name: formData.get("name"),
    studentId: formData.get("studentId"),
    department: formData.get("department"),
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

  const { error } = await supabase.from("team_members").insert({
    name: v.name,
    student_id: v.studentId,
    department: v.department,
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
    position: "Team Member",
  });

  if (error) {
    console.error("joinTeamMember error:", error);
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
): Promise<ActionResult<{ id: string }>> {
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

  // Insert via a security-definer RPC: the row is written by the
  // function (bypassing RLS) and only the id is returned. A plain
  // insert + select("id") would ask PostgREST to re-read the row,
  // which needs a SELECT policy the table intentionally does not
  // have (requester contact info is private).
  const { data: id, error } = await supabase.rpc("submit_blood_request", {
    p_patient_name: v.patientName,
    p_blood_group: v.bloodGroup,
    p_units: v.units,
    p_hospital: v.hospital || null,
    p_location: v.location,
    p_required_date: v.requiredDate || null,
    p_required_time: v.requiredTime || null,
    p_requester_name: v.requesterName,
    p_contact: v.contact,
    p_emergency_level: v.emergencyLevel,
    p_additional_info: v.additionalInfo || null,
  });

  if (error || !id) {
    console.error("submitBloodRequest error:", error);
    return {
      success: false,
      message: "Something went wrong while submitting. Please try again.",
    };
  }

  return {
    success: true,
    message:
      "Request submitted successfully! Tracking your request in the status interface.",
    data: { id: String(id) },
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
    passcode: formData.get("passcode"),
    phonePublic: formData.get("phonePublic") === "on",
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let volunteerId: string | null = null;
  let studentId: string | null = null;
  if (user) {
    const [vol, stu] = await Promise.all([
      supabase.from("team_members").select("id").eq("user_id", user.id).maybeSingle(),
      supabase.from("students").select("id").eq("user_id", user.id).maybeSingle(),
    ]);
    volunteerId = vol.data?.id ?? null;
    studentId = stu.data?.id ?? null;
  }

  // Registered via a security-definer RPC so the passcode can be
  // bcrypt-hashed in the database before it is ever stored.
  const { error } = await supabase.rpc("register_donor", {
    p_name: v.name,
    p_blood_group: v.bloodGroup,
    p_area: v.area,
    p_phone: v.phone,
    p_last_donation_date: v.lastDonationDate || null,
    p_passcode: v.passcode,
    p_volunteer_id: volunteerId,
    p_student_id: studentId,
    p_phone_public: v.phonePublic,
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
      "You are now registered as a blood donor. Thank you for being a lifesaver! Your passcode keeps your listing safe — use your name, number and passcode to manage it (including changing your number's visibility) anytime.",
  };
}

export interface DonorListingInfo {
  id: string;
  name: string;
  blood_group: string;
  area: string | null;
  availability: string;
  /** True when the listing was registered before passcodes existed. */
  needsPasscode: boolean;
  /** Whether the donor opted in to showing their number publicly. */
  phonePublic: boolean;
}

/**
 * Finds a donor listing by the name, phone and passcode used at
 * registration. Verification happens inside the security-definer SQL
 * function, which never exposes the stored phone number or passcode.
 */
export async function findMyDonorListing(
  phone: string,
  name: string,
  passcode: string
): Promise<ActionResult<DonorListingInfo>> {
  if (!isSupabaseConfigured) {
    return { success: false, message: "The database is not configured yet." };
  }

  const pPhone = String(phone ?? "").trim();
  const pName = String(name ?? "").trim();
  const pPasscode = String(passcode ?? "").trim();
  if (!pPhone || !pName) {
    return {
      success: false,
      message: "Enter both your name and the phone number you registered with.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("find_my_donor", {
    p_phone: pPhone,
    p_name: pName,
    p_passcode: pPasscode,
  });

  if (error) {
    console.error("findMyDonorListing error:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }

  // The RPC returns snake_case columns — map them to the camelCase
  // shape the UI expects.
  const rows = (data ?? []) as {
    id: string;
    name: string;
    blood_group: string;
    area: string | null;
    availability: string;
    needs_passcode: boolean;
    phone_public: boolean;
  }[];
  if (rows.length === 0) {
    return {
      success: false,
      message:
        "No donor listing found with that name and phone number. Check your details or register below.",
    };
  }

  const row = rows[0];
  return {
    success: true,
    data: {
      id: row.id,
      name: row.name,
      blood_group: row.blood_group,
      area: row.area,
      availability: row.availability,
      needsPasscode: row.needs_passcode,
      phonePublic: row.phone_public,
    },
  };
}

/**
 * Opts the caller's listing in / out of showing the number publicly.
 * Returns the new state.
 */
export async function toggleDonorPhonePublic(
  donorId: string,
  phone: string,
  name: string,
  passcode: string
): Promise<ActionResult<boolean>> {
  if (!isSupabaseConfigured) {
    return { success: false, message: "The database is not configured yet." };
  }

  const pPhone = String(phone ?? "").trim();
  const pName = String(name ?? "").trim();
  const pPasscode = String(passcode ?? "").trim();
  if (!donorId || !pPhone || !pName) {
    return { success: false, message: "Missing donor details. Please search for your listing again." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("toggle_my_donor_phone_public", {
    p_donor_id: donorId,
    p_phone: pPhone,
    p_name: pName,
    p_passcode: pPasscode,
  });

  if (error) {
    console.error("toggleDonorPhonePublic error:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
  if (data === null || data === undefined) {
    return {
      success: false,
      message: "Could not verify your listing. Check your name, number and passcode.",
    };
  }
  return { success: true, data: Boolean(data) };
}

/**
 * Sets a passcode on a listing that was registered before passcodes
 * existed (verified by name + phone only).
 */
export async function setMyDonorPasscode(
  donorId: string,
  phone: string,
  name: string,
  passcode: string
): Promise<ActionResult<boolean>> {
  if (!isSupabaseConfigured) {
    return { success: false, message: "The database is not configured yet." };
  }

  const pPhone = String(phone ?? "").trim();
  const pName = String(name ?? "").trim();
  const pPasscode = String(passcode ?? "").trim();
  if (!donorId || !pPhone || !pName) {
    return { success: false, message: "Missing donor details. Please search for your listing again." };
  }
  if (!/^\d{4,6}$/.test(pPasscode)) {
    return { success: false, message: "Enter a 4–6 digit passcode (numbers only)." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_my_donor_passcode", {
    p_donor_id: donorId,
    p_phone: pPhone,
    p_name: pName,
    p_passcode: pPasscode,
  });

  if (error) {
    console.error("setMyDonorPasscode error:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
  if (!data) {
    return {
      success: false,
      message: "Could not set your passcode. Make sure the name and number match your listing.",
    };
  }
  return { success: true, data: true };
}

/**
 * Toggles the caller's own listing between available and unavailable, keyed
 * by the name + phone used at registration. Returns the new availability.
 */
export async function toggleDonorAvailabilityByPhone(
  donorId: string,
  phone: string,
  name: string,
  passcode: string
): Promise<ActionResult<string>> {
  if (!isSupabaseConfigured) {
    return { success: false, message: "The database is not configured yet." };
  }

  const pPhone = String(phone ?? "").trim();
  const pName = String(name ?? "").trim();
  const pPasscode = String(passcode ?? "").trim();
  if (!donorId || !pPhone || !pName) {
    return { success: false, message: "Missing donor details. Please search for your listing again." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("toggle_my_donor_availability", {
    p_donor_id: donorId,
    p_phone: pPhone,
    p_name: pName,
    p_passcode: pPasscode,
  });

  if (error) {
    console.error("toggleDonorAvailabilityByPhone error:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
  if (!data) {
    return {
      success: false,
      message: "Could not verify your listing. Check your name and phone number.",
    };
  }
  return { success: true, data: String(data) };
}

/**
 * Permanently removes the caller's own donor listing, keyed by the name +
 * phone used at registration.
 */
export async function removeDonorListingByPhone(
  donorId: string,
  phone: string,
  name: string,
  passcode: string
): Promise<ActionResult> {
  if (!isSupabaseConfigured) {
    return { success: false, message: "The database is not configured yet." };
  }

  const pPhone = String(phone ?? "").trim();
  const pName = String(name ?? "").trim();
  const pPasscode = String(passcode ?? "").trim();
  if (!donorId || !pPhone || !pName) {
    return { success: false, message: "Missing donor details. Please search for your listing again." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("remove_my_donor_listing", {
    p_donor_id: donorId,
    p_phone: pPhone,
    p_name: pName,
    p_passcode: pPasscode,
  });

  if (error) {
    console.error("removeDonorListingByPhone error:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
  if (!data) {
    return {
      success: false,
      message: "Could not verify your listing. Check your name and phone number.",
    };
  }
  return {
    success: true,
    message: "Your donor listing has been removed. You can register again anytime.",
  };
}

export async function toggleMyDonorAvailability(
  availability: "AVAILABLE" | "UNAVAILABLE"
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "You must be signed in to manage donor status." };
  }

  const { data: vol } = await supabase
    .from("team_members")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!vol) {
    return { success: false, message: "Team member profile not found." };
  }

  const { error } = await supabase
    .from("blood_donors")
    .update({ availability, is_active: availability === "AVAILABLE" })
    .eq("volunteer_id", vol.id);

  if (error) {
    return { success: false, message: "Failed to update donor availability." };
  }

  return { success: true, message: `Availability updated to ${availability.toLowerCase()}.` };
}

export async function removeMyDonorListing(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "You must be signed in." };
  }

  const { data: vol } = await supabase
    .from("team_members")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!vol) {
    return { success: false, message: "Team member profile not found." };
  }

  // Deactivate listing without deleting profile or account
  const { error } = await supabase
    .from("blood_donors")
    .update({ availability: "UNAVAILABLE", is_active: false })
    .eq("volunteer_id", vol.id);

  if (error) {
    return { success: false, message: "Failed to remove donor listing." };
  }

  return {
    success: true,
    message:
      "You have been removed from active donor listings. Your volunteer profile remains intact.",
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

  // Tag the registration with the signed-in user's own identity, so the
  // admin panel can show whether a registrant is a team member (member ID)
  // or a student (roll). The RLS insert policy only allows the caller's own
  // volunteer_id / student_id, so a visitor can't misattribute someone else.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let volunteerId: string | null = null;
  let studentId: string | null = null;
  if (user) {
    const [teamRes, studentRes] = await Promise.all([
      supabase.from("team_members").select("id").eq("user_id", user.id).maybeSingle(),
      supabase.from("students").select("id").eq("user_id", user.id).maybeSingle(),
    ]);
    volunteerId = teamRes.data?.id ?? null;
    studentId = studentRes.data?.id ?? null;
  }

  const { error } = await supabase.from("event_registrations").insert({
    event_id: eventId,
    volunteer_id: volunteerId,
    student_id: studentId,
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
): Promise<ActionResult<{ id: string }>> {
  const parsed = donorContactSchema.safeParse({
    donorId: formData.get("donorId"),
    requesterName: formData.get("requesterName"),
    requesterContact: formData.get("requesterContact"),
    patientName: formData.get("patientName"),
    bloodGroupNeeded: formData.get("bloodGroupNeeded"),
    hospital: formData.get("hospital"),
    email: formData.get("email"),
    message: formData.get("message"),
    passcode: formData.get("passcode"),
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

  // Insert via a security-definer RPC so we can return the id for the
  // tracking link (a plain insert + select("id") would need a SELECT
  // policy the table intentionally does not have).
  const { data: id, error } = await supabase.rpc("submit_contact_request", {
    p_donor_id: v.donorId,
    p_requester_name: v.requesterName,
    p_requester_contact: v.requesterContact,
    p_patient_name: v.patientName,
    p_blood_group: v.bloodGroupNeeded,
    p_hospital: v.hospital || null,
    p_email: v.email || null,
    p_message: v.message || null,
    p_passcode: v.passcode,
  });

  if (error || !id) {
    console.error("requestDonorContact error:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }

  return {
    success: true,
    message:
      "Contact request sent! Keep this tracking link and your passcode — the donor's number will appear here once the society team approves it.",
    data: { id: String(id) },
  };
}

export interface ContactRequestTrackingInfo {
  requestId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  donorName: string;
  donorBloodGroup: string;
  donorArea: string | null;
  donorPhone: string | null;
}

/**
 * Tracks a contact request by its id plus the contact number the
 * requester submitted (the number doubles as the credential). The
 * donor's phone is only returned once the admin has approved the
 * request — the verification happens inside the security-definer
 * SQL function, which never exposes the stored contact number.
 */
export async function trackMyContactRequest(
  requestId: string,
  contact: string,
  passcode: string
): Promise<ActionResult<ContactRequestTrackingInfo>> {
  if (!isSupabaseConfigured) {
    return { success: false, message: "The database is not configured yet." };
  }

  const pId = String(requestId ?? "").trim();
  const pContact = String(contact ?? "").trim();
  const pPasscode = String(passcode ?? "").trim();
  if (!pId || !pContact) {
    return {
      success: false,
      message: "Enter the contact number you used when submitting the request.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_contact_request", {
    p_request_id: pId,
    p_contact: pContact,
    p_passcode: pPasscode,
  });

  if (error) {
    console.error("trackMyContactRequest error:", error);
    return { success: false, message: "Could not load your request. Please try again." };
  }

  const row = Array.isArray(data) ? data[0] : undefined;
  if (!row) {
    return {
      success: false,
      message:
        "No request found for this tracking link and contact number. Check the number and try again.",
    };
  }

  return {
    success: true,
    data: {
      requestId: row.request_id,
      status: row.status,
      donorName: row.donor_name,
      donorBloodGroup: row.donor_blood_group,
      donorArea: row.donor_area,
      donorPhone: row.donor_phone,
    },
  };
}

export interface ContactRequestRecoveryInfo {
  requestId: string;
  donorName: string;
  donorBloodGroup: string;
  donorArea: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

/**
 * Recovers a requester's contact request ids after losing the
 * tracking link. Verification (name + contact number) happens inside
 * the security-definer SQL function — the donor's phone is never
 * returned here, only the tracking ids and statuses.
 */
export async function findMyContactRequests(
  name: string,
  contact: string,
  passcode: string
): Promise<ActionResult<ContactRequestRecoveryInfo[]>> {
  if (!isSupabaseConfigured) {
    return { success: false, message: "The database is not configured yet." };
  }

  const pName = String(name ?? "").trim();
  const pContact = String(contact ?? "").trim();
  const pPasscode = String(passcode ?? "").trim();
  if (!pName || !pContact) {
    return {
      success: false,
      message: "Enter both your name and the contact number you submitted.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("find_my_contact_requests", {
    p_name: pName,
    p_contact: pContact,
    p_passcode: pPasscode,
  });

  if (error) {
    console.error("findMyContactRequests error:", error);
    return { success: false, message: "Could not look up your requests. Please try again." };
  }

  const rows = Array.isArray(data) ? data : [];
  return {
    success: true,
    data: rows.map((row) => ({
      requestId: row.request_id,
      donorName: row.donor_name,
      donorBloodGroup: row.donor_blood_group,
      donorArea: row.donor_area,
      status: row.status,
      createdAt: row.created_at,
    })),
  };
}
