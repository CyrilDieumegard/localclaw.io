export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const licenseKey = String(body.licenseKey || "").trim().toUpperCase();
    const machineId = String(body.machineId || "").trim();
    const appVersion = String(body.appVersion || "").trim();

    if (!email.includes("@") || !machineId || !isAcceptedLicenseKey(licenseKey)) {
      return json({ ok: false, message: "Invalid license" }, 403);
    }

    const customer = getWhitelistedCustomer(email);
    if (customer) {
      if (!isVersionAllowed(appVersion, customer.minVersion)) {
        return json({ ok: false, message: `Please update to ${customer.minVersion} or later` }, 403);
      }

      if (!isStableCustomerKey(licenseKey, customer.stableKey)) {
        return json({ ok: false, message: "Invalid license" }, 403);
      }
    }

    const tokenPayload = {
      email,
      licenseKey,
      machineId,
      appVersion,
      activatedAt: new Date().toISOString(),
      product: "localclaw",
      customerId: customer ? customer.id : null
    };

    const token = base64EncodeUnicode(JSON.stringify(tokenPayload));
    return json({ ok: true, token, message: "Activated", expiresAt: null });
  } catch {
    return json({ ok: false, message: "Bad request" }, 400);
  }
}

function base64EncodeUnicode(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function isAcceptedLicenseKey(key) {
  return /^LCW-\d{8}-[A-F0-9]{4}-[A-F0-9]{4}$/.test(key)
    || /^LOCALCLAW-[A-Z0-9-]{8,}$/.test(key);
}

function getWhitelistedCustomer(email) {
  const customers = {
    "18609505168@163.com": {
      id: "cn-client-001",
      minVersion: "1.0.98",
      stableKey: "LCW-20260519-1860-9516"
    }
  };

  return customers[email] || null;
}

function isStableCustomerKey(actualKey, expectedKey) {
  return actualKey === expectedKey;
}

function isVersionAllowed(current, minimum) {
  if (!current || !minimum) return false;

  const a = parseVersion(current);
  const b = parseVersion(minimum);
  if (!a || !b) return false;

  for (let i = 0; i < 3; i += 1) {
    if (a[i] > b[i]) return true;
    if (a[i] < b[i]) return false;
  }
  return true;
}

function parseVersion(value) {
  const parts = value.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length < 2 || parts.some((part) => Number.isNaN(part))) return null;
  while (parts.length < 3) parts.push(0);
  return parts.slice(0, 3);
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
