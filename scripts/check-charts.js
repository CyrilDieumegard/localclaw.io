const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'charts.html'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'css/charts-20260827h.css'), 'utf8');
const js = fs.readFileSync(path.join(ROOT, 'js/charts-20260827c.js'), 'utf8');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'charts-data.json'), 'utf8'));
const errors = [];

function requireText(haystack, needle, message) {
  if (!haystack.includes(needle)) errors.push(message);
}

requireText(html, '<title>Open-Weight AI Adoption Statistics &amp; Charts | LocalClaw</title>', 'Missing exact SEO title');
requireText(html, '<link rel="canonical" href="https://localclaw.io/charts">', 'Missing canonical /charts URL');
requireText(html, 'data-nav-key="charts" aria-current="page"', 'Charts navigation is not active');
requireText(html, 'https://localclaw.io/charts-data.json', 'Machine-readable dataset is not linked');
requireText(html, 'Downloads show activity inside one ecosystem.', 'Methodology boundary is missing');
requireText(html, 'Vercel token shares reflect production traffic routed through AI Gateway', 'Vercel production-traffic boundary is missing');
requireText(html, 'Open-weight means the model weights are downloadable.', 'Open-weight definition is missing');
requireText(html, 'data-chart-freshness', 'Daily-series freshness indicator is missing');
requireText(html, 'Report snapshots', 'Historical reports must be distinguished from daily data');
requireText(js, "getAttribute('data-charts-snapshot')", 'Analytics snapshot must follow the actual dataset');
if (js.includes("snapshot: '2026-08-27'")) errors.push('Analytics snapshot is frozen');
requireText(html, 'https://vercel.com/ai-gateway/leaderboards/models', 'Primary Vercel source is missing');
requireText(html, '/css/charts-20260827h.css', 'Versioned charts stylesheet is not embedded');
requireText(html, '/js/charts-20260827c.js', 'Current charts interaction script is not embedded');
requireText(html, 'data-adoption-tooltip', 'Instant adoption tooltip markup is missing');
requireText(html, 'data-tooltip-delta', 'Tooltip day-over-day detail is missing');
requireText(html, 'data-donut-chart', 'Interactive donut chart markup is missing');
requireText(html, 'data-donut-segment="2"', 'Interactive donut segments are incomplete');
requireText(html, 'data-detail-title="United States"', 'Country detail interaction is missing');
requireText(html, 'data-detail-title="GGUF"', 'Format detail interaction is missing');
requireText(js, "track('charts_page_loaded'", 'Charts page-load tracking is missing');
requireText(js, "track('chart_view'", 'Chart view tracking is missing');
requireText(js, "plot.addEventListener('pointermove'", 'Instant pointer tooltip interaction is missing');
requireText(js, "track('chart_detail_view'", 'Chart detail tracking is missing');
requireText(js, 'function setupChartDetailTooltips()', 'Interactive bar and split details are missing');
requireText(js, 'function setupDonutChart()', 'Interactive donut behavior is missing');
requireText(css, '@media (max-width: 720px)', 'Mobile chart layout is missing');
requireText(css, '@media (prefers-reduced-motion: reduce)', 'Reduced-motion treatment is missing');
requireText(css, '--charts-accent: #ff453a', 'Theme-switch red-orange accent is missing');
requireText(css, '.charts-adoption-tooltip', 'Tooltip styling is missing');
requireText(css, '.charts-bar-row strong { position: absolute; top: 50%; left: 14px;', 'Chart values are not inset from the bar edge');
requireText(css, '.charts-detail-tooltip', 'Interactive chart detail styling is missing');
requireText(css, '#adoption, #geography, #practical, #methodology { scroll-margin-top: 100px; }', 'Chart anchors must clear the fixed navigation');

