# Amazon affiliation routing fix — 17 September 2026

The September 12–16 DataFast report recorded six outbound events, three with attribution=none (selected markets IE twice, BR once). The US tracking IDs all exist in Amazon Associates; the DE reporting view returned an explicit data error, so its zeros were not treated as valid totals.

## Change

Only the ten markets already enrolled in the account are selectable. Visitors from unsupported countries (AU, JP, IN, BR, MX, BE, IE, SG) fall back to Amazon.com with the registered family tag instead of an untagged local destination. Existing URLs requesting unsupported markets also resolve to a supported store. The page names the actual store and asks international visitors to check delivery and import costs. It does not promise local availability or commission acceptance.

The alternate automatic-matching link now reports market=US, matching its outbound URL; selected_market preserves the selection. destination_host and tag record the actual outbound link for both aggregate and family events. Amazon may subsequently redirect automatic matching; the reported destination is the URL handed to Amazon.

Exact product references remain store-specific. Unsupported-market fallback discards any supplied offer rather than copying an ASIN into another marketplace. Existing enrolled-country routing and the explicit second-click buying-options page are retained.

## Validation

- Amazon placement checks pass: 18 RAM/GPU, 30 computers, 20 hardware guides, 26 DIY searches, 11 Apple preorder links.
- Eight routing tests pass, including all eight unsupported countries across all three families and analytics destination/selection separation.
- Pages build and output checks pass; public homepage, computers page, catalogue JS and site CSS matched the current deployment baseline.
- Base: production source 4068cb64. Production predecessor: cf4ea35f-394e-4a45-a16a-0f6ba835ba1e.

Passing a tag is not proof of a commission. Historical unattributed clicks cannot be repaired retroactively. Amazon's reporting error is external to this patch.
