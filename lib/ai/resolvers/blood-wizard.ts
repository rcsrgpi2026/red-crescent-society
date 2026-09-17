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

  // Location / Ward detection (e.g. ৮ নম্বর ওয়ার্ড, কেবিন ১২, আইসিইউ)
  const locMatch = text.match(
    /(?:^|[|,\n।])\s*([^|\n,।]{2,25}?(?:ওয়ার্ড|কেবিন|বেড|আইসিইউ|আই\.সি\.ইউ|icu|ward|cabin|bed)\s*\d*)/i
  );
  if (locMatch) {
    const candidate = locMatch[1].trim();
    if (!hospital || !hospital.includes(candidate)) {
      location = candidate;
    }
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
 * Prior was ধাপ ১/৭ -> Stage 2
 * Prior was ধাপ ২/৭ -> Stage 3
 * Prior was ধাপ ৩/৭ -> Stage 4
 * Prior was ধাপ ৪/৭ -> Stage 5
 * Prior was ধাপ ৫/৭ -> Stage 6
 * Prior was ধাপ ৬/৭ -> Stage 7
 * Prior was ধাপ ৭/৭ -> COMPLETE
 */
export function determineWizardStage(
  history?: Array<{ role: "user" | "assistant"; content: string }>
): 1 | 2 | 3 | 4 | 5 | 6 | 7 | "COMPLETE" {
  if (!history || !Array.isArray(history) || history.length === 0) {
    return 1;
  }

  const assistantMsgs = history.filter((h) => h.role === "assistant");
  if (assistantMsgs.length === 0) {
    return 1;
  }

  const lastAssistantMsg = assistantMsgs[assistantMsgs.length - 1].content;

  if (
    lastAssistantMsg.includes("ধাপ ৭/৭") ||
    lastAssistantMsg.includes("ধাপ ৬/৬") ||
    lastAssistantMsg.includes("ধাপ ৪/৪")
  ) {
    return "COMPLETE";
  }
  if (lastAssistantMsg.includes("ধাপ ৬/৭")) {
    return 7;
  }
  if (lastAssistantMsg.includes("ধাপ ৫/৭") || lastAssistantMsg.includes("ধাপ ৫/৬")) {
    return 6;
  }
  if (lastAssistantMsg.includes("ধাপ ৪/৭") || lastAssistantMsg.includes("ধাপ ৪/৬") || lastAssistantMsg.includes("ধাপ ৩/৪")) {
    return 5;
  }
  if (lastAssistantMsg.includes("ধাপ ৩/৭") || lastAssistantMsg.includes("ধাপ ৩/৬") || lastAssistantMsg.includes("ধাপ ২/৪")) {
    return 4;
  }
  if (lastAssistantMsg.includes("ধাপ ২/৭") || lastAssistantMsg.includes("ধাপ ২/৬")) {
    return 3;
  }
  if (lastAssistantMsg.includes("ধাপ ১/৭") || lastAssistantMsg.includes("ধাপ ১/৬") || lastAssistantMsg.includes("ধাপ ১/৪")) {
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
  // Turn 1 reply (reply to Stage 1: Patient Name)
  if (userTurns.length >= 2 && !state.patientName) {
    const stage1UserReply = userTurns[1];
    state.patientName = extractCleanName(stage1UserReply);
  }

  // Turn 2 reply (reply to Stage 2: Blood Group)
  if (userTurns.length >= 3 && !state.bloodGroup) {
    const stage2UserReply = userTurns[2];
    state.bloodGroup = extractBloodGroup(stage2UserReply);
  }

  // Turn 3 reply (reply to Stage 3: Units)
  if (userTurns.length >= 4 && !state.units) {
    const stage3UserReply = userTurns[3];
    state.units = extractUnits(stage3UserReply);
  }

  // Turn 4 reply (reply to Stage 4: Hospital)
  if (userTurns.length >= 5 && !state.hospital) {
    const stage4UserReply = userTurns[4];
    const { hospital, location } = extractHospitalAndLocation(stage4UserReply);
    state.hospital = hospital || extractCleanName(stage4UserReply);
    if (location) state.location = location;
  }

  // Turn 5 reply (reply to Stage 5: Date)
  if (userTurns.length >= 6 && !state.requiredDate) {
    const stage5UserReply = userTurns[5];
    const cleanDate = extractCleanName(stage5UserReply);
    state.requiredDate = cleanDate || "আজ (জরুরি)";
  }

  // Turn 6 reply (reply to Stage 6: Phone)
  if (userTurns.length >= 7 && !state.contact) {
    const stage6UserReply = userTurns[6];
    state.contact = extractPhoneNumber(stage6UserReply);
  }

  // Turn 7 reply (reply to Stage 7: Email)
  if (userTurns.length >= 8 && !state.email) {
    const stage7UserReply = userTurns[7];
    state.email = extractEmail(stage7UserReply);
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
        /ধাপ\s*[১-৭1-7]\/[৪-৭4-7]/.test(content) ||
        content.includes("ধাপ ১/") ||
        content.includes("ধাপ ২/") ||
        content.includes("ধাপ ৩/") ||
        content.includes("ধাপ ৪/") ||
        content.includes("ধাপ ৫/") ||
        content.includes("ধাপ ৬/") ||
        content.includes("ধাপ ৭/")
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
  if (state.requiredDate) {
    const lower = state.requiredDate.toLowerCase();
    const today = new Date();
    if (lower.includes("কাল") || lower.includes("tomorrow")) {
      today.setDate(today.getDate() + 1);
      params.set("requiredDate", today.toISOString().split("T")[0]);
    } else if (lower.includes("আজ") || lower.includes("today") || lower.includes("জরুরি")) {
      params.set("requiredDate", today.toISOString().split("T")[0]);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(state.requiredDate.trim())) {
      params.set("requiredDate", state.requiredDate.trim());
    } else {
      params.set("requiredDate", state.requiredDate);
    }
  }
  if (state.emergencyLevel) params.set("emergencyLevel", state.emergencyLevel);
  if (state.requesterName || state.patientName) {
    params.set("requesterName", state.requesterName || state.patientName || "আবেদনকারী");
  }
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

  // If user provided core slots at once (bloodGroup, contact, hospital/patientName), jump to completion!
  const hasAllCoreSlots = Boolean(
    state.bloodGroup &&
    state.contact &&
    state.email &&
    (state.hospital || state.patientName)
  );

  if (hasAllCoreSlots && currentStage !== 1) {
    return buildCompletionResponse(state);
  }

  // STAGE 1: Initiation -> Ask Patient Name ONLY
  if (currentStage === 1) {
    return {
      message:
        "অবশ্যই! আমি আপনাকে ধাপে ধাপে রক্তের আবেদন ফর্মটি পূরণ করতে সাহায্য করছি।\n\n" +
        "👉 **ধাপ ১/৭ (রোগীর নাম):** অনুগ্রহ করে **রোগীর পুরো নাম** জানান।",
      actions: [fallbackAction],
      sourceType: "form",
      intent: "FORM_GUIDANCE",
    };
  }

  // STAGE 2: Patient Name received -> Ask Blood Group ONLY
  if (currentStage === 2) {
    const pName = state.patientName || extractCleanName(currentMessage) || "রোগী";
    state.patientName = pName;

    return {
      message:
        `ধন্যবাদ!\n✅ রোগীর নাম: **${pName}** সংরক্ষিত হয়েছে।\n\n` +
        `👉 **ধাপ ২/৭ (রক্তের গ্রুপ):** রোগীর কোন গ্রুপের রক্ত প্রয়োজন? (যেমন: A+, B+, O+, AB+, A-, B-, O-, AB-)`,
      actions: [fallbackAction],
      sourceType: "form",
      intent: "FORM_GUIDANCE",
    };
  }

  // STAGE 3: Blood Group received -> Ask Units ONLY
  if (currentStage === 3) {
    const bg = state.bloodGroup || extractBloodGroup(currentMessage) || "নির্দিষ্ট গ্রুপ";
    state.bloodGroup = bg;

    return {
      message:
        `ধন্যবাদ!\n✅ রক্তের গ্রুপ: **${bg}** সংরক্ষিত হয়েছে।\n\n` +
        `👉 **ধাপ ৩/৭ (রক্তের পরিমাণ):** মোট **কত ব্যাগ রক্ত** প্রয়োজন? (যেমন: ১ ব্যাগ, ২ ব্যাগ)`,
      actions: [fallbackAction],
      sourceType: "form",
      intent: "FORM_GUIDANCE",
    };
  }

  // STAGE 4: Units received -> Ask Hospital ONLY
  if (currentStage === 4) {
    const units = state.units || extractUnits(currentMessage) || 1;
    state.units = units;

    return {
      message:
        `ধন্যবাদ!\n✅ রক্তের পরিমাণ: **${units} ব্যাগ** সংরক্ষিত হয়েছে।\n\n` +
        `👉 **ধাপ ৪/৭ (হাসপাতাল ও স্থান):** রোগী কোন **হাসপাতালে** (বা ক্লিনিকে) চিকিৎসাধীন আছেন? (যেমন: রাজশাহী মেডিকেল কলেজ হাসপাতাল, সদর হাসপাতাল ইত্যাদি)`,
      actions: [fallbackAction],
      sourceType: "form",
      intent: "FORM_GUIDANCE",
    };
  }

  // STAGE 5: Hospital received -> Ask Date / Time ONLY
  if (currentStage === 5) {
    const { hospital, location } = extractHospitalAndLocation(currentMessage);
    const hosp = state.hospital || hospital || extractCleanName(currentMessage) || "হাসপাতাল";
    state.hospital = hosp;
    if (location && !state.location) state.location = location;

    return {
      message:
        `ধন্যবাদ!\n✅ হাসপাতাল: **${hosp}** সংরক্ষিত হয়েছে।\n\n` +
        `👉 **ধাপ ৫/৭ (রক্তদানের সময়):** রক্তটি **কবে প্রয়োজন**? (যেমন: আজ, কাল, বা নির্দিষ্ট তারিখ/সময়)`,
      actions: [fallbackAction],
      sourceType: "form",
      intent: "FORM_GUIDANCE",
    };
  }

  // STAGE 6: Date received -> Ask Contact Phone ONLY
  if (currentStage === 6) {
    const reqDate = state.requiredDate || extractCleanName(currentMessage) || "আজ (জরুরি)";
    state.requiredDate = reqDate;

    return {
      message:
        `ধন্যবাদ!\n✅ প্রয়োজনীয় সময়: **${reqDate}** সংরক্ষিত হয়েছে।\n\n` +
        `👉 **ধাপ ৬/৭ (মোবাইল নম্বর):** রক্তদাতাদের দ্রুত যোগাযোগের জন্য আপনার একটি সচল **১১ ডিজিটের মোবাইল নম্বর** দিন।`,
      actions: [fallbackAction],
      sourceType: "form",
      intent: "FORM_GUIDANCE",
    };
  }

  // STAGE 7: Phone received -> Ask Email ONLY
  if (currentStage === 7) {
    const phone = state.contact || extractPhoneNumber(currentMessage) || "";
    if (phone) state.contact = phone;

    return {
      message:
        `ধন্যবাদ!\n✅ মোবাইল নম্বর: **${phone || "সংরক্ষিত"}** হয়েছে।\n\n` +
        `👉 **ধাপ ৭/৭ (সর্বশেষ ধাপ - ইমেইল ঠিকানা):** আবেদন নিশ্চিতকরণ ও ট্র্যাকিং আপডেটের জন্য আপনার **ইমেইল ঠিকানা** দিন (যেমন: name@example.com)।\n*(ইমেইল না থাকলে 'নেই' লিখতে পারেন)*`,
      actions: [fallbackAction],
      sourceType: "form",
      intent: "FORM_GUIDANCE",
    };
  }

  // STAGE COMPLETE: All 7 stages completed!
  const finalEmail = state.email || extractEmail(currentMessage) || "";
  state.email = finalEmail;
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
  const location = state.location || "";
  const requiredDate = state.requiredDate || "আজ (জরুরি)";
  const emergencyLevel = state.emergencyLevel || "URGENT";
  const requesterName = state.requesterName || patientName;
  const contact = state.contact || "";
  const email = state.email || "";

  const completedState: BloodRequestState = {
    patientName,
    bloodGroup,
    units,
    hospital,
    location: location || undefined,
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
    `৪. হাসপাতাল ও অবস্থান: **${hospital}${location ? `, ${location}` : ""}**\n` +
    `৫. প্রয়োজনীয় তারিখ: **${requiredDate}**\n` +
    `৬. জরুরি মাত্রা: **${emergencyLevel}**\n` +
    `৭. মোবাইল নম্বর: **${contact}**\n` +
    (email ? `৮. ইমেইল ঠিকানা: **${email}**\n\n` : `৮. ইমেইল: *(ফর্ম খোলার পর পূরণ করতে পারেন)*\n\n`) +
    `নিচের বাটনে ক্লিক করলেই আপনার সমস্ত তথ্যসহ অফিসিয়াল রক্তের আবেদন ফর্মটি সরাসরি খুলে যাবে। আপনি শুধু একবার রিভিউ করে 'Submit Request' বাটনে চাপবেন!`;

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
