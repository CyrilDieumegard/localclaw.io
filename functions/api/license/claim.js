import {
  LicenseError,
  createLicense,
  deriveStripeLicenseKey,
  findLicenseByCheckout,
  findPaidSession,
  hashLicenseIdentity,
  licenseCorsHeaders,
  licenseJson,
  markPaidSessionClaimed,
  machineLimit,
  readBoundedJson,
  safeRequestId,
} from "../../_lib/license.js";

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: licenseCorsHeaders() });
}

export async function onRequestPost(context) {
  const requestId = safeRequestId(context.request);
  try {
    if (!context.env?.LOCALCLAW_DB) {
      throw new LicenseError("license_database_missing", 503, "Licence creation is temporarily unavailable");
    }
    const body = await readBoundedJson(context.request, 4_096);
    const sessionId = String(body?.sessionId || "").trim();
    if (!/^cs_(?:live|test)_[A-Za-z0-9]{20,255}$/.test(sessionId)) {
      throw new LicenseError("checkout_session_invalid", 400, "Purchase reference is invalid");
    }

    const purchase = await findPaidSession(context.env.LOCALCLAW_DB, sessionId);
    if (!purchase) {
      return new Response(JSON.stringify({
        ok: false,
        pending: true,
        error: "purchase_verification_pending",
        message: "Payment verification is still arriving. Please retry in a moment.",
        requestId
      }), {
        status: 202,
        headers: {
          ...licenseCorsHeaders(),
          "Cache-Control": "no-store",
          "Cloudflare-CDN-Cache-Control": "no-store",
          "Content-Type": "application/json; charset=utf-8",
          "Retry-After": "2",
          "X-Content-Type-Options": "nosniff"
        }
      });
    }
    if (purchase.status !== "paid") {
      throw new LicenseError("paid_session_revoked", 403, "This purchase has been revoked");
    }
    const licenseKey = await deriveStripeLicenseKey(context.env, sessionId);
    const emailHash = purchase.email_hash;
    const keyHash = await hashLicenseIdentity("key", licenseKey);

    let license = await findLicenseByCheckout(context.env.LOCALCLAW_DB, sessionId);
    if (license && (license.key_hash !== keyHash || license.email_hash !== emailHash)) {
      throw new LicenseError("checkout_license_mismatch", 409, "Purchase reconciliation failed");
    }
    if (!license) {
      try {
        license = await createLicense(context.env.LOCALCLAW_DB, {
          keyHash,
          emailHash,
          source: "stripe",
          machineLimit: machineLimit(context.env),
          requestId,
          stripeCheckoutSessionId: sessionId,
          stripePaymentIntentId: purchase.payment_intent_id,
          stripeCustomerId: purchase.customer_id,
          stripePaymentLinkId: purchase.payment_link_id,
          stripePriceId: firstConfiguredId(context.env?.LICENSE_STRIPE_PRICE_IDS, "price_"),
          stripeProductId: firstConfiguredId(context.env?.LICENSE_STRIPE_PRODUCT_IDS, "prod_")
        });
      } catch (error) {
        // Stripe redirects and browser refreshes can race. The unique Checkout
        // Session constraint makes this an idempotent replay, not a new licence.
        license = await findLicenseByCheckout(context.env.LOCALCLAW_DB, sessionId);
        if (!license || license.key_hash !== keyHash || license.email_hash !== emailHash) throw error;
      }
    }
    if (license.status !== "active") {
      throw new LicenseError("license_revoked", 403, "This licence has been revoked");
    }
    await markPaidSessionClaimed(context.env.LOCALCLAW_DB, sessionId, license.id);

    return licenseJson({
      ok: true,
      mode: "secure",
      licenseKey,
      emailMasked: purchase.email_masked,
      license: {
        id: license.id,
        status: "active",
        entitlement: "lifetime",
        machineLimit: Number(license.machine_limit)
      },
      message: "License ready"
    });
  } catch (error) {
    const known = error instanceof LicenseError;
    const stripeStatus = Number(error?.statusCode || 0);
    const code = known ? error.code : (stripeStatus === 404 ? "checkout_not_found" : "license_claim_failed");
    const status = known ? error.status : (stripeStatus >= 400 && stripeStatus < 500 ? 403 : 500);
    console.error(JSON.stringify({ message: "license_claim_failed", code, requestId }));
    return licenseJson({
      ok: false,
      error: code,
      message: known ? error.publicMessage : "Purchase could not be verified",
      requestId
    }, status);
  }
}

function firstConfiguredId(value, prefix) {
  const id = String(value || "").split(",")[0].trim();
  return id.startsWith(prefix) && /^[A-Za-z0-9_]+$/.test(id) ? id : null;
}
