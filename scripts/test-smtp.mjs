import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

// Load .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value.trim();
    }
  });
}

const smtpUser = process.env.SMTP_USER || "redcrescentyouthrgpi@gmail.com";
const smtpPass = process.env.SMTP_PASS?.replace(/\s+/g, "");
const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT) || 465;
const smtpSecure = process.env.SMTP_SECURE !== "false";
const targetEmail = process.argv[2] || "iamehedihsn@gmail.com";

console.log("=========================================");
console.log("       GMAIL SMTP TEST UTILITY          ");
console.log("=========================================");
console.log(`SMTP Host:    ${smtpHost}:${smtpPort} (SSL: ${smtpSecure})`);
console.log(`SMTP User:    ${smtpUser}`);
console.log(`SMTP Pass:    ${smtpPass ? "****** (Configured)" : "NOT CONFIGURED!"}`);
console.log(`Target Recipient: ${targetEmail}`);
console.log("-----------------------------------------");

if (!smtpPass) {
  console.error("❌ ERROR: SMTP_PASS is missing in .env.local!");
  console.log("\nPlease generate a 16-character Google App Password:");
  console.log("1. Open https://myaccount.google.com/apppasswords");
  console.log("2. Create an App password (e.g. 'RCY Portal')");
  console.log("3. Add to .env.local -> SMTP_PASS=your-16-char-password");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

async function main() {
  try {
    console.log("⏳ Verifying SMTP credentials with Google...");
    await transporter.verify();
    console.log("✅ SMTP Authentication Successful!\n");

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log(`⏳ Generating password recovery link for ${targetEmail}...`);
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
    const redirectTo = `${appUrl}/auth/callback?next=/reset-password`;

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: targetEmail,
      options: {
        redirectTo,
      },
    });

    if (linkError) {
      console.error("Supabase generateLink error:", linkError);
      return;
    }

    const resetLink = linkData?.properties?.action_link;
    console.log("Generated Action Link:", resetLink);

    console.log(`\n⏳ Sending branded Password Reset Email to ${targetEmail}...`);
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Reset Your Password - Red Crescent Youth</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
    .container { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 28px; text-align: center; border-bottom: 3px solid #dc2626; }
    .header-badge { display: inline-block; background: rgba(220,38,38,0.18); color: #fca5a5; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px; margin-bottom: 12px; border: 1px solid rgba(220,38,38,0.35); }
    .header h1 { color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 6px 0; }
    .content { padding: 36px 32px; }
    .greeting { font-size: 17px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
    .text { font-size: 15px; line-height: 1.65; color: #475569; margin-bottom: 24px; }
    .cta-box { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background-color: #dc2626; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 34px; border-radius: 10px; box-shadow: 0 4px 14px rgba(220,38,38,0.35); }
    .note-box { background-color: #f1f5f9; border-left: 4px solid #dc2626; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px; font-size: 13px; color: #64748b; line-height: 1.5; }
    .alt-link { font-size: 12px; color: #94a3b8; word-break: break-all; margin-top: 20px; line-height: 1.5; }
    .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-badge">Red Crescent Youth</div>
      <h1>Password Reset Request</h1>
      <p style="color: #94a3b8; font-size: 13px; margin: 0;">Rajshahi Govt. Polytechnic Institute RCY Portal</p>
    </div>
    <div class="content">
      <p class="greeting">Hello Mehedi Hasan,</p>
      <p class="text">
        We received a request to reset the password for your account in the Red Crescent Youth portal. Click the button below to choose a new password:
      </p>
      <div class="cta-box">
        <a href="${resetLink}" class="btn" target="_blank">Reset My Password</a>
      </div>
      <div class="note-box">
        <strong>Security Notice:</strong> This password reset link is valid for <strong>1 hour</strong>. If you did not make this request, you can safely ignore this email — your password will remain unchanged.
      </div>
      <div class="alt-link">
        If the button above does not work, copy and paste this URL into your browser:<br>
        <a href="${resetLink}" style="color: #dc2626;">${resetLink}</a>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Red Crescent Youth, Rajshahi Govt. Polytechnic Institute.<br>
      Serving humanity with dignity and impartiality.
    </div>
  </div>
</body>
</html>`;

    const info = await transporter.sendMail({
      from: `"Red Crescent Youth" <${smtpUser}>`,
      to: targetEmail,
      subject: "Reset your Red Crescent Youth portal password",
      text: `Hello Mehedi Hasan,\n\nPlease reset your password using the link below:\n${resetLink}\n\nThis link is valid for 1 hour.`,
      html: htmlContent,
    });

    console.log("🎉 Password Reset Email successfully sent to", targetEmail);
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);
  } catch (err) {
    console.error("❌ Failed to send email:", err.message);
    if (err.message?.includes("Invalid login") || err.message?.includes("Username and Password not accepted")) {
      console.log("\n💡 Tip: Make sure 2-Step Verification is turned ON and you are using a 16-character Google App Password (not your normal Gmail password).");
    }
  }
}

main();
