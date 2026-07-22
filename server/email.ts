import { Resend } from 'resend';
import crypto from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getSiteBaseUrl } from './config';

const APP_STORE_URL = process.env.APP_STORE_URL || "https://apps.apple.com/us/app/sales-coach-ai/id6748286535";
const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || "default-secret-change-me";

// Brand constants — single source of truth for email identity
const BRAND_NAME = "Eric Gravely";
const BRAND_TAGLINE = "Coach. Develop. Transform.";
const REPLY_TO = "eric@ericgravely.com";
const BRAND_URL = getSiteBaseUrl(); // used only when no request context available

async function getCredentials() {
  // Preferred: explicit secrets (set in Replit Secrets). Falls back to the
  // Resend connector below only when RESEND_API_KEY is not set.
  if (process.env.RESEND_API_KEY) {
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    if (!fromEmail) throw new Error('RESEND_FROM_EMAIL is not set (required when using RESEND_API_KEY)');
    return { apiKey: process.env.RESEND_API_KEY, fromEmail };
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) throw new Error('X_REPLIT_TOKEN not found');

  const connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken,
      },
    }
  ).then(r => r.json()).then(d => d.items?.[0]);

  if (!connectionSettings?.settings?.api_key) throw new Error('Resend not connected');

  return {
    apiKey: connectionSettings.settings.api_key,
    fromEmail: connectionSettings.settings.from_email,
  };
}

export async function getUncachableResendClient() {
  const creds = await getCredentials();
  return { client: new Resend(creds.apiKey), fromEmail: creds.fromEmail };
}

export function generateUnsubscribeToken(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase() + UNSUBSCRIBE_SECRET).digest('hex');
}

