# Amazon direct-entry correction — 21 September 2026

The 11 September buying-options release replaced automatic Amazon redirects with a required second click. The 17 September attribution patch retained that extra step. This release restores a one-click primary path; it does not establish that friction explains the whole observed decline.

## Behavior

- Default `/go/amazon?q=…&family=…` returns an uncached 302 to the US Amazon search with the account-validated family tag. The full configuration query is preserved. No country-specific ASIN is reused, and OneLink localization is allowed on this automatic route.
- An explicit `options=1` opens the existing detailed store chooser. Its form preserves that parameter. Explicit store links retain `creatorsDisableRedirect=true`; their international commission attribution is still not independently established.
- Primary buttons read “View on Amazon.” A secondary “Choose Amazon store” link is added alongside static and dynamic buttons. Primary routing also works without JavaScript.
- The homepage recommender now uses the same resolver and computers/GPU family tags. Active and source app bundles agree.
- The DataFast SDK owns the aggregate `amazon_click`; one delegated listener emits the separate family series. These series must not be added together. Direct exits include `route=direct` and `attribution=onelink`. Links open in a new tab so the source page remains alive during telemetry submission. The optional chooser remains `amazon_offer_open`.
- Generators and the static validator cover the new behavior, including the previously omitted homepage.

## Validation before deployment

- 11 routing/analytics tests pass, including a 39-case country/family matrix, input rejection, no-cache headers, retained chooser behavior and no duplicate aggregate emission by the family listener.
- Static link inventory: 18 RAM/GPU, 30 computers, 20 hardware guide and 26 DIY routes; 11 Apple preorder links remain unchanged.
- DIY, computers, recommendation and content-truth checks pass.
- Pages build and output checks pass, with private files excluded.
- Local Cloudflare Pages runtime confirms a 302 with the expected family-tagged Location. Browser confirms dynamic computer buttons, secondary store selection and the France form submission. DIY layout checked at 390px without horizontal overflow.

## Measurement boundary

The definition of the primary `amazon_click` changes again at deployment: it now means a click that immediately leaves for Amazon. Compare full days after release and inspect Amazon's reports for all IDs and stores. Browser telemetry, HTTP redirects and Amazon's counted clicks are different measurements. Old peaks may not return; attribution and commercial impact require subsequent provider data. Do not label browser QA clicks as customer demand.

Official OneLink reference: https://affiliate-program.amazon.com/help/node/topic/GYZCNZQ26AKTSM2B
