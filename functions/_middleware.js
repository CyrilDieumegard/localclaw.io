import { trackAICrawlerRequest } from "./_vendor/datafast-ai-crawl-v1.0.9.mjs";

const DATAFAST_WEBSITE_ID = "dfid_ohBb9fpcjhfySeJJ6CAei";
const PRIVATE_PATHS = new Set([
  "/.assetsignore",
  "/.gitignore",
  "/README.md",
  "/all-amazon-links.md",
  "/amazon-links-updated.md",
  "/design-qa.md",
  "/SPONSOR_ACCOUNT_ARCHITECTURE.md",
  "/package-lock.json",
  "/package.json",
  "/test-amazon-links.html",
  "/wrangler.toml",
  "/functions/_middleware.js",
  "/migrations/0004_model_ratings.sql",
  "/migrations/0005_sponsor_workspace.sql",
  "/migrations/0006_sponsor_commerce.sql",
  "/scripts/check-seo.js",
  "/scripts/check-sponsor-workspace.js",
  "/functions/_lib/sponsor-campaigns.js",
  "/functions/_lib/sponsor-commerce.js",
  "/functions/_lib/sponsor-logo.js",
  "/functions/_lib/sponsor-analytics.js",
  "/functions/_lib/stripe.js",
  "/functions/api/sponsor/campaigns/index.js",
  "/functions/api/stripe/webhook.js",
  "/_check/hf-search-gemma4.json",
  "/images/model-logos/ATTRIBUTION.md",
  "/images/ram-gpu/ATTRIBUTION.md"
]);
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

  if (PRIVATE_PATHS.has(url.pathname)) {
    return new Response("Not Found", {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
        "Cloudflare-CDN-Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow, noarchive"
      }
    });
  }

  if (shouldTrackAICrawler(url.pathname)) {
    trackAICrawlerRequest(context.request, context, {
      websiteId: DATAFAST_WEBSITE_ID
    });
  }

  return context.next();
}
