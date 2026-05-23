import { Resend } from 'resend';
import crypto from 'crypto';

const APP_STORE_URL = process.env.APP_STORE_URL || "https://apps.apple.com/us/app/sales-coach-ai/id6748286535";
const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || "default-secret-change-me";

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

function leadMagnetEmailHtml(firstName: string, downloadUrl: string, baseUrl: string): string {
  const unsubToken = generateUnsubscribeToken(firstName);
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0A0F1E;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#111827;border:1px solid rgba(212,160,23,0.2);border-radius:12px;padding:48px 40px;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="display:inline-block;background:rgba(212,160,23,0.15);border:1px solid rgba(212,160,23,0.3);border-radius:6px;padding:6px 16px;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#D4A017;margin-bottom:24px;">
          The Sales Commandments
        </div>
        <h1 style="font-size:28px;font-weight:700;color:#ffffff;margin:0 0 12px;line-height:1.3;">
          Your Playbook Is Ready, ${firstName || "Friend"}
        </h1>
        <p style="font-size:16px;color:#9CA3AF;margin:0;">
          The New Sales Manager Playbook — downloaded and ready to go.
        </p>
      </div>

      <div style="text-align:center;margin-bottom:36px;">
        <a href="${downloadUrl}" style="display:inline-block;background:#D4A017;color:#0A0F1E;text-decoration:none;padding:16px 36px;border-radius:8px;font-weight:700;font-size:16px;">
          Download Your Playbook →
        </a>
      </div>

      <div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:28px;margin-bottom:28px;">
        <p style="color:#9CA3AF;font-size:15px;line-height:1.7;margin:0 0 16px;">
          Inside you'll find the exact frameworks I've used to help hundreds of new sales managers stop winging it and start leading with confidence:
        </p>
        <ul style="color:#D4A017;padding-left:20px;margin:0;">
          <li style="margin-bottom:8px;color:#D4A017;"><span style="color:#9CA3AF;">The 5 mistakes every new manager makes (and how to avoid them)</span></li>
          <li style="margin-bottom:8px;color:#D4A017;"><span style="color:#9CA3AF;">A plug-and-play 1:1 framework your reps will actually respect</span></li>
          <li style="margin-bottom:8px;color:#D4A017;"><span style="color:#9CA3AF;">Your 90-day blueprint for building a team that hits quota</span></li>
        </ul>
      </div>

      <div style="background:rgba(212,160,23,0.08);border:1px solid rgba(212,160,23,0.15);border-radius:8px;padding:24px;text-align:center;margin-bottom:28px;">
        <p style="color:#ffffff;font-size:15px;margin:0 0 16px;font-weight:600;">Want coaching on demand, anywhere?</p>
        <a href="${APP_STORE_URL}" style="display:inline-block;background:#1a2340;color:#D4A017;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;border:1px solid rgba(212,160,23,0.3);">
          Download SalesCoachAI →
        </a>
      </div>

      <p style="color:#6B7280;font-size:13px;text-align:center;margin:0;">
        You're receiving this because you signed up at nicholasandrews.com.<br>
        <a href="${baseUrl}/unsubscribe?email=${encodeURIComponent(firstName)}" style="color:#6B7280;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

function newsletterEmailHtml(firstName: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0A0F1E;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#111827;border:1px solid rgba(212,160,23,0.2);border-radius:12px;padding:48px 40px;text-align:center;">
      <div style="display:inline-block;background:rgba(212,160,23,0.15);border:1px solid rgba(212,160,23,0.3);border-radius:6px;padding:6px 16px;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#D4A017;margin-bottom:24px;">
        The Sales Commandments
      </div>
      <h1 style="font-size:26px;font-weight:700;color:#ffffff;margin:0 0 12px;">
        You're In, ${firstName || "Friend"} 👊
      </h1>
      <p style="font-size:16px;color:#9CA3AF;margin:0 0 32px;line-height:1.6;">
        Welcome to The Sales Commandments community. Expect real talk, proven frameworks, and zero fluff delivered straight to your inbox.
      </p>
      <a href="${APP_STORE_URL}" style="display:inline-block;background:#D4A017;color:#0A0F1E;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;">
        Download SalesCoachAI
      </a>
    </div>
  </div>
</body>
</html>`;
}

export async function sendLeadMagnetEmail(
  email: string,
  firstName: string,
  downloadUrl: string,
  baseUrl: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    if (!fromEmail) return { success: false, error: "From email not configured" };

    await client.emails.send({
      from: fromEmail,
      to: email,
      subject: `Your Sales Manager Playbook is inside 📋`,
      html: leadMagnetEmailHtml(firstName, downloadUrl, baseUrl),
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
): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    if (!fromEmail) return { success: false, error: "From email not configured" };

    await client.emails.send({
      from: fromEmail,
      to: email,
      subject: `Welcome to The Sales Commandments`,
      html: newsletterEmailHtml(firstName),
    });
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Newsletter email failed:", msg);
    return { success: false, error: msg };
  }
}
