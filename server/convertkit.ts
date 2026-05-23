const CONVERTKIT_API_KEY = process.env.CONVERTKIT_API_KEY;
const CONVERTKIT_FORM_ID = process.env.CONVERTKIT_FORM_ID;
const CONVERTKIT_LEAD_MAGNET_TAG_ID = process.env.CONVERTKIT_LEAD_MAGNET_TAG_ID;

export interface ConvertKitResult {
  success: boolean;
  skipped?: boolean;
  error?: string;
}

async function ckPost(path: string, body: Record<string, unknown>): Promise<{ ok: boolean; text: string }> {
  const res = await fetch(`https://api.convertkit.com/v3${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, text: await res.text() };
}

export async function subscribeToConvertKit(
  email: string,
  firstName: string,
  tag?: string,
): Promise<ConvertKitResult> {
  if (!CONVERTKIT_API_KEY || !CONVERTKIT_FORM_ID) {
    console.warn("[ConvertKit] CONVERTKIT_API_KEY or CONVERTKIT_FORM_ID not set — skipping.");
    return { success: true, skipped: true };
  }

  // 1. Subscribe to form (triggers automation sequences)
  const formRes = await ckPost(`/forms/${CONVERTKIT_FORM_ID}/subscribe`, {
    api_key: CONVERTKIT_API_KEY,
    email,
    first_name: firstName,
  });

  if (!formRes.ok) {
    console.error("[ConvertKit] Form subscribe error:", formRes.text);
    return { success: false, error: `ConvertKit form error: ${formRes.text}` };
  }

  // 2. Apply tag if a tag ID is configured for lead-magnet submissions
  const isLeadMagnet = tag === "lead-magnet-playbook" || tag === "lead-magnet";
  if (isLeadMagnet && CONVERTKIT_LEAD_MAGNET_TAG_ID) {
    const tagRes = await ckPost(`/tags/${CONVERTKIT_LEAD_MAGNET_TAG_ID}/subscribe`, {
      api_key: CONVERTKIT_API_KEY,
      email,
    });
    if (!tagRes.ok) {
      // Log but don't fail — subscriber is already in the form sequence
      console.error("[ConvertKit] Tag apply error:", tagRes.text);
    } else {
      console.info(`[ConvertKit] Tag ${CONVERTKIT_LEAD_MAGNET_TAG_ID} applied to ${email}`);
    }
  } else if (isLeadMagnet) {
    console.warn("[ConvertKit] CONVERTKIT_LEAD_MAGNET_TAG_ID not set — tag not applied. Set this secret to automatically tag lead-magnet subscribers.");
  }

  return { success: true };
}
