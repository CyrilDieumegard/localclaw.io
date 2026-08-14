import { getRequiredSession, json, requireSameOrigin } from "../../../../_lib/auth.js";
import { datafastCheckoutMetadata } from "../../../../_lib/datafast-attribution.mjs";
import { readSponsorJson } from "../../../../_lib/sponsor-campaigns.js";
import {
  SPONSOR_CHECKOUT_SECONDS,
  SPONSOR_TERMS_VERSION,
  buildSponsorSchedule,
  readSponsorPricing,
  sponsorBookingUnavailable,
  sponsorCheckoutError,
  unixNow
} from "../../../../_lib/sponsor-commerce.js";
import {
  integrationIdentifier,
  sponsorCheckoutAccess,
  sponsorStripeProductId,
  stripeClient
} from "../../../../_lib/stripe.js";

export async function onRequestPost(context) {
  if (!requireSameOrigin(context.request)) return json({ ok: false, error: "invalid_origin" }, 403);
  const auth = await getRequiredSession(context);
  if (auth.response) return auth.response;
  const access = sponsorCheckoutAccess(context.env, auth.session.user.email);
  if (!access.enabled) {
    return json({ ok: false, error: "sponsor_checkout_not_available", message: "Checkout is currently limited to the LocalClaw pilot." }, 403);
  }
  const parsed = await readSponsorJson(context.request);
  if (parsed.response) return parsed.response;
  if (parsed.value.acceptTerms !== true || parsed.value.termsVersion !== SPONSOR_TERMS_VERSION) {
    return json({ ok: false, error: "sponsor_terms_required", message: "Accept the current sponsorship terms before checkout." }, 422);
  }

  const campaignId = String(context.params.id || "");
  const now = unixNow();
  try {
    const campaign = await ownedCheckoutCampaign(context, auth.session.user.id, campaignId);
    if (!campaign) return json({ ok: false, error: "campaign_not_found" }, 404);

    const existing = await existingReservation(context, campaignId);
    if (existing && existing.status === "held" && Number(existing.hold_expires_at) > now) {
      if (existing.stripe_checkout_session_id) {
        const session = await stripeClient(context.env).checkout.sessions.retrieve(existing.stripe_checkout_session_id);
        if (session.status === "open" && session.url) return json({ ok: true, checkoutUrl: session.url, reused: true });
      }
      return json({ ok: false, error: "checkout_in_progress", message: "A checkout is already holding this campaign. Wait for it to expire or cancel it." }, 409);
    }
    if (!new Set(["draft", "changes_requested"]).has(campaign.status)) {
      return json({ ok: false, error: "campaign_locked", message: "This campaign can no longer start a new checkout." }, 409);
    }
    if (!campaign.logo_asset_key || !campaign.logo_sha256) {
      return json({ ok: false, error: "sponsor_logo_required", message: "Upload a valid PNG or WebP logo before checkout." }, 422);
    }

    const pricing = await readSponsorPricing(context.env.LOCALCLAW_DB);
    if (Number(parsed.value.pricingVersion || 0) !== pricing.version) {
      return json({ ok: false, error: "sponsor_price_changed", message: "Sponsorship pricing changed. Refresh before checkout." }, 409);
    }
    const built = buildSponsorSchedule(parsed.value, pricing, now);
    if (!built.ok) return json({ ok: false, error: "invalid_schedule", fields: built.fields }, 422);
    const schedule = built.schedule;
    const reservationId = crypto.randomUUID();
    const checkoutExpiresAt = now + SPONSOR_CHECKOUT_SECONDS;
    const holdExpiresAt = now + pricing.checkoutHoldMinutes * 60;
    const updatedAt = new Date().toISOString();

    const results = await context.env.LOCALCLAW_DB.batch([
      context.env.LOCALCLAW_DB.prepare(`
        DELETE FROM sponsor_inventory_reservations
        WHERE campaign_id = ? AND (
          status IN ('released', 'expired') OR
          (status = 'held' AND hold_expires_at <= ?)
        )
      `).bind(campaignId, now),
      context.env.LOCALCLAW_DB.prepare(`
        UPDATE sponsor_campaigns
        SET requested_start_date = ?, requested_end_date = ?, plan_key = ?,
            starts_at = ?, ends_at = ?, paid_through = NULL, auto_renew = ?,
            price_cents = ?, currency = ?, terms_version = ?,
            status = 'approved_pending_billing', billing_status = 'pending',
            checkout_expires_at = ?, billing_updated_at = ?, updated_at = ?, version = version + 1
        WHERE id = ? AND user_id = ? AND status IN ('draft', 'changes_requested') AND version = ?
      `).bind(
        schedule.requestedStartDate, schedule.requestedEndDate, schedule.planKey,
        schedule.startsAt, schedule.endsAt, schedule.autoRenew ? 1 : 0,
        schedule.priceCents, schedule.currency, SPONSOR_TERMS_VERSION,
        checkoutExpiresAt, updatedAt, updatedAt,
        campaignId, auth.session.user.id, campaign.version
      ),
      context.env.LOCALCLAW_DB.prepare(`
        INSERT INTO sponsor_inventory_reservations (
          id, campaign_id, user_id, placement_key, starts_at, ends_at, blocks_until,
          status, auto_renew, hold_expires_at, created_at, updated_at
        )
        SELECT ?, ?, ?, ?, ?, ?, ?, 'held', ?, ?, ?, ?
        WHERE EXISTS (
          SELECT 1 FROM sponsor_campaigns
          WHERE id = ? AND user_id = ? AND status = 'approved_pending_billing'
            AND billing_status = 'pending' AND updated_at = ? AND version = ?
        )
      `).bind(
        reservationId, campaignId, auth.session.user.id, campaign.placement_key,
        schedule.startsAt, schedule.endsAt, schedule.blocksUntil,
        schedule.autoRenew ? 1 : 0, holdExpiresAt, updatedAt, updatedAt,
        campaignId, auth.session.user.id, updatedAt, Number(campaign.version) + 1
      ),
      context.env.LOCALCLAW_DB.prepare(`
        INSERT INTO sponsor_campaign_events (
          id, campaign_id, user_id, event_type, from_status, to_status, details_json, created_at
        )
        SELECT ?, ?, ?, 'checkout_hold_created', ?, 'approved_pending_billing', ?, ?
        WHERE EXISTS (
          SELECT 1 FROM sponsor_inventory_reservations
          WHERE id = ? AND campaign_id = ? AND status = 'held'
        )
      `).bind(
        crypto.randomUUID(), campaignId, auth.session.user.id, campaign.status,
        JSON.stringify({ reservationId, planKey: schedule.planKey, startsAt: schedule.startsAt, endsAt: schedule.endsAt, autoRenew: schedule.autoRenew, priceCents: schedule.priceCents }),
        updatedAt, reservationId, campaignId
      )
    ]);
    if (Number(results[1]?.meta?.changes || 0) !== 1 || Number(results[2]?.meta?.changes || 0) !== 1) {
      return json({ ok: false, error: "campaign_conflict" }, 409);
    }

    const stripe = stripeClient(context.env);
    const productId = sponsorStripeProductId(context.env);
    const metadata = {
      localclaw_campaign_id: campaignId,
      localclaw_reservation_id: reservationId,
      localclaw_user_id: auth.session.user.id,
      localclaw_plan_key: schedule.planKey,
      localclaw_starts_at: String(schedule.startsAt),
      localclaw_ends_at: String(schedule.endsAt),
      localclaw_auto_renew: schedule.autoRenew ? "true" : "false",
      localclaw_terms_version: SPONSOR_TERMS_VERSION,
      ...datafastCheckoutMetadata(context.request)
    };
    const lineItem = {
      price_data: {
        currency: schedule.currency,
        product: productId,
        unit_amount: schedule.priceCents
      },
      quantity: 1
    };
    const origin = new URL(context.request.url).origin;
    const params = {
      mode: schedule.autoRenew ? "subscription" : "payment",
      client_reference_id: reservationId,
      customer_email: auth.session.user.email,
      expires_at: checkoutExpiresAt,
      integration_identifier: integrationIdentifier(),
      line_items: schedule.autoRenew ? [
        {
          price_data: {
            currency: schedule.currency,
            product: productId,
            unit_amount: schedule.priceCents,
            recurring: { interval: schedule.plan.interval }
          },
          quantity: 1
        },
        lineItem
      ] : [lineItem],
      locale: "auto",
      metadata,
      origin_context: "web",
      submit_type: "book",
      success_url: `${origin}/account?view=sponsorship&checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/account?view=sponsorship&checkout=cancelled&campaign_id=${encodeURIComponent(campaignId)}`,
      custom_text: {
        submit: { message: "This reserves one fixed homepage rail position. Impressions, clicks and conversions are not guaranteed." }
      }
    };
    if (schedule.autoRenew) {
      params.subscription_data = {
        trial_end: schedule.endsAt,
        metadata,
        trial_settings: { end_behavior: { missing_payment_method: "cancel" } }
      };
    } else {
      params.customer_creation = "always";
      params.payment_intent_data = { metadata };
    }
    const session = await stripe.checkout.sessions.create(params, {
      idempotencyKey: `localclaw-sponsor-${reservationId}`
    });
    if (!session?.id || !session.url) throw new Error("stripe_checkout_session_invalid");
    await context.env.LOCALCLAW_DB.batch([
      context.env.LOCALCLAW_DB.prepare(`
        UPDATE sponsor_inventory_reservations
        SET stripe_checkout_session_id = ?, updated_at = ?
        WHERE id = ? AND status = 'held'
      `).bind(session.id, updatedAt, reservationId),
      context.env.LOCALCLAW_DB.prepare(`
        UPDATE sponsor_campaigns
        SET stripe_checkout_session_id = ?, updated_at = ?
        WHERE id = ? AND user_id = ? AND billing_status = 'pending'
      `).bind(session.id, updatedAt, campaignId, auth.session.user.id)
    ]);
    return json({ ok: true, checkoutUrl: session.url, expiresAt: new Date(checkoutExpiresAt * 1000).toISOString() });
  } catch (error) {
    if (sponsorBookingUnavailable(error)) return sponsorCheckoutError(error);
    return sponsorCheckoutError(error);
  }
}

async function ownedCheckoutCampaign(context, userId, campaignId) {
  return context.env.LOCALCLAW_DB.prepare(`
    SELECT c.*, cr.logo_asset_key, cr.logo_sha256
    FROM sponsor_campaigns AS c
    JOIN sponsor_campaign_creatives AS cr ON cr.campaign_id = c.id
    WHERE c.id = ? AND c.user_id = ?
  `).bind(campaignId, userId).first();
}

async function existingReservation(context, campaignId) {
  return context.env.LOCALCLAW_DB.prepare(`
    SELECT * FROM sponsor_inventory_reservations WHERE campaign_id = ?
  `).bind(campaignId).first();
}
