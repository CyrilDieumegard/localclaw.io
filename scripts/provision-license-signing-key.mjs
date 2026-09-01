#!/usr/bin/env node

import { webcrypto } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const SIGNING_SERVICE = "io.localclaw.license-signing";
const DERIVATION_SERVICE = "io.localclaw.license-derivation";
const DERIVATION_ACCOUNT = "localclaw-license-v1";
const PROJECT = "localclaw-io";
const SIGNING_SECRET_NAME = "LICENSE_SIGNING_PRIVATE_JWK";
const DERIVATION_SECRET_NAME = "LICENSE_KEY_DERIVATION_SECRET";
const DEFAULT_SIGNING_KID = "localclaw-license-2026-09-01";
const EXPECTED_PUBLIC_KEYS = Object.freeze({
  "localclaw-license-2026-09-01": "4gCEftrjJWeD6O8323OchqxmrzXoZvkJDFMFyuDd-3A"
});
const requestedKid = String(process.env.LICENSE_SIGNING_KID || "").trim();
const kid = requestedKid || DEFAULT_SIGNING_KID;
const expectedRotationPublicX = String(process.env.LICENSE_EXPECTED_SIGNING_PUBLIC_X || "").trim();
const printOnly = process.argv.includes("--print-public");
const bootstrap = process.argv.includes("--bootstrap-new-keyset");
const prepareRotation = process.argv.includes("--prepare-signing-rotation");
const provisionRotation = process.argv.includes("--provision-prepared-rotation");

if (process.platform !== "darwin") fail("This provisioning helper requires macOS Keychain.");
if (!/^[A-Za-z0-9._-]{8,80}$/.test(kid)) fail("LICENSE_SIGNING_KID is invalid.");
if ([printOnly, bootstrap, prepareRotation, provisionRotation].filter(Boolean).length > 1) {
  fail("Choose exactly one keyset operation.");
}
if ((prepareRotation || provisionRotation) && !requestedKid) {
  fail("Signing-key rotation requires an explicit LICENSE_SIGNING_KID.");
}
if ((prepareRotation || provisionRotation) && EXPECTED_PUBLIC_KEYS[kid]) {
  fail("Signing-key rotation requires a new kid, not the active production kid.");
}
if (expectedRotationPublicX && !provisionRotation) {
  fail("LICENSE_EXPECTED_SIGNING_PUBLIC_X is accepted only with --provision-prepared-rotation.");
}

let privateJwkText = readKeychain(SIGNING_SERVICE, kid);
let derivationSecret = readKeychain(DERIVATION_SERVICE, DERIVATION_ACCOUNT);
if (prepareRotation) {
  if (!isDerivationSecret(derivationSecret)) {
    fail("The existing derivation secret is unavailable. Recover it from backup; refusing rotation.");
  }
  if (!privateJwkText) {
    privateJwkText = await generatePrivateJwk();
    storeKeychain(SIGNING_SERVICE, kid, privateJwkText);
    if (readKeychain(SIGNING_SERVICE, kid) !== privateJwkText) {
      fail("Rotation signing-key verification failed; Cloudflare was not modified.");
    }
  }
} else if (!privateJwkText || !derivationSecret) {
  if (printOnly) fail(`No complete Keychain keyset exists for kid ${kid}.`);
  if (!bootstrap) {
    fail("The local licence keyset is incomplete. Recover it from backup; refusing implicit key rotation.");
  }
  if (privateJwkText || derivationSecret) {
    fail("A partial Keychain keyset exists. Recover the missing item; refusing to create a mismatched keyset.");
  }
  assertCloudflareKeysetIsAbsent();
  privateJwkText = await generatePrivateJwk();
  storeKeychain(SIGNING_SERVICE, kid, privateJwkText);
  derivationSecret = Buffer.from(webcrypto.getRandomValues(new Uint8Array(32))).toString("base64url");
  storeKeychain(DERIVATION_SERVICE, DERIVATION_ACCOUNT, derivationSecret);
  if (
    readKeychain(SIGNING_SERVICE, kid) !== privateJwkText
    || readKeychain(DERIVATION_SERVICE, DERIVATION_ACCOUNT) !== derivationSecret
  ) {
    fail("Keychain verification failed; Cloudflare was not modified.");
  }
}

const privateJwk = parsePrivateJwk(privateJwkText);
if (!isDerivationSecret(derivationSecret)) {
  fail("Stored derivation secret is invalid; refusing replacement.");
}
const pinnedPublicX = EXPECTED_PUBLIC_KEYS[kid] || "";
if (pinnedPublicX && privateJwk.x !== pinnedPublicX) {
  fail("The Keychain signing key does not match the embedded production trust root; refusing overwrite.");
}
if (provisionRotation) {
  if (!isBase64Url32(expectedRotationPublicX)) {
    fail("Prepared rotation provisioning requires a valid LICENSE_EXPECTED_SIGNING_PUBLIC_X.");
  }
  if (privateJwk.x !== expectedRotationPublicX) {
    fail("The prepared signing key does not match LICENSE_EXPECTED_SIGNING_PUBLIC_X; refusing overwrite.");
  }
}
if (!pinnedPublicX && !prepareRotation && !provisionRotation && !printOnly && !bootstrap) {
  fail("An unpinned signing kid requires --provision-prepared-rotation and an expected public x.");
}