export function validateUnsubscribeToken(email: string, token: string): boolean {
  const expected = generateUnsubscribeToken(email);
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ── Download tokens ───────────────────────────────────────────────────────────
// Resources are delivered ONLY via email. The email contains a tokenized link
// to /api/download which validates this HMAC before streaming the file.
export function generateDownloadToken(email: string, leadMagnetId: number): string {
  return crypto
    .createHmac('sha256', UNSUBSCRIBE_SECRET)
    .update(`download:${email.toLowerCase()}:${leadMagnetId}`)
    .digest('hex');
}

export function validateDownloadToken(email: string, leadMagnetId: number, token: string): boolean {
  const expected = generateDownloadToken(email, leadMagnetId);
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function buildDownloadUrl(siteBaseUrl: string, email: string, leadMagnetId: number): string {
  const token = generateDownloadToken(email, leadMagnetId);
  return `${siteBaseUrl}/api/download?lm=${leadMagnetId}&email=${encodeURIComponent(email.toLowerCase())}&token=${token}`;
}

function brandBadge(): string {
  return `
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:rgba(201,162,39,0.10);border:1px solid rgba(201,162,39,0.25);border-radius:4px;padding:5px 14px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#B08D1E;margin-bottom:8px;">
        ${BRAND_NAME}
      </div>
      <div style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#9A9A94;">
        ${BRAND_TAGLINE}
      </div>
    </div>`;
}

function emailFooter(email: string, siteBaseUrl: string): string {
  const unsubToken = generateUnsubscribeToken(email);
  const unsubLink = `${siteBaseUrl}/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken}`;
  return `
    <div style="border-top:1px solid rgba(0,0,0,0.07);padding-top:20px;text-align:center;">
      <p style="color:#999994;font-size:12px;margin:0 0 6px;line-height:1.6;">
        ${BRAND_NAME} · <a href="${siteBaseUrl}" style="color:#999994;text-decoration:none;">${siteBaseUrl.replace(/^https?:\/\//, "")}</a>
      </p>
      <p style="color:#999994;font-size:12px;margin:0;line-height:1.6;">
        <a href="${unsubLink}" style="color:#999994;">Unsubscribe</a>
      </p>
    </div>`;
}

function leadMagnetEmailHtml(
  email: string,
  firstName: string,
  downloadUrl: string,
  siteBaseUrl: string,
  productName: string,
): string {
  const fullDownloadUrl = downloadUrl.startsWith('http') ? downloadUrl : `${siteBaseUrl}${downloadUrl}`;
  const greeting = firstName ? `, ${firstName}` : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#FAF7F2;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:48px 40px;">

      ${brandBadge()}

      <h1 style="font-size:26px;font-weight:700;color:#0D0D0D;margin:0 0 12px;line-height:1.3;text-align:center;">
        Here's your copy of ${productName}${greeting}
      </h1>
      <p style="font-size:15px;color:#555550;margin:0 0 32px;line-height:1.6;text-align:center;">
        Click below to download — it's ready for you now.
      </p>

      <div style="text-align:center;margin-bottom:36px;">
        <a href="${fullDownloadUrl}" style="display:inline-block;background:#C9A227;color:#0D0D0D;text-decoration:none;padding:16px 36px;border-radius:8px;font-weight:700;font-size:16px;">
          Download ${productName} →
        </a>
      </div>

      <div style="border-top:1px solid rgba(0,0,0,0.07);padding-top:24px;margin-bottom:28px;">
        <p style="color:#555550;font-size:14px;line-height:1.7;margin:0 0 14px;">
          This comes from 10+ years in the field — coaching hundreds of sales reps, leading teams to Presidents Club, and figuring out what actually separates top performers from everyone else.
        </p>
        <p style="color:#555550;font-size:14px;line-height:1.7;margin:0;">
          Questions or want to go deeper? Reply to this email. I read every one.
        </p>
      </div>

      <div style="background:rgba(201,162,39,0.06);border:1px solid rgba(201,162,39,0.15);border-radius:8px;padding:24px;text-align:center;margin-bottom:32px;">
        <p style="color:#0D0D0D;font-size:14px;margin:0 0 14px;font-weight:600;">Want on-demand coaching wherever you are?</p>
        <a href="${APP_STORE_URL}" style="display:inline-block;background:#0D0D0D;color:#FAF7F2;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">
          Download SalesCoachAI →
        </a>
      </div>

      ${emailFooter(email, siteBaseUrl)}
    </div>
  </div>
</body>
</html>`;
}

function newsletterEmailHtml(firstName: string, siteBaseUrl: string): string {
  const greeting = firstName ? `, ${firstName}` : "";
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#FAF7F2;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:48px 40px;text-align:center;">

      ${brandBadge()}

      <h1 style="font-size:24px;font-weight:700;color:#0D0D0D;margin:0 0 12px;">
        You're in${greeting}
      </h1>
      <p style="font-size:15px;color:#555550;margin:0 0 32px;line-height:1.6;">
        Sales coaching, rep development, and leadership insights — straight to your inbox. No recycled advice, no fluff.
      </p>
      <a href="${APP_STORE_URL}" style="display:inline-block;background:#C9A227;color:#0D0D0D;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;">
        Download SalesCoachAI
      </a>

      <div style="margin-top:32px;">
        ${emailFooter("", siteBaseUrl).replace(/unsubscribe[\s\S]*<\/p>/, "")}
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function sendLeadMagnetEmail(
  email: string,
  firstName: string,
  downloadUrl: string,
  siteBaseUrl: string,
  productName: string = "The Ask & Close Playbook",
): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    if (!fromEmail) return { success: false, error: "From email not configured" };

    const { error } = await client.emails.send({
      from: fromEmail,
      replyTo: REPLY_TO,
      to: email,
      subject: `Your copy of ${productName} is inside`,
      html: leadMagnetEmailHtml(email, firstName, downloadUrl, siteBaseUrl, productName),
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Email send failed:", msg);
    return { success: false, error: msg };
  }
}

// ── Sequence (nurture) emails ─────────────────────────────────────────────────
// Body is stored as plain text in the DB (editable in the admin panel).
// {{first_name}} is replaced, blank lines become paragraphs.
function sequenceEmailHtml(email: string, bodyText: string, siteBaseUrl: string): string {
  const paragraphs = bodyText
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p style="color:#3A3A36;font-size:15px;line-height:1.75;margin:0 0 18px;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#FAF7F2;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:48px 40px;">
      ${brandBadge()}
      ${paragraphs}
      <div style="margin-top:8px;margin-bottom:32px;">
        <p style="color:#3A3A36;font-size:15px;line-height:1.75;margin:0;">— Eric</p>
      </div>
      ${emailFooter(email, siteBaseUrl)}
    </div>
  </div>
</body>
</html>`;
}

export function personalize(text: string, firstName: string): string {
  return text.replace(/\{\{\s*first_name\s*\}\}/gi, firstName || "there");
}

export async function sendSequenceEmail(
  email: string,
  firstName: string,
  subject: string,
  body: string,
  siteBaseUrl: string = BRAND_URL,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    if (!fromEmail) return { success: false, error: "From email not configured" };

    const { error } = await client.emails.send({
      from: fromEmail,
      replyTo: REPLY_TO,
      to: email,
      subject: personalize(subject, firstName),
      html: sequenceEmailHtml(email, personalize(body, firstName), siteBaseUrl),
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Sequence email failed:", msg);
    return { success: false, error: msg };
  }
}

// ── Assessment results (DECA) ─────────────────────────────────────────────────
// Emails the matching per-type playbook PDF as an attachment. The PDFs live in
// server/private/downloads/deca-<slug>.pdf and ship with the repo.
const DECA_SLUG: Record<string, string> = { D: "dominant", E: "ego", C: "caring", A: "analytical" };
const DECA_NAME: Record<string, string> = { D: "The Dominant", E: "The Ego", C: "The Caring", A: "The Analytical" };

function assessmentEmailHtml(firstName: string, typeName: string, email: string, siteBaseUrl: string): string {
  const greeting = firstName ? `, ${firstName}` : "";
  // Optional webinar CTA — appears only once WEBINAR_URL is set (no code change needed later).
  const webinarUrl = process.env.WEBINAR_URL;
  const webinarTitle = process.env.WEBINAR_TITLE || "Join my free training";
  const webinarBlock = webinarUrl
    ? `<div style="background:rgba(201,162,39,0.06);border:1px solid rgba(201,162,39,0.15);border-radius:8px;padding:24px;text-align:center;margin-bottom:32px;">
         <p style="color:#0D0D0D;font-size:14px;margin:0 0 14px;font-weight:600;">${webinarTitle}</p>
         <a href="${webinarUrl}" style="display:inline-block;background:#0D0D0D;color:#FAF7F2;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">Save my seat →</a>
       </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#FAF7F2;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:48px 40px;">
      ${brandBadge()}
      <h1 style="font-size:26px;font-weight:700;color:#0D0D0D;margin:0 0 12px;line-height:1.3;text-align:center;">
        Your results are in${greeting} — you're ${typeName}
      </h1>
      <p style="font-size:15px;color:#555550;margin:0 0 28px;line-height:1.6;text-align:center;">
        Your full ${typeName.replace(/^The\s+/, "")} sales playbook is attached as a PDF — how you're wired, how it shows up when you sell, your blind spot, and how to sell to every other type.
      </p>
      <div style="border-top:1px solid rgba(0,0,0,0.07);padding-top:24px;margin-bottom:28px;">
        <p style="color:#555550;font-size:14px;line-height:1.7;margin:0 0 14px;">
          Read it with your current pipeline in mind — then pick ONE thing to try on your next call. Small changes compound faster than you'd think.
        </p>
        <p style="color:#555550;font-size:14px;line-height:1.7;margin:0;">
          Questions, or want me to look at your team? Just reply — I read every email.
        </p>
      </div>
      ${webinarBlock}
      <div style="background:rgba(201,162,39,0.06);border:1px solid rgba(201,162,39,0.15);border-radius:8px;padding:24px;text-align:center;margin-bottom:32px;">
        <p style="color:#0D0D0D;font-size:14px;margin:0 0 14px;font-weight:600;">Want on-demand coaching wherever you are?</p>
        <a href="${APP_STORE_URL}" style="display:inline-block;background:#0D0D0D;color:#FAF7F2;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">Download SalesCoachAI →</a>
      </div>
      ${emailFooter(email, siteBaseUrl)}
    </div>
  </div>
</body>
</html>`;
}

export async function sendAssessmentResultsEmail(
  email: string,
  firstName: string,
  decaType: string,
  siteBaseUrl: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const slug = DECA_SLUG[decaType];
    const typeName = DECA_NAME[decaType];
    if (!slug) return { success: false, error: "Unknown assessment type" };

    const filePath = join(process.cwd(), "server", "private", "downloads", `deca-${slug}.pdf`);
    if (!existsSync(filePath)) {
      console.error(`[assessment] PDF missing: ${filePath}`);
      return { success: false, error: "Results file not available" };
    }

    const { client, fromEmail } = await getUncachableResendClient();
    if (!fromEmail) return { success: false, error: "From email not configured" };

    const { error } = await client.emails.send({
      from: fromEmail,
      replyTo: REPLY_TO,
      to: email,
      subject: `Your DECA results: you're ${typeName}`,
      html: assessmentEmailHtml(firstName, typeName, email, siteBaseUrl),
      attachments: [
        // Resend JSON-serializes the body, so content must be a base64 string,
        // not a raw Buffer (a Buffer would serialize to {"type":"Buffer",...}).
        {
          filename: `Eric Gravely - ${typeName} Sales Playbook.pdf`,
          content: readFileSync(filePath).toString("base64"),
          contentType: "application/pdf",
        },
      ],
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Assessment email failed:", msg);
    return { success: false, error: msg };
  }
}

export async function sendNewsletterConfirmationEmail(
  email: string,
  firstName: string,
  siteBaseUrl: string = BRAND_URL,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    if (!fromEmail) return { success: false, error: "From email not configured" };

    const { error } = await client.emails.send({
      from: fromEmail,
      replyTo: REPLY_TO,
      to: email,
      subject: `You're in — ${BRAND_NAME}`,
      html: newsletterEmailHtml(firstName, siteBaseUrl),
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Newsletter email failed:", msg);
    return { success: false, error: msg };
  }
}
