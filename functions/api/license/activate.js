export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const licenseKey = String(body.licenseKey || "").trim().toUpperCase();
    const machineId = String(body.machineId || "").trim();

    if (!email.includes("@") || !machineId || !isAcceptedLicenseKey(licenseKey)) {
      return json({ ok: false, message: "Invalid license" }, 403);
    }

    const tokenPayload = {
      email,
      licenseKey,
      machineId,
      activatedAt: new Date().toISOString(),
      product: "localclaw"
    };

    const token = btoa(JSON.stringify(tokenPayload));
    return json({ ok: true, token, message: "Activated", expiresAt: null });
  } catch {
    return json({ ok: false, message: "Bad request" }, 400);
  }
}

function isAcceptedLicenseKey(key) {
  return /^LCW-\d{8}-[A-F0-9]{4}-[A-F0-9]{4}$/.test(key)
    || /^LOCALCLAW-[A-Z0-9-]{8,}$/.test(key);
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
