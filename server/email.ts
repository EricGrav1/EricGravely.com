import { Resend } from 'resend';
import crypto from 'crypto';
import { getSiteBaseUrl } from './config';

const APP_STORE_URL = process.env.APP_STORE_URL || "https://apps.apple.com/us/app/sales-coach-ai/id6748286535";
const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || "default-secret-change-me";

// Brand constants — single source of truth for email identity
const BRAND_NAME = "Eric Gravely";
const BRAND_TAGLINE = "Coach. Develop. Transform.";
const BRAND_URL = getSiteBaseUrl(); // used only when no request context available

async function getCredentials() {
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
  return token === generateUnsubscribeToken(email);
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
        ${emailFooter("", siteBaseUrl).replace(/unsubscribe.*<\/p>/s, "")}
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

    await client.emails.send({
      from: fromEmail,
      to: email,
      subject: `Your copy of ${productName} is inside`,
      html: leadMagnetEmailHtml(email, firstName, downloadUrl, siteBaseUrl, productName),
    });
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Email send failed:", msg);
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

    await client.emails.send({
      from: fromEmail,
      to: email,
      subject: `You're in — ${BRAND_NAME}`,
      html: newsletterEmailHtml(firstName, siteBaseUrl),
    });
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Newsletter email failed:", msg);
    return { success: false, error: msg };
  }
}
