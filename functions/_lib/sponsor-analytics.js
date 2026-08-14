const PROD_VISITOR_COOKIE = "__Host-localclaw_sponsor_visitor";
const DEV_VISITOR_COOKIE = "localclaw_sponsor_visitor_dev";
const VISITOR_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const CAMPAIGN_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PLACEMENT_PATTERN = /^home-(?:left|right)-[1-3]$/;
const BOT_PATTERN = /(?:bot|crawler|spider|preview|facebookexternalhit|slurp|bingpreview|headless|lighthouse|pagespeed)/i;

export function likelyAutomatedMetricRequest(request) {
  const purpose = `${request.headers.get("Purpose") || ""} ${request.headers.get("Sec-Purpose") || ""}`;
  return /prefetch|prerender/i.test(purpose) || BOT_PATTERN.test(request.headers.get("User-Agent") || "");
}

export function sponsorVisitor(request) {
  const name = sponsorVisitorCookieName(request);
  const existing = readCookie(request.headers.get("Cookie") || "", name);
  if (VISITOR_TOKEN_PATTERN.test(existing)) return { token: existing, setCookie: null };
  const token = randomToken(32);
  const secure = name === PROD_VISITOR_COOKIE ? "; Secure" : "";
  return {
    token,
    setCookie: `${name}=${token}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${secure}`
  };
}

export async function recordSponsorMetric(db, input) {
  const eventType = input.eventType === "click" ? "click" : "impression";
  const now = Number(input.now || Math.floor(Date.now() / 1000));
  const campaignId = cleanCampaignId(input.campaignId);
  const placementKey = cleanPlacement(input.placementKey);
  const visitorHash = await sha256Hex(`localclaw:sponsor:visitor:v1:${input.visitorToken}`);
  const dedupeSeconds = eventType === "click" ? 10 : 5 * 60;
  const dedupeBucket = Math.floor(now / dedupeSeconds);
  const metricDate = new Date(now * 1000).toISOString().slice(0, 10);
  const eventHash = await sha256Hex(`localclaw:sponsor:metric:v1:${campaignId}:${eventType}:${visitorHash}:${dedupeBucket}`);
  const result = await db.prepare(`
    INSERT OR IGNORE INTO sponsor_metric_events (
      event_hash, campaign_id, placement_key, event_type, metric_date,
      visitor_hash, dedupe_bucket, occurred_at
    )
    SELECT ?, c.id, c.placement_key, ?, ?, ?, ?, ?
    FROM sponsor_campaigns AS c
    WHERE c.id = ? AND c.placement_key = ?
      AND c.billing_status = 'paid'
      AND c.status IN ('scheduled', 'active')
      AND c.starts_at <= ? AND c.paid_through > ?
  `).bind(
    eventHash, eventType, metricDate, visitorHash, dedupeBucket, now,
    campaignId, placementKey, now, now
  ).run();
  return { recorded: Number(result?.meta?.changes || 0) === 1 };
}

export async function activeSponsorClickTarget(db, campaignId, now = Math.floor(Date.now() / 1000)) {
  const id = cleanCampaignId(campaignId);
  const row = await db.prepare(`
    SELECT id, placement_key, destination_url
    FROM sponsor_campaigns
    WHERE id = ? AND billing_status = 'paid'
      AND status IN ('scheduled', 'active')
      AND starts_at <= ? AND paid_through > ?
    LIMIT 1
  `).bind(id, now, now).first();
  if (!row) throw new MetricError(404, "sponsor_campaign_inactive");
  let target;
  try { target = new URL(String(row.destination_url || "")); } catch { throw new MetricError(503, "sponsor_target_invalid"); }
  if (target.protocol !== "https:" || target.username || target.password) throw new MetricError(503, "sponsor_target_invalid");
  return { campaignId: row.id, placementKey: row.placement_key, targetUrl: target.href };
}

export class MetricError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

function sponsorVisitorCookieName(request) {
  const url = new URL(request.url);
  if (url.protocol === "https:") return PROD_VISITOR_COOKIE;
  if (["localhost", "127.0.0.1"].includes(url.hostname)) return DEV_VISITOR_COOKIE;
  throw new MetricError(400, "insecure_transport");
}

function cleanCampaignId(value) {
  const id = String(value || "").trim();
  if (!CAMPAIGN_ID_PATTERN.test(id)) throw new MetricError(400, "sponsor_campaign_invalid");
  return id;
}

function cleanPlacement(value) {
  const key = String(value || "").trim();
  if (!PLACEMENT_PATTERN.test(key)) throw new MetricError(400, "sponsor_placement_invalid");
  return key;
}

function randomToken(size) {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value)));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function readCookie(header, name) {
  for (const part of String(header || "").split(";")) {
    const index = part.indexOf("=");
    if (index > 0 && part.slice(0, index).trim() === name) return part.slice(index + 1).trim();
  }
  return "";
}
