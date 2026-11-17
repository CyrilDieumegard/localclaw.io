# Amazon buying flow

Current behavior, 17 November 2026. The account's Global Earning screen was verified with all ten supported stores active; the family tracking IDs remain unchanged.

- A primary `/go/amazon?q=…&family=…` link makes one uncached redirect. A valid explicit `market` wins, then the remembered `localclaw_amazon_store` cookie, then Cloudflare's visitor country. Unknown/unenrolled countries retain tagged US OneLink.
- A fresh exact offer in that marketplace takes precedence over search. ASINs never cross marketplace, memory, SSD or condition boundaries. Automatic buying links do not substitute refurbished stock. Historical `listing=FR` hints no longer force US or German shoppers to France.
- For Switzerland only, a fresh French exact offer may replace German search when delivery to Switzerland was explicitly checked. A manual store choice always wins.
- `options=1` shows optional store choices. Each store link opens Amazon immediately and remembers the choice for six months. Automatic selection clears it. The primary flow never requires this chooser or JavaScript.
- `context=1` returns the same server selection to the browser. It updates button labels and DataFast properties without changing navigation. If the request fails, shopping continues and telemetry records an unknown match instead of inventing an exact listing or destination.
- DataFast accepts at most ten custom properties, including attributes already present in markup. The shared helper removes obsolete machine/brand attributes before the SDK reads the event.
- DataFast owns the aggregate `amazon_click`. Family events are complementary series, not additional aggregate clicks. Context requests and structured `amazon_redirect` logs are diagnostics, not people or conversions.
- HEAD, prefetch and identifiable preview/crawler requests return 204 without forwarding to Amazon. This does not identify all automated traffic.

## Maintain exact offers

Run `npm run amazon:offers`. Freshness expires after 30 days and the route falls back to a tagged search. Check the selected variant in the original marketplace before updating `checked`. Record seller, condition, memory/VRAM, storage and delivery in `functions/_lib/amazon-offers.mjs`. Never extend a date based on HTTP 200 alone.

On 17 November, five French configurations were checked with delivery to Switzerland and two US Mac mini M6 variants were checked without AppleCare. US delivery to Switzerland was not offered; domestic stock was not independently confirmed. The old Beelink GTR9 Pro ASIN redirected to a SER8 32GB/1TB and was disabled. The ASUS GX10 2TB was unavailable and was disabled. Other historical offers retain their old dates and search fallback.

Before publication: run `amazon:check`, computers/recommendation/DIY/content-truth checks, URL/navigation/SEO checks, Pages build/output checks and browser interaction QA. Keep unrelated generated catalogue changes out of a scoped affiliation release. Publish `.pages-dist` only to `localclaw-io`, check the current production source first, and verify public bytes and response destinations after deployment. Do not make a self-affiliate test purchase.
