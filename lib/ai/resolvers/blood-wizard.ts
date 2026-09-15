/**
 * Deterministic Conversational State Machine / Step-by-Step Wizard for Blood Requests.
 * Collects required blood form slots progressively (one step at a time) with ZERO LLM tokens.
 * Guaranteed linear progress (Step 1 -> Step 2 -> Step 3 -> Step 4 -> Complete) so it NEVER loops.
 * Automatically constructs the pre-filled URL for /blood-support/request.
 */

import type { AssistantAction, AssistantResponse } from "../types";

export interface BloodRequestState {
  patientName?: string;
  bloodGroup?: string;
  units?: number;
  hospital?: string;
  location?: string;
  requiredDate?: string;
  emergencyLevel?: "NORMAL" | "URGENT" | "EMERGENCY";
  requesterName?: string;
  contact?: string;
  email?: string;
}

// Map Bangla digits to English digits
export function convertBanglaDigits(input: string): string {
  const bnToEn: Record<string, string> = {
    "০": "0",
    "১": "1",
    "২": "2",
    "৩": "3",
    "৪": "4",
    "৫": "5",
    "৬": "6",
    "৭": "7",
    "৮": "8",
    "৯": "9",
  };
  return input.replace(/[০-৯]/g, (digit) => bnToEn[digit] || digit);
}

/**
 * Extracts Blood Group from natural language query.
 */
export function extractBloodGroup(text: string): string | undefined {
  const normalized = text.toLowerCase();

  if (/(?:^|[^\w])(?:ab\s*positive|এবি\s*পজেটিভ|এবি\s*পজিটিভ|ab\+)(?=[^\w]|$)/i.test(normalized)) return "AB+";
  if (/(?:^|[^\w])(?:ab\s*negative|এবি\s*নেগেটিভ|ab\-)(?=[^\w]|$)/i.test(normalized)) return "AB-";
  if (/(?:^|[^\w])(?:a\s*positive|এ\s*পজেটিভ|এ\s*পজিটিভ|a\+)(?=[^\w]|$)/i.test(normalized)) return "A+";
  if (/(?:^|[^\w])(?:a\s*negative|এ\s*নেগেটিভ|a\-)(?=[^\w]|$)/i.test(normalized)) return "A-";
  if (/(?:^|[^\w])(?:b\s*positive|বি\s*পজেটিভ|বি\s*পজিটিভ|b\+)(?=[^\w]|$)/i.test(normalized)) return "B+";
  if (/(?:^|[^\w])(?:b\s*negative|বি\s*নেগেটিভ|b\-)(?=[^\w]|$)/i.test(normalized)) return "B-";
  if (/(?:^|[^\w])(?:o\s*positive|ও\s*পজেটিভ|ও\s*পজিটিভ|o\+)(?=[^\w]|$)/i.test(normalized)) return "O+";
  if (/(?:^|[^\w])(?:o\s*negative|ও\s*নেগেটিভ|o\-)(?=[^\w]|$)/i.test(normalized)) return "O-";

  const directMatch = text.match(/(?:^|[^\w])(A\+|A\-|B\+|B\-|AB\+|AB\-|O\+|O\-)(?=[^\w]|$)/i);
  if (directMatch) return directMatch[1].toUpperCase();

  return undefined;
}

/**
 * Extracts 11-digit Bangladeshi mobile number.
 */
export function extractPhoneNumber(text: string): string | undefined {
  const converted = convertBanglaDigits(text);
  const match = converted.match(/(?:\+?8801|8801|01)[3-9]\d{8}\b/);
  if (match) {
    let num = match[0];
    if (num.startsWith("+88")) num = num.slice(3);
    else if (num.startsWith("88")) num = num.slice(2);
    return num;
  }
  return undefined;
}

/**
 * Extracts Email Address.
 */
export function extractEmail(text: string): string | undefined {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0].trim() : undefined;
}

/**
 * Extracts number of blood bags/units needed.
 */
