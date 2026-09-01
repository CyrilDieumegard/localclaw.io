import {
  hashLicenseIdentity,
  isVersionAllowed,
  legacyRollbackToken,
  licenseCorsHeaders,
  licenseJson,
  normalizeEmail,
  normalizeLicenseKey,
  readBoundedJson
} from "../../_lib/license.js";

// Compatibility endpoint for LocalClaw 1.0.201 and earlier.
//
// Do not issue signed receipts or write D1 state here. Historical app builds
// only understand the unsigned token contract, and old checkout sessions
// cannot be proven from the new Stripe account. New app builds use
// /api/license/v2/activate.
const HISTORICAL_CUSTOMER = Object.freeze({
  id: "cn-client-001",
  emailHash: "mjjApnO3kfdkKEuf7tJQcZw0_hxl92xCocViWt2dd7g",
  keyHash: "43qagIyQxtXHkLoTcpzMAZ8k6jZUpBMEISCqIK0aO1I",
  minVersion: "1.0.98"
});

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: licenseCorsHeaders() });
}

export async function onRequestPost(context) {
  try {
    const body = await readBoundedJson(context.request);
    const email = normalizeEmail(body?.email);
    const licenseKey = normalizeLicenseKey(body?.licenseKey);
    const machineId = String(body?.machineId || "").trim();
    const appVersion = String(body?.appVersion || "").trim();

    if (!email.includes("@") || !machineId || !/^LCW-\d{8}-[A-F0-9]{4}-[A-F0-9]{4}$/.test(licenseKey)) {
      return licenseJson({ ok: false, message: "Invalid license" }, 403);
    }

    const emailHash = await hashLicenseIdentity("email", email);
    let customerId = null;
    if (emailHash === HISTORICAL_CUSTOMER.emailHash) {
      if (!isVersionAllowed(appVersion, HISTORICAL_CUSTOMER.minVersion)) {
        return licenseJson({
          ok: false,
          message: `Please update to ${HISTORICAL_CUSTOMER.minVersion} or later`
        }, 403);
      }
      const keyHash = await hashLicenseIdentity("key", licenseKey);
      if (keyHash !== HISTORICAL_CUSTOMER.keyHash) {
        return licenseJson({ ok: false, message: "Invalid license" }, 403);
      }
      customerId = HISTORICAL_CUSTOMER.id;
    }

    const token = legacyRollbackToken({
      email,
      licenseKey,
      machineId,
      appVersion,
      activatedAt: new Date().toISOString(),
      product: "localclaw",
      customerId
    });
    return licenseJson({ ok: true, token, message: "Activated", expiresAt: null });
  } catch {
    return licenseJson({ ok: false, message: "Bad request" }, 400);
  }
}
