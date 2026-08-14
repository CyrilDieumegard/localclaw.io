import { getRequiredSession, json, requireSameOrigin } from "../../../_lib/auth.js";
import {
  canCancelCampaign,
  canEditCampaign,
  campaignRowToJson,
  readSponsorJson,
  sponsorError,
  validateSponsorCampaign
} from "../../../_lib/sponsor-campaigns.js";

export async function onRequestPatch(context) {
  if (!requireSameOrigin(context.request)) return json({ ok: false, error: "invalid_origin" }, 403);
  const auth = await getRequiredSession(context);
  if (auth.response) return auth.response;

  const id = String(context.params.id || "");
  const existing = await getOwnedCampaign(context, auth.session.user.id, id);
  if (!existing) return json({ ok: false, error: "campaign_not_found" }, 404);

  const parsed = await readSponsorJson(context.request);
  if (parsed.response) return parsed.response;
  const action = String(parsed.value.action || "save").toLowerCase();

  try {
    if (action === "cancel") return cancelCampaign(context, auth.session.user.id, existing);
    if (!canEditCampaign(existing.status)) {
      return json({ ok: false, error: "campaign_locked", message: "This campaign is no longer editable." }, 409);
    }

    const merged = {
      campaignName: parsed.value.campaignName ?? existing.campaign_name,
      advertiserName: parsed.value.advertiserName ?? existing.advertiser_name,
      destinationUrl: parsed.value.destinationUrl ?? existing.destination_url,
      tagline: parsed.value.tagline ?? existing.tagline,
      ctaLabel: parsed.value.ctaLabel ?? existing.cta_label,
      placementKey: parsed.value.placementKey ?? existing.placement_key,
      requestedStartDate: parsed.value.requestedStartDate ?? existing.requested_start_date,
      requestedEndDate: parsed.value.requestedEndDate ?? existing.requested_end_date,
      logoAltText: parsed.value.logoAltText ?? existing.logo_alt_text
    };
    const validation = validateSponsorCampaign(merged, { requireComplete: action === "submit" });
    if (!validation.ok) {
      return json({ ok: false, error: "invalid_campaign", fields: validation.errors }, 422);
    }
    if (!new Set(["save", "submit"]).has(action)) {
      return json({ ok: false, error: "invalid_action" }, 422);
    }

    const campaign = validation.campaign;
    const nextStatus = action === "submit" ? "submitted" : existing.status;
    const now = new Date().toISOString();
    const eventType = action === "submit" ? "campaign_submitted" : "campaign_updated";
    const results = await context.env.LOCALCLAW_DB.batch([
      context.env.LOCALCLAW_DB.prepare(`
        UPDATE sponsor_campaigns
        SET campaign_name = ?, advertiser_name = ?, destination_url = ?, tagline = ?,
            cta_label = ?, placement_key = ?, requested_start_date = ?, requested_end_date = ?,
            status = ?, submitted_at = CASE WHEN ? = 'submitted' THEN ? ELSE submitted_at END,
            updated_at = ?, version = version + 1
        WHERE id = ? AND user_id = ? AND version = ?
      `).bind(
        campaign.campaignName, campaign.advertiserName, campaign.destinationUrl,
        campaign.tagline, campaign.ctaLabel, campaign.placementKey,
        campaign.requestedStartDate, campaign.requestedEndDate,
        nextStatus, nextStatus, now, now, id, auth.session.user.id, existing.version
      ),
      context.env.LOCALCLAW_DB.prepare(`
        UPDATE sponsor_campaign_creatives
        SET logo_alt_text = ?, updated_at = ?
        WHERE campaign_id = ? AND EXISTS (
          SELECT 1 FROM sponsor_campaigns
          WHERE id = ? AND user_id = ? AND updated_at = ? AND version = ?
        )
      `).bind(campaign.logoAltText, now, id, id, auth.session.user.id, now, Number(existing.version) + 1),
      context.env.LOCALCLAW_DB.prepare(`
        INSERT INTO sponsor_campaign_events (
          id, campaign_id, user_id, event_type, from_status, to_status, created_at
        )
        SELECT ?, ?, ?, ?, ?, ?, ?
        WHERE EXISTS (
          SELECT 1 FROM sponsor_campaigns
          WHERE id = ? AND user_id = ? AND updated_at = ? AND version = ?
        )
      `).bind(
        crypto.randomUUID(), id, auth.session.user.id, eventType, existing.status, nextStatus, now,
        id, auth.session.user.id, now, Number(existing.version) + 1
      )
    ]);

    if (!results[0]?.success || Number(results[0]?.meta?.changes || 0) !== 1) {
      return json({ ok: false, error: "campaign_conflict" }, 409);
    }
    const updated = await getOwnedCampaign(context, auth.session.user.id, id);
    return json({ ok: true, campaign: campaignRowToJson(updated) });
  } catch (error) {
    return sponsorError(error, "Could not update the sponsorship campaign.");
  }
}

async function cancelCampaign(context, userId, existing) {
  if (!canCancelCampaign(existing.status)) {
    return json({ ok: false, error: "campaign_locked", message: "This campaign cannot be cancelled from the account workspace." }, 409);
  }
  const now = new Date().toISOString();
  const results = await context.env.LOCALCLAW_DB.batch([
    context.env.LOCALCLAW_DB.prepare(`
      UPDATE sponsor_campaigns
      SET status = 'cancelled', updated_at = ?, version = version + 1
      WHERE id = ? AND user_id = ? AND version = ?
    `).bind(now, existing.id, userId, existing.version),
    context.env.LOCALCLAW_DB.prepare(`
      INSERT INTO sponsor_campaign_events (
        id, campaign_id, user_id, event_type, from_status, to_status, created_at
      )
      SELECT ?, ?, ?, 'campaign_cancelled', ?, 'cancelled', ?
      WHERE EXISTS (
        SELECT 1 FROM sponsor_campaigns
        WHERE id = ? AND user_id = ? AND updated_at = ? AND version = ?
      )
    `).bind(
      crypto.randomUUID(), existing.id, userId, existing.status, now,
      existing.id, userId, now, Number(existing.version) + 1
    )
  ]);
  if (!results[0]?.success || Number(results[0]?.meta?.changes || 0) !== 1) {
    return json({ ok: false, error: "campaign_conflict" }, 409);
  }
  const updated = await getOwnedCampaign(context, userId, existing.id);
  return json({ ok: true, campaign: campaignRowToJson(updated) });
}

async function getOwnedCampaign(context, userId, id) {
  return context.env.LOCALCLAW_DB.prepare(`
    SELECT c.*, cr.logo_alt_text, cr.creative_status
    FROM sponsor_campaigns c
    LEFT JOIN sponsor_campaign_creatives cr ON cr.campaign_id = c.id
    WHERE c.id = ? AND c.user_id = ?
  `).bind(id, userId).first();
}
