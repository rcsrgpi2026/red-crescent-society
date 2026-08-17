import type { CardConfig, CardDesignConfig, MemberData } from "@/types/id-card";
import { RPI_LOGO_SVG, RCY_LOGO_SVG, WATERMARK_SVG } from "@/lib/id-card/vectors";

/**
 * Standard CR80 ID Card dimensions (3.375" x 2.125" / 85.6mm x 53.98mm)
 * At 300 DPI high resolution: ~1012px x 638px
 */
export const CARD_BASE_WIDTH = 1012;
export const CARD_BASE_HEIGHT = 638;

/** Website settings key that stores the admin-editable card design JSON. */
export const ID_CARD_SETTINGS_KEY = "id_card";

/**
 * Fonts available for the card. The families are loaded at runtime by the
 * card's own Google Fonts stylesheet (see components/id-card/card-fonts.tsx),
 * so these values are plain CSS family names.
 */
export const AVAILABLE_FONTS = [
  { name: "Oswald (Condensed Bold)", value: "'Oswald', sans-serif" },
  { name: "Roboto Condensed", value: "'Roboto Condensed', sans-serif" },
  { name: "Bebas Neue (Heavy)", value: "'Bebas Neue', sans-serif" },
  { name: "Saira Condensed (Condensed)", value: "'Saira Condensed', sans-serif" },
  { name: "Archivo Black (Heavy)", value: "'Archivo Black', sans-serif" },
  { name: "Montserrat (Modern)", value: "'Montserrat', sans-serif" },
  { name: "Poppins (Modern)", value: "'Poppins', sans-serif" },
  { name: "Inter (Clean Sans)", value: "'Inter', sans-serif" },
  { name: "Outfit (Geometric)", value: "'Outfit', sans-serif" },
  { name: "Hind Siliguri (Bengali + English)", value: "'Hind Siliguri', sans-serif" },
  { name: "Noto Sans Bengali", value: "'Noto Sans Bengali', sans-serif" },
];

/** Preview member shown in the admin editor while designing the card. */
export const DEFAULT_MEMBER_DATA: MemberData = {
  name: "Sample Member",
  roll: "215949",
  register: "1502392940",
  session: "2024-25",
  department: "Computer Science & Technology",
  designation: "General Member",
  validUntil: "2028",
  phone: "+8801XXX-XXXXXX",
  email: "member@example.com",
  facebook: "facebook.com/rcsrgpi",
  bloodGroup: "O+",
  idNumber: "RCR-2026-0001",
  customFields: [],
};

