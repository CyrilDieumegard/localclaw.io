import { getRequiredSession, json, requireSameOrigin } from "../../../_lib/auth.js";
import {
  MAX_SPONSOR_CAMPAIGNS_PER_ACCOUNT,
  campaignRowToJson,
  readSponsorJson,
  sponsorError,
  validateSponsorCampaign
} from "../../../_lib/sponsor-campaigns.js";

const CAMPAIGN_COLUMNS = `
  c.id, c.campaign_name, c.advertiser_name, c.destination_url, c.tagline,
  c.cta_label, c.placement_key, c.requested_start_date, c.requested_end_date,
  c.status, c.review_note, c.billing_status, c.created_at, c.updated_at,
  c.submitted_at, c.version, c.plan_key, c.starts_at, c.ends_at, c.paid_through,
  c.auto_renew, c.price_cents, c.currency, c.stripe_customer_id,
  c.stripe_subscription_id, c.stripe_subscription_status,
  c.stripe_cancel_at_period_end, c.checkout_expires_at,
  cr.logo_alt_text, cr.creative_status, cr.logo_asset_key, cr.logo_sha256,
  cr.logo_width, cr.logo_height
`;

export async function onRequestGet(context) {
  const auth = await getRequiredSession(context);
  if (auth.response) return auth.response;

  try {
    const [campaignResult, metricResult] = await Promise.all([
      context.env.LOCALCLAW_DB.prepare(`
        SELECT ${CAMPAIGN_COLUMNS}
        FROM sponsor_campaigns c
        LEFT JOIN sponsor_campaign_creatives cr ON cr.campaign_id = c.id
        WHERE c.user_id = ?
        ORDER BY c.updated_at DESC
      `).bind(auth.session.user.id).all(),
      context.env.LOCALCLAW_DB.prepare(`
        SELECT m.campaign_id,
               SUM(m.impressions) AS impressions,
               SUM(m.clicks) AS clicks,
               COALESCE(u.unique_visitors, 0) AS unique_visitors,
               COALESCE(u.unique_clicks, 0) AS unique_clicks
        FROM sponsor_daily_metrics m
        JOIN sponsor_campaigns c ON c.id = m.campaign_id
        LEFT JOIN (
          SELECT campaign_id,
                 SUM(CASE WHEN event_type = 'impression' THEN 1 ELSE 0 END) AS unique_visitors,
                 SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) AS unique_clicks
          FROM sponsor_campaign_metric_uniques
          GROUP BY campaign_id
        ) u ON u.campaign_id = m.campaign_id
        WHERE c.user_id = ?
        GROUP BY m.campaign_id, u.unique_visitors, u.unique_clicks
      `).bind(auth.session.user.id).all()
    ]);
    const metrics = new Map((metricResult.results || []).map((row) => [row.campaign_id, row]));
    return json({
      ok: true,
      campaigns: (campaignResult.results || []).map((row) => campaignRowToJson(row, metrics.get(row.id)))
    });
  } catch (error) {
    return sponsorError(error, "Could not load sponsorship campaigns.");
  }
}

export async function onRequestPost(context) {
  if (!requireSameOrigin(context.request)) return json({ ok: false, error: "invalid_origin" }, 403);
  const auth = await getRequiredSession(context);
  if (auth.response) return auth.response;

  const parsed = await readSponsorJson(context.request);
  if (parsed.response) return parsed.response;
  const validation = validateSponsorCampaign(parsed.value);
  if (!validation.ok) {
    return json({ ok: false, error: "invalid_campaign", fields: validation.errors }, 422);
  }

  try {
    const countRow = await context.env.LOCALCLAW_DB.prepare(
      "SELECT COUNT(*) AS count FROM sponsor_campaigns WHERE user_id = ? AND status NOT IN ('completed', 'cancelled')"
    ).bind(auth.session.user.id).first();
    if (Number(countRow?.count || 0) >= MAX_SPONSOR_CAMPAIGNS_PER_ACCOUNT) {
      return json({ ok: false, error: "campaign_limit_reached" }, 409);
    }

    const id = crypto.randomUUID();
    const eventId = crypto.randomUUID();
    const now = new Date().toISOString();
    const campaign = validation.campaign;
    await context.env.LOCALCLAW_DB.batch([
      context.env.LOCALCLAW_DB.prepare(`
        INSERT INTO sponsor_campaigns (
          id, user_id, campaign_name, advertiser_name, destination_url, tagline,
          cta_label, placement_key, requested_start_date, requested_end_date,
          status, billing_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 'not_configured', ?, ?)
      `).bind(
        id, auth.session.user.id, campaign.campaignName, campaign.advertiserName,
        campaign.destinationUrl, campaign.tagline, campaign.ctaLabel, campaign.placementKey,
        campaign.requestedStartDate, campaign.requestedEndDate, now, now
      ),
      context.env.LOCALCLAW_DB.prepare(`
        INSERT INTO sponsor_campaign_creatives (
          campaign_id, logo_alt_text, creative_status, created_at, updated_at
        ) VALUES (?, ?, 'missing', ?, ?)
      `).bind(id, campaign.logoAltText, now, now),
      context.env.LOCALCLAW_DB.prepare(`
        INSERT INTO sponsor_campaign_events (
          id, campaign_id, user_id, event_type, to_status, created_at
        ) VALUES (?, ?, ?, 'campaign_created', 'draft', ?)
      `).bind(eventId, id, auth.session.user.id, now)
    ]);

    const row = await findOwnedCampaign(context, auth.session.user.id, id);
    return json({ ok: true, campaign: campaignRowToJson(row) }, 201);
  } catch (error) {
    return sponsorError(error, "Could not create the sponsorship draft.");
  }
}

async function findOwnedCampaign(context, userId, id) {
  return context.env.LOCALCLAW_DB.prepare(`
    SELECT ${CAMPAIGN_COLUMNS}
    FROM sponsor_campaigns c
    LEFT JOIN sponsor_campaign_creatives cr ON cr.campaign_id = c.id
    WHERE c.user_id = ? AND c.id = ?
  `).bind(userId, id).first();
}
