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

---

# Homepage mascot removal and sponsor-rail gap QA

- Source visual truth: browser annotation on `https://localclaw.io/?v=8440e02-final` identifying the hero mascot as irrelevant in that location, plus the request that the sponsor-to-navigation gap remain unchanged during scrolling.
- Before screenshot: `/Users/redsun/Documents/Codex/2026-08-22/realtime-voice-chat/outputs/64-local-preview-light-crab-machines-v3.png`.
- Browser implementation: `/Users/redsun/Documents/Codex/2026-08-22/realtime-voice-chat/outputs/72-local-no-mascot-preview.png`.
- Full-view comparison: `/Users/redsun/Documents/Codex/2026-08-22/realtime-voice-chat/outputs/73-mascot-removal-before-after.png`.
- Sponsor geometry evidence: `/Users/redsun/Documents/Codex/2026-08-22/realtime-voice-chat/outputs/70-local-no-mascot-fixed-gap-top.png` and `/Users/redsun/Documents/Codex/2026-08-22/realtime-voice-chat/outputs/71-local-no-mascot-fixed-gap-scrolled.png`.
- Viewports and density: hero comparison 1436 × 846 CSS viewport, captured at 1344 × 792 due in-app browser chrome, device scale factor 1. Sponsor geometry was measured at a 1499 px content width so both rails were visible.
- State: Light theme, homepage. Sponsor slots remained unchanged; only their sticky offset changed.

**Findings**

- No actionable P0/P1/P2 issue remains.
- Fonts and typography: unchanged; removing the mascot does not alter title, description, guide-link or fact-card wrapping.
- Spacing and layout rhythm: the irrelevant hero illustration and its preload are removed. The editorial copy and facts retain the two-column hierarchy, while the workspace moves up to the natural height of the fact grid. The sponsor rails measure a 48.00 px gap below the sticky navigation both at `scrollY=0` and after scrolling to `scrollY=474`.
- Colors and tokens: no palette, sponsor surface, border, price or state token changed.
- Image quality and assets: the large mascot is no longer loaded on the homepage. The small official crab logo remains in the navigation and is now the preloaded above-the-fold brand asset.
- Copy and content: no text, catalogue count, compatibility result, sponsor placement, sponsor price or sponsor behavior changed.
- Responsive behavior: rails remain hidden at the existing narrow breakpoint; the homepage has zero horizontal overflow and no mascot markup at desktop or mobile sizes.
- Console: no application error was found during the local browser pass.

**Comparison history**

- Iteration 1: the mascot remained visually disconnected from the index content and the rail used an 82 px sticky offset, reducing its initial gap after scrolling.
- Fix: removed the hero mascot and its preload, then measured the actual desktop layout. The initial rail gap was 48 px, so the sticky rail offset was set to 128 px relative to the 80 px sticky navigation.
- Final browser evidence: `73-mascot-removal-before-after.png` shows the cleaner hero; geometry measurements report `railTop=128`, `navBottom=80`, `gap=48` before and after scroll.

**Primary interactions tested**

- Homepage at top and after a 650 px wheel scroll.
- Wide desktop sponsor-rail breakpoint.
- Navigation sticky state.
- Hero rendering without mascot markup.

final result: passed

---

# Homepage mascot and machine-thumbnail revision preview QA

