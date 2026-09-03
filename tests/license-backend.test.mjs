import assert from "node:assert/strict";
import { createHmac, webcrypto } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
  LICENSE_AUDIENCE,
  LICENSE_RECEIPT_SCHEMA,
  LICENSE_RECEIPT_TYPE,
  classifyLegacyMigration,
  claimMachineSlot,
  deriveStripeLicenseKey,
  issueLicenseReceipt,
  validateLicenseStripeEvent,
  verifyLicenseStripeWebhook
} from "../functions/_lib/license.js";
import { onRequestPost as legacyActivate } from "../functions/api/license/activate.js";
import { onRequestPost as activate } from "../functions/api/license/v2/activate.js";
import { onRequestPost as claim } from "../functions/api/license/claim.js";

const ROOT = resolve(import.meta.dirname, "..");
const PAYMENT_LINK_ID = "plink_1T3ImGAXaNRwBAW19ocAoU9I";
const PREVIOUS_PAYMENT_LINK_ID = "plink_1UAq6UEIFWJOEDDQmgnQIgbY";
const BASE_ENV = Object.freeze({
  STRIPE_EXPECTED_LIVEMODE: "true",
  LICENSE_STRIPE_PAYMENT_LINK_IDS: `${PAYMENT_LINK_ID},${PREVIOUS_PAYMENT_LINK_ID}`,
  LICENSE_STRIPE_PRICE_IDS: "price_1T3IkfAXaNRwBAW1XeiKJ1zA,price_1UAq6HEIFWJOEDDQjebzVAcC",
  LICENSE_STRIPE_PRODUCT_IDS: "prod_U1LRtFz1PdO0Ix,prod_VBCVDxuRbxVHmT",
  LICENSE_STRIPE_AMOUNT_CENTS: "4900",
  LICENSE_STRIPE_CURRENCY: "usd",
  LICENSE_MACHINE_LIMIT: "3",
  LICENSE_MIN_APP_VERSION: "1.0.201",
  LICENSE_RECEIPT_TTL_SECONDS: String(180 * 24 * 60 * 60)
});

test("v2 never upgrades public-history legacy material into a signed entitlement", async () => {
  assert.deepEqual(await classifyLegacyMigration({ LICENSE_ACTIVATION_MODE: "enforce" }, {
    emailHash: "historical-public-email-hash",
    keyHash: "historical-public-key-hash",
    licenseKey: "redacted",
    appVersion: "1.0.201"
  }), { allowed: false, reason: "legacy_not_seeded" });

  const source = readFileSync(join(ROOT, "functions/_lib/license.js"), "utf8");
  const legacySource = readFileSync(join(ROOT, "functions/api/license/activate.js"), "utf8");
  const testSource = readFileSync(join(ROOT, "tests/license-backend.test.mjs"), "utf8");
  assert.doesNotMatch(source, /LEGACY_SEEDS|source:\s*"legacy_seed"/);
  const historicalPlaintextPattern = /(?:\b\d{11}@\d+\.[a-z]+\b|\bLCW-\d{8}-\d{4}-\d{4}\b)/i;
  assert.doesNotMatch(source, historicalPlaintextPattern);
  assert.doesNotMatch(legacySource, historicalPlaintextPattern);
  assert.doesNotMatch(testSource, historicalPlaintextPattern);
});

test("historical activation route preserves the unsigned 1.0.201 contract without D1", async () => {
  const request = new Request("https://localclaw.io/api/license/activate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "legacy-compat@example.test",
      licenseKey: "LCW-20260831-ABCD-EF12",
      machineId: "legacy-mac",
      appVersion: "1.0.201"
    })
  });
  const response = await legacyActivate({ request, env: {} });
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(typeof payload.token, "string");
  assert.ok(payload.token.length > 10);
  assert.equal(payload.receipt, undefined);

  const newFormatRequest = new Request("https://localclaw.io/api/license/activate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "legacy-compat@example.test",
      licenseKey: "LOCALCLAW-AAAA-BBBB-CCCC-DDDD-EEEE-FFFF",
      machineId: "legacy-mac",
      appVersion: "1.0.201"
    })
  });
  const newFormatResponse = await legacyActivate({ request: newFormatRequest, env: {} });
  assert.equal(newFormatResponse.status, 403);
});

