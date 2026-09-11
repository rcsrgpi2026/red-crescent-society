import { Resend } from "resend";
export {
  sendPasswordResetEmail,
  buildPasswordResetHtml,
  type SendPasswordResetEmailParams,
  type EmailResult,
} from "./mailer";

const resendApiKey = process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const DEFAULT_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ||
  "Red Crescent Youth <redcrescentyouthrgpi@gmail.com>";