- Source visual truth: `/var/folders/pk/cjcmrw3532gf0xg3bhqmr6qh0000gn/T/codex-clipboard-54391d04-d33a-4157-ab9f-d6ba2a9ff7f6.png` plus the previously selected Option 2 direction at `/Users/redsun/.codex/generated_images/01a028dc-74e7-7882-9a50-bbc50d12a678/exec-cb63b4a6-7191-4339-9042-08f46a839f5e.png`.
- Browser implementation, Light desktop: `/Users/redsun/Documents/Codex/2026-08-22/realtime-voice-chat/outputs/64-local-preview-light-crab-machines-v3.png`.
- Focused saved-machine evidence: `/Users/redsun/Documents/Codex/2026-08-22/realtime-voice-chat/outputs/60-local-preview-light-machines-v2.png`.
- Responsive evidence: `/Users/redsun/Documents/Codex/2026-08-22/realtime-voice-chat/outputs/61-local-preview-mobile-hero-v2.png` and `/Users/redsun/Documents/Codex/2026-08-22/realtime-voice-chat/outputs/62-local-preview-mobile-machines-v2.png`.
- Normalized full-view comparison: `/Users/redsun/Documents/Codex/2026-08-22/realtime-voice-chat/outputs/65-source-vs-preview-crab-machines-v3.png`.
- Viewport and density: source 2872 × 1692 pixels was normalized to its 1436 × 846 CSS-pixel viewport; browser implementation was captured at 1436 × 846 with device scale factor 1. Mobile was captured at 390 × 844.
- State: local-only fixture with the same two saved Apple Silicon machines, Mac Studio selected, Light theme. The fixture exists only in ignored `.pages-dist` output and is not part of production source.

**Findings**

- No actionable P0/P1/P2 issue remains in the local preview.
- Fonts and typography: unchanged from the approved Option 2 design; no additional wrapping or truncation was introduced.
- Spacing and layout rhythm: the mascot is now in normal document flow, left-aligned beneath the guide link like the selected Option 2 reference instead of floating in the horizontal center. The large diffuse glow was removed, so the section has a clean edge and the mascot shadow cannot be clipped. Workspace and signal-grid alignment remain stable.
- Colors and tokens: LocalClaw coral, cream, ink and dark surfaces are unchanged. No sponsor styling, data or behavior changed.
- Image quality and fidelity: the previous 16:9 product photographs created unrecognizable hard crops. They are replaced in the preview by two dedicated 1024 × 1024 product thumbnails with complete enclosures, visible ports/vents, neutral backgrounds and generous edge breathing room. The thumbnails remain distinct and readable at the actual 70 px rendered card size in both columns.
- Copy and content: no copy, model compatibility, machine metadata, catalogue result or sponsor content changed.
- Responsive behavior: desktop and 390 × 844 mobile have zero horizontal overflow; both cards render and the mobile hero keeps the mascot centered.
- Console: no application error was found in the in-app browser. Static-preview API fallbacks are expected and do not affect the visual target.

**Comparison history**

- Iteration 1: blocked — the live version used aggressively zoomed front crops, making the Mac Studio and Mac mini look like anonymous silver rectangles; the centered mascot and broad glow also drifted from the chosen Option 2 composition.
- Fix: created dedicated square product assets, removed the image zoom, moved the mascot into normal flow, removed the broad radial glow and restored the left alignment from the selected visual direction.
- Iteration 2: P2 — the first local preview centered the mascot, preserving too much of the rejected composition.
- Fix: left-aligned the 190 px mascot beneath the guide link and retained centered positioning only at tablet/mobile breakpoints.
- Final evidence: `65-source-vs-preview-crab-machines-v3.png` shows the corrected desktop composition; `60-local-preview-light-machines-v2.png` shows both complete devices at card scale; mobile captures prove no overflow.

**Primary interactions tested**

- Light/Dark theme rendering.
- Desktop and mobile responsive layout.
- Two saved-machine cards with selected and primary states.
- Cache-keyed local CSS/JavaScript and local-only machine fixture.

final result: passed

---

# Homepage mascot and saved-machine imagery design QA