export function extractUnits(text: string): number | undefined {
  const converted = convertBanglaDigits(text);
  const match = converted.match(/(\d+)\s*(?:ব্যাগ|bag|ইউনিট|unit|টি)?/i);
  if (match && Number(match[1]) > 0 && Number(match[1]) <= 20) {
    if (match[1].length <= 2) {
      return parseInt(match[1], 10);
    }
  }
  if (text.includes("এক ব্যাগ") || text.includes("1 bag")) return 1;
  if (text.includes("দুই ব্যাগ") || text.includes("2 bag") || text.includes("২ ব্যাগ")) return 2;
  if (text.includes("তিন ব্যাগ") || text.includes("3 bag") || text.includes("৩ ব্যাগ")) return 3;
  if (text.includes("চার ব্যাগ") || text.includes("4 bag") || text.includes("৪ ব্যাগ")) return 4;
  return undefined;
}

/**
 * Extracts Emergency Level.
 */
export function extractEmergencyLevel(text: string): "NORMAL" | "URGENT" | "EMERGENCY" {
  const lower = text.toLowerCase();
  if (
    lower.includes("অতি জরুরি") ||
    lower.includes("emergency") ||
    lower.includes("খুব জরুরি") ||
    lower.includes("জীবনসংকট") ||
    lower.includes("তাৎক্ষণিক") ||
    lower.includes("আশঙ্কাজনক")
  ) {
    return "EMERGENCY";
  }
  if (lower.includes("সাধারণ") || lower.includes("normal") || lower.includes("রেগুলার")) {
    return "NORMAL";
  }
  // Default to URGENT for blood requests
  return "URGENT";
}

/**
 * Extracts Hospital and Location from text with support for shorthand names (RMCH, etc.).
 */
export function extractHospitalAndLocation(text: string): { hospital?: string; location?: string } {
  let hospital: string | undefined;
  let location: string | undefined;

  const lower = text.toLowerCase();

  // Known hospital shorthands
  if (
    lower.includes("rmch") ||
    lower.includes("রামেক") ||
    lower.includes("রাজশাহী মেডিকেল") ||
    lower.includes("rajshahi medical")
  ) {
    hospital = "রাজশাহী মেডিকেল কলেজ হাসপাতাল";
  } else if (lower.includes("সদর") || lower.includes("sadar")) {
    hospital = "সদর হাসপাতাল";
  } else if (lower.includes("ইবনে সিনা") || lower.includes("ibn sina")) {
    hospital = "ইবনে সিনা হাসপাতাল";
  } else if (lower.includes("পপুলার") || lower.includes("popular")) {
    hospital = "পপুলার ডায়াগনস্টিক";
  } else {
    const hospMatch = text.match(
      /([^\n,।]+?(?:হাসপাতাল|মেডিকেল|মেডিকেল কলেজ|ক্লিনিক|সদর হাসপাতাল|hospital|clinic))/i
    );
    if (hospMatch) {
      hospital = hospMatch[1].trim();
    }
  }

  // Location / Ward detection
  const locMatch = text.match(
    /([^\n,।]+?(?:ওয়ার্ড|কেবিন|বেড|আইসিইউ|আই\.সি\.ইউ|icu|ward|cabin|bed|উপজেলা|থানা|রাজশাহী))/i
  );
  if (locMatch) {
    location = locMatch[1].trim();
  }

  return { hospital, location };
}

/**
 * Cleans user message to extract a person's name when other tokens (blood group, phone, email, units) are removed.
 */
function extractCleanName(rawText: string): string | undefined {
  let text = rawText;

  // Remove blood groups
  text = text.replace(/(?:^|[^\w])(?:A\+|A\-|B\+|B\-|AB\+|AB\-|O\+|O\-)(?=[^\w]|$)/gi, " ");
  text = text.replace(/(?:ab|a|b|o)\s*(?:positive|negative|পজেটিভ|পজিটিভ|নেগেটিভ)/gi, " ");
  // Remove phone & email
  text = text.replace(/(?:\+?8801|8801|01)[3-9]\d{8}\b/g, " ");
  text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, " ");
  // Remove numbers & units
  text = text.replace(/\b\d+\s*(?:ব্যাগ|bag|ইউনিট|unit|টি)?/gi, " ");
  // Remove standard boilerplate keywords
  text = text.replace(/(?:রোগী|রোগীর নাম|patient|patient name|আবেদনকারী|আমার নাম|রক্ত|blood|রক্তের গ্রুপ|গ্রুপ|নাম|হলো|হল|হচ্ছে|দরকার|লাগবে|চাই|দাও|দিন)[:\s,]*/gi, " ");
  text = text.replace(/[।,;:\-\+\*\/\(\)]/g, " ");

  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length >= 2 && clean.length <= 35 && !/^\d+$/.test(clean)) {
    return clean;
  }
  return undefined;
}