test("unverified legacy keys never become signed lifetime entitlements", async () => {
  const rejected = await classifyLegacyMigration({ LICENSE_ACTIVATION_MODE: "parallel" }, {
    emailHash: "different-email",
    keyHash: "different-key",
    licenseKey: "LCW-20260831-ABCD-EF12",
    appVersion: "1.0.201",
    nowMs: Date.parse("2026-09-02T00:00:00Z")
  });
  assert.deepEqual(rejected, { allowed: false, reason: "legacy_not_seeded" });

  const rollbackMode = await classifyLegacyMigration({ LICENSE_ACTIVATION_MODE: "legacy" }, {
    emailHash: "different-email",
    keyHash: "different-key",
    licenseKey: "LOCALCLAW-AAAA-BBBB-CCCC",
    appVersion: "1.0.201",
    nowMs: Date.parse("2026-09-02T00:00:00Z")
  });
  assert.deepEqual(rollbackMode, { allowed: false, reason: "legacy_not_seeded" });
});

test("Stripe licence key derivation is deterministic, secret-backed, and 120-bit format", async () => {
  const env = { LICENSE_KEY_DERIVATION_SECRET: "test-only-derivation-secret-with-more-than-32-bytes" };
  const first = await deriveStripeLicenseKey(env, "cs_live_abcdefghijklmnopqrstuvwxyz123456");
  const second = await deriveStripeLicenseKey(env, "cs_live_abcdefghijklmnopqrstuvwxyz123456");
  const other = await deriveStripeLicenseKey(env, "cs_live_abcdefghijklmnopqrstuvwxyz123457");
  assert.equal(first, second);
  assert.notEqual(first, other);
  assert.match(first, /^LOCALCLAW-(?:[A-Z2-9]{4}-){5}[A-Z2-9]{4}$/);
});

test("JWS contract signs Ed25519 with exact audience, kid, claims, and 180-day expiry", async () => {
  const pair = await webcrypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const privateJwk = await webcrypto.subtle.exportKey("jwk", pair.privateKey);
  const publicJwk = await webcrypto.subtle.exportKey("jwk", pair.publicKey);
  const nowMs = Date.parse("2026-09-01T12:00:00Z");
  const env = {
    ...BASE_ENV,
    LICENSE_SIGNING_KID: "fixture-license-key-2026-09-01",
    LICENSE_SIGNING_PRIVATE_JWK: JSON.stringify(privateJwk)
  };
  const signed = await issueLicenseReceipt(env, {
    nowMs,
    license: {
      id: "11111111-2222-4333-8444-555555555555",
      license_version: 2,
      source: "stripe"
    },
    machineHash: "machine-hash",
    emailHash: "email-hash",
    keyHash: "key-hash",
    appVersion: "1.0.202"
  });
  const [headerPart, payloadPart, signaturePart] = signed.receipt.split(".");
  const header = decodeJsonSegment(headerPart);
  const payload = decodeJsonSegment(payloadPart);
  assert.deepEqual(header, {
    alg: "EdDSA",
    typ: LICENSE_RECEIPT_TYPE,
    kid: "fixture-license-key-2026-09-01"
  });
  assert.equal(payload.iss, "https://localclaw.io");
  assert.equal(payload.aud, LICENSE_AUDIENCE);
  assert.equal(payload.aud, "io.localclaw.installer");
  assert.equal(payload.schema, LICENSE_RECEIPT_SCHEMA);
  assert.equal(payload.entitlement, "lifetime");
  assert.equal(payload.entitlement_expires_at, null);
  assert.equal(payload.app_version, "1.0.202");
  assert.equal(payload.min_app_version, "1.0.201");
  assert.equal(payload.exp - payload.iat, 180 * 24 * 60 * 60);
  assert.deepEqual(Object.keys(payload), [
    "iss", "aud", "schema", "jti", "sub", "iat", "nbf", "exp",
    "license_id", "license_version", "product", "entitlement",
    "entitlement_expires_at", "status", "source", "machine_hash",
    "email_hash", "key_hash", "app_version", "min_app_version"
  ]);
  const verifyKey = await webcrypto.subtle.importKey("jwk", publicJwk, { name: "Ed25519" }, false, ["verify"]);
  assert.equal(await webcrypto.subtle.verify(
    "Ed25519",
    verifyKey,
    Buffer.from(signaturePart, "base64url"),
    Buffer.from(`${headerPart}.${payloadPart}`)
  ), true);
});

