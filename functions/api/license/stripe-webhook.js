import {
  LicenseError,
  hashLicenseIdentity,
  licenseJson,
  maskEmail,
  readBoundedBytes,
  recordIgnoredStripeEvent,
  recordPaidCheckoutEvent,
  safeRequestId,
  validateLicenseStripeEvent,
  verifyLicenseStripeWebhook
} from "../../_lib/license.js";

export async function onRequestPost(context) {
  const requestId = safeRequestId(context.request);
  try {
    if (!context.env?.LOCALCLAW_DB) {
      throw new LicenseError("license_database_missing", 503, "Webhook is unavailable");
    }
    const signature = context.request.headers.get("Stripe-Signature");
    if (!signature) throw new LicenseError("stripe_signature_missing", 400, "Invalid webhook signature");
    const rawBody = await readBoundedBytes(context.request, 1_048_576);
    await verifyLicenseStripeWebhook(context.env, signature, rawBody);

    let event;
    try {
      event = JSON.parse(new TextDecoder().decode(rawBody));
    } catch {
      throw new LicenseError("stripe_event_json_invalid", 400, "Invalid Stripe event");
    }
    const validated = validateLicenseStripeEvent(context.env, event);
    if (validated.ignored) {
      await recordIgnoredStripeEvent(context.env.LOCALCLAW_DB, {
        eventId: validated.eventId,
        eventType: validated.eventType,
        sessionId: validated.sessionId,
        pending: validated.pending,
        livemode: Boolean(event.livemode)
      });
      return licenseJson({ ok: true, ignored: !validated.pending, pending: Boolean(validated.pending) });
    }

    const emailHash = await hashLicenseIdentity("email", validated.email);
    await recordPaidCheckoutEvent(context.env.LOCALCLAW_DB, {
      ...validated,
      emailHash,
      emailMasked: maskEmail(validated.email)
    });
    return licenseJson({ ok: true, received: true });
  } catch (error) {
    const known = error instanceof LicenseError;
    const code = known ? error.code : "license_webhook_failed";
    console.error(JSON.stringify({ message: "license_webhook_failed", code, requestId }));
    return licenseJson({
      ok: false,
      error: code,
      message: known ? error.publicMessage : "Webhook processing failed",
      requestId
    }, known ? error.status : 500);
  }
}
