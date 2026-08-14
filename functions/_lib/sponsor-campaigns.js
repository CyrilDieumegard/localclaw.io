import { json } from "./auth.js";

export const MAX_SPONSOR_CAMPAIGNS_PER_ACCOUNT = 24;

export const SPONSOR_PLACEMENTS = Object.freeze([
  placement("home-left-1", "Homepage · Left rail · 01", "left", 1),
  placement("home-left-2", "Homepage · Left rail · 02", "left", 2),
  placement("home-left-3", "Homepage · Left rail · 03", "left", 3),
  placement("home-right-1", "Homepage · Right rail · 01", "right", 1),
  placement("home-right-2", "Homepage · Right rail · 02", "right", 2),
  placement("home-right-3", "Homepage · Right rail · 03", "right", 3)
]);

const PLACEMENTS_BY_KEY = new Map(SPONSOR_PLACEMENTS.map((item) => [item.key, item]));
const EDITABLE_STATUSES = new Set(["draft", "changes_requested"]);
const CANCELLABLE_STATUSES = new Set(["draft", "changes_requested"]);

export function sponsorCatalogPayload(commerce = {}, inventoryRanges = new Map()) {
  return {
    placements: SPONSOR_PLACEMENTS.map((item) => ({
      ...item,
      availability: "fixed_position",
      blockedRanges: inventoryRanges.get(item.key) || []
    })),
    inventoryCount: SPONSOR_PLACEMENTS.length,
    ...commerce,
    editorialPolicy: "Sponsorship never changes model rankings, scores or community ratings."
  };
}

export async function readSponsorJson(request) {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > 16_384) {
    return { response: json({ ok: false, error: "payload_too_large" }, 413), value: null };
  }

  try {
    const value = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid");
    return { response: null, value };
  } catch {
    return { response: json({ ok: false, error: "invalid_json" }, 400), value: null };
  }
}

export function validateSponsorCampaign(input, { requireComplete = false } = {}) {
  const value = input && typeof input === "object" ? input : {};
  const campaign = {
    campaignName: cleanText(value.campaignName, 80),
    advertiserName: cleanText(value.advertiserName, 80),
    destinationUrl: cleanHttpsUrl(value.destinationUrl),
    tagline: cleanText(value.tagline, 140),
    ctaLabel: cleanText(value.ctaLabel || "Learn more", 28),
    placementKey: cleanPlacement(value.placementKey),
    requestedStartDate: cleanDate(value.requestedStartDate),
    requestedEndDate: cleanDate(value.requestedEndDate),
    logoAltText: cleanOptionalText(value.logoAltText, 120)
  };

  const errors = [];
  if (campaign.campaignName.length < 2) errors.push("campaignName");
  if (campaign.advertiserName.length < 2) errors.push("advertiserName");
  if (!campaign.destinationUrl) errors.push("destinationUrl");
  if (campaign.tagline.length < 8) errors.push("tagline");
  if (campaign.ctaLabel.length < 2) errors.push("ctaLabel");
  if (!campaign.placementKey) errors.push("placementKey");

  const hasOneDate = Boolean(campaign.requestedStartDate) !== Boolean(campaign.requestedEndDate);
  if (hasOneDate) errors.push("schedule");
  if (campaign.requestedStartDate && campaign.requestedEndDate) {
    const start = Date.parse(`${campaign.requestedStartDate}T00:00:00Z`);
    const end = Date.parse(`${campaign.requestedEndDate}T00:00:00Z`);
    if (!(end > start) || end - start > 366 * 86_400_000) errors.push("schedule");
  }
  if (requireComplete && (!campaign.requestedStartDate || !campaign.requestedEndDate)) errors.push("schedule");

  return { ok: errors.length === 0, errors: [...new Set(errors)], campaign };
}

