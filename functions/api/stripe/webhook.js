import { json } from "../../_lib/auth.js";
import { expectedStripeLivemode, stripeClient, stripeCryptoProvider, stripeWebhookSecret } from "../../_lib/stripe.js";

export async function onRequestPost(context) {
  const declaredLength = Number(context.request.headers.get("Content-Length") || 0);
  if (declaredLength > 1_048_576) return json({ ok: false, error: "payload_too_large" }, 413);
  const signature = context.request.headers.get("Stripe-Signature");
  if (!signature) return json({ ok: false, error: "stripe_signature_missing" }, 400);
  let event;
  try {
    const rawBody = await context.request.text();
    event = await stripeClient(context.env).webhooks.constructEventAsync(
      rawBody,
      signature,
      stripeWebhookSecret(context.env),
      undefined,
      stripeCryptoProvider()
    );
  } catch {
    return json({ ok: false, error: "stripe_signature_invalid" }, 400);
  }
  if (Boolean(event.livemode) !== expectedStripeLivemode(context.env)) {
    return json({ ok: false, error: "stripe_mode_mismatch" }, 400);
  }

  const claimed = await claimEvent(context, event);
  if (!claimed) return json({ ok: true, duplicate: true });
  try {
    await processEvent(context, event);
    await context.env.LOCALCLAW_DB.prepare(`
      UPDATE sponsor_stripe_events
      SET status = 'processed', processed_at = ?, error_code = NULL
      WHERE event_id = ?
    `).bind(new Date().toISOString(), event.id).run();
    return json({ ok: true, received: true });
  } catch (error) {
    await context.env.LOCALCLAW_DB.prepare(`
      UPDATE sponsor_stripe_events
      SET status = 'failed', error_code = ?
      WHERE event_id = ?
    `).bind(safeErrorCode(error), event.id).run();
    return json({ ok: false, error: "stripe_event_processing_failed" }, 500);
  }
}

async function claimEvent(context, event) {
  const existing = await context.env.LOCALCLAW_DB.prepare(`
    SELECT status FROM sponsor_stripe_events WHERE event_id = ?
  `).bind(event.id).first();
  if (existing?.status === "processed" || existing?.status === "processing") return false;
  if (existing?.status === "failed") {
    const result = await context.env.LOCALCLAW_DB.prepare(`
      UPDATE sponsor_stripe_events SET status = 'processing', error_code = NULL WHERE event_id = ? AND status = 'failed'
    `).bind(event.id).run();
    return Number(result?.meta?.changes || 0) === 1;
  }
  const result = await context.env.LOCALCLAW_DB.prepare(`
    INSERT OR IGNORE INTO sponsor_stripe_events (
      event_id, event_type, livemode, object_id, status, received_at
    ) VALUES (?, ?, ?, ?, 'processing', ?)
  `).bind(
    event.id,
    event.type,
    event.livemode ? 1 : 0,
    objectId(event.data?.object),
    new Date().toISOString()
  ).run();
  return Number(result?.meta?.changes || 0) === 1;
}

async function processEvent(context, event) {
  const object = event.data?.object || {};
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      if (object.payment_status === "paid") await completeCheckout(context, object, event.id);
      return;
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed":
      await expireCheckout(context, object, event.id);
      return;
    case "invoice.paid":
      await recordRenewalPayment(context, object, event.id);
      return;
    case "invoice.payment_failed":
      await recordRenewalFailure(context, object, event.id);
      return;
    case "customer.subscription.updated":
      await syncSubscription(context, object, event.id, false);
      return;
    case "customer.subscription.deleted":
      await syncSubscription(context, object, event.id, true);
      return;
    case "charge.refunded":
      if (Number(object.amount_refunded || 0) >= Number(object.amount || 0)) {
        await stopRefundedCampaign(context, object, event.id);
      }
      return;
    case "charge.dispute.created":
      await stopDisputedCampaign(context, object, event.id);
      return;
    default:
      return;
  }
}

