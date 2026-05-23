const CONVERTKIT_API_KEY = process.env.CONVERTKIT_API_KEY;
const CONVERTKIT_FORM_ID = process.env.CONVERTKIT_FORM_ID;

export interface ConvertKitResult {
  success: boolean;
  skipped?: boolean;
  error?: string;
}

export async function subscribeToConvertKit(
  email: string,
  firstName: string,
): Promise<ConvertKitResult> {
  if (!CONVERTKIT_API_KEY || !CONVERTKIT_FORM_ID) {
    console.warn("[ConvertKit] CONVERTKIT_API_KEY or CONVERTKIT_FORM_ID not set — skipping CK subscription.");
    return { success: true, skipped: true };
  }

  try {
    const res = await fetch(
      `https://api.convertkit.com/v3/forms/${CONVERTKIT_FORM_ID}/subscribe`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          api_key: CONVERTKIT_API_KEY,
          email,
          first_name: firstName,
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error("[ConvertKit] API error:", res.status, body);
      return { success: false, error: `ConvertKit error: ${res.status}` };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[ConvertKit] Fetch error:", message);
    return { success: false, error: message };
  }
}
