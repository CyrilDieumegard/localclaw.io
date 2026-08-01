import { trackAICrawlerRequest } from "./_vendor/datafast-ai-crawl-v1.0.9.mjs";

const DATAFAST_WEBSITE_ID = "dfid_ohBb9fpcjhfySeJJ6CAei";
const SKIP_PREFIXES = [
  "/api/",
  "/cdn-cgi/",
  "/css/",
  "/downloads/",
  "/images/",
  "/js/"
];
const SKIP_EXTENSIONS = /\.(?:avif|css|gif|ico|jpg|jpeg|js|json|map|png|svg|webp)$/i;

function shouldTrackAICrawler(pathname) {
  if (SKIP_PREFIXES.some(prefix => pathname.startsWith(prefix))) return false;
  if (SKIP_EXTENSIONS.test(pathname)) return false;
  return true;
}

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (shouldTrackAICrawler(url.pathname)) {
    trackAICrawlerRequest(context.request, context, {
      websiteId: DATAFAST_WEBSITE_ID
    });
  }

  return context.next();
}
