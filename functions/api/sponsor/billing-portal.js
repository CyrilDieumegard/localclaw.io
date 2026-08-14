import { getRequiredSession, json, requireSameOrigin } from "../../_lib/auth.js";
import { stripeClient } from "../../_lib/stripe.js";

export async function onRequestPost(context) {
  if (!requireSameOrigin(context.request)) return json({ ok: false, error: "invalid_origin" }, 403);
  const auth = await getRequiredSession(context);
  if (auth.response) return auth.response;
  const row = await context.env.LOCALCLAW_DB.prepare(`
    SELECT stripe_customer_id
    FROM sponsor_campaigns
    WHERE user_id = ? AND stripe_customer_id IS NOT NULL
    ORDER BY billing_updated_at DESC
    LIMIT 1
  `).bind(auth.session.user.id).first();
  if (!row?.stripe_customer_id) return json({ ok: false, error: "stripe_customer_not_found" }, 404);
  try {
    const origin = new URL(context.request.url).origin;
    const session = await stripeClient(context.env).billingPortal.sessions.create({
      customer: row.stripe_customer_id,
      return_url: `${origin}/account?view=sponsorship`
    });
    return json({ ok: true, portalUrl: session.url });
  } catch {
    return json({ ok: false, error: "billing_portal_unavailable", message: "Stripe billing management is temporarily unavailable." }, 503);
  }
}
