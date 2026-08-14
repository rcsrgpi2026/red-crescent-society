import { z } from "zod";

const phoneRegex = /^(\+?88)?01[3-9]\d{8}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const volunteerSchema = z.object({
  name: z.string().min(3, "Please enter your full name").max(100),
  studentId: z.string().min(1, "Student ID is required").max(30),
  department: z.string().min(1, "Select your department"),
  semester: z.string().min(1, "Select your semester"),
  phone: z.string().regex(phoneRegex, "Enter a valid Bangladeshi mobile number (e.g. 017XXXXXXXX)"),
  email: z.string().regex(emailRegex, "Enter a valid email address").optional().or(z.literal("")),
  bloodGroup: z.string().min(1, "Select your blood group"),
  area: z.string().min(2, "Enter your area / address").max(200),
  emergencyContactName: z.string().min(2, "Emergency contact name is required").max(100),
  emergencyContactPhone: z.string().regex(phoneRegex, "Enter a valid emergency contact number"),
  skills: z.array(z.string()).max(10).default([]),
  experience: z.string().max(2000).optional().or(z.literal("")),
  motivation: z.string().min(20, "Tell us a little more about why you want to join (min 20 characters)").max(2000),
});

export type VolunteerFormValues = z.infer<typeof volunteerSchema>;

export const bloodRequestSchema = z.object({
  patientName: z.string().min(2, "Patient name is required").max(100),
  bloodGroup: z.string().min(1, "Select the required blood group"),
  units: z.coerce.number().int().min(1, "At least 1 unit").max(20, "Maximum 20 units"),
  hospital: z.string().max(200).optional().or(z.literal("")),
  location: z.string().min(2, "Location is required").max(200),
  requiredDate: z.string().optional().or(z.literal("")),
  requiredTime: z.string().max(20).optional().or(z.literal("")),
  requesterName: z.string().min(2, "Requester name is required").max(100),
  contact: z
    .string()
    .regex(phoneRegex, "Enter a valid Bangladeshi mobile number (e.g. 017XXXXXXXX)"),
  emergencyLevel: z.enum(["EMERGENCY", "URGENT", "NORMAL"]),
  additionalInfo: z.string().max(2000).optional().or(z.literal("")),
});

export type BloodRequestFormValues = z.infer<typeof bloodRequestSchema>;

export const bloodDonorSchema = z.object({
  name: z.string().min(2, "Your name is required").max(100),
  bloodGroup: z.string().min(1, "Select your blood group"),
  area: z.string().min(2, "Your area is required").max(200),
  phone: z.string().regex(phoneRegex, "Enter a valid Bangladeshi mobile number"),
  lastDonationDate: z.string().optional().or(z.literal("")),
});

export type BloodDonorFormValues = z.infer<typeof bloodDonorSchema>;

export const eventRegistrationSchema = z.object({
  name: z.string().min(2, "Your name is required").max(100),
  phone: z.string().regex(phoneRegex, "Enter a valid Bangladeshi mobile number"),
  department: z.string().max(100).optional().or(z.literal("")),
});

export type EventRegistrationFormValues = z.infer<typeof eventRegistrationSchema>;

export const contactSchema = z.object({
  name: z.string().min(2, "Your name is required").max(100),
  email: z.string().regex(emailRegex, "Enter a valid email address").optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  subject: z.string().min(2, "Subject is required").max(200),
  message: z.string().min(10, "Message must be at least 10 characters").max(4000),
});

export type ContactFormValues = z.infer<typeof contactSchema>;

export const donorContactSchema = z.object({
  donorId: z.string().min(1, "Donor is required"),
  requesterName: z.string().min(2, "Your name is required").max(100),
  requesterContact: z
    .string()
    .regex(phoneRegex, "Enter a valid Bangladeshi mobile number"),
  message: z.string().max(1000).optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().regex(emailRegex, "Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
