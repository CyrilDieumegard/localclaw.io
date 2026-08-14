import { json } from "./auth.js";
import { sponsorCheckoutAccess } from "./stripe.js";

export const SPONSOR_TERMS_VERSION = "2026-08-14-v1";
export const SPONSOR_CURRENCY = "usd";
export const SPONSOR_RECURRING_BLOCK_UNTIL = 253_402_300_799;
export const SPONSOR_CHECKOUT_SECONDS = 30 * 60;

export const SPONSOR_PLANS = Object.freeze({
  week: Object.freeze({ key: "week", label: "7 days", interval: "week" }),
  month: Object.freeze({ key: "month", label: "1 calendar month", interval: "month" })
});

export async function readSponsorPricing(db) {
  const row = await db.prepare(`
    SELECT weekly_price_cents, monthly_price_cents, currency,
           max_schedule_days, checkout_hold_minutes, version, updated_at
    FROM sponsor_pricing_settings
    WHERE singleton = 1
  `).first();
  if (!row) throw new Error("sponsor_pricing_missing");
  return {
    currency: String(row.currency || SPONSOR_CURRENCY),
    maxScheduleDays: Number(row.max_schedule_days || 365),
    checkoutHoldMinutes: Number(row.checkout_hold_minutes || 35),
    version: Number(row.version || 1),
    updatedAt: row.updated_at,
    plans: {
      week: { ...SPONSOR_PLANS.week, priceCents: Number(row.weekly_price_cents) },
      month: { ...SPONSOR_PLANS.month, priceCents: Number(row.monthly_price_cents) }
    }
  };
}

export function sponsorCatalogCommerce(pricing, env, email) {
  const access = sponsorCheckoutAccess(env, email);
  return {
    inventoryState: access.enabled ? "available" : access.mode === "pilot" ? "pilot" : "offline",
    pricing: {
      currency: pricing.currency,
      version: pricing.version,
      launchPricing: true,
      plans: Object.values(pricing.plans).map((plan) => ({
        key: plan.key,
        label: plan.label,
        priceCents: plan.priceCents,
        autoRenewAvailable: true
      }))
    },
    billing: {
      provider: "stripe",
      checkoutAvailable: access.enabled,
      mode: access.mode,
      automaticRenewal: "optional"
    },
    schedule: {
      startNowAvailable: true,
      exactDateAvailable: true,
      maxScheduleDays: pricing.maxScheduleDays,
      timezone: "UTC"
    },
    termsVersion: SPONSOR_TERMS_VERSION
  };
}

export function buildSponsorSchedule(input, pricing, nowSeconds = unixNow()) {
  const value = input && typeof input === "object" ? input : {};
  const planKey = String(value.planKey || "").trim().toLowerCase();
  const plan = pricing.plans[planKey];
  if (!plan) return invalidSchedule("planKey");

  const startMode = String(value.startMode || "date").trim().toLowerCase();
  let startsAt;
  let requestedStartDate;
  if (startMode === "now") {
    startsAt = nowSeconds;
    requestedStartDate = new Date(startsAt * 1000).toISOString().slice(0, 10);
  } else if (startMode === "date") {
    const date = cleanDate(value.startDate);
    if (!date) return invalidSchedule("startDate");
    startsAt = Math.floor(Date.parse(`${date}T00:00:00Z`) / 1000);
    requestedStartDate = date;
    const todayStart = Math.floor(Date.parse(`${new Date(nowSeconds * 1000).toISOString().slice(0, 10)}T00:00:00Z`) / 1000);
    if (startsAt < todayStart) return invalidSchedule("startDate");
    if (startsAt < nowSeconds) startsAt = nowSeconds;
  } else {
    return invalidSchedule("startMode");
  }

  if (startsAt > nowSeconds + pricing.maxScheduleDays * 86_400) return invalidSchedule("startDate");
  const endsAt = planKey === "week" ? startsAt + 7 * 86_400 : addUtcMonth(startsAt);
  const requestedEndDate = new Date(endsAt * 1000).toISOString().slice(0, 10);
  const autoRenew = value.autoRenew === true;
  return {
    ok: true,
    schedule: {
      planKey,
      plan,
      startMode,
      startsAt,
      endsAt,
      requestedStartDate,
      requestedEndDate,
      autoRenew,
      blocksUntil: autoRenew ? SPONSOR_RECURRING_BLOCK_UNTIL : endsAt,
      priceCents: plan.priceCents,
      currency: pricing.currency
    }
  };
}

export async function listSponsorInventory(db, nowSeconds = unixNow()) {
  const result = await db.prepare(`
    SELECT placement_key, starts_at, ends_at, blocks_until, status, hold_expires_at, auto_renew
    FROM sponsor_inventory_reservations
    WHERE (status = 'held' AND hold_expires_at > ?)
       OR (status = 'sold' AND blocks_until > ?)
    ORDER BY placement_key ASC, starts_at ASC
  `).bind(nowSeconds, nowSeconds).all();
  return result.results || [];
}

export function inventoryRangesByPlacement(rows) {
  const grouped = new Map();
  for (const row of rows || []) {
    const items = grouped.get(row.placement_key) || [];
    items.push({
      startsAt: toIso(row.starts_at),
      endsAt: toIso(row.ends_at),
      blocksUntil: Number(row.blocks_until) >= SPONSOR_RECURRING_BLOCK_UNTIL ? null : toIso(row.blocks_until),
      recurring: Boolean(row.auto_renew),
      state: row.status === "held" ? "held" : "booked"
    });
    grouped.set(row.placement_key, items);
  }
  return grouped;
}

export function sponsorBookingUnavailable(error) {
  return String(error?.message || error || "").includes("sponsor_booking_unavailable");
}

export function sponsorCheckoutError(error) {
  if (sponsorBookingUnavailable(error)) {
    return json({
      ok: false,
      error: "sponsor_booking_unavailable",
      message: "That fixed placement is already reserved for part of the selected period."
    }, 409);
  }
  const code = String(error?.message || "");
  if (code.startsWith("stripe_")) {
    return json({ ok: false, error: "sponsor_checkout_unavailable", message: "Stripe checkout is not configured yet." }, 503);
  }
  return json({ ok: false, error: "sponsor_checkout_error", message: "Checkout could not be prepared safely." }, 500);
}

export function unixNow() {
  return Math.floor(Date.now() / 1000);
}

export function toIso(value) {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1000).toISOString() : null;
}

function addUtcMonth(seconds) {
  const source = new Date(seconds * 1000);
  const year = source.getUTCFullYear();
  const month = source.getUTCMonth();
  const day = source.getUTCDate();
  const lastDay = new Date(Date.UTC(year, month + 2, 0)).getUTCDate();
  const result = new Date(source.getTime());
  result.setUTCFullYear(year, month + 1, Math.min(day, lastDay));
  return Math.floor(result.getTime() / 1000);
}

function cleanDate(value) {
  const text = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return "";
  const date = new Date(`${text}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === text ? text : "";
}

function invalidSchedule(field) {
  return { ok: false, fields: [field], schedule: null };
}
