import type {
  CardConfig,
  CardDesignConfig,
  CustomField,
  MemberData,
} from "@/types/id-card";
import {
  DEFAULT_CARD_CONFIG,
  DEFAULT_CARD_DESIGN,
  ID_CARD_SETTINGS_KEY,
} from "@/lib/id-card/constants";

/**
 * Deep-enough merge of a stored design over the defaults. Each section of the
 * design is merged key-by-key so older / partial stored configs (or configs
 * edited before a field existed) always render with sensible values.
 */
export function mergeDesignConfig(stored: unknown): CardDesignConfig {
  const base = DEFAULT_CARD_DESIGN;
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
    return base;
  }
  const s = stored as Record<string, unknown>;

  type SectionKey =
    | "photo"
    | "logos"
    | "watermark"
    | "header"
    | "labels"
    | "typography"
    | "fields"
    | "footer"
    | "design"
    | "layout"
    | "backSide";

  const mergeSection = <K extends SectionKey>(key: K): CardDesignConfig[K] => {
    const def = base[key] as unknown as Record<string, unknown>;
    const got = s[key];
    if (!got || typeof got !== "object" || Array.isArray(got)) {
      return def as unknown as CardDesignConfig[K];
    }
    return {
      ...def,
      ...(got as Record<string, unknown>),
    } as unknown as CardDesignConfig[K];
  };

  const merged: CardDesignConfig = {
    ...base,
    ...s,
    photo: mergeSection("photo"),
    logos: mergeSection("logos"),
    watermark: mergeSection("watermark"),
    header: mergeSection("header"),
    labels: mergeSection("labels"),
    typography: mergeSection("typography"),
    fields: mergeSection("fields"),
    footer: mergeSection("footer"),
    design: mergeSection("design"),
    layout: mergeSection("layout"),
    backSide: mergeSection("backSide"),
  };

  // Photos must always fit the placeholder: designs saved before the "contain"
  // default still carry the old "cover" value, which crops the member photo
  // whenever the placeholder size differs from the photo's aspect ratio.
  // Normalize it so every card shows the whole photo.
  if (merged.photo.objectFit === "cover") {
    merged.photo = { ...merged.photo, objectFit: "contain" };
  }

  // Arrays: take the stored array only when it is a real array.
  for (const key of ["fieldOrder"] as const) {
    const def = DEFAULT_CARD_DESIGN[key];
    const got = s[key];
    if (Array.isArray(got)) {
      merged[key] = got as string[];
    } else {
      merged[key] = def;
    }
  }
  const storedInstructions = (s.backSide as Record<string, unknown> | undefined)?.instructions;
  if (Array.isArray(storedInstructions)) {
    merged.backSide.instructions = storedInstructions as string[];
  }
  const storedContacts = (s.footer as Record<string, unknown> | undefined)?.contacts;
  if (Array.isArray(storedContacts)) {
    merged.footer.contacts = storedContacts as CardDesignConfig["footer"]["contacts"];
  }

  // Normalize legacy institute titles (missing "Govt." / the period) so every
  // card — including previously saved designs — reads "Rajshahi Govt.
  // Polytechnic Institute". Admins can still change it afterwards.
  const LEGACY_INSTITUTE_TITLES = new Set([
    "RAJSHAHI POLYTECHNIC INSTITUTE",
    "RAJSHAHI GOVT POLYTECHNIC INSTITUTE",
    "RAJSHAHI GOVT. POLYTECHNIC INSTITUTE",
  ]);
  const currentTitle = String(merged.header.instituteTitle ?? "").trim().toUpperCase();
  if (LEGACY_INSTITUTE_TITLES.has(currentTitle)) {
    merged.header.instituteTitle = "Rajshahi Govt. Polytechnic Institute";
  }

  return merged;
}

/** Extracts and parses the stored card design from the website settings map. */
export function designFromSettings(
  settings: Record<string, Record<string, string | number>>
): CardDesignConfig {
  const raw = settings[ID_CARD_SETTINGS_KEY]?.config;
  if (!raw || typeof raw !== "string") {
    return DEFAULT_CARD_DESIGN;
  }
  try {
    return mergeDesignConfig(JSON.parse(raw));
  } catch {
    return DEFAULT_CARD_DESIGN;
  }
}

