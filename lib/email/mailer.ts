import nodemailer from "nodemailer";
import { Resend } from "resend";
import { sanitizeCampaignUrl } from "@/lib/campaign-utils";
import { getAppUrl } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";

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

export function getSmtpConfig() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = process.env.SMTP_SECURE !== "false";
  const user = process.env.SMTP_USER || "redcrescentyouthrgpi@gmail.com";
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, "");
  const fromName = (process.env.SMTP_FROM_NAME || "Red Crescent Youth").replace(/^["']|["']$/g, "").trim();
  const defaultFrom = `"${fromName}" <${user}>`;

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM_EMAIL || defaultFrom;

  return { host, port, secure, user, pass, fromName, defaultFrom, resendApiKey, resendFrom };
}

/**
 * Creates Nodemailer transporter for Gmail SMTP with connection pooling and safe timeouts
 */
function createSmtpTransporter({ pool = false }: { pool?: boolean } = {}) {
  const config = getSmtpConfig();
  if (!config.pass) return null;

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    pool,
    maxConnections: pool ? 3 : 1,
    maxMessages: 50,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
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
      <div style="margin: 0 0 12px 0;">
        <a href="https://facebook.com/rcsrgpi" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin: 0 4px; padding: 5px 12px; background-color: #1877f2; color: #ffffff !important; text-decoration: none; border-radius: 16px; font-size: 11px; font-weight: 600;">
          Facebook
        </a>
        <a href="https://instagram.com/rcy_rgpi" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin: 0 4px; padding: 5px 12px; background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); color: #ffffff !important; text-decoration: none; border-radius: 16px; font-size: 11px; font-weight: 600;">
          Instagram
        </a>
      </div>
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

  const config = getSmtpConfig();
  const resendClient = config.resendApiKey ? new Resend(config.resendApiKey) : null;

  // 1. Try Gmail SMTP if configured
  if (config.pass) {
    try {
      const transporter = createSmtpTransporter();
      if (transporter) {
        await transporter.sendMail({
          from: config.defaultFrom,
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
      if (!resendClient) {
        return { success: false, error: msg, provider: "smtp" };
      }
    }
  }

  // 2. Try Resend if configured
  if (resendClient) {
    try {
      const { error } = await resendClient.emails.send({
        from: config.resendFrom,
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

export interface BuildCampaignHtmlParams {
  subject: string;
  heading: string;
  body: string;
  badge?: string | null;
  recipientName?: string | null;
  recipientEmail?: string | null;
  buttonText?: string | null;
  buttonUrl?: string | null;
  secondaryInfo?: string | null;
}

/**
 * Builds a responsive, branded HTML email template for RCY email campaigns,
 * strictly optimized for spam filters.
 */
export function buildCampaignHtml({
  subject,
  heading,
  body,
  badge = "Announcement",
  recipientName,
  buttonText,
  buttonUrl,
  secondaryInfo,
}: BuildCampaignHtmlParams): string {
  const greeting = recipientName ? `Hello ${recipientName},` : "Dear RCY Member,";
  const safeButtonUrl = sanitizeCampaignUrl(buttonUrl);

  // Convert raw line breaks into clean paragraph tags
  const formattedBody = body
    .split(/\n\s*\n/)
    .map((paragraph) => {
      const clean = paragraph.trim().replace(/\n/g, "<br>");
      return clean
        ? `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.7; color: #334155;">${clean}</p>`
        : "";
    })
    .join("");

  const ctaSection =
    buttonText && safeButtonUrl
      ? `
      <div style="text-align: center; margin: 28px 0 14px 0;">
        <a href="${safeButtonUrl}" target="_blank" rel="noopener noreferrer" class="btn">
          ${buttonText}
        </a>
      </div>
    `
      : "";

  const secondarySection = secondaryInfo
    ? `
      <div style="background-color: #f8fafc; border-left: 4px solid #dc2626; border-radius: 8px; padding: 14px 18px; margin: 22px 0; font-size: 13.5px; color: #475569; line-height: 1.6;">
        ${secondaryInfo.replace(/\n/g, "<br>")}
      </div>
    `
      : "";

  const contentHtml = `
    <h2 style="margin: 0 0 14px 0; font-size: 20px; color: #0f172a; font-weight: 700; line-height: 1.35;">
      ${heading}
    </h2>
    <p style="font-size: 15px; font-weight: 600; color: #0f172a; margin: 0 0 14px 0;">
      ${greeting}
    </p>
    ${formattedBody}
    ${secondarySection}
    ${ctaSection}
  `;

  return buildBrandedEmailShell({
    preheader: body.replace(/[\r\n\t]+/g, " ").trim().slice(0, 110),
    badgeText: badge || "Red Crescent Youth",
    title: heading || subject,
    contentHtml,
    footerNote: "You received this official update as a registered member or contact of RCY RGPI.",
  });
}

export interface SendCampaignBatchParams {
  recipients: Array<{ email: string; name?: string | null }>;
  campaign: {
    subject: string;
    heading: string;
    body: string;
    badge?: string | null;
    buttonText?: string | null;
    buttonUrl?: string | null;
    secondaryInfo?: string | null;
  };
}

export interface BatchSendResult {
  successCount: number;
  failedCount: number;
  errors: Array<{ email: string; error: string }>;
}

/**
 * Sends a batch of campaign emails to a list of recipients with strict anti-spam compliance:
 * - Omits custom forged messageId so Gmail SMTP automatically assigns authentic cryptographic Google Message-IDs.
 * - Standard RFC List-Unsubscribe, List-Unsubscribe-Post, and Auto-Submitted headers.
 * - Controlled sequential dispatch with gentle delay to avoid Gmail outbound burst spam detection.
 */
export async function sendCampaignEmailBatch({
  recipients,
  campaign,
}: SendCampaignBatchParams): Promise<BatchSendResult> {
  const result: BatchSendResult = {
    successCount: 0,
    failedCount: 0,
    errors: [],
  };

  if (!recipients || recipients.length === 0) {
    return result;
  }

  const config = getSmtpConfig();

  try {
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const cleanEmail = recipient.email.trim();
      if (!cleanEmail || !cleanEmail.includes("@")) {
        result.failedCount++;
        result.errors.push({ email: cleanEmail, error: "Invalid email address" });
        continue;
      }

      const html = buildCampaignHtml({
        subject: campaign.subject,
        heading: campaign.heading,
        body: campaign.body,
        badge: campaign.badge,
        recipientName: recipient.name,
        recipientEmail: cleanEmail,
        buttonText: campaign.buttonText,
        buttonUrl: campaign.buttonUrl,
        secondaryInfo: campaign.secondaryInfo,
      });

      const safeBtnUrl = sanitizeCampaignUrl(campaign.buttonUrl);
      const textVersion = [
        recipient.name ? `Hello ${recipient.name},` : "Hello,",
        "",
        campaign.heading,
        "",
        campaign.body,
        "",
        campaign.secondaryInfo ? `Important Details:\n${campaign.secondaryInfo}` : "",
        campaign.buttonText && safeBtnUrl ? `${campaign.buttonText}: ${safeBtnUrl}` : "",
        "",
        "---",
        "Red Crescent Youth, Rajshahi Govt. Polytechnic Institute",
        "Kazla, Rajshahi-6203, Bangladesh",
        `Contact: ${config.user}`,
      ]
        .filter((line) => line !== undefined && line !== null)
        .join("\n");

      // Clean notification headers (identical to successful transactional system emails)
      // Removing "Precedence: bulk" and raw List-Unsubscribe headers that trigger Gmail spam classification on personal/SMTP senders
      const headers: Record<string, string> = {
        "X-Mailer": "Red Crescent Youth Notification Engine",
        "X-Priority": "3",
        "Auto-Submitted": "auto-generated",
      };

      const sendRes = await sendSystemEmail({
        to: cleanEmail,
        subject: campaign.subject,
        html,
        text: textVersion,
        replyTo: config.user,
      });

      if (sendRes.success) {
        result.successCount++;
        console.log(`[Batch Send Success]: ${cleanEmail}`);
      } else {
        result.failedCount++;
        result.errors.push({
          email: cleanEmail,
          error: sendRes.error || "Failed to deliver email through configured providers.",
        });
      }

      // Polite 200ms inter-mail interval inside batch to prevent Gmail SMTP burst flags
      if (i < recipients.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  } catch (batchErr: any) {
    console.error("[sendCampaignEmailBatch critical error]:", batchErr);
  }

  return result;
}

/* -------------------------------------------------------------------------- */
/*              TRANSACTIONAL & NOTIFICATION EMAIL DISPATCH ENGINE            */
/* -------------------------------------------------------------------------- */

export interface SendSystemEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  priority?: "high" | "normal" | "low";
}

/**
 * Sends a single transactional email with strict anti-spam compliance:
 * - Dual multipart/alternative (HTML + clean plain text alternative)
 * - Authentic authenticated SMTP envelope alignment
 * - Standard RFC header hygiene
 */
export async function sendSystemEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  priority = "normal",
}: SendSystemEmailOptions): Promise<EmailResult> {
  const config = getSmtpConfig();
  const resendClient = config.resendApiKey ? new Resend(config.resendApiKey) : null;
  const cleanTo = to.trim().toLowerCase();

  const priorityHeader = priority === "high" ? "1" : priority === "low" ? "5" : "3";
  const headers = {
    "X-Mailer": "Red Crescent Youth Notification Engine",
    "X-Priority": priorityHeader,
    "Auto-Submitted": "auto-generated",
  };

  console.log(`[System Email] Attempting to send "${subject}" to ${cleanTo}...`);

  // 1. Try Gmail SMTP if configured (Primary)
  if (config.pass) {
    try {
      const transporter = createSmtpTransporter();
      if (transporter) {
        const info = await transporter.sendMail({
          from: config.defaultFrom,
          to: cleanTo,
          replyTo: replyTo || config.user,
          subject,
          text,
          html,
          headers,
        });
        console.log(`[System Email Sent]: "${subject}" delivered to ${cleanTo} via SMTP (${info.messageId})`);
        return { success: true, provider: "smtp" };
      }
    } catch (smtpErr: unknown) {
      const msg = smtpErr instanceof Error ? smtpErr.message : "SMTP sending failed";
      console.error("[System Email SMTP Error]:", smtpErr);
      if (!resendClient) {
        return { success: false, error: msg, provider: "smtp" };
      }
    }
  }

  // 2. Try Resend if configured (Fallback)
  if (resendClient) {
    try {
      const { data, error } = await resendClient.emails.send({
        from: config.resendFrom,
        to: [cleanTo],
        replyTo: replyTo || undefined,
        subject,
        html,
        text,
      });

      if (error) {
        console.error("[System Email Resend Error]:", error);
        return { success: false, error: error.message, provider: "resend" };
      }
      console.log(`[System Email Sent]: "${subject}" delivered to ${cleanTo} via Resend (${data?.id})`);
      return { success: true, provider: "resend" };
    } catch (resendErr: unknown) {
      const msg = resendErr instanceof Error ? resendErr.message : "Resend sending failed";
      console.error("[System Email Resend Exception]:", resendErr);
      return { success: false, error: msg, provider: "resend" };
    }
  }

  return {
    success: false,
    error: "No email provider configured (SMTP_PASS or RESEND_API_KEY required).",
  };
}

export function getEmailPublicUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl.replace(/\/+$/, "");
  }
  return "https://rgpircy.vercel.app";
}

/**
 * Master HTML Email Shell optimized for deliverability and high inbox placement.
 */
function buildBrandedEmailShell({
  preheader,
  badgeText = "Red Crescent Youth",
  title,
  contentHtml,
  footerNote,
}: {
  preheader: string;
  badgeText?: string;
  title: string;
  contentHtml: string;
  footerNote?: string;
}): string {
  const appUrl = getEmailPublicUrl();

  return `<!DOCTYPE html>
<html lang="bn" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0 !important;
      padding: 0 !important;
      background-color: #f1f5f9;
      color: #334155;
      width: 100% !important;
    }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f1f5f9; padding: 24px 0; }
    .main-table {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 28px 24px;
      text-align: center;
      border-bottom: 3px solid #dc2626;
    }
    .badge {
      display: inline-block;
      background-color: rgba(220, 38, 38, 0.22);
      color: #fca5a5;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 5px 14px;
      border-radius: 9999px;
      border: 1px solid rgba(220, 38, 38, 0.35);
      margin-bottom: 10px;
    }
    .org-title {
      margin: 0;
      color: #ffffff;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .org-sub {
      margin: 4px 0 0 0;
      color: #94a3b8;
      font-size: 13px;
      font-weight: 500;
    }
    .content-body { padding: 32px 28px; }
    .btn {
      display: inline-block;
      background-color: #dc2626;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      padding: 13px 30px;
      border-radius: 10px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
    }
    .card-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px 20px;
      margin: 20px 0;
    }
    .card-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #edf2f7;
      font-size: 13.5px;
    }
    .card-row:last-child { border-bottom: none; }
    .card-label { color: #64748b; font-weight: 600; }
    .card-value { color: #0f172a; font-weight: 700; text-align: right; }
    .footer {
      background-color: #f8fafc;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
      line-height: 1.6;
    }
    .footer a { color: #dc2626; text-decoration: none; font-weight: 600; }
    @media only screen and (max-width: 600px) {
      .content-body { padding: 24px 18px !important; }
      .header { padding: 24px 16px !important; }
      .org-title { font-size: 18px !important; }
      .btn { width: 100% !important; box-sizing: border-box; }
    }
  </style>
</head>
<body>
  <div style="display: none; font-size: 1px; color: #f1f5f9; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${preheader}
  </div>
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="wrapper">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="main-table">
          <tr>
            <td class="header">
              <span class="badge">${badgeText}</span>
              <h1 class="org-title">Red Crescent Youth</h1>
              <p class="org-sub">Rajshahi Government Polytechnic Institute</p>
            </td>
          </tr>
          <tr>
            <td class="content-body">
              ${contentHtml}
            </td>
          </tr>
          <tr>
            <td class="footer">
              ${footerNote ? `<p style="margin: 0 0 10px 0; color: #475569; font-size: 12.5px;">${footerNote}</p>` : ""}
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #334155;">
                বাংলাদেশ রেড ক্রিসেন্ট সোসাইটি · যুব রেড ক্রিসেন্ট দল<br>
                রাজশাহী পলিটেকনিক ইনস্টিটিউট শাখা
              </p>
              <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 11px;">
                Rajshahi Government Polytechnic Institute, Kazla, Rajshahi-6203, Bangladesh
              </p>
              <div style="margin: 12px 0 10px 0;">
                <a href="https://facebook.com/rcsrgpi" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin: 0 4px; padding: 5px 12px; background-color: #1877f2; color: #ffffff !important; text-decoration: none; border-radius: 16px; font-size: 11px; font-weight: 600;">
                  Facebook
                </a>
                <a href="https://instagram.com/rcy_rgpi" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin: 0 4px; padding: 5px 12px; background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); color: #ffffff !important; text-decoration: none; border-radius: 16px; font-size: 11px; font-weight: 600;">
                  Instagram
                </a>
              </div>
              <!-- 1-Click Add to Contacts & Safe Sender Badge -->
              <div style="margin: 18px 0 16px 0; padding: 14px 16px; background-color: #f1f5f9; border-radius: 12px; border: 1px dashed #cbd5e1; text-align: center;">
                <p style="margin: 0 0 8px 0; font-size: 11.5px; color: #334155; font-weight: 700;">
                  📬 নিয়মিত নোটিশ ও জরুরি রক্তের আবেদন সরাসরি ইনবক্সে পেতে:
                </p>
                <div style="margin: 6px 0;">
                  <a href="https://contacts.google.com/new?email=supportrgpircy@gmail.com&name=Red+Crescent+Youth+RGPI" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin: 3px 4px; padding: 7px 14px; background-color: #ffffff; color: #1e293b !important; text-decoration: none; border-radius: 20px; font-size: 11px; font-weight: 700; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
                    ➕ Add to Google Contacts
                  </a>
                  <a href="${appUrl}/api/vcard" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin: 3px 4px; padding: 7px 14px; background-color: #dc2626; color: #ffffff !important; text-decoration: none; border-radius: 20px; font-size: 11px; font-weight: 700; box-shadow: 0 1px 3px rgba(220,38,38,0.25);">
                    📇 Save Phone Contact (.vcf)
                  </a>
                </div>
                <p style="margin: 6px 0 0 0; font-size: 10.5px; color: #64748b;">
                  মেইলটি Spam এ পেয়ে থাকলে অনুগ্রহ করে <strong>&apos;Report not spam&apos;</strong> এ ক্লিক করুন।
                </p>
              </div>

              <p style="margin: 0; font-size: 11.5px;">
                <a href="${appUrl}">Website</a> · 
                <a href="mailto:supportrgpircy@gmail.com">Help & Support</a> · 
                <a href="${appUrl}/blood-support">Blood Support</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* -------------------------------------------------------------------------- */
/*                        1. BLOOD REQUEST EMAIL FLOWS                        */
/* -------------------------------------------------------------------------- */

export interface BloodRequestEmailParams {
  requestId: string;
  requesterName: string;
  requesterEmail?: string | null;
  requesterContact: string;
  patientName: string;
  bloodGroup: string;
  units: number;
  hospital?: string | null;
  location: string;
  requiredDate?: string | null;
  emergencyLevel: string;
  additionalInfo?: string | null;
}

/**
 * Sends both the requester confirmation and admin urgent alert asynchronously
 */
export async function sendBloodRequestEmails(params: BloodRequestEmailParams): Promise<void> {
  const config = getSmtpConfig();
  const appUrl = getAppUrl();
  const trackUrl = `${appUrl}/blood-support/request/${params.requestId}`;
  const adminUrl = `${appUrl}/admin/blood-requests`;

  const emergencyTag =
    params.emergencyLevel === "EMERGENCY"
      ? "🔴 জরুরী (EMERGENCY)"
      : params.emergencyLevel === "URGENT"
      ? "🟠 প্রয়োজনীয় (URGENT)"
      : "🟢 সাধারণ (ROUTINE)";

  // A. Requester Confirmation Email
  if (params.requesterEmail && params.requesterEmail.includes("@")) {
    const requesterHtml = buildBrandedEmailShell({
      preheader: `আপনার রক্তের অনুরোধ (#${params.requestId.slice(0, 8)}) গ্রহণ করা হয়েছে। ট্র্যাকিং লিংক দেখুন।`,
      badgeText: "রক্তের অনুরোধ প্রাপ্তি",
      title: "রক্তের অনুরোধ গ্রহণ — রেড ক্রিসেন্ট যুব দল",
      contentHtml: `
        <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #0f172a; font-weight: 700;">
          প্রিয় ${params.requesterName},
        </h2>
        <p style="margin: 0 0 16px 0; font-size: 14.5px; line-height: 1.7; color: #475569;">
          আমরা আপনার রক্তের অনুরোধটি সফলভাবে গ্রহণ করেছি। সোসাইটির রক্তদান সমন্বয় টিম দ্রুত প্রয়োজনীয় রক্তদাতা খুঁজে পেতে কাজ শুরু করছে।
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 7px 0; color: #64748b; font-weight: 600;">রোগীর নাম:</td>
              <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.patientName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 7px 0; color: #64748b; font-weight: 600;">রক্তের গ্রুপ:</td>
              <td style="padding: 7px 0; color: #dc2626; font-weight: 800; font-size: 16px; text-align: right;">${params.bloodGroup}</td>
            </tr>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 7px 0; color: #64748b; font-weight: 600;">পরিমাণ:</td>
              <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.units} ব্যাগ (Units)</td>
            </tr>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 7px 0; color: #64748b; font-weight: 600;">স্থান / হাসপাতাল:</td>
              <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.hospital || params.location}</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #64748b; font-weight: 600;">জরুরি মাত্রা:</td>
              <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${emergencyTag}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 28px 0 20px 0;">
          <a href="${trackUrl}" target="_blank" rel="noopener noreferrer" class="btn">
            অনুরোধের বর্তমান স্ট্যাটাস ট্র্যাক করুন
          </a>
        </div>

        <div style="background-color: #fff7ed; border-left: 4px solid #f97316; border-radius: 8px; padding: 14px 16px; margin: 20px 0; font-size: 13px; color: #9a3412; line-height: 1.6;">
          <strong>জরুরি পরামর্শ:</strong> কোনো রক্তদাতার সাথে সরাসরি যোগাযোগ হলে কিংবা জরুরি মুহূর্তে সর্বদা হাসপাতালের ব্লাড ব্যাংক বা আমাদের হেল্পলাইনে যোগাযোগ বজায় রাখুন।
        </div>
      `,
      footerNote: "আপনি রাজশাহী পলিটেকনিক যুব রেড ক্রিসেন্ট পোর্টালে রক্তের অনুরোধ জমা দিয়েছেন বিধায় এই তথ্যভিত্তিক ইমেইলটি পাঠানো হয়েছে।",
    });

    const requesterText = `প্রিয় ${params.requesterName},

আমরা আপনার রক্তের অনুরোধটি সফলভাবে গ্রহণ করেছি।
- রোগীর নাম: ${params.patientName}
- রক্তের গ্রুপ: ${params.bloodGroup}
- পরিমাণ: ${params.units} ব্যাগ
- স্থান/হাসপাতাল: ${params.hospital || params.location}
- জরুরি মাত্রা: ${params.emergencyLevel}

অনুরোধের বর্তমান অবস্থা ট্র্যাক করুন:
${trackUrl}

বাংলাদেশ রেড ক্রিসেন্ট সোসাইটি, রাজশাহী পলিটেকনিক ইনস্টিটিউট যুব রেড ক্রিসেন্ট দল`;

    await sendSystemEmail({
      to: params.requesterEmail,
      subject: `🩸 [Red Crescent Youth] রক্তের অনুরোধ গ্রহণ করা হয়েছে — ${params.bloodGroup} (${params.patientName})`,
      html: requesterHtml,
      text: requesterText,
      priority: params.emergencyLevel === "EMERGENCY" ? "high" : "normal",
    });
  }

  // B. Admin Alert Email (Sent to Society Inbox)
  if (config.user) {
    const adminHtml = buildBrandedEmailShell({
      preheader: `🚨 নতুন রক্তের অনুরোধ: ${params.bloodGroup} (${params.units} ব্যাগ) — ${params.location}`,
      badgeText: "Admin Alert: Blood Request",
      title: `Emergency Blood Request: ${params.bloodGroup}`,
      contentHtml: `
        <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px;">
          <p style="margin: 0; color: #991b1b; font-size: 15px; font-weight: 700;">
            🚨 নতুন রক্তের অনুরোধ এসেছে — ${params.bloodGroup} (${params.units} ব্যাগ)
          </p>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">রোগী:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.patientName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">রক্তের গ্রুপ:</td>
            <td style="padding: 8px 0; color: #dc2626; font-weight: 800; font-size: 16px; text-align: right;">${params.bloodGroup}</td>
          </tr>
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">স্থান / হাসপাতাল:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.hospital || params.location}</td>
          </tr>
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">আবেদনকারী:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.requesterName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">মোবাইল নম্বর:</td>
            <td style="padding: 8px 0; font-weight: 700; text-align: right;">
              <a href="tel:${params.requesterContact}" style="color: #dc2626; text-decoration: none;">${params.requesterContact}</a>
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">ইমেইল:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.requesterEmail}</td>
          </tr>
          ${params.additionalInfo ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;" colspan="2">
              বিবরণ: <span style="color: #334155; font-weight: normal;">${params.additionalInfo}</span>
            </td>
          </tr>` : ""}
        </table>

        <div style="text-align: center; margin: 28px 0 20px 0;">
          <a href="${adminUrl}" target="_blank" rel="noopener noreferrer" class="btn">
            অ্যাডমিন প্যানেলে দেখুন
          </a>
        </div>
      `,
    });

    const adminText = `[URGENT BLOOD REQUEST]
গ্রুপ: ${params.bloodGroup} (${params.units} ব্যাগ)
রোগী: ${params.patientName}
হাসপাতাল/স্থান: ${params.hospital || params.location}
আবেদনকারী: ${params.requesterName}
ফোন: ${params.requesterContact}
ইমেইল: ${params.requesterEmail}
অ্যাডমিন প্যানেল: ${adminUrl}`;

    await sendSystemEmail({
      to: config.user,
      subject: `🚨 [Urgent Blood Request] ${params.bloodGroup} needed at ${params.location || params.hospital}`,
      html: adminHtml,
      text: adminText,
      replyTo: params.requesterEmail || undefined,
      priority: "high",
    });
  }

  // C. Instant Matching Blood Donors Notification
  try {
    const admin = createAdminClient();
    const { data: matchingDonors, error: donorErr } = await admin
      .from("blood_donors")
      .select("id, name, email, blood_group, area, availability, phone")
      .eq("blood_group", params.bloodGroup)
      .eq("is_active", true)
      .neq("availability", "UNAVAILABLE")
      .not("email", "is", null);

    if (!donorErr && matchingDonors && matchingDonors.length > 0) {
      // Deduplicate by clean email and exclude invalid addresses
      const uniqueDonors = new Map<string, { id: string; name: string; email: string }>();
      for (const d of matchingDonors) {
        const clean = d.email?.trim().toLowerCase();
        if (clean && clean.includes("@") && !uniqueDonors.has(clean)) {
          // Do not send alert to requester themselves if they are registered as a donor with same email
          if (params.requesterEmail && clean === params.requesterEmail.trim().toLowerCase()) {
            continue;
          }
          uniqueDonors.set(clean, { id: d.id, name: d.name || "রক্তদাতা বন্ধু", email: clean });
        }
      }

      const donorsList = Array.from(uniqueDonors.values());
      if (donorsList.length > 0) {
        console.log(`[Blood Request Alert]: Notifying ${donorsList.length} matching ${params.bloodGroup} donor(s)`);

        const selfServiceUrl = `${appUrl}/blood-support/self-service`;
        const cleanPhone = params.requesterContact.replace(/[^0-9]/g, "");
        const waUrl = cleanPhone.length >= 10
          ? `https://wa.me/${cleanPhone.startsWith("88") ? cleanPhone : `88${cleanPhone.startsWith("0") ? cleanPhone : `0${cleanPhone}`}`}`
          : null;

        for (const donor of donorsList) {
          try {
            const donorHtml = buildBrandedEmailShell({
              preheader: `জরুরি রক্তের আবেদন: ${params.bloodGroup} (${params.units} ব্যাগ) — রোগী: ${params.patientName} (${params.hospital || params.location})`,
              badgeText: "জরুরি রক্তদানের আবেদন",
              title: `জরুরি রক্তের আবেদন: ${params.bloodGroup}`,
              contentHtml: `
                <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; text-align: center;">
                  <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 800; color: #dc2626; text-transform: uppercase; letter-spacing: 0.1em;">
                    Urgent Blood Donor Alert
                  </p>
                  <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: #991b1b;">
                    🩸 আপনার গ্রুপের (${params.bloodGroup}) রক্তের জরুরি প্রয়োজন!
                  </h2>
                </div>

                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #0f172a; font-weight: 700;">
                  প্রিয় রক্তদাতা ${donor.name},
                </h3>
                <p style="margin: 0 0 16px 0; font-size: 14.5px; line-height: 1.7; color: #475569;">
                  বাংলাদেশ রেড ক্রিসেন্ট সোসাইটি, রাজশাহী পলিটেকনিক ইনস্টিটিউট যুব রেড ক্রিসেন্ট পোর্টালে আপনার রক্তের গ্রুপের (<strong style="color: #dc2626; font-size: 16px;">${params.bloodGroup}</strong>) একজন মুমূর্ষু রোগীর জন্য রক্তের জরুরি আবেদন জমা পড়েছে। আপনি যদি সুস্থ ও প্রস্তুত থাকেন, অনুগ্রহ করে দ্রুত রোগীর পরিবারের সাথে যোগাযোগ করে একটি জীবন রক্ষায় এগিয়ে আসুন।
                </p>

                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr style="border-bottom: 1px solid #edf2f7;">
                      <td style="padding: 7px 0; color: #64748b; font-weight: 600;">রোগীর নাম:</td>
                      <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.patientName}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #edf2f7;">
                      <td style="padding: 7px 0; color: #64748b; font-weight: 600;">রক্তের গ্রুপ:</td>
                      <td style="padding: 7px 0; color: #dc2626; font-weight: 800; font-size: 17px; text-align: right;">${params.bloodGroup}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #edf2f7;">
                      <td style="padding: 7px 0; color: #64748b; font-weight: 600;">পরিমাণ:</td>
                      <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.units} ব্যাগ (Units)</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #edf2f7;">
                      <td style="padding: 7px 0; color: #64748b; font-weight: 600;">স্থান / হাসপাতাল:</td>
                      <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.hospital || params.location}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #edf2f7;">
                      <td style="padding: 7px 0; color: #64748b; font-weight: 600;">জরুরি মাত্রা:</td>
                      <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${emergencyTag}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #edf2f7;">
                      <td style="padding: 7px 0; color: #64748b; font-weight: 600;">প্রয়োজনের তারিখ:</td>
                      <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.requiredDate || "জরুরি / আজকেই"}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #edf2f7;">
                      <td style="padding: 7px 0; color: #64748b; font-weight: 600;">আবেদনকারীর নাম:</td>
                      <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.requesterName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 7px 0; color: #64748b; font-weight: 600;">যোগাযোগের নম্বর:</td>
                      <td style="padding: 7px 0; font-weight: 800; text-align: right;">
                        <a href="tel:${params.requesterContact}" style="color: #dc2626; text-decoration: none; font-size: 15px;">${params.requesterContact}</a>
                      </td>
                    </tr>
                    ${params.additionalInfo ? `
                    <tr style="border-top: 1px solid #edf2f7;">
                      <td style="padding: 7px 0; color: #64748b; font-weight: 600;" colspan="2">
                        বিবরণ: <span style="color: #334155; font-weight: normal;">${params.additionalInfo}</span>
                      </td>
                    </tr>` : ""}
                  </table>
                </div>

                <!-- Action Buttons -->
                <div style="text-align: center; margin: 26px 0 16px 0;">
                  <a href="tel:${params.requesterContact}" class="btn" style="display: inline-block; margin: 5px; background-color: #dc2626; color: #ffffff !important; padding: 13px 26px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 14px;">
                    📞 সরাসরি কল করুন (${params.requesterContact})
                  </a>
                  ${waUrl ? `
                  <a href="${waUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin: 5px; background-color: #25d366; color: #ffffff !important; padding: 13px 22px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 14px;">
                    💬 WhatsApp-এ মেসেজ দিন
                  </a>` : ""}
                </div>

                <div style="text-align: center; margin: 12px 0 20px 0;">
                  <a href="${trackUrl}" target="_blank" rel="noopener noreferrer" style="color: #64748b; font-size: 13px; font-weight: 600; text-decoration: underline;">
                    পোর্টালে রিকোয়েস্টের লাইভ স্ট্যাটাস দেখুন &rarr;
                  </a>
                </div>

                <div style="background-color: #fff7ed; border-left: 4px solid #f97316; border-radius: 8px; padding: 14px 16px; margin: 20px 0; font-size: 13px; color: #9a3412; line-height: 1.6;">
                  <strong>রক্তদানের গুরুত্বপূর্ণ নির্দেশনা:</strong><br>
                  ১. বিগত ৩-৪ মাসের মধ্যে রক্তদান করে থাকলে রক্তদান করবেন না।<br>
                  ২. রক্ত দেওয়ার পূর্বে অবশ্যই ব্লাড স্ক্রিনিং ও ক্রস-ম্যাচিং সম্পন্ন করে নেবেন।
                </div>

                <div style="background-color: #f8fafc; border-radius: 8px; padding: 12px 16px; margin: 16px 0; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
                  বর্তমানে রক্তদানে অপারগ বা অসুস্থ থাকলে আপনার ডোনার স্ট্যাটাস সাময়িক বন্ধ (Unavailable) করতে 
                  <a href="${selfServiceUrl}" target="_blank" rel="noopener noreferrer" style="color: #dc2626; font-weight: 600;">এখানে ক্লিক করুন</a>।
                </div>
              `,
              footerNote: "আপনি রাজশাহী পলিটেকনিক যুব রেড ক্রিসেন্ট সোসাইটিতে রক্তদাতা হিসেবে নিবন্ধিত বিধায় আর্তমানবতার সেবায় এই নোটিফিকেশনটি পাঠানো হয়েছে।",
            });

            const donorText = `প্রিয় রক্তদাতা ${donor.name},\n\nআপনার রক্তের গ্রুপের (${params.bloodGroup}) একটি জরুরি রক্তের আবেদন জমা পড়েছে।\n- রোগী: ${params.patientName}\n- রক্তের গ্রুপ: ${params.bloodGroup}\n- পরিমাণ: ${params.units} ব্যাগ\n- স্থান/হাসপাতাল: ${params.hospital || params.location}\n- জরুরি মাত্রা: ${params.emergencyLevel}\n- আবেদনকারী: ${params.requesterName}\n- ফোন: ${params.requesterContact}\n\nরোগীর স্বজনকে সরাসরি কল করতে পারেন: ${params.requesterContact}\nঅনুরোধের বিবরণ ও স্ট্যাটাস:\n${trackUrl}\n\nডোনার স্ট্যাটাস আপডেট করতে:\n${selfServiceUrl}\n\nরেড ক্রিসেন্ট যুব দল, রাজশাহী পলিটেকনিক ইনস্টিটিউট`;

            await sendSystemEmail({
              to: donor.email,
              subject: `🩸 [জরুরি রক্তের আবেদন] আপনার রক্তের গ্রুপের (${params.bloodGroup}) প্রয়োজন — ${params.patientName}`,
              html: donorHtml,
              text: donorText,
              replyTo: params.requesterEmail || undefined,
              priority: params.emergencyLevel === "EMERGENCY" ? "high" : "normal",
            });
          } catch (donorEmailErr) {
            console.warn(`[Donor Alert Error] Failed to send email to ${donor.email}:`, donorEmailErr);
          }
        }
      }
    }
  } catch (matchErr) {
    console.warn("Could not dispatch matching blood donors alert emails:", matchErr);
  }
}

/* -------------------------------------------------------------------------- */
/*                     2. BLOOD DONOR REGISTRATION EMAIL                      */
/* -------------------------------------------------------------------------- */

export interface MatchingActiveRequestSummary {
  id: string;
  patientName: string;
  bloodGroup: string;
  units: number;
  hospital: string | null;
  location: string | null;
  requiredDate: string | null;
  emergencyLevel: string;
  contact: string;
  requesterName: string;
  additionalInfo?: string | null;
}

export interface DonorRegistrationEmailParams {
  name: string;
  email: string;
  phone: string;
  bloodGroup: string;
  area: string;
  passcode: string;
  phonePublic: boolean;
  existingRequests?: MatchingActiveRequestSummary[];
}

/**
 * Sends a welcome and passcode backup email to the newly registered blood donor
 */
export async function sendDonorRegistrationEmail(params: DonorRegistrationEmailParams): Promise<void> {
  if (!params.email || !params.email.includes("@")) return;

  const appUrl = getAppUrl();
  const manageUrl = `${appUrl}/blood-support/self-service`;

  let existingRequestsHtml = "";
  let existingRequestsText = "";
  if (params.existingRequests && params.existingRequests.length > 0) {
    const cardsHtml = params.existingRequests
      .map((req) => {
        const urgencyLabel =
          req.emergencyLevel === "EMERGENCY"
            ? "🔴 জরুরী (EMERGENCY)"
            : req.emergencyLevel === "URGENT"
            ? "🟠 প্রয়োজনীয় (URGENT)"
            : "🟢 সাধারণ (ROUTINE)";
        const cleanPhone = req.contact.replace(/[^0-9]/g, "");
        const waUrl =
          cleanPhone.length >= 10
            ? `https://wa.me/${cleanPhone.startsWith("88") ? cleanPhone : `88${cleanPhone.startsWith("0") ? cleanPhone : `0${cleanPhone}`}`}`
            : null;
        const trackUrl = `${appUrl}/blood-support/request/${req.id}`;

        return `
          <div style="background-color: #ffffff; border: 1px solid #fed7aa; border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-weight: 700; color: #0f172a; font-size: 15px;">👤 রোগী: ${req.patientName}</span>
              <span style="font-size: 11.5px; font-weight: 700; color: #9a3412; background: #ffedd5; padding: 2px 8px; border-radius: 9999px;">${urgencyLabel}</span>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 13.5px; margin-bottom: 10px;">
              <tr>
                <td style="padding: 4px 0; color: #64748b;">পরিমাণ:</td>
                <td style="padding: 4px 0; color: #dc2626; font-weight: 700; text-align: right;">${req.units} ব্যাগ (${req.bloodGroup})</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;">হাসপাতাল/স্থান:</td>
                <td style="padding: 4px 0; color: #334155; font-weight: 600; text-align: right;">${req.hospital || req.location || "রাজশাহী"}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;">প্রয়োজনের তারিখ:</td>
                <td style="padding: 4px 0; color: #334155; font-weight: 600; text-align: right;">${req.requiredDate || "জরুরি / আজকেই"}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;">যোগাযোগ:</td>
                <td style="padding: 4px 0; font-weight: 700; text-align: right;">
                  <a href="tel:${req.contact}" style="color: #dc2626; text-decoration: none;">${req.contact}</a> (${req.requesterName})
                </td>
              </tr>
            </table>
            <div style="text-align: center; margin-top: 8px;">
              <a href="tel:${req.contact}" style="display: inline-block; margin: 3px; background-color: #dc2626; color: #ffffff !important; padding: 8px 16px; border-radius: 6px; font-weight: 700; text-decoration: none; font-size: 12.5px;">
                📞 সরাসরি কল দিন (${req.contact})
              </a>
              ${
                waUrl
                  ? `<a href="${waUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin: 3px; background-color: #25d366; color: #ffffff !important; padding: 8px 14px; border-radius: 6px; font-weight: 700; text-decoration: none; font-size: 12.5px;">💬 WhatsApp</a>`
                  : ""
              }
              <a href="${trackUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin: 3px; color: #64748b; font-size: 12.5px; text-decoration: underline; padding: 8px;">
                বিস্তারিত দেখুন &rarr;
              </a>
            </div>
          </div>
        `;
      })
      .join("");

    existingRequestsHtml = `
      <div style="background-color: #fff7ed; border: 2px solid #f97316; border-radius: 12px; padding: 18px; margin: 24px 0;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #c2410c; font-weight: 800;">
          🩸 জরুরি নোটিশ: আপনার গ্রুপের (${params.bloodGroup}) চলমান রক্তের আবেদন!
        </h3>
        <p style="margin: 0 0 14px 0; font-size: 13.5px; color: #9a3412; line-height: 1.6;">
          এই মুহূর্তে আমাদের পোর্টালে আপনার রক্তের গ্রুপের রোগীর রক্তের জরুরি প্রয়োজন রয়েছে। আপনি যদি প্রস্তুত থাকেন ও বিগত ৪ মাসে রক্ত না দিয়ে থাকেন, তবে দ্রুত রোগীর পরিবারের সাথে যোগাযোগ করে এগিয়ে আসতে পারেন:
        </p>
        ${cardsHtml}
      </div>
    `;

    existingRequestsText =
      `\n\n🚨 [জরুরি চলমান রক্তের অনুরোধ]:\nবর্তমানে আপনার রক্তের গ্রুপের (${params.bloodGroup}) রক্তের প্রয়োজন রয়েছে:\n` +
      params.existingRequests
        .map(
          (req) =>
            `- রোগী: ${req.patientName}, পরিমাণ: ${req.units} ব্যাগ, হাসপাতাল/স্থান: ${
              req.hospital || req.location || "রাজশাহী"
            }, যোগাযোগ: ${req.contact} (${req.requesterName})`
        )
        .join("\n");
  }

  const html = buildBrandedEmailShell({
    preheader: `রক্তদাতা হিসেবে সফল নিবন্ধন — আপনার গোপন পাসকোড: ${params.passcode}`,
    badgeText: "রক্তদাতা নিবন্ধন নিশ্চিতকরণ",
    title: "রক্তদাতা হিসেবে স্বাগতম — রেড ক্রিসেন্ট যুব দল",
    contentHtml: `
      <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #0f172a; font-weight: 700;">
        প্রিয় ${params.name},
      </h2>
      <p style="margin: 0 0 16px 0; font-size: 14.5px; line-height: 1.7; color: #475569;">
        বাংলাদেশ রেড ক্রিসেন্ট সোসাইটি, রাজশাহী পলিটেকনিক ইনস্টিটিউট যুব দলের রক্তদাতা হিসেবে তালিকাভুক্ত হওয়ার জন্য আপনাকে আন্তরিক শুভেচ্ছা ও কৃতজ্ঞতা! আপনার এই মহান সিদ্ধান্ত একজন মুমূর্ষু রোগীর জীবন বাঁচাতে সাহায্য করবে।
      </p>

      ${existingRequestsHtml}

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">রক্তের গ্রুপ:</td>
            <td style="padding: 7px 0; color: #dc2626; font-weight: 800; font-size: 16px; text-align: right;">${params.bloodGroup}</td>
          </tr>
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">বর্তমান এলাকা:</td>
            <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.area}</td>
          </tr>
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">মোবাইল নম্বর:</td>
            <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.phone}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">নম্বরের দৃশ্যমানতা:</td>
            <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">
              ${params.phonePublic ? "পাবলিক (সরাসরি দৃশ্যমান)" : "সুরক্ষিত/প্রাইভেট"}
            </td>
          </tr>
        </table>
      </div>

      <!-- Security Passcode Backup Box -->
      <div style="background-color: #fef2f2; border: 2px dashed #fca5a5; border-radius: 12px; padding: 18px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 6px 0; font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.05em; color: #991b1b; font-weight: 700;">
          আপনার গোপন পাসকোড (Secret Passcode)
        </p>
        <p style="margin: 0 0 8px 0; font-size: 26px; font-weight: 800; letter-spacing: 4px; color: #dc2626; font-family: monospace;">
          ${params.passcode}
        </p>
        <p style="margin: 0; font-size: 12px; color: #7f1d1d; line-height: 1.5;">
          ভবিষ্যতে আপনার লিস্টিং এডিট করতে, সাময়িক বন্ধ বা চালু করতে অথবা ফোন নম্বর আপডেট করতে এই পাসকোডটি প্রয়োজন হবে।
        </p>
      </div>

      <div style="text-align: center; margin: 26px 0 20px 0;">
        <a href="${manageUrl}" target="_blank" rel="noopener noreferrer" class="btn">
          লিস্টিং পরিচালনা করুন (Self-Service)
        </a>
      </div>
    `,
    footerNote: "আপনি রেড ক্রিসেন্ট যুব দলের রক্তদাতা হিসেবে নিবন্ধন করেছেন বিধায় এই নিশ্চিতকরণ ইমেইলটি পাঠানো হয়েছে।",
  });

  const text = `প্রিয় ${params.name},

রেড ক্রিসেন্ট যুব দলের রক্তদাতা হিসেবে তালিকাভুক্ত হওয়ার জন্য আপনাকে আন্তরিক ধন্যবাদ।
- রক্তের গ্রুপ: ${params.bloodGroup}
- এলাকা: ${params.area}
- মোবাইল: ${params.phone}

আপনার গোপন পাসকোড (Passcode): ${params.passcode}
লিস্টিং পরিচালনা করতে নিচের লিংকে যান:
${manageUrl}${existingRequestsText}

বাংলাদেশ রেড ক্রিসেন্ট সোসাইটি, রাজশাহী পলিটেকনিক ইনস্টিটিউট যুব রেড ক্রিসেন্ট দল`;

  await sendSystemEmail({
    to: params.email,
    subject: `❤️ [Red Crescent Youth] রক্তদাতা হিসেবে সফল নিবন্ধন — অভিনন্দন ও ধন্যবাদ!`,
    html,
    text,
  });
}

/**
 * Dispatches an instant blood request donor alert email to a newly registered donor
 * when there is an active matching emergency/urgent request in the system.
 */
export async function sendExistingBloodRequestAlertToNewDonor(params: {
  donorName: string;
  donorEmail: string;
  donorBloodGroup: string;
  request: MatchingActiveRequestSummary;
}): Promise<void> {
  if (!params.donorEmail || !params.donorEmail.includes("@")) return;

  const appUrl = getAppUrl();
  const trackUrl = `${appUrl}/blood-support/request/${params.request.id}`;
  const selfServiceUrl = `${appUrl}/blood-support/self-service`;
  const cleanPhone = params.request.contact.replace(/[^0-9]/g, "");
  const waUrl =
    cleanPhone.length >= 10
      ? `https://wa.me/${cleanPhone.startsWith("88") ? cleanPhone : `88${cleanPhone.startsWith("0") ? cleanPhone : `0${cleanPhone}`}`}`
      : null;

  const emergencyTag =
    params.request.emergencyLevel === "EMERGENCY"
      ? "🔴 জরুরী (EMERGENCY)"
      : params.request.emergencyLevel === "URGENT"
      ? "🟠 প্রয়োজনীয় (URGENT)"
      : "🟢 সাধারণ (ROUTINE)";

  const html = buildBrandedEmailShell({
    preheader: `জরুরি রক্তের আবেদন: ${params.donorBloodGroup} (${params.request.units} ব্যাগ) — রোগী: ${params.request.patientName}`,
    badgeText: "জরুরি রক্তদানের আবেদন",
    title: `জরুরি রক্তের আবেদন: ${params.donorBloodGroup}`,
    contentHtml: `
      <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; text-align: center;">
        <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 800; color: #dc2626; text-transform: uppercase; letter-spacing: 0.1em;">
          Urgent Blood Donor Alert
        </p>
        <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: #991b1b;">
          🩸 আপনার গ্রুপের (${params.donorBloodGroup}) রক্তের জরুরি প্রয়োজন!
        </h2>
      </div>

      <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #0f172a; font-weight: 700;">
        প্রিয় রক্তদাতা ${params.donorName},
      </h3>
      <p style="margin: 0 0 16px 0; font-size: 14.5px; line-height: 1.7; color: #475569;">
        রেড ক্রিসেন্ট যুব দলের রক্তদাতা হিসেবে আপনাকে আন্তরিক স্বাগতম। এই মুহূর্তে আমাদের পোর্টালে আপনার রক্তের গ্রুপের (<strong style="color: #dc2626; font-size: 16px;">${params.donorBloodGroup}</strong>) একজন মুমূর্ষু রোগীর জন্য রক্তের জরুরি আবেদন চলমান রয়েছে। আপনি যদি সুস্থ ও প্রস্তুত থাকেন, তবে অনুগ্রহ করে রোগীর পরিবারের সাথে যোগাযোগ করে একটি জীবন রক্ষায় এগিয়ে আসুন।
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">রোগীর নাম:</td>
            <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.request.patientName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">রক্তের গ্রুপ:</td>
            <td style="padding: 7px 0; color: #dc2626; font-weight: 800; font-size: 17px; text-align: right;">${params.request.bloodGroup}</td>
          </tr>
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">পরিমাণ:</td>
            <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.request.units} ব্যাগ (Units)</td>
          </tr>
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">স্থান / হাসপাতাল:</td>
            <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.request.hospital || params.request.location || "রাজশাহী"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">জরুরি মাত্রা:</td>
            <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${emergencyTag}</td>
          </tr>
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">প্রয়োজনের তারিখ:</td>
            <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.request.requiredDate || "জরুরি / আজকেই"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">আবেদনকারীর নাম:</td>
            <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.request.requesterName}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">যোগাযোগের নম্বর:</td>
            <td style="padding: 7px 0; font-weight: 800; text-align: right;">
              <a href="tel:${params.request.contact}" style="color: #dc2626; text-decoration: none; font-size: 15px;">${params.request.contact}</a>
            </td>
          </tr>
          ${
            params.request.additionalInfo
              ? `
          <tr style="border-top: 1px solid #edf2f7;">
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;" colspan="2">
              বিবরণ: <span style="color: #334155; font-weight: normal;">${params.request.additionalInfo}</span>
            </td>
          </tr>`
              : ""
          }
        </table>
      </div>

      <!-- Action Buttons -->
      <div style="text-align: center; margin: 26px 0 16px 0;">
        <a href="tel:${params.request.contact}" class="btn" style="display: inline-block; margin: 5px; background-color: #dc2626; color: #ffffff !important; padding: 13px 26px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 14px;">
          📞 সরাসরি কল করুন (${params.request.contact})
        </a>
        ${
          waUrl
            ? `
        <a href="${waUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin: 5px; background-color: #25d366; color: #ffffff !important; padding: 13px 22px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 14px;">
          💬 WhatsApp-এ মেসেজ দিন
        </a>`
            : ""
        }
      </div>

      <div style="text-align: center; margin: 12px 0 20px 0;">
        <a href="${trackUrl}" target="_blank" rel="noopener noreferrer" style="color: #64748b; font-size: 13px; font-weight: 600; text-decoration: underline;">
          পোর্টালে রিকোয়েস্টের লাইভ স্ট্যাটাস দেখুন &rarr;
        </a>
      </div>

      <div style="background-color: #fff7ed; border-left: 4px solid #f97316; border-radius: 8px; padding: 14px 16px; margin: 20px 0; font-size: 13px; color: #9a3412; line-height: 1.6;">
        <strong>রক্তদানের গুরুত্বপূর্ণ নির্দেশনা:</strong><br>
        ১. বিগত ৩-৪ মাসের মধ্যে রক্তদান করে থাকলে রক্তদান করবেন না।<br>
        ২. রক্ত দেওয়ার পূর্বে অবশ্যই ব্লাড স্ক্রিনিং ও ক্রস-ম্যাচিং সম্পন্ন করে নেবেন।
      </div>

      <div style="background-color: #f8fafc; border-radius: 8px; padding: 12px 16px; margin: 16px 0; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
        বর্তমানে রক্তদানে অপারগ থাকলে আপনার ডোনার স্ট্যাটাস সাময়িক বন্ধ (Unavailable) করতে 
        <a href="${selfServiceUrl}" target="_blank" rel="noopener noreferrer" style="color: #dc2626; font-weight: 600;">এখানে ক্লিক করুন</a>।
      </div>
    `,
    footerNote:
      "আপনি রাজশাহী পলিটেকনিক যুব রেড ক্রিসেন্ট সোসাইটিতে রক্তদাতা হিসেবে নিবন্ধিত বিধায় আর্তমানবতার সেবায় এই নোটিফিকেশনটি পাঠানো হয়েছে।",
  });

  const text = `প্রিয় রক্তদাতা ${params.donorName},\n\nআপনার রক্তের গ্রুপের (${params.donorBloodGroup}) একটি জরুরি রক্তের আবেদন চলমান রয়েছে।\n- রোগী: ${params.request.patientName}\n- রক্তের গ্রুপ: ${params.donorBloodGroup}\n- পরিমাণ: ${params.request.units} ব্যাগ\n- স্থান/হাসপাতাল: ${params.request.hospital || params.request.location || "রাজশাহী"}\n- জরুরি মাত্রা: ${params.request.emergencyLevel}\n- আবেদনকারী: ${params.request.requesterName}\n- ফোন: ${params.request.contact}\n\nরোগীর স্বজনকে সরাসরি কল করতে পারেন: ${params.request.contact}\nঅনুরোধের বিবরণ ও লাইভ স্ট্যাটাস:\n${trackUrl}\n\nডোনার স্ট্যাটাস আপডেট করতে:\n${selfServiceUrl}\n\nবাংলাদেশ রেড ক্রিসেন্ট সোসাইটি, রাজশাহী পলিটেকনিক ইনস্টিটিউট যুব রেড ক্রিসেন্ট দল`;

  await sendSystemEmail({
    to: params.donorEmail,
    subject: `🩸 [জরুরি রক্তের আবেদন] আপনার রক্তের গ্রুপের (${params.donorBloodGroup}) প্রয়োজন — ${params.request.patientName}`,
    html,
    text,
    priority: params.request.emergencyLevel === "EMERGENCY" ? "high" : "normal",
  });
}

/* -------------------------------------------------------------------------- */
/*                  3. VOLUNTEER APPLICATION & APPROVAL FLOWS                 */
/* -------------------------------------------------------------------------- */

export interface VolunteerApplicationEmailParams {
  name: string;
  email: string;
  phone: string;
  studentId: string;
  department: string;
  bloodGroup?: string | null;
}

/**
 * Sends confirmation to the applicant and an alert to the volunteer management team
 */
export async function sendVolunteerApplicationEmails(params: VolunteerApplicationEmailParams): Promise<void> {
  const config = getSmtpConfig();
  const appUrl = getAppUrl();

  // A. Applicant Confirmation Email
  if (params.email && params.email.includes("@")) {
    const applicantHtml = buildBrandedEmailShell({
      preheader: `আপনার স্বেচ্ছাসেবক সদস্যপদ আবেদনটি সফলভাবে গৃহীত হয়েছে।`,
      badgeText: "সদস্যপদ আবেদন",
      title: "আবেদনপত্র গ্রহণ — রেড ক্রিসেন্ট যুব দল",
      contentHtml: `
        <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #0f172a; font-weight: 700;">
          প্রিয় ${params.name},
        </h2>
        <p style="margin: 0 0 16px 0; font-size: 14.5px; line-height: 1.7; color: #475569;">
          বাংলাদেশ রেড ক্রিসেন্ট সোসাইটি, রাজশাহী পলিটেকনিক ইনস্টিটিউট যুব রেড ক্রিসেন্ট দলে নতুন সদস্য হিসেবে যুক্ত হওয়ার আবেদন করায় আপনাকে আন্তরিক ধন্যবাদ। আপনার আবেদনপত্রটি সফলভাবে জমা হয়েছে।
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 7px 0; color: #64748b; font-weight: 600;">আবেদনকারীর নাম:</td>
              <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 7px 0; color: #64748b; font-weight: 600;">বিভাগ (Department):</td>
              <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.department}</td>
            </tr>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 7px 0; color: #64748b; font-weight: 600;">রোল / স্টুডেন্ট আইডি:</td>
              <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.studentId}</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #64748b; font-weight: 600;">মোবাইল নম্বর:</td>
              <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.phone}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 8px; padding: 14px 16px; margin: 20px 0; font-size: 13.5px; color: #166534; line-height: 1.6;">
          <strong>পরবর্তী ধাপ:</strong> যুব রেড ক্রিসেন্ট কার্যকরী পরিষদ আপনার আবেদনটি যাচাই করবে। নির্বাচিতদের ওরিয়েন্টেশন ও প্রাথমিক প্রাথমিক চিকিৎসা (First Aid) কর্মশালার বিষয়ে ইমেইল বা এসএমএসে জানানো হবে।
        </div>
      `,
    });

    const applicantText = `প্রিয় ${params.name},

রাজশাহী পলিটেকনিক ইনস্টিটিউট যুব রেড ক্রিসেন্ট দলে আপনার সদস্যপদ আবেদনপত্র গৃহীত হয়েছে।
- বিভাগ: ${params.department}
- রোল: ${params.studentId}
- মোবাইল: ${params.phone}

কার্যকরী পরিষদের যাচাই শেষে ফলাফল ও ওরিয়েন্টেশনের তথ্য জানিয়ে দেওয়া হবে।
ধন্যবাদ,
রেড ক্রিসেন্ট যুব দল, আরজিপিআই`;

    await sendSystemEmail({
      to: params.email,
      subject: `🤝 [Red Crescent Youth] সদস্যপদ আবেদনপত্র গ্রহণ করা হয়েছে — ${params.name}`,
      html: applicantHtml,
      text: applicantText,
    });
  }

  // B. Admin Team Alert
  if (config.user) {
    const adminHtml = buildBrandedEmailShell({
      preheader: `নতুন সদস্যপদ আবেদন: ${params.name} (${params.department})`,
      badgeText: "Admin Alert: Volunteer Application",
      title: "New Volunteer Application",
      contentHtml: `
        <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 17px;">
          নতুন ভলান্টিয়ার আবেদন জমা পড়েছে
        </h3>
        <p style="margin: 0 0 16px 0; color: #475569; font-size: 14px;">
          <strong>${params.name}</strong> (${params.department}, রোল: ${params.studentId}) নতুন সদস্য হিসেবে যোগ দিতে আবেদন করেছেন।
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${appUrl}/admin/team" target="_blank" rel="noopener noreferrer" class="btn">
            অ্যাডমিন প্যানেলে যাচাই করুন
          </a>
        </div>
      `,
    });

    const adminText = `[NEW VOLUNTEER APPLICATION]
নাম: ${params.name}
বিভাগ: ${params.department}
রোল: ${params.studentId}
ফোন: ${params.phone}
ইমেইল: ${params.email}
অ্যাডমিন লিংক: ${appUrl}/admin/team`;

    await sendSystemEmail({
      to: config.user,
      subject: `👤 [New Volunteer Application] ${params.name} (${params.department})`,
      html: adminHtml,
      text: adminText,
      replyTo: params.email,
    });
  }
}

export interface VolunteerApprovalEmailParams {
  name: string;
  email: string;
  memberId: string;
  department?: string | null;
  position?: string | null;
}

/**
 * Sends official congratulations and Member ID card link to approved member
 */
export async function sendVolunteerApprovalEmail(params: VolunteerApprovalEmailParams): Promise<void> {
  if (!params.email || !params.email.includes("@")) return;

  const appUrl = getAppUrl();
  const portalUrl = `${appUrl}/portal`;

  const html = buildBrandedEmailShell({
    preheader: `অভিনন্দন! আপনার রেড ক্রিসেন্ট যুব দল সদস্যপদ অনুমোদিত হয়েছে — Member ID: ${params.memberId}`,
    badgeText: "সদস্যপদ অনুমোদন",
    title: "সদস্যপদ অনুমোদন — রেড ক্রিসেন্ট যুব দল",
    contentHtml: `
      <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #0f172a; font-weight: 700;">
        অভিনন্দন ${params.name}! 🎉
      </h2>
      <p style="margin: 0 0 16px 0; font-size: 14.5px; line-height: 1.7; color: #475569;">
        বাংলাদেশ রেড ক্রিসেন্ট সোসাইটি, রাজশাহী পলিটেকনিক ইনস্টিটিউট যুব রেড ক্রিসেন্ট দলের একজন গর্বিত সদস্য হিসেবে আপনার আবেদন অনুমোদিত হয়েছে। মানবতার সেবায় আপনাকে পাশে পেয়ে আমরা আনন্দিত।
      </p>

      <!-- Member ID Showcase -->
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 12px; padding: 22px; margin: 24px 0; text-align: center; color: #ffffff; border: 1px solid #334155;">
        <p style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8;">
          অফিশিয়াল সদস্যপদ নম্বর (Member ID)
        </p>
        <p style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 2px; color: #f87171; font-family: monospace;">
          ${params.memberId}
        </p>
      </div>

      <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
        আপনি এখন ছাত্র/সদস্য পোর্টাল থেকে আপনার ডিজিটাল মেম্বার আইডি কার্ড ডাউনলোড করতে পারবেন এবং আসন্ন ট্রেনিং ও সেবা কার্যক্রমে অংশ নিতে পারবেন।
      </p>

      <div style="text-align: center; margin: 26px 0 20px 0;">
        <a href="${portalUrl}" target="_blank" rel="noopener noreferrer" class="btn">
          সদস্য পোর্টালে প্রবেশ করুন
        </a>
      </div>
    `,
  });

  const text = `অভিনন্দন ${params.name}!
আপনার রেড ক্রিসেন্ট যুব দলের সদস্যপদ অনুমোদিত হয়েছে।
অফিশিয়াল Member ID: ${params.memberId}

সদস্য পোর্টালে লগইন করুন:
${portalUrl}

বাংলাদেশ রেড ক্রিসেন্ট সোসাইটি, রাজশাহী পলিটেকনিক ইনস্টিটিউট যুব দল`;

  await sendSystemEmail({
    to: params.email,
    subject: `🎉 অভিনন্দন! যুব রেড ক্রিসেন্ট সদস্যপদ অনুমোদিত হয়েছে — Member ID: ${params.memberId}`,
    html,
    text,
    priority: "high",
  });
}

/* -------------------------------------------------------------------------- */
/*                       4. CONTACT FORM INQUIRY FLOWS                        */
/* -------------------------------------------------------------------------- */

export interface ContactFormEmailParams {
  name: string;
  email?: string | null;
  phone?: string | null;
  subject: string;
  message: string;
}

/**
 * Forwards message to admin inbox and sends auto-acknowledgement to sender
 */
export async function sendContactFormEmails(params: ContactFormEmailParams): Promise<void> {
  const config = getSmtpConfig();
  const appUrl = getAppUrl();

  // A. Forward message to Society Official Admin Inbox
  if (config.user) {
    const adminHtml = buildBrandedEmailShell({
      preheader: `ওয়েবসাইট অনুসন্ধান: ${params.subject} — প্রেরক: ${params.name}`,
      badgeText: "Website Inquiry",
      title: `Contact Inquiry: ${params.subject}`,
      contentHtml: `
        <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 17px;">
          ওয়েবসাইট যোগাযোগ ফর্ম থেকে নতুন বার্তা
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">প্রেরকের নাম:</td>
            <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">ইমেইল:</td>
            <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.email || "—"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">ফোন:</td>
            <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.phone || "—"}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">বিষয় (Subject):</td>
            <td style="padding: 7px 0; color: #dc2626; font-weight: 700; text-align: right;">${params.subject}</td>
          </tr>
        </table>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 16px 0; font-size: 14px; line-height: 1.7; color: #334155;">
          ${params.message.replace(/\n/g, "<br>")}
        </div>

        <div style="text-align: center; margin: 24px 0 10px 0;">
          <a href="${appUrl}/admin/messages" target="_blank" rel="noopener noreferrer" class="btn">
            অ্যাডমিন প্যানেলে দেখুন
          </a>
        </div>
      `,
    });

    const adminText = `[WEBSITE CONTACT MESSAGE]
প্রেরক: ${params.name}
ইমেইল: ${params.email || "N/A"}
ফোন: ${params.phone || "N/A"}
বিষয়: ${params.subject}

বার্তা:
${params.message}

অ্যাডমিন লিংক: ${appUrl}/admin/messages`;

    await sendSystemEmail({
      to: config.user,
      subject: `💬 [Website Inquiry] ${params.subject} — from ${params.name}`,
      html: adminHtml,
      text: adminText,
      replyTo: params.email || undefined,
    });
  }

  // B. Auto-acknowledgement to sender (if email provided)
  if (params.email && params.email.includes("@")) {
    const senderHtml = buildBrandedEmailShell({
      preheader: `আপনার বার্তাটি আমরা পেয়েছি — রেড ক্রিসেন্ট যুব দল`,
      badgeText: "বার্তা গ্রহণ নিশ্চিতকরণ",
      title: "বার্তা গ্রহণ নিশ্চিতকরণ — রেড ক্রিসেন্ট যুব দল",
      contentHtml: `
        <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #0f172a; font-weight: 700;">
          প্রিয় ${params.name},
        </h2>
        <p style="margin: 0 0 16px 0; font-size: 14.5px; line-height: 1.7; color: #475569;">
          আমাদের সাথে যোগাযোগ করার জন্য ধন্যবাদ। আপনার বার্তাটি সফলভাবে যুব রেড ক্রিসেন্ট দলের কাছে পৌঁছেছে। আমাদের দায়িত্বপ্রাপ্ত টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে।
        </p>

        <div style="background-color: #f8fafc; border-left: 4px solid #dc2626; border-radius: 8px; padding: 14px 16px; margin: 20px 0; font-size: 13.5px; color: #475569; line-height: 1.6;">
          <strong>আপনার বার্তা:</strong><br>
          <em>"${params.message.slice(0, 200)}${params.message.length > 200 ? "..." : ""}"</em>
        </div>
      `,
    });

    const senderText = `প্রিয় ${params.name},

আমাদের সাথে যোগাযোগ করার জন্য ধন্যবাদ। আপনার বার্তাটি সফলভাবে আমাদের কাছে পৌঁছেছে। টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে।

রেড ক্রিসেন্ট যুব দল, রাজশাহী পলিটেকনিক ইনস্টিটিউট শাখা`;

    await sendSystemEmail({
      to: params.email,
      subject: `📬 [Red Crescent Youth] আপনার বার্তাটি আমরা পেয়েছি`,
      html: senderHtml,
      text: senderText,
    });
  }
}

/* -------------------------------------------------------------------------- */
/*                    5. DONOR CONTACT REQUEST FLOWS                          */
/* -------------------------------------------------------------------------- */

export interface DonorContactRequestEmailParams {
  requestId: string;
  donorId: string;
  donorName?: string | null;
  donorBloodGroup?: string | null;
  donorPhone?: string | null;
  donorArea?: string | null;
  patientName: string;
  bloodGroupNeeded: string;
  hospital?: string | null;
  requesterName: string;
  requesterContact: string;
  requesterEmail?: string | null;
  message?: string | null;
}

/**
 * Sends notification emails when a user submits a "Request Contact" form
 * for a blood donor whose phone number is kept private.
 * 1. Alerts Society Admin with full patient, requester, and donor context.
 * 2. Sends confirmation to requester (if email provided) with tracking link.
 */
export async function sendDonorContactRequestEmails(
  params: DonorContactRequestEmailParams
): Promise<void> {
  const config = getSmtpConfig();
  const appUrl = getAppUrl();
  const trackUrl = `${appUrl}/blood-support/contact-request/${params.requestId}`;
  const adminUrl = `${appUrl}/admin/donors`;

  // A. Admin Alert Email (Sent to Society Inbox & ADMIN_EMAIL)
  const adminRecipients: string[] = [];
  if (config.user) {
    adminRecipients.push(config.user);
  }
  const customAdminEmail = process.env.ADMIN_EMAIL?.trim();
  if (customAdminEmail && !adminRecipients.includes(customAdminEmail)) {
    adminRecipients.push(customAdminEmail);
  }

  if (adminRecipients.length > 0) {
    const adminHtml = buildBrandedEmailShell({
      preheader: `🩸 রক্তদাতা যোগাযোগের অনুরোধ: ${params.bloodGroupNeeded} (${params.patientName}) — রক্তদাতা: ${params.donorName || "রেজিস্টার্ড রক্তদাতা"}`,
      badgeText: "Donor Contact Request",
      title: `Donor Contact Request: ${params.bloodGroupNeeded}`,
      contentHtml: `
        <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px;">
          <p style="margin: 0; color: #991b1b; font-size: 15px; font-weight: 700;">
            🩸 রক্তদাতার সাথে যোগাযোগের নতুন অনুরোধ জমা পড়েছে!
          </p>
          <p style="margin: 6px 0 0 0; color: #7f1d1d; font-size: 13.5px; line-height: 1.5;">
            একজন আবেদনকারী রোগী <strong>${params.patientName}</strong>-এর জন্য রেজিস্টার্ড রক্তদাতা <strong>${params.donorName || "রেজিস্টার্ড রক্তদাতা"}</strong>-এর ফোন নম্বর চেয়ে অনুরোধ পাঠিয়েছেন।
          </p>
        </div>

        <h3 style="margin: 18px 0 10px 0; font-size: 15px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
          📋 রোগীর ও রক্তের তথ্য
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 16px;">
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">রোগীর নাম:</td>
            <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.patientName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">প্রয়োজনীয় রক্তের গ্রুপ:</td>
            <td style="padding: 7px 0; color: #dc2626; font-weight: 800; font-size: 16px; text-align: right;">${params.bloodGroupNeeded}</td>
          </tr>
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">হাসপাতাল / স্থান:</td>
            <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.hospital || "উল্লেখ নেই"}</td>
          </tr>
          ${
            params.message
              ? `<tr>
                  <td style="padding: 7px 0; color: #64748b; font-weight: 600;" colspan="2">
                    বার্তা / বিস্তারিত: <span style="color: #334155; font-weight: normal;">${params.message}</span>
                  </td>
                </tr>`
              : ""
          }
        </table>

        <h3 style="margin: 18px 0 10px 0; font-size: 15px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
          🎯 অনুরোধকৃত রক্তদাতা
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 16px;">
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">রক্তদাতার নাম:</td>
            <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.donorName || "—"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">রক্তের গ্রুপ:</td>
            <td style="padding: 7px 0; color: #dc2626; font-weight: 700; text-align: right;">${params.donorBloodGroup || params.bloodGroupNeeded}</td>
          </tr>
          ${
            params.donorArea
              ? `<tr style="border-bottom: 1px solid #edf2f7;">
                  <td style="padding: 7px 0; color: #64748b; font-weight: 600;">এলাকা:</td>
                  <td style="padding: 7px 0; color: #0f172a; font-weight: 600; text-align: right;">${params.donorArea}</td>
                </tr>`
              : ""
          }
          ${
            params.donorPhone
              ? `<tr>
                  <td style="padding: 7px 0; color: #64748b; font-weight: 600;">সংরক্ষিত ফোন নম্বর:</td>
                  <td style="padding: 7px 0; font-weight: 700; text-align: right;">
                    <a href="tel:${params.donorPhone}" style="color: #dc2626; text-decoration: none;">${params.donorPhone}</a>
                  </td>
                </tr>`
              : ""
          }
        </table>

        <h3 style="margin: 18px 0 10px 0; font-size: 15px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
          👤 আবেদনকারীর তথ্য
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">আবেদনকারী:</td>
            <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.requesterName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">মোবাইল নম্বর:</td>
            <td style="padding: 7px 0; font-weight: 700; text-align: right;">
              <a href="tel:${params.requesterContact}" style="color: #dc2626; text-decoration: none;">${params.requesterContact}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">ইমেইল:</td>
            <td style="padding: 7px 0; color: #0f172a; font-weight: 600; text-align: right;">${params.requesterEmail || "—"}</td>
          </tr>
        </table>

        <div style="text-align: center; margin: 26px 0 16px 0;">
          <a href="${adminUrl}" target="_blank" rel="noopener noreferrer" class="btn">
            অ্যাডমিন প্যানেলে রিভিউ ও অনুমোদন করুন
          </a>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; font-size: 12.5px; color: #64748b; line-height: 1.5;">
          <strong>পাবলিক ট্র্যাকিং পেজ:</strong> <a href="${trackUrl}" target="_blank" style="color: #dc2626; word-break: break-all;">${trackUrl}</a>
        </div>
      `,
    });

    const adminText = `[DONOR CONTACT REQUEST ALERT]
রোগী: ${params.patientName}
প্রয়োজনীয় রক্তের গ্রুপ: ${params.bloodGroupNeeded}
হাসপাতাল/স্থান: ${params.hospital || "N/A"}

অনুরোধকৃত রক্তদাতা: ${params.donorName || "N/A"} (${params.donorBloodGroup || params.bloodGroupNeeded})
রক্তদাতার ফোন: ${params.donorPhone || "N/A"}
রক্তদাতার এলাকা: ${params.donorArea || "N/A"}

আবেদনকারী: ${params.requesterName}
মোবাইল: ${params.requesterContact}
ইমেইল: ${params.requesterEmail || "N/A"}
বার্তা: ${params.message || "N/A"}

অনুরোধ আইডি: ${params.requestId}
অ্যাডমিন প্যানেল: ${adminUrl}
ট্র্যাকিং পেজ: ${trackUrl}`;

    for (const to of adminRecipients) {
      await sendSystemEmail({
        to,
        subject: `🩸 [Donor Contact Request] ${params.bloodGroupNeeded} for ${params.patientName} (Donor: ${params.donorName || "Registered Donor"})`,
        html: adminHtml,
        text: adminText,
        replyTo: params.requesterEmail || undefined,
        priority: "high",
      });
    }
  }

  // B. Requester Confirmation Email
  if (params.requesterEmail && params.requesterEmail.includes("@")) {
    const requesterHtml = buildBrandedEmailShell({
      preheader: `আপনার রক্তদাতা যোগাযোগের অনুরোধটি (#${params.requestId.slice(0, 8)}) গ্রহণ করা হয়েছে।`,
      badgeText: "যোগাযোগের অনুরোধ গ্রহণ",
      title: "রক্তদাতা যোগাযোগের অনুরোধ — রেড ক্রিসেন্ট যুব দল",
      contentHtml: `
        <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #0f172a; font-weight: 700;">
          প্রিয় ${params.requesterName},
        </h2>
        <p style="margin: 0 0 16px 0; font-size: 14.5px; line-height: 1.7; color: #475569;">
          আমরা রক্তদাতা <strong>${params.donorName || "রক্তদাতা"}</strong> (${params.donorBloodGroup || params.bloodGroupNeeded})-এর সাথে যোগাযোগের জন্য আপনার অনুরোধটি সফলভাবে গ্রহণ করেছি।
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 7px 0; color: #64748b; font-weight: 600;">রোগীর নাম:</td>
              <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.patientName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 7px 0; color: #64748b; font-weight: 600;">রক্তের গ্রুপ:</td>
              <td style="padding: 7px 0; color: #dc2626; font-weight: 800; font-size: 16px; text-align: right;">${params.bloodGroupNeeded}</td>
            </tr>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 7px 0; color: #64748b; font-weight: 600;">হাসপাতাল / স্থান:</td>
              <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.hospital || "উল্লেখ নেই"}</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #64748b; font-weight: 600;">অনুরোধকৃত রক্তদাতা:</td>
              <td style="padding: 7px 0; color: #0f172a; font-weight: 700; text-align: right;">${params.donorName || "রেজিস্টার্ড রক্তদাতা"}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 26px 0 20px 0;">
          <a href="${trackUrl}" target="_blank" rel="noopener noreferrer" class="btn">
            অনুরোধের স্ট্যাটাস ট্র্যাক করুন
          </a>
        </div>

        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 8px; padding: 14px 16px; margin: 20px 0; font-size: 13.5px; color: #166534; line-height: 1.6;">
          <strong>নিরাপত্তা ও গোপনীয়তা:</strong> রক্তদাতার ব্যক্তিগত নিরাপত্তার স্বার্থে প্রতিটি অনুরোধ আমাদের সোসাইটির দায়িত্বপ্রাপ্ত টিম যাচাই করে অনুমোদন করে থাকে। অনুমোদনের পর আপনার সেট করা ৪–৬ ডিজিটের পাসকোড দিয়ে রক্তদাতার নম্বর দেখতে পারবেন।
        </div>
      `,
      footerNote: "আপনি রাজশাহী পলিটেকনিক যুব রেড ক্রিসেন্ট পোর্টালে রক্তদাতার সাথে যোগাযোগের অনুরোধ জমা দিয়েছেন বিধায় এই তথ্যভিত্তিক ইমেইলটি পাঠানো হয়েছে।",
    });

    const requesterText = `প্রিয় ${params.requesterName},

রক্তদাতা ${params.donorName || "রক্তদাতা"}-এর সাথে যোগাযোগের জন্য আপনার অনুরোধটি সফলভাবে গ্রহণ করা হয়েছে।
- রোগীর নাম: ${params.patientName}
- প্রয়োজনীয় রক্তের গ্রুপ: ${params.bloodGroupNeeded}
- স্থান/হাসপাতাল: ${params.hospital || "N/A"}

আমাদের টিম অনুরোধটি যাচাই করে অনুমোদন করবে। আপনি নিচের লিংকে গিয়ে পাসকোড দিয়ে স্ট্যাটাস দেখতে পারবেন:
${trackUrl}

ধন্যবাদ,
বাংলাদেশ রেড ক্রিসেন্ট সোসাইটি, রাজশাহী পলিটেকনিক ইনস্টিটিউট যুব রেড ক্রিসেন্ট দল`;

    await sendSystemEmail({
      to: params.requesterEmail,
      subject: `🩸 [Red Crescent Youth] রক্তদাতার সাথে যোগাযোগের অনুরোধ গৃহীত হয়েছে`,
      html: requesterHtml,
      text: requesterText,
      priority: "high",
    });
  }
}

