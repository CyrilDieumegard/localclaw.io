import { requireSponsorLogoBucket } from "../../_lib/sponsor-logo.js";

export async function onRequestGet(context) {
  const campaignId = String(context.params.campaignId || "");
  if (!/^[0-9a-f-]{36}$/i.test(campaignId)) return notFound();
  const now = Math.floor(Date.now() / 1000);
  const row = await context.env.LOCALCLAW_DB.prepare(`
    SELECT cr.logo_asset_key, cr.logo_media_type, cr.logo_sha256
    FROM sponsor_campaign_creatives AS cr
    JOIN sponsor_campaigns AS c ON c.id = cr.campaign_id
    WHERE c.id = ? AND c.billing_status = 'paid'
      AND c.status IN ('scheduled', 'active')
      AND c.starts_at <= ? AND c.paid_through > ?
      AND cr.creative_status = 'approved'
  `).bind(campaignId, now, now).first();
  if (!row?.logo_asset_key) return notFound();
  const object = await requireSponsorLogoBucket(context.env).get(row.logo_asset_key);
  if (!object?.body) return notFound();
  const etag = object.httpEtag || `"${row.logo_sha256}"`;
  const headers = imageHeaders(row.logo_media_type, etag);
  if (context.request.headers.get("If-None-Match") === etag) return new Response(null, { status: 304, headers });
  return new Response(object.body, { status: 200, headers });
}

function imageHeaders(mediaType, etag) {
  return {
    "Cache-Control": "public, max-age=3600, immutable",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "Content-Type": mediaType,
    "Cross-Origin-Resource-Policy": "same-origin",
    ETag: etag,
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff"
  };
}

function notFound() {
  return new Response("Not Found", { status: 404, headers: { "Cache-Control": "no-store" } });
}