if (!printOnly && !prepareRotation) {
  provisionCloudflare(SIGNING_SECRET_NAME, privateJwkText);
  if (!provisionRotation) provisionCloudflare(DERIVATION_SECRET_NAME, derivationSecret);
}

const publicJwk = {
  kid,
  kty: "OKP",
  crv: "Ed25519",
  x: privateJwk.x,
  use: "sig",
  alg: "EdDSA",
  status: "active"
};

// Deliberately print public material only. Never add privateJwkText to logs,
// exceptions, command arguments, environment variables, or stdout/stderr.
process.stdout.write(`${JSON.stringify({
  prepared: prepareRotation,
  provisioned: !printOnly && !prepareRotation,
  bootstrap,
  project: PROJECT,
  provisionedSecrets: !printOnly && !prepareRotation
    ? (provisionRotation ? [SIGNING_SECRET_NAME] : [SIGNING_SECRET_NAME, DERIVATION_SECRET_NAME])
    : [],
  keychain: {
    signing: { service: SIGNING_SERVICE, account: kid },
    derivation: { service: DERIVATION_SERVICE, account: DERIVATION_ACCOUNT }
  },
  kid,
  x: privateJwk.x,
  publicJwk
}, null, 2)}\n`);

function readKeychain(service, account) {
  const result = spawnSync("security", [
    "find-generic-password",
    "-s", service,
    "-a", account,
    "-w"
  ], { encoding: "utf8", maxBuffer: 64 * 1024 });
  if (result.status === 0) return String(result.stdout || "").trim();
  if (result.status === 44) return null;
  fail("Keychain lookup failed; refusing to generate a replacement key.");
}

async function generatePrivateJwk() {
  const pair = await webcrypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const jwk = await webcrypto.subtle.exportKey("jwk", pair.privateKey);
  const normalized = {
    key_ops: ["sign"],
    ext: true,
    crv: "Ed25519",
    d: jwk.d,
    x: jwk.x,
    kty: "OKP",
    alg: "EdDSA"
  };
  parsePrivateJwk(JSON.stringify(normalized));
  return JSON.stringify(normalized);
}

function storeKeychain(service, account, value) {
  // The `security` CLI's interactive `-w` prompt does not consume a piped
  // stdin reliably. A tiny Security.framework bridge keeps the JWK in memory
  // and accepts it over stdin; it never appears in argv or on disk.
  const bridge = resolve("scripts/keychain-secret-bridge.swift");
  const result = spawnSync("swift", [bridge, "set", service, account], {
    input: value,
    encoding: "utf8",
    maxBuffer: 64 * 1024
  });
  if (result.status !== 0) fail("Keychain write failed; Cloudflare was not modified.");
}

function provisionCloudflare(secretName, value) {
  const wrangler = resolve("node_modules/.bin/wrangler");
  if (!existsSync(wrangler)) fail("Wrangler is not installed locally. Run npm ci, then retry.");
  const result = spawnSync(wrangler, [
    "pages", "secret", "put", secretName,
    "--project-name", PROJECT
  ], {
    input: `${value}\n`,
    encoding: "utf8",
    stdio: ["pipe", "inherit", "inherit"]
  });
  if (result.status !== 0) fail("Cloudflare secret provisioning failed; the Keychain copy is preserved for a safe retry.");
}

function assertCloudflareKeysetIsAbsent() {
  const wrangler = resolve("node_modules/.bin/wrangler");
  if (!existsSync(wrangler)) fail("Wrangler is not installed locally. Run npm ci, then retry.");
  const result = spawnSync(wrangler, [
    "pages", "secret", "list",
    "--project-name", PROJECT
  ], {
    encoding: "utf8",
    maxBuffer: 256 * 1024
  });
  if (result.status !== 0) {
    fail("Could not prove that Cloudflare has no licence keyset; refusing bootstrap.");
  }
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  if (output.includes(SIGNING_SECRET_NAME) || output.includes(DERIVATION_SECRET_NAME)) {
    fail("Cloudflare already has a licence keyset. Recover the matching Keychain backup; refusing overwrite.");
  }
}

function isDerivationSecret(value) {
  return typeof value === "string" && value.length >= 32 && value.length <= 256;
}

function parsePrivateJwk(value) {
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    fail("Stored Keychain value is not valid JSON; refusing rotation.");
  }
  if (
    parsed?.kty !== "OKP" || parsed?.crv !== "Ed25519"
    || !isBase64Url32(parsed?.d) || !isBase64Url32(parsed?.x)
  ) {
    fail("Stored Keychain value is not a valid Ed25519 private JWK; refusing rotation.");
  }
  return parsed;
}

function isBase64Url32(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) return false;
  try {
    return Buffer.from(value, "base64url").byteLength === 32;
  } catch {
    return false;
  }
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
