const AMAZON_US_TAG = "localclaw-20";
const AMAZON_US_HOST = "www.amazon.com";

export function normalizeAmazonQuery(value) {
  const query = String(value || "").trim().replace(/\s+/g, " ");
  if (query.length < 2 || query.length > 140 || /[\u0000-\u001f\u007f]/.test(query)) return "";
  return query;
}

export function amazonSearchUrl(queryValue) {
  const query = normalizeAmazonQuery(queryValue);
  if (!query) return "";
  // Amazon OneLink/Global Earning localizes full US Associate links and
  // carries attribution into enabled international marketplaces.
  const target = new URL(`https://${AMAZON_US_HOST}/s`);
  target.searchParams.set("k", query);
  target.searchParams.set("tag", AMAZON_US_TAG);
  return target.href;
}