export const DEFAULT_CARD_CONFIG: CardConfig = {
  id: "default-rcy-template",
  name: "Rajshahi Govt Polytechnic Institute - RCY Official",
  member: DEFAULT_MEMBER_DATA,
  photo: {
    // Empty by default — the renderer falls back to an initials avatar.
    src: "",
    visible: true,
    scale: 1,
    x: 0,
    y: 0,
    rotate: 0,
    // "contain" keeps the whole photo visible inside any placeholder size —
    // no cropping, no distortion. Admins can override per design if needed.
    objectFit: "contain",
    width: 215,
    height: 275,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: "#4b5563",
    frameVisible: true,
    outerBorderWidth: 2,
    outerBorderColor: "#9ca3af",
    shadow: true,
  },
  logos: {
    instituteLogo: {
      src: RPI_LOGO_SVG,
      visible: true,
      width: 118,
      height: 118,
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
    },
    redCrescentLogo: {
      src: RCY_LOGO_SVG,
      visible: true,
      width: 118,
      height: 118,
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
    },
    footerLogoLeft: {
      src: RCY_LOGO_SVG,
      visible: true,
      width: 44,
      height: 44,
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
    },
    footerLogoRight: {
      src: RPI_LOGO_SVG,
      visible: true,
      width: 46,
      height: 46,
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
    },
  },
  watermark: {
    src: WATERMARK_SVG,
    visible: true,
    opacity: 0.18,
    scale: 1.15,
    rotation: -24,
    x: 20,
    y: -10,
    blendMode: "multiply",
  },
  header: {
    instituteTitle: "Rajshahi Govt. Polytechnic Institute",
    orgTitle: "RED CRESCENT YOUTH",
    instituteTitleFont: "'Oswald', 'Roboto Condensed', sans-serif",
    orgTitleFont: "'Oswald', 'Roboto Condensed', sans-serif",
    instituteTitleSize: 34,
    orgTitleSize: 36,
    instituteTitleStyle: "normal",
    orgTitleStyle: "normal",
    instituteTitleWeight: "700",
    orgTitleWeight: "800",
    instituteTitleColor: "#111827",
    orgTitleColor: "#111827",
    instituteTitleTracking: 0.8,
    orgTitleTracking: 1.5,
    lineSpacing: 2,
    marginTop: 24,
    marginBottom: 10,
    x: 0,
    y: 0,
  },
  labels: {
    name: "Name:",
    roll: "Roll:",
    register: "Register:",
    session: "Session:",
    department: "Department:",
    designation: "Designation (Member/Executive Member):",
    validUntil: "Valid Until:",
    phone: "Phone:",
    email: "Email:",
    facebook: "Facebook:",
    rcyDept: "RCY Dept.:",
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    labelFontFamily: "'Inter', sans-serif",
    valueFontFamily: "'Inter', sans-serif",
    labelFontSize: 23,
    valueFontSize: 22,
    labelFontWeight: "700",
    valueFontWeight: "600",
    labelColor: "#111827",
    valueColor: "#111827",
    underlineColor: "#111827",
    underlineThickness: 2,
    underlineGap: 4,
    lineHeight: 1.4,
  },
  fields: {
    name: true,
    roll: true,
    register: true,
    session: true,
    department: true,
    designation: true,
    validUntil: true,
    phone: false,
    email: false,
    facebook: false,
    rcyDept: true,
  },
  fieldOrder: ["name", "roll_session", "register_department", "designation"],
  footer: {
    visible: true,
    bgColor: "#dc2626",
    height: 72,
    orgName: "Red Crescent Youth",
    subtitle: "Rajshahi Govt. Polytechnic Institute",
    orgNameFontSize: 16.5,
    subtitleFontSize: 13.5,
    textColor: "#ffffff",
    subtitleColor: "rgba(255,255,255,0.92)",
    showLeftLogo: true,
    showRightLogo: true,
    fontSize: 13.5,
    contactColor: "#ffffff",
    yOffset: 0,
    contacts: [
      {
        id: "c1",
        type: "phone",
        label: "Phone",
        value: "+8801XXX-XXXXXX",
        visible: true,
        iconBgColor: "#16a34a",
      },
      {
        id: "c2",
        type: "facebook",
        label: "Facebook",
        value: "facebook.com/rcsrgpi",
        visible: true,
        iconBgColor: "#2563eb",
      },
      {
        id: "c3",
        type: "email",
        label: "Email",
        value: "rcy@example.com",
        visible: true,
        iconBgColor: "#ffffff",
      },
    ],
  },
  design: {
    width: CARD_BASE_WIDTH,
    height: CARD_BASE_HEIGHT,
    aspectRatio: "1.586",
    orientation: "landscape",
    backgroundColor: "#ffffff",
    backgroundGradient: "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
    backgroundImageOpacity: 1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
    primaryTextColor: "#111827",
    secondaryTextColor: "#4b5563",
    accentColor: "#dc2626",
    innerPadding: 24,
  },
  layout: {
    photoOffsetX: 0,
    photoOffsetY: 0,
    infoOffsetX: 0,
    infoOffsetY: 0,
    headerOffsetX: 0,
    headerOffsetY: 0,
    validUntilOffsetX: 0,
    validUntilOffsetY: 0,
  },
  backSide: {
    enabled: true,
    bgColor: "#ffffff",
    textColor: "#1f2937",
    title: "TERMS & INSTRUCTIONS",
    instructions: [
      "This card is the property of Red Crescent Youth, Rajshahi Govt. Polytechnic Institute unit.",
      "The cardholder is a certified volunteer / executive member authorized to engage in humanitarian & youth activities.",
      "If found, please return this card to the Red Crescent Youth office, RPI campus or contact the numbers below.",
      "Card validity is subject to active membership status and adherence to the BDRCS Code of Conduct.",
    ],
    issuedByTitle: "President / Unit Leader",
    authorizedSignatureTitle: "Authorized Signature",
    showQrCode: true,
    qrCodeData: "{member_id}",
    emergencyContact: "Emergency Hotline: 01614-424259",
    bloodGroupVisible: true,
  },
};

/**
 * The default admin-editable design half. Member data is always supplied
 * separately so every cardholder's details come from their live profile.
 */
export const DEFAULT_CARD_DESIGN: CardDesignConfig = (() => {
  const design = { ...DEFAULT_CARD_CONFIG };
  delete (design as { member?: unknown }).member;
  return design as unknown as CardDesignConfig;
})();
