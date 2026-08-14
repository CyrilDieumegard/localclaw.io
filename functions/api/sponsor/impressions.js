import { json, requireSameOrigin } from "../../_lib/auth.js";
import { MetricError, likelyAutomatedMetricRequest, recordSponsorMetric, sponsorVisitor } from "../../_lib/sponsor-analytics.js";

export async function onRequestPost(context) {
  if (!requireSameOrigin(context.request)) return json({ ok: false, error: "invalid_origin" }, 403);
  const contentLength = Number(context.request.headers.get("Content-Length") || 0);
  if (contentLength > 1024) return json({ ok: false, error: "payload_too_large" }, 413);
  let body;
  try { body = await context.request.json(); } catch { return json({ ok: false, error: "invalid_json" }, 400); }
  try {
    const visitor = sponsorVisitor(context.request);
    if (!likelyAutomatedMetricRequest(context.request)) {
      await recordSponsorMetric(context.env.LOCALCLAW_DB, {
        campaignId: body?.campaignId,
        placementKey: body?.placementKey,
        eventType: "impression",
        visitorToken: visitor.token
      });
    }
    return json({ ok: true, accepted: true }, 202, visitor.setCookie ? { "Set-Cookie": visitor.setCookie } : {});
  } catch (error) {
    if (error instanceof MetricError) return json({ ok: false, error: error.code }, error.status);
    return json({ ok: false, error: "metric_recording_failed" }, 503);
  }
}
