const CONVERTKIT_API_KEY = process.env.CONVERTKIT_API_KEY;
const CONVERTKIT_FORM_ID = process.env.CONVERTKIT_FORM_ID;

export interface ConvertKitResult {
  success: boolean;
  skipped?: boolean;
  error?: string;
}

async function ckPost(path: string, body: Record<string, unknown>): Promise<{ ok: boolean; data: unknown }> {
  const res = await fetch(`https://api.convertkit.com/v3${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

async function ckGet(path: string): Promise<{ ok: boolean; data: unknown }> {
  const res = await fetch(
    `https://api.convertkit.com/v3${path}?api_key=${CONVERTKIT_API_KEY}`,
    { headers: { "Content-Type": "application/json" } }
  );
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

/**
 * Find or create a ConvertKit tag by name, return its numeric ID.
 * Uses only the standard API key — no extra secrets required.
 */
async function resolveTagId(tagName: string): Promise<number | null> {
  try {
    const listRes = await ckGet("/tags");
    if (!listRes.ok) return null;
    const tags = (listRes.data as { tags?: Array<{ id: number; name: string }> }).tags ?? [];
    const existing = tags.find((t) => t.name === tagName);
    if (existing) return existing.id;

    // Tag doesn't exist yet — create it
    const createRes = await ckPost("/tags", {
      api_key: CONVERTKIT_API_KEY,
      tag: { name: tagName },
    });
    if (!createRes.ok) return null;
    const created = createRes.data as { id?: number };
    return created.id ?? null;
  } catch (err) {
    console.error("[ConvertKit] resolveTagId error:", err);
    return null;
  }
}

/**
 * Subscribe an email address to the configured ConvertKit form and apply
 * the canonical "lead-magnet" tag when the submission is a lead-magnet request.
 *
 * Required secrets: CONVERTKIT_API_KEY, CONVERTKIT_FORM_ID
 * No additional secrets needed — tag ID is resolved automatically by name.
 */
export async function subscribeToConvertKit(
  email: string,
  firstName: string,
  tag?: string,
): Promise<ConvertKitResult> {
  if (!CONVERTKIT_API_KEY || !CONVERTKIT_FORM_ID) {
    console.warn("[ConvertKit] CONVERTKIT_API_KEY or CONVERTKIT_FORM_ID not set — skipping.");
    return { success: true, skipped: true };
  }

  // 1. Subscribe to form (triggers configured automation sequences)
  const formRes = await ckPost(`/forms/${CONVERTKIT_FORM_ID}/subscribe`, {
    api_key: CONVERTKIT_API_KEY,
    email,
    first_name: firstName,
  });

  if (!formRes.ok) {
    const detail = JSON.stringify(formRes.data);
    console.error("[ConvertKit] Form subscribe error:", detail);
    return { success: false, error: `ConvertKit form error: ${detail}` };
  }

  // 2. Apply the "lead-magnet" tag for lead-magnet submissions
  const isLeadMagnet = tag === "lead-magnet" || tag === "lead-magnet-playbook";
  if (isLeadMagnet) {
    const tagId = await resolveTagId("lead-magnet");
    if (tagId) {
      const tagRes = await ckPost(`/tags/${tagId}/subscribe`, {
        api_key: CONVERTKIT_API_KEY,
        email,
      });
      if (tagRes.ok) {
        console.info(`[ConvertKit] Tag "lead-magnet" (id=${tagId}) applied to ${email}`);
      } else {
        // Non-fatal: subscriber already added to form sequence
        console.error("[ConvertKit] Tag apply error:", JSON.stringify(tagRes.data));
      }
    }
  }

  return { success: true };
}