/**
 * Builds a full card config by injecting the cardholder's member data and
 * profile photo. The photo comes from the member's own `photo_url` record;
 * when there is none the design's default (initials placeholder) is used.
 */
export function buildCardConfig(
  design: CardDesignConfig,
  member: MemberData,
  photoUrl?: string | null
): CardConfig {
  return {
    ...design,
    member,
    photo: { ...design.photo, src: photoUrl || design.photo.src || "" },
  };
}

/** Derives a "Valid Until" year from an academic session (e.g. 2024-25 → 2028). */
function validUntilFromSession(session: string | null | undefined): string {
  if (!session) return "";
  const match = session.trim().match(/^(\d{4})/);
  if (!match) return "";
  const start = Number(match[1]);
  if (!Number.isFinite(start)) return "";
  return String(start + 4);
}

/**
 * Short abbreviations for the college departments, used on the ID card
 * (e.g. "Computer Science & Technology" → "CST"). Unknown names pass through.
 */
const DEPARTMENT_SHORT_NAMES: Record<string, string> = {
  "Computer Science & Technology": "CST",
  "Electronics Technology": "ET",
  "Electrical Technology": "EET",
  "Mechanical Technology": "MT",
  "Civil Technology": "CT",
  "Power Technology": "PT",
  "Food Technology": "FT",
  "Automobile Technology": "AUT",
  "Architecture & Interior Design": "AID",
  "Refrigeration & Air Conditioning": "RAC",
  Other: "Other",
};

/** Returns the short form of a college department, or the name as-is when unknown. */
export function departmentShortName(full: string | null | undefined): string {
  if (!full) return "";
  return DEPARTMENT_SHORT_NAMES[full] ?? full;
}

/**
 * Maps a team member record to the card's member data. Registration, roll,
 * department, session and designation map directly; the member ID powers the
 * back-side QR code.
 */
export function memberFromTeamMember(tm: {
  name: string;
  roll: string | null;
  registration_no: string | null;
  session: string | null;
  department: string | null;
  rcy_department?: string | null;
  position: string;
  phone?: string | null;
  email?: string | null;
  blood_group?: string | null;
  member_id?: string | null;
}): MemberData {
  const customFields: CustomField[] = [];
  if (tm.rcy_department) {
    customFields.push({
      id: "rcy-dept",
      label: "RCY Dept.",
      value: tm.rcy_department,
      visible: true,
      order: 0,
    });
  }
  return {
    name: tm.name || "",
    roll: tm.roll ?? "",
    register: tm.registration_no ?? "",
    session: tm.session ?? "",
    department: departmentShortName(tm.department),
    designation: tm.position || "",
    validUntil: validUntilFromSession(tm.session),
    phone: tm.phone ?? "",
    email: tm.email ?? "",
    facebook: "",
    bloodGroup: tm.blood_group ?? "",
    idNumber: tm.member_id ?? "",
    customFields,
  };
}

/** Maps a student record to the card's member data (no registration/designation). */
export function memberFromStudent(s: {
  name: string;
  roll: string;
  session: string;
  department: string;
  phone?: string;
  email?: string;
  blood_group?: string | null;
}): MemberData {
  return {
    name: s.name || "",
    roll: s.roll ?? "",
    register: "",
    session: s.session ?? "",
    department: departmentShortName(s.department),
    designation: "",
    validUntil: validUntilFromSession(s.session),
    phone: s.phone ?? "",
    email: s.email ?? "",
    facebook: "",
    bloodGroup: s.blood_group ?? "",
    idNumber: "",
    customFields: [],
  };
}

/**
 * Resolves the back-side QR payload. Supports `{member_id}`, `{roll}` and
 * `{name}` placeholders so the template can be shared by every cardholder.
 */
export function resolveQrData(
  template: string,
  member: MemberData
): string {
  if (!template) return "";
  return template
    .replaceAll("{member_id}", member.idNumber || member.roll || "")
    .replaceAll("{roll}", member.roll || "")
    .replaceAll("{name}", member.name || "");
}

/** Defaults used when a fresh config is needed (e.g. admin reset). */
export { DEFAULT_CARD_CONFIG, DEFAULT_CARD_DESIGN };
