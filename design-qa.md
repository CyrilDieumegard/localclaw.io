# Sponsor audience-proof modal design QA

- Source visual truth:
  - `/Users/redsun/.codex/visualizations/2026/08/15/01a004b3-85ad-7f51-a479-96c4377377e7/sponsor-audit/02-trustmrr-advertise-modal.png` — TrustMRR's advertise-modal disclosure pattern and purchase hierarchy.
  - `/Users/redsun/.codex/visualizations/2026/08/15/01a004b3-85ad-7f51-a479-96c4377377e7/sponsor-audit/03-localclaw-current.png` — the existing LocalClaw homepage, rails, typography and brand tokens.
- Browser-rendered implementation screenshots:
  - `/Users/redsun/.codex/visualizations/2026/08/15/01a004b3-85ad-7f51-a479-96c4377377e7/sponsor-modal-implementation/desktop-final-v2.png`
  - `/Users/redsun/.codex/visualizations/2026/08/15/01a004b3-85ad-7f51-a479-96c4377377e7/sponsor-modal-implementation/mobile-final.png`
- Combined full-view comparison: `/Users/redsun/.codex/visualizations/2026/08/15/01a004b3-85ad-7f51-a479-96c4377377e7/sponsor-modal-implementation/full-comparison.png` (unchanged LocalClaw page at left, modal-open implementation at right).
- Viewports: desktop 2048 × 988 CSS px; mobile 390 × 844 CSS px. The approved browser surface trims 11 px of chrome on each axis, yielding 2037 × 927 and 379 × 820 captured pixels. Device scale factor is 1; no density conversion was needed.
- Source pixels: TrustMRR 2276 × 1098; LocalClaw baseline 2037 × 927. Implementation pixels: desktop 2037 × 927; mobile 379 × 820. The same LocalClaw desktop pixel dimensions were used for the direct before/after comparison. TrustMRR is a hierarchy reference rather than a pixel-identical clone target.
- State: dark theme, homepage, left-rail position 02 selected, audience-proof dialog open. Mobile uses the responsive inline Sponsor CTA and the same dialog state.
- Full-view comparison evidence: the existing header, three-column content grid, mascot, rankings and sponsor rails remain unchanged behind a native modal backdrop. The modal follows the TrustMRR sequence—proof, offer, selection and checkout—while using LocalClaw's black, off-white, coral, squared-card and mono-label system.
- Focused region evidence: the full-resolution desktop and mobile captures keep the metric cards, source/date note, $29 price, seven-day term, selected position and CTA text readable without enlarging or cropping. A separate crop was not needed. The mobile capture specifically proves the price and purchase CTA are visible before the lower benefit details.

**Findings**

- No actionable P0/P1/P2 differences remain.
- Fonts and typography: the existing Space Grotesk and JetBrains Mono stack is retained. Display figures use tabular numerals and strong weight; compact labels and the disclosure text have enough size, line height and contrast to remain readable. No unwanted truncation or wrapping was found.
- Spacing and layout rhythm: the desktop dialog is centered without changing the underlying homepage grid. Metric, benefit and checkout regions follow a consistent 12–16 px rhythm. On mobile the metrics become a two-column summary and checkout moves before benefit details, keeping the decision and CTA above the fold. There is no horizontal overflow at either viewport.
- Colors and visual tokens: LocalClaw black, off-white, muted gray and coral are reused. Coral is reserved for the price, selected state and primary action; the backdrop separates the decision layer without obscuring context. Text contrast was increased in the final pass.
- Image quality and asset fidelity: no new illustration, logo, decorative mark or substitute asset was required. The implementation preserves the official LocalClaw mascot and existing page assets; it does not introduce emoji, placeholder imagery, handcrafted SVGs or CSS-drawn icons.
- Copy and content: the dialog names the product (`$29`, `7 days`, selected homepage position), reports `3,430` site visitors and `308` desktop homepage visitors for `17 Jul–15 Aug 2026`, cites DataFast, and says that visibility or clicks are not guaranteed. Exact inventory is checked before Stripe, so the user knows what is purchased without slowing the initial click.
- Interaction and funnel: clicking an empty rail slot opens the disclosure dialog before authentication; the selected placement and weekly plan are preserved in the checkout URL. The existing active-sponsor click remains a normal outbound click. Close button, Cancel, backdrop dismissal and Escape are supported. The terms link remains available.
- Auth continuation: the sponsorship intent survives Google sign-in. The account preview route was verified to open the campaign form automatically with `home-left-2` and `week` preselected and focus on the campaign-name field.
- Responsive funnel: below the rail breakpoint an inline Sponsor CTA replaces the hidden desktop rail entry. At 390 × 844, the modal opens without overflow and the $29 CTA is visible in the initial viewport.
- Console: checked in a fresh browser tab. No LocalClaw application error remained. Browser-extension warnings and DataFast's expected localhost-disabled notice were the only messages.

**Comparison history**

- Iteration 1: blocked — mobile placed the purchase decision after all benefit copy, pushing the CTA below the initial viewport; the disclaimer was also too low contrast.
- Fix: reordered mobile regions so metrics and checkout precede benefits, changed the metric grid to two columns, and increased disclosure text size and contrast.
- Iteration 2 evidence: `mobile-final.png` shows the $29 / seven-day CTA fully visible at 390 × 844 with no horizontal overflow; `desktop-final-v2.png` shows the corrected disclosure hierarchy at full desktop size.
- Iteration 2 diagnostic: an accumulated browser log exposed a possible `showModal()` call against an already-open dialog state.
- Fix: added a defensive close-before-show guard and repeated the flow in a fresh tab.
- Final evidence: the modal reopens from the selected slot, the CTA keeps `placement=home-left-2&plan=week`, and the fresh browser console has no application error.

**Primary interactions tested**

- Empty left-rail slot → audience-proof modal.
- Selected position reflected in modal and checkout URL.
- Modal close, Cancel, backdrop and Escape behavior.
- `$29 — Start my 7-day sponsorship` CTA destination.
- Sign-in intent preservation and campaign-form auto-open.
- Mobile inline CTA, above-the-fold checkout and zero overflow.

**Open questions / residual test gap**

- [P3] A static local server cannot execute the Cloudflare placement-availability function. The local modal therefore uses the truthful fallback `Exact dates · checked before Stripe`; deployed Pages can hydrate the exact open date when the function responds. This does not block understanding or checkout.

**Implementation checklist**

- [x] Preserve the existing sponsor click behavior.
- [x] Add a pre-auth proof-and-offer dialog for empty inventory.
- [x] Preserve placement and weekly plan through authentication.
- [x] Keep the purchase decision visible on mobile.
- [x] Add freshness, truthfulness and regression checks.
- [x] Verify desktop, mobile, interactions and console.

final result: passed
