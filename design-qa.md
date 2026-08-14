# Homepage score and sponsor-rail design QA

- Source visual truth: `/var/folders/pk/cjcmrw3532gf0xg3bhqmr6qh0000gn/T/codex-clipboard-dd8c717a-17c1-4eb2-81fa-868b7f37d267.png` (the user's 1906 × 280 px stats-strip capture, plus the requested score, hierarchy and six-slot changes)
- Implementation screenshots: `/private/tmp/localclaw-score-qa/home-score-desktop-final.png`, `/private/tmp/localclaw-score-qa/home-score-speech.png`, `/private/tmp/localclaw-score-qa/home-score-mobile.png`
- Combined comparison evidence: `/private/tmp/localclaw-score-qa/comparison-full-final.jpg` and `/private/tmp/localclaw-score-qa/comparison-facts-final.jpg` (source above, implementation below)
- Viewports: desktop 1900 × 1060 CSS px and mobile 390 × 844 CSS px, device scale factor 1
- Captured pixels: desktop 1889 × 1054, mobile 379 × 820; the browser surface trims its own edge chrome. The focused facts comparison normalizes both images to 1900 × 291 before vertical stacking.
- State: dark theme, default overall-score sort, no filters; desktop speech section also captured at its default overall-score sort.
- Full-view evidence: desktop capture includes the official header, mascot, three-column layout, all six placeholder slots, emphasized facts and the ranked LLM table. The source is a focused crop rather than a full-page mock, so full-page assessment uses the retained LocalClaw codebase layout and brand system as the unchanged design constraint.
- Focused evidence: the normalized facts comparison verifies the requested hierarchy change; the speech capture verifies score pills, quality/speed signals, real logos and two-column density.

**Findings**

- No actionable P0/P1/P2 differences remain.
- Fonts and typography: Space Grotesk and JetBrains Mono remain consistent with the authentic LocalClaw header and directory. The values `215`, `75` and `Aug 2026` now use 29/29/23 px display sizing with tabular numerals, while labels remain compact and readable.
- Spacing and layout rhythm: the validated 180 / 920 / 180 desktop grid is preserved. Each rail now stacks three equal 164 px slots with 12 px gaps; all six are visible at 1900 px without squeezing the directory. Facts remain a clean three-card row on desktop and all three stay visible in a single mobile column.
- Colors and tokens: black, off-white and LocalClaw coral are unchanged. Score pills use a restrained coral border/fill; freshness receives the accent without turning every metric into a competing highlight.
- Image quality and asset fidelity: the official mascot and existing LocalClaw/upstream model-logo registry are reused. Browser inspection reports 271 score-bearing model rows, zero broken images and no invented monograms, emoji or code-drawn model marks.
- Copy and content: every score is explicitly described as a LocalClaw repository composite, not an external benchmark. LLM weighting matches the existing directory formula (38% quality, 24% coding, 24% reasoning, 14% speed); speech weighting matches the existing Audio score (68% quality, 32% speed).
- States and interactions: LLM overall, quality, coding, reasoning, speed, date, RAM, name and catalogue sorts are available. Coding sort was verified descending; `gemma` search returned 15 matching rows. Speech type filtering returned eight ASR records and speed sort was verified descending. Empty states are implemented for both directories.
- Responsive and accessibility: zero horizontal overflow at 1900 and 390 px; score remains visible on mobile; sponsor rails hide below the desktop rail breakpoint; all six controls measure 44 px high; labels, focus treatment, semantic tables, link destinations and score explanations remain available.

**Comparison history**

- Iteration 1: blocked — the first browser pass found all requested content and no overflow, but interactive search/select controls measured 42 px high, below the practical mobile tap target used for this QA.
- Fix: increased `.lc-index-control` minimum height to 44 px without changing the compact directory proportions.
- Iteration 2: passed — final desktop evidence shows six visible placeholders, 215 ranked LLM rows, 56 ranked speech rows, 271 visible score pills and zero broken images; mobile evidence shows all three emphasized facts, the score column, one-column speech layout and zero overflow.

**Residual test gap**

- The in-app browser surface did not expose a direct console-message export. JavaScript syntax checks, resource checks, complete rendering and all tested filter/sort interactions found no application error.

final result: passed
