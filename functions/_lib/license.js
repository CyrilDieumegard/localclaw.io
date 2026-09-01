const TEXT_ENCODER = new TextEncoder();
const BASE32_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const LICENSE_AUDIENCE = "io.localclaw.installer";
export const LICENSE_ISSUER = "https://localclaw.io";
export const LICENSE_RECEIPT_SCHEMA = "lc-license-receipt/v1";
export const LICENSE_RECEIPT_TYPE = "localclaw-license+jwt";
export const LICENSE_KEYS_SCHEMA = "lc-license-keys/v1";
export const DEFAULT_MACHINE_LIMIT = 3;
export const DEFAULT_RECEIPT_TTL_SECONDS = 180 * 24 * 60 * 60;

const HASH_DOMAINS = Object.freeze({
  email: "localclaw:email:v1",
  key: "localclaw:key:v1",
  machine: "localclaw:machine:v1"
});

export class LicenseError extends Error {
  constructor(code, status, publicMessage) {
    super(code);
    this.name = "LicenseError";
    this.code = code;
    this.status = status;
    this.publicMessage = publicMessage;
  }
}

export function normalizeEmail(value) {
  return String(value || "").trim().normalize("NFC").toLowerCase();
}

export function normalizeLicenseKey(value) {
  return String(value || "").trim().toUpperCase();
}

export function normalizeMachineId(value) {
  return String(value || "").trim().normalize("NFC");
}

export function isValidEmail(value) {
  return value.length >= 3 && value.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isAcceptedLicenseKey(value) {
  return /^LCW-\d{8}-[A-F0-9]{4}-[A-F0-9]{4}$/.test(value)
    || /^LOCALCLAW-[A-Z0-9-]{8,80}$/.test(value);
}

export function normalizeAppVersion(value) {
  const version = String(value || "").trim();
  return parseVersion(version) ? version : "";
}

export function parseVersion(value) {
  const match = /^(\d+)\.(\d+)(?:\.(\d+))?(?:[-+][0-9A-Za-z.-]+)?$/.exec(String(value || "").trim());
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3] || 0)];
}

export function isVersionAllowed(current, minimum) {
  const a = parseVersion(current);
  const b = parseVersion(minimum);
  if (!a || !b) return false;
  for (let index = 0; index < 3; index += 1) {
    if (a[index] > b[index]) return true;
    if (a[index] < b[index]) return false;
  }
  return true;
}

export async function hashLicenseIdentity(kind, normalizedValue) {
  const domain = HASH_DOMAINS[kind];
  if (!domain) throw new Error("unsupported_hash_domain");
  const digest = await crypto.subtle.digest(
    "SHA-256",
    TEXT_ENCODER.encode(`${domain}\u0000${normalizedValue}`)
  );
  return base64UrlEncode(new Uint8Array(digest));
}

export function activationMode(env) {
  const mode = String(env?.LICENSE_ACTIVATION_MODE || "enforce").trim().toLowerCase();
  if (!["legacy", "parallel", "enforce"].includes(mode)) {
    throw new LicenseError("license_mode_invalid", 503, "Activation is temporarily unavailable");
  }
  return mode;
}

export function machineLimit(env) {
  return boundedInteger(env?.LICENSE_MACHINE_LIMIT, DEFAULT_MACHINE_LIMIT, 1, 10);
}

export function receiptTtlSeconds(env) {
  return boundedInteger(
    env?.LICENSE_RECEIPT_TTL_SECONDS,
    DEFAULT_RECEIPT_TTL_SECONDS,
    24 * 60 * 60,
    365 * 24 * 60 * 60
  );
}

export function minimumAppVersion(env) {
  const value = String(env?.LICENSE_MIN_APP_VERSION || "1.0.0").trim();
  if (!parseVersion(value)) throw new LicenseError("license_min_app_version_invalid", 503, "Activation is temporarily unavailable");
  return value;
}