export function campaignRowToJson(row, metrics = null) {
  const impressions = Number(metrics?.impressions || 0);
  const clicks = Number(metrics?.clicks || 0);
  const now = Math.floor(Date.now() / 1000);
  const paidThrough = Number(row.paid_through || 0);
  const startsAt = Number(row.starts_at || 0);
  let effectiveStatus = row.status;
  if (row.billing_status === "paid" && paidThrough > 0 && row.status !== "cancelled") {
    effectiveStatus = paidThrough <= now ? "completed" : startsAt > now ? "scheduled" : "active";
  }
  return {
    id: row.id,
    campaignName: row.campaign_name,
    advertiserName: row.advertiser_name,
    destinationUrl: row.destination_url,
    tagline: row.tagline,
    ctaLabel: row.cta_label,
    placementKey: row.placement_key,
    placement: PLACEMENTS_BY_KEY.get(row.placement_key) || null,
    requestedStartDate: row.requested_start_date || null,
    requestedEndDate: row.requested_end_date || null,
    status: effectiveStatus,
    storedStatus: row.status,
    reviewNote: row.review_note || null,
    planKey: row.plan_key || null,
    startsAt: toIso(row.starts_at),
    endsAt: toIso(row.ends_at),
    paidThrough: toIso(row.paid_through),
    autoRenew: Boolean(row.auto_renew),
    price: row.price_cents ? {
      amountCents: Number(row.price_cents),
      currency: row.currency || "usd"
    } : null,
    billing: {
      status: row.billing_status,
      provider: "stripe",
      customerConfigured: Boolean(row.stripe_customer_id),
      subscriptionConfigured: Boolean(row.stripe_subscription_id),
      subscriptionStatus: row.stripe_subscription_status || null,
      cancelAtPeriodEnd: Boolean(row.stripe_cancel_at_period_end),
      checkoutExpiresAt: toIso(row.checkout_expires_at)
    },
    creative: {
      status: row.creative_status || "missing",
      logoAltText: row.logo_alt_text || null,
      logoUrl: row.logo_asset_key ? `/api/sponsor/campaigns/${encodeURIComponent(row.id)}/logo?v=${String(row.logo_sha256 || "").slice(0, 12)}` : null,
      uploadAvailable: canEditCampaign(row.status),
      width: Number(row.logo_width || 0) || null,
      height: Number(row.logo_height || 0) || null
    },
    analytics: {
      impressions,
      clicks,
      uniqueVisitors: Number(metrics?.unique_visitors || 0),
      uniqueClicks: Number(metrics?.unique_clicks || 0),
      ctrPercent: impressions > 0 ? Math.round((clicks / impressions) * 10_000) / 100 : null
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at || null,
    version: Number(row.version || 1)
  };
}

export function canEditCampaign(status) {
  return EDITABLE_STATUSES.has(String(status || ""));
}

export function canCancelCampaign(status) {
  return CANCELLABLE_STATUSES.has(String(status || ""));
}

export function sponsorError(error, fallback = "Sponsor workspace request failed.") {
  const message = String(error?.message || "");
  if (message.includes("UNIQUE constraint failed")) {
    return json({ ok: false, error: "campaign_conflict", message: "That campaign changed while you were editing it." }, 409);
  }
  return json({ ok: false, error: "sponsor_workspace_error", message: fallback }, 500);
}

function placement(key, label, rail, position) {
  return Object.freeze({
    key,
    label,
    surface: "homepage",
    rail,
    position,
    viewport: "desktop",
    availability: "fixed_position"
  });
}

function cleanText(value, maxLength) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function cleanOptionalText(value, maxLength) {
  const text = cleanText(value, maxLength);
  return text || null;
}

function cleanPlacement(value) {
  const key = String(value || "").trim().toLowerCase();
  return PLACEMENTS_BY_KEY.has(key) ? key : "";
}

function cleanHttpsUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    if (url.protocol !== "https:" || url.username || url.password) return "";
    url.hash = "";
    return url.toString().slice(0, 500);
  } catch {
    return "";
  }
}

function cleanDate(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === text ? text : null;
}

function toIso(value) {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1000).toISOString() : null;
}
