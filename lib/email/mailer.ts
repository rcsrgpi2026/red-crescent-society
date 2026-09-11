import nodemailer from "nodemailer";
import { Resend } from "resend";

export interface SendPasswordResetEmailParams {
  to: string;
  resetLink: string;
  recipientName?: string | null;
}

export interface EmailResult {
  success: boolean;
  error?: string;
  provider?: "smtp" | "resend";
}

const smtpUser = process.env.SMTP_USER || "redcrescentyouthrgpi@gmail.com";
const smtpPass = process.env.SMTP_PASS?.replace(/\s+/g, "");
const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT) || 465;
const smtpSecure = process.env.SMTP_SECURE !== "false";
const fromName = process.env.SMTP_FROM_NAME || "Red Crescent Youth";
const defaultFrom = `"${fromName}" <${smtpUser}>`;

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const resendFrom = process.env.RESEND_FROM_EMAIL || defaultFrom;

/**
 * Creates Nodemailer transporter for Gmail SMTP
 */
function createSmtpTransporter() {
  if (!smtpPass) return null;

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    // Optional timeout settings
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });
}

/**
 * Generates the responsive HTML template for password reset emails
 */
export function buildPasswordResetHtml({
  resetLink,
  recipientName,
}: {
  resetLink: string;
  recipientName?: string | null;
}): string {
  const nameGreeting = recipientName ? `Hello ${recipientName},` : "Hello,";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Red Crescent Youth</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      color: #1e293b;
    }
    .container {
      max-width: 580px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 32px 28px;
      text-align: center;
      border-bottom: 3px solid #dc2626;
    }
    .header-badge {
      display: inline-block;
      background: rgba(220, 38, 38, 0.18);
      color: #fca5a5;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 9999px;
      margin-bottom: 12px;
      border: 1px solid rgba(220, 38, 38, 0.35);
    }
    .header h1 {
      color: #ffffff;
      font-size: 22px;
      font-weight: 800;
      margin: 0 0 6px 0;
      letter-spacing: -0.02em;
    }
    .header p {
      color: #94a3b8;
      font-size: 13px;
      margin: 0;
    }
    .content {
      padding: 36px 32px;
    }
    .greeting {
      font-size: 17px;
      font-weight: 600;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .text {
      font-size: 15px;
      line-height: 1.65;
      color: #475569;
      margin-bottom: 24px;
    }
    .cta-box {
      text-align: center;
      margin: 32px 0;
    }
    .btn {
      display: inline-block;
      background-color: #dc2626;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 34px;
      border-radius: 10px;
      box-shadow: 0 4px 14px rgba(220, 38, 38, 0.35);
    }
    .btn:hover {
      background-color: #b91c1c;
    }
    .note-box {
      background-color: #f1f5f9;
      border-left: 4px solid #dc2626;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 24px;
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
    }
    .alt-link {
      font-size: 12px;
      color: #94a3b8;
      word-break: break-all;
      margin-top: 20px;
      line-height: 1.5;
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-badge">Red Crescent Youth</div>
      <h1>Password Reset Request</h1>
      <p>Rajshahi Govt. Polytechnic Institute RCY Portal</p>
    </div>
    <div class="content">
      <p class="greeting">${nameGreeting}</p>
      <p class="text">
        We received a request to reset the password for your account in the Red Crescent Youth portal. Click the button below to choose a new password:
      </p>
      <div class="cta-box">
        <a href="${resetLink}" class="btn" target="_blank" rel="noopener noreferrer">Reset My Password</a>
      </div>
      <div class="note-box">
        <strong>Security Notice:</strong> This password reset link is valid for <strong>1 hour</strong>. If you did not make this request, you can safely ignore this email — your password will remain unchanged.
      </div>
      <div class="alt-link">
        If the button above does not work, copy and paste the following URL into your browser:<br>
        <a href="${resetLink}" style="color: #dc2626;">${resetLink}</a>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Red Crescent Youth, Rajshahi Govt. Polytechnic Institute.<br>
      Serving humanity with dignity and impartiality.
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Sends a password reset email.
 * Priority 1: Gmail SMTP (via Nodemailer) if SMTP_PASS is configured.
 * Priority 2: Resend API if RESEND_API_KEY is configured.
 */
export async function sendPasswordResetEmail({
  to,
  resetLink,
  recipientName,
}: SendPasswordResetEmailParams): Promise<EmailResult> {
  const htmlContent = buildPasswordResetHtml({ resetLink, recipientName });
  const subject = "Reset your Red Crescent Youth portal password";
  const textContent = `Hello${recipientName ? ` ${recipientName}` : ""},\n\nWe received a request to reset your password. Please open the link below within 1 hour:\n\n${resetLink}\n\nIf you did not request this, you can ignore this email.`;

  // 1. Try Gmail SMTP if configured
  if (smtpPass) {
    try {
      const transporter = createSmtpTransporter();
      if (transporter) {
        await transporter.sendMail({
          from: defaultFrom,
          to,
          subject,
          text: textContent,
          html: htmlContent,
        });

        return { success: true, provider: "smtp" };
      }
    } catch (smtpErr: unknown) {
      const msg = smtpErr instanceof Error ? smtpErr.message : "SMTP sending failed";
      console.error("[Mailer SMTP Error]:", smtpErr);
      // Don't immediately fail if Resend is also available as a backup
      if (!resend) {
        return { success: false, error: msg, provider: "smtp" };
      }
    }
  }

  // 2. Try Resend if configured
  if (resend) {
    try {
      const { error } = await resend.emails.send({
        from: resendFrom,
        to: [to],
        subject,
        html: htmlContent,
      });

      if (error) {
        console.error("[Mailer Resend Error]:", error);
        return { success: false, error: error.message, provider: "resend" };
      }

      return { success: true, provider: "resend" };
    } catch (resendErr: unknown) {
      const msg = resendErr instanceof Error ? resendErr.message : "Resend sending failed";
      console.error("[Mailer Resend Exception]:", resendErr);
      return { success: false, error: msg, provider: "resend" };
    }
  }

  return {
    success: false,
    error: "No email provider configured (SMTP_PASS or RESEND_API_KEY required).",
  };
}
