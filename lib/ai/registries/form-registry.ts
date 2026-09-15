import type { FormDefinition } from "../types";

/**
 * Deterministic Form Registry for RCY RGPI Website.
 * Exactly mirrors the fields and validation rules of real components in components/forms.
 * Never hallucinate or guess form fields.
 */
export const RCY_FORMS: FormDefinition[] = [
  {
    id: "blood-request-form",
    name: "Blood Request Form",
    nameBn: "রক্তের আবেদন ফর্ম",
    route: "/blood-support/request",
    purpose: "Request blood donation for an admitted patient in hospital or home care.",
    purposeBn: "হাসপাতালে ভর্তি বা চিকিৎসাধীন রোগীর জন্য রক্তের ব্যাগের আবেদন জমা দেওয়ার ফর্ম।",
    requiredFields: [
      "patientName",
      "bloodGroup",
      "units",
      "location",
      "requiredDate",
      "requesterName",
      "contact",
      "email",
      "emergencyLevel",
    ],
    fields: [
      {
        name: "patientName",
        label: "Patient Name",
        labelBn: "রোগীর পুরো নাম",
        type: "text",
        required: true,
        description: "Full legal name of the patient requiring blood.",
        descriptionBn: "যে রোগীর জন্য রক্ত প্রয়োজন তার নাম লিখুন।",
        placeholder: "উদাহরণ: মো: করিম",
      },
      {
        name: "bloodGroup",
        label: "Blood Group",
        labelBn: "রক্তের গ্রুপ",
        type: "select",
        required: true,
        description: "Required blood group (A+, A-, B+, B-, AB+, AB-, O+, O-).",
        descriptionBn: "রোগীর প্রয়োজনীয় রক্তের গ্রুপ নির্বাচন করুন।",
        options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      },
      {
        name: "units",
        label: "Units (Bags) Needed",
        labelBn: "রক্তের পরিমাণ (ব্যাগ)",
        type: "number",
        required: true,
        description: "Number of blood bags required (default 1).",
        descriptionBn: "কয় ব্যাগ রক্ত প্রয়োজন তা উল্লেখ করুন।",
        placeholder: "1",
      },
      {
        name: "hospital",
        label: "Hospital / Clinic Name",
        labelBn: "হাসপাতাল বা ক্লিনিকের নাম",
        type: "text",
        required: false,
        description: "Name of the medical facility where patient is admitted.",
        descriptionBn: "রোগী যে হাসপাতালে ভর্তি আছেন তার নাম লিখুন।",
        placeholder: "যেমন: রাজশাহী মেডিকেল কলেজ হাসপাতাল",
      },
      {
        name: "location",
        label: "Detailed Location / Area",
        labelBn: "বিস্তারিত ঠিকানা বা ওয়ার্ড",
        type: "text",
        required: true,
        description: "Ward, cabin, or exact area in Rajshahi or nearby.",
        descriptionBn: "ওয়ার্ড নং, বেড নং বা সঠিক অবস্থান উল্লেখ করুন।",
        placeholder: "যেমন: ওয়ার্ড ৩২, বেড নং ১৫",
      },
      {
        name: "requiredDate",
        label: "Date Needed",
        labelBn: "কবে রক্ত প্রয়োজন",
        type: "date",
        required: true,
        description: "Target date when blood must be transfused.",
        descriptionBn: "যে তারিখে রক্ত প্রয়োজন সে তারিখ নির্বাচন করুন।",
      },
      {
        name: "requiredTime",
        label: "Time Needed",
        labelBn: "কখন প্রয়োজন (সময়)",
        type: "time",
        required: false,
        description: "Approximate time needed for donation.",
        descriptionBn: "রক্তদানের সম্ভাব্য সময়।",
      },
      {
        name: "requesterName",
        label: "Requester Name",
        labelBn: "আবেদনকারীর নাম",
        type: "text",
        required: true,
        description: "Name of the person submitting the request (relative/friend).",
        descriptionBn: "যিনি আবেদন করছেন তার নাম।",
      },
      {
        name: "contact",
        label: "Contact Mobile Number",
        labelBn: "মোবাইল নম্বর",
        type: "tel",
        required: true,
        description: "11-digit active Bangladeshi mobile number for donor coordination.",
        descriptionBn: "সচল ১১ ডিজিটের মোবাইল নম্বর, যাতে রক্তদাতারা যোগাযোগ করতে পারেন।",
        placeholder: "017XXXXXXXX",
      },
      {
        name: "email",
        label: "Email Address",
        labelBn: "ইমেইল ঠিকানা",
        type: "email",
        required: true,
        description: "Email address to receive tracking ID and live updates.",
        descriptionBn: "অনুরোধের ট্র্যাকিং লিংক ও আপডেট পাওয়ার জন্য সঠিক ইমেইল দিন।",
        placeholder: "example@email.com",
      },
      {
        name: "emergencyLevel",
        label: "Emergency Level",
        labelBn: "জরুরি মাত্রা",
        type: "radio",
        required: true,
        description: "NORMAL, URGENT, or EMERGENCY.",
        descriptionBn: "NORMAL (সাধারণ), URGENT (জরুরি), অথবা EMERGENCY (তাৎক্ষণিক জীবনরক্ষাকারী)।",
        options: ["NORMAL", "URGENT", "EMERGENCY"],
      },
      {
        name: "additionalInfo",
        label: "Additional Information",
        labelBn: "অতিরিক্ত তথ্য / রোগের বিবরণ",
        type: "textarea",
        required: false,
        description: "Medical condition, hemoglobin level, or specific donor requirements.",
        descriptionBn: "হিমোগ্লোবিনের মাত্রা বা রোগীর বিশেষ কোনো নির্দেশনা থাকলে লিখুন।",
      },
    ],
    instructionsBn: [
      "১. '/blood-support/request' পেজে যান।",
      "২. রোগীর পুরো নাম ও সঠিক রক্তের গ্রুপ নির্বাচন করুন।",
      "৩. কয় ব্যাগ রক্ত লাগবে এবং কবে লাগবে তা সিলেক্ট করুন।",
      "৪. হাসপাতাল ও ওয়ার্ড/কেবিনের সুনির্দিষ্ট ঠিকানা দিন।",
      "৫. আবেদনকারীর নাম এবং একটি সচল ১১ ডিজিটের ফোন নম্বর দিন।",
      "৬. ট্র্যাকিং লিংক ও ইমেইল নোটিফিকেশন পাওয়ার জন্য সঠিক ইমেইল প্রদান করুন।",
      "৭. সবশেষে 'Submit Request' বাটনে চাপুন। সাবমিট হলে আপনি একটি ইউনিক ট্র্যাকিং পেজ পাবেন।",
    ],
    commonErrorsBn: [
      "রক্তের গ্রুপ নির্বাচন না করা বা ভুল গ্রুপ নির্বাচন করা।",
      "অচল বা ১১ ডিজিটের কম মোবাইল নম্বর দেওয়া।",
      "ভুল ইমেইল দেওয়া, যার ফলে স্ট্যাটাস ট্র্যাকিং লিংক পাওয়া যায় না।",
      "অতীতের কোনো তারিখ নির্বাচন করা।",
      "হাসপাতালের সঠিক ওয়ার্ড বা কেবিন নম্বর না দেওয়া।",
    ],
  },
  {
    id: "volunteer-application-form",
    name: "Volunteer Application Form",
    nameBn: "স্বেচ্ছাসেবক নিবন্ধন ফর্ম",
    route: "/apply-volunteer",
    purpose: "Recruitment form for RGPI students to join Red Crescent Youth as registered volunteers.",
    purposeBn: "আরজিপিআই শিক্ষার্থীদের যুব রেড ক্রিসেন্টে যোগদানের অফিসিয়াল রিক্রুটমেন্ট ফর্ম।",
    requiredFields: [
      "department",
      "session",
      "semester",
      "studentId",
      "bloodGroup",
      "phone",
      "reason",
    ],
    fields: [
      {
        name: "department",
        label: "Department / Technology",
        labelBn: "টেকনোলজি / বিভাগ",
        type: "select",
        required: true,
        description: "Polytechnic engineering technology.",
        descriptionBn: "আপনার পড়ার টেকনোলজি নির্বাচন করুন (যেমন: Computer, Civil, Electrical ইত্যাদি)।",
      },
      {
        name: "session",
        label: "Academic Session",
        labelBn: "শিক্ষাবর্ষ / সেশন",
        type: "text",
        required: true,
        description: "Academic session (e.g. 2023-24).",
        descriptionBn: "আপনার শিক্ষাবর্ষ লিখুন।",
        placeholder: "2023-24",
      },
      {
        name: "semester",
        label: "Current Semester",
        labelBn: "বর্তমান পর্ব / সেমিস্টার",
        type: "select",
        required: true,
        description: "Current enrolled semester (1st through 7th).",
        descriptionBn: "বর্তমান সেমিস্টার নির্বাচন করুন।",
      },
      {
        name: "studentId",
        label: "Roll / Student ID",
        labelBn: "ক্লাস রোল বা বোর্ড রোল",
        type: "text",
        required: true,
        description: "Official polytechnic roll number.",
        descriptionBn: "আপনার সঠিক ক্লাস রোল অথবা বোর্ড রোল নম্বর দিন।",
      },
      {
        name: "bloodGroup",
        label: "Blood Group",
        labelBn: "রক্তের গ্রুপ",
        type: "select",
        required: true,
        description: "Your verified blood group.",
        descriptionBn: "আপনার রক্তের গ্রুপ নির্বাচন করুন।",
        options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      },
      {
        name: "phone",
        label: "Mobile Number",
        labelBn: "মোবাইল নম্বর",
        type: "tel",
        required: true,
        description: "Active personal phone number.",
        descriptionBn: "আপনার সচল ব্যক্তিগত মোবাইল নম্বর।",
      },
      {
        name: "reason",
        label: "Why do you want to join?",
        labelBn: "কেন যোগ দিতে চান?",
        type: "textarea",
        required: true,
        description: "Motivation and interest in volunteering.",
        descriptionBn: "মানবসেবা ও রেড ক্রিসেন্টে যোগদানের কারণ সংক্ষেপে লিখুন।",
      },
    ],
    instructionsBn: [
      "১. নিশ্চিত করুন বর্তমানে ভলান্টিয়ার রিক্রুটমেন্ট রাউন্ড সক্রিয় (Active) রয়েছে।",
      "২. শুধুমাত্র রাজশাহী পলিটেকনিক ইনস্টিটিউটের নিবন্ধিত শিক্ষার্থীরা আবেদন করতে পারবেন।",
      "৩. আপনার শিক্ষার্থী প্রোফাইল ভেরিফাই করুন অথবা সরাসরি আবেদন ফর্মে তথ্য পূরণ করুন।",
      "৪. আপনার টেকনোলজি, সেমিস্টার, শিক্ষাবর্ষ এবং রোল নম্বর সঠিকভাবে প্রদান করুন।",
      "৫. কেন আপনি যুব রেড ক্রিসেন্টে কাজ করতে চান তা সংক্ষেপে লিখুন এবং ফর্ম সাবমিট করুন।",
    ],
    commonErrorsBn: [
      "রিক্রুটমেন্ট বন্ধ থাকা অবস্থায় আবেদনের চেষ্টা করা।",
      "অন্য কোনো শিক্ষাপ্রতিষ্ঠানের শিক্ষার্থী হয়ে আবেদন করা (শুধুমাত্র RGPI গ্রহণযোগ্য)।",
      "ভুল রোল বা সেমিস্টার নির্বাচন করা।",
    ],
  },
  {
    id: "donor-contact-request-form",
    name: "Donor Contact Request Form",
    nameBn: "রক্তদাতার সাথে যোগাযোগ ফর্ম",
    route: "/blood-support/contact-request",
    purpose: "Contact an available donor through RCY's secure communication mediator.",
    purposeBn: "রক্তদাতা ডিরেক্টরি থেকে নির্দিষ্ট রক্তদাতার সাথে যোগাযোগের অনুরোধ পাঠানোর ফর্ম।",
    requiredFields: ["requesterName", "requesterContact", "bloodGroup"],
    fields: [
      {
        name: "requesterName",
        label: "Your Name",
        labelBn: "আপনার নাম",
        type: "text",
        required: true,
        description: "Name of the person requesting to reach the donor.",
        descriptionBn: "আপনার পুরো নাম।",
      },
      {
        name: "requesterContact",
        label: "Contact Number",
        labelBn: "মোবাইল নম্বর",
        type: "tel",
        required: true,
        description: "Your active phone number so the donor or admin can respond.",
        descriptionBn: "আপনার ১১ ডিজিটের সচল ফোন নম্বর।",
      },
      {
        name: "patientName",
        label: "Patient Name",
        labelBn: "রোগীর নাম",
        type: "text",
        required: false,
        description: "Name of patient requiring donation.",
        descriptionBn: "রোগীর নাম (যদি থাকে)।",
      },
      {
        name: "message",
        label: "Message / Location",
        labelBn: "বার্তা / হাসপাতালের অবস্থান",
        type: "textarea",
        required: false,
        description: "Brief message explaining urgency and hospital location.",
        descriptionBn: "রোগীর অবস্থা ও হাসপাতালের ঠিকানা জানিয়ে সংক্ষিপ্ত বার্তা।",
      },
    ],
    instructionsBn: [
      "১. রক্ত সহায়তা ডিরেক্টরি থেকে রক্তদাতার প্রোফাইলে 'Contact Donor' বাটনে চাপুন।",
      "২. আপনার নাম ও সচল ফোন নম্বর দিন।",
      "৩. রোগীর অবস্থা ও হাসপাতালের অবস্থান উল্লেখ করে অনুরোধটি জমা দিন।",
      "৪. দাতার ফোনে তাৎক্ষণিক নোটিফিকেশন পৌঁছে যাবে এবং তারা সম্মত হলে সরাসরি যোগাযোগ করবেন।",
    ],
    commonErrorsBn: [
      "অচল ফোন নম্বর দেওয়া।",
      "অপ্রাসঙ্গিক বা স্প্যাম মেসেজ পাঠানো।",
    ],
  },
];

