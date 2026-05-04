import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "ServeMyTable <hello@servemytable.ca>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://servemytable.ca";

// ---------------------------------------------------------------------------
// Base HTML wrapper — all emails share this shell
// ---------------------------------------------------------------------------
function wrap(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>ServeMyTable</title>
</head>
<body style="margin:0;padding:0;background:#FAF6ED;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6ED;padding:40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

  <!-- Logo -->
  <tr>
    <td align="center" style="padding-bottom:28px;">
      <p style="margin:0;font-size:22px;font-weight:900;letter-spacing:3px;color:#1B2A4A;text-transform:uppercase;">
        SERVE<span style="color:#C6A34E;">MY</span>TABLE
      </p>
      <p style="margin:4px 0 0;font-size:10px;letter-spacing:4px;color:#C6A34E;text-transform:uppercase;">
        TAP . ORDER . ENJOY
      </p>
    </td>
  </tr>

  <!-- Card -->
  <tr>
    <td style="background:#FFFFFF;border-radius:16px;border:1px solid #F0E8D6;padding:40px 40px 32px;">
      ${body}
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td align="center" style="padding-top:24px;">
      <p style="margin:0;font-size:11px;color:#8B7355;line-height:1.6;">
        ServeMyTable · hello@servemytable.ca · Powered by
        <a href="https://leadjar.ca" style="color:#C6A34E;text-decoration:none;">LeadJar Agency</a>
        <br/>If you did not sign up for ServeMyTable, please ignore this email.
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function goldBtn(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:24px;padding:14px 32px;background:#C6A34E;color:#FFFFFF;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:10px;">${label}</a>`;
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 8px;font-size:28px;font-weight:900;color:#1B2A4A;letter-spacing:1px;text-transform:uppercase;">${text}</h1>`;
}

function p(text: string): string {
  return `<p style="margin:12px 0 0;font-size:14px;color:#8B7355;line-height:1.65;">${text}</p>`;
}

function step(num: number, title: string, desc: string): string {
  return `
  <tr>
    <td style="padding:10px 0;">
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td width="36" valign="top" style="padding-top:2px;">
            <div style="width:28px;height:28px;border-radius:50%;background:#C6A34E;text-align:center;line-height:28px;font-size:12px;font-weight:700;color:#FFFFFF;">${num}</div>
          </td>
          <td style="padding-left:10px;">
            <p style="margin:0;font-size:13px;font-weight:700;color:#1B2A4A;">${title}</p>
            <p style="margin:2px 0 0;font-size:12px;color:#8B7355;">${desc}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function divider(): string {
  return `<tr><td style="padding:20px 0;"><hr style="border:none;border-top:1px solid #F0E8D6;margin:0;"/></td></tr>`;
}

// ---------------------------------------------------------------------------
// sendWelcomeEmail — sent immediately on signup
// ---------------------------------------------------------------------------
export async function sendWelcomeEmail(opts: {
  to: string;
  ownerName: string;
  restaurantName: string;
}) {
  const body = `
    ${h1("Application received!")}
    ${p(`Hi ${opts.ownerName}, thanks for applying to ServeMyTable with <strong style="color:#1B2A4A;">${opts.restaurantName}</strong>. We&apos;ve received your application and our team will review it within 24 hours.`)}

    <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:24px;">
      ${step(1, "Application review", "Our team reviews your restaurant details — usually within 24 hours.")}
      ${step(2, "Account approval", "You&apos;ll receive a confirmation email with your login link.")}
      ${step(3, "14-day free trial begins", "Set up your menu, tables, and AI waiter — completely free.")}
      ${step(4, "Go live", "Print your QR codes and start taking AI-powered orders.")}
    </table>

    <table cellpadding="0" cellspacing="0" width="100%">${divider()}</table>

    ${p('Questions? Reply to this email or reach us at <a href="mailto:hello@servemytable.ca" style="color:#C6A34E;">hello@servemytable.ca</a>.')}
  `;

  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `We received your application — ${opts.restaurantName}`,
    html: wrap(body),
  });
}

// ---------------------------------------------------------------------------
// sendApprovalEmail — sent when super admin approves a signup
// ---------------------------------------------------------------------------
export async function sendApprovalEmail(opts: {
  to: string;
  ownerName: string;
  restaurantName: string;
  trialEndsAt: Date;
}) {
  const loginUrl = `${APP_URL}/auth/login`;
  const trialDate = opts.trialEndsAt.toLocaleDateString("en-CA", {
    year: "numeric", month: "long", day: "numeric",
  });

  const body = `
    ${h1("You&apos;re approved!")}
    ${p(`Hi ${opts.ownerName}, your ServeMyTable account for <strong style="color:#1B2A4A;">${opts.restaurantName}</strong> is now active. Your 14-day free trial starts today and runs until <strong style="color:#1B2A4A;">${trialDate}</strong>.`)}

    ${goldBtn(loginUrl, "Sign in to your dashboard")}

    <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:28px;">${divider()}</table>

    <p style="margin:0;font-size:13px;font-weight:700;color:#1B2A4A;">Get started in 4 steps</p>

    <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:8px;">
      ${step(1, "Add your menu", "Go to Menu → add categories and dishes with allergens and photos.")}
      ${step(2, "Set up tables", "Go to Tables → add your floor plan and seat counts.")}
      ${step(3, "Configure your AI waiter", "Go to AI Waiters → customize the personality and greeting.")}
      ${step(4, "Print QR codes", "Go to QR Codes → download and print one per table.")}
    </table>

    <table cellpadding="0" cellspacing="0" width="100%">${divider()}</table>

    ${p('Need help? Reply to this email or reach us at <a href="mailto:hello@servemytable.ca" style="color:#C6A34E;">hello@servemytable.ca</a>.')}
  `;

  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Your account is approved — trial ends ${trialDate}`,
    html: wrap(body),
  });
}

