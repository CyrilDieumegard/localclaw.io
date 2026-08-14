export function datafastCheckoutMetadata(request) {
  const cookies = parseCookies(request.headers.get("Cookie"));
  const visitorId = validDatafastVisitorId(cookies.get("datafast_visitor_id"));
  const sessionId = validDatafastSessionId(cookies.get("datafast_session_id"));
  return {
    ...(visitorId ? { datafast_visitor_id: visitorId } : {}),
    ...(sessionId ? { datafast_session_id: sessionId } : {})
  };
}

function parseCookies(header) {
  const result = new Map();
  for (const part of String(header || "").split(";")) {
    const index = part.indexOf("=");
    if (index <= 0) continue;
    const key = part.slice(0, index).trim();
    if (!key || result.has(key)) continue;
    let value = part.slice(index + 1).trim();
    try { value = decodeURIComponent(value); } catch {}
    result.set(key, value);
  }
  return result;
}

function validDatafastVisitorId(value) {
  const text = String(value || "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text) ? text : "";
}

function validDatafastSessionId(value) {
  const text = String(value || "").trim();
  return /^s[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text) ? text : "";
}
