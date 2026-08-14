import { getRequiredSession, json, requireSameOrigin } from "../../../../_lib/auth.js";
import {
  SponsorLogoError,
  readSponsorLogoBody,
  requireSponsorLogoBucket,
  sponsorLogoObjectKey,
  validateSponsorLogo
} from "../../../../_lib/sponsor-logo.js";

export async function onRequestGet(context) {
  const auth = await getRequiredSession(context);
  if (auth.response) return auth.response;
  const campaign = await ownedCampaign(context, auth.session.user.id);
  if (!campaign?.logo_asset_key) return json({ ok: false, error: "sponsor_logo_not_found" }, 404);
  const object = await requireSponsorLogoBucket(context.env).get(campaign.logo_asset_key);
  if (!object?.body) return json({ ok: false, error: "sponsor_logo_not_found" }, 404);
  return new Response(object.body, {
    status: 200,
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Content-Type": campaign.logo_media_type,
      "Cross-Origin-Resource-Policy": "same-origin",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

export async function onRequestPut(context) {
  if (!requireSameOrigin(context.request)) return json({ ok: false, error: "invalid_origin" }, 403);
  const auth = await getRequiredSession(context);
  if (auth.response) return auth.response;
  const campaign = await ownedCampaign(context, auth.session.user.id);
  if (!campaign) return json({ ok: false, error: "campaign_not_found" }, 404);
  if (!new Set(["draft", "changes_requested"]).has(campaign.status)) {
    return json({ ok: false, error: "campaign_locked", message: "The logo is locked after checkout begins." }, 409);
  }
  try {
    const bytes = await readSponsorLogoBody(context.request);
    const logo = await validateSponsorLogo(bytes, context.request.headers.get("Content-Type"));
    const bucket = requireSponsorLogoBucket(context.env);
    const objectKey = sponsorLogoObjectKey(campaign.id, logo);
    await bucket.put(objectKey, bytes, {
      httpMetadata: { contentType: logo.mediaType, cacheControl: "public, max-age=3600, immutable" },
      customMetadata: { campaignId: campaign.id, userId: auth.session.user.id, sha256: logo.sha256 }
    });
    const now = new Date().toISOString();
    try {
      await context.env.LOCALCLAW_DB.prepare(`
        UPDATE sponsor_campaign_creatives
        SET logo_asset_key = ?, logo_media_type = ?, logo_size_bytes = ?,
            logo_width = ?, logo_height = ?, logo_sha256 = ?, logo_uploaded_at = ?,
            creative_status = 'draft', updated_at = ?
        WHERE campaign_id = ?
      `).bind(
        objectKey, logo.mediaType, logo.sizeBytes, logo.width, logo.height,
        logo.sha256, now, now, campaign.id
      ).run();
    } catch (error) {
      await bucket.delete(objectKey);
      throw error;
    }
    if (campaign.logo_asset_key && campaign.logo_asset_key !== objectKey) {
      context.waitUntil(bucket.delete(campaign.logo_asset_key));
    }
    return json({
      ok: true,
      logo: {
        url: `/api/sponsor/campaigns/${encodeURIComponent(campaign.id)}/logo?v=${logo.sha256.slice(0, 12)}`,
        mediaType: logo.mediaType,
        sizeBytes: logo.sizeBytes,
        width: logo.width,
        height: logo.height
      }
    });
  } catch (error) {
    if (error instanceof SponsorLogoError) return json({ ok: false, error: error.code, message: error.message }, error.status);
    if (String(error?.message || "").includes("storage_unavailable")) {
      return json({ ok: false, error: "sponsor_logo_storage_unavailable", message: "Logo storage is not configured yet." }, 503);
    }
    return json({ ok: false, error: "sponsor_logo_upload_failed", message: "The logo could not be stored safely." }, 500);
  }
}

export async function onRequestDelete(context) {
  if (!requireSameOrigin(context.request)) return json({ ok: false, error: "invalid_origin" }, 403);
  const auth = await getRequiredSession(context);
  if (auth.response) return auth.response;
  const campaign = await ownedCampaign(context, auth.session.user.id);
  if (!campaign) return json({ ok: false, error: "campaign_not_found" }, 404);
  if (!new Set(["draft", "changes_requested"]).has(campaign.status)) return json({ ok: false, error: "campaign_locked" }, 409);
  await context.env.LOCALCLAW_DB.prepare(`
    UPDATE sponsor_campaign_creatives
    SET logo_asset_key = NULL, logo_media_type = NULL, logo_size_bytes = NULL,
        logo_width = NULL, logo_height = NULL, logo_sha256 = NULL, logo_uploaded_at = NULL,
        creative_status = 'missing', updated_at = ?
    WHERE campaign_id = ?
  `).bind(new Date().toISOString(), campaign.id).run();
  if (campaign.logo_asset_key) context.waitUntil(requireSponsorLogoBucket(context.env).delete(campaign.logo_asset_key));
  return json({ ok: true });
}

async function ownedCampaign(context, userId) {
  return context.env.LOCALCLAW_DB.prepare(`
    SELECT c.id, c.status, cr.logo_asset_key, cr.logo_media_type
    FROM sponsor_campaigns AS c
    JOIN sponsor_campaign_creatives AS cr ON cr.campaign_id = c.id
    WHERE c.id = ? AND c.user_id = ?
  `).bind(String(context.params.id || ""), userId).first();
}
