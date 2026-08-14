import { json, requireSameOrigin } from "../../../../_lib/auth.js";
import {
  adminActionDetails,
  adminActionTypeForExtension,
  adminCampaignControls,
  adminCampaignRowToJson,
  buildAdminExtension,
  cleanAdminNote,
  getRequiredSponsorAdmin,
  normalizeAdminAction
} from "../../../../_lib/sponsor-admin.js";
import { readSponsorJson } from "../../../../_lib/sponsor-campaigns.js";
import { sponsorBookingUnavailable } from "../../../../_lib/sponsor-commerce.js";
import { stripeClient } from "../../../../_lib/stripe.js";

export async function onRequestPost(context) {
  if (!requireSameOrigin(context.request)) return json({ ok: false, error: "invalid_origin" }, 403);
  const admin = await getRequiredSponsorAdmin(context);
  if (admin.response) return admin.response;

  const campaignId = String(context.params.id || "");
  if (!/^[0-9a-f-]{36}$/i.test(campaignId)) return json({ ok: false, error: "campaign_not_found" }, 404);
  const parsed = await readSponsorJson(context.request);
  if (parsed.response) return parsed.response;
  const action = normalizeAdminAction(parsed.value.action);
  if (!action) return json({ ok: false, error: "invalid_admin_action" }, 422);
  if (String(parsed.value.confirmation || "") !== campaignId) {
    return json({ ok: false, error: "admin_confirmation_required" }, 422);
  }

  const campaign = await readAdminCampaign(context, campaignId);
  if (!campaign) return json({ ok: false, error: "campaign_not_found" }, 404);
  const note = cleanAdminNote(parsed.value.note);

  try {
    if (action === "stop_now") return await stopCampaignNow(context, admin, campaign, note);
    if (action === "cancel_renewal") return await cancelCampaignRenewal(context, admin, campaign, note);
    return await extendCampaign(context, admin, campaign, action === "extend_month" ? "month" : "week", note);
  } catch (error) {
    if (sponsorBookingUnavailable(error)) {
      return json({
        ok: false,
        error: "sponsor_booking_unavailable",
        message: "The extension overlaps another hold or paid campaign on this fixed position."
      }, 409);
    }
    if (isStripeError(error)) {
      return json({ ok: false, error: "stripe_admin_action_failed", message: "Stripe did not confirm this billing action." }, 503);
    }
    return json({ ok: false, error: "sponsor_admin_action_failed" }, 500);
  }
}