test("dedicated Stripe webhook signature accepts current payload and rejects tampering", async () => {
  const secret = "whsec_fixture0123456789abcdefghijklmnopqrstuvwxyz";
  const raw = Buffer.from(JSON.stringify({ id: "evt_fixture12345678", object: "event" }));
  const timestamp = Math.floor(Date.parse("2026-09-01T12:00:00Z") / 1000);
  const digest = createHmac("sha256", secret).update(`${timestamp}.`).update(raw).digest("hex");
  assert.equal(await verifyLicenseStripeWebhook(
    { LOCALCLAW_STRIPE_WEBHOOK_SECRET: secret },
    `t=${timestamp},v1=${digest}`,
    raw,
    timestamp * 1000
  ), true);
  await assert.rejects(() => verifyLicenseStripeWebhook(
    { LOCALCLAW_STRIPE_WEBHOOK_SECRET: secret },
    `t=${timestamp},v1=${digest}`,
    Buffer.from(`${raw}x`),
    timestamp * 1000
  ), /stripe_signature_invalid/);
});

test("Stripe webhook migration accepts either the primary or secondary signing secret", async () => {
  const primary = "whsec_primary0123456789abcdefghijklmnopqrstuvwxyz";
  const secondary = "whsec_secondary0123456789abcdefghijklmnopqrstuvwxyz";
  const raw = Buffer.from(JSON.stringify({ id: "evt_migration12345678", object: "event" }));
  const timestamp = Math.floor(Date.parse("2026-09-03T16:00:00Z") / 1000);
  const env = {
    LOCALCLAW_STRIPE_WEBHOOK_SECRET: primary,
    LOCALCLAW_STRIPE_WEBHOOK_SECRET_SECONDARY: secondary
  };

  for (const secret of [primary, secondary]) {
    const digest = createHmac("sha256", secret).update(`${timestamp}.`).update(raw).digest("hex");
    assert.equal(await verifyLicenseStripeWebhook(
      env,
      `t=${timestamp},v1=${digest}`,
      raw,
      timestamp * 1000
    ), true);
  }
});