/**
 * Returns all registered form definitions.
 */
export function getAllRegisteredForms(): FormDefinition[] {
  return RCY_FORMS;
}

/**
 * Finds form definition by form ID or matching route.
 */
export function findFormByRouteOrId(routeOrId: string): FormDefinition | null {
  const clean = routeOrId.trim().toLowerCase();
  return (
    RCY_FORMS.find(
      (f) => f.id.toLowerCase() === clean || f.route.toLowerCase() === clean
    ) || null
  );
}

/**
 * Matches a user's form guidance question to the relevant form.
 */
export function matchFormByQuery(query: string): FormDefinition | null {
  if (!query) return null;
  const q = query.toLowerCase().trim();

  if (
    q.includes("blood request") ||
    q.includes("রক্তের আবেদন") ||
    q.includes("ব্লাড রিকোয়েস্ট") ||
    q.includes("রক্ত লাগবে") ||
    q.includes("রোগীর রক্ত")
  ) {
    return findFormByRouteOrId("blood-request-form");
  }

  if (
    q.includes("volunteer") ||
    q.includes("ভলান্টিয়ার") ||
    q.includes("স্বেচ্ছাসেবক") ||
    q.includes("রিক্রুটমেন্ট") ||
    q.includes("যোগদান")
  ) {
    return findFormByRouteOrId("volunteer-application-form");
  }

  if (q.includes("contact donor") || q.includes("দাতার সাথে যোগাযোগ") || q.includes("ডোনার কল")) {
    return findFormByRouteOrId("donor-contact-request-form");
  }

  return null;
}
