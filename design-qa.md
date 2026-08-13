# Homepage model-logo design QA

- Source visual truth: `/private/tmp/localclaw-compact-header-final.png` (the previously approved compact homepage)
- Implementation screenshots: `/private/tmp/localclaw-logo-directory-top-final.png`, `/private/tmp/localclaw-logo-directory-final.png`
- Viewport: desktop 1280 × 720 CSS px and mobile 390 × 844 CSS px, device scale factor 1
- State: homepage default catalogue order, dark theme; speech section additionally inspected at entries 49–58
- Comparison: the existing header, three information cards, controls, table geometry, typography, coral tokens and background remain visually unchanged. The earlier monogram cells are replaced by consistent 32 × 32 px local image assets.
- Focused evidence: desktop LLM table, desktop bottom speech grid and mobile LLM table were captured because image fidelity and dense row alignment are the changed surfaces.

**Findings**

- No actionable P0/P1/P2 differences remain.
- Typography: unchanged from the approved compact homepage; model labels and metadata retain their previous hierarchy and truncation.
- Spacing/layout rhythm: the 32 px logo cells preserve row height and table alignment; the 58-entry speech grid remains two columns on desktop and one column on mobile.
- Colors/tokens: the LocalClaw black/coral system is unchanged. A uniform off-white logo tile gives dark brand marks sufficient contrast without adding a competing accent color.
- Image quality: 273 real local assets resolve through 93 unique files. Dedicated brand marks are preferred; official upstream organization avatars are used where a model-specific logo is unavailable. No monogram, emoji or code-drawn placeholder remains.
- Copy/content: the speech section now truthfully renders all 56 local-capable repository records instead of describing an 18-entry sample. Edge TTS (Internet-required) and OCTAVE 2 (API-only in the current record) remain available on their historical routes but are excluded from the homepage's local-only index.
- Responsive/accessibility: no horizontal overflow at 1280 or 390 px; visual logos are decorative because the adjacent model/developer text already provides the accessible name.

**Comparison history**

- Iteration 1: blocked — lazy-loaded below-fold images were initially counted as broken, and ten families still used the neutral upstream mark.
- Fix: verified asset URLs independently, retained lazy loading, added official Hugging Face/GitHub project avatars, and reused Kyutai for Moshi.
- Iteration 2: blocked — the visual logo gate passed, but a semantic audit found that two of the 58 speech records did not satisfy the homepage's local-only promise.
- Fix: excluded Edge TTS and OCTAVE 2 from the homepage export while preserving their existing catalogue routes.
- Iteration 3: passed — automated coverage reports 215 LLM entries, 75 LLM families, 56 local speech entries and 51 speech families; browser reports 271 logo images, all mapped to family or upstream-project identities, zero broken loaded images and no overflow.

**Follow-up polish**

- P3: none required for this release.

final result: passed
