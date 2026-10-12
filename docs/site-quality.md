# Website quality maintenance

Keep the existing black/red identity. Prioritize machine → recommendation → requirements → setup. Secondary promotions follow the primary content. This pass adds no product feature or catalogue record.

## Active sources

- Homepage: `js/home-index-20260814g.js` owns the hero and quick form. `js/conversion-paths-20260827a.js` binds that form once; it must not rewrite or relocate it. Homepage polish lives in `css/home-index-20260814g.css`.
- Recommender: the active entry point is `js/app-20260816a.js`. `js/app.js` is a legacy source with a different flow; do not overwrite either blindly. Content-truth checks protect the shared Fresh-card content.
- LLM and Voice: page-specific data/cards remain in their HTML. `js/catalogue-ui.js` and `css/catalogue-ui.css` own mobile filter visibility, background inertness, focus return and shared controls.
- Model pages: edit `scripts/generate-model-pages.js` and `css/model-page.css`, then regenerate. The fit verdict precedes installation options. Keep the catalogue summary/source boundaries.
- Navigation: edit `scripts/site-navigation.js`, `js/site-nav.js` and `css/site-nav.css`; run `npm run nav:sync` after generators.
- Release copy: `downloads/localclaw-installer-latest.json` supplies marked version labels via `npm run app-release:sync`. The build and output checks enforce agreement.
- Freshness: `js/new-model-sort-20260814a.js` is the shared UTC release parser. NEW means an exact release date within the last 30 calendar days; month-only dates do not receive an invented day or age badge.
- Atlas: period labels use the selected dataset's observed date range. Historical aliases must retain a verified permanent redirect to a current canonical record. Never manufacture fresh aggregates or modify historical counts to pass a check.

## Release checks

Run the existing test suite, navigation/URLs/SEO/content-truth checks, home-index and home-SEO checks, conversion/plans/account checks, Atlas checks, and `pages:build` then `pages:check`. Bump cache keys of edited public assets and their generator references. Check the built output, not just source HTML.

In the rendered website test desktop, 390px and 320px layouts; dark/light; empty search and recovery; filter keyboard focus and Escape; comparison horizontal scrolling; hardware → result → detail context; menus and period selection. Keep screenshots and timing evidence outside the public build. Byte counts and HTTP timings are not Core Web Vitals.