async function completeCheckout(context, session, stripeEventId) {
  const campaignId = metadataValue(session, "localclaw_campaign_id");
  const reservationId = metadataValue(session, "localclaw_reservation_id");
  if (!campaignId || !reservationId) return;
  const campaign = await context.env.LOCALCLAW_DB.prepare(`
    SELECT id, status, billing_status, price_cents, currency, starts_at, ends_at,
           auto_renew, stripe_checkout_session_id
    FROM sponsor_campaigns WHERE id = ?
  `).bind(campaignId).first();
  if (!campaign || campaign.stripe_checkout_session_id !== session.id) throw new Error("checkout_campaign_mismatch");
  if (Number(session.amount_total) !== Number(campaign.price_cents) || String(session.currency) !== String(campaign.currency)) {
    throw new Error("checkout_amount_mismatch");
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  const nextStatus = Number(campaign.starts_at) <= nowSeconds ? "active" : "scheduled";
  const now = new Date().toISOString();
  const customerId = stripeId(session.customer);
  const subscriptionId = stripeId(session.subscription);
  const subscriptionStatus = subscriptionId ? "trialing" : null;
  const details = JSON.stringify({ stripeEventId, checkoutSessionId: session.id, subscriptionId });
  await context.env.LOCALCLAW_DB.batch([
    context.env.LOCALCLAW_DB.prepare(`
      UPDATE sponsor_campaigns
      SET billing_status = 'paid', status = ?, paid_through = ends_at,
          stripe_customer_id = COALESCE(?, stripe_customer_id),
          stripe_subscription_id = COALESCE(?, stripe_subscription_id),
          stripe_subscription_status = COALESCE(?, stripe_subscription_status),
          billing_updated_at = ?, updated_at = ?, version = version + 1
      WHERE id = ? AND stripe_checkout_session_id = ?
        AND billing_status IN ('pending', 'paid')
    `).bind(nextStatus, customerId, subscriptionId, subscriptionStatus, now, now, campaignId, session.id),
    context.env.LOCALCLAW_DB.prepare(`
      UPDATE sponsor_inventory_reservations
      SET status = 'sold', hold_expires_at = NULL, stripe_checkout_session_id = ?, updated_at = ?
      WHERE id = ? AND campaign_id = ? AND status IN ('held', 'sold')
    `).bind(session.id, now, reservationId, campaignId),
    context.env.LOCALCLAW_DB.prepare(`
      UPDATE sponsor_campaign_creatives
      SET creative_status = 'approved', updated_at = ?
      WHERE campaign_id = ? AND logo_asset_key IS NOT NULL
    `).bind(now, campaignId),
    context.env.LOCALCLAW_DB.prepare(`
      INSERT INTO sponsor_campaign_events (
        id, campaign_id, event_type, from_status, to_status, details_json, created_at
      ) VALUES (?, ?, 'stripe_checkout_paid', ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), campaignId, campaign.status, nextStatus, details, now)
  ]);
}

async function expireCheckout(context, session, stripeEventId) {
  const now = new Date().toISOString();
  const campaign = await context.env.LOCALCLAW_DB.prepare(`
    SELECT id, status FROM sponsor_campaigns
    WHERE stripe_checkout_session_id = ? AND billing_status = 'pending'
  `).bind(session.id).first();
  if (!campaign) return;
  await context.env.LOCALCLAW_DB.batch([
    context.env.LOCALCLAW_DB.prepare(`
      UPDATE sponsor_inventory_reservations
      SET status = 'expired', hold_expires_at = NULL, updated_at = ?
      WHERE campaign_id = ? AND stripe_checkout_session_id = ? AND status = 'held'
    `).bind(now, campaign.id, session.id),
    context.env.LOCALCLAW_DB.prepare(`
      UPDATE sponsor_campaigns
      SET status = 'draft', billing_status = 'not_configured',
          stripe_checkout_session_id = NULL, checkout_expires_at = NULL,
          billing_updated_at = ?, updated_at = ?, version = version + 1
      WHERE id = ? AND billing_status = 'pending'
    `).bind(now, now, campaign.id),
    context.env.LOCALCLAW_DB.prepare(`
      INSERT INTO sponsor_campaign_events (
        id, campaign_id, event_type, from_status, to_status, details_json, created_at
      ) VALUES (?, ?, 'stripe_checkout_expired', ?, 'draft', ?, ?)
    `).bind(crypto.randomUUID(), campaign.id, campaign.status, JSON.stringify({ stripeEventId, checkoutSessionId: session.id }), now)
  ]);
}

async function recordRenewalPayment(context, invoice, stripeEventId) {
  if (String(invoice.billing_reason || "") === "subscription_create") return;
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return;
  const campaign = await context.env.LOCALCLAW_DB.prepare(`
    SELECT id, status, starts_at, paid_through, auto_renew
    FROM sponsor_campaigns WHERE stripe_subscription_id = ?
  `).bind(subscriptionId).first();
  if (!campaign || !campaign.auto_renew) return;
  const periodEnd = invoicePeriodEnd(invoice);
  if (!periodEnd || periodEnd <= Number(campaign.paid_through || 0)) return;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const nextStatus = Number(campaign.starts_at) <= nowSeconds ? "active" : "scheduled";
  const now = new Date().toISOString();
  await context.env.LOCALCLAW_DB.batch([
    context.env.LOCALCLAW_DB.prepare(`
      UPDATE sponsor_campaigns
      SET billing_status = 'paid', status = ?, paid_through = ?,
          stripe_subscription_status = 'active', stripe_cancel_at_period_end = 0,
          billing_updated_at = ?, updated_at = ?, version = version + 1
      WHERE id = ? AND stripe_subscription_id = ?
    `).bind(nextStatus, periodEnd, now, now, campaign.id, subscriptionId),
    context.env.LOCALCLAW_DB.prepare(`
      INSERT INTO sponsor_campaign_events (
        id, campaign_id, event_type, from_status, to_status, details_json, created_at
      ) VALUES (?, ?, 'stripe_renewal_paid', ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), campaign.id, campaign.status, nextStatus, JSON.stringify({ stripeEventId, invoiceId: invoice.id, paidThrough: periodEnd }), now)
  ]);
}

async function recordRenewalFailure(context, invoice, stripeEventId) {
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return;
  const campaign = await context.env.LOCALCLAW_DB.prepare(`
    SELECT id, status FROM sponsor_campaigns WHERE stripe_subscription_id = ?
  `).bind(subscriptionId).first();
  if (!campaign) return;
  const now = new Date().toISOString();
  await context.env.LOCALCLAW_DB.batch([
    context.env.LOCALCLAW_DB.prepare(`
      UPDATE sponsor_campaigns
      SET billing_status = 'failed', stripe_subscription_status = 'past_due',
          billing_updated_at = ?, updated_at = ?, version = version + 1
      WHERE id = ?
    `).bind(now, now, campaign.id),
    context.env.LOCALCLAW_DB.prepare(`
      INSERT INTO sponsor_campaign_events (
        id, campaign_id, event_type, from_status, to_status, details_json, created_at
      ) VALUES (?, ?, 'stripe_renewal_failed', ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), campaign.id, campaign.status, campaign.status, JSON.stringify({ stripeEventId, invoiceId: invoice.id }), now)
  ]);
}

async function syncSubscription(context, subscription, stripeEventId, deleted) {
  const campaign = await context.env.LOCALCLAW_DB.prepare(`
    SELECT id, status, paid_through FROM sponsor_campaigns WHERE stripe_subscription_id = ?
  `).bind(subscription.id).first();
  if (!campaign) return;
  const cancelAtPeriodEnd = deleted || Boolean(subscription.cancel_at_period_end);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const paidThrough = Math.max(Number(campaign.paid_through || 0), subscriptionPeriodEnd(subscription));
  const completed = deleted && paidThrough <= nowSeconds;
  const nextStatus = completed ? "completed" : campaign.status;
  const now = new Date().toISOString();
  await context.env.LOCALCLAW_DB.batch([
    context.env.LOCALCLAW_DB.prepare(`
      UPDATE sponsor_campaigns
      SET auto_renew = ?, stripe_subscription_status = ?, stripe_cancel_at_period_end = ?,
          paid_through = CASE WHEN ? > COALESCE(paid_through, 0) THEN ? ELSE paid_through END,
          status = ?, billing_updated_at = ?, updated_at = ?, version = version + 1
      WHERE id = ?
    `).bind(deleted ? 0 : 1, String(subscription.status || (deleted ? "canceled" : "unknown")), cancelAtPeriodEnd ? 1 : 0, paidThrough, paidThrough, nextStatus, now, now, campaign.id),
    context.env.LOCALCLAW_DB.prepare(`
      UPDATE sponsor_inventory_reservations
      SET auto_renew = ?, blocks_until = CASE WHEN ? = 1 THEN ? ELSE blocks_until END, updated_at = ?
      WHERE campaign_id = ? AND status = 'sold'
    `).bind(deleted ? 0 : 1, cancelAtPeriodEnd ? 1 : 0, paidThrough, now, campaign.id),
    context.env.LOCALCLAW_DB.prepare(`
      INSERT INTO sponsor_campaign_events (
        id, campaign_id, event_type, from_status, to_status, details_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), campaign.id, deleted ? 'stripe_subscription_deleted' : 'stripe_subscription_updated', campaign.status, nextStatus, JSON.stringify({ stripeEventId, cancelAtPeriodEnd, paidThrough }), now)
  ]);
}

async function stopRefundedCampaign(context, charge, stripeEventId) {
  const resolved = await campaignFromCharge(context, charge);
  if (!resolved) return;
  await stopCampaign(context, resolved, "refunded", "stripe_charge_refunded", stripeEventId);
  if (resolved.subscriptionId) {
    try { await stripeClient(context.env).subscriptions.cancel(resolved.subscriptionId); } catch {}
  }
}

async function stopDisputedCampaign(context, dispute, stripeEventId) {
  const chargeId = stripeId(dispute.charge);
  if (!chargeId) return;
  const charge = await stripeClient(context.env).charges.retrieve(chargeId);
  const resolved = await campaignFromCharge(context, charge);
  if (resolved) await stopCampaign(context, resolved, "failed", "stripe_dispute_created", stripeEventId);
}

async function campaignFromCharge(context, charge) {
  let campaignId = metadataValue(charge, "localclaw_campaign_id");
  let subscriptionId = null;
  if (!campaignId && charge.payment_intent) {
    const paymentIntent = await stripeClient(context.env).paymentIntents.retrieve(stripeId(charge.payment_intent));
    campaignId = metadataValue(paymentIntent, "localclaw_campaign_id");
  }
  if (!campaignId && charge.invoice) {
    const invoice = await stripeClient(context.env).invoices.retrieve(stripeId(charge.invoice));
    subscriptionId = invoiceSubscriptionId(invoice);
    if (subscriptionId) {
      const row = await context.env.LOCALCLAW_DB.prepare(`SELECT id FROM sponsor_campaigns WHERE stripe_subscription_id = ?`).bind(subscriptionId).first();
      campaignId = row?.id || "";
    }
  }
  if (!campaignId) return null;
  const campaign = await context.env.LOCALCLAW_DB.prepare(`SELECT id, status, stripe_subscription_id FROM sponsor_campaigns WHERE id = ?`).bind(campaignId).first();
  return campaign ? { ...campaign, subscriptionId: campaign.stripe_subscription_id || subscriptionId } : null;
}

async function stopCampaign(context, campaign, billingStatus, eventType, stripeEventId) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const now = new Date().toISOString();
  await context.env.LOCALCLAW_DB.batch([
    context.env.LOCALCLAW_DB.prepare(`
      UPDATE sponsor_campaigns
      SET billing_status = ?, status = 'cancelled', auto_renew = 0, paid_through = ?,
          billing_updated_at = ?, updated_at = ?, version = version + 1
      WHERE id = ?
    `).bind(billingStatus, nowSeconds, now, now, campaign.id),
    context.env.LOCALCLAW_DB.prepare(`
      UPDATE sponsor_inventory_reservations
      SET status = 'released', auto_renew = 0, blocks_until = ?, updated_at = ?
      WHERE campaign_id = ?
    `).bind(nowSeconds, now, campaign.id),
    context.env.LOCALCLAW_DB.prepare(`
      INSERT INTO sponsor_campaign_events (
        id, campaign_id, event_type, from_status, to_status, details_json, created_at
      ) VALUES (?, ?, ?, ?, 'cancelled', ?, ?)
    `).bind(crypto.randomUUID(), campaign.id, eventType, campaign.status, JSON.stringify({ stripeEventId }), now)
  ]);
}

function invoiceSubscriptionId(invoice) {
  return stripeId(invoice.subscription) || stripeId(invoice.parent?.subscription_details?.subscription);
}

function invoicePeriodEnd(invoice) {
  const direct = Number(invoice.period_end || 0);
  const lineEnds = (invoice.lines?.data || []).map((line) => Number(line.period?.end || 0));
  return Math.max(direct, ...lineEnds, 0);
}

function subscriptionPeriodEnd(subscription) {
  const direct = Number(subscription.current_period_end || 0);
  const itemEnds = (subscription.items?.data || []).map((item) => Number(item.current_period_end || 0));
  return Math.max(direct, ...itemEnds, 0);
}

function metadataValue(object, key) {
  return String(object?.metadata?.[key] || "").trim();
}

function stripeId(value) {
  if (typeof value === "string") return value;
  return value && typeof value.id === "string" ? value.id : null;
}

function objectId(value) {
  return value && typeof value.id === "string" ? value.id : null;
}

function safeErrorCode(error) {
  return String(error?.message || "stripe_event_error").replace(/[^a-zA-Z0-9_.:-]/g, "_").slice(0, 120);
}
