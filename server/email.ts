import { Resend } from 'resend';
import crypto from 'crypto';
import type { LeadMagnet } from '@shared/schema';

const APP_STORE_URL = process.env.APP_STORE_URL || "https://apps.apple.com/us/app/sales-coach-ai/id6748286535";
const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || "default-secret-change-me";
const PRO_PRICE = process.env.PRO_PRICE || "4.99";
const FUTURE_PRICE = process.env.FUTURE_PRICE || "14.99";
const PRICE_INCREASE_DATE = process.env.PRICE_INCREASE_DATE;
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  const connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken,
      },
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || !connectionSettings.settings.api_key) {
    throw new Error('Resend not connected');
  }

  return {
    apiKey: connectionSettings.settings.api_key,
    fromEmail: connectionSettings.settings.from_email,
  };
}

export async function getUncachableResendClient() {
  const creds = await getCredentials();
  return {
    client: new Resend(creds.apiKey),
    fromEmail: creds.fromEmail,
  };
}

export function generateUnsubscribeToken(email: string): string {
  return crypto
    .createHash('sha256')
    .update(email.toLowerCase() + UNSUBSCRIBE_SECRET)
    .digest('hex');
}

export function validateUnsubscribeToken(email: string, token: string): boolean {
  return token === generateUnsubscribeToken(email);
}

function shouldShowPriceIncrease(): boolean {
  if (!PRICE_INCREASE_DATE) return false;
  return new Date(PRICE_INCREASE_DATE) > new Date();
}

function generateEmailHtml(email: string, baseUrl: string, leadMagnet: LeadMagnet): string {
  const unsubscribeToken = generateUnsubscribeToken(email);
  const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(unsubscribeToken)}`;

  const priceIncreaseHtml = shouldShowPriceIncrease()
    ? `<p style="color: #dc2626; font-weight: 600; margin-top: 8px;">Limited time: before it goes up to $${FUTURE_PRICE}/mo</p>`
    : '';

  const supportHtml = SUPPORT_EMAIL
    ? `<p style="color: #6b7280; font-size: 12px; margin-top: 24px;">Questions? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color: #3b82f6;">${SUPPORT_EMAIL}</a></p>`
    : '';

  const resourceButtonHtml = leadMagnet.resourceUrl
    ? `<div style="text-align: center; margin-bottom: 24px;">
        <a href="${leadMagnet.resourceUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Access ${leadMagnet.title}
        </a>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ${leadMagnet.title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

      <h1 style="font-size: 28px; font-weight: 700; color: #111827; margin: 0 0 24px 0; text-align: center;">
        Your ${leadMagnet.title}
      </h1>

      <p style="font-size: 16px; color: #4b5563; margin-bottom: 32px; text-align: center;">
        ${leadMagnet.description}
      </p>

      ${resourceButtonHtml}

      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${APP_STORE_URL}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Get the App
        </a>
      </div>

      <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 32px;">
        <p style="font-size: 16px; color: #374151; margin: 0;">
          <strong>Upgrade to Pro</strong> inside the app for just <strong>$${PRO_PRICE}/mo</strong>
        </p>
        ${priceIncreaseHtml}
      </div>

      ${supportHtml}

    </div>

    <div style="text-align: center; padding: 24px 0;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        You're receiving this email because you requested ${leadMagnet.title}.
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;">
        <a href="${unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`.trim();
}

export async function sendLeadMagnetEmail(
  email: string,
  baseUrl: string,
  leadMagnet: LeadMagnet
): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();

    if (!fromEmail) {
      return { success: false, error: "From email not configured in Resend connection" };
    }

    const html = generateEmailHtml(email, baseUrl, leadMagnet);

    await client.emails.send({
      from: fromEmail,
      to: email,
      subject: `Your ${leadMagnet.title}`,
      html,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Failed to send email:", error);
    return { success: false, error: error.message || "Failed to send email" };
  }
}
