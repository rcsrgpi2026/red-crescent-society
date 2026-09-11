export type FieldType = "text" | "number" | "email" | "tel" | "textarea" | "select" | "checkbox";

export interface FormFieldConfig {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  type: FieldType;
  required: boolean;
  enabled: boolean;
  isCore?: boolean;
  options?: string[]; // for select
  helpText?: string;
  order: number;
}

export interface FormConfig {
  key: string;
  title: string;
  description: string;
  fields: FormFieldConfig[];
}

export type FormKey = "event_registration" | "volunteer_application" | "blood_request" | "contact";

export const DEFAULT_FORM_CONFIGS: Record<FormKey, FormConfig> = {
  event_registration: {
    key: "event_registration",
    title: "ইভেন্ট রেজিস্ট্রেশন ফর্ম (Event Registration)",
    description: "যেকোনো ইভেন্টের বিস্তারিত পেজে যে রেজিস্ট্রেশন ফর্মটি দেখায়।",
    fields: [
      {
        id: "name",
        name: "name",
        label: "Full name (পূর্ণ নাম)",
        placeholder: "Your name",
        type: "text",
        required: true,
        enabled: true,
        isCore: true,
        order: 1,
      },
      {
        id: "phone",
        name: "phone",
        label: "Mobile number (মোবাইল নম্বর)",
        placeholder: "017XXXXXXXX",
        type: "tel",
        required: true,
        enabled: true,
        isCore: true,
        order: 2,
      },
      {
        id: "department",
        name: "department",
        label: "Department (বিভাগ)",
        placeholder: "Select department",
        type: "select",
        required: false,
        enabled: true,
        isCore: true,
        options: ["Civil", "Electrical", "Mechanical", "Computer", "Electronics", "Power", "Electromedical", "Mechatronics", "Other"],
        order: 3,
      },
      {
        id: "roll",
        name: "roll",
        label: "Roll / Student ID (রোল / স্টুডেন্ট আইডি)",
        placeholder: "e.g. 201942",
        type: "text",
        required: false,
        enabled: true,
        isCore: true,
        order: 4,
      },
      {
        id: "email",
        name: "email",
        label: "Email (ইমেইল)",
        placeholder: "you@example.com",
        type: "email",
        required: false,
        enabled: true,
        isCore: true,
        order: 5,
      },
      {
        id: "note",
        name: "note",
        label: "Notes / TrxID / Comments (মন্তব্য বা ট্রানজেকশন আইডি)",
        placeholder: "অতিরিক্ত তথ্য, ট্রানজেকশন নম্বর বা মন্তব্য",
        type: "text",
        required: false,
        enabled: true,
        isCore: true,
        order: 6,
      },
    ],
  },
  volunteer_application: {
    key: "volunteer_application",
    title: "স্বেচ্ছাসেবী / সদস্যপদ আবেদন (Volunteer Application)",
    description: "রেড ক্রিসেন্ট যুব দলে নতুন সদস্যপদ আবেদনের ফর্ম (/join)।",
    fields: [
      { id: "name", name: "name", label: "Full Name (পূর্ণ নাম)", placeholder: "e.g. MD. Hasan Ali", type: "text", required: true, enabled: true, isCore: true, order: 1 },
      { id: "studentId", name: "studentId", label: "Student ID / Roll (রোল)", placeholder: "e.g. 612345", type: "text", required: true, enabled: true, isCore: true, order: 2 },
      { id: "department", name: "department", label: "Department (বিভাগ)", placeholder: "Select department", type: "select", required: true, enabled: true, isCore: true, options: ["Civil", "Electrical", "Mechanical", "Computer", "Electronics", "Power", "Electromedical", "Mechatronics", "Other"], order: 3 },
      { id: "phone", name: "phone", label: "Phone Number (ফোন নম্বর)", placeholder: "017XXXXXXXX", type: "tel", required: true, enabled: true, isCore: true, order: 4 },
      { id: "email", name: "email", label: "Email (ইমেইল)", placeholder: "your.name@rgpi.edu.bd", type: "email", required: false, enabled: true, isCore: true, order: 5 },
      { id: "bloodGroup", name: "bloodGroup", label: "Blood Group (রক্তের গ্রুপ)", placeholder: "Select blood group", type: "select", required: true, enabled: true, isCore: true, options: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "UNKNOWN"], order: 6 },
      { id: "area", name: "area", label: "Living Area / Hall (বর্তমান এলাকা/ছাত্রাবাস)", placeholder: "e.g. Shalbagan, Rajshahi", type: "text", required: true, enabled: true, isCore: true, order: 7 },
      { id: "emergencyContactName", name: "emergencyContactName", label: "Emergency Contact Name (অভিভাবক/জরুরি যোগাযোগ)", placeholder: "e.g. Father / Brother", type: "text", required: true, enabled: true, isCore: true, order: 8 },
      { id: "emergencyContactPhone", name: "emergencyContactPhone", label: "Emergency Contact Phone (জরুরি ফোন নম্বর)", placeholder: "018XXXXXXXX", type: "tel", required: true, enabled: true, isCore: true, order: 9 },
      { id: "skills", name: "skills", label: "Skills (দক্ষতা)", placeholder: "First Aid, Photography, IT...", type: "text", required: false, enabled: true, isCore: true, order: 10 },
      { id: "experience", name: "experience", label: "Past Experience (পূর্ব অভিজ্ঞতা)", placeholder: "Any volunteer work or social initiatives", type: "textarea", required: false, enabled: true, isCore: true, order: 11 },
      { id: "motivation", name: "motivation", label: "Why do you want to join? (যুক্ত হওয়ার কারণ)", placeholder: "মানবিক কাজে অংশ নেওয়ার অনুপ্রেরণা...", type: "textarea", required: true, enabled: true, isCore: true, order: 12 },
    ],
  },
  blood_request: {
    key: "blood_request",
    title: "জরুরি রক্তের অনুরোধ ফর্ম (Blood Request)",
    description: "রোগীর জন্য রক্তের জরুরি অনুরোধ জানানোর ফর্ম (/blood-support)।",
    fields: [
      { id: "patientName", name: "patientName", label: "Patient Name (রোগীর নাম)", placeholder: "রোগীর নাম লিখুন", type: "text", required: true, enabled: true, isCore: true, order: 1 },
      { id: "bloodGroup", name: "bloodGroup", label: "Blood Group (প্রয়োজনীয় রক্তের গ্রুপ)", placeholder: "Select group", type: "select", required: true, enabled: true, isCore: true, options: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"], order: 2 },
      { id: "units", name: "units", label: "Units / Bags (রক্তের পরিমাণ/ব্যাগ)", placeholder: "e.g. 1", type: "number", required: true, enabled: true, isCore: true, order: 3 },
      { id: "hospital", name: "hospital", label: "Hospital (হাসপাতাল)", placeholder: "e.g. Rajshahi Medical College Hospital", type: "text", required: false, enabled: true, isCore: true, order: 4 },
      { id: "location", name: "location", label: "Location / District (স্থান/জেলা)", placeholder: "e.g. Laxmipur, Rajshahi", type: "text", required: true, enabled: true, isCore: true, order: 5 },
      { id: "requiredDate", name: "requiredDate", label: "Needed Date (রক্তদানের তারিখ)", placeholder: "yyyy-mm-dd", type: "text", required: false, enabled: true, isCore: true, order: 6 },
      { id: "requiredTime", name: "requiredTime", label: "Needed Time (সময়)", placeholder: "e.g. 11:30 AM", type: "text", required: false, enabled: true, isCore: true, order: 7 },
      { id: "requesterName", name: "requesterName", label: "Contact Person (স্বজনের নাম)", placeholder: "যোগাযোগকারীর নাম", type: "text", required: true, enabled: true, isCore: true, order: 8 },
      { id: "contact", name: "contact", label: "Phone Number (যোগাযোগের ফোন নম্বর)", placeholder: "01XXXXXXXXX", type: "tel", required: true, enabled: true, isCore: true, order: 9 },
      { id: "emergencyLevel", name: "emergencyLevel", label: "Urgency Level (জরুরি মাত্রা)", placeholder: "Urgency", type: "select", required: true, enabled: true, isCore: true, options: ["EMERGENCY", "URGENT", "ROUTINE"], order: 10 },
      { id: "additionalInfo", name: "additionalInfo", label: "Additional Details (অতিরিক্ত বিবরণ)", placeholder: "রোগীর অবস্থা বা হিমোগ্লোবিন সংক্রান্ত বিবরণ...", type: "textarea", required: false, enabled: true, isCore: true, order: 11 },
    ],
  },
  contact: {
    key: "contact",
    title: "সাধারণ যোগাযোগ ও মতামত ফর্ম (Contact Form)",
    description: "ওয়েবসাইট ভিজিটরদের যোগাযোগ ও ফিডব্যাক ফর্ম (/contact)।",
    fields: [
      { id: "name", name: "name", label: "Your Name (আপনার নাম)", placeholder: "Full name", type: "text", required: true, enabled: true, isCore: true, order: 1 },
      { id: "email", name: "email", label: "Email (ইমেইল)", placeholder: "you@example.com", type: "email", required: false, enabled: true, isCore: true, order: 2 },
      { id: "phone", name: "phone", label: "Phone (ফোন নম্বর)", placeholder: "01XXXXXXXXX", type: "tel", required: false, enabled: true, isCore: true, order: 3 },
      { id: "subject", name: "subject", label: "Subject (বিষয়)", placeholder: "কী বিষয়ে জানতে বা জানাতে চান", type: "text", required: true, enabled: true, isCore: true, order: 4 },
      { id: "message", name: "message", label: "Message (বার্তা)", placeholder: "আপনার বার্তা বিস্তারিত লিখুন...", type: "textarea", required: true, enabled: true, isCore: true, order: 5 },
    ],
  },
};