/**
 * Determines which stage of the wizard the user is currently at.
 * Based on the LAST assistant message in history.
 * GUARANTEES linear forward progression:
 * No prior ধাপ -> Stage 1
 * Prior was ধাপ ১/৪ -> Stage 2
 * Prior was ধাপ ২/৪ -> Stage 3
 * Prior was ধাপ ৩/৪ -> Stage 4
 * Prior was ধাপ ৪/৪ -> COMPLETE
 */
export function determineWizardStage(
  history?: Array<{ role: "user" | "assistant"; content: string }>
): 1 | 2 | 3 | 4 | "COMPLETE" {
  if (!history || !Array.isArray(history) || history.length === 0) {
    return 1;
  }

  const assistantMsgs = history.filter((h) => h.role === "assistant");
  if (assistantMsgs.length === 0) {
    return 1;
  }

  const lastAssistantMsg = assistantMsgs[assistantMsgs.length - 1].content;

  if (lastAssistantMsg.includes("ধাপ ৪/৪")) {
    return "COMPLETE";
  }
  if (lastAssistantMsg.includes("ধাপ ৩/৪")) {
    return 4;
  }
  if (lastAssistantMsg.includes("ধাপ ২/৪")) {
    return 3;
  }
  if (lastAssistantMsg.includes("ধাপ ১/৪")) {
    return 2;
  }

  return 1;
}

/**
 * Scans conversation history and current message to compile all known slots.
 */
export function parseAllCumulativeSlots(
  currentMessage: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>
): BloodRequestState {
  const userTurns: string[] = [];
  if (history && Array.isArray(history)) {
    for (const h of history) {
      if (h.role === "user") {
        userTurns.push(h.content);
      }
    }
  }
  userTurns.push(currentMessage);

  const fullText = userTurns.join(" | ");

  const state: BloodRequestState = {};

  // 1. Blood Group
  state.bloodGroup = extractBloodGroup(fullText);

  // 2. Phone Number
  state.contact = extractPhoneNumber(fullText);

  // 3. Email
  state.email = extractEmail(fullText);

  // 4. Units
  state.units = extractUnits(fullText);

  // 5. Emergency Level
  state.emergencyLevel = extractEmergencyLevel(fullText);

  // 6. Hospital & Location
  const { hospital, location } = extractHospitalAndLocation(fullText);
  state.hospital = hospital;
  state.location = location;

  // 7. Date extraction
  if (
    fullText.includes("আজকে") ||
    fullText.includes("আজ") ||
    fullText.includes("আজকের মধ্যে") ||
    fullText.toLowerCase().includes("today")
  ) {
    state.requiredDate = "আজ (Today)";
  } else if (
    fullText.includes("কালকে") ||
    fullText.includes("কাল") ||
    fullText.includes("কালকের মধ্যে") ||
    fullText.toLowerCase().includes("tomorrow")
  ) {
    state.requiredDate = "কাল (Tomorrow)";
  } else {
    const dateMatch = fullText.match(
      /(?:\d{1,2}[\/\-\.]\d{1,2}(?:[\/\-\.]\d{2,4})?|\d{1,2}\s*(?:সেপ্টেম্বর|অক্টোবর|নভেম্বর|ডিসেম্বর|জানুয়ারি|ফেব্রুয়ারি|মার্চ|এপ্রিল|মে|জুন|জুলাই|আগস্ট))/i
    );
    if (dateMatch) {
      state.requiredDate = dateMatch[0].trim();
    }
  }

  // 8. Patient Name
  const patientExplicit = fullText.match(/(?:রোগী|রোগীর নাম|patient|patient name)[:\s]+([^\n,|।]+)/i);
  if (patientExplicit) {
    state.patientName = patientExplicit[1].trim();
  }

  // 9. Requester Name
  const requesterExplicit = fullText.match(/(?:আবেদনকারী|আবেদনকারীর নাম|আমার নাম|requester)[:\s]+([^\n,|।]+)/i);
  if (requesterExplicit) {
    state.requesterName = requesterExplicit[1].trim();
  }

  // Per-turn extraction for conversational context:
  // Turn 1 (index 0 is initiation, index 1 is reply to Stage 1)
  if (userTurns.length >= 2 && !state.patientName) {
    const stage1UserReply = userTurns[1];
    state.patientName = extractCleanName(stage1UserReply);
  }

  // Turn 2 reply (reply to Stage 2: Units & Hospital)
  if (userTurns.length >= 3) {
    const stage2UserReply = userTurns[2];
    if (!state.hospital && !state.location) {
      const cleanHosp = extractCleanName(stage2UserReply);
      if (cleanHosp) {
        state.hospital = cleanHosp;
      }
    }
  }

  // Turn 3 reply (reply to Stage 3: Date & Urgency)
  if (userTurns.length >= 4 && !state.requiredDate) {
    const stage3UserReply = userTurns[3];
    const cleanDate = extractCleanName(stage3UserReply);
    state.requiredDate = cleanDate || "আজ (জরুরি)";
  }

  // Turn 4 reply (reply to Stage 4: Requester Info)
  if (userTurns.length >= 5) {
    const stage4UserReply = userTurns[4];
    if (!state.requesterName) {
      state.requesterName = extractCleanName(stage4UserReply) || state.patientName || "আবেদনকারী";
    }
  }

  return state;
}

