import { json } from "../../_lib/auth.js";
import { SPONSOR_PLACEMENTS } from "../../_lib/sponsor-campaigns.js";

export async function onRequestGet(context) {
  const enabled = String(context.env.SPONSOR_SERVING_ENABLED || "false").toLowerCase() === "true";
  const now = Math.floor(Date.now() / 1000);
  let rows = [];
  if (enabled) {
    const result = await context.env.LOCALCLAW_DB.prepare(`
      SELECT c.id, c.advertiser_name, c.tagline, c.cta_label, c.placement_key,
             c.starts_at, c.paid_through, cr.logo_alt_text, cr.logo_sha256
      FROM sponsor_campaigns AS c
      JOIN sponsor_campaign_creatives AS cr ON cr.campaign_id = c.id
      WHERE c.billing_status = 'paid'
        AND c.status IN ('scheduled', 'active')
        AND c.starts_at <= ? AND c.paid_through > ?
        AND cr.creative_status = 'approved'
        AND cr.logo_asset_key IS NOT NULL
      ORDER BY c.placement_key ASC, c.updated_at DESC
    `).bind(now, now).all();
    rows = result.results || [];
  }
  const activeByPlacement = new Map(rows.map((row) => [row.placement_key, row]));
  return json({
    ok: true,
    placements: SPONSOR_PLACEMENTS.map((placement) => {
      const campaign = activeByPlacement.get(placement.key);
      return {
        ...placement,
        availability: campaign ? "sponsored" : "available",
        campaign: campaign ? {
          id: campaign.id,
          advertiserName: campaign.advertiser_name,
          tagline: campaign.tagline,
          ctaLabel: campaign.cta_label,
          logoAltText: campaign.logo_alt_text || `${campaign.advertiser_name} logo`,
          logoUrl: `/sponsor/logo/${encodeURIComponent(campaign.id)}?v=${String(campaign.logo_sha256 || "").slice(0, 12)}`,
          clickUrl: `/sponsor/click/${encodeURIComponent(campaign.id)}`,
          startsAt: toIso(campaign.starts_at),
          endsAt: toIso(campaign.paid_through)
        } : null
      };
    })
  }, 200, { "CDN-Cache-Control": "no-store" });
}

function toIso(value) {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1000).toISOString() : null;
}