const adoption = data.charts && data.charts[0];
if (!adoption || adoption.id !== 'open-weight-token-share-over-time') {
  errors.push('Vercel adoption chart is not chart number one');
} else {
  if (!Array.isArray(adoption.series) || adoption.series.length !== 90) errors.push('Vercel adoption series must contain 90 daily values');
  const series = adoption.series || [];
  const latest = series.at(-1);
  const peak = series.reduce((best, row) => row.openWeights > best.openWeights ? row : best, series[0]);
  if (adoption.dateRange?.from !== series[0]?.date || adoption.dateRange?.to !== latest?.date) errors.push('Date range does not match observations');
  if (adoption.latest?.date !== latest?.date || adoption.latest?.openWeights !== Number(latest?.openWeights.toFixed(1)) || adoption.latest?.closedWeights !== Number(latest?.closedWeights.toFixed(1))) errors.push('Latest summary does not match observations');
  if (adoption.peak?.date !== peak?.date || adoption.peak?.openWeights !== Number(peak?.openWeights.toFixed(1))) errors.push('Peak summary does not match observations');
  if (adoption.source?.seriesSha256 !== require('crypto').createHash('sha256').update(JSON.stringify(series)).digest('hex')) errors.push('Series provenance hash does not match');
  if (!Number.isFinite(Date.parse(adoption.source?.retrievedAt)) || adoption.source.retrievedAt.slice(0, 10) > data.dateModified) errors.push('Invalid retrieval date');
  if (latest?.date >= adoption.source?.retrievedAt.slice(0, 10)) errors.push('Snapshot includes an unfinished UTC day');
  if (adoption.freshness?.cadence !== 'daily' || adoption.freshness?.maxAgeDays !== 3 || adoption.freshness?.excludesCurrentUtcDay !== true) errors.push('Daily refresh policy missing');
  requireText(html, `Open weights carry ${latest?.openWeights.toFixed(1)}% of Vercel tokens`, 'Headline does not match dataset');
  requireText(html, `<strong>${peak?.openWeights.toFixed(1)}%</strong> peak`, 'Peak does not match dataset');
  if (adoption.source?.license !== 'CC BY 4.0') errors.push('Vercel open-data license is missing');
}

const renderedAdoptionDays = (html.match(/class="charts-adoption-day"/g) || []).length;
if (renderedAdoptionDays !== 90) errors.push(`Expected 90 rendered adoption bars, found ${renderedAdoptionDays}`);
if (/class="charts-adoption-day"[^>]*\stitle=/.test(html)) errors.push('Native delayed title tooltips must not remain on adoption bars');
const detailedAdoptionDays = (html.match(/class="charts-adoption-day"[^>]*data-date="[^"]+"[^>]*data-open="[^"]+"[^>]*data-closed="[^"]+"/g) || []).length;
if (detailedAdoptionDays !== 90) errors.push(`Expected 90 detailed adoption bars, found ${detailedAdoptionDays}`);

const expected = new Map([
  ['notable-models-by-country', [['United States', 59], ['China', 35]]],
  ['open-model-downloads-by-origin', [['China', 41], ['Rest of world', 59]]],
  ['downloads-by-parameter-count', [['Under 1B', 83], ['1B to 100B', 16], ['Above 100B', 1]]],
  ['repository-growth-by-format', [['GGUF', 464], ['MLX', 148], ['Hub overall', 21.5], ['Transformers / PEFT', 16]]]
]);

for (const chart of data.charts || []) {
  const rows = expected.get(chart.id);
  if (!rows) continue;
  const actual = chart.values.map(item => [item.label, item.value]);
  if (JSON.stringify(actual) !== JSON.stringify(rows)) errors.push(`Unexpected values for ${chart.id}`);
  expected.delete(chart.id);
}
for (const missing of expected.keys()) errors.push(`Missing chart data: ${missing}`);

for (const marker of ['59', '35', '41%', '83%', '+464%', '+148%', '151,448', '3.3%']) {
  requireText(html, marker, `Rendered chart marker missing: ${marker}`);
}

if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dateModified) || !Number.isFinite(Date.parse(data.dateModified))) errors.push('Invalid charts snapshot date');
requireText(html, `data-charts-snapshot="${data.dateModified}"`, 'HTML snapshot date does not match dataset');
for (const chart of data.charts.slice(1)) {
  if (chart.freshness?.cadence !== 'report' || !chart.period) errors.push(`Missing historical period: ${chart.id}`);
}
if (errors.length) {
  console.error(`Charts validation failed with ${errors.length} issue(s):\n${errors.map(item => `- ${item}`).join('\n')}`);
  process.exit(1);
}
console.log('Charts validation passed: 5 sourced charts, 90-day adoption series, 2 evidence callouts and methodology boundaries verified.');