test("signed async Checkout events remain pending until paid and never authorize a claim", () => {
  const pendingEvent = checkoutEvent({
    id: "evt_pending12345678",
    type: "checkout.session.completed",
    paymentStatus: "unpaid"
  });
  const pending = validateLicenseStripeEvent(BASE_ENV, pendingEvent);
  assert.equal(pending.pending, true);
  assert.equal(pending.ignored, true);
  assert.equal(pending.sessionId, pendingEvent.data.object.id);

  const paidEvent = checkoutEvent({
    id: "evt_paid1234567890",
    type: "checkout.session.async_payment_succeeded",
    paymentStatus: "paid"
  });
  const paid = validateLicenseStripeEvent(BASE_ENV, paidEvent);
  assert.equal(paid.pending, undefined);
  assert.equal(paid.ignored, false);
  assert.equal(paid.amountTotal, 4900);
  assert.equal(paid.currency, "usd");

  const alreadyCompletedPreviousAccountEvent = checkoutEvent({
    id: "evt_previous12345678",
    type: "checkout.session.completed",
    paymentStatus: "paid",
    paymentLink: PREVIOUS_PAYMENT_LINK_ID
  });
  const acceptedPreviousAccountEvent = validateLicenseStripeEvent(BASE_ENV, alreadyCompletedPreviousAccountEvent);
  assert.equal(acceptedPreviousAccountEvent.ignored, false);
  assert.equal(acceptedPreviousAccountEvent.sessionId, alreadyCompletedPreviousAccountEvent.data.object.id);

  const wrongLink = checkoutEvent({
    id: "evt_other123456789",
    type: "checkout.session.completed",
    paymentStatus: "paid",
    paymentLink: "plink_other123456789"
  });
  const ignoredForeignLink = validateLicenseStripeEvent(BASE_ENV, wrongLink);
  assert.equal(ignoredForeignLink.ignored, true);
  assert.equal(ignoredForeignLink.sessionId, null);

  const wrongAmount = checkoutEvent({
    id: "evt_amount12345678",
    type: "checkout.session.completed",
    paymentStatus: "paid",
    amount: 100
  });
  assert.throws(() => validateLicenseStripeEvent(BASE_ENV, wrongAmount), /checkout_amount_mismatch/);
});

test("claim returns 202 while the verified paid-session webhook is still pending", async () => {
  const db = {
    prepare() {
      return {
        bind() {
          return { async first() { return null; } };
        }
      };
    }
  };
  const response = await claim({
    request: new Request("https://localclaw.io/api/license/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: "cs_live_abcdefghijklmnopqrstuvwxyz123456" })
    }),
    env: { LOCALCLAW_DB: db }
  });
  assert.equal(response.status, 202);
  assert.equal(response.headers.get("Retry-After"), "2");
  assert.equal((await response.json()).pending, true);
});

test("concurrent activation of one machine reuses the winning slot", async () => {
  const slots = [
    { slot_index: 1, machine_hash: null },
    { slot_index: 2, machine_hash: null },
    { slot_index: 3, machine_hash: null }
  ];
  let injectedRace = false;
  const db = fakeMachineSlotDb(slots, () => {
    if (!injectedRace) {
      injectedRace = true;
      slots[0].machine_hash = "machine-hash";
    }
  });
  const result = await claimMachineSlot(db, {
    licenseId: "license-id",
    machineHash: "machine-hash",
    appVersion: "1.0.201",
    machineLimit: 3,
    now: "2026-09-01T12:00:00.000Z"
  });
  assert.deepEqual(result, { slotIndex: 1, reused: true });
  assert.equal(slots.filter((slot) => slot.machine_hash === "machine-hash").length, 1);
  assert.equal(slots[1].machine_hash, null);
});

test("unsigned activation exists only behind the explicit legacy rollback gate", async () => {
  const requestBody = {
    email: "customer@example.com",
    licenseKey: "LCW-20260831-ABCD-EF12",
    machineId: "machine-stable-id",
    appVersion: "1.0.201"
  };
  const denied = await activate({
    request: jsonRequest("/api/license/v2/activate", requestBody),
    env: {
      ...BASE_ENV,
      LICENSE_ACTIVATION_MODE: "legacy",
      LICENSE_ALLOW_UNSIGNED_ROLLBACK: "false"
    }
  });
  assert.equal(denied.status, 503);

  const allowed = await activate({
    request: jsonRequest("/api/license/v2/activate", requestBody),
    env: {
      ...BASE_ENV,
      LICENSE_ACTIVATION_MODE: "legacy",
      LICENSE_ALLOW_UNSIGNED_ROLLBACK: "true"
    }
  });
  const payload = await allowed.json();
  assert.equal(allowed.status, 200);
  assert.equal(payload.mode, "legacy_rollback");
  assert.equal(payload.receipt, null);
  assert.equal(payload.receiptFormat, "legacy-base64");
  assert.equal(JSON.parse(Buffer.from(payload.token, "base64").toString()).machineId, "machine-stable-id");
});

