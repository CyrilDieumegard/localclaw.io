import { json } from "../../../_lib/auth.js";
import { adminCampaignRowToJson, getRequiredSponsorAdmin } from "../../../_lib/sponsor-admin.js";

export async function onRequestGet(context) {
  const admin = await getRequiredSponsorAdmin(context);
  if (admin.response) return admin.response;

  try {
    const [campaignResult, dailyResult, uniqueResult, actionResult] = await context.env.LOCALCLAW_DB.batch([
      context.env.LOCALCLAW_DB.prepare(`
        WITH metric_totals AS (
          SELECT campaign_id, SUM(impressions) AS impressions, SUM(clicks) AS clicks
          FROM sponsor_daily_metrics
          GROUP BY campaign_id
        ), unique_totals AS (
          SELECT campaign_id,
                 SUM(CASE WHEN event_type = 'impression' THEN 1 ELSE 0 END) AS unique_visitors,
                 SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) AS unique_clicks
          FROM sponsor_campaign_metric_uniques
          GROUP BY campaign_id
        )
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
        LEFT JOIN metric_totals AS metrics ON metrics.campaign_id = c.id
        LEFT JOIN unique_totals AS uniques ON uniques.campaign_id = c.id
        ORDER BY c.updated_at DESC
        LIMIT 250
      `),
      context.env.LOCALCLAW_DB.prepare(`
        SELECT metric_date,
               SUM(impressions) AS impressions,
               SUM(unique_impressions) AS unique_visitors,
               SUM(clicks) AS clicks,
               SUM(unique_clicks) AS unique_clicks
        FROM sponsor_daily_metrics
        WHERE metric_date >= date('now', '-29 days')
        GROUP BY metric_date
        ORDER BY metric_date ASC
      `),
      context.env.LOCALCLAW_DB.prepare(`
        SELECT
          COUNT(DISTINCT CASE WHEN event_type = 'impression' THEN visitor_hash END) AS unique_visitors,
          COUNT(DISTINCT CASE WHEN event_type = 'click' THEN visitor_hash END) AS unique_clicks
        FROM sponsor_campaign_metric_uniques
      `),
      context.env.LOCALCLAW_DB.prepare(`
        SELECT action.id, action.campaign_id, action.admin_email, action.action_type,
               action.from_status, action.to_status, action.previous_paid_through,
               action.next_paid_through, action.details_json, action.created_at,
               campaign.campaign_name
        FROM sponsor_admin_actions AS action
        JOIN sponsor_campaigns AS campaign ON campaign.id = action.campaign_id
        ORDER BY action.created_at DESC
        LIMIT 40
      `)
    ]);

    const campaigns = (campaignResult.results || []).map(adminCampaignRowToJson);
    const impressions = campaigns.reduce((total, campaign) => total + Number(campaign.analytics.impressions || 0), 0);
    const clicks = campaigns.reduce((total, campaign) => total + Number(campaign.analytics.clicks || 0), 0);
    const uniqueRow = uniqueResult.results?.[0] || {};
    return json({
      ok: true,
      admin: { email: admin.email },
      summary: {
        campaigns: campaigns.length,
        paidCampaigns: campaigns.filter((campaign) => campaign.billing.status === "paid").length,
        active: campaigns.filter((campaign) => campaign.status === "active").length,
        scheduled: campaigns.filter((campaign) => campaign.status === "scheduled").length,
        visibleImpressions: impressions,
        uniqueVisitors: Number(uniqueRow.unique_visitors || 0),
        clicks,
        uniqueClicks: Number(uniqueRow.unique_clicks || 0),
        ctrPercent: impressions > 0 ? Math.round((clicks / impressions) * 10_000) / 100 : null
      },
      daily: (dailyResult.results || []).map((row) => ({
        date: row.metric_date,
        visibleImpressions: Number(row.impressions || 0),
        uniqueVisitors: Number(row.unique_visitors || 0),
        clicks: Number(row.clicks || 0),
        uniqueClicks: Number(row.unique_clicks || 0)
      })),
      campaigns,
      recentActions: (actionResult.results || []).map(actionToJson)
    });
  } catch {
    return json({ ok: false, error: "sponsor_admin_overview_unavailable" }, 503);
  }
}

function actionToJson(row) {
  let details = {};
  try { details = JSON.parse(row.details_json || "{}"); } catch {}
  return {
    id: row.id,
    campaignId: row.campaign_id,
    campaignName: row.campaign_name,
    adminEmail: row.admin_email,
    action: row.action_type,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    previousPaidThrough: toIso(row.previous_paid_through),
    nextPaidThrough: toIso(row.next_paid_through),
    note: details.note || null,
    createdAt: row.created_at
  };
}

function toIso(value) {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1000).toISOString() : null;
}