// ---------------------------------------------------------------------------
// sendPasswordChangedEmail — sent after a successful password reset
// ---------------------------------------------------------------------------
export async function sendPasswordChangedEmail(opts: {
  to: string;
  name: string;
}) {
  const loginUrl = `${APP_URL}/auth/login`;

  const body = `
    ${h1("Password updated")}
    ${p(`Hi ${opts.name}, your ServeMyTable password was just changed successfully.`)}
    ${p("You can now sign in using your new password.")}

    ${goldBtn(loginUrl, "Sign in to your dashboard")}

    <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:28px;">${divider()}</table>

    ${p('If you did not make this change, please contact us immediately at <a href="mailto:hello@servemytable.ca" style="color:#C6A34E;">hello@servemytable.ca</a> so we can secure your account.')}
  `;

  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: "Your ServeMyTable password has been updated",
    html: wrap(body),
  });
}

// ---------------------------------------------------------------------------
// sendTrialWarningEmail — sent 3 days before trial expiry
// ---------------------------------------------------------------------------
export async function sendTrialWarningEmail(opts: {
  to: string;
  ownerName: string;
  restaurantName: string;
  trialEndsAt: Date;
  daysLeft: number;
}) {
  const trialDate = opts.trialEndsAt.toLocaleDateString("en-CA", {
    year: "numeric", month: "long", day: "numeric",
  });
  const upgradeEmail = `mailto:hello@servemytable.ca?subject=Upgrade%20${encodeURIComponent(opts.restaurantName)}`;

  const body = `
    ${h1(`${opts.daysLeft} days left in your trial`)}
    ${p(`Hi ${opts.ownerName}, your free trial for <strong style="color:#1B2A4A;">${opts.restaurantName}</strong> ends on <strong style="color:#C04525;">${trialDate}</strong>. After that, your account will be paused and your AI waiter will go offline.`)}
    ${p("Upgrade now to keep serving your guests without interruption. Your menu, tables, orders, and settings are all preserved.")}

    ${goldBtn(upgradeEmail, "Contact us to upgrade")}

    <table cellpadding="0" cellspacing="0" width="100%">${divider()}</table>
    ${p('Questions? Just reply to this email — we&apos;re happy to help find the right plan for your restaurant.')}
  `;

  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Your ServeMyTable trial ends in ${opts.daysLeft} days — ${opts.restaurantName}`,
    html: wrap(body),
  });
}