/**
 * Checks if the current conversation is within an active blood request wizard flow.
 */
export function isBloodRequestWizardQuery(
  message: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>
): boolean {
  const q = message.toLowerCase().trim();

  // If user says "stop" or asks something unrelated, exit wizard
  if (
    q.includes("বাতিল") ||
    q.includes("cancel") ||
    q.includes("থামুন") ||
    q.includes("দরকার নেই") ||
    q.includes("পেজ কোথায়") ||
    q.includes("টিচার কে") ||
    q.includes("নোটিশ") ||
    q.includes("ইভেন্ট")
  ) {
    return false;
  }

  // Explicit user trigger
  if (
    q.includes("blood request") ||
    q.includes("ব্লাড রিকোয়েস্ট") ||
    q.includes("রক্তের আবেদন") ||
    q.includes("রক্তের আবেদন করতে চাই") ||
    q.includes("আবেদন করতে চাই") ||
    q.includes("রক্ত লাগবে") ||
    q.includes("ব্লাড লাগবে") ||
    q.includes("blood lagbe") ||
    q.includes("rocto lagbe") ||
    q.includes("rokto lagbe") ||
    q.includes("রোগীর রক্ত প্রয়োজন") ||
    q.includes("জরুরি রক্ত দরকার")
  ) {
    return true;
  }

  // Check if previous assistant message was a blood wizard step
  if (history && history.length > 0) {
    const lastAssistant = [...history].reverse().find((h) => h.role === "assistant");
    if (lastAssistant) {
      const content = lastAssistant.content;
      if (
        content.includes("ধাপ ১/৪") ||
        content.includes("ধাপ ২/৪") ||
        content.includes("ধাপ ৩/৪") ||
        content.includes("ধাপ ৪/৪")
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Builds the deterministic, pre-filled URL matching BloodRequestForm URL schema.
 */
export function buildBloodRequestFormUrl(state: BloodRequestState): string {
  const params = new URLSearchParams();

  if (state.patientName) params.set("patientName", state.patientName);
  if (state.bloodGroup) params.set("bloodGroup", state.bloodGroup);
  if (state.units) params.set("units", String(state.units));
  if (state.hospital) params.set("hospital", state.hospital);
  if (state.location) params.set("location", state.location);
  if (state.requiredDate) params.set("requiredDate", state.requiredDate);
  if (state.emergencyLevel) params.set("emergencyLevel", state.emergencyLevel);
  if (state.requesterName) params.set("requesterName", state.requesterName);
  if (state.contact) params.set("contact", state.contact);
  if (state.email) params.set("email", state.email);

  const qs = params.toString();
  return qs ? `/blood-support/request?${qs}` : `/blood-support/request`;
}

/**
 * Executes the Step-by-Step Deterministic Blood Request Wizard.
 * Consumes ZERO LLM tokens.
 * GUARANTEES that every user answer moves forward exactly ONE step. Never repeats.
 */
export function executeBloodRequestWizard(
  currentMessage: string,
  history?: Array<{ role: "user" | "assistant"; content: string }>
): AssistantResponse {
  const state = parseAllCumulativeSlots(currentMessage, history);
  const formUrl = buildBloodRequestFormUrl(state);

  const fallbackAction: AssistantAction = {
    type: "navigate",
    label: "সরাসরি ফর্ম খুলুন",
    target: formUrl,
  };

  // Determine stage based on history
  const currentStage = determineWizardStage(history);

  // If user provided all essential slots at once on turn 1 or turn 2, jump to completion!
  const hasAllCoreSlots = Boolean(
    state.bloodGroup &&
    (state.contact || state.email) &&
    (state.hospital || state.location || state.patientName)
  );

  if (hasAllCoreSlots && currentStage !== 1) {
    return buildCompletionResponse(state);
  }

  // STAGE 1: Initiation -> Ask Patient Name & Blood Group
  if (currentStage === 1) {
    return {
      message:
        "অবশ্যই! আমি আপনাকে ধাপে ধাপে রক্তের আবেদন ফর্মটি পূরণ করতে সাহায্য করছি।\n\n" +
        "👉 **ধাপ ১/৪ (রোগীর তথ্য):** অনুগ্রহ করে **রোগীর পুরো নাম** এবং প্রয়োজনীয় **রক্তের গ্রুপ** (যেমন: A+, B+, O+, AB+) জানান।",
      actions: [fallbackAction],
      sourceType: "form",
      intent: "FORM_GUIDANCE",
    };
  }

  // STAGE 2: Patient info received -> Ask Units & Hospital
  if (currentStage === 2) {
    // Extract whatever patient name & blood group we got
    const pName = state.patientName || extractCleanName(currentMessage) || "রোগী";
    state.patientName = pName;
    const bg = state.bloodGroup || "নির্দিষ্ট গ্রুপ";

    return {
      message:
        `ধন্যবাদ!\n✅ রোগী: **${pName}** | রক্তের গ্রুপ: **${bg}** সংরক্ষিত হয়েছে।\n\n` +
        `👉 **ধাপ ২/৪ (পরিমাণ ও অবস্থান):** মোট **কত ব্যাগ রক্ত** প্রয়োজন এবং রোগী কোন **হাসপাতালে** (বা নির্দিষ্ট ওয়ার্ড/কেবিনে) চিকিৎসাধীন আছেন?`,
      actions: [fallbackAction],
      sourceType: "form",
      intent: "FORM_GUIDANCE",
    };
  }

  // STAGE 3: Units & Hospital received -> Ask Date & Emergency Level
  if (currentStage === 3) {
    const units = state.units || 1;
    state.units = units;
    const hosp = state.hospital || state.location || extractCleanName(currentMessage) || "হাসপাতাল";
    state.hospital = hosp;

    return {
      message:
        `ধন্যবাদ!\n✅ পরিমাণ: **${units} ব্যাগ** | অবস্থান: **${hosp}** সংরক্ষিত হয়েছে।\n\n` +
        `👉 **ধাপ ৩/৪ (সময় ও জরুরি মাত্রা):** রক্তটি **কবে প্রয়োজন** (যেমন: আজ / কাল / নির্দিষ্ট তারিখ) এবং জরুরি মাত্রা কেমন (সাধারণ / জরুরি / অতি জরুরি)?`,
      actions: [fallbackAction],
      sourceType: "form",
      intent: "FORM_GUIDANCE",
    };
  }

  // STAGE 4: Date & Urgency received -> Ask Requester Contact & Email
  if (currentStage === 4) {
    const reqDate = state.requiredDate || extractCleanName(currentMessage) || "আজ (Today)";
    state.requiredDate = reqDate;
    const emLevel = state.emergencyLevel || "URGENT";
    state.emergencyLevel = emLevel;

    return {
      message:
        `ধন্যবাদ!\n✅ প্রয়োজনীয় সময়: **${reqDate}** | জরুরি মাত্রা: **${emLevel}** সংরক্ষিত হয়েছে।\n\n` +
        `👉 **ধাপ ৪/৪ (সর্বশেষ ধাপ - আবেদনকারীর তথ্য):**\nআপনার (আবেদনকারীর) **পুরো নাম**, যোগাযোগের **১১ ডিজিটের মোবাইল নম্বর** এবং **ইমেইল ঠিকানা** (অনুরোধ ট্র্যাকিং আইডি পাওয়ার জন্য) প্রদান করুন।`,
      actions: [fallbackAction],
      sourceType: "form",
      intent: "FORM_GUIDANCE",
    };
  }

  // STAGE COMPLETE: All 4 stages finished!
  return buildCompletionResponse(state);
}

/**
 * Builds the final completion response with summary card and pre-filled action link.
 */
function buildCompletionResponse(state: BloodRequestState): AssistantResponse {
  // Fill any missing defaults cleanly so form prefill never fails
  const patientName = state.patientName || "রোগী";
  const bloodGroup = state.bloodGroup || "A+";
  const units = state.units || 1;
  const hospital = state.hospital || "রাজশাহী মেডিকেল কলেজ হাসপাতাল";
  const location = state.location || "সাধারণ ওয়ার্ড";
  const requiredDate = state.requiredDate || "আজ (জরুরি)";
  const emergencyLevel = state.emergencyLevel || "URGENT";
  const requesterName = state.requesterName || patientName || "আবেদনকারী";
  const contact = state.contact || "";
  const email = state.email || "";

  const completedState: BloodRequestState = {
    patientName,
    bloodGroup,
    units,
    hospital,
    location,
    requiredDate,
    emergencyLevel,
    requesterName,
    contact,
    email: email || undefined,
  };

  const finalUrl = buildBloodRequestFormUrl(completedState);

  const summaryMessage =
    `🎉 **আপনার রক্তের আবেদনের সকল তথ্য সফলভাবে সংগৃহীত হয়েছে!**\n\n` +
    `📋 **আবেদনের পূর্ণাঙ্গ সারসংক্ষেপ:**\n` +
    `১. রোগীর নাম: **${patientName}**\n` +
    `২. রক্তের গ্রুপ: **${bloodGroup}**\n` +
    `৩. রক্তের পরিমাণ: **${units} ব্যাগ**\n` +
    `৪. হাসপাতাল ও অবস্থান: **${hospital}, ${location}**\n` +
    `৫. প্রয়োজনীয় তারিখ: **${requiredDate}**\n` +
    `৬. জরুরি মাত্রা: **${emergencyLevel}**\n` +
    `৭. আবেদনকারীর নাম: **${requesterName}**\n` +
    `৮. মোবাইল নম্বর: **${contact}**\n` +
    (email ? `৯. ইমেইল ঠিকানা: **${email}**\n\n` : `৯. ইমেইল: *(ফর্ম খোলার পর দিতে পারবেন)*\n\n`) +
    `নিচের বাটনে ক্লিক করলেই আপনার সমস্ত তথ্যসহ অফিসিয়াল রক্তের আবেদন ফর্মটি সরাসরি খুলে যাবে। আপনি শুধু একবার রিভিউ করে 'জমা দিন' বাটনে চাপবেন!`;

  return {
    message: summaryMessage,
    actions: [
      {
        type: "navigate",
        label: "আবেদন ফর্মটি খুলুন (তথ্য স্বয়ংক্রিয়ভাবে পূরণ করা)",
        target: finalUrl,
      },
    ],
    sourceType: "form",
    intent: "FORM_GUIDANCE",
  };
}