- Source visual truth: the three browser annotations on `https://localclaw.io/?v=8e226da-final` at a 1234 × 989 CSS viewport, identifying the clipped mascot glow and the unreadable Mac Studio / Mac mini thumbnails. The pre-fix production capture is `/Users/redsun/Documents/Codex/2026-08-22/realtime-voice-chat/outputs/51-production-light-desktop-8e226da.png`.
- Browser-rendered implementation, Light desktop: `/Users/redsun/Documents/Codex/2026-08-22/realtime-voice-chat/outputs/52-local-light-desktop-machine-visuals.png`.
- Browser-rendered implementation, Light mobile: `/Users/redsun/Documents/Codex/2026-08-22/realtime-voice-chat/outputs/53-local-light-mobile-machine-visuals.png`.
- Browser-rendered implementation, Dark desktop: `/Users/redsun/Documents/Codex/2026-08-22/realtime-voice-chat/outputs/54-local-dark-desktop-machine-visuals.png`.
- Full-view before/after comparison: `/Users/redsun/Documents/Codex/2026-08-22/realtime-voice-chat/outputs/55-before-after-machine-visuals.png`.
- Viewports and density: desktop 1234 × 989 CSS px and mobile 390 × 844 CSS px at device scale factor 1. Chrome's content capture measured 1223 × 980 and 379 × 835 pixels after browser chrome; no density conversion was applied. The older production reference was normalized into a 1234 × 989 comparison cell without changing its aspect ratio.
- State: authenticated-machine fixture kept strictly inside the ignored `.pages-dist` local build; two saved Apple Silicon machines, Mac Studio selected, Light and Dark themes.

**Findings**

- No actionable P0/P1/P2 difference remains.
- Fonts and typography: no type token or copy changed; hierarchy, wrapping and compact metadata remain consistent with the selected Option 2 design.
- Spacing and layout rhythm: the mascot now sits at 42% of the hero column, below the guide link, with balanced visual space on both sides. Its hero container allows visible overflow, so the drop shadow is no longer clipped. Machine visuals grow from 52 to 72 px on desktop and 60 px on mobile while preserving the two-card grid and zero horizontal overflow.
- Colors and visual tokens: LocalClaw coral, cream, ink and dark tokens are unchanged. The machine-image well uses the existing warm neutral product-image background in both themes so the silver hardware stays legible.
- Image quality and asset fidelity: the cards now use the existing canonical Mac Studio and Mac mini product images rather than the dark 16:9 hero photos. A centered crop and 1.42 scale expose the enclosure, ports and vent geometry at thumbnail size, making the two machines visibly distinct. No generated placeholder, CSS drawing, emoji or substitute icon was introduced.
- Copy and content: machine names, hardware metadata, selected state, family counts and all sponsor copy are unchanged.
- Console: no LocalClaw application error was found. Logged errors came only from unrelated browser extensions; localhost API 404s for sponsor placement and community ratings are expected in the static QA server and did not affect the tested imagery.

**Comparison history**

- Iteration 1: blocked — moving to the light product photos improved contrast, but the device bodies remained too small inside a 64 px contain-fitted well.
- Fix: increased the visual well to 72 px, changed the Mac images to a centered cover crop at 1.42 scale, and added a 60 px mobile override.
- Iteration 2 evidence: `52-local-light-desktop-machine-visuals.png` shows both front faces and their distinguishing port/vent arrangements; `54-local-dark-desktop-machine-visuals.png` shows the same clarity in Dark. The crab shadow remains visible around the complete opaque asset in both themes.

**Primary interactions tested**

- Responsive Light rendering at the annotated desktop viewport.
- Responsive Light rendering at 390 × 844 with zero horizontal overflow.
- Light-to-Dark theme change and closed-menu Dark rendering.
- Two fixture-backed saved-machine cards, selected and primary states.

final result: passed

---

# Option 2 light/dark redesign design QA

- Selected visual target: `/Users/redsun/.codex/generated_images/01a028dc-74e7-7882-9a50-bbc50d12a678/exec-cb63b4a6-7191-4339-9042-08f46a839f5e.png`.
- Browser implementation, light: `/Users/redsun/Documents/Codex/2026-08-22/realtime-voice-chat/outputs/36-option2-light-readable-1482x1054.png`.
- Browser implementation, dark: `/Users/redsun/Documents/Codex/2026-08-22/realtime-voice-chat/outputs/37-option2-dark-readable-1482x1054.png`.
- Same-state side-by-side comparison: `/Users/redsun/Documents/Codex/2026-08-22/realtime-voice-chat/outputs/38-option2-reference-vs-build.png` (selected target left, browser build right).
- Exact mobile captures: `/Users/redsun/Documents/Codex/2026-08-22/realtime-voice-chat/outputs/48-option2-mobile-light-390x844.png` and `/Users/redsun/Documents/Codex/2026-08-22/realtime-voice-chat/outputs/49-option2-mobile-dark-390x844.png`.
- Cross-page contact sheet: `/Users/redsun/Documents/Codex/2026-08-22/realtime-voice-chat/outputs/43-theme-route-contact-sheet.png` (LLM, Image, Software, Pricing, Blog and Account; Light then Dark for each pair).
- Reference pixels: 1487 × 1058. Browser comparison pixels: 1482 × 1054. The four-pixel scaling difference was normalized only in the QA contact image; the implementation capture itself was not stretched during review.

