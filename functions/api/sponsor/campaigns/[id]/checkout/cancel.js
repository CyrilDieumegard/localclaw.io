import { getRequiredSession, json, requireSameOrigin } from "../../../../../_lib/auth.js";
import { stripeClient } from "../../../../../_lib/stripe.js";

export async function onRequestPost(context) {
  if (!requireSameOrigin(context.request)) return json({ ok: false, error: "invalid_origin" }, 403);
  const auth = await getRequiredSession(context);
  if (auth.response) return auth.response;
  const campaignId = String(context.params.id || "");
  const row = await context.env.LOCALCLAW_DB.prepare(`
    SELECT c.id, c.stripe_checkout_session_id, r.id AS reservation_id, r.status
    FROM sponsor_campaigns AS c
    JOIN sponsor_inventory_reservations AS r ON r.campaign_id = c.id
    WHERE c.id = ? AND c.user_id = ? AND c.billing_status = 'pending'
  `).bind(campaignId, auth.session.user.id).first();
  if (!row) return json({ ok: false, error: "checkout_hold_not_found" }, 404);
  if (row.stripe_checkout_session_id) {
    const stripe = stripeClient(context.env);
    const session = await stripe.checkout.sessions.retrieve(row.stripe_checkout_session_id);
    if (session.status === "complete") return json({ ok: false, error: "checkout_already_completed" }, 409);
    if (session.status === "open") await stripe.checkout.sessions.expire(session.id);
  }
  const now = new Date().toISOString();
  await context.env.LOCALCLAW_DB.batch([
    context.env.LOCALCLAW_DB.prepare(`
      UPDATE sponsor_inventory_reservations
      SET status = 'released', hold_expires_at = NULL, updated_at = ?
      WHERE id = ? AND status = 'held'
    `).bind(now, row.reservation_id),
    context.env.LOCALCLAW_DB.prepare(`
      UPDATE sponsor_campaigns
      SET status = 'draft', billing_status = 'not_configured', stripe_checkout_session_id = NULL,
          checkout_expires_at = NULL, billing_updated_at = ?, updated_at = ?, version = version + 1
      WHERE id = ? AND user_id = ? AND billing_status = 'pending'
    `).bind(now, now, campaignId, auth.session.user.id)
  ]);
  return json({ ok: true });
}
