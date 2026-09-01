import {
  LICENSE_KEYS_SCHEMA,
  LicenseError,
  licenseCorsHeaders,
  licenseJson,
  publicSigningKeys,
  safeRequestId
} from "../../_lib/license.js";

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: licenseCorsHeaders() });
}

export async function onRequestGet(context) {
  const requestId = safeRequestId(context.request);
  try {
    return licenseJson({
      schema: LICENSE_KEYS_SCHEMA,
      keys: publicSigningKeys(context.env)
    });
  } catch (error) {
    const known = error instanceof LicenseError;
    console.error(JSON.stringify({
      message: "license_keys_failed",
      code: known ? error.code : "license_keys_failed",
      requestId
    }));
    return licenseJson({
      ok: false,
      error: known ? error.code : "license_keys_failed",
      message: "Licence keys are temporarily unavailable",
      requestId
    }, known ? error.status : 500);
  }
}
