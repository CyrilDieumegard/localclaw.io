const AMAZON_US_TAG = "localclaw-20";

const MARKETPLACE_BY_COUNTRY = Object.freeze({
  US: "www.amazon.com",
  CA: "www.amazon.ca",
  MX: "www.amazon.com.mx",
  BR: "www.amazon.com.br",
  GB: "www.amazon.co.uk",
  IE: "www.amazon.co.uk",
  DE: "www.amazon.de",
  AT: "www.amazon.de",
  CH: "www.amazon.de",
  BE: "www.amazon.de",
  LU: "www.amazon.de",
  FR: "www.amazon.fr",
  MC: "www.amazon.fr",
  IT: "www.amazon.it",
  SM: "www.amazon.it",
  ES: "www.amazon.es",
  PT: "www.amazon.es",
  AD: "www.amazon.es",
  NL: "www.amazon.nl",
  SE: "www.amazon.se",
  PL: "www.amazon.pl",
  AU: "www.amazon.com.au",
  NZ: "www.amazon.com.au",
  JP: "www.amazon.co.jp",
  IN: "www.amazon.in",
  SG: "www.amazon.sg",
  AE: "www.amazon.ae",
  SA: "www.amazon.sa",
  TR: "www.amazon.com.tr"
});

export function normalizeAmazonQuery(value) {
  const query = String(value || "").trim().replace(/\s+/g, " ");
  if (query.length < 2 || query.length > 140 || /[\u0000-\u001f\u007f]/.test(query)) return "";
  return query;
}

export function amazonMarketplace(country) {
  return MARKETPLACE_BY_COUNTRY[String(country || "").trim().toUpperCase()] || "www.amazon.com";
}

export function amazonSearchUrl(queryValue, country) {
  const query = normalizeAmazonQuery(queryValue);
  if (!query) return "";
  const marketplace = amazonMarketplace(country);
  const target = new URL(`https://${marketplace}/s`);
  target.searchParams.set("k", query);
  if (marketplace === "www.amazon.com") target.searchParams.set("tag", AMAZON_US_TAG);
  return target.href;
}
