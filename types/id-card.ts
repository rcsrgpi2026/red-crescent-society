/**
 * ID card configuration model — ported from the standalone RCY ID card
 * builder. The whole card is driven by one `CardConfig`: a global design
 * (logos, watermark, header, typography, footer, back side) merged with the
 * cardholder's own member data. The design half is stored in the
 * `website_settings` table (key `id_card`) and edited by admins; the member
 * half always comes from the member's live profile record.
 */

export type CardOrientation = "landscape" | "portrait";
export type CardSide = "front" | "back";

export interface CustomField {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  order: number;
}

export interface MemberData {
  name: string;
  roll: string;
  register: string;
  session: string;
  department: string;
  designation: string;
  validUntil: string;
  phone?: string;
  email?: string;
  facebook?: string;
  bloodGroup?: string;
  idNumber?: string;
  customFields?: CustomField[];
}

export interface PhotoConfig {
  src: string;
  visible: boolean;
  scale: number; // 0.5 to 3
  x: number; // offset px
  y: number; // offset px
  rotate: number; // -180 to 180 deg
  objectFit: "cover" | "contain" | "fill";
  width: number; // px
  height: number; // px
  borderRadius: number; // px
  borderWidth: number; // px
  borderColor: string;
  frameVisible: boolean;
  outerBorderWidth: number;
  outerBorderColor: string;
  shadow: boolean;
}

export interface SingleLogoConfig {
  src: string;
  visible: boolean;
  width: number;
  height: number;
  opacity: number;
  x: number;
  y: number;
  scale: number;
}

export interface LogosConfig {
  instituteLogo: SingleLogoConfig;
  redCrescentLogo: SingleLogoConfig;
  footerLogoLeft: SingleLogoConfig;
  footerLogoRight: SingleLogoConfig;
}

export interface WatermarkConfig {
  src: string;
  visible: boolean;
  opacity: number; // 0 to 1
  scale: number;
  rotation: number; // degrees
  x: number;
  y: number;
  blendMode: "normal" | "multiply" | "darken" | "overlay";
}

export interface HeaderConfig {
  instituteTitle: string;
  orgTitle: string;
  instituteTitleFont: string;
  orgTitleFont: string;
  instituteTitleSize: number;
  orgTitleSize: number;
  /** CSS font-style — "normal" or "italic". */
  instituteTitleStyle: string;
  /** CSS font-style — "normal" or "italic". */
  orgTitleStyle: string;
  instituteTitleWeight: string;
  orgTitleWeight: string;
  instituteTitleColor: string;
  orgTitleColor: string;
  instituteTitleTracking: number;
  orgTitleTracking: number;
  lineSpacing: number;
  marginTop: number;
  marginBottom: number;
  x: number;
  y: number;
}

export interface FieldLabelsConfig {
  name: string;
  roll: string;
  register: string;
  session: string;
  department: string;
  designation: string;
  validUntil: string;
  phone: string;
  email: string;
  facebook: string;
  rcyDept: string;
}

export interface TypographyConfig {
  fontFamily: string;
  labelFontFamily: string;
  valueFontFamily: string;
  labelFontSize: number;
  valueFontSize: number;
  labelFontWeight: string;
  valueFontWeight: string;
  labelColor: string;
  valueColor: string;
  underlineColor: string;
  underlineThickness: number;
  underlineGap: number;
  lineHeight: number;
}

export interface FieldVisibilityConfig {
  name: boolean;
  roll: boolean;
  register: boolean;
  session: boolean;
  department: boolean;
  designation: boolean;
  validUntil: boolean;
  phone: boolean;
  email: boolean;
  facebook: boolean;
  rcyDept: boolean;
}

export interface ContactItem {
  id: string;
  type: "phone" | "email" | "facebook" | "web" | "location" | "custom";
  label: string;
  value: string;
  visible: boolean;
  iconBgColor?: string;
}

export interface FooterConfig {
  visible: boolean;
  bgColor: string;
  height: number;
  orgName: string;
  subtitle: string;
  orgNameFontSize: number;
  subtitleFontSize: number;
  textColor: string;
  subtitleColor: string;
  showLeftLogo: boolean;
  showRightLogo: boolean;
  contacts: ContactItem[];
  fontSize: number;
  contactColor: string;
  yOffset: number;
}

export interface CardSurfaceConfig {
  width: number; // in px at base render (e.g., 1012px)
  height: number; // in px at base render (e.g., 638px)
  aspectRatio: string;
  orientation: CardOrientation;
  backgroundColor: string;
  backgroundGradient?: string;
  backgroundImage?: string;
  backgroundImageOpacity: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  shadow: string;
  primaryTextColor: string;
  secondaryTextColor: string;
  accentColor: string;
  innerPadding: number;
}

export interface AdvancedLayoutConfig {
  photoOffsetX: number;
  photoOffsetY: number;
  infoOffsetX: number;
  infoOffsetY: number;
  headerOffsetX: number;
  headerOffsetY: number;
  validUntilOffsetX: number;
  validUntilOffsetY: number;
}

export interface BackSideConfig {
  enabled: boolean;
  bgColor: string;
  textColor: string;
  title: string;
  instructions: string[];
  issuedByTitle: string;
  authorizedSignatureTitle: string;
  signatureImage?: string;
  showQrCode: boolean;
  /** May contain {member_id} / {roll} placeholders, resolved per cardholder. */
  qrCodeData: string;
  emergencyContact: string;
  bloodGroupVisible: boolean;
}

export interface CardConfig {
  id: string;
  name: string;
  member: MemberData;
  photo: PhotoConfig;
  logos: LogosConfig;
  watermark: WatermarkConfig;
  header: HeaderConfig;
  labels: FieldLabelsConfig;
  typography: TypographyConfig;
  fields: FieldVisibilityConfig;
  fieldOrder: string[];
  footer: FooterConfig;
  design: CardSurfaceConfig;
  layout: AdvancedLayoutConfig;
  backSide: BackSideConfig;
  createdAt?: string;
  updatedAt?: string;
}

/** The global, admin-editable half of the card (everything except member data). */
export type CardDesignConfig = Omit<CardConfig, "member">;

/** Alias kept for callers that only care about the card surface (design) section. */
export type CardSurface = CardSurfaceConfig;