**Visual findings**

- No actionable P0/P1/P2 difference remains.
- The floating rounded navigation, two-part Light/Dark control, left editorial hero, two-by-two signal grid, three-card sponsor rails and machine workspace match the selected direction.
- The official LocalClaw coral, ink, cream, white and green-primary tokens remain intact. Unsloth influenced spacing and hierarchy only; no Unsloth color or brand asset was copied.
- The official crab is opaque, isolated below the hero copy and never sits behind the heading or description. The saved-machine cards retain the real Mac and generic custom-PC assets with visible internal breathing room.
- Sponsor rails use warm cream/coral surfaces and high-contrast ink in Light; Dark uses raised charcoal surfaces with brighter copy. Prices, labels and campaign copy were not changed.
- Dense labels initially measured 7–10 px and were visibly weak in both themes. The final pass raises catalogue notes, controls, machine metadata, sponsor copy and table text to a 10–13 px floor while preserving the compact editorial character.
- LLM, Voice and multimodal filters use the same full-width search row followed by aligned two-column controls. Browser geometry confirms equal 44 px control heights and matching row baselines.

**Responsive and interaction evidence**

- Desktop Light/Dark: no horizontal overflow; theme-color, active toggle and page class update together.
- Mobile 390 × 844: no horizontal overflow; the navigation menu exposes labeled Light/Dark choices; the crab remains below the copy; facts stack cleanly.
- Saved machines: three fixture-backed real cards render on mobile; selecting Mac mini changes `aria-checked`, RAM to 16 GB unified, LLM availability to Green fits only, Voice to Apple-tagged, multimodal platform/accelerator to macOS/Apple Silicon, disables split VRAM, and updates all seven family counts immediately.
- Catalogue escape hatch: Show full catalogues restores 218 LLM, 66 Voice, 5 Image and 23 Video records while preserving the selected machine.
- Compare flow: two LLMs select, tray reaches 2/3, modal opens and the close control is visible in Light and Dark.
- Sponsor flow: an empty rail position opens the audience/offer dialog; its content and close control are readable in Light and Dark; selection context remains in the CTA.
- Software: next advances the real carousel from 1/14 Dashboard overview to 2/14 Guided installation and synchronizes the active tab and image.
- Route matrix: LLM, Voice, Image, representative model details, Computers, RAM/GPU, Pricing, New, Software, Blog and Account all switch between coherent Light/Dark surfaces with zero layout overflow.

**Iteration history**

- Iteration 1: the selected layout matched structurally, but sponsor and catalogue metadata remained too small and Dark sponsor rails were too muted.
- Fix: raised the typography floor, strengthened Dark muted colors, and used raised sponsor surfaces without altering sponsor data or behavior.
- Iteration 2: full-view reference/build comparison, exact mobile captures and route contact sheet show the corrected hierarchy and contrast. No further visual defect was found.
- Final code review: restored semantic Light states for featured runtime choices, warning chips and machine-fit panels; guaranteed Light markup before JavaScript; added the missing 1.0.191 changelog navigation/theme; synchronized active guide navigation; and returned focus to the mobile menu button after Escape.
- Final browser retest: semantic states remain distinct in Light and Dark, the changelog is coherent in both themes, use-case guides keep LLM active, and Escape closes the mobile menu with focus restored.

final result: passed
