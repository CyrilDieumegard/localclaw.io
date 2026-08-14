import { getRequiredSession, json } from "./auth.js";
import { campaignRowToJson } from "./sponsor-campaigns.js";

const ADMIN_ACTIONS = new Set(["stop_now", "cancel_renewal", "extend_week", "extend_month"]);
const EXTENSIONS = new Set(["week", "month"]);

export async function getRequiredSponsorAdmin(context) {
  const auth = await getRequiredSession(context);
  if (auth.response) return auth;
  const allowed = sponsorAdminEmails(context.env);
  if (!allowed.length) {
    return {
      response: json({ ok: false, error: "sponsor_admin_unavailable" }, 503),
      session: null
    };
  }
  const email = normalizeEmail(auth.session.user.email);
  if (!email || !allowed.includes(email)) {
    return {
      response: json({ ok: false, error: "sponsor_admin_forbidden" }, 403),
      session: null
    };
  }
  return { response: null, session: auth.session, email };
}

export function sponsorAdminEmails(env) {
  return [...new Set(String(env?.SPONSOR_ADMIN_EMAILS || "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean))].slice(0, 5);
}

export function normalizeAdminAction(value) {
  const action = String(value || "").trim().toLowerCase();
  return ADMIN_ACTIONS.has(action) ? action : "";
}

export function cleanAdminNote(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 240);
}

export function buildAdminExtension(campaign, extension, nowSeconds = Math.floor(Date.now() / 1000)) {
  const key = String(extension || "").trim().toLowerCase();
  if (!EXTENSIONS.has(key)) return null;
  const base = Math.max(Number(campaign?.paid_through || 0), Number(nowSeconds || 0));
  if (!Number.isFinite(base) || base <= 0) return null;
  return {
    key,
    previousPaidThrough: Number(campaign?.paid_through || 0) || null,
    nextPaidThrough: key === "week" ? base + 7 * 86_400 : addUtcMonth(base)
  };
}

export function adminCampaignRowToJson(row) {
  const campaign = campaignRowToJson(row, row);
  const controls = adminCampaignControls(row, campaign);
  return {
    ...campaign,
    owner: {
      id: row.owner_user_id,
      name: row.owner_name || null,
      email: row.owner_email
    },
    inventory: {
      reservationId: row.reservation_id || null,
      status: row.reservation_status || null,
      blocksUntil: toIso(row.reservation_blocks_until),
      holdExpiresAt: toIso(row.reservation_hold_expires_at)
    },
    stripeReferences: {
      customer: maskedStripeId(row.stripe_customer_id),
      checkoutSession: maskedStripeId(row.stripe_checkout_session_id),
      subscription: maskedStripeId(row.stripe_subscription_id)
    },
    controls
  };
}

export function adminCampaignControls(row, campaign = campaignRowToJson(row, row)) {
  const storedStatus = String(row.status || "");
  const billingStatus = String(row.billing_status || "");
  const reservationStatus = String(row.reservation_status || "");
  const subscriptionConfigured = Boolean(row.stripe_subscription_id);
  const autoRenew = Boolean(row.auto_renew);
  const cancelAtPeriodEnd = Boolean(row.stripe_cancel_at_period_end);
  return {
    canStopNow: !new Set(["cancelled", "completed"]).has(storedStatus),
    canCancelRenewal: subscriptionConfigured && autoRenew && !cancelAtPeriodEnd,
    canExtend: billingStatus === "paid"
      && !autoRenew
      && reservationStatus === "sold"
      && new Set(["scheduled", "active", "completed"]).has(campaign.status),
    extensionBlockedReason: autoRenew
      ? "Cancel Stripe renewal before adding a manual extension."
      : billingStatus !== "paid"
        ? "Only a paid campaign can be extended."
        : reservationStatus !== "sold"
          ? "This campaign has no sold inventory reservation to extend."
          : null
  };
}

export function adminActionDetails({ action, note, previousPaidThrough, nextPaidThrough, stripeReference }) {
  return JSON.stringify({
    action,
    note: note || null,
    previousPaidThrough: previousPaidThrough || null,
    nextPaidThrough: nextPaidThrough || null,
    stripeReference: maskedStripeId(stripeReference)
  });
}

export function adminActionTypeForExtension(extension) {
  return extension === "month" ? "extend_month" : "extend_week";
}

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!email || email.length > 320 || !email.includes("@")) return "";
  return email;
}

function maskedStripeId(value) {
  const id = String(value || "").trim();
  if (!id) return null;
  const prefix = id.split("_")[0] || "stripe";
  return `${prefix}_…${id.slice(-8)}`;
}

function addUtcMonth(seconds) {
  const source = new Date(seconds * 1000);
  const day = source.getUTCDate();
  const result = new Date(source.getTime());
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + 1);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return Math.floor(result.getTime() / 1000);
}

function toIso(value) {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1000).toISOString() : null;
}
