import { activeSponsorClickTarget, likelyAutomatedMetricRequest, recordSponsorMetric, sponsorVisitor } from "../../_lib/sponsor-analytics.js";

export async function onRequestGet(context) {
  try {
    const target = await activeSponsorClickTarget(context.env.LOCALCLAW_DB, context.params.campaignId);
    const visitor = sponsorVisitor(context.request);
    if (!likelyAutomatedMetricRequest(context.request)) {
      await recordSponsorMetric(context.env.LOCALCLAW_DB, {
        campaignId: target.campaignId,
        placementKey: target.placementKey,
        eventType: "click",
        visitorToken: visitor.token
      });
    }
    const headers = new Headers({
      Location: target.targetUrl,
      "Cache-Control": "no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff"
    });
    if (visitor.setCookie) headers.set("Set-Cookie", visitor.setCookie);
    return new Response(null, { status: 302, headers });
  } catch (error) {
    return new Response("Sponsor campaign not found.", {
      status: Number(error?.status || 404),
      headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}
