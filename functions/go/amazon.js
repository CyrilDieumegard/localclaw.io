import { amazonSearchUrl, normalizeAmazonQuery } from "../_lib/amazon-links.mjs";

export async function onRequestGet(context) {
  const requestUrl = new URL(context.request.url);
  const query = normalizeAmazonQuery(requestUrl.searchParams.get("q"));
  if (!query) {
    return new Response("A valid Amazon search is required.", {
      status: 400,
      headers: responseHeaders("text/plain; charset=utf-8")
    });
  }

  const country = context.request.cf?.country || context.request.headers.get("CF-IPCountry") || "";
  const destination = amazonSearchUrl(query, country);
  if (!destination) {
    return new Response("Amazon search is unavailable.", {
      status: 400,
      headers: responseHeaders("text/plain; charset=utf-8")
    });
  }

  return new Response(null, {
    status: 302,
    headers: {
      ...responseHeaders(),
      Location: destination
    }
  });
}

function responseHeaders(contentType = "") {
  return {
    "Cache-Control": "no-store, max-age=0",
    "Cloudflare-CDN-Cache-Control": "no-store",
    ...(contentType ? { "Content-Type": contentType } : {}),
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow, noarchive"
  };
}