export function parseSigningIdentity(env) {
  const kid = String(env?.LICENSE_SIGNING_KID || "").trim();
  const raw = String(env?.LICENSE_SIGNING_PRIVATE_JWK || "").trim();
  if (!kid && !raw) return null;
  if (!/^[A-Za-z0-9._-]{8,80}$/.test(kid) || !raw) {
    throw new LicenseError("license_signer_incomplete", 503, "Activation is temporarily unavailable");
  }
  let jwk;
  try {
    jwk = JSON.parse(raw);
  } catch {
    throw new LicenseError("license_signer_invalid_json", 503, "Activation is temporarily unavailable");
  }
  if (
    jwk?.kty !== "OKP" || jwk?.crv !== "Ed25519"
    || typeof jwk?.d !== "string" || !isBase64UrlBytes(jwk.d, 32)
    || typeof jwk?.x !== "string" || !isBase64UrlBytes(jwk.x, 32)
  ) {
    throw new LicenseError("license_signer_invalid_jwk", 503, "Activation is temporarily unavailable");
  }
  return {
    kid,
    privateJwk: { ...jwk, alg: "EdDSA", key_ops: ["sign"], ext: true },
    publicJwk: { kid, kty: "OKP", crv: "Ed25519", x: jwk.x, use: "sig", alg: "EdDSA", status: "active" }
  };
}

export function publicSigningKeys(env) {
  const signing = parseSigningIdentity(env);
  const output = [];
  if (signing) output.push(signing.publicJwk);

  const previousRaw = String(env?.LICENSE_VERIFYING_PUBLIC_JWKS || "").trim();
  if (previousRaw) {
    let parsed;
    try {
      parsed = JSON.parse(previousRaw);
    } catch {
      throw new LicenseError("license_verifying_keys_invalid_json", 503, "Licence keys are temporarily unavailable");
    }
    const keys = Array.isArray(parsed) ? parsed : parsed?.keys;
    if (!Array.isArray(keys)) throw new LicenseError("license_verifying_keys_invalid", 503, "Licence keys are temporarily unavailable");
    for (const key of keys) {
      if (
        !/^[A-Za-z0-9._-]{8,80}$/.test(String(key?.kid || ""))
        || key?.kty !== "OKP" || key?.crv !== "Ed25519"
        || !isBase64UrlBytes(String(key?.x || ""), 32)
      ) {
        throw new LicenseError("license_verifying_key_invalid", 503, "Licence keys are temporarily unavailable");
      }
      if (!output.some((existing) => existing.kid === key.kid)) {
        output.push({
          kid: key.kid,
          kty: "OKP",
          crv: "Ed25519",
          x: key.x,
          use: "sig",
          alg: "EdDSA",
          status: key.status === "revoked" ? "revoked" : "retiring"
        });
      }
    }
  }
  return output;
}

export async function issueLicenseReceipt(env, input) {
  const signing = parseSigningIdentity(env);
  if (!signing) throw new LicenseError("license_signer_missing", 503, "Activation is temporarily unavailable");

  const now = Math.floor((input.nowMs ?? Date.now()) / 1000);
  const exp = now + receiptTtlSeconds(env);
  const header = {
    alg: "EdDSA",
    typ: LICENSE_RECEIPT_TYPE,
    kid: signing.kid
  };
  const payload = {
    iss: LICENSE_ISSUER,
    aud: LICENSE_AUDIENCE,
    schema: LICENSE_RECEIPT_SCHEMA,
    jti: crypto.randomUUID(),
    sub: `license:${input.license.id}`,
    iat: now,
    nbf: now - 60,
    exp,
    license_id: input.license.id,
    license_version: Number(input.license.license_version),
    product: "localclaw",
    entitlement: "lifetime",
    entitlement_expires_at: null,
    status: "active",
    source: input.license.source === "stripe" ? "stripe" : "legacy_migration",
    machine_hash: input.machineHash,
    email_hash: input.emailHash,
    key_hash: input.keyHash,
    app_version: input.appVersion,
    min_app_version: minimumAppVersion(env)
  };

  const headerSegment = base64UrlEncode(TEXT_ENCODER.encode(JSON.stringify(header)));
  const payloadSegment = base64UrlEncode(TEXT_ENCODER.encode(JSON.stringify(payload)));
  const signingInput = `${headerSegment}.${payloadSegment}`;
  let privateKey;
  try {
    privateKey = await crypto.subtle.importKey(
      "jwk",
      signing.privateJwk,
      { name: "Ed25519" },
      false,
      ["sign"]
    );
  } catch {
    throw new LicenseError("license_signer_import_failed", 503, "Activation is temporarily unavailable");
  }
  const signature = await crypto.subtle.sign("Ed25519", privateKey, TEXT_ENCODER.encode(signingInput));
  return {
    receipt: `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`,
    expiresAt: new Date(exp * 1000).toISOString(),
    payload
  };
}