async function stopCampaignNow(context, admin, campaign, note) {
  const controls = adminCampaignControls(campaign);
  if (!controls.canStopNow) return json({ ok: false, error: "campaign_already_stopped" }, 409);

  const stripe = stripeClient(context.env);
  const idempotencyKey = `localclaw-admin-stop-${campaign.id}-v${campaign.version}`;
  if (campaign.billing_status === "pending" && campaign.stripe_checkout_session_id) {
    const session = await stripe.checkout.sessions.retrieve(campaign.stripe_checkout_session_id);
    if (session.status === "complete") return json({ ok: false, error: "checkout_already_completed" }, 409);
    if (session.status === "open") {
      await stripe.checkout.sessions.expire(session.id, {}, { idempotencyKey });
    }
  }
  if (campaign.stripe_subscription_id) {
    await stripe.subscriptions.cancel(campaign.stripe_subscription_id, {}, { idempotencyKey });
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const now = new Date().toISOString();
  const nextBillingStatus = campaign.billing_status === "pending" ? "not_configured" : campaign.billing_status;
  const details = adminActionDetails({
    action: "stop_now",
    note,
    previousPaidThrough: campaign.paid_through,
    nextPaidThrough: campaign.paid_through ? Math.min(Number(campaign.paid_through), nowSeconds) : null,
    stripeReference: campaign.stripe_subscription_id || campaign.stripe_checkout_session_id
  });
  const results = await context.env.LOCALCLAW_DB.batch([
    context.env.LOCALCLAW_DB.prepare(`
      UPDATE sponsor_campaigns
      SET status = 'cancelled', billing_status = ?, auto_renew = 0,
          paid_through = CASE WHEN paid_through IS NOT NULL AND paid_through > ? THEN ? ELSE paid_through END,
          stripe_subscription_status = CASE WHEN stripe_subscription_id IS NOT NULL THEN 'canceled' ELSE stripe_subscription_status END,
          stripe_cancel_at_period_end = CASE WHEN stripe_subscription_id IS NOT NULL THEN 1 ELSE stripe_cancel_at_period_end END,
          stripe_checkout_session_id = CASE WHEN billing_status = 'pending' THEN NULL ELSE stripe_checkout_session_id END,
          checkout_expires_at = NULL, billing_updated_at = ?, updated_at = ?, version = version + 1
      WHERE id = ? AND version = ? AND status NOT IN ('cancelled', 'completed')
    `).bind(nextBillingStatus, nowSeconds, nowSeconds, now, now, campaign.id, campaign.version),
    context.env.LOCALCLAW_DB.prepare(`
      UPDATE sponsor_inventory_reservations
      SET status = 'released', auto_renew = 0, hold_expires_at = NULL, updated_at = ?
      WHERE campaign_id = ? AND EXISTS (
        SELECT 1 FROM sponsor_campaigns WHERE id = ? AND version = ? AND status = 'cancelled'
      )
    `).bind(now, campaign.id, campaign.id, Number(campaign.version) + 1),
    campaignEventStatement(context, {
      campaign, admin, action: "admin_stop_now", toStatus: "cancelled", details, now
    }),
    adminAuditStatement(context, {
      campaign, admin, action: "stop_now", toStatus: "cancelled", details, now,
      nextPaidThrough: campaign.paid_through ? Math.min(Number(campaign.paid_through), nowSeconds) : null
    })
  ]);
  if (Number(results[0]?.meta?.changes || 0) !== 1) return json({ ok: false, error: "campaign_conflict" }, 409);
  return adminCampaignResponse(context, campaign.id);
}

async function cancelCampaignRenewal(context, admin, campaign, note) {
  const controls = adminCampaignControls(campaign);
  if (!controls.canCancelRenewal) return json({ ok: false, error: "renewal_not_active" }, 409);
  const stripe = stripeClient(context.env);
  const subscription = await stripe.subscriptions.update(
    campaign.stripe_subscription_id,
    { cancel_at_period_end: true },
    { idempotencyKey: `localclaw-admin-renewal-${campaign.id}-v${campaign.version}` }
  );
  const paidThrough = Math.max(Number(campaign.paid_through || 0), subscriptionPeriodEnd(subscription));
  if (!Number.isFinite(paidThrough) || paidThrough <= 0) throw new Error("stripe_subscription_period_missing");
  const now = new Date().toISOString();
  const details = adminActionDetails({
    action: "cancel_renewal", note,
    previousPaidThrough: campaign.paid_through,
    nextPaidThrough: paidThrough,
    stripeReference: campaign.stripe_subscription_id
  });
  const results = await context.env.LOCALCLAW_DB.batch([
    context.env.LOCALCLAW_DB.prepare(`
      UPDATE sponsor_campaigns
      SET auto_renew = 0, stripe_cancel_at_period_end = 1,
          stripe_subscription_status = ?,
          paid_through = CASE WHEN ? > COALESCE(paid_through, 0) THEN ? ELSE paid_through END,
          billing_updated_at = ?, updated_at = ?, version = version + 1
      WHERE id = ? AND version = ? AND auto_renew = 1
    `).bind(String(subscription.status || "active"), paidThrough, paidThrough, now, now, campaign.id, campaign.version),
    context.env.LOCALCLAW_DB.prepare(`
      UPDATE sponsor_inventory_reservations
      SET auto_renew = 0, blocks_until = ?, updated_at = ?
      WHERE campaign_id = ? AND status = 'sold' AND EXISTS (
        SELECT 1 FROM sponsor_campaigns WHERE id = ? AND version = ? AND auto_renew = 0
      )
    `).bind(paidThrough, now, campaign.id, campaign.id, Number(campaign.version) + 1),
    campaignEventStatement(context, {
      campaign, admin, action: "admin_cancel_renewal", toStatus: campaign.status, details, now
    }),
    adminAuditStatement(context, {
      campaign, admin, action: "cancel_renewal", toStatus: campaign.status, details, now,
      nextPaidThrough: paidThrough
    })
  ]);
  if (Number(results[0]?.meta?.changes || 0) !== 1) return json({ ok: false, error: "campaign_conflict" }, 409);
  return adminCampaignResponse(context, campaign.id);
}

async function extendCampaign(context, admin, campaign, extension, note) {
  const controls = adminCampaignControls(campaign);
  if (!controls.canExtend) {
    return json({ ok: false, error: "campaign_extension_not_available", message: controls.extensionBlockedReason }, 409);
  }
  const built = buildAdminExtension(campaign, extension);
  if (!built) return json({ ok: false, error: "invalid_extension" }, 422);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const nextStatus = Number(campaign.starts_at || 0) > nowSeconds ? "scheduled" : "active";
  const nextEndDate = new Date(built.nextPaidThrough * 1000).toISOString().slice(0, 10);
  const now = new Date().toISOString();
  const action = adminActionTypeForExtension(extension);
  const details = adminActionDetails({
    action, note,
    previousPaidThrough: built.previousPaidThrough,
    nextPaidThrough: built.nextPaidThrough
  });
  const results = await context.env.LOCALCLAW_DB.batch([
    context.env.LOCALCLAW_DB.prepare(`
      UPDATE sponsor_campaigns
      SET status = ?, ends_at = ?, paid_through = ?, requested_end_date = ?,
          completed_at = NULL, updated_at = ?, version = version + 1
      WHERE id = ? AND version = ? AND billing_status = 'paid' AND auto_renew = 0
        AND status IN ('scheduled', 'active', 'completed')
    `).bind(nextStatus, built.nextPaidThrough, built.nextPaidThrough, nextEndDate, now, campaign.id, campaign.version),
    context.env.LOCALCLAW_DB.prepare(`
      UPDATE sponsor_inventory_reservations
      SET status = 'sold', ends_at = ?, blocks_until = ?, auto_renew = 0, updated_at = ?
      WHERE campaign_id = ? AND status = 'sold' AND EXISTS (
        SELECT 1 FROM sponsor_campaigns WHERE id = ? AND version = ? AND paid_through = ?
      )
    `).bind(
      built.nextPaidThrough, built.nextPaidThrough, now, campaign.id,
      campaign.id, Number(campaign.version) + 1, built.nextPaidThrough
    ),
    campaignEventStatement(context, {
      campaign, admin, action: `admin_${action}`, toStatus: nextStatus, details, now
    }),
    adminAuditStatement(context, {
      campaign, admin, action, toStatus: nextStatus, details, now,
      nextPaidThrough: built.nextPaidThrough
    })
  ]);
  if (Number(results[0]?.meta?.changes || 0) !== 1 || Number(results[1]?.meta?.changes || 0) !== 1) {
    return json({ ok: false, error: "campaign_conflict" }, 409);
  }
  return adminCampaignResponse(context, campaign.id);
}

function campaignEventStatement(context, { campaign, admin, action, toStatus, details, now }) {
  return context.env.LOCALCLAW_DB.prepare(`
    INSERT INTO sponsor_campaign_events (
      id, campaign_id, user_id, event_type, from_status, to_status, details_json, created_at
    )
    SELECT ?, ?, ?, ?, ?, ?, ?, ?
    WHERE EXISTS (
      SELECT 1 FROM sponsor_campaigns WHERE id = ? AND version = ?
    )
  `).bind(
    crypto.randomUUID(), campaign.id, admin.session.user.id, action,
    campaign.status, toStatus, details, now,
    campaign.id, Number(campaign.version) + 1
  );
}

function adminAuditStatement(context, { campaign, admin, action, toStatus, details, now, nextPaidThrough }) {
  return context.env.LOCALCLAW_DB.prepare(`
    INSERT INTO sponsor_admin_actions (
      id, campaign_id, admin_user_id, admin_email, action_type, from_status,
      to_status, previous_paid_through, next_paid_through, details_json, created_at
    )
    SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    WHERE EXISTS (
      SELECT 1 FROM sponsor_campaigns WHERE id = ? AND version = ?
    )
  `).bind(
    crypto.randomUUID(), campaign.id, admin.session.user.id, admin.email, action,
    campaign.status, toStatus, campaign.paid_through || null, nextPaidThrough || null,
    details, now, campaign.id, Number(campaign.version) + 1
  );
}

async function adminCampaignResponse(context, campaignId) {
  const updated = await readAdminCampaign(context, campaignId);
  return json({ ok: true, campaign: adminCampaignRowToJson(updated) });
}

async function readAdminCampaign(context, campaignId) {
  return context.env.LOCALCLAW_DB.prepare(`
    SELECT c.*, owner.id AS owner_user_id, owner.name AS owner_name, owner.email AS owner_email,
           cr.logo_alt_text, cr.creative_status, cr.logo_asset_key, cr.logo_sha256,
           cr.logo_width, cr.logo_height,
           reservation.id AS reservation_id, reservation.status AS reservation_status,
           reservation.blocks_until AS reservation_blocks_until,
           reservation.hold_expires_at AS reservation_hold_expires_at,
           COALESCE(metrics.impressions, 0) AS impressions,
           COALESCE(metrics.clicks, 0) AS clicks,
           COALESCE(uniques.unique_visitors, 0) AS unique_visitors,
           COALESCE(uniques.unique_clicks, 0) AS unique_clicks
    FROM sponsor_campaigns AS c
    JOIN user AS owner ON owner.id = c.user_id
    LEFT JOIN sponsor_campaign_creatives AS cr ON cr.campaign_id = c.id
    LEFT JOIN sponsor_inventory_reservations AS reservation ON reservation.campaign_id = c.id
    LEFT JOIN (
      SELECT campaign_id, SUM(impressions) AS impressions, SUM(clicks) AS clicks
      FROM sponsor_daily_metrics GROUP BY campaign_id
    ) AS metrics ON metrics.campaign_id = c.id
    LEFT JOIN (
      SELECT campaign_id,
             SUM(CASE WHEN event_type = 'impression' THEN 1 ELSE 0 END) AS unique_visitors,
             SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) AS unique_clicks
      FROM sponsor_campaign_metric_uniques GROUP BY campaign_id
    ) AS uniques ON uniques.campaign_id = c.id
    WHERE c.id = ?
  `).bind(campaignId).first();
}

function subscriptionPeriodEnd(subscription) {
  const direct = Number(subscription?.current_period_end || 0);
  const itemEnds = (subscription?.items?.data || []).map((item) => Number(item.current_period_end || 0));
  return Math.max(direct, ...itemEnds, 0);
}

function isStripeError(error) {
  return Boolean(error?.type || error?.raw || String(error?.name || "").startsWith("Stripe"));
}
