import { trackAICrawlerRequest } from "@datafast/ai-crawl";

const DATAFAST_WEBSITE_ID = "dfid_ohBb9fpcjhfySeJJ6CAei";

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (!url.pathname.startsWith("/api/")) {
    trackAICrawlerRequest(context.request, context, {
      websiteId: DATAFAST_WEBSITE_ID
    });
  }

  return context.next();
}