export async function deriveStripeLicenseKey(env, sessionId) {
  const secret = String(env?.LICENSE_KEY_DERIVATION_SECRET || "");
  if (secret.length < 32) throw new LicenseError("license_derivation_secret_missing", 503, "Licence creation is temporarily unavailable");
  const key = await crypto.subtle.importKey(
    "raw",
    TEXT_ENCODER.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = new Uint8Array(await crypto.subtle.sign(
    "HMAC",
    key,
    TEXT_ENCODER.encode(`localclaw:stripe-license:v1\u0000${sessionId}`)
  ));
  const encoded = base32Encode(digest.slice(0, 15));
  return `LOCALCLAW-${encoded.match(/.{1,4}/g).join("-")}`;
}

export function validatePaidCheckoutSession(env, session, lineItems) {
  if (!session || typeof session.id !== "string") throw new LicenseError("checkout_not_found", 404, "Purchase not found");
  const expectedLive = String(env?.STRIPE_EXPECTED_LIVEMODE || "true").trim().toLowerCase() !== "false";
  if (Boolean(session.livemode) !== expectedLive) throw new LicenseError("checkout_mode_mismatch", 403, "Purchase could not be verified");
  if (session.mode !== "payment" || session.status !== "complete" || session.payment_status !== "paid") {
    throw new LicenseError("checkout_not_paid", 403, "Payment is not complete");
  }
  const email = normalizeEmail(session.customer_details?.email || session.customer_email);
  if (!isValidEmail(email)) throw new LicenseError("checkout_email_missing", 422, "Purchase email is unavailable");

  const paymentLinkId = stripeObjectId(session.payment_link);
  const priceIds = new Set();
  const productIds = new Set();
  for (const item of lineItems || []) {
    const priceId = stripeObjectId(item?.price);
    const productId = stripeObjectId(item?.price?.product);
    if (priceId) priceIds.add(priceId);
    if (productId) productIds.add(productId);
  }

  const allowedPaymentLinks = csvSet(env?.LICENSE_STRIPE_PAYMENT_LINK_IDS, "plink_");
  const allowedPrices = csvSet(env?.LICENSE_STRIPE_PRICE_IDS, "price_");
  const allowedProducts = csvSet(env?.LICENSE_STRIPE_PRODUCT_IDS, "prod_");
  if (allowedPaymentLinks.size + allowedPrices.size + allowedProducts.size === 0) {
    throw new LicenseError("checkout_allowlist_missing", 503, "Licence creation is temporarily unavailable");
  }
  const matchesAllowlist = (
    (paymentLinkId && allowedPaymentLinks.has(paymentLinkId))
    || [...priceIds].some((id) => allowedPrices.has(id))
    || [...productIds].some((id) => allowedProducts.has(id))
  );
  if (!matchesAllowlist) throw new LicenseError("checkout_product_mismatch", 403, "Purchase does not include a LocalClaw licence");

  const expectedAmount = optionalInteger(env?.LICENSE_STRIPE_AMOUNT_CENTS, 1, 10_000_000);
  if (expectedAmount !== null && Number(session.amount_total) !== expectedAmount) {
    throw new LicenseError("checkout_amount_mismatch", 403, "Purchase amount could not be verified");
  }
  const expectedCurrency = String(env?.LICENSE_STRIPE_CURRENCY || "").trim().toLowerCase();
  if (expectedCurrency && String(session.currency || "").toLowerCase() !== expectedCurrency) {
    throw new LicenseError("checkout_currency_mismatch", 403, "Purchase currency could not be verified");
  }

  return {
    email,
    paymentLinkId,
    priceId: [...priceIds][0] || null,
    productId: [...productIds][0] || null,
    paymentIntentId: stripeObjectId(session.payment_intent),
    customerId: stripeObjectId(session.customer)
  };
}

export async function verifyLicenseStripeWebhook(env, signatureHeader, rawBody, nowMs = Date.now()) {
  const secret = String(env?.LOCALCLAW_STRIPE_WEBHOOK_SECRET || "").trim();
  if (!/^whsec_[A-Za-z0-9]+$/.test(secret)) {
    throw new LicenseError("license_webhook_secret_missing", 503, "Webhook is unavailable");
  }
  const parts = String(signatureHeader || "").split(",").map((part) => part.trim());
  const timestampPart = parts.find((part) => part.startsWith("t="));
  const timestamp = Number(timestampPart?.slice(2));
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => hexDecode(part.slice(3)))
    .filter(Boolean);
  if (!Number.isSafeInteger(timestamp) || signatures.length === 0) {
    throw new LicenseError("stripe_signature_invalid", 400, "Invalid webhook signature");
  }
  const tolerance = boundedInteger(env?.LICENSE_STRIPE_WEBHOOK_TOLERANCE_SECONDS, 300, 60, 900);
  if (Math.abs(Math.floor(nowMs / 1000) - timestamp) > tolerance) {
    throw new LicenseError("stripe_signature_expired", 400, "Invalid webhook signature");
  }
  const key = await crypto.subtle.importKey(
    "raw",
    TEXT_ENCODER.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const prefix = TEXT_ENCODER.encode(`${timestamp}.`);
  const signed = new Uint8Array(prefix.length + rawBody.length);
  signed.set(prefix, 0);
  signed.set(rawBody, prefix.length);
  for (const signature of signatures) {
    if (signature.byteLength === 32 && await crypto.subtle.verify("HMAC", key, signature, signed)) return true;
  }
  throw new LicenseError("stripe_signature_invalid", 400, "Invalid webhook signature");
}

export function validateLicenseStripeEvent(env, event) {
  if (!/^evt_[A-Za-z0-9]{8,255}$/.test(String(event?.id || ""))) {
    throw new LicenseError("stripe_event_invalid", 400, "Invalid Stripe event");
  }
  const supported = new Set(["checkout.session.completed", "checkout.session.async_payment_succeeded"]);
  if (!supported.has(event.type)) return { ignored: true, pending: false, eventId: event.id, eventType: String(event.type || "unknown") };

  const session = event.data?.object;
  const expectedLive = String(env?.STRIPE_EXPECTED_LIVEMODE || "true").trim().toLowerCase() !== "false";
  if (Boolean(event.livemode) !== expectedLive || Boolean(session?.livemode) !== expectedLive) {
    throw new LicenseError("checkout_mode_mismatch", 403, "Purchase could not be verified");
  }
  if (!/^cs_(?:live|test)_[A-Za-z0-9]{20,255}$/.test(String(session?.id || ""))) {
    throw new LicenseError("checkout_session_invalid", 400, "Invalid Stripe event");
  }
  const paymentLinkId = stripeObjectId(session.payment_link);
  const allowedPaymentLinks = csvSet(env?.LICENSE_STRIPE_PAYMENT_LINK_IDS, "plink_");
  if (allowedPaymentLinks.size === 0) {
    throw new LicenseError("checkout_payment_link_allowlist_missing", 503, "Webhook is unavailable");
  }
  if (!paymentLinkId || !allowedPaymentLinks.has(paymentLinkId)) {
    return {
      ignored: true,
      pending: false,
      eventId: event.id,
      eventType: event.type,
      sessionId: null
    };
  }
  if (session.mode !== "payment" || session.status !== "complete") {
    throw new LicenseError("checkout_state_invalid", 403, "Payment is not complete");
  }
  const expectedAmount = optionalInteger(env?.LICENSE_STRIPE_AMOUNT_CENTS, 1, 10_000_000) ?? 4_900;
  const expectedCurrency = String(env?.LICENSE_STRIPE_CURRENCY || "usd").trim().toLowerCase();
  if (Number(session.amount_total) !== expectedAmount) {
    throw new LicenseError("checkout_amount_mismatch", 403, "Purchase amount could not be verified");
  }
  if (String(session.currency || "").toLowerCase() !== expectedCurrency) {
    throw new LicenseError("checkout_currency_mismatch", 403, "Purchase currency could not be verified");
  }
  const email = normalizeEmail(session.customer_details?.email || session.customer_email);
  if (!isValidEmail(email)) throw new LicenseError("checkout_email_missing", 422, "Purchase email is unavailable");
  if (event.type === "checkout.session.completed" && session.payment_status === "unpaid") {
    return {
      ignored: true,
      pending: true,
      eventId: event.id,
      eventType: event.type,
      sessionId: session.id
    };
  }
  if (session.payment_status !== "paid") {
    throw new LicenseError("checkout_not_paid", 403, "Payment is not complete");
  }
  return {
    ignored: false,
    eventId: event.id,
    eventType: event.type,
    livemode: expectedLive,
    sessionId: session.id,
    email,
    paymentLinkId,
    paymentIntentId: stripeObjectId(session.payment_intent),
    customerId: stripeObjectId(session.customer),
    amountTotal: expectedAmount,
    currency: expectedCurrency,
    paidAt: stripeEventTime(event.created)
  };
}

export async function classifyLegacyMigration(env, input) {
  // Never convert an unverified legacy key into a signed lifetime
  // entitlement. Existing on-device caches remain grandfathered by the app;
  // recovery on another Mac requires an audited hash import or support proof.
  // Historical plaintext in public Git history makes even a hash-only seed
  // replayable, so v2 contains no automatic legacy seed.
  // The explicit unsigned rollback path is handled before D1 in v2/activate.js.
  activationMode(env);
  return { allowed: false, reason: "legacy_not_seeded" };
}

export async function findLicense(db, keyHash, emailHash) {
  return db.prepare(`
    SELECT id, key_hash, email_hash, status, entitlement, source,
           machine_limit, license_version, revoked_at
    FROM license_entitlements
    WHERE key_hash = ? AND email_hash = ?
  `).bind(keyHash, emailHash).first();
}

export async function findLicenseByCheckout(db, sessionId) {
  return db.prepare(`
    SELECT id, key_hash, email_hash, status, entitlement, source,
           machine_limit, license_version, stripe_checkout_session_id
    FROM license_entitlements
    WHERE stripe_checkout_session_id = ?
  `).bind(sessionId).first();
}

export async function findPaidSession(db, sessionId) {
  return db.prepare(`
    SELECT session_id, email_hash, email_masked, payment_link_id,
           payment_intent_id, customer_id, amount_total, currency,
           status, claimed_license_id, paid_at
    FROM license_paid_sessions
    WHERE session_id = ?
  `).bind(sessionId).first();
}

export async function recordPaidCheckoutEvent(db, input) {
  const now = new Date().toISOString();
  await db.batch([
    db.prepare(`
      INSERT OR IGNORE INTO license_stripe_events (
        event_id, event_type, session_id, livemode, status, received_at
      ) VALUES (?, ?, ?, ?, 'processed', ?)
    `).bind(input.eventId, input.eventType, input.sessionId, input.livemode ? 1 : 0, now),
    db.prepare(`
      INSERT OR IGNORE INTO license_paid_sessions (
        session_id, stripe_event_id, livemode, payment_link_id,
        payment_intent_id, customer_id, email_hash, email_masked,
        amount_total, currency, status, paid_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?, ?)
    `).bind(
      input.sessionId,
      input.eventId,
      input.livemode ? 1 : 0,
      input.paymentLinkId,
      input.paymentIntentId || null,
      input.customerId || null,
      input.emailHash,
      input.emailMasked,
      input.amountTotal,
      input.currency,
      input.paidAt,
      now,
      now
    )
  ]);
  const stored = await findPaidSession(db, input.sessionId);
  if (
    !stored
    || stored.email_hash !== input.emailHash
    || stored.payment_link_id !== input.paymentLinkId
    || Number(stored.amount_total) !== Number(input.amountTotal)
    || stored.currency !== input.currency
  ) {
    throw new LicenseError("paid_session_conflict", 409, "Purchase reconciliation failed");
  }
  return stored;
}

export async function recordIgnoredStripeEvent(db, input) {
  const eventType = String(input.eventType || "unknown").slice(0, 120);
  await db.prepare(`
    INSERT OR IGNORE INTO license_stripe_events (
      event_id, event_type, session_id, livemode, status, received_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    input.eventId,
    eventType.length >= 3 ? eventType : "unknown",
    input.sessionId || null,
    input.livemode ? 1 : 0,
    input.pending ? "pending" : "ignored",
    new Date().toISOString()
  ).run();
}

export async function markPaidSessionClaimed(db, sessionId, licenseId) {
  const result = await db.prepare(`
    UPDATE license_paid_sessions
    SET claimed_license_id = COALESCE(claimed_license_id, ?), updated_at = ?
    WHERE session_id = ? AND status = 'paid'
      AND (claimed_license_id IS NULL OR claimed_license_id = ?)
  `).bind(licenseId, new Date().toISOString(), sessionId, licenseId).run();
  if (Number(result?.meta?.changes || 0) !== 1) {
    throw new LicenseError("paid_session_claim_conflict", 409, "Purchase reconciliation failed");
  }
}

export async function createLicense(db, input) {
  const now = input.now || new Date().toISOString();
  const id = input.id || crypto.randomUUID();
  const limit = input.machineLimit;
  const statements = [
    db.prepare(`
      INSERT INTO license_entitlements (
        id, key_hash, email_hash, stripe_checkout_session_id,
        stripe_payment_intent_id, stripe_customer_id, stripe_payment_link_id,
        stripe_price_id, stripe_product_id, status, entitlement, source,
        machine_limit, license_version, created_at, updated_at, migrated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'lifetime', ?, ?, 1, ?, ?, ?)
    `).bind(
      id,
      input.keyHash,
      input.emailHash,
      input.stripeCheckoutSessionId || null,
      input.stripePaymentIntentId || null,
      input.stripeCustomerId || null,
      input.stripePaymentLinkId || null,
      input.stripePriceId || null,
      input.stripeProductId || null,
      input.source,
      limit,
      now,
      now,
      input.source === "stripe" ? null : now
    )
  ];
  for (let slot = 1; slot <= limit; slot += 1) {
    statements.push(db.prepare(`
      INSERT INTO license_machine_slots (license_id, slot_index)
      VALUES (?, ?)
    `).bind(id, slot));
  }
  statements.push(db.prepare(`
    INSERT INTO license_events (
      id, license_id, event_type, outcome, email_hash, key_hash,
      request_id, details_json, created_at
    ) VALUES (?, ?, ?, 'accepted', ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    id,
    input.source === "stripe" ? "stripe_license_claimed" : "legacy_license_migrated",
    input.emailHash,
    input.keyHash,
    input.requestId || null,
    JSON.stringify({ source: input.source, seedId: input.seedId || null }),
    now
  ));
  await db.batch(statements);
  return {
    id,
    key_hash: input.keyHash,
    email_hash: input.emailHash,
    status: "active",
    entitlement: "lifetime",
    source: input.source,
    machine_limit: limit,
    license_version: 1
  };
}

export async function claimMachineSlot(db, input) {
  const now = input.now || new Date().toISOString();
  const findExisting = () => db.prepare(`
      SELECT slot_index FROM license_machine_slots
      WHERE license_id = ? AND machine_hash = ?
    `).bind(input.licenseId, input.machineHash).first();
  const reuseExisting = async (existing) => {
    await db.prepare(`
      UPDATE license_machine_slots
      SET last_activated_at = ?, last_app_version = ?
      WHERE license_id = ? AND machine_hash = ?
    `).bind(now, input.appVersion, input.licenseId, input.machineHash).run();
    return { slotIndex: Number(existing.slot_index), reused: true };
  };

  const existing = await findExisting();
  if (existing) {
    return reuseExisting(existing);
  }

  for (let attempt = 0; attempt < input.machineLimit; attempt += 1) {
    const open = await db.prepare(`
      SELECT slot_index FROM license_machine_slots
      WHERE license_id = ? AND machine_hash IS NULL
      ORDER BY slot_index ASC LIMIT 1
    `).bind(input.licenseId).first();
    if (!open) throw new LicenseError("machine_limit_reached", 409, "This licence has reached its machine limit");
    let result;
    try {
      result = await db.prepare(`
        UPDATE license_machine_slots
        SET machine_hash = ?, first_activated_at = ?, last_activated_at = ?, last_app_version = ?
        WHERE license_id = ? AND slot_index = ? AND machine_hash IS NULL
      `).bind(
        input.machineHash,
        now,
        now,
        input.appVersion,
        input.licenseId,
        Number(open.slot_index)
      ).run();
    } catch (error) {
      // A concurrent activation of the same machine can win the UNIQUE
      // constraint between our initial read and slot update. Treat that as
      // an idempotent refresh instead of exposing a transient 500.
      const concurrentlyClaimed = await findExisting();
      if (concurrentlyClaimed) return reuseExisting(concurrentlyClaimed);
      throw error;
    }
    if (Number(result?.meta?.changes || 0) === 1) return { slotIndex: Number(open.slot_index), reused: false };

    // Another request won the conditional update. Re-read before selecting a
    // different slot so the same machine can never consume multiple slots.
    const concurrentlyClaimed = await findExisting();
    if (concurrentlyClaimed) return reuseExisting(concurrentlyClaimed);
  }
  throw new LicenseError("machine_slot_race", 409, "Please retry activation");
}

export async function recordLicenseEvent(db, input) {
  const safeDetails = JSON.stringify(input.details || {});
  await db.prepare(`
    INSERT INTO license_events (
      id, license_id, event_type, outcome, email_hash, key_hash,
      machine_hash, request_id, details_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    input.licenseId || null,
    input.eventType,
    input.outcome,
    input.emailHash || null,
    input.keyHash || null,
    input.machineHash || null,
    input.requestId || null,
    safeDetails.length <= 4096 ? safeDetails : "{\"truncated\":true}",
    input.now || new Date().toISOString()
  ).run();
}

export async function readBoundedBytes(request, maximumBytes = 16_384) {
  const declared = Number(request.headers.get("Content-Length") || 0);
  if (declared > maximumBytes) throw new LicenseError("payload_too_large", 413, "Request is too large");
  if (!request.body) throw new LicenseError("request_body_missing", 400, "Bad request");
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maximumBytes) {
        await reader.cancel();
        throw new LicenseError("payload_too_large", 413, "Request is too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

export async function readBoundedJson(request, maximumBytes = 16_384) {
  const merged = await readBoundedBytes(request, maximumBytes);
  try {
    return JSON.parse(new TextDecoder().decode(merged));
  } catch {
    throw new LicenseError("request_json_invalid", 400, "Bad request");
  }
}

export function legacyRollbackToken(payload) {
  return base64EncodeUnicode(JSON.stringify(payload));
}

export function licenseJson(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...licenseCorsHeaders(),
      "Cache-Control": "no-store",
      "Cloudflare-CDN-Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

export function licenseCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}

export function maskEmail(email) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  return `${local.slice(0, 1)}***@${domain}`;
}

export function safeRequestId(request) {
  const value = String(request.headers.get("CF-Ray") || crypto.randomUUID()).trim();
  return value.slice(0, 120);
}

function csvSet(value, requiredPrefix) {
  const output = new Set();
  for (const entry of String(value || "").split(",")) {
    const normalized = entry.trim();
    if (!normalized) continue;
    if (!normalized.startsWith(requiredPrefix) || !/^[A-Za-z0-9_]+$/.test(normalized)) {
      throw new LicenseError("checkout_allowlist_invalid", 503, "Licence creation is temporarily unavailable");
    }
    output.add(normalized);
  }
  return output;
}

function stripeObjectId(value) {
  if (typeof value === "string") return value;
  return value && typeof value.id === "string" ? value.id : null;
}

function stripeEventTime(value) {
  const seconds = Number(value);
  if (!Number.isSafeInteger(seconds) || seconds < 1_500_000_000 || seconds > 4_102_444_800) {
    throw new LicenseError("stripe_event_time_invalid", 400, "Invalid Stripe event");
  }
  return new Date(seconds * 1000).toISOString();
}

function hexDecode(value) {
  if (!/^[0-9a-fA-F]{64}$/.test(String(value || ""))) return null;
  const output = new Uint8Array(32);
  for (let index = 0; index < output.length; index += 1) {
    output[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return output;
}

function boundedInteger(value, fallback, minimum, maximum) {
  if (value === undefined || value === null || String(value).trim() === "") return fallback;
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < minimum || number > maximum) {
    throw new LicenseError("license_integer_config_invalid", 503, "Activation is temporarily unavailable");
  }
  return number;
}

function optionalInteger(value, minimum, maximum) {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  return boundedInteger(value, minimum, minimum, maximum);
}

function base32Encode(bytes) {
  let output = "";
  let buffer = 0;
  let bitCount = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bitCount += 8;
    while (bitCount >= 5) {
      bitCount -= 5;
      output += BASE32_ALPHABET[(buffer >>> bitCount) & 31];
      buffer &= (1 << bitCount) - 1;
    }
  }
  if (bitCount > 0) output += BASE32_ALPHABET[(buffer << (5 - bitCount)) & 31];
  return output;
}

function base64UrlEncode(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  try {
    const binary = atob(padded);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

function isBase64UrlBytes(value, expectedLength) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return false;
  return base64UrlDecode(value)?.byteLength === expectedLength;
}

function base64EncodeUnicode(value) {
  const bytes = TEXT_ENCODER.encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
