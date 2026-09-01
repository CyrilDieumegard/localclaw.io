import {
  LicenseError,
  activationMode,
  claimMachineSlot,
  classifyLegacyMigration,
  createLicense,
  findLicense,
  hashLicenseIdentity,
  isAcceptedLicenseKey,
  isValidEmail,
  isVersionAllowed,
  issueLicenseReceipt,
  legacyRollbackToken,
  licenseCorsHeaders,
  licenseJson,
  machineLimit,
  minimumAppVersion,
  normalizeAppVersion,
  normalizeEmail,
  normalizeLicenseKey,
  normalizeMachineId,
  parseSigningIdentity,
  readBoundedJson,
  recordLicenseEvent,
  safeRequestId
} from "../../../_lib/license.js";

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: licenseCorsHeaders() });
}

export async function onRequestPost(context) {
  const requestId = safeRequestId(context.request);
  let emailHash = null;
  let keyHash = null;
  let machineHash = null;
  try {
    const body = await readBoundedJson(context.request);
    const email = normalizeEmail(body?.email);
    const licenseKey = normalizeLicenseKey(body?.licenseKey);
    const machineId = normalizeMachineId(body?.machineId);
    const appVersion = normalizeAppVersion(body?.appVersion);
    if (
      !isValidEmail(email)
      || !isAcceptedLicenseKey(licenseKey)
      || machineId.length < 3 || machineId.length > 512
      || !appVersion
      || (body?.currentReceipt !== undefined && typeof body.currentReceipt !== "string")
      || String(body?.currentReceipt || "").length > 16_384
    ) {
      throw new LicenseError("invalid_license_request", 403, "Invalid licence");
    }

    const minVersion = minimumAppVersion(context.env);
    if (!isVersionAllowed(appVersion, minVersion)) {
      throw new LicenseError("app_update_required", 403, `Please update to ${minVersion} or later`);
    }

    [emailHash, keyHash, machineHash] = await Promise.all([
      hashLicenseIdentity("email", email),
      hashLicenseIdentity("key", licenseKey),
      hashLicenseIdentity("machine", machineId)
    ]);

    const mode = activationMode(context.env);
    const signer = parseSigningIdentity(context.env);
    const db = context.env?.LOCALCLAW_DB;
    const unsignedRollback = mode === "legacy"
      && !signer
      && String(context.env?.LICENSE_ALLOW_UNSIGNED_ROLLBACK || "false").trim().toLowerCase() === "true";
    if (unsignedRollback) {
      // Emergency rollback only. This is deliberately evaluated before any D1
      // migration, so disabling the flag restores signer-only issuance.
      const token = legacyRollbackToken({
        email,
        licenseKey,
        machineId,
        appVersion,
        activatedAt: new Date().toISOString(),
        product: "localclaw",
        customerId: null
      });
      return licenseJson({
        ok: true,
        mode: "legacy_rollback",
        token,
        receipt: null,
        receiptFormat: "legacy-base64",
        expiresAt: null,
        message: "Activated"
      });
    }
    if (!signer) throw new LicenseError("license_signer_missing", 503, "Activation is temporarily unavailable");
    if (!db) throw new LicenseError("license_database_missing", 503, "Activation is temporarily unavailable");
    let license = await findLicense(db, keyHash, emailHash);

    if (!license) {
      const migration = await classifyLegacyMigration(context.env, {
        emailHash,
        keyHash,
        licenseKey,
        appVersion
      });
      if (!migration.allowed) {
        // Unknown caller-controlled identities are intentionally not persisted:
        // a request flood must not be able to fill the licence database.
        throw new LicenseError("license_not_found", 403, "Invalid licence");
      }

      try {
        license = await createLicense(db, {
          keyHash,
          emailHash,
          source: migration.source,
          seedId: migration.seedId,
          machineLimit: machineLimit(context.env),
          requestId
        });
      } catch (error) {
        // A concurrent request may have completed the same one-time migration.
        license = await findLicense(db, keyHash, emailHash);
        if (!license) throw error;
      }
    }

    if (license) {
      if (license.status !== "active") {
        throw new LicenseError("license_revoked", 403, "This licence has been revoked");
      }
      const slot = await claimMachineSlot(db, {
        licenseId: license.id,
        machineHash,
        appVersion,
        machineLimit: Number(license.machine_limit)
      });
      const signed = await issueLicenseReceipt(context.env, {
        license,
        machineHash,
        emailHash,
        keyHash,
        appVersion
      });
      await recordLicenseEvent(db, {
        licenseId: license.id,
        eventType: slot.reused ? "receipt_refreshed" : "machine_activated",
        outcome: "accepted",
        emailHash,
        keyHash,
        machineHash,
        requestId,
        details: { mode, slotIndex: slot.slotIndex, kid: signer.kid }
      });

      return licenseJson({
        ok: true,
        mode: "secure",
        token: signed.receipt,
        receipt: signed.receipt,
        receiptFormat: "JWS-Compact",
        expiresAt: signed.expiresAt,
        license: {
          id: license.id,
          status: "active",
          entitlement: "lifetime",
          machineLimit: Number(license.machine_limit)
        },
        message: "Activated"
      });
    }

    throw new LicenseError("license_resolution_failed", 500, "Activation failed");
  } catch (error) {
    const known = error instanceof LicenseError;
    const code = known ? error.code : "license_activation_failed";
    console.error(JSON.stringify({ message: "license_activation_failed", code, requestId }));
    return licenseJson({
      ok: false,
      error: code,
      message: known ? error.publicMessage : "Activation failed",
      requestId
    }, known ? error.status : 500);
  }
}
