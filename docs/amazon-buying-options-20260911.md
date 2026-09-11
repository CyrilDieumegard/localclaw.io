# Amazon buying options — 11 September 2026

## Delivered behavior

All 28 computer cards, 20 existing Mac guides, 18 RAM/GPU buttons, 26 DIY parts and the buyer-path widget open `/go/amazon` with a family. The 11 Apple preorder destinations are preserved. The page is server-rendered and works without JavaScript. It selects a store from Cloudflare country metadata, offers manual override, labels unverified search results, and displays memory/storage/condition only for inspected listings. No ASIN is copied across markets. Verification expires after 30 days, then the route falls back to a clearly labelled search.

Exact listings inspected in the browser:

- US `B0DTPPBN95`: Mac mini M4 16GB / 256GB SSD, **Renewed**. Delivery to Switzerland unavailable. https://www.amazon.com/dp/B0DTPPBN95
- DE `B0DLBWRZS5`: Mac mini M4 Pro 12 CPU / 16 GPU, 24GB / 512GB SSD, standard new offer sold/dispatched by Amazon; delivery to Switzerland offered at inspection. https://www.amazon.de/dp/B0DLBWRZS5

Rejected as an exact 16GB destination: DE `B0DLBT83QJ`, because the visible selected configuration resolves to Pro 24GB / 512GB. US `B0DLBVHSLD` has the right Pro 24GB / 512GB title but no seller offer for the selected delivery location, so it is not labelled as a verified new offer. No verified 48GB / 512GB listing was found. Other configurations remain explicit searches, not invented matches. Stock and future delivery are not guaranteed.

## Measurement

Created in the existing Amazon Associates account, with success confirmations and persisted list:

| Family | Tracking ID | DataFast outbound goal |
|---|---|---|
| Computers + hardware guides | localclaw-computers-20 | amazon_computers_click |
| GPU + RAM + component buyer recommendations | localclaw-gpuram-20 | amazon_gpuram_click |
| DIY parts | localclaw-diy-20 | amazon_diy_click |

`amazon_offer_open` measures the entry from a card/guide. `amazon_click` measures an actual outbound choice; the family goals are separate series. Do not add the aggregate and family counts together. Properties: family, market, country, source, product, match (exact/search/automatic), attribution. Historical `amazon_click` series before this deployment measured direct redirects; interpret the change accordingly. Ad blockers and consent/browser behavior can limit captured events. No server request is counted as a human click.

Amazon states new tracking IDs can take up to 24 hours to become enabled for OneLink. For non-US visitors the old `localclaw-20` is used until 12 September 2026 07:00 UTC; DataFast still distinguishes families during that window. US visitors to the US store use new IDs immediately. Unknown visitor country gets the conservative fallback. No retrospective assignment of old orders to new IDs is possible.

Global Earning account UI verified US + CA/GB/DE/FR/IT/ES/NL/PL/SE on 11 September. Local store links carry the single account tag only within that scope; other markets use untagged local shopping links. The alternate full US link preserves Amazon automatic matching. **Direct local-link commission attribution, new-ID international activation and future orders are not yet proven by a qualifying purchase/report.** Do not call a retained `tag` parameter proof of commission. Compare Amazon country + tracking-ID reports after real traffic. Automatic matching can substitute another configuration; its button explicitly says this.

## Validation

`npm run amazon:check` includes variant/country isolation, expiry, allowlists, activation windows, invalid inputs/XSS escaping, no-cache responses and family event behavior. Run catalog/content/SEO/navigation, DIY and Pages checks before deployment. Browser checks cover desktop and 390px mobile, country change, renewed labels and search fallback. No test purchase was made.

## Follow-up link audit — 11 September 2026

135 live resolver checks passed: 92 core placements, 25 buyer-path placements (7 distinct URLs), and all 18 manual marketplace choices. The CSV records HTTP and resolver markup checks, not stock or commission validation. Source family checks and the routing/analytics tests also passed.

Confirmed defect: opening the exact US B0DTPPBN95 URL with localclaw-20 from Switzerland redirected to a German search containing unrelated PCs. Amazon itself exposed a return-to-original URL with creatorsDisableRedirect=true. Reopening with that parameter stayed on amazon.com and showed M4 / 16GB / 256GB / Renewed. Explicit store destinations now include this parameter; the separate automatic matching link does not. Regression coverage checks all 18 stores and exact-ASIN preservation.

DE B0DLBWRZS5 again displayed selected M4 Pro / 24GB / 512GB, in stock, Amazon as shipper/seller, with delivery to Switzerland. US B0DTPPBN95 again displayed Renewed and could not ship to the selected Swiss address. These checks are not universal delivery guarantees. The German standard buybox does not explicitly expose an item-condition label in the inspected accessibility view; New is based on the standard Amazon offer, not a renewed offer.

Amazon's observed automatic US-to-DE redirect retained localclaw-20, supporting the Global Store tag format; this still does not prove commission attribution for direct regional links or newly created family IDs. No test order was placed. All other configurations remain explicitly labelled unverified searches.