test("D1 migration is idempotent and revocation requires a version increment", () => {
  const directory = mkdtempSync(join(tmpdir(), "localclaw-license-db-"));
  const database = join(directory, "license.sqlite");
  const migration = readFileSync(join(ROOT, "migrations/0008_license_activation.sql"), "utf8");
  try {
    for (let run = 0; run < 2; run += 1) {
      const result = spawnSync("sqlite3", [database], { input: migration, encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr);
    }
    const tables = sqlite(database, "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
    for (const name of ["license_entitlements", "license_events", "license_machine_slots", "license_paid_sessions", "license_stripe_events"]) {
      assert.match(tables, new RegExp(`(?:^|\\n)${name}(?:$|\\n)`));
    }
    sqlite(database, `
      INSERT INTO license_stripe_events (
        event_id,event_type,session_id,livemode,status,received_at
      ) VALUES ('evt_pending','checkout.session.completed','cs_pending',1,'pending','now');
    `);
    assert.equal(sqlite(database, "SELECT status FROM license_stripe_events WHERE event_id='evt_pending';").trim(), "pending");
    sqlite(database, `
      INSERT INTO license_entitlements (
        id,key_hash,email_hash,status,entitlement,source,machine_limit,license_version,created_at,updated_at
      ) VALUES ('lic','key','email','active','lifetime','stripe',3,1,'now','now');
    `);
    const rejected = spawnSync("sqlite3", [database, "UPDATE license_entitlements SET status='revoked', revoked_at='now' WHERE id='lic';"], { encoding: "utf8" });
    assert.notEqual(rejected.status, 0);
    sqlite(database, "UPDATE license_entitlements SET status='revoked', revoked_at='now', license_version=2 WHERE id='lic';");
    assert.equal(sqlite(database, "SELECT status || ':' || license_version FROM license_entitlements WHERE id='lic';").trim(), "revoked:2");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("secure success route claims server-side while the historical success page stays intact", () => {
  const success = readFileSync(join(ROOT, "license-success.html"), "utf8");
  const historicalSuccess = readFileSync(join(ROOT, "success.html"), "utf8");
  assert.match(success, /fetch\('\/api\/license\/claim'/);
  assert.match(success, /<meta name="referrer" content="no-referrer">/);
  assert.match(success, /sessionStorage\.setItem\(storageKey, urlSessionId\)/);
  assert.match(success, /sessionStorage\.removeItem\(storageKey\)/);
  assert.match(success, /history\.replaceState\(\{\}, '', '\/license-success'\)/);
  assert.match(success, /\/css\/site-tailwind-[^"]+\.css/);
  assert.match(success, /testOnProduction/);
  assert.doesNotMatch(success, /LC-2026-prod-key-salt|derive license key|crypto\.subtle\.sign\('HMAC'/i);
  assert.doesNotMatch(success, /query:\s*location\.search|sessionPreview/);
  assert.doesNotMatch(success, /datafa\.st|clarity\.js|fonts\.googleapis\.com|fonts\.gstatic\.com/i);
  assert.doesNotMatch(success, /https:\/\//i);
  assert.doesNotMatch(historicalSuccess, /fetch\('\/api\/license\/claim'/);
  assert.match(historicalSuccess, /Payment confirmed — LocalClaw Installer/);
  assert.ok(
    success.indexOf("history.replaceState({}, '', '/license-success')") < success.indexOf('/js/site-nav.js'),
    "checkout bearer must be scrubbed before loading any later script"
  );
  const middleware = readFileSync(join(ROOT, "functions/_middleware.js"), "utf8");
  assert.match(middleware, /"\/success"/);
  assert.match(middleware, /"\/license-success"/);
  const headers = readFileSync(join(ROOT, "_headers"), "utf8");
  assert.match(headers, /\/license-success[\s\S]*Cache-Control: no-store[\s\S]*Content-Security-Policy:/);
  const claimSource = readFileSync(join(ROOT, "functions/api/license/claim.js"), "utf8");
  assert.doesNotMatch(claimSource, /STRIPE_SECRET_KEY|stripeClient|functions\/_lib\/stripe/);
});

test("provisioning refuses implicit signing or derivation key rotation", () => {
  const source = readFileSync(join(ROOT, "scripts/provision-license-signing-key.mjs"), "utf8");
  assert.match(source, /--bootstrap-new-keyset/);
  assert.match(source, /--prepare-signing-rotation/);
  assert.match(source, /--provision-prepared-rotation/);
  assert.match(source, /Recover it from backup; refusing implicit key rotation/);
  assert.match(source, /Cloudflare already has a licence keyset/);
  assert.match(source, /assertCloudflareKeysetIsAbsent\(\)/);
  assert.match(source, /privateJwk\.x !== expectedRotationPublicX/);
  assert.match(source, /if \(!provisionRotation\) provisionCloudflare\(DERIVATION_SECRET_NAME/);
});

test("rotation preparation is idempotent, local-only, and requires the existing derivation secret", () => {
  const directory = mkdtempSync(join(tmpdir(), "localclaw-license-rotation-"));
  const bin = join(directory, "bin");
  const state = join(directory, "state");
  mkdirSync(bin);
  mkdirSync(state);
  const security = join(bin, "security");
  const swift = join(bin, "swift");
  writeFileSync(security, `#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const args = process.argv.slice(2);
const service = args[args.indexOf("-s") + 1];
const account = args[args.indexOf("-a") + 1];
const file = path.join(process.env.LICENSE_TEST_STATE_DIR, Buffer.from(service + "\\0" + account).toString("hex"));
if (!fs.existsSync(file)) process.exit(44);
process.stdout.write(fs.readFileSync(file));
`, { mode: 0o700 });
  writeFileSync(swift, `#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const args = process.argv.slice(2);
if (args[1] !== "set") process.exit(64);
const service = args[2];
const account = args[3];
const file = path.join(process.env.LICENSE_TEST_STATE_DIR, Buffer.from(service + "\\0" + account).toString("hex"));
const chunks = [];
process.stdin.on("data", chunk => chunks.push(chunk));
process.stdin.on("end", () => fs.writeFileSync(file, Buffer.concat(chunks)));
`, { mode: 0o700 });

  const rotationKid = "localclaw-license-rotation-fixture";
  const signingState = keychainFixturePath(state, "io.localclaw.license-signing", rotationKid);
  const derivationState = keychainFixturePath(state, "io.localclaw.license-derivation", "localclaw-license-v1");
  const derivationFixture = "test-only-existing-derivation-secret-32-bytes";
  const env = {
    ...process.env,
    PATH: `${bin}:${process.env.PATH}`,
    LICENSE_TEST_STATE_DIR: state,
    LICENSE_SIGNING_KID: rotationKid
  };
  delete env.LICENSE_EXPECTED_SIGNING_PUBLIC_X;

  try {
    const missingDerivation = runProvisioner(["--prepare-signing-rotation"], env);
    assert.equal(missingDerivation.status, 1);
    assert.match(missingDerivation.stderr, /existing derivation secret is unavailable/);
    assert.equal(existsSync(signingState), false);

    writeFileSync(derivationState, derivationFixture, { mode: 0o600 });
    const first = runProvisioner(["--prepare-signing-rotation"], env);
    assert.equal(first.status, 0, first.stderr);
    const firstPublic = JSON.parse(first.stdout);
    assert.equal(firstPublic.prepared, true);
    assert.equal(firstPublic.provisioned, false);
    assert.deepEqual(firstPublic.provisionedSecrets, []);
    assert.equal(firstPublic.kid, rotationKid);
    assert.equal(Buffer.from(firstPublic.x, "base64url").byteLength, 32);
    assert.equal(readFileSync(derivationState, "utf8"), derivationFixture);
    assert.equal(first.stdout.includes(derivationFixture), false);
    assert.equal(first.stderr.includes(derivationFixture), false);

    const storedSigningKey = JSON.parse(readFileSync(signingState, "utf8"));
    assert.equal(storedSigningKey.x, firstPublic.x);
    assert.equal(Buffer.from(storedSigningKey.d, "base64url").byteLength, 32);

    const second = runProvisioner(["--prepare-signing-rotation"], env);
    assert.equal(second.status, 0, second.stderr);
    assert.equal(JSON.parse(second.stdout).x, firstPublic.x);

    const missingProof = runProvisioner(["--provision-prepared-rotation"], env);
    assert.equal(missingProof.status, 1);
    assert.match(missingProof.stderr, /requires a valid LICENSE_EXPECTED_SIGNING_PUBLIC_X/);

    const wrongX = `${firstPublic.x[0] === "A" ? "B" : "A"}${firstPublic.x.slice(1)}`;
    const wrongProof = runProvisioner(["--provision-prepared-rotation"], {
      ...env,
      LICENSE_EXPECTED_SIGNING_PUBLIC_X: wrongX
    });
    assert.equal(wrongProof.status, 1);
    assert.match(wrongProof.stderr, /does not match LICENSE_EXPECTED_SIGNING_PUBLIC_X/);
    assert.equal(readFileSync(derivationState, "utf8"), derivationFixture);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

function runProvisioner(args, env) {
  return spawnSync(process.execPath, [join(ROOT, "scripts/provision-license-signing-key.mjs"), ...args], {
    cwd: ROOT,
    env,
    encoding: "utf8"
  });
}

function keychainFixturePath(state, service, account) {
  return join(state, Buffer.from(`${service}\u0000${account}`).toString("hex"));
}

function checkoutEvent({ id, type, paymentStatus, paymentLink = PAYMENT_LINK_ID, amount = 4900 }) {
  return {
    id,
    type,
    livemode: true,
    created: 1788264000,
    data: {
      object: {
        id: "cs_live_abcdefghijklmnopqrstuvwxyz123456",
        livemode: true,
        mode: "payment",
        status: "complete",
        payment_status: paymentStatus,
        payment_link: paymentLink,
        payment_intent: "pi_fixture123456789",
        customer: "cus_fixture123456789",
        customer_details: { email: "buyer@example.com" },
        amount_total: amount,
        currency: "usd"
      }
    }
  };
}

function decodeJsonSegment(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function jsonRequest(path, body) {
  return new Request(`https://localclaw.io${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

function sqlite(database, sql) {
  const result = spawnSync("sqlite3", [database, sql], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

function fakeMachineSlotDb(slots, beforeConditionalUpdate) {
  return {
    prepare(sql) {
      const normalized = sql.replace(/\s+/g, " ").trim();
      return {
        bind(...values) {
          if (normalized.startsWith("SELECT slot_index") && normalized.includes("machine_hash = ?")) {
            return {
              async first() {
                const found = slots.find((slot) => slot.machine_hash === values[1]);
                return found ? { slot_index: found.slot_index } : null;
              }
            };
          }
          if (normalized.startsWith("SELECT slot_index") && normalized.includes("machine_hash IS NULL")) {
            return {
              async first() {
                const found = slots.find((slot) => slot.machine_hash === null);
                return found ? { slot_index: found.slot_index } : null;
              }
            };
          }
          if (normalized.startsWith("UPDATE license_machine_slots") && normalized.includes("machine_hash IS NULL")) {
            return {
              async run() {
                beforeConditionalUpdate();
                const slot = slots.find((candidate) => candidate.slot_index === values[5]);
                if (!slot || slot.machine_hash !== null) return { meta: { changes: 0 } };
                slot.machine_hash = values[0];
                return { meta: { changes: 1 } };
              }
            };
          }
          if (normalized.startsWith("UPDATE license_machine_slots")) {
            return { async run() { return { meta: { changes: 1 } }; } };
          }
          throw new Error(`Unexpected SQL in fake D1: ${normalized}`);
        }
      };
    }
  };
}
