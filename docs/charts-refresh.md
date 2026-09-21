# Charts refresh

`charts-data.json` is the source of truth for the daily adoption series. The HTML, chart bars, tooltips, accessible table, headline, peak and JSON-LD are generated together. Browser analytics reads the snapshot date from the rendered page.

## Routine

The Codex heartbeat **Actualiser LocalClaw Charts** (`actualiser-localclaw-charts`) checks daily at 09:00 Europe/Zurich in the existing Charts task. It requires the local Codex host to be available; this is not a server-side Cloudflare cron. Review comparable Stanford/Hugging Face report updates on Mondays. The automation is managed in Codex, not by editing its local configuration files.

Use a clean checkout of current `origin/main`. Preserve unrelated work. Install dependencies with `npm ci` in a fresh clone.

```sh
npm run charts:refresh
npm run charts:check
npm run sitemap:generate
npm run nav:check
npm run seo:check
npm run pages:build
npm run pages:check
```

Inspect the diff. If no source values changed, the refresh is a no-op: do not update retrieval dates or publish an empty commit. If data changed, commit/push only the scoped changes (including sitemap outputs), deploy the validated `.pages-dist` to Cloudflare Pages project `localclaw-io`, and verify byte parity on `https://localclaw.io/charts` and `https://localclaw.io/charts-data.json`. Check both ordinary and cache-busted URLs; a successful deployment alone is not production proof. Do not overwrite a newer remote commit or deploy an obsolete build.

## Data contract and failure handling

- Primary source: https://vercel.com/ai-gateway/leaderboards/models, licensed CC BY 4.0. Attribution and transformation notes are visible on Charts.
- The public page's embedded JSON contains the publisher's open/closed **token** aggregate. Decode JSON strings only; never execute page scripts. The documented per-model export does not expose this aggregate. Do not infer it from a partial leaderboard or classify models by name.
- Retain full published precision in JSON; round only visible percentages. Store retrieval time, source URL and SHA-256 of the selected series.
- Keep exactly 90 consecutive observed UTC days, excluding the current incomplete UTC day. Require finite shares in [0,100], a sum of 100 within 0.001, no duplicate/missing dates and a latest observation at most three days old. Reject rollback, but accept publisher corrections to past observations.
- A fetch, schema, validation or rendering failure stops before writing public files. Preserve the last good release, investigate the official source, and report the failure. Never interpolate, fabricate or simply relabel an old date.
- A changed publisher payload may require a reviewed parser update. The page visibly warns when the latest observation is more than three days old, including when returning to an already-open tab.
- Build checks are intentionally offline and deterministic; data-age validation happens during retrieval and in the rendered freshness indicator, so an unavailable publisher does not prevent unrelated safe site builds.

## Research reports

The other four charts and two evidence callouts are separately dated report snapshots, not live daily counters. A weekly review is not a promise that new comparable research exists. Preserve original figures/periods until an official replacement supports the same metric. Never mix downloads, unique users, global market share, repository growth and token share.

For a justified report update, change the JSON, visible text/values/periods, citations, structured data and corresponding report assertions in `scripts/check-charts.js` together. Then run `npm run charts:generate` and the validation/release sequence above. Tests cover the source parser, invalid/stale data, non-mutating failures, no-op refreshes, historical-data preservation, generator idempotency and browser freshness warnings.
